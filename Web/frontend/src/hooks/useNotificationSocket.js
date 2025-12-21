import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

/**
 * Hook to initialize Socket.IO connection for real-time notifications
 * Should be called once at the App level to ensure notifications work across all pages
 */
export const useNotificationSocket = () => {
	const socketRef = useRef(null);

	useEffect(() => {
		// Get token from localStorage
		const token = localStorage.getItem("token");
		const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";
		
		// Safely parse user object
		let user = {};
		try {
			const userStr = localStorage.getItem("user");
			if (userStr) {
				user = JSON.parse(userStr);
			}
		} catch (e) {
			console.error("Error parsing user from localStorage:", e);
		}

		// Only initialize if user is logged in
		if (!token || !user._id) {
			console.log('NotificationSocket: No token or user ID available');
			return;
		}

		console.log('NotificationSocket: Initializing with user:', user._id);

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
			console.log('✅ Socket connected for notifications');
			socket.emit('identify', { userId: user._id, userType: user.type || user.role || 'client' });
		});

		// Listen for new notifications
		socket.on('new_notification', (data) => {
			console.log('🔔 New notification received:', data);
			
			// Show toast notification
			const notification = data.notification || data;
			toast.success(notification.title || notification.message, {
				icon: getNotificationIcon(notification.type),
				duration: 4000,
				position: 'top-left',
			});

			// Play notification sound (optional)
			try {
				const audio = new Audio('/notification.mp3');
				audio.volume = 0.5;
				audio.play().catch(() => console.log('Could not play notification sound'));
			} catch {
				// Sound not critical, ignore errors
			}

			// Request browser notification permission if not already granted
			if ('Notification' in window && Notification.permission === 'default') {
				Notification.requestPermission();
			}

			// Show browser notification if permitted
			if ('Notification' in window && Notification.permission === 'granted') {
				const browserNotif = new Notification(notification.title || 'إشعار جديد', {
					body: notification.message,
					icon: '/vite.svg',
					badge: '/vite.svg',
					dir: 'rtl',
					lang: 'ar',
				});

				browserNotif.onclick = () => {
					window.focus();
					browserNotif.close();
				};

				setTimeout(() => browserNotif.close(), 5000);
			}
		});

		socket.on('disconnect', () => {
			console.log('⚠️ Socket disconnected from notifications');
		});

		socket.on('connect_error', (error) => {
			console.error('❌ Socket connection error:', error);
		});

		// Request browser notification permission after 2 seconds
		const permissionTimer = setTimeout(() => {
			if ('Notification' in window && Notification.permission === 'default') {
				console.log('📢 Requesting browser notification permission...');
				Notification.requestPermission().then(permission => {
					console.log(`🔔 Notification permission: ${permission}`);
				});
			}
		}, 2000);

		// Cleanup on unmount
		return () => {
			clearTimeout(permissionTimer);
			if (socketRef.current) {
				console.log('🔌 Disconnecting notification socket');
				socketRef.current.disconnect();
			}
		};
	}, []); // Empty dependency array - initialize once on mount

	return socketRef;
};

// Helper function to get notification icon emoji
const getNotificationIcon = (type) => {
	const icons = {
		registration: "👋",
		document_uploaded: "📄",
		document_approved: "✅",
		document_rejected: "❌",
		document_requested: "📋",
		acid_created: "🆕",
		acid_reviewing: "🔍",
		acid_issued: "✅",
		acid_rejected: "❌",
		shipment_created: "📦",
		shipment_status_changed: "🔄",
		shipment_arrived: "✈️",
		shipment_completed: "✅",
		shipment_documents_requested: "📋",
		payment_received: "💰",
		payment_approved: "✅",
		payment_rejected: "❌",
		payment_reminder: "⏰",
		payment_failed: "❌",
		message_received: "💬",
		ucr_created: "🆕",
		ucr_reviewing: "🔍",
		ucr_approved: "✅",
		ucr_rejected: "❌",
		ucr_certificate_issued: "📜",
		system_alert: "⚠️",
		default: "🔔",
	};
	return icons[type] || icons.default;
};
