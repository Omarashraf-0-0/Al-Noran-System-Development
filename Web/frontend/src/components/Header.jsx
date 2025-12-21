import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import account_circle from "../assets/images/account_circle.png";
import coloredLogo from "../assets/images/coloredLogo.png";
import dehaze from "../assets/images/dehaze.png";
import cancelpreset from "../assets/images/cancel_presentation.png";
import NotificationBell from "./NotificationBell";
import { useTheme } from "../context/ThemeContext";

const Header = () => {
	const { isDarkMode } = useTheme();
	const [user, setUser] = useState(null);
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [openDropdown, setOpenDropdown] = useState(null); // For navigation dropdowns

	const navigate = useNavigate();
	const location = useLocation();
	const profileMenuRef = useRef(null);
	const dropdownRef = useRef(null);

	const primaryColor = "#690000";

	// Load user from localStorage
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			try {
				setUser(JSON.parse(storedUser));
			} catch (error) {
				console.error("Error parsing user data:", error);
			}
		}
	}, []);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				profileMenuRef.current &&
				!profileMenuRef.current.contains(event.target)
			) {
				setIsProfileMenuOpen(false);
			}
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setOpenDropdown(null);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = () => {
		localStorage.removeItem("user");
		localStorage.removeItem("token");
		localStorage.removeItem("tokenExpiry");
		setUser(null);
		toast.success("تم تسجيل الخروج بنجاح");
		navigate("/login");
	};

	const isActivePath = (path) => {
		return location.pathname === path;
	};

	// Define navigation items based on user type
	const getNavigationItems = () => {
		if (!user) {
			return [
				{ label: "الرئيسية", path: "/", showAlways: true },
				{ label: "تتبع شحنة", path: "/home", showAlways: true },
			];
		}

		// Client navigation
		if (user.type === "client") {
			return [
				{ label: "الرئيسية", path: "/home", icon: "🏠" },
				// Import Section
				{
					label: "الاستيراد",
					path: "/import",
					icon: "📥",
					isDropdown: true,
					dropdownItems: [
						{ label: "طلب رقم ACID", path: "/acidrequest", icon: "🔢" },
						{ label: "طلبات ACID", path: "/acidrequests", icon: "📋" },
						{ label: "شحنات الاستيراد", path: "/client-shipments", icon: "🚢" },
					],
				},
				// Export Section
				{
					label: "التصدير",
					path: "/export",
					icon: "📤",
					isDropdown: true,
					dropdownItems: [
						{ label: "طلب رقم UCR", path: "/ucr-request", icon: "🔢" },
						{ label: "طلباتي UCR", path: "/ucr-requests", icon: "📋" },
						{ label: "شحنات التصدير", path: "/export-shipments", icon: "🚢" },
					],
				},
				{ label: "رفع المستندات", path: "/upload-documents", icon: "📄" },
				{ label: "إدارة المدفوعات", path: "/client-payments", icon: "💳" },
				{ label: "الأرشيف", path: "/client-archive", icon: "📁" },
				{ label: "الدعم", path: "/chat", icon: "💬" },
			];
		}

		// Employee navigation
		if (user.type === "employee") {
			const employeeType = user.employeeDetails?.employeeType;
			const baseItems = [
				{ label: "لوحة التحكم", path: "/employeedashboard", icon: "📊" },
				// Import Section for Employees
				{
					label: "الاستيراد",
					path: "/import",
					icon: "📥",
					isDropdown: true,
					dropdownItems: [
						{
							label: "طلبات ACID",
							path: "/employee/acid-requests",
							icon: "📋",
						},
						{
							label: "شحنات الاستيراد",
							path: "/employee-shipments",
							icon: "🚢",
						},
					],
				},
				// Export Section for Employees
				{
					label: "التصدير",
					path: "/export",
					icon: "📤",
					isDropdown: true,
					dropdownItems: [
						{ label: "طلبات UCR", path: "/employee/ucr-requests", icon: "📋" },
						{
							label: "شحنات التصدير",
							path: "/employee/export-shipments",
							icon: "🚢",
						},
					],
				},
				{ label: "عملائي", path: "/my-customers", icon: "👥" },
				{ label: "الدعم", path: "/support-dashboard", icon: "💬" },
			];

			// Add admin-specific items
			if (
				employeeType === "System Admin" ||
				employeeType === "Department Manager"
			) {
				baseItems.push(
					{ label: "الموظفين", path: "/employees", icon: "👔" },
					{ label: "التقارير", path: "/reports", icon: "📈" }
				);
			}

			// System Admin only
			if (employeeType === "System Admin") {
				baseItems.push({ label: "الإعدادات", path: "/settings", icon: "⚙️" });
			}

			return baseItems;
		}

		return [];
	};

	const getUserDisplayName = () => {
		if (!user) return "ضيف";
		return user.fullname || user.username || "مستخدم";
	};

	const getUserRole = () => {
		if (!user) return "";
		if (user.type === "employee") {
			return user.employeeDetails?.employeeType || "موظف";
		}
		if (user.type === "client") {
			const clientType = user.clientDetails?.clientType;
			const typeMap = {
				commercial: "عميل تجاري",
				factory: "مصنع",
				personal: "عميل فردي",
			};
			return typeMap[clientType] || "عميل";
		}
		return "";
	};

	const navigationItems = getNavigationItems();

	// Theme Classes
	const theme = {
		dropdownBg: isDarkMode ? "bg-[#1a1010] border-[#3d1a1a]" : "bg-white border-gray-100",
		dropdownText: isDarkMode ? "text-gray-200" : "text-gray-700",
		dropdownHover: isDarkMode ? "hover:bg-[#2b1515] hover:text-red-400" : "hover:bg-gray-50 hover:text-[#690000]",
		divider: isDarkMode ? "bg-[#3d1a1a]" : "bg-gray-100",
		headerText: isDarkMode ? "text-gray-100" : "text-gray-800",
		subText: isDarkMode ? "text-gray-400" : "text-gray-500",
		headerBg: isDarkMode ? "bg-gradient-to-r from-[#2b0000] to-[#1a1010]" : "bg-gradient-to-r from-gray-50 to-gray-100",
	};

	return (
		<header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gradient-to-r from-[#690000] to-[#8B0000] backdrop-blur-md bg-opacity-90 shadow-md">
			<div className="w-full px-4 md:px-6">
				<div className="flex items-center justify-between h-16 w-full relative">
					
					{/* ====================== */}
					{/* 1. Right Section (User Info + Notifications + Mobile Toggle) - DOM First = Right in RTL */}
					{/* ====================== */}
					<div className="flex items-center gap-3 md:gap-4 z-20">
						{/* Mobile Menu Toggle */}
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden p-1 rounded-md text-white hover:bg-white/10 focus:outline-none transition-colors"
						>
							<img src={dehaze} alt="Menu" className="h-7 w-7 object-contain filter invert brightness-0" />
						</button>

						{user ? (
							<>
								{/* User Profile - Swapped to be First (Rightmost) */}
								<div className="relative" ref={profileMenuRef}>
									<button
										onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
										className="flex items-center gap-2 hover:opacity-90 focus:outline-none transition-opacity bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full border border-white/10"
									>
										<img
											src={account_circle}
											alt="User Account"
											className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30"
										/>
										<span className="hidden md:block text-sm font-medium text-white shadow-sm">
											{getUserDisplayName()}
										</span>
									</button>

									{/* Profile Dropdown */}
									{isProfileMenuOpen && (
										<div className={`absolute right-0 mt-3 w-72 ${theme.dropdownBg} rounded-2xl shadow-2xl border z-50 overflow-hidden ring-1 ring-black ring-opacity-5 animate-fade-in-up`}>
											<div className={`p-5 ${theme.headerBg} border-b ${theme.divider}`}>
												<div className="flex items-center gap-3 mb-3">
													<img
														src={account_circle}
														alt="User"
														className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-md"
													/>
													<div>
														<p className={`text-base font-bold ${theme.headerText}`}>
															{getUserDisplayName()}
														</p>
														<p className={`text-xs ${theme.subText} font-medium`}>{user.email}</p>
													</div>
												</div>
												<span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
													{getUserRole()}
												</span>
											</div>
											
											<div className="py-2">
												<Link
													to="/profile"
													className={`flex items-center gap-3 px-5 py-3 text-sm ${theme.dropdownText} ${theme.dropdownHover} transition-colors`}
													onClick={() => setIsProfileMenuOpen(false)}
												>
													<span className="text-xl">👤</span>
													الملف الشخصي
												</Link>
												{user?.type === "employee" &&
													user?.employeeDetails?.employeeType ===
														"System Admin" && (
														<Link
															to="/admindashboard"
															className={`flex items-center gap-3 px-5 py-3 text-sm ${theme.dropdownText} ${theme.dropdownHover} transition-colors`}
															onClick={() => setIsProfileMenuOpen(false)}
														>
															<span className="text-xl">📊</span>
															لوحة التحكم
														</Link>
													)}
												{user?.type === "employee" &&
													user?.employeeDetails?.employeeType ===
														"System Admin" && (
														<Link
															to="/settings"
															className={`flex items-center gap-3 px-5 py-3 text-sm ${theme.dropdownText} ${theme.dropdownHover} transition-colors`}
															onClick={() => setIsProfileMenuOpen(false)}
														>
															<span className="text-xl">⚙️</span>
															الإعدادات
														</Link>
													)}
												
												<div className={`h-px ${theme.divider} my-1 mx-4`}></div>
												
												<button
													onClick={handleLogout}
													className="w-full text-right flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-500/10 transition-colors font-medium"
												>
													<span className="text-xl">🚪</span>
													تسجيل الخروج
												</button>
											</div>
										</div>
									)}
								</div>

								{/* Notifications - Swapped to be Second (Left of Profile) */}
								<div className="text-white">
									<NotificationBell isDarkMode={isDarkMode} />
								</div>
							</>
						) : location.pathname === "/login" ? (
							<Link
								to="/register"
								className="flex items-center gap-2 bg-white text-[#690000] px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-bold shadow-md"
							>
								<span>إنشاء حساب</span>
							</Link>
						) : (
							<Link
								to="/login"
								className="flex items-center gap-2 bg-white text-[#690000] px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-bold shadow-md"
							>
								<span>تسجيل الدخول</span>
							</Link>
						)}
					</div>

					{/* ====================== */}
					{/* 2. Middle Section (Desktop Nav Links) - Centered */}
					{/* ====================== */}
					<div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
						<nav className="flex items-center" ref={dropdownRef}>
							<div className="flex items-baseline space-x-4 space-x-reverse">
								{navigationItems.map((item, index) =>
									item.isDropdown ? (
										<div key={index} className="relative">
											<button
												onClick={() =>
													setOpenDropdown(
														openDropdown === item.label ? null : item.label
													)
												}
												className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
													item.dropdownItems?.some((sub) =>
														isActivePath(sub.path)
													)
														? "bg-white/20 text-white font-bold shadow-sm"
														: "text-white/90 hover:bg-white/10 hover:text-white"
												}`}
											>
												<span className="inline-block ml-1">{item.icon}</span>
												{item.label}
												<svg
													className={`w-4 h-4 transition-transform duration-200 ${
														openDropdown === item.label ? "rotate-180" : ""
													}`}
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 9l-7 7-7-7"
													/>
												</svg>
											</button>
											{openDropdown === item.label && (
												<div className={`absolute top-full right-1/2 translate-x-1/2 mt-2 w-56 ${theme.dropdownBg} rounded-xl shadow-2xl border z-50 py-2 ring-1 ring-black ring-opacity-5 animate-fade-in-up`}>
													{item.dropdownItems?.map((subItem, subIndex) => (
														<Link
															key={subIndex}
															to={subItem.path}
															onClick={() => setOpenDropdown(null)}
															className={`group flex items-center px-4 py-3 text-sm transition-all duration-200 ${
																isActivePath(subItem.path)
																	? "bg-red-500/10 text-red-500 font-bold border-r-4 border-red-500"
																	: `${theme.dropdownText} ${theme.dropdownHover}`
															}`}
														>
															<span className="inline-block ml-3 transform group-hover:scale-110 transition-transform text-lg w-6 text-center">
																{subItem.icon}
															</span>
															{subItem.label}
														</Link>
													))}
												</div>
											)}
										</div>
									) : (
										<Link
											key={index}
											to={item.path}
											className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
												isActivePath(item.path)
													? "bg-white/20 text-white font-bold shadow-sm"
													: "text-white/90 hover:bg-white/10 hover:text-white"
											}`}
										>
											<span className="inline-block ml-1">{item.icon}</span>
											{item.label}
										</Link>
									)
								)}
							</div>
						</nav>
					</div>

					{/* ====================== */}
					{/* 3. Left Section (Logo) - DOM Last = Left in RTL */}
					{/* ====================== */}
					<div className="flex items-center z-20">
						<Link
							to={
								user
									? user.type === "employee"
										? "/employeedashboard"
										: "/home"
									: "/"
							}
						>
							<img
								src={coloredLogo}
								alt="Al-Noran Logo"
								className="h-10 w-auto object-contain cursor-pointer transition-opacity hover:opacity-90 filter brightness-0 invert drop-shadow-md"
							/>
						</Link>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMobileMenuOpen && (
					<div className={`md:hidden border-t ${theme.divider} py-4`}>
						<nav className="flex flex-col space-y-2">
							{navigationItems.map((item, index) =>
								item.isDropdown ? (
									<div key={index} className="flex flex-col">
										<button
											onClick={() =>
												setOpenDropdown(
													openDropdown === item.label ? null : item.label
												)
											}
											className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
												item.dropdownItems?.some((sub) =>
													isActivePath(sub.path)
												)
													? "text-red-500 font-bold bg-red-500/10"
													: "text-gray-100 hover:text-red-400 hover:bg-white/5"
											}`}
										>
											<span>
												<span className="inline-block ml-2">{item.icon}</span>
												{item.label}
											</span>
											<svg
												className={`w-4 h-4 transition-transform ${
													openDropdown === item.label ? "rotate-180" : ""
												}`}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M19 9l-7 7-7-7"
												/>
											</svg>
										</button>
										{openDropdown === item.label && (
											<div className="mr-6 border-r-2 border-red-500/30">
												{item.dropdownItems?.map((subItem, subIndex) => (
													<Link
														key={subIndex}
														to={subItem.path}
														onClick={() => {
															setIsMobileMenuOpen(false);
															setOpenDropdown(null);
														}}
														className={`block px-4 py-2 text-sm transition-colors ${
															isActivePath(subItem.path)
																? "text-red-500 font-bold bg-red-500/10"
																: "text-gray-300 hover:text-red-400 hover:bg-white/5"
														}`}
													>
														<span className="inline-block ml-2">
															{subItem.icon}
														</span>
														{subItem.label}
													</Link>
												))}
											</div>
										)}
									</div>
								) : (
									<Link
										key={index}
										to={item.path}
										onClick={() => setIsMobileMenuOpen(false)}
										className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
											isActivePath(item.path)
												? "text-red-500 font-bold bg-red-500/10"
												: "text-gray-100 hover:text-red-400 hover:bg-white/5"
										}`}
									>
										<span className="inline-block ml-2">{item.icon}</span>
										{item.label}
									</Link>
								)
							)}
						</nav>
					</div>
				)}
			</div>
		</header>
	);
};

export default Header;
