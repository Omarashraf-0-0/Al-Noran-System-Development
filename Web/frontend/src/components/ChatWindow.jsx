import React, { useState, useRef, useEffect } from "react";
import SendImg from "../assets/images/send.png"; // <-- Import your image

const MessageBubble = ({ message, isOwnMessage, avatarUrl }) => {
	const bubbleClasses = `
        flex items-end gap-3 max-w-lg
        ${isOwnMessage ? "self-end flex-row" : "self-start flex-row-reverse"}
    `;

	const textClasses = `
        p-3 rounded-2xl
        ${
					isOwnMessage
						? "bg-red-600 rounded-br-none text-white"
						: "bg-gray-200 text-gray-800 rounded-bl-none"
				}
    `;

	return (
		<div className={bubbleClasses}>
			{!isOwnMessage && (
				<img
					src={avatarUrl}
					alt="User Avatar"
					className="w-8 h-8 rounded-full"
				/>
			)}
			<div className={textClasses}>
				<p>{message.text}</p>
				<span
					className={`text-xs mt-1 block ${
						isOwnMessage ? "text-red-100 text-right" : "text-gray-500 text-left"
					}`}
				>
					{message.timestamp}
				</span>
			</div>
		</div>
	);
};

const ChatWindow = ({
	user,
	messages,
	onSendMessage,
	sending,
	currentUserId,
	onTyping,
	isOtherUserTyping,
}) => {
	const [newMessage, setNewMessage] = useState("");
	const messagesEndRef = useRef(null);
	const messagesContainerRef = useRef(null);
	const typingTimeoutRef = useRef(null);

	const scrollToBottom = () => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
		}
	};

	useEffect(scrollToBottom, [messages]);

	const handleInputChange = (e) => {
		setNewMessage(e.target.value);

		// Emit typing indicator
		if (onTyping) {
			onTyping(true);

			// Clear previous timeout
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}

			// Stop typing after 3 seconds of inactivity
			typingTimeoutRef.current = setTimeout(() => {
				onTyping(false);
			}, 3000);
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (newMessage.trim() && !sending) {
			onSendMessage(newMessage);
			setNewMessage("");

			// Stop typing indicator
			if (onTyping) {
				onTyping(false);
			}
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		}
	};

	return (
		<div className="flex flex-col h-full bg-white" dir="rtl">
			{/* Chat Header */}
			<div className="flex items-center gap-4 p-3 border-b border-gray-200 bg-gray-50">
				<img
					src={user.avatarUrl}
					alt={user.name}
					className="w-12 h-12 rounded-full"
				/>
				<div>
					<h3 className="font-bold text-lg text-gray-800">{user.name}</h3>
					<div className="flex items-center gap-2">
						<span
							className={`h-2.5 w-2.5 rounded-full ${
								user.isOnline ? "bg-green-500" : "bg-gray-500"
							}`}
						></span>
						<p className="text-sm text-gray-500">
							{user.status === "active"
								? "نشط"
								: user.status === "pending"
								? "في الانتظار"
								: "منتهي"}
						</p>
					</div>
				</div>
			</div>

			{/* Messages Area */}
			<div className="flex-1 p-6 space-y-6 overflow-y-auto bg-white">
				{messages.length === 0 ? (
					<div className="flex items-center justify-center h-full">
						<p className="text-gray-400">لا توجد رسائل بعد. ابدأ المحادثة!</p>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{messages.map((msg) => (
							<MessageBubble
								key={msg.id}
								message={msg}
								isOwnMessage={msg.isOwn}
								avatarUrl={user.avatarUrl}
							/>
						))}
						{isOtherUserTyping && (
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
			<div className="p-4 bg-gray-50 border-t border-gray-200">
				<form onSubmit={handleSubmit} className="flex items-center gap-4">
					<input
						type="text"
						value={newMessage}
						onChange={handleInputChange}
						placeholder="اكتب رسالة..."
						className="flex-1 bg-white text-gray-900 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
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
	);
};

export default ChatWindow;
