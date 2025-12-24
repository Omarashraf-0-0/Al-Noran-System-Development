import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import { 
	ArrowRight, 
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
	User,
	ExternalLink,
	Calendar,
	AlertCircle
} from "lucide-react";

const NotificationPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { isDarkMode } = useTheme();
	const [notification, setNotification] = useState(location.state?.notification || null);
	const [loading, setLoading] = useState(!location.state?.notification);

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
				cardBg: isDarkMode ? "bg-[#1a1500]" : "bg-white",
				cardBorder: isDarkMode ? "border-[#3d3000]" : "border-amber-100",
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
				cardBg: isDarkMode ? "bg-[#0a1a1f]" : "bg-white",
				cardBorder: isDarkMode ? "border-[#163a42]" : "border-cyan-100",
			};
		}
		return {
			primary: "#690000",
			gradient: "from-[#690000] to-[#8B0000]",
			bgLight: isDarkMode ? "bg-[#3d1a1a]/30" : "bg-red-50",
			text: "text-[#690000]",
			border: "border-[#690000]",
			button: "bg-[#690000] hover:bg-[#8B0000]",
			cardBg: isDarkMode ? "bg-[#1a1010]" : "bg-white",
			cardBorder: isDarkMode ? "border-[#3d1a1a]" : "border-red-100",
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
	};

	useEffect(() => {
		if (location.state?.notification) {
			setNotification(location.state.notification);
			setLoading(false);
			return;
		}

		const fetchNotification = async () => {
			try {
				setLoading(true);
				const response = await axios.get(
					`${apiUrl}/api/notifications/${id}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				if (response.data.success) {
					setNotification(response.data.notification);
				}
			} catch (error) {
				console.error("Error fetching notification:", error);
				if (error.response?.status === 404) {
					toast.error("الإشعار غير موجود");
					navigate("/home");
				} else {
					toast.error("فشل في تحميل الإشعار");
				}
			} finally {
				setLoading(false);
			}
		};

		if (id && token) {
			fetchNotification();
		}
	}, [id, token, apiUrl, navigate, location.state]);

	// Helper to get Lucide icon based on notification type
	const getNotificationIcon = (type) => {
		const iconProps = { className: "w-10 h-10 text-white" };
		const icons = {
			shipment_created: <PackagePlus {...iconProps} />,
			shipment_status_changed: <Truck {...iconProps} />,
			shipment_arrived: <MapPin {...iconProps} />,
			shipment_completed: <CheckCircle2 {...iconProps} />,
			document_uploaded: <FileText {...iconProps} />,
			document_approved: <FileCheck {...iconProps} />,
			document_rejected: <FileX {...iconProps} />,
			acid_created: <Hash {...iconProps} />,
			acid_issued: <Stamp {...iconProps} />,
			ucr_created: <ClipboardList {...iconProps} />,
			ucr_approved: <FileCheck {...iconProps} />,
			payment_reminder: <CreditCard {...iconProps} />,
			payment_received: <CheckCircle2 {...iconProps} />,
			chat_message: <MessageCircle {...iconProps} />,
			general: <Megaphone {...iconProps} />,
		};
		return icons[type] || <Bell {...iconProps} />;
	};

	// Helper to format time
	const formatNotificationTime = (timestamp) => {
		const date = new Date(timestamp);
		return date.toLocaleString("ar-EG", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Get priority color and label
	const getPriorityInfo = (priority) => {
		const priorities = {
			low: { color: isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700", label: "عادي", icon: "○" },
			medium: { color: isDarkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700", label: "متوسط", icon: "●" },
			high: { color: isDarkMode ? "bg-orange-900/50 text-orange-300" : "bg-orange-100 text-orange-700", label: "مهم", icon: "◆" },
			urgent: { color: isDarkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700", label: "عاجل", icon: "⚠" },
		};
		return priorities[priority] || priorities.medium;
	};

	// Smart navigation based on notification type and data
	const getActionUrl = () => {
		const data = notification?.data || {};
		const type = notification?.type;
		const userType = user?.type;

		// If explicit actionUrl is provided, use it
		if (data.actionUrl) return data.actionUrl;

		// Smart routing based on notification type
		switch (type) {
			case 'shipment_created':
			case 'shipment_status_changed':
			case 'shipment_arrived':
			case 'shipment_completed':
				if (data.shipmentId) {
					return userType === 'employee' || userType === 'admin'
						? `/employee-shipment/${data.shipmentId}`
						: `/shipment-history/${data.shipmentId}`;
				}
				break;

			case 'document_uploaded':
			case 'document_approved':
			case 'document_rejected':
				if (data.shipmentId) {
					return userType === 'employee' || userType === 'admin'
						? `/employee-shipment/${data.shipmentId}`
						: `/shipment-history/${data.shipmentId}`;
				}
				break;

			case 'acid_created':
			case 'acid_issued':
				if (data.acidRequestId) {
					return userType === 'employee' || userType === 'admin'
						? `/employee/acid-request/${data.acidRequestId}`
						: `/acid-request/${data.acidRequestId}`;
				}
				break;

			case 'ucr_created':
			case 'ucr_approved':
				if (data.ucrRequestId) {
					return userType === 'employee' || userType === 'admin'
						? `/employee/ucr-request/${data.ucrRequestId}`
						: `/ucr-request/${data.ucrRequestId}`;
				}
				break;

			case 'payment_reminder':
			case 'payment_received':
				return userType === 'employee' || userType === 'admin'
					? '/employee-payments'
					: '/client-payments';

			case 'chat_message':
				return userType === 'employee' || userType === 'admin'
					? '/support-dashboard'
					: '/chat';

			default:
				break;
		}

		// Fallback to home
		return userType === 'employee' || userType === 'admin' ? '/employeedashboard' : '/home';
	};

	// Handle action button click
	const handleActionClick = () => {
		const url = getActionUrl();
		navigate(url);
	};

	// Check if we have a valid action
	const hasValidAction = () => {
		const data = notification?.data || {};
		const type = notification?.type;
		
		// Always show button if:
		// - Has explicit actionUrl
		// - Has shipmentId for shipment-related notifications
		// - Has acidRequestId for ACID notifications
		// - Has ucrRequestId for UCR notifications
		// - Is a payment or chat notification
		
		if (data.actionUrl) return true;
		if (data.shipmentId) return true;
		if (data.acidRequestId) return true;
		if (data.ucrRequestId) return true;
		if (['payment_reminder', 'payment_received', 'chat_message'].includes(type)) return true;
		
		return false;
	};

	// Loading State
	if (loading) {
		return (
			<div className={`min-h-screen ${theme.bg}`}>
				<Header />
				<div className="max-w-4xl mx-auto px-4 py-24">
					<div className="flex flex-col justify-center items-center h-64 gap-4">
						<div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${accent.border}`}></div>
						<p className={theme.textSub}>جاري تحميل الإشعار...</p>
					</div>
				</div>
			</div>
		);
	}

	// Not Found State
	if (!notification) {
		return (
			<div className={`min-h-screen ${theme.bg}`}>
				<Header />
				<div className="max-w-4xl mx-auto px-4 py-24">
					<div className="text-center py-12 flex flex-col items-center gap-4">
						<div className={`w-20 h-20 rounded-full ${accent.bgLight} flex items-center justify-center`}>
							<AlertCircle className={`w-10 h-10 ${accent.text}`} />
						</div>
						<p className={`${theme.textSub} text-lg`}>الإشعار غير موجود</p>
						<button
							onClick={() => navigate("/home")}
							className={`mt-4 ${accent.text} hover:underline font-medium flex items-center gap-2`}
						>
							<ArrowRight className="w-4 h-4" />
							العودة للرئيسية
						</button>
					</div>
				</div>
			</div>
		);
	}

	const priorityInfo = getPriorityInfo(notification.priority);

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
			<div className="max-w-4xl mx-auto px-4 py-24">
				{/* Back Button */}
				<button
					onClick={() => navigate(-1)}
					className={`flex items-center gap-2 ${theme.textSub} ${accent.text.replace('text-', 'hover:text-')} mb-6 transition-colors group`}
				>
					<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
					<span className="font-medium">رجوع</span>
				</button>

				{/* Notification Card */}
				<div className={`${theme.cardBg} rounded-3xl shadow-2xl overflow-hidden border ${theme.cardBorder} backdrop-blur-sm`}>
					{/* Header */}
					<div className={`bg-gradient-to-r ${accent.gradient} text-white p-8`}>
						<div className="flex items-start gap-5">
							<div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
								{getNotificationIcon(notification.type)}
							</div>
							<div className="flex-1">
								<h1 className="text-2xl md:text-3xl font-bold mb-3">{notification.title}</h1>
								<div className="flex flex-wrap items-center gap-3 text-sm opacity-90">
									<span className="flex items-center gap-1.5">
										<Calendar className="w-4 h-4" />
										{formatNotificationTime(notification.createdAt)}
									</span>
									<span className={`px-3 py-1 rounded-full text-xs font-bold ${priorityInfo.color}`}>
										{priorityInfo.icon} {priorityInfo.label}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Content */}
					<div className="p-6 md:p-8">
						<div className="prose max-w-none">
							<p className={`${theme.text} text-lg leading-relaxed`}>
								{notification.message}
							</p>
						</div>

						{/* Additional Data */}
						{notification.data && Object.keys(notification.data).length > 0 && (
							<div className={`mt-8 p-5 ${accent.bgLight} rounded-2xl border ${theme.divider}`}>
								<h3 className={`font-bold ${theme.text} mb-4 flex items-center gap-2`}>
									<FileText className={`w-5 h-5 ${accent.text}`} />
									التفاصيل الإضافية
								</h3>
								<div className="space-y-3">
									{notification.data.shipmentId && (
										<div className="flex justify-between items-center">
											<span className={theme.textSub}>رقم الشحنة:</span>
											<span className={`font-bold ${theme.text}`}>{notification.data.shipmentId}</span>
										</div>
									)}
									{notification.data.documentType && (
										<div className="flex justify-between items-center">
											<span className={theme.textSub}>نوع المستند:</span>
											<span className={`font-bold ${theme.text}`}>{notification.data.documentType}</span>
										</div>
									)}
									{notification.data.reason && (
										<div className="flex flex-col gap-1 pt-2 border-t border-dashed border-red-300/50">
											<span className={theme.textSub}>السبب:</span>
											<span className="font-medium text-red-500">{notification.data.reason}</span>
										</div>
									)}
									{notification.data.amount && (
										<div className="flex justify-between items-center">
											<span className={theme.textSub}>المبلغ:</span>
											<span className={`font-bold ${theme.text}`}>{notification.data.amount} جنيه</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Action Button - Always show for valid notification types */}
						{hasValidAction() && (
							<div className="mt-8">
								<button
									onClick={handleActionClick}
									className={`w-full ${accent.button} text-white py-4 px-6 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3`}
								>
									<ExternalLink className="w-5 h-5" />
									عرض التفاصيل
								</button>
							</div>
						)}

						{/* Sender Info */}
						{notification.senderId && (
							<div className={`mt-8 pt-6 border-t ${theme.divider}`}>
								<div className="flex items-center gap-4">
									<div className={`w-12 h-12 ${accent.bgLight} rounded-full flex items-center justify-center ring-2 ring-white/20`}>
										<User className={`w-6 h-6 ${accent.text}`} />
									</div>
									<div>
										<p className={`text-sm ${theme.textSub}`}>المرسل</p>
										<p className={`font-bold ${theme.text}`}>
											{notification.senderId.fullname || notification.senderId.username}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default NotificationPage;
