import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import Header from "../components/Header";
import AdminHeader from "../components/AdminHeader";

const AllNotificationsPage = () => {
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [unreadCount, setUnreadCount] = useState(0);
	const [filter, setFilter] = useState("all"); // all, unread, read
	const navigate = useNavigate();

	// Get token and user from localStorage
	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type;
	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";

	// Fetch notifications from API
	const fetchNotifications = useCallback(async () => {
		try {
			setLoading(true);
			const response = await axios.get(`${apiUrl}/api/notifications`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
				params: {
					limit: 100,
					page: 1,
					unreadOnly: filter === "unread" ? true : false,
				},
			});

			if (response.data.success) {
				let notifs = response.data.notifications || [];
				
				// Apply filter
				if (filter === "read") {
					notifs = notifs.filter(n => n.read);
				}
				
				setNotifications(notifs);
				setUnreadCount(response.data.unreadCount || 0);
			}
		} catch (error) {
			console.error("Error fetching notifications:", error);
			if (error.response?.status !== 401) {
				toast.error("فشل في تحميل الإشعارات");
			}
		} finally {
			setLoading(false);
		}
	}, [apiUrl, token, filter]);

	useEffect(() => {
		if (!token) {
			navigate("/login");
			return;
		}
		fetchNotifications();
	}, [token, fetchNotifications, navigate]);

	// Handle notification click - delete notification and navigate
	const handleNotificationClick = async (notifId) => {
		try {
			const clickedNotification = notifications.find(n => n._id === notifId);
			const wasUnread = clickedNotification && !clickedNotification.read;

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
		}
	};

	const clearAllRead = async () => {
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
				await fetchNotifications();
				toast.success("تم مسح الإشعارات المقروءة");
			}
		} catch (error) {
			console.error("Error clearing notifications:", error);
			toast.error("فشل في مسح الإشعارات");
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
				await fetchNotifications();
				setUnreadCount(0);
				toast.success("تم تحديد جميع الإشعارات كمقروءة");
			}
		} catch (error) {
			console.error("Error marking all as read:", error);
			toast.error("فشل في تحديد الإشعارات كمقروءة");
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{userType === "employee" || userType === "admin" ? <AdminHeader /> : <Header />}
			
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-800 mb-2">الإشعارات</h1>
					<p className="text-gray-600">
						{unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : "لا توجد إشعارات غير مقروءة"}
					</p>
				</div>

				{/* Filters and Actions */}
				<div className="bg-white rounded-lg shadow-sm p-4 mb-6">
					<div className="flex flex-wrap items-center justify-between gap-4">
						{/* Filters */}
						<div className="flex gap-2">
							<button
								onClick={() => setFilter("all")}
								className={`px-4 py-2 rounded-lg font-medium transition ${
									filter === "all"
										? "bg-red-800 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								الكل ({notifications.length})
							</button>
							<button
								onClick={() => setFilter("unread")}
								className={`px-4 py-2 rounded-lg font-medium transition ${
									filter === "unread"
										? "bg-red-800 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								غير المقروءة ({unreadCount})
							</button>
							<button
								onClick={() => setFilter("read")}
								className={`px-4 py-2 rounded-lg font-medium transition ${
									filter === "read"
										? "bg-red-800 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								المقروءة
							</button>
						</div>

						{/* Actions */}
						<div className="flex gap-2">
							{unreadCount > 0 && (
								<button
									onClick={markAllAsRead}
									className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
								>
									تحديد الكل كمقروء
								</button>
							)}
							{notifications.some(n => n.read) && (
								<button
									onClick={clearAllRead}
									className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
								>
									مسح المقروءة
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Notifications List */}
				{loading ? (
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div>
					</div>
				) : notifications.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm p-12 text-center">
						<svg
							className="w-24 h-24 mx-auto text-gray-300 mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							/>
						</svg>
						<p className="text-gray-500 text-lg">لا توجد إشعارات</p>
					</div>
				) : (
					<div className="space-y-2">
						{notifications.map((notif) => (
							<div
								key={notif._id}
								onClick={() => handleNotificationClick(notif._id)}
								className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition hover:shadow-md ${
									notif.read ? "" : "border-l-4 border-blue-600"
								}`}
							>
								<div className="flex items-start gap-4">
									<span className="text-3xl flex-shrink-0">
										{getNotificationIcon(notif.type)}
									</span>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<h3 className="font-semibold text-gray-800 text-base">
												{notif.title}
											</h3>
											{!notif.read && (
												<span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
											)}
										</div>
										<p className="text-gray-600 text-sm mt-1 line-clamp-2">
											{notif.message}
										</p>
										<p className="text-gray-400 text-xs mt-2">
											{formatNotificationTime(notif.createdAt)}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
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
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export default AllNotificationsPage;
