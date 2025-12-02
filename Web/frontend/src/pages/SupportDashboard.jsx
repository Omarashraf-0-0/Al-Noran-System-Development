import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import ChatInterface from "../components/ChatInterface";
import Header from "../components/Header";
import Footer from "../components/Footer";

const SupportDashboard = () => {
	const [stats, setStats] = useState({
		active: 0,
		pending: 0,
		resolved: 0,
		onlineEmployees: 0,
	});
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const mountedRef = React.useRef(false);

	useEffect(() => {
		if (mountedRef.current) return;
		mountedRef.current = true;
		
		const user = JSON.parse(localStorage.getItem("user") || "null");
		const token = localStorage.getItem("token");

		if (!token || !user) {
			toast.error("الرجاء تسجيل الدخول");
			navigate("/login");
			return;
		}

		if (user.type !== "employee") {
			toast.error("غير مصرح لك بالوصول");
			navigate("/");
			return;
		}

		loadStats(token);
	}, [navigate]);

	const loadStats = async (token) => {
		try {
			setLoading(true);

			const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";

			// Get all chats
			const chatsResponse = await axios.get(
				`${apiUrl}/api/chat`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (chatsResponse.data.success) {
				const chats = chatsResponse.data.chats;
				setStats({
					active: chats.filter((c) => c.status === "active").length,
					pending: chats.filter((c) => c.status === "pending").length,
					resolved: chats.filter((c) => c.status === "resolved").length,
					onlineEmployees: 0, // Will be updated via WebSocket
				});
			}

			// Get online employees
			const employeesResponse = await axios.get(
				`${apiUrl}/api/chat/employees/online`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (employeesResponse.data.success) {
				setStats((prev) => ({
					...prev,
					onlineEmployees: employeesResponse.data.count,
				}));
			}
		} catch (error) {
			console.error("Error loading stats:", error);
			// Don't show error toast, just log it
			setStats({
				active: 0,
				pending: 0,
				resolved: 0,
				onlineEmployees: 0,
			});
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col min-h-screen">
				<Header />
				<div className="flex-grow flex items-center justify-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-screen bg-gray-50">
			<Header />
			<main className="flex-grow py-8" dir="rtl">
				<div className="container mx-auto px-4">
				{/* Page Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						لوحة الدعم الفني
					</h1>
					<p className="text-gray-600">إدارة محادثات العملاء والدعم الفني</p>
				</div>

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-lg shadow p-6 border-r-4 border-blue-500">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm mb-1">محادثات نشطة</p>
								<p className="text-3xl font-bold text-gray-900">{stats.active}</p>
							</div>
							<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
								<svg
									className="w-6 h-6 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow p-6 border-r-4 border-yellow-500">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm mb-1">في الانتظار</p>
								<p className="text-3xl font-bold text-gray-900">
									{stats.pending}
								</p>
							</div>
							<div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
								<svg
									className="w-6 h-6 text-yellow-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow p-6 border-r-4 border-green-500">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm mb-1">محادثات منتهية</p>
								<p className="text-3xl font-bold text-gray-900">
									{stats.resolved}
								</p>
							</div>
							<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
								<svg
									className="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow p-6 border-r-4 border-red-900">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm mb-1">موظفون متصلون</p>
								<p className="text-3xl font-bold text-gray-900">
									{stats.onlineEmployees}
								</p>
							</div>
							<div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
								<svg
									className="w-6 h-6 text-red-900"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Chat Interface */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<ChatInterface />
				</div>
			</div>
		</main>
		<Footer />
	</div>
	);
};

export default SupportDashboard;
