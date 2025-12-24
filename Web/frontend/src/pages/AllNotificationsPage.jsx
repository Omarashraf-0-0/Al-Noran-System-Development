import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import { 
	Bell,
	PackagePlus, 
	Truck, 
	MapPin, 
	CheckCircle2, 
	FileText, 
	FileCheck, 
	FileX, 
	Hash, 
	Stamp, 
	ClipboardList, 
	CreditCard, 
	MessageCircle, 
	Megaphone,
	Filter,
	CheckCheck,
	Trash2,
	Inbox
} from "lucide-react";

const AllNotificationsPage = () => {
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [unreadCount, setUnreadCount] = useState(0);
	const [filter, setFilter] = useState("all"); // all, unread, read
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();

	// Get token and user from localStorage
	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";

	// Dynamic accent colors based on user type
	const getAccentColors = () => {
		const role = user?.type || 'client';
		const emType = user?.employeeDetails?.employeeType;
		
		if (role === 'admin' || (role === 'employee' && emType === 'System Admin')) {
			return {
				primary: "#D4AF37",
				gradient: "from-[#D4AF37] to-[#B8860B]",
				bgLight: isDarkMode ? "bg-[#3d3000]/30" : "bg-amber-50",
				text: "text-[#D4AF37]",
				border: "border-[#D4AF37]",
				button: "bg-[#D4AF37] hover:bg-[#B5952F]",
				buttonOutline: isDarkMode ? "border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10" : "border-[#D4AF37] text-[#D4AF37] hover:bg-amber-50",
				cardBg: isDarkMode ? "bg-[#1a1500]" : "bg-white",
				cardBorder: isDarkMode ? "border-[#3d3000]" : "border-amber-100",
				unreadBorder: "border-[#D4AF37]",
			};
		}
		if (role === 'employee') {
			return {
				primary: "#1ba3b6",
				gradient: "from-[#1ba3b6] to-[#158A9A]",
				bgLight: isDarkMode ? "bg-[#163a42]/30" : "bg-cyan-50",
				text: "text-[#1ba3b6]",
				border: "border-[#1ba3b6]",
				button: "bg-[#1ba3b6] hover:bg-[#158A9A]",
				buttonOutline: isDarkMode ? "border-[#1ba3b6] text-[#1ba3b6] hover:bg-[#1ba3b6]/10" : "border-[#1ba3b6] text-[#1ba3b6] hover:bg-cyan-50",
				cardBg: isDarkMode ? "bg-[#0a1a1f]" : "bg-white",
				cardBorder: isDarkMode ? "border-[#163a42]" : "border-cyan-100",
				unreadBorder: "border-[#1ba3b6]",
			};
		}
		return {
			primary: "#690000",
			gradient: "from-[#690000] to-[#8B0000]",
			bgLight: isDarkMode ? "bg-[#3d1a1a]/30" : "bg-red-50",
			text: "text-[#690000]",
			border: "border-[#690000]",
			button: "bg-[#690000] hover:bg-[#8B0000]",
			buttonOutline: isDarkMode ? "border-[#690000] text-[#e07373] hover:bg-[#690000]/10" : "border-[#690000] text-[#690000] hover:bg-red-50",
			cardBg: isDarkMode ? "bg-[#1a1010]" : "bg-white",
			cardBorder: isDarkMode ? "border-[#3d1a1a]" : "border-red-100",
			unreadBorder: "border-[#690000]",
		};
	};

	const accent = getAccentColors();

	// Theme configuration
	const theme = {
		bg: isDarkMode ? (user?.type === 'client' ? "bg-[#0a0a0a]" : "bg-gray-900") : "bg-gray-50",
		cardBg: accent.cardBg,
		cardBorder: accent.cardBorder,
		text: isDarkMode ? "text-gray-100" : "text-gray-800",
		textSub: isDarkMode ? "text-gray-400" : "text-gray-600",
		divider: isDarkMode ? "border-white/10" : "border-gray-200",
		filterBg: isDarkMode ? "bg-gray-800" : "bg-gray-100",
		filterActive: `${accent.button} text-white`,
		filterInactive: isDarkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
	};

	// Helper to get Lucide icon based on notification type
	const getNotificationIcon = (type) => {
		const iconProps = { className: `w-6 h-6` };
		const icons = {
			shipment_created: <PackagePlus {...iconProps} className="w-6 h-6 text-blue-500" />,
			shipment_status_changed: <Truck {...iconProps} className="w-6 h-6 text-orange-500" />,
			shipment_arrived: <MapPin {...iconProps} className="w-6 h-6 text-green-500" />,
			shipment_completed: <CheckCircle2 {...iconProps} className="w-6 h-6 text-green-600" />,
			document_uploaded: <FileText {...iconProps} className="w-6 h-6 text-purple-500" />,
			document_approved: <FileCheck {...iconProps} className="w-6 h-6 text-green-500" />,
			document_rejected: <FileX {...iconProps} className="w-6 h-6 text-red-500" />,
			acid_created: <Hash {...iconProps} className="w-6 h-6 text-indigo-500" />,
			acid_issued: <Stamp {...iconProps} className="w-6 h-6 text-teal-500" />,
			ucr_created: <ClipboardList {...iconProps} className="w-6 h-6 text-blue-400" />,
			ucr_approved: <FileCheck {...iconProps} className="w-6 h-6 text-green-500" />,
			payment_reminder: <CreditCard {...iconProps} className="w-6 h-6 text-yellow-500" />,
			payment_received: <CheckCircle2 {...iconProps} className="w-6 h-6 text-green-500" />,
			chat_message: <MessageCircle {...iconProps} className="w-6 h-6 text-pink-500" />,
			general: <Megaphone {...iconProps} className="w-6 h-6 text-gray-500" />,
		};
		return icons[type] || <Bell {...iconProps} className="w-6 h-6 text-gray-400" />;
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

	// Check if user is client for custom background
	const isClient = !['admin', 'employee'].includes(user?.type);

	return (
		<div className={`min-h-screen relative transition-colors duration-300 ${theme.bg}`} dir="rtl">
			{/* Client Theme Background Effects */}
			{isClient && (
				<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
					{isDarkMode ? (
						<>
							<div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-red-900/20 blur-[130px] animate-pulse"></div>
							<div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-red-900/10 blur-[120px]"></div>
						</>
					) : (
						<>
							<div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-red-100/50 blur-[100px]"></div>
							<div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-red-50/50 blur-[80px]"></div>
						</>
					)}
				</div>
			)}
			
			<div className="relative z-10">
				<Header />
			</div>
			
			<div className="max-w-6xl mx-auto px-4 py-24">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-2">
						<div className={`p-3 rounded-2xl bg-gradient-to-br ${accent.gradient}`}>
							<Bell className="w-8 h-8 text-white" />
						</div>
						<div>
							<h1 className={`text-3xl font-bold ${theme.text}`}>الإشعارات</h1>
							<p className={theme.textSub}>
								{unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : "لا توجد إشعارات غير مقروءة"}
							</p>
						</div>
					</div>
				</div>

				{/* Filters and Actions */}
				<div className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.cardBorder} p-5 mb-6`}>
					<div className="flex flex-wrap items-center justify-between gap-4">
						{/* Filters */}
						<div className="flex items-center gap-2">
							<Filter className={`w-5 h-5 ${theme.textSub}`} />
							<div className="flex gap-2">
								<button
									onClick={() => setFilter("all")}
									className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
										filter === "all"
											? theme.filterActive
											: theme.filterInactive
									}`}
								>
									الكل ({notifications.length})
								</button>
								<button
									onClick={() => setFilter("unread")}
									className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
										filter === "unread"
											? theme.filterActive
											: theme.filterInactive
									}`}
								>
									غير المقروءة ({unreadCount})
								</button>
								<button
									onClick={() => setFilter("read")}
									className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
										filter === "read"
											? theme.filterActive
											: theme.filterInactive
									}`}
								>
									المقروءة
								</button>
							</div>
						</div>

						{/* Actions */}
						<div className="flex gap-3">
							{unreadCount > 0 && (
								<button
									onClick={markAllAsRead}
									className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border transition-all ${accent.buttonOutline}`}
								>
									<CheckCheck className="w-4 h-4" />
									تحديد الكل كمقروء
								</button>
							)}
							{notifications.some(n => n.read) && (
								<button
									onClick={clearAllRead}
									className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
								>
									<Trash2 className="w-4 h-4" />
									مسح المقروءة
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Notifications List */}
				{loading ? (
					<div className="flex flex-col justify-center items-center h-64 gap-4">
						<div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${accent.border}`}></div>
						<p className={theme.textSub}>جاري تحميل الإشعارات...</p>
					</div>
				) : notifications.length === 0 ? (
					<div className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.cardBorder} p-16 text-center`}>
						<div className={`w-24 h-24 mx-auto rounded-full ${accent.bgLight} flex items-center justify-center mb-6`}>
							<Inbox className={`w-12 h-12 ${accent.text}`} />
						</div>
						<p className={`${theme.text} text-xl font-bold mb-2`}>لا توجد إشعارات</p>
						<p className={theme.textSub}>ستظهر الإشعارات الجديدة هنا</p>
					</div>
				) : (
					<div className="space-y-3">
						{notifications.map((notif) => (
							<div
								key={notif._id}
								onClick={() => handleNotificationClick(notif._id)}
								className={`${theme.cardBg} rounded-2xl shadow-md border ${theme.cardBorder} p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] group ${
									!notif.read ? `border-r-4 ${accent.unreadBorder}` : ""
								}`}
							>
								<div className="flex items-start gap-4">
									<div className={`p-3 rounded-xl ${accent.bgLight} flex-shrink-0 transition-transform group-hover:scale-110`}>
										{getNotificationIcon(notif.type)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<h3 className={`font-bold ${theme.text} text-base`}>
												{notif.title}
											</h3>
											{!notif.read && (
												<span className={`w-3 h-3 ${accent.button} rounded-full flex-shrink-0 mt-1 animate-pulse`}></span>
											)}
										</div>
										<p className={`${theme.textSub} text-sm mt-1 line-clamp-2`}>
											{notif.message}
										</p>
										<p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
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

export default AllNotificationsPage;
