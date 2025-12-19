import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";

const NotificationPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const [notification, setNotification] = useState(location.state?.notification || null);
	const [loading, setLoading] = useState(!location.state?.notification);

	const token = localStorage.getItem("token");
	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";

	useEffect(() => {
		// If notification data was passed through navigation state, use it
		if (location.state?.notification) {
			setNotification(location.state.notification);
			setLoading(false);
			return;
		}

		// Otherwise, fetch from API (for direct URL access)
		const fetchNotification = async () => {
			try {
				setLoading(true);

				// Fetch the notification details
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
			low: { color: "bg-gray-100 text-gray-700", label: "عادي" },
			medium: { color: "bg-blue-100 text-blue-700", label: "متوسط" },
			high: { color: "bg-orange-100 text-orange-700", label: "مهم" },
			urgent: { color: "bg-red-100 text-red-700", label: "عاجل" },
		};
		return priorities[priority] || priorities.medium;
	};

	// Handle action button click
	const handleActionClick = () => {
		if (notification?.data?.actionUrl) {
			navigate(notification.data.actionUrl);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="max-w-4xl mx-auto px-4 py-8">
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div>
					</div>
				</div>
			</div>
		);
	}

	if (!notification) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="max-w-4xl mx-auto px-4 py-8">
					<div className="text-center py-12">
						<p className="text-gray-500 text-lg">الإشعار غير موجود</p>
						<button
							onClick={() => navigate("/home")}
							className="mt-4 text-red-800 hover:text-red-900 font-medium"
						>
							← العودة للرئيسية
						</button>
					</div>
				</div>
			</div>
		);
	}

	const priorityInfo = getPriorityInfo(notification.priority);

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* Back Button */}
				<button
					onClick={() => navigate(-1)}
					className="flex items-center gap-2 text-gray-600 hover:text-red-800 mb-6 transition"
				>
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					<span>رجوع</span>
				</button>

				{/* Notification Card */}
				<div className="bg-white rounded-lg shadow-lg overflow-hidden">
					{/* Header */}
					<div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-6">
						<div className="flex items-start gap-4">
							<span className="text-5xl">{getNotificationIcon(notification.type)}</span>
							<div className="flex-1">
								<h1 className="text-2xl font-bold mb-2">{notification.title}</h1>
								<div className="flex items-center gap-3 text-sm opacity-90">
									<span>{formatNotificationTime(notification.createdAt)}</span>
									<span className={`px-2 py-1 rounded-full text-xs ${priorityInfo.color}`}>
										{priorityInfo.label}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Content */}
					<div className="p-6">
						<div className="prose max-w-none">
							<p className="text-gray-700 text-lg leading-relaxed">
								{notification.message}
							</p>
						</div>

						{/* Additional Data */}
						{notification.data && Object.keys(notification.data).length > 0 && (
							<div className="mt-6 p-4 bg-gray-50 rounded-lg">
								<h3 className="font-bold text-gray-800 mb-3">التفاصيل الإضافية</h3>
								<div className="space-y-2">
									{notification.data.shipmentId && (
										<div className="flex justify-between">
											<span className="text-gray-600">رقم الشحنة:</span>
											<span className="font-medium">{notification.data.shipmentId}</span>
										</div>
									)}
									{notification.data.documentType && (
										<div className="flex justify-between">
											<span className="text-gray-600">نوع المستند:</span>
											<span className="font-medium">{notification.data.documentType}</span>
										</div>
									)}
									{notification.data.reason && (
										<div className="flex flex-col gap-1">
											<span className="text-gray-600">السبب:</span>
											<span className="font-medium text-red-700">{notification.data.reason}</span>
										</div>
									)}
									{notification.data.amount && (
										<div className="flex justify-between">
											<span className="text-gray-600">المبلغ:</span>
											<span className="font-medium">{notification.data.amount} جنيه</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Action Button */}
						{notification.data?.actionUrl && (
							<div className="mt-6">
								<button
									onClick={handleActionClick}
									className="w-full bg-gradient-to-r from-red-800 to-red-900 text-white py-3 px-6 rounded-lg font-bold hover:from-red-900 hover:to-red-950 transition-all shadow-md hover:shadow-lg"
								>
									عرض التفاصيل
								</button>
							</div>
						)}

						{/* Sender Info */}
						{notification.senderId && (
							<div className="mt-6 pt-6 border-t border-gray-200">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
										<span className="text-gray-600 text-lg">👤</span>
									</div>
									<div>
										<p className="text-sm text-gray-500">المرسل</p>
										<p className="font-medium text-gray-800">
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
