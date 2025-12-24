import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Home, ArrowRight, HelpCircle, FileText, MessageCircle, Search } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Header from "../components/Header";

const NotFound404 = () => {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	
	// Get user info
	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type || "guest";

	// Color scheme based on user type
	const getColorScheme = () => {
		switch (userType) {
			case "employee":
				return {
					primary: isDarkMode ? "text-cyan-400" : "text-[#1ba3b6]",
					primaryBg: isDarkMode ? "bg-cyan-500" : "bg-[#1ba3b6]",
					primaryBgHover: isDarkMode ? "hover:bg-cyan-600" : "hover:bg-[#158a9a]",
					secondaryBg: isDarkMode ? "bg-cyan-900/20" : "bg-cyan-50",
					border: isDarkMode ? "border-cyan-900/30" : "border-cyan-200",
					gradient: isDarkMode ? "from-cyan-900/30" : "from-cyan-50/80",
					accent404: isDarkMode ? "text-cyan-500" : "text-[#1ba3b6]",
				};
			case "admin":
				return {
					primary: isDarkMode ? "text-purple-400" : "text-purple-700",
					primaryBg: isDarkMode ? "bg-purple-600" : "bg-purple-700",
					primaryBgHover: isDarkMode ? "hover:bg-purple-700" : "hover:bg-purple-800",
					secondaryBg: isDarkMode ? "bg-purple-900/20" : "bg-purple-50",
					border: isDarkMode ? "border-purple-900/30" : "border-purple-200",
					gradient: isDarkMode ? "from-purple-900/30" : "from-purple-50/80",
					accent404: isDarkMode ? "text-purple-500" : "text-purple-700",
				};
			default: // client or guest
				return {
					primary: isDarkMode ? "text-red-400" : "text-red-800",
					primaryBg: isDarkMode ? "bg-red-600" : "bg-red-800",
					primaryBgHover: isDarkMode ? "hover:bg-red-700" : "hover:bg-red-900",
					secondaryBg: isDarkMode ? "bg-red-900/20" : "bg-red-50",
					border: isDarkMode ? "border-red-900/30" : "border-red-200",
					gradient: isDarkMode ? "from-red-900/30" : "from-red-50/80",
					accent404: isDarkMode ? "text-red-500" : "text-red-800",
				};
		}
	};

	const colors = getColorScheme();

	const handleGoHome = () => {
		if (token && userType === "employee") {
			navigate("/employeedashboard");
		} else if (token && userType === "admin") {
			navigate("/admin/dashboard");
		} else if (token && userType === "client") {
			navigate("/home");
		} else {
			navigate("/");
		}
	};

	const handleGoBack = () => {
		navigate(-1);
	};

	// Quick links based on user type
	const getQuickLinks = () => {
		if (userType === "employee") {
			return [
				{ label: "لوحة التحكم", href: "/employeedashboard", icon: Home },
				{ label: "الشحنات", href: "/employee-shipments", icon: FileText },
				{ label: "المحادثات", href: "/chat", icon: MessageCircle },
			];
		} else if (userType === "admin") {
			return [
				{ label: "لوحة الإدارة", href: "/admin/dashboard", icon: Home },
				{ label: "إدارة الشحنات", href: "/shipmentsmanagement", icon: FileText },
				{ label: "المستخدمين", href: "/admin/users", icon: Search },
			];
		} else {
			return [
				{ label: "الصفحة الرئيسية", href: "/home", icon: Home },
				{ label: "طلب رقم ACID", href: "/acidrequest", icon: FileText },
				{ label: "تواصل معنا", href: "/contact", icon: MessageCircle },
			];
		}
	};

	return (
		<div className={`min-h-screen transition-colors duration-300 ${
			isDarkMode 
				? "bg-[#0a0505]" 
				: "bg-gradient-to-br from-gray-50 to-gray-100"
		}`}>
			{/* Background Effects */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				{isDarkMode ? (
					<>
						<div className={`absolute top-[20%] left-[10%] w-[500px] h-[500px] ${colors.gradient} rounded-full filter blur-[150px] opacity-30`}></div>
						<div className={`absolute bottom-[10%] right-[10%] w-[400px] h-[400px] ${colors.gradient} rounded-full filter blur-[120px] opacity-20`}></div>
					</>
				) : (
					<div className={`absolute top-0 right-0 w-full h-[600px] bg-gradient-to-b ${colors.gradient} to-transparent`}></div>
				)}
			</div>

			<Header />

			<div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]" dir="rtl">
				
				{/* 404 Animation */}
				<div className="mb-8 relative">
					<div className={`text-[180px] md:text-[250px] font-black leading-none ${colors.accent404} opacity-10 select-none`}>
						404
					</div>
					<div className="absolute inset-0 flex items-center justify-center">
						<div className={`p-6 rounded-full ${colors.secondaryBg} border ${colors.border}`}>
							<Search className={`w-16 h-16 ${colors.primary}`} />
						</div>
					</div>
				</div>

				{/* Error Message */}
				<div className="text-center space-y-4 mb-10 max-w-2xl">
					<h1 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
						عذراً، الصفحة غير موجودة!
					</h1>
					<p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
						الصفحة التي تبحث عنها قد تكون تم نقلها أو حذفها أو أن الرابط غير صحيح.
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mb-12">
					<button
						onClick={handleGoHome}
						className={`flex-1 ${colors.primaryBg} ${colors.primaryBgHover} text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3`}
					>
						<Home size={22} />
						العودة للرئيسية
					</button>

					<button
						onClick={handleGoBack}
						className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 ${
							isDarkMode 
								? "bg-white/10 text-white border border-white/20 hover:bg-white/20" 
								: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
						}`}
					>
						<ArrowRight size={22} />
						رجوع
					</button>
				</div>

				{/* Quick Links */}
				<div className={`w-full max-w-lg p-6 rounded-2xl border ${
					isDarkMode 
						? "bg-white/5 border-white/10" 
						: "bg-white border-gray-100 shadow-lg"
				}`}>
					<div className="flex items-center gap-2 mb-4">
						<HelpCircle className={`w-5 h-5 ${colors.primary}`} />
						<span className={`font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
							روابط سريعة
						</span>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						{getQuickLinks().map((link, index) => (
							<Link
								key={index}
								to={link.href}
								className={`flex items-center gap-2 p-3 rounded-xl transition-all hover:scale-[1.02] ${
									isDarkMode 
										? "bg-white/5 hover:bg-white/10 text-gray-300" 
										: "bg-gray-50 hover:bg-gray-100 text-gray-700"
								}`}
							>
								<link.icon size={18} className={colors.primary} />
								<span className="text-sm font-medium">{link.label}</span>
							</Link>
						))}
					</div>
				</div>

				{/* Error Code Footer */}
				<div className={`mt-12 text-center ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
					<p className="text-sm">رمز الخطأ: 404 | الصفحة غير موجودة</p>
				</div>
			</div>
		</div>
	);
};

export default NotFound404;
