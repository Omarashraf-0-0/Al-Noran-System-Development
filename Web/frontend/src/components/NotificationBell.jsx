import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const NotificationBell = () => {
	const [notifications, setNotifications] = useState([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const socketRef = useRef(null);

	// Get token from localStorage
	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";

	// Load cached notifications on mount
	useEffect(() => {
		if (!user._id) return;
		
		try {
			const CACHE_KEY = `notifications_${user._id}`;
			const CACHE_TIMESTAMP_KEY = `notifications_timestamp_${user._id}`;
			const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
			
			const cached = localStorage.getItem(CACHE_KEY);
			const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
			
			if (cached && timestamp) {
				const age = Date.now() - parseInt(timestamp);
				if (age < CACHE_DURATION) {
					const data = JSON.parse(cached);
					setNotifications(data.notifications || []);
					setUnreadCount(data.unreadCount || 0);
					console.log("Loaded notifications from cache:", data.unreadCount, "unread");
				}
			}
		} catch (error) {
			console.error("Error loading cached notifications:", error);
		}
	}, [user._id]);

	// Save notifications to cache
	const saveToCache = useCallback((notifs, count) => {
		if (!user._id) return;
		
		try {
			const CACHE_KEY = `notifications_${user._id}`;
			const CACHE_TIMESTAMP_KEY = `notifications_timestamp_${user._id}`;
			
			localStorage.setItem(CACHE_KEY, JSON.stringify({
				notifications: notifs,
				unreadCount: count
			}));
			localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
			console.log("Saved to cache:", count, "unread");
		} catch (error) {
			console.error("Error saving notifications to cache:", error);
		}
	}, [user._id]);

	// Fetch notifications from API
	const fetchNotifications = useCallback(async () => {
		try {
			setLoading(true);
			
			const response = await axios.get(`${apiUrl}/api/notifications`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
				params: {
					limit: 20,
					page: 1,
				},
			});

			if (response.data.success) {
				const notifs = response.data.notifications || [];
				const count = response.data.unreadCount || 0;
				
				setNotifications(notifs);
				setUnreadCount(count);
				
				// Save to cache
				saveToCache(notifs, count);
			}
		} catch (error) {
			console.error("Error fetching notifications:", error);
			if (error.response?.status !== 401) {
				toast.error("فشل في تحميل الإشعارات");
			}
		} finally {
			setLoading(false);
		}
	}, [apiUrl, token, saveToCache]);

	// Fetch unread count only
	const fetchUnreadCount = useCallback(async () => {
		try {
			const response = await axios.get(
				`${apiUrl}/api/notifications/unread-count`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.success) {
				setUnreadCount(response.data.count || 0);
			}
		} catch (error) {
			console.error("Error fetching unread count:", error);
		}
	}, [apiUrl, token]);

	useEffect(() => {
		if (!token || !user._id) return;

		// Fetch notifications (cache already loaded in separate useEffect)
		fetchNotifications();

		// Connect to Socket.IO
		const socket = io(apiUrl, {
			autoConnect: true,
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5,
		});

		socketRef.current = socket;

		// Authenticate user with socket
		socket.on('connect', () => {
			console.log('Socket connected for notifications');
			socket.emit('identify', { odI: user._id, userType: user.role || 'customer' });
		});

		// Listen for new notifications
		socket.on('new_notification', (data) => {
			console.log('New notification received:', data);
			
			// Add notification to the list
			setNotifications(prev => {
				const updated = [data.notification, ...prev];
				// Update cache with new notification
				const newCount = data.notification.read ? unreadCount : unreadCount + 1;
				saveToCache(updated, newCount);
				return updated;
			});
			
			// Update unread count
			if (!data.notification.read) {
				setUnreadCount(prev => prev + 1);
			}
			
			// Show toast notification
			toast.success(data.notification.title, {
				icon: getNotificationIcon(data.notification.type),
				duration: 4000,
			});
		});

		socket.on('disconnect', () => {
			console.log('Socket disconnected from notifications');
		});

		socket.on('connect_error', (error) => {
			console.error('Socket connection error:', error);
		});

		// Cleanup on unmount
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [token, user._id, apiUrl, fetchNotifications]);

	// Handle notification click - delete notification and navigate to notification page
	const handleNotificationClick = async (notifId) => {
		try {
			// Get the notification before deleting to check if it was unread
			const clickedNotification = notifications.find(n => n._id === notifId);
			const wasUnread = clickedNotification && !clickedNotification.read;

			// Close dropdown
			setShowDropdown(false);

			// Navigate to notification details page with notification data
			navigate(`/notification/${notifId}`, {
				state: { notification: clickedNotification }
			});

			// Delete notification from backend (async, don't wait)
			axios.delete(
				`${apiUrl}/api/notifications/${notifId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			).then(() => {
				// Remove from local state after successful deletion
				const updated = notifications.filter((n) => n._id !== notifId);
				setNotifications(updated);
				
				// Decrease unread count only if the notification was unread
				const newCount = wasUnread ? Math.max(0, unreadCount - 1) : unreadCount;
				if (wasUnread) {
					setUnreadCount(newCount);
				}
				
				// Update cache
				saveToCache(updated, newCount);
			}).catch(error => {
				console.error("Error deleting notification:", error);
			});
		} catch (error) {
			console.error("Error handling notification click:", error);
			setShowDropdown(false);
		}
	};

	const clearAll = async () => {
		try {
			const response = await axios.delete(
				`${apiUrl}/api/notifications/clear-read`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.success) {
				// Refresh notifications
				await fetchNotifications();
				toast.success("تم مسح الإشعارات المقروءة");
			}
		} catch (error) {
			console.error("Error clearing notifications:", error);
			toast.error("فشل في مسح الإشعارات");
		}
	};

	return (
		<div className="relative">
			{/* Bell Icon */}
			<button
				onClick={() => {
					setShowDropdown(!showDropdown);
					if (!showDropdown) {
						fetchNotifications(); // Refresh when opening
					}
				}}
				className="relative p-2 text-gray-600 hover:text-red-800 transition"
			>
				<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
					<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
				</svg>
				{unreadCount > 0 && (
					<span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
						{unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown */}
			{showDropdown && (
				<div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
					<div className="p-4 border-b border-gray-200 flex justify-between items-center">
						<h3 className="font-bold text-gray-800">الإشعارات</h3>
						{notifications.length > 0 && (
							<button
								onClick={clearAll}
								className="text-xs text-red-600 hover:text-red-800"
							>
								مسح المقروءة
							</button>
						)}
					</div>

					{loading ? (
						<div className="p-8 text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800 mx-auto"></div>
							<p className="text-gray-500 mt-2">جاري التحميل...</p>
						</div>
					) : notifications.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-gray-500">لا توجد إشعارات</p>
						</div>
					) : (
						<>
							<div className="divide-y divide-gray-100">
								{notifications.slice(0, 4).map((notif) => (
									<div
										key={notif._id}
										onClick={() => handleNotificationClick(notif._id)}
										className={`p-4 cursor-pointer transition ${
											notif.read ? "bg-white hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-100"
										}`}
									>
										<div className="flex items-start gap-3">
											<span className="text-2xl">
												{getNotificationIcon(notif.type)}
											</span>
											<div className="flex-1">
												<p className="font-medium text-gray-800 text-sm">
													{notif.title}
												</p>
												<p className="text-xs text-gray-600 mt-1">
													{notif.message}
												</p>
												<p className="text-xs text-gray-400 mt-2">
													{formatNotificationTime(notif.createdAt)}
												</p>
											</div>
											{!notif.read && (
												<span className="w-2 h-2 bg-blue-600 rounded-full"></span>
											)}
										</div>
									</div>
								))}
							</div>
							
							{/* View All Link when more than 4 notifications */}
							{notifications.length > 4 && (
								<div className="p-4 border-t border-gray-200 bg-gray-50">
									<button
										onClick={() => {
											setShowDropdown(false);
											navigate("/notifications");
										}}
										className="w-full text-center text-red-800 hover:text-red-900 font-medium text-sm"
									>
										عرض جميع الإشعارات ({notifications.length})
									</button>
								</div>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
};

// Helper function to get icon based on notification type
const getNotificationIcon = (type) => {
	const icons = {
		shipment_created: "📦",
		shipment_status_changed: "🚚",
		shipment_arrived: "✅",
		shipment_completed: "🎉",
		document_uploaded: "📄",
		document_approved: "✅",
		document_rejected: "❌",
		acid_created: "🆔",
		acid_issued: "✅",
		ucr_created: "📋",
		ucr_approved: "✅",
		payment_reminder: "💰",
		payment_received: "✅",
		chat_message: "💬",
		general: "📢",
	};
	return icons[type] || "📢";
};

// Helper function to format time
const formatNotificationTime = (timestamp) => {
	const date = new Date(timestamp);
	const now = new Date();
	const diffInMs = now - date;
	const diffInMinutes = Math.floor(diffInMs / 60000);
	const diffInHours = Math.floor(diffInMs / 3600000);
	const diffInDays = Math.floor(diffInMs / 86400000);

	if (diffInMinutes < 1) return "الآن";
	if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
	if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
	if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
	
	return date.toLocaleDateString("ar-EG", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export default NotificationBell;
