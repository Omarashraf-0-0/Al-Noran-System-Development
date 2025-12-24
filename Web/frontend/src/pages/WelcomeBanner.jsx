import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import PropTypes from "prop-types";
import bannerImage from "../assets/images/Untitled design (7) 1.png";
import contractImage from "../assets/images/contract.png";
import axios from "axios";
import { toast } from "react-hot-toast";

const StatCard = ({ value, label }) => (
	<div className="bg-white rounded-lg shadow-md p-4 flex-1 flex items-center justify-between">
		{/* Icon on the right */}
		<div className="flex-shrink-0 ml-4">
			<img
				src={contractImage}
				alt="Status Icon"
				className="w-8 h-8 object-contain"
			/>
		</div>

		{/* Text on the left */}
		<div className="text-right flex-1">
			<p className="text-sm text-gray-500">{label}</p>
			<p className="text-lg font-bold text-gray-800">{value}</p>
		</div>
	</div>
);

StatCard.propTypes = {
	value: PropTypes.string,
	label: PropTypes.string,
};

const WelcomeBanner = ({ customStats }) => {
	const user = JSON.parse(localStorage.getItem("user"));
	const userName = user?.username || user?.fullname || user?.name || "الزائر";
	const userID = user?.id || user?._id;
	const userType = user?.type || user?.userType || user?.role; // Check multiple properties for user type
	const token = localStorage.getItem("token");
	const { isDarkMode } = useTheme();

	const [stats, setStats] = useState({
		completed: 0,
		inProgress: 0,
		total: 0,
	});
	const [loading, setLoading] = useState(true);

	// Check user type for theme
	const isEmployee = userType === "employee";
	const isAdmin = userType === "admin";
	
	const themeColors = (isEmployee || isAdmin) ? {
		greeting: isDarkMode ? "text-[#1ba3b6]" : "text-[#1ba3b6]",
		textSecondary: isDarkMode ? "text-cyan-50" : "text-gray-600",
		cardBorder: isDarkMode ? "border-white/20" : "border-[#1ba3b6]/20",
		cardBg: isDarkMode ? "bg-white/10" : "bg-white",
		cardText: isDarkMode ? "text-white" : "text-gray-800",
		cardSubText: isDarkMode ? "text-cyan-100" : "text-[#1ba3b6]",
		highlightBg: isDarkMode ? "bg-[#1ba3b6]/20" : "bg-[#1ba3b6]/10",
	} : {
		greeting: "text-red-800",
		textSecondary: "text-gray-500",
		cardBorder: "border-red-50",
		cardBg: "bg-white",
		cardText: "text-gray-800",
		cardSubText: "text-gray-500",
		highlightBg: "bg-green-50",
	};

	useEffect(() => {
		if (customStats) {
			setLoading(false);
			return;
		}

		const fetchStats = async () => {
			try {
				if (!userID) {
					console.error("User ID not found");
					setLoading(false);
					return;
				}

				// Determine endpoint based on user type
				const endpoint = (isEmployee || isAdmin)
					? `${
							import.meta.env.VITE_API_URL
					  }/api/shipments/employee/${userID}/stats`
					: `${
							import.meta.env.VITE_API_URL
					  }/api/shipments/user/${userID}/stats`;

				const response = await axios.get(endpoint, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.data.success) {
					setStats(response.data.stats);
				}
			} catch (error) {
				console.error("Error fetching shipment stats:", error);
				// toast.error("فشل في تحميل إحصائيات الشحنات");
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, [userID, userType, token, isEmployee, isAdmin, customStats]);

	// Use customStats if provided, otherwise default to fetched stats
	const displayStats = customStats || stats;

	return (
		<section className="relative w-full mb-6">
			{/* Compact Hero Section */}
			<div className="text-center py-3 space-y-2">
				<h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${themeColors.greeting} drop-shadow-sm`}>
					مرحباً، <span className="opacity-90">{userName}</span> 👋
				</h1>
				<p className={`text-base md:text-lg font-medium ${themeColors.textSecondary} opacity-80 max-w-xl mx-auto leading-relaxed`}>
					{isEmployee || isAdmin 
						? "تابع أداء العمل وحالة الشحنات لحظة بلحظة."
						: "تابع شحناتك ومعاملاتك بكل سهولة."}
				</p>
			</div>

			{/* Stats Cards - Compact Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
				
				{/* Card 1: Total Shipments / Completed */}
				<div className={`relative overflow-hidden group p-4 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
					isEmployee || isAdmin 
						? `${themeColors.cardBg} ${themeColors.cardBorder} hover:shadow-[#1ba3b6]/10` 
						: "bg-white border-red-50 hover:border-red-100 shadow-red-500/5"
				}`}>
					<div className="flex items-center justify-between relative z-10">
						<div>
							<p className={`text-xs font-bold mb-1 ${themeColors.cardSubText}`}>
								{customStats ? "إجمالي الشحنات" : "الشحنات المكتملة"}
							</p>
							<h3 className={`text-2xl font-black ${themeColors.cardText}`}>
								{loading ? "..." : (customStats ? displayStats.total : displayStats.completed)}
							</h3>
						</div>
						<div className={`p-3 rounded-lg ${isEmployee || isAdmin ? "bg-[#1ba3b6]/20 text-[#1ba3b6]" : "bg-green-50 text-green-600"}`}>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						</div>
					</div>
					<div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${
						isEmployee || isAdmin ? "bg-[#1ba3b6]" : "bg-green-500"
					}`}></div>
				</div>

				{/* Card 2: Import / In Progress */}
				<div className={`relative overflow-hidden group p-4 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
					isEmployee || isAdmin 
						? `${themeColors.cardBg} ${themeColors.cardBorder} hover:shadow-[#1ba3b6]/10` 
						: "bg-white border-red-50 hover:border-red-100 shadow-red-500/5"
				}`}>
					<div className="flex items-center justify-between relative z-10">
						<div>
							<p className={`text-xs font-bold mb-1 ${themeColors.cardSubText}`}>
								{customStats ? "شحنات الوارد" : "قيد التوصيل"}
							</p>
							<h3 className={`text-2xl font-black ${themeColors.cardText}`}>
								{loading ? "..." : (customStats ? displayStats.importCount : displayStats.inProgress)}
							</h3>
						</div>
						<div className={`p-3 rounded-lg ${isEmployee || isAdmin ? "bg-amber-400/20 text-amber-400" : "bg-orange-50 text-orange-600"}`}>
							{customStats ? (
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> // Package
							) : (
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
							)}
						</div>
					</div>
					<div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${
						isEmployee || isAdmin ? "bg-amber-400" : "bg-orange-500"
					}`}></div>
				</div>

				{/* Card 3: Export / Total (Legacy) */}
				<div className={`relative overflow-hidden group p-4 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
					isEmployee || isAdmin 
						? `${themeColors.cardBg} ${themeColors.cardBorder} hover:shadow-[#1ba3b6]/10` 
						: "bg-white border-red-50 hover:border-red-100 shadow-red-500/5"
				}`}>
					<div className="flex items-center justify-between relative z-10">
						<div>
							<p className={`text-xs font-bold mb-1 ${themeColors.cardSubText}`}>
								{customStats ? "شحنات الصادر" : "إجمالي العمليات"}
							</p>
							<h3 className={`text-2xl font-black ${themeColors.cardText}`}>
								{loading ? "..." : (customStats ? displayStats.exportCount : (displayStats.completed + displayStats.inProgress))}
							</h3>
						</div>
						<div className={`p-3 rounded-lg ${isEmployee || isAdmin ? "bg-purple-400/20 text-purple-400" : "bg-blue-50 text-blue-600"}`}>
							{customStats ? (
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> // Ship container
							) : (
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
							)}
						</div>
					</div>
					<div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${
						isEmployee || isAdmin ? "bg-purple-400" : "bg-blue-500"
					}`}></div>
				</div>
			</div>
		</section>
	);
};

export default WelcomeBanner;
