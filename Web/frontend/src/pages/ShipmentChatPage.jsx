import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import chatService from "../services/chatService";
import SendImg from "../assets/images/send.png";
import AVATAR from "../assets/images/AVATAR.png";

const ShipmentChatPage = () => {
	const { shipmentId } = useParams();
	const navigate = useNavigate();

	const [chat, setChat] = useState(null);
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [loading, setLoading] = useState(true);
	const [isTyping, setIsTyping] = useState(false);
	const [shipment, setShipment] = useState(null);

	const messagesEndRef = useRef(null);
	const messagesContainerRef = useRef(null);
	const typingTimeoutRef = useRef(null);
	const mountedRef = useRef(false);

	const user = useRef(
		JSON.parse(localStorage.getItem("user") || "null")
	).current;
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

				// Fetch shipment details
				const shipmentResponse = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				setShipment(shipmentResponse.data);

				if (!shipmentResponse.data.employee_id) {
					setLoading(false);
					return;
				}

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
					`${import.meta.env.VITE_API_URL}/api/chat/${
						response.data.chat._id
					}/messages`,
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
				chatService.onNewMessage((data) => {
					// data is { chatId, message }
					if (data.chatId === response.data.chat._id && data.message) {
						setMessages((prev) => [...prev, data.message]);
					}
				});

				// Listen for typing
				chatService.onTyping((data) => {
					if (
						data.chatId === response.data.chat._id &&
						data.userId !== user._id
					) {
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

		if (shipmentId) {
			initializeChat();
		}
	}, [shipmentId]);

	useEffect(scrollToBottom, [messages]);

	const handleSendMessage = async (e) => {
		e.preventDefault();

		if (!newMessage.trim() || sending || !chat) return;

		const messageText = newMessage.trim();
		setNewMessage("");
		setSending(true);

		try {
			await chatService.sendMessage(chat._id, messageText);
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error("فشل إرسال الرسالة");
			setNewMessage(messageText);
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

		handleTyping(true);

		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		typingTimeoutRef.current = setTimeout(() => {
			handleTyping(false);
		}, 3000);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="flex items-center gap-3">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900"></div>
					<span className="text-gray-600">جاري تحميل المحادثة...</span>
				</div>
			</div>
		);
	}

	if (!shipment?.employee_id) {
		return (
			<div className="min-h-screen bg-gray-50 p-6">
				<div className="max-w-4xl mx-auto">
					<button
						onClick={() => navigate(-1)}
						className="mb-6 flex items-center gap-2 text-red-900 hover:text-red-700"
					>
						<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
								clipRule="evenodd"
							/>
						</svg>
						عودة
					</button>
					<div className="bg-yellow-50 border border-yellow-300 rounded-xl p-8 text-center">
						<p className="text-yellow-800 text-lg">
							⏳ لم يتم تعيين موظف لهذه الشحنة بعد. سيتم تفعيل المحادثة بمجرد
							التعيين.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto p-6">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<button
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-red-900 hover:text-red-700"
					>
						<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
								clipRule="evenodd"
							/>
						</svg>
						عودة
					</button>
					<div className="text-right">
						<h1 className="text-2xl font-bold text-gray-900">محادثة الشحنة</h1>
						<p className="text-sm text-gray-600">
							رقم الشحنة: {shipment?.acid || shipmentId}
						</p>
					</div>
				</div>

				{/* Chat Container */}
				<div className="bg-white rounded-xl shadow-lg overflow-hidden">
					{/* Chat Header */}
					<div className="bg-gradient-to-r from-red-900 to-red-700 p-4">
						<div className="flex items-center gap-3">
							<img
								src={AVATAR}
								alt="Agent"
								className="w-12 h-12 rounded-full"
							/>
							<div className="text-white">
								<h3 className="font-bold text-lg">
									{chat?.employeeId?.fullname ||
										chat?.employeeId?.username ||
										"موظفك"}
								</h3>
								<p className="text-sm text-red-100">
									{isTyping ? "يكتب..." : "متاح للمساعدة"}
								</p>
							</div>
						</div>
					</div>

					{/* Messages */}
					<div
						ref={messagesContainerRef}
						className="p-6 h-[calc(100vh-400px)] min-h-[500px] overflow-y-auto bg-gray-50"
					>
						{messages.length === 0 ? (
							<div className="flex items-center justify-center h-full">
								<p className="text-gray-400">ابدأ المحادثة مع موظفك</p>
							</div>
						) : (
							<div className="flex flex-col gap-4">
								{messages.map((msg) => {
									const currentUserId = user._id || user.id;
									const messageSenderId =
										msg.senderId?._id || msg.senderId?.id || msg.senderId;
									const isOwnMessage =
										String(messageSenderId) === String(currentUserId);

									return (
										<div
											key={msg._id}
											className={`flex ${
												isOwnMessage ? "justify-end" : "justify-start"
											} w-full`}
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
															isOwnMessage ? "text-red-100" : "text-gray-500"
														}`}
													>
														{new Date(msg.createdAt).toLocaleTimeString(
															"ar-EG",
															{
																hour: "2-digit",
																minute: "2-digit",
															}
														)}
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
						<form
							onSubmit={handleSendMessage}
							className="flex items-center gap-3"
						>
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
				</div>
			</div>
		</div>
	);
};

export default ShipmentChatPage;
