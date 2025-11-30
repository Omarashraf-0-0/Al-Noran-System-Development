import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import AvatarImg from "../assets/images/AVATAR.png";

const AVATAR_URL = AvatarImg;

const ChatInterface = () => {
	const [chats, setChats] = useState([]);
	const [selectedChat, setSelectedChat] = useState(null);
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const navigate = useNavigate();

	const user = JSON.parse(localStorage.getItem("user"));
	const token = localStorage.getItem("token");
	const userType = user?.type;

	useEffect(() => {
		if (!token || !user) {
			toast.error("الرجاء تسجيل الدخول");
			navigate("/login");
			return;
		}

		initializeChat();
	}, [token, user, navigate]);

	const initializeChat = async () => {
		try {
			setLoading(true);

			if (userType === "client") {
				// For clients, get or create their chat
				const response = await axios.post(
					`${import.meta.env.VITE_API_URL}/api/chat`,
					{},
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				if (response.data.success) {
					const chat = response.data.chat;
					setChats([chat]);
					setSelectedChat(chat);
					await loadMessages(chat._id);
				}
			} else if (userType === "employee") {
				// For employees, get all chats
				await loadChats();
			}
		} catch (error) {
			console.error("Error initializing chat:", error);
			toast.error(error.response?.data?.message || "فشل في تحميل المحادثات");
		} finally {
			setLoading(false);
		}
	};

	const loadChats = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/chat`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				const fetchedChats = response.data.chats;
				setChats(fetchedChats);

				if (fetchedChats.length > 0 && !selectedChat) {
					setSelectedChat(fetchedChats[0]);
					await loadMessages(fetchedChats[0]._id);
				}
			}
		} catch (error) {
			console.error("Error loading chats:", error);
			toast.error("فشل في تحميل المحادثات");
		}
	};

	const loadMessages = async (chatId) => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/chat/${chatId}/messages`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setMessages(response.data.messages);
			}
		} catch (error) {
			console.error("Error loading messages:", error);
			toast.error("فشل في تحميل الرسائل");
		}
	};

	const handleSelectChat = async (chat) => {
		setSelectedChat(chat);
		await loadMessages(chat._id);
	};

	const handleSendMessage = async (newMessageText) => {
		if (newMessageText.trim() === "" || !selectedChat) return;

		try {
			setSending(true);

			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/chat/${selectedChat._id}/messages`,
				{ text: newMessageText },
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setMessages((prevMessages) => [...prevMessages, response.data.message]);

				// Update chat's lastMessageAt in the list
				setChats((prevChats) =>
					prevChats.map((chat) =>
						chat._id === selectedChat._id
							? { ...chat, lastMessageAt: new Date() }
							: chat
					)
				);
			}
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error(error.response?.data?.message || "فشل في إرسال الرسالة");
		} finally {
			setSending(false);
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
		};
	});

	// Format messages for ChatWindow component
	const formattedMessages = messages.map((msg) => ({
		id: msg._id,
		senderId: msg.senderId._id,
		senderName: msg.senderId.fullname || msg.senderId.username,
		text: msg.text,
		timestamp: new Date(msg.createdAt).toLocaleTimeString("ar-EG", {
			hour: "2-digit",
			minute: "2-digit",
		}),
		isOwn: msg.senderId._id === user._id,
	}));

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
						currentUserId={user._id}
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
