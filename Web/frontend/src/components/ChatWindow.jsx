import React, { useState, useRef, useEffect } from "react";
import SendImg from "../assets/images/send.png";

const MessageBubble = ({ message, isOwnMessage, avatarUrl, theme, accents }) => {
	const isDark = theme === 'dark';
	
	const bubbleClasses = `
        flex items-end gap-3 max-w-lg
        ${isOwnMessage ? "self-end flex-row" : "self-start flex-row-reverse"}
    `;

	const textClasses = `
        p-3 rounded-2xl shadow-sm
        ${
			isOwnMessage
				? `${accents.primary} text-white rounded-br-none`
				: isDark 
					? "bg-[#27272a] text-gray-200 rounded-bl-none" 
					: "bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow.md"
		}
    `;

	return (
		<div className={`${bubbleClasses} group`}>
			<span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-gray-500" : "text-gray-500 font-medium"} mb-1`}>
				{message.timestamp}
			</span>
			<div className={textClasses}>
				<p className="leading-relaxed">{message.text}</p>
			</div>
			{!isOwnMessage && (
				<img
					src={avatarUrl}
					alt="User Avatar"
					className="w-8 h-8 rounded-full border-2 border-white/10"
				/>
			)}
		</div>
	);
};

const ChatWindow = ({
	user,
	messages,
	onSendMessage,
	sending,
	onTyping,
	isOtherUserTyping,
	theme,
	accents
}) => {
	const [newMessage, setNewMessage] = useState("");
	const messagesEndRef = useRef(null);
	const messagesContainerRef = useRef(null);
	const typingTimeoutRef = useRef(null);
	
	const isDark = theme === 'dark';

	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	};

	useEffect(scrollToBottom, [messages, isOtherUserTyping]);

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
		<div className={`flex flex-col h-full ${isDark ? "bg-[#0a0a0a]" : "bg-gray-50"}`} dir="rtl">
			{/* Chat Header */}
			<div className={`flex items-center gap-4 p-4 border-b backdrop-blur-md ${isDark ? "border-white/5 bg-white/5" : "border-gray-200 bg-white shadow-sm"}`}>
				<div className="relative">
					<img
						src={user.avatarUrl}
						alt={user.name}
						className={`w-12 h-12 rounded-full border-2 ${isDark ? "border-white/10" : "border-gray-100 shadow-sm"}`}
					/>
					<span
						className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
							user.isOnline ? "bg-green-500" : "bg-gray-400"
						}`}
					></span>
				</div>
				<div>
					<h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>{user.name}</h3>
					<div className="flex items-center gap-2">
						<p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500 font-medium"}`}>
							{user.status === "active"
								? "نشط الآن"
								: user.status === "pending"
								? "في قائمة الانتظار"
								: "محادثة منتهية"}
						</p>
					</div>
				</div>
			</div>

			{/* Messages Area */}
			<div className={`flex-1 p-6 overflow-y-auto custom-scrollbar ${isDark ? "bg-[#0a0a0a]" : "bg-[#f3f4f6]"}`}>
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full opacity-50">
						<div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-white/5" : "bg-gray-200"}`}>
							<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						</div>
						<p className={isDark ? "text-gray-400" : "text-gray-500 font-medium"}>لا توجد رسائل بعد. ابدأ المحادثة!</p>
					</div>
				) : (
					<div className="flex flex-col gap-6">
						{messages.map((msg) => (
							<MessageBubble
								key={msg.id}
								message={msg}
								isOwnMessage={msg.isOwn}
								avatarUrl={user.avatarUrl}
								theme={theme}
								accents={accents}
							/>
						))}
						{isOtherUserTyping && (
							<div className="flex items-center gap-2 text-gray-500 text-sm animate-pulse px-4">
								<div className="flex gap-1 bg-gray-200 dark:bg-white/10 px-3 py-2 rounded-full">
									<span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
									<span
										className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
										style={{ animationDelay: "0.2s" }}
									></span>
									<span
										className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
										style={{ animationDelay: "0.4s" }}
									></span>
								</div>
								<span className="text-xs">يكتب...</span>
							</div>
						)}
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Message Input */}
			<div className={`p-4 border-t ${isDark ? "bg-[#141419] border-white/5" : "bg-white border-gray-200"}`}>
				<form onSubmit={handleSubmit} className="flex items-center gap-3">
					<input
						type="text"
						value={newMessage}
						onChange={handleInputChange}
						placeholder="اكتب رسالتك هنا..."
						className={`flex-1 px-6 py-4 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 disabled:opacity-50
							${isDark 
								? `bg-black/30 border-white/5 text-white placeholder-gray-500 focus:border-${accents.primaryText.split('-')[1]}` 
								: `bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-${accents.primaryText.split('-')[1]}`
							}
						`}
						disabled={sending}
						style={{ caretColor: isDark ? 'white' : 'black' }}
					/>
					<button
						type="submit"
						className={`p-4 rounded-full text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${accents.primary} ${accents.primaryHover}`}
						disabled={!newMessage.trim() || sending}
					>
						{sending ? (
							<div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
						) : (
							<svg className="w-6 h-6 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
							</svg>
						)}
					</button>
				</form>
			</div>
		</div>
	);
};

export default ChatWindow;
