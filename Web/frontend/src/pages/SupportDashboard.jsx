import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import ChatInterface from "../components/ChatInterface";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";

const SupportDashboard = () => {
	const { isDarkMode } = useTheme();
	const [stats, setStats] = useState({
		active: 0,
		pending: 0,
		resolved: 0,
		onlineEmployees: 0,
	});
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const mountedRef = React.useRef(false);

	// Get user from local storage to determine theme accents
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type;
	const employeeType = user?.employeeDetails?.employeeType;

	// Determine Theme Colors based on Role
	const getThemeColors = () => {
		if (userType === "admin" || (userType === "employee" && employeeType === "System Admin")) {
			return {
				primary: "#D4AF37", // Gold
				primaryHover: "#B5952F",
				bgLight: "bg-[#D4AF37]/10",
				bgGlow: "bg-[#D4AF37]/20",
				text: "text-[#D4AF37]",
				border: isDarkMode ? "border-[#D4AF37]/20" : "border-gray-300 shadow-lg",
				gradient: "from-gray-900 to-[#1a1600]",
				cardBg: isDarkMode ? "bg-black/40" : "bg-white",
				statsCardBg: isDarkMode ? "rgba(20, 20, 25, 0.6)" : "rgba(255, 255, 255, 0.95)",
				statsBorder: isDarkMode ? "border-white/10" : "border-gray-300 shadow-lg"
			};
		}
		// Default Employee Theme (Teal/Blue)
		return {
			primary: "#1ba3b6", // Teal
			primaryHover: "#158A9A",
			bgLight: "bg-[#1ba3b6]/10",
			bgGlow: "bg-[#1ba3b6]/20",
			text: "text-[#1ba3b6]",
			border: isDarkMode ? "border-[#1ba3b6]/20" : "border-gray-300 shadow-lg",
			gradient: isDarkMode ? "from-gray-900 to-[#0d2b2e]" : "from-gray-50 to-blue-50",
			cardBg: isDarkMode ? "bg-[#1a1c23]/60" : "bg-white",
			statsCardBg: isDarkMode ? "rgba(20, 20, 25, 0.6)" : "rgba(255, 255, 255, 0.95)",
			statsBorder: isDarkMode ? "border-white/10" : "border-gray-300 shadow-lg"
		};
	};

	const themeColors = getThemeColors();

	useEffect(() => {
		if (mountedRef.current) return;
		mountedRef.current = true;
		
		const token = localStorage.getItem("token");

		if (!token || !user) {
			toast.error("الرجاء تسجيل الدخول");
			navigate("/login");
			return;
		}

		if (user.type !== "employee" && user.type !== "admin") {
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
		} finally {
			setLoading(false);
		}
	};

	const StatCard = ({ title, value, icon, colorClass, delay }) => (
		<div 
			className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 transform hover:-translate-y-1 group animate-fade-in-up ${themeColors.statsBorder}`}
			style={{ 
				animationDelay: `${delay}ms`,
				backgroundColor: themeColors.statsCardBg,
				backdropFilter: "blur(12px)"
			}}
		>
			<div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${colorClass}`}></div>
			
			<div className="relative z-10 flex items-center justify-between">
				<div>
					<p className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600 font-bold"}`}>{title}</p>
					<h3 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{value}</h3>
				</div>
				<div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClass.replace('bg-', 'bg-opacity-10 text-')} ${!isDarkMode && 'border border-gray-100 shadow-sm'}`}>
					{icon}
				</div>
			</div>
			
			{/* Bottom decorative line */}
			<div className={`absolute bottom-0 left-0 h-1 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ${colorClass}`}></div>
		</div>
	);

	if (loading) {
		return (
			<div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50"}`}>
				<Header />
				<div className="flex-grow flex items-center justify-center">
					<div 
						className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent"
						style={{ borderColor: `${themeColors.primary} transparent ${themeColors.primary} ${themeColors.primary}` }}
					></div>
				</div>
			</div>
		);
	}

	return (
		<div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50/50"}`} dir="rtl">
			
			{/* Animated Background Elements */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
				{isDarkMode ? (
					<>
						<div 
							className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full filter blur-[120px] opacity-20 animate-pulse-glow"
							style={{ backgroundColor: themeColors.primary }}
						></div>
						<div 
							className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full filter blur-[150px] opacity-10 animate-float-slow"
							style={{ backgroundColor: themeColors.primary }}
						></div>
					</>
				) : (
					<>
						<div 
							className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full filter blur-[100px] opacity-10"
							style={{ backgroundColor: themeColors.primary }}
						></div>
						<div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-white to-gray-100/50"></div>
					</>
				)}
			</div>

			<Header />

			<main className="flex-grow pt-28 pb-8 px-4 md:px-8 relative z-0">
				<div className="max-w-7xl mx-auto space-y-8">
					
					{/* Header Section */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-down">
						<div>
							<h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
								لوحة الدعم الفني
							</h1>
							<p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
								إدارة محادثات العملاء والمتابعة الحية
							</p>
						</div>
						
						<div className={`px-4 py-2 rounded-full border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} flex items-center gap-2 shadow-sm`}>
							<span className="relative flex h-3 w-3">
							  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${themeColors.bgLight.replace('/10', '')} bg-opacity-100`}></span>
							  <span className={`relative inline-flex rounded-full h-3 w-3 ${themeColors.bgLight.replace('/10', '')} bg-opacity-100`}></span>
							</span>
							<span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
								النظام متصل
							</span>
						</div>
					</div>

					{/* Statistics Grid */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
						<StatCard 
							title="محادثات نشطة" 
							value={stats.active} 
							icon="💬" 
							colorClass="bg-blue-500"
							delay={100} 
						/>
						<StatCard 
							title="في الانتظار" 
							value={stats.pending} 
							icon="⏳" 
							colorClass="bg-amber-500" 
							delay={200}
						/>
						<StatCard 
							title="تم حلها" 
							value={stats.resolved} 
							icon="✅" 
							colorClass="bg-green-500" 
							delay={300}
						/>
						<StatCard 
							title="موظفون متصلون" 
							value={stats.onlineEmployees} 
							icon="👥" 
							colorClass={userType === "admin" ? "bg-[#D4AF37]" : "bg-teal-500"}
							delay={400}
						/>
					</div>

					{/* Chat Interface Container */}
					<div 
						className={`rounded-2xl border overflow-hidden transition-all duration-300 animate-slide-up ${
							isDarkMode 
								? "bg-[#141419]/80 backdrop-blur-md" 
								: "bg-white"
						} ${themeColors.border}`}
						style={{ animationDelay: '500ms' }}
					>
						<div className={`p-4 border-b ${isDarkMode ? "border-white/5 bg-white/5" : "border-gray-200 bg-gray-50/50"}`}>
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-lg ${themeColors.bgLight}`}>
									<svg className={`w-5 h-5 ${themeColors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
									</svg>
								</div>
								<h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
									غرفة المحادثات المباشرة
								</h2>
							</div>
						</div>
						
						<div className="p-1">
							<ChatInterface />
						</div>
					</div>
				</div>
			</main>
			
			{/* <Footer /> */}

			<style>{`
				@keyframes float-slow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
				.animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
				.animate-pulse-glow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
				.animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
				.animate-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; opacity: 0; }
				.animate-slide-up { animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px); }
				
				@keyframes fadeInUp {
					from { opacity: 0; transform: translateY(20px); }
					to { opacity: 1; transform: translateY(0); }
				}
				@keyframes fadeInDown {
					from { opacity: 0; transform: translateY(-20px); }
					to { opacity: 1; transform: translateY(0); }
				}
				@keyframes slideUp {
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>
		</div>
	);
};

export default SupportDashboard;
