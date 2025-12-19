import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import AvatarImg from "../assets/images/AVATAR.png";
import chatService from "../services/chatService";

const AVATAR_URL = AvatarImg;

const ChatInterface = ({ preselectedChatId }) => {
	const [chats, setChats] = useState([]);
	const [selectedChat, setSelectedChat] = useState(null);
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [typingUsers, setTypingUsers] = useState({});
	const navigate = useNavigate();
	const socketInitialized = useRef(false);
	const initialLoadDone = useRef(false);
	const mountedRef = useRef(false);
	const selectedChatRef = useRef(null); // Track currently selected chat

	// Parse user and token once
	const user = useRef(JSON.parse(localStorage.getItem("user") || "null")).current;
	const token = useRef(localStorage.getItem("token")).current;
	const userType = user?.type;
	const userId = user?._id || user?.id; // Support both _id and id fields

	// Check authentication
	useEffect(() => {
		if (!user || !token) {
			console.error("No user or token found, redirecting to login");
			navigate("/login");
			return;
		}
		console.log("User authenticated:", { 
			type: userType, 
			id: userId,
			name: user.fullname,
			userKeys: Object.keys(user)
		});
	}, []);

	// Update ref whenever selectedChat changes
	useEffect(() => {
		selectedChatRef.current = selectedChat;
	}, [selectedChat]);

	// Initialize WebSocket connection
	useEffect(() => {
		if (!token || !user || socketInitialized.current || mountedRef.current) return;
		mountedRef.current = true;

		try {
			chatService.connect(userId, userType, token);
			socketInitialized.current = true;
		} catch (error) {
			console.error("Failed to initialize WebSocket:", error);
			// Continue without WebSocket - app will still work with HTTP polling
		}

		// Listen for new messages
		chatService.onNewMessage((data) => {
			// Socket sends { chatId, message } structure
			const chatId = data.chatId;
			const message = data.message || data; // Support both formats
			
			console.log("New message received:", {
				messageId: message._id,
				messageChatId: chatId,
				selectedChatId: selectedChatRef.current?._id,
				willAdd: selectedChatRef.current && chatId === selectedChatRef.current._id
			});

			// Only add message to messages array if it belongs to currently selected chat
			setMessages((prev) => {
				// Check if message belongs to the selected chat
				if (selectedChatRef.current && chatId === selectedChatRef.current._id) {
					// Avoid duplicates - check by _id if exists
					if (message._id && prev.find((m) => m._id === message._id)) {
						return prev;
					}
					console.log("Adding message to display");
					return [...prev, message];
				}
				// If not for selected chat, don't add to messages
				console.log("Message not for selected chat - skipping");
				return prev;
			});

			// Update last message in chat list (for all chats)
			setChats((prev) =>
				prev.map((chat) =>
					chat._id === chatId
						? { ...chat, lastMessageAt: message.createdAt }
						: chat
				)
			);
		});

		// Listen for typing indicators
		chatService.onTyping(({ chatId, userType: typingUserType, isTyping }) => {
			setTypingUsers((prev) => ({
				...prev,
				[typingUserType]: isTyping,
			}));
		});

		// Listen for agent assignment (clients)
		chatService.onAgentAssigned(({ chatId, employeeId, employeeName }) => {
			toast.success(`تم تعيين ${employeeName || "موظف"} للمحادثة`);
			
			setChats((prev) =>
				prev.map((chat) =>
					chat._id === chatId
						? { ...chat, employeeId, status: "active" }
						: chat
				)
			);
		});

		// Listen for new chat assignments (employees)
		chatService.onNewChatAssigned((chat) => {
			toast.success("تم تعيين محادثة جديدة لك");
			setChats((prev) => [chat, ...prev]);
		});

		// Listen for chat resolved
		chatService.onChatResolved(({ chatId }) => {
			setChats((prev) =>
				prev.map((chat) =>
					chat._id === chatId ? { ...chat, status: "resolved" } : chat
				)
			);
			toast.success("تم إغلاق المحادثة");
		});

		// Listen for no agents available
		chatService.onNoAgentsAvailable(() => {
			toast.error("لا يوجد موظفون متاحون حالياً. سنتواصل معك قريباً.");
		});

		// Cleanup is intentionally empty - socket stays connected
		return () => {};
	}, []); // Empty dependency array - only run once

	useEffect(() => {
		if (!token || !user) {
			toast.error("الرجاء تسجيل الدخول");
			navigate("/login");
			return;
		}

		if (!initialLoadDone.current) {
			initializeChat();
			initialLoadDone.current = true;
		}
	}, []); // Empty dependency array - only run once

	// Auto-select chat if preselectedChatId is provided
	useEffect(() => {
		if (preselectedChatId && chats.length > 0 && !selectedChat) {
			const chatToSelect = chats.find(c => c._id === preselectedChatId);
			if (chatToSelect) {
				handleSelectChat(chatToSelect);
			}
		}
	}, [preselectedChatId, chats, selectedChat]);

	const initializeChat = async () => {
		try {
			setLoading(true);

			const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";

			console.log("Initializing chat for user:", { userType, userId: user?._id });

			// Both clients and employees now just load their chats
			await loadChats();
			
		} catch (error) {
			console.error("Error initializing chat:", error);
			console.error("Error details:", {
				message: error.message,
				responseData: error.response?.data,
				responseMessage: error.response?.data?.message,
				status: error.response?.status,
				userType: userType,
				userId: user?._id,
				token: token ? "present" : "missing",
			});
			
			// Show user-friendly error message
			if (error.response?.status === 403) {
				console.warn("403 Forbidden - User may not have permission or token is invalid");
				// Don't show error toast for 403 - it's expected for employees on POST endpoint
			} else if (error.response?.status === 401) {
				toast.error("جلسة منتهية، يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else if (userType === "client") {
				toast.error("فشل في تحميل المحادثات");
			}
		} finally {
			setLoading(false);
		}
	};

	const loadChats = async () => {
		try {
			const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";
			const response = await axios.get(
				`${apiUrl}/api/chat`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				const fetchedChats = response.data.chats;
				setChats(fetchedChats);

				if (fetchedChats.length > 0 && !selectedChat) {
					const firstChat = fetchedChats[0];
					setSelectedChat(firstChat);
					await loadMessages(firstChat._id);
					
					// Join chat room via WebSocket
					chatService.joinChat(firstChat._id, userId);
				}
			}
		} catch (error) {
			console.error("Error loading chats:", error);
			// Don't show error toast - might just be no chats yet
		}
	};

	const loadMessages = async (chatId) => {
		try {
			const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";
			const response = await axios.get(
				`${apiUrl}/api/chat/${chatId}/messages`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setMessages(response.data.messages);
			}
		} catch (error) {
			console.error("Error loading messages:", error);
			// Don't show error toast - user will see empty chat
		}
	};

	const handleSelectChat = async (chat) => {
		setSelectedChat(chat);
		await loadMessages(chat._id);
		
		// Join chat room via WebSocket
		chatService.joinChat(chat._id, userId);
	};

	const handleSendMessage = async (newMessageText) => {
		if (newMessageText.trim() === "" || !selectedChat) return;

		try {
			setSending(true);

			console.log("Sending message:", {
				chatId: selectedChat._id,
				senderId: userId,
				senderType: userType,
				textLength: newMessageText.length,
			});

			// Send via WebSocket for real-time delivery
			await chatService.sendMessage(
				selectedChat._id,
				newMessageText
			);

			// Message will be added via socket listener
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error(error.message || "فشل في إرسال الرسالة");
		} finally {
			setSending(false);
		}
	};

	const handleTyping = (isTyping) => {
		if (selectedChat) {
			chatService.sendTyping(selectedChat._id, isTyping);
		}
	};

	// Format chats for ChatList component
	const formattedChats = chats.map((chat) => {
		const otherUser =
			userType === "client"
				? chat.employeeId || { fullname: "في انتظار الرد", username: "support" }
				: chat.clientId;

		return {
			id: chat._id,
			name: otherUser.fullname || otherUser.username || "مستخدم",
			shipmentNumber: chat.shipmentId?.acid || "عام",
			avatarUrl: AVATAR_URL,
			isOnline: chat.status === "active",
			status: chat.status,
			lastMessageAt: chat.lastMessageAt,
			employeeId: chat.employeeId?._id || chat.employeeId, // For filtering assigned/unassigned
		};
	});

	// Format messages for ChatWindow component
	const formattedMessages = messages.map((msg, index) => {
		// Handle both populated senderId object and plain string ID
		const senderId = typeof msg.senderId === 'object' 
			? (msg.senderId?._id || msg.senderId?.id) 
			: msg.senderId;
		const senderName = typeof msg.senderId === 'object'
			? (msg.senderId?.fullname || msg.senderId?.username || 'مستخدم')
			: 'مستخدم';
		
		const isOwn = senderId ? String(senderId) === String(userId) : false;
		console.log("Message ownership check:", {
			messageSenderId: senderId,
			currentUserId: userId,
			isOwn: isOwn,
		});
		return {
			id: msg._id || `temp-${index}-${Date.now()}`, // Fallback key for messages without _id
			senderId: senderId,
			senderName: senderName,
			text: msg.text,
			timestamp: new Date(msg.createdAt).toLocaleTimeString("ar-EG", {
				hour: "2-digit",
				minute: "2-digit",
			}),
			isOwn: isOwn,
		};
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center h-96">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
			</div>
		);
	}

	if (userType === "client" && !selectedChat) {
		return (
			<div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
				<div className="text-center">
					<p className="text-gray-600 mb-4">لا توجد محادثة نشطة</p>
					<button
						onClick={initializeChat}
						className="px-6 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800"
					>
						بدء محادثة جديدة
					</button>
				</div>
			</div>
		);
	}

	const currentChatUser = selectedChat
		? formattedChats.find((c) => c.id === selectedChat._id)
		: null;

	// Determine if other user is typing
	const isOtherUserTyping =
		userType === "client"
			? typingUsers["employee"]
			: typingUsers["client"];

	return (
		<div className="flex flex-col md:flex-row h-[75vh] max-h-[800px] bg-white rounded-lg overflow-hidden shadow-lg shadow-gray-300/50 border border-gray-200">
			{userType === "employee" && (
				<div className="w-full md:w-1/3 lg:w-1/4 bg-gray-50 md:border-l md:border-gray-200">
					<ChatList
						users={formattedChats}
						selectedUser={currentChatUser}
						onSelectUser={(formattedChat) => {
							const actualChat = chats.find((c) => c._id === formattedChat.id);
							handleSelectChat(actualChat);
						}}
					/>
				</div>
			)}
			<div
				className={`flex-1 flex flex-col ${
					userType === "client" ? "w-full" : ""
				}`}
			>
				{selectedChat && currentChatUser ? (
					<ChatWindow
					user={currentChatUser}
					messages={formattedMessages}
					onSendMessage={handleSendMessage}
					sending={sending}
					currentUserId={userId}
					onTyping={handleTyping}
					isOtherUserTyping={isOtherUserTyping}
				/>
				) : (
					<div className="flex items-center justify-center h-full">
						<p className="text-gray-500">اختر محادثة لعرض الرسائل</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatInterface;
