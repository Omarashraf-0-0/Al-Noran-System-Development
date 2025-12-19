import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import chatService from "../services/chatService";
import SendImg from "../assets/images/send.png";
import AVATAR from "../assets/images/AVATAR.png";

const ShipmentChat = ({ shipmentId, shipment }) => {
	const [chat, setChat] = useState(null);
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [loading, setLoading] = useState(true);
	const [isTyping, setIsTyping] = useState(false);
	const [expanded, setExpanded] = useState(false);

	const messagesEndRef = useRef(null);
	const messagesContainerRef = useRef(null);
	const typingTimeoutRef = useRef(null);
	const mountedRef = useRef(false);

	const user = useRef(JSON.parse(localStorage.getItem("user") || "null")).current;
	const token = useRef(localStorage.getItem("token")).current;

	const scrollToBottom = () => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop =
				messagesContainerRef.current.scrollHeight;
		}
	};

	useEffect(() => {
		if (mountedRef.current) return;
		mountedRef.current = true;

		const initializeChat = async () => {
			try {
				setLoading(true);

				// Get or create chat for this shipment
				const response = await axios.post(
					`${import.meta.env.VITE_API_URL}/api/chat`,
					{ shipmentId },
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				console.log("Chat initialized:", response.data);
				setChat(response.data.chat);

				// Fetch messages
				const messagesResponse = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/chat/${response.data.chat._id}/messages`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				setMessages(messagesResponse.data.messages);

				// Connect socket and join chat room
				const userId = user._id || user.id;
				const userType = user.type;
				await chatService.connect(userId, userType, token);
				chatService.joinChat(response.data.chat._id, userId);

				// Listen for new messages
				chatService.onNewMessage((message) => {
					if (message.chatId === response.data.chat._id) {
						setMessages((prev) => [...prev, message]);
					}
				});

				// Listen for typing
				chatService.onTyping((data) => {
					if (data.chatId === response.data.chat._id && data.userId !== user._id) {
						setIsTyping(data.isTyping);
					}
				});

				setLoading(false);
			} catch (error) {
				console.error("Error initializing chat:", error);
				if (error.response?.status !== 400) {
					toast.error(error.response?.data?.message || "فشل تحميل المحادثة");
				}
				setLoading(false);
			}
		};

		if (shipmentId && shipment?.employee_id) {
			initializeChat();
		} else {
			setLoading(false);
		}
	}, [shipmentId, shipment?.employee_id]);

	useEffect(scrollToBottom, [messages]);

	const handleSendMessage = async (e) => {
		e.preventDefault();

		if (!newMessage.trim() || sending || !chat) return;

		const messageText = newMessage.trim();
		setNewMessage("");
		setSending(true);

		try {
			await chatService.sendMessage(chat._id, messageText);
			// Message will be added via socket event
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error("فشل إرسال الرسالة");
			setNewMessage(messageText); // Restore message
		} finally {
			setSending(false);
		}
	};

	const handleTyping = (isTyping) => {
		if (chat) {
			chatService.sendTyping(chat._id, isTyping);
		}
	};

	const handleInputChange = (e) => {
		setNewMessage(e.target.value);

		// Emit typing indicator
		handleTyping(true);

		// Clear previous timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		// Stop typing after 3 seconds of inactivity
		typingTimeoutRef.current = setTimeout(() => {
			handleTyping(false);
		}, 3000);
	};

	if (!shipment?.employee_id) {
		return (
			<div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6 text-center">
				<p className="text-yellow-800">
					⏳ لم يتم تعيين موظف لهذه الشحنة بعد. سيتم تفعيل المحادثة بمجرد التعيين.
				</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="bg-white rounded-xl shadow-lg p-6">
				<div className="flex justify-center items-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900"></div>
					<span className="mr-3 text-gray-600">جاري تحميل المحادثة...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl shadow-lg overflow-hidden">
			{/* Chat Header */}
			<div
				className="bg-gradient-to-r from-red-900 to-red-700 p-4 cursor-pointer"
				onClick={() => setExpanded(!expanded)}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<img src={AVATAR} alt="Agent" className="w-10 h-10 rounded-full" />
						<div className="text-white">
							<h3 className="font-bold">
								{chat?.employeeId?.fullname || chat?.employeeId?.username || "موظفك"}
							</h3>
							<p className="text-xs text-red-100">
								{isTyping ? "يكتب..." : "متاح للمساعدة"}
							</p>
						</div>
					</div>
					<button className="text-white">
						<svg
							className={`w-6 h-6 transition-transform ${expanded ? "rotate-180" : ""}`}
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Chat Body */}
			{expanded && (
				<>
					{/* Messages */}
					<div
						ref={messagesContainerRef}
						className="p-4 h-96 overflow-y-auto bg-gray-50"
					>
						{messages.length === 0 ? (
							<div className="flex items-center justify-center h-full">
								<p className="text-gray-400">ابدأ المحادثة مع موظفك</p>
							</div>
						) : (
							<div className="flex flex-col gap-4">
								{messages.map((msg) => {
									const currentUserId = user._id || user.id;
									const messageSenderId = msg.senderId?._id || msg.senderId?.id || msg.senderId;
									const isOwnMessage = String(messageSenderId) === String(currentUserId);
									
									return (
										<div
											key={msg._id}
											className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} w-full`}
										>
											<div
												className={`flex items-end gap-2 max-w-[70%] ${
													isOwnMessage ? "flex-row-reverse" : "flex-row"
												}`}
											>
												<img
													src={AVATAR}
													alt="Avatar"
													className="w-8 h-8 rounded-full flex-shrink-0"
												/>
												<div
													className={`px-4 py-3 rounded-2xl ${
														isOwnMessage
															? "bg-red-600 text-white rounded-br-none"
															: "bg-gray-200 text-gray-800 rounded-bl-none"
													}`}
												>
													<p className="text-sm break-words">{msg.text}</p>
													<span
														className={`text-xs mt-1 block ${
															isOwnMessage
																? "text-red-100"
																: "text-gray-500"
														}`}
													>
														{new Date(msg.createdAt).toLocaleTimeString("ar-EG", {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</span>
												</div>
											</div>
										</div>
									);
								})}
								{isTyping && (
									<div className="flex items-center gap-2 text-gray-500 text-sm">
										<div className="flex gap-1">
											<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
											<span
												className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
												style={{ animationDelay: "0.2s" }}
											></span>
											<span
												className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
												style={{ animationDelay: "0.4s" }}
											></span>
										</div>
										<span>يكتب...</span>
									</div>
								)}
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Message Input */}
					<div className="p-4 bg-white border-t border-gray-200">
						<form onSubmit={handleSendMessage} className="flex items-center gap-3">
							<input
								type="text"
								value={newMessage}
								onChange={handleInputChange}
								placeholder="اكتب رسالتك..."
								className="flex-1 bg-gray-100 text-gray-900 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
								disabled={sending}
							/>
							<button
								type="submit"
								className="p-3 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
								disabled={!newMessage.trim() || sending}
							>
								{sending ? (
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
								) : (
									<img src={SendImg} alt="Send" className="w-6 h-6" />
								)}
							</button>
						</form>
					</div>
				</>
			)}
		</div>
	);
};

export default ShipmentChat;
