import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NotificationBell = ({ isDarkMode }) => {
	const [notifications, setNotifications] = useState([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	// Get token from localStorage
	const token = localStorage.getItem("token");
	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";

	// Theme configuration
	const theme = {
		dropdownBg: isDarkMode ? "bg-[#1a1010] border-[#3d1a1a]" : "bg-white border-gray-200",
		headerBg: isDarkMode ? "bg-[#2b0000] border-[#3d1a1a]" : "bg-gray-50 border-gray-200",
		textMain: isDarkMode ? "text-gray-100" : "text-gray-800",
		textSub: isDarkMode ? "text-gray-400" : "text-gray-600",
		hoverBg: isDarkMode ? "hover:bg-[#2b1515]" : "hover:bg-gray-50",
		unreadBg: isDarkMode ? "bg-[#3d1a1a]" : "bg-blue-50",
		divider: isDarkMode ? "divide-[#3d1a1a] border-[#3d1a1a]" : "divide-gray-100 border-gray-200",
	};

	// Fetch notifications from API
	const fetchNotifications = useCallback(async () => {
		try {
			setLoading(true);
			const response = await axios.get(`${apiUrl}/api/notifications`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
				params: {
					limit: 5,
					page: 1,
				},
			});

			if (response.data.success) {
				setNotifications(response.data.notifications || []);
				setUnreadCount(response.data.unreadCount || 0);
			}
		} catch (error) {
			console.error("Error fetching notifications:", error);
			if (error.response?.status !== 401) {
				// Silent fail for better UX or use toast if critical
			}
		} finally {
			setLoading(false);
		}
	}, [apiUrl, token]);

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
		if (!token) return;

		// Initial fetch
		fetchNotifications();

		// Poll for new notifications every 30 seconds
		const interval = setInterval(fetchUnreadCount, 30000);

		return () => clearInterval(interval);
	}, [token, fetchNotifications, fetchUnreadCount]);

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
				if (wasUnread) {
					setUnreadCount(prev => Math.max(0, prev - 1));
				}
			}).catch(error => {
				console.error("Error deleting notification:", error);
			});
		} catch (error) {
			console.error("Error handling notification click:", error);
			setShowDropdown(false);
		}
	};

	const markAllAsRead = async () => {
		try {
			const response = await axios.put(
				`${apiUrl}/api/notifications/read-all`,
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.success) {
				toast.success("تم تمييز الكل كمقروء");
				setUnreadCount(0);
				// Update all local notifications to read
				setNotifications((prev) =>
					prev.map((n) => ({ ...n, read: true }))
				);
			}
		} catch (error) {
			console.error("Error marking all as read:", error);
			toast.error("فشل في تحديث الإشعارات");
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
				className={`relative p-2 transition ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-red-800"}`}
			>
				<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
					<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
				</svg>
				{unreadCount > 0 && (
					<span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
						{unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown */}
			{showDropdown && (
				<div className={`absolute top-full right-0 mt-2 w-80 rounded-xl shadow-xl border z-50 max-h-[30rem] flex flex-col ${theme.dropdownBg} origin-top-right animate-fade-in-up`}>
					{/* Header */}
					<div className={`p-4 border-b flex justify-between items-center ${theme.headerBg}`}>
						<div className="flex items-center gap-2">
							<h3 className={`font-bold ${theme.textMain}`}>الإشعارات</h3>
							{unreadCount > 0 && (
								<span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
									{unreadCount} غير مقروء
								</span>
							)}
						</div>
						<button
							onClick={markAllAsRead}
							className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
						>
							تمييز الكل كمقروء
						</button>
					</div>

					{/* Notification List */}
					<div className="overflow-y-auto flex-1 custom-scrollbar">
						{loading ? (
							<div className="p-8 text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
								<p className={`mt-2 ${theme.textSub}`}>جاري التحميل...</p>
							</div>
						) : notifications.length === 0 ? (
							<div className="p-8 text-center">
								<p className={theme.textSub}>لا توجد إشعارات حالياً</p>
							</div>
						) : (
							<div className={`divide-y ${theme.divider}`}>
								{notifications.map((notif) => (
									<div
										key={notif._id}
										onClick={() => handleNotificationClick(notif._id)}
										className={`p-4 cursor-pointer transition flex items-start gap-3 ${
											notif.read ? `bg-transparent ${theme.hoverBg}` : `${theme.unreadBg}`
										}`}
									>
										<span className="text-2xl mt-1 shrink-0">
											{getNotificationIcon(notif.type)}
										</span>
										<div className="flex-1 min-w-0">
											<p className={`font-medium text-sm truncate ${theme.textMain}`}>
												{notif.title}
											</p>
											<p className={`text-xs mt-1 line-clamp-2 ${theme.textSub}`}>
												{notif.message}
											</p>
											<p className="text-[10px] text-gray-400 mt-2">
												{formatNotificationTime(notif.createdAt)}
											</p>
										</div>
										{!notif.read && (
											<span className="w-2 h-2 bg-red-600 rounded-full mt-2 shrink-0"></span>
										)}
									</div>
								))}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className={`p-3 border-t ${theme.headerBg}`}>
						<button
							onClick={() => {
								setShowDropdown(false);
								navigate("/notifications");
							}}
							className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors shadow-md"
						>
							عرض كل الإشعارات
						</button>
					</div>
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
