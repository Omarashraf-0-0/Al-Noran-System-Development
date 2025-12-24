import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import RevenueComparison from "../components/RevenueComparison";
import MostActiveCustomers from "../components/MostActiveCustomers";
import Footer from "../components/Footer";

// Stat Card Component
const StatCard = ({ title, value, icon, color, subValue, theme }) => (
	<div className={`${theme.card} p-5 rounded-2xl border transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden group`}>
		<div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
		<div className="relative z-10 flex justify-between items-start">
			<div>
				<p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>{title}</p>
				<h3 className={`text-2xl font-bold ${theme.textPrimary}`}>{value}</h3>
				{subValue && <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
					<span>↑</span> {subValue} 
				</p>}
			</div>
			<div className={`p-3 rounded-xl ${color} bg-opacity-10 text-xl border border-current opacity-80`}>
				{icon}
			</div>
		</div>
	</div>
);

const AdminDashboard = () => {
	const { isDarkMode } = useTheme();
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState({
		seaCurrent: 0,
		airCurrent: 0,
		customsCompleted: 0,
		pendingInvoices: 0,
		approvedInvoices: 0,
		revenueEGP: 0,
		revenueUSD: 0,
		totalPayments: 0,
	});
	
	const user = JSON.parse(localStorage.getItem("user"));
	const adminName = user?.fullname || user?.username || "المدير";

	// Theme classes - GOLD ADMIN DESIGN (Aligned with AdminProfile)
	const theme = {
		pageBg: isDarkMode 
			? "bg-[#1a1600]" 
			: "bg-[#FFFDF5]",
		headerBg: isDarkMode
			? "bg-gradient-to-r from-[#B8860B] to-[#5c4d0e]" 
			: "bg-gradient-to-r from-[#D4AF37] to-[#B8860B]",
		card: isDarkMode 
			? "bg-[#2d2600] border-[#4a3f00]" 
			: "bg-white border-[#D4AF37]/20 shadow-sm",
		textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-gray-900",
		textSecondary: isDarkMode ? "text-[#D4AF37]/60" : "text-gray-500",
		accentText: "text-[#D4AF37]",
	};

	useEffect(() => {
		const loadStats = async () => {
			try {
				const token = localStorage.getItem("token");
				if (!token) return;

				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/shipments/get-dashboard-stats`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				
				const data = response.data;
				setStats({
					seaCurrent: data.ongoingSeaShipments || 0,
					airCurrent: data.ongoingAirShipments || 0,
					customsCompleted: data.completedShipments || 0,
					pendingInvoices: data.ongoingInvoices || 0,
					approvedInvoices: data.completedInvoices || 0,
					revenueEGP: data.poundRevenue || 0,
					revenueUSD: data.dollarRevenue || 0,
					totalPayments: data.totalPayments || 0,
				});
				setLoading(false);
			} catch (err) {
				console.error("Dashboard stats error:", err);
				toast.error("فشل تحميل الإحصائيات");
				setLoading(false);
			}
		};
		
		loadStats();
	}, []);

	const formatUpdates = (val) => val ? val.toLocaleString() : "0";
	const formatCurrency = (val, curr) => 
		`${val ? val.toLocaleString() : "0"} ${curr}`;

	return (
		<div className={`min-h-screen ${theme.pageBg} transition-colors duration-300 font-sans relative overflow-hidden`} dir="rtl">
			<style>{`
				@keyframes float-slow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
				.animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
			`}</style>

			{/* Background Blobs */}
			<div className="fixed inset-0 pointer-events-none">
				<div className={`absolute top-20 right-[-10%] w-[500px] h-[500px] rounded-full filter blur-[120px] opacity-20 ${isDarkMode ? "bg-[#D4AF37]" : "bg-[#D4AF37]"}`}></div>
				<div className={`absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full filter blur-[100px] opacity-10 ${isDarkMode ? "bg-[#B8860B]" : "bg-[#B8860B]"}`}></div>
			</div>

			<Header />

			<main className="relative pt-28 pb-12 px-4 md:px-6 max-w-7xl mx-auto space-y-8 z-10">
				
				{/* 1. Welcome Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div>
						<h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
							مرحباً، <span className={theme.accentText}>{adminName}</span> 👋
						</h1>
						<p className={`${theme.textSecondary}`}>نظرة عامة على أداء النظام اليوم</p>
					</div>
					<div className="flex gap-3">
						<Link to="/employeedashboard" className={`px-5 py-2.5 rounded-xl font-bold transition-all ${isDarkMode ? "bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20" : "bg-white text-[#B8860B] shadow-sm hover:shadow-md border border-[#D4AF37]/20"}`}>
							لوحة الموظف 👔
						</Link>
						<button onClick={() => window.location.reload()} className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37] to-[#B8860B]`}>
							تحديث البيانات 🔄
						</button>
					</div>
				</div>

				{/* 2. Stats Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<StatCard 
						title="شحنات بحرية جارية" 
						value={formatUpdates(stats.seaCurrent)} 
						icon="🚢" 
						color="text-blue-500 bg-blue-500" 
						theme={theme}
					/>
					<StatCard 
						title="شحنات جوية جارية" 
						value={formatUpdates(stats.airCurrent)} 
						icon="✈️" 
						color="text-sky-400 bg-sky-400" 
						theme={theme}
					/>
					<StatCard 
						title="شهادات مكتملة" 
						value={formatUpdates(stats.customsCompleted)} 
						icon="✅" 
						color="text-green-500 bg-green-500" 
						theme={theme}
					/>
					<StatCard 
						title="فواتير معلقة" 
						value={formatUpdates(stats.pendingInvoices)} 
						icon="⏳" 
						color="text-amber-500 bg-amber-500" 
						theme={theme}
					/>
				</div>

				{/* 3. Financial Stats */}
				<div className={`grid grid-cols-1 lg:grid-cols-3 gap-6`}>
					<div className={`${theme.card} p-6 rounded-2xl border relative overflow-hidden lg:col-span-2`}>
						<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-transparent"></div>
						<h3 className={`text-lg font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
							<span className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">💰</span>
							الإيرادات المالية
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className={`p-4 rounded-xl ${isDarkMode ? "bg-[#1a1600]/50" : "bg-gray-50"} border ${isDarkMode ? "border-[#D4AF37]/10" : "border-gray-100"}`}>
								<p className={`text-sm ${theme.textSecondary} mb-1`}>إجمالي الإيرادات (ج.م)</p>
								<p className={`text-2xl font-bold ${theme.textPrimary}`}>{formatCurrency(stats.revenueEGP, "EGP")}</p>
							</div>
							<div className={`p-4 rounded-xl ${isDarkMode ? "bg-[#1a1600]/50" : "bg-gray-50"} border ${isDarkMode ? "border-[#D4AF37]/10" : "border-gray-100"}`}>
								<p className={`text-sm ${theme.textSecondary} mb-1`}>إجمالي الإيرادات (USD)</p>
								<p className={`text-2xl font-bold ${theme.textPrimary}`}>{formatCurrency(stats.revenueUSD, "$")}</p>
							</div>
						</div>
					</div>

					<div className={`${theme.card} p-6 rounded-2xl border relative overflow-hidden`}>
						<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent"></div>
						<h3 className={`text-lg font-bold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
							<span className="p-2 rounded-lg bg-red-500/10 text-red-500">💳</span>
							المدفوعات
						</h3>
						<div className="mt-2">
							<p className={`text-sm ${theme.textSecondary} mb-1`}>إجمالي المدفوعات المسجلة</p>
							<p className={`text-3xl font-bold ${theme.textPrimary}`}>{formatUpdates(stats.totalPayments)}</p>
							<p className={`text-xs ${theme.textSecondary} mt-2`}>عمليات دفع تمت عبر النظام</p>
						</div>
					</div>
				</div>

				{/* 4. Charts Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className={`${theme.card} p-1 rounded-2xl border overflow-hidden`}>
						{/* Reusing existing components but wrapped in themed container */}
						<MostActiveCustomers /> 
					</div>
					<div className={`${theme.card} p-1 rounded-2xl border overflow-hidden`}>
						<RevenueComparison />
					</div>
				</div>

			</main>
			
			{/* <Footer /> */}
		</div>
	);
};

export default AdminDashboard;
