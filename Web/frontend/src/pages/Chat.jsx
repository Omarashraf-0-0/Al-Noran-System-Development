import React from "react";
import { useSearchParams } from "react-router-dom";
import ChatInterface from "../components/ChatInterface.jsx";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";

const Chat = () => {
	const { isDarkMode } = useTheme();
	const [searchParams] = useSearchParams();
	const chatId = searchParams.get("chatId");

	// Get user from local storage to determine theme accents
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type;
	const employeeType = user?.employeeDetails?.employeeType;

	// Determine Theme Colors based on Role
	// Determine Theme Colors based on Role
	const getThemeColors = () => {
		if (userType === "admin" || (userType === "employee" && employeeType === "System Admin")) {
			return {
				primary: "#D4AF37", // Gold
				bgLight: "bg-[#D4AF37]/10",
				text: "text-[#D4AF37]",
				cardBg: isDarkMode ? "bg-black/40" : "bg-white",
				border: isDarkMode ? "border-white/10" : "border-gray-300 shadow-md"
			};
		}
		// Default Employee Theme (Teal/Blue)
		return {
			primary: "#1ba3b6", // Teal
			bgLight: "bg-[#1ba3b6]/10",
			text: "text-[#1ba3b6]",
			cardBg: isDarkMode ? "bg-[#1a1c23]/60" : "bg-white",
			border: isDarkMode ? "border-white/10" : "border-gray-300 shadow-md"
		};
	};

	const themeColors = getThemeColors();

	return (
		<div className={`flex flex-col min-h-screen relative transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50/50"}`}>
			
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

			<main className="flex-grow pt-28 pb-8 flex items-center justify-center px-4 relative z-0">
				<div className="container mx-auto w-full max-w-7xl animate-fade-in-up">
					
					{/* Page Header */}
					<div className="mb-6 text-center">
						<h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
							{chatId ? "المحادثة" : "الدعم الفني"}
						</h1>
						<p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
							تواصل مباشرة مع فريق الدعم لحل مشكلاتك
						</p>
					</div>

					{/* Chat Interface Container */}
					<div 
						className={`rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 ${
							isDarkMode 
								? "bg-[#141419]/80 border-white/10 backdrop-blur-md" 
								: "bg-white border-gray-200"
						}`}
					>
						<div className={`p-4 border-b ${isDarkMode ? "border-white/5 bg-white/5" : "border-gray-100 bg-gray-50/50"}`}>
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-lg ${themeColors.bgLight}`}>
									<svg className={`w-5 h-5 ${themeColors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
									</svg>
								</div>
								<h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
									نافذة المحادثة
								</h2>
							</div>
						</div>
						
						<div className="p-1">
							<ChatInterface preselectedChatId={chatId} />
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
				
				@keyframes fadeInUp {
					from { opacity: 0; transform: translateY(20px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>
		</div>
	);
};

export default Chat;
