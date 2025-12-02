import { io } from "socket.io-client";

class ChatService {
	constructor() {
		this.socket = null;
		this.listeners = new Map();
	}

	connect(userId, userType, token) {
		return new Promise((resolve, reject) => {
			if (this.socket?.connected) {
				resolve(this.socket);
				return;
			}

			this.socket = io(import.meta.env.VITE_API_URL || "http://localhost:3500", {
				auth: { token },
				transports: ["websocket", "polling"],
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000,
				timeout: 10000,
			});

			this.socket.on("connect", () => {
				console.log("Socket connected:", this.socket.id);
				
				// Authenticate user
				this.socket.emit("authenticate", { userId, userType });
				resolve(this.socket);
			});

			this.socket.on("disconnect", (reason) => {
				console.log("Socket disconnected:", reason);
			});

			this.socket.on("connect_error", (error) => {
				console.error("Connection error:", error.message);
				reject(error);
			});

			this.socket.on("reconnect_failed", () => {
				console.error("Failed to reconnect after maximum attempts");
				reject(new Error("Failed to reconnect"));
			});

			// Timeout after 10 seconds
			setTimeout(() => {
				if (!this.socket?.connected) {
					reject(new Error("Connection timeout"));
				}
			}, 10000);
		});
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			this.listeners.clear();
		}
	}

	// Join a chat room
	joinChat(chatId, userId) {
		if (this.socket) {
			// Support both old and new call signatures
			const joinData = userId ? { chatId, userId } : { chatId };
			this.socket.emit("join_chat", joinData);
		}
	}

	// Send a message
	sendMessage(chatId, text, senderId, senderType) {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error("Socket not connected"));
				return;
			}

			// Support both old and new call signatures
			let messageData;
			if (typeof text === 'string' && !senderId) {
				// New signature: sendMessage(chatId, text)
				messageData = { chatId, text };
				console.log("Sending message (new signature):", messageData);
			} else {
				// Old signature: sendMessage(chatId, text, senderId, senderType)
				messageData = { chatId, senderId, senderType, text };
				console.log("Sending message (old signature):", messageData);
			}

			this.socket.emit("send_message", messageData);

			// Listen for acknowledgment
			const ackListener = (data) => {
				if (data.chatId === chatId) {
					this.socket.off("message_sent", ackListener);
					resolve(data);
				}
			};

			const errorListener = (error) => {
				this.socket.off("message_error", errorListener);
				reject(error);
			};

			this.socket.on("message_sent", ackListener);
			this.socket.on("message_error", errorListener);

			// Timeout after 5 seconds
			setTimeout(() => {
				this.socket.off("message_sent", ackListener);
				this.socket.off("message_error", errorListener);
				reject(new Error("Message send timeout"));
			}, 5000);
		});
	}

	// Listen for new messages
	onNewMessage(callback) {
		if (this.socket) {
			this.socket.on("new_message", callback);
			this.listeners.set("new_message", callback);
		}
	}

	// Listen for typing indicator
	onTyping(callback) {
		if (this.socket) {
			this.socket.on("user_typing", callback);
			this.listeners.set("user_typing", callback);
		}
	}

	// Send typing indicator
	sendTyping(chatId, isTyping, userId, userType) {
		if (this.socket) {
			// Support both old and new call signatures
			let typingData;
			if (typeof isTyping === 'boolean' && !userId) {
				// New signature: sendTyping(chatId, isTyping)
				typingData = { chatId, isTyping };
				console.log("Sending typing (new signature):", typingData);
			} else {
				// Old signature: sendTyping(chatId, userId, userType, isTyping)
				typingData = { chatId, userId, userType, isTyping };
				console.log("Sending typing (old signature):", typingData);
			}
			this.socket.emit("typing", typingData);
		}
	}

	// Listen for messages read
	onMessagesRead(callback) {
		if (this.socket) {
			this.socket.on("messages_read", callback);
			this.listeners.set("messages_read", callback);
		}
	}

	// Listen for agent assignment
	onAgentAssigned(callback) {
		if (this.socket) {
			this.socket.on("agent_assigned", callback);
			this.listeners.set("agent_assigned", callback);
		}
	}

	// Listen for new chat assignment (for employees)
	onNewChatAssigned(callback) {
		if (this.socket) {
			this.socket.on("new_chat_assigned", callback);
			this.listeners.set("new_chat_assigned", callback);
		}
	}

	// Listen for employee status changes
	onEmployeeStatus(callback) {
		if (this.socket) {
			this.socket.on("employee_status", callback);
			this.listeners.set("employee_status", callback);
		}
	}

	// Listen for chat resolved
	onChatResolved(callback) {
		if (this.socket) {
			this.socket.on("chat_resolved", callback);
			this.listeners.set("chat_resolved", callback);
		}
	}

	// Listen for no agents available
	onNoAgentsAvailable(callback) {
		if (this.socket) {
			this.socket.on("no_agents_available", callback);
			this.listeners.set("no_agents_available", callback);
		}
	}

	// Request agent assignment
	requestAgent(chatId) {
		if (this.socket) {
			this.socket.emit("request_agent", { chatId });
		}
	}

	// Remove all listeners
	removeAllListeners() {
		if (this.socket) {
			this.listeners.forEach((callback, event) => {
				this.socket.off(event, callback);
			});
			this.listeners.clear();
		}
	}

	// Remove specific listener
	removeListener(event) {
		if (this.socket && this.listeners.has(event)) {
			const callback = this.listeners.get(event);
			this.socket.off(event, callback);
			this.listeners.delete(event);
		}
	}
}

// Create singleton instance
const chatService = new ChatService();

export default chatService;
