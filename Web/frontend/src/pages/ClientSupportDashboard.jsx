import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import ChatInterface from "../components/ChatInterface";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";
import { MessageSquare, Clock, CheckCircle, Users, Headphones } from "lucide-react";

const ClientSupportDashboard = () => {
	const { isDarkMode } = useTheme();
	const [searchParams] = useSearchParams();
	const openChatId = searchParams.get("chatId");
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
		
		const token = localStorage.getItem("token");
		const user = JSON.parse(localStorage.getItem("user") || "{}");

		if (!token || !user) {
			toast.error("الرجاء تسجيل الدخول");
			navigate("/login");
			return;
		}

		if (user.type !== "client") {
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

			// Get my chats
            // Assuming /api/chat returns user-specific chats when called with a client token
            // If backend logic differs, this might need adjustment, but standard practice suggests it should be scoped.
			const chatsResponse = await axios.get(
				`${apiUrl}/api/chat`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (chatsResponse.data.success) {
				const chats = chatsResponse.data.chats || [];
				setStats({
					active: chats.filter((c) => c.status === "active").length,
					pending: chats.filter((c) => c.status === "pending").length,
					resolved: chats.filter((c) => c.status === "resolved").length,
					onlineEmployees: 0, // Will be updated
				});
			}

			// Get online employees count (optional, good for client to know availability)
			const employeesResponse = await axios.get(
				`${apiUrl}/api/chat/employees/online`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			).catch(() => ({ data: { success: false } })); // Fail gracefully if client can't access this

			if (employeesResponse.data.success) {
				setStats((prev) => ({
					...prev,
					onlineEmployees: employeesResponse.data.count,
				}));
			}
		} catch (error) {
			console.error("Error loading stats:", error);
		} finally {
			setLoading(false);
		}
	};

	const StatCard = ({ title, value, icon, colorClass, delay }) => (
		<div 
			className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group animate-in fade-in slide-in-from-bottom-4 ${
                isDarkMode ? "bg-[#1a1010]/80 border-white/10" : "bg-white border-gray-100 shadow-sm"
            }`}
			style={{ animationDelay: `${delay}ms` }}
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
					<div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent border-red-600"></div>
				</div>
			</div>
		);
	}

	return (
		<div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50/50"}`} dir="rtl">
			
			{/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {isDarkMode ? (
                    <>
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-red-900/20 blur-[130px] animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-red-900/10 blur-[120px]"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#1a0505] blur-[100px] -z-10"></div>
                    </>
                ) : (
                    <>
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-red-100/50 blur-[100px]"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-red-50/50 blur-[80px]"></div>
                    </>
                )}
            </div>

			<Header />

			<main className="flex-grow pt-28 pb-8 px-4 md:px-8 relative z-0">
				<div className="max-w-7xl mx-auto space-y-8">
					
					{/* Header Section */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
						<div>
							<h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isDarkMode ? "text-red-500" : "text-red-900"}`}>
								مركز خدمة العملاء
							</h1>
							<p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
								تواصل معنا مباشرة وتابع حالة طلباتك واستفساراتك
							</p>
						</div>
						
						<div className={`px-4 py-2 rounded-full border ${isDarkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50 border-red-200"} flex items-center gap-2 shadow-sm`}>
							<span className="relative flex h-3 w-3">
							  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400"></span>
							  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
							</span>
							<span className={`text-sm font-medium ${isDarkMode ? "text-red-300" : "text-red-800"}`}>
								فريق الدعم متاح
							</span>
						</div>
					</div>

					{/* Statistics Grid */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
						<StatCard 
							title="محادثاتك النشطة" 
							value={stats.active} 
							icon={<MessageSquare size={24} />}
							colorClass="bg-red-600"
							delay={100} 
						/>
						<StatCard 
							title="قيد المراجعة" 
							value={stats.pending} 
							icon={<Clock size={24} />}
							colorClass="bg-red-500" 
							delay={200}
						/>
						<StatCard 
							title="تم إغلاقها" 
							value={stats.resolved} 
							icon={<CheckCircle size={24} />}
							colorClass="bg-red-400" 
							delay={300}
						/>
						<StatCard 
							title="وكلاء متصلون" 
							value={stats.onlineEmployees} 
							icon={<Headphones size={24} />}
							colorClass="bg-red-700"
							delay={400}
						/>
					</div>

					{/* Chat Interface Container */}
					<div 
						className={`rounded-2xl border overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 duration-700 ${
							isDarkMode 
								? "bg-[#140a0a]/90 backdrop-blur-md border-red-900/20" 
								: "bg-white border-red-100 shadow-xl"
						}`}
					>
						<div className={`p-4 border-b ${isDarkMode ? "border-red-900/10 bg-red-900/5" : "border-red-100 bg-red-50/50"}`}>
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-lg ${isDarkMode ? "bg-red-900/20 text-red-500" : "bg-red-100 text-red-700"}`}>
                                    <Headphones size={20} />
								</div>
								<h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
									تواصل مع الدعم الفني
								</h2>
							</div>
						</div>
						
						<div className="p-1">
							<ChatInterface preselectedChatId={openChatId} />
						</div>
					</div>
				</div>
			</main>
			
			<Footer />
		</div>
	);
};

export default ClientSupportDashboard;
