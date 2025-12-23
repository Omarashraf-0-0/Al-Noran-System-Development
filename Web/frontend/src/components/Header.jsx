import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import account_circle from "../assets/images/account_circle.png";
import dehaze from "../assets/images/dehaze.png";
import coloredLogo from "../assets/images/coloredLogo.png";
import { 
  Bell, 
  Menu, 
  X,
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  LayoutDashboard,
  FileText,
  Home,
  Package,
  Upload,
  CreditCard,
  Archive,
  MessageCircle,
  Users,
  BarChart3,
  Ship,
  ClipboardList,
  Hash
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";


const Header = () => {
	const { isDarkMode, toggleTheme } = useTheme();
	const [user, setUser] = useState(null);
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [showNotifications, setShowNotifications] = useState(false);
	const [openDropdown, setOpenDropdown] = useState(null);
	const [isScrolled, setIsScrolled] = useState(false);
	const [profilePhoto, setProfilePhoto] = useState(null);

	const navigate = useNavigate();
	const location = useLocation();
	const profileMenuRef = useRef(null);
	const notificationRef = useRef(null);
	const dropdownRef = useRef(null);

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

	// Scroll effect for header shadow
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Load notifications
	useEffect(() => {
		const loadNotifications = async () => {
			try {
				setNotifications([
					{
						id: 1,
						title: "تم رفع مستند من العميل : ياسمين",
						category: "فاتورة مبدائية",
						date: "تاريخ الجمعة 29 أكتوبر",
						actions: true,
					},
					{
						id: 2,
						title: "الموظف : اسم أعتمد مستند لشحنة رقم : AIR-005",
						category: "فاتورة مبدائية",
						date: "تاريخ الجمعة 29 أكتوبر",
						actions: false,
					},
					{
						id: 3,
						title: "تم تسجيل عميل جديد اسمه نوع العميل",
						category: "",
						date: "تاريخ الجمعة 29 أكتوبر",
						actions: false,
					},
				]);
			} catch (err) {
				console.error("Error loading notifications:", err);
			}
		};

		loadNotifications();
	}, []);

	// Fetch Profile Photo with Caching
	useEffect(() => {
		const fetchProfilePhoto = async () => {
			if (!user) return;
			try {
				// 1. Try to load from cache first for instant display
				const cachedPhoto = localStorage.getItem(`profile_photo_${user._id}`);
				if (cachedPhoto) {
					setProfilePhoto(cachedPhoto);
				}

				const token = localStorage.getItem("token");
				if (!token) return;

				// 2. Fetch fresh data in background
				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/users/profile`,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				if (response.data.user.profilePhoto) {
					const photoKey = response.data.user.profilePhoto;
					let finalUrl = photoKey;

					// If it's an S3 key, get presigned URL
					if (photoKey && !photoKey.startsWith("http")) {
						try {
							const photoResponse = await axios.get(
								`${import.meta.env.VITE_API_URL}/api/uploads/presigned-url/${encodeURIComponent(photoKey)}`,
								{
									headers: { Authorization: `Bearer ${token}` },
								}
							);
							finalUrl = photoResponse.data.url;
						} catch (err) {
							console.error("❌ Error getting presigned URL:", err);
							finalUrl = null;
						}
					}
					
					// 3. Update state and cache if we got a valid URL
					if (finalUrl) {
						setProfilePhoto(finalUrl);
						localStorage.setItem(`profile_photo_${user._id}`, finalUrl);
					}
				}
			} catch (error) {
				console.error("Error fetching profile photo:", error);
			}
		};

		if (user) {
			fetchProfilePhoto();
		}
	}, [user]);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
				setIsProfileMenuOpen(false);
			}
			if (notificationRef.current && !notificationRef.current.contains(event.target)) {
				setShowNotifications(false);
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

	// Helper to check if user is Admin or System Admin
	const isAdminUser = () => {
		if (!user) return false;
		return (
			user.type === "admin" ||
			(user.type === "employee" &&
				(user.employeeDetails?.employeeType === "System Admin" ||
					user.employeeDetails?.employeeType === "Department Manager"))
		);
	};

	// Define navigation items based on user type
	const getNavigationItems = () => {
		if (!user) {
			return [
				{ label: "الرئيسية", path: "/", icon: Home },
				{ label: "تتبع شحنة", path: "/home", icon: Ship },
			];
		}

		// Client navigation
		if (user.type === "client") {
			return [
				{ label: "الرئيسية", path: "/home", icon: Home },
				// Import Section
				{
					label: "الاستيراد",
					path: "/import",
					icon: Package,
					isDropdown: true,
					dropdownItems: [
						{ label: "طلب رقم ACID", path: "/acidrequest", icon: Hash },
						{ label: "طلبات ACID", path: "/acidrequests", icon: ClipboardList },
						{ label: "شحنات الاستيراد", path: "/client-shipments", icon: Ship },
					],
				},
				// Export Section
				{
					label: "التصدير",
					path: "/export",
					icon: Upload,
					isDropdown: true,
					dropdownItems: [
						{ label: "طلب رقم UCR", path: "/ucr-request", icon: Hash },
						{ label: "طلباتي UCR", path: "/ucr-requests", icon: ClipboardList },
						{ label: "شحنات التصدير", path: "/export-shipments", icon: Ship },
					],
				},
				{ label: "رفع المستندات", path: "/upload-documents", icon: FileText },
				{ label: "إدارة المدفوعات", path: "/client-payments", icon: CreditCard },
				{ label: "الأرشيف", path: "/client-archive", icon: Archive },
				{ label: "الدعم", path: "/chat", icon: MessageCircle },
			];
		}

		// Employee Navigation (Base links for all employees)
		if (user.type === "employee" || user.type === "admin") {
			const employeeLinks = [
				{ label: "الرئيسية", path: "/employeedashboard", icon: "📊" },
				// Import Section
				{
					label: "الاستيراد",
					path: "/import",
					icon: Package,
					isDropdown: true,
					dropdownItems: [
						{ label: "طلبات ACID", path: "/employee/acid-requests", icon: ClipboardList },
						{ label: "شحنات الاستيراد", path: "/employee-shipments", icon: Ship },
					],
				},
				// Export Section
				{
					label: "التصدير",
					path: "/export",
					icon: Upload,
					isDropdown: true,
					dropdownItems: [
						{ label: "طلبات UCR", path: "/employee/ucr-requests", icon: ClipboardList },
						{ label: "شحنات التصدير", path: "/employee/export-shipments", icon: Ship },
					],
				},
				{ label: "عملائي", path: "/my-customers", icon: Users },
				{ label: "الدعم", path: "/support-dashboard", icon: MessageCircle },
			];

			// If User is NOT Admin, return only employee links
			if (!isAdminUser()) {
				return employeeLinks;
			}

			// If User IS Admin, append Admin links GROUPED
			return [
				...employeeLinks,
				{
					label: "الإدارة",
					path: "/admin",
					icon: "🛠️",
					isDropdown: true,
					dropdownItems: [
						{ label: "الموظفين", path: "/employeemanagement", icon: "👔" },
						{ label: "العملاء", path: "/customermanagement", icon: "👥" },
						{ label: "التقارير", path: "/admindashboard", icon: "📈" },
						...(user.type === "admin" || user.employeeDetails?.employeeType === "System Admin" 
							? [{ label: "الإعدادات", path: "/settings", icon: "⚙️" }] 
							: [])
					]
				}
			];
		}

		return [];
	};

	const getUserDisplayName = () => {
		if (!user) return "ضيف";
		return user.fullname || user.username || "مستخدم";
	};

	const getUserRole = () => {
		if (!user) return "";
		if (user.type === "employee") return user.employeeDetails?.employeeType || "موظف";
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
	// Determine Accent Color Class
	const getAccentColor = () => {
		if (user?.type === "admin" || (user?.type === "employee" && user?.employeeDetails?.employeeType === "System Admin")) {
			return {
				text: "text-[#D4AF37]",
				bg: "bg-[#D4AF37]/10", 
				border: "border-[#D4AF37]",
				hoverText: "hover:text-[#D4AF37]",
				hoverBg: "hover:bg-[#D4AF37]/10"
			};
		}
		if (user?.type === "employee") {
			return {
				text: "text-[#1ba3b6]",
				bg: "bg-[#1ba3b6]/10", 
				border: "border-[#1ba3b6]",
				hoverText: "hover:text-[#1ba3b6]",
				hoverBg: "hover:bg-[#1ba3b6]/10"
			};
		}
		return {
			text: "text-red-500",
			bg: "bg-red-500/10",
			border: "border-red-500",
			hoverText: "hover:text-red-400",
			hoverBg: "hover:bg-red-50/10"
		};
	};
	const accent = getAccentColor();

	// Dynamic Theme based on user type
	const getThemeColors = () => {
		if (user?.type === "admin" || (user?.type === "employee" && user?.employeeDetails?.employeeType === "System Admin")) {
			return {
				dropdownBg: isDarkMode ? "bg-[#1a1500] border-[#3d3000]" : "bg-white border-gray-100",
				dropdownHover: isDarkMode ? "hover:bg-[#2b2500] hover:text-[#D4AF37]" : "hover:bg-amber-50 hover:text-[#D4AF37]",
				divider: isDarkMode ? "bg-[#3d3000]" : "bg-amber-100",
				headerBg: isDarkMode ? "bg-gradient-to-r from-[#2b2000] to-[#1a1500]" : "bg-gradient-to-r from-amber-50 to-yellow-50",
				roleBadge: "bg-amber-100 text-amber-700",
			};
		}
		if (user?.type === "employee") {
			return {
				dropdownBg: isDarkMode ? "bg-[#0a1a1f] border-[#163a42]" : "bg-white border-gray-100",
				dropdownHover: isDarkMode ? "hover:bg-[#0f2830] hover:text-[#1ba3b6]" : "hover:bg-cyan-50 hover:text-[#1ba3b6]",
				divider: isDarkMode ? "bg-[#163a42]" : "bg-cyan-100",
				headerBg: isDarkMode ? "bg-gradient-to-r from-[#0a1a1f] to-[#0f2830]" : "bg-gradient-to-r from-cyan-50 to-teal-50",
				roleBadge: "bg-cyan-100 text-cyan-700",
			};
		}
		return {
			dropdownBg: isDarkMode ? "bg-[#1a1010] border-[#3d1a1a]" : "bg-white border-gray-100",
			dropdownHover: isDarkMode ? "hover:bg-[#2b1515] hover:text-red-400" : "hover:bg-red-50 hover:text-red-700",
			divider: isDarkMode ? "bg-[#3d1a1a]" : "bg-red-100",
			headerBg: isDarkMode ? "bg-gradient-to-r from-[#2b0000] to-[#1a1010]" : "bg-gradient-to-r from-red-50 to-red-100",
			roleBadge: "bg-red-100 text-red-700",
		};
	};
	const themeColors = getThemeColors();

	const theme = {
		dropdownBg: themeColors.dropdownBg,
		dropdownText: isDarkMode ? "text-gray-200" : "text-gray-700",
		dropdownHover: themeColors.dropdownHover,
		divider: themeColors.divider,
		headerText: isDarkMode ? "text-gray-100" : "text-gray-800",
		subText: isDarkMode ? "text-gray-400" : "text-gray-500",
		headerBg: themeColors.headerBg,
		roleBadge: themeColors.roleBadge,
	};

	// Determine Header Gradient based on User Type
	const getHeaderGradient = () => {
		if (user?.type === "admin" || (user?.type === "employee" && user?.employeeDetails?.employeeType === "System Admin")) {
			return "bg-gradient-to-r from-[#D4AF37] to-[#B8860B]"; // Gold for Admin
		}
		if (user?.type === "employee") {
			return "bg-gradient-to-r from-[#1ba3b6] to-[#158A9A]"; // Turquoise for Employee
		}
		return "bg-gradient-to-r from-[#690000] to-[#8B0000]"; // Red for Client
	};

	return (
		<header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${getHeaderGradient()} backdrop-blur-md bg-opacity-90 shadow-md`}>
			<div className="w-full px-4 md:px-6">
				<div className="flex items-center justify-between h-16 w-full relative">
					
					{/* ====================== */}
					{/* 1. Right Section (User Info + Notifications + Mobile Toggle) */}
					{/* ====================== */}
					<div className="flex items-center gap-3 md:gap-4 z-20 flex-shrink-0">
						{/* Mobile Menu Toggle */}
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden p-1 rounded-md text-white hover:bg-white/10 focus:outline-none transition-colors"
						>
							<img src={dehaze} alt="Menu" className="h-7 w-7 object-contain filter invert brightness-0" />
						</button>

						{user ? (
							<>
								{/* User Profile */}
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
										<span className="hidden lg:block text-sm font-medium text-white shadow-sm">
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
												
												{/* Admin links moved to main navigation dropdown */}
												
												<button
													onClick={toggleTheme}
													className={`w-full text-right flex items-center gap-3 px-5 py-3 text-sm ${theme.dropdownText} ${theme.dropdownHover} transition-colors`}
												>
													<span className="text-xl">{isDarkMode ? "☀️" : "🌙"}</span>
													{isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
												</button>
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

								{/* Notifications */}
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
					{/* 2. Middle Section (Desktop Nav Links) - Centered Flex */}
					{/* ====================== */}
					<div className="hidden md:flex flex-1 justify-center z-10 px-4">
						<nav className="flex items-center" ref={dropdownRef}>
							<div className="flex items-baseline space-x-2 lg:space-x-4 space-x-reverse">
								{navigationItems.map((item, index) =>
									item.isDropdown ? (
										<div key={index} className="relative group">
											<button
												onClick={() =>
													setOpenDropdown(
														openDropdown === item.label ? null : item.label
													)
												}
												className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${
													item.dropdownItems?.some((sub) =>
														isActivePath(sub.path)
													)
														? "bg-white/20 text-white font-bold shadow-sm"
														: "text-white/90 hover:bg-white/10 hover:text-white"
												}`}
											>
												<item.icon className={`w-4 h-4 transition-colors ${item.dropdownItems?.some(sub => isActivePath(sub.path)) ? "text-white" : "text-gray-400 group-hover:text-[#690000]"}`} />
												<span>{item.label}</span>
												<ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${openDropdown === item.label ? "rotate-180" : ""}`} />
											</button>

											{/* Floating Glass Dropdown Menu */}
											{openDropdown === item.label && (
												<div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100/50 p-1.5 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
													{item.dropdownItems?.map((subItem, subIndex) => (
														<Link
															key={subIndex}
															to={subItem.path}
															onClick={() => setOpenDropdown(null)}
															className={`group flex items-center px-4 py-3 text-sm transition-all duration-200 ${
																isActivePath(subItem.path)
																	? `${accent.bg} ${accent.text} font-bold border-r-4 ${accent.border}`
																	: `${theme.dropdownText} ${theme.dropdownHover}`
															}`}
														>
															<subItem.icon className={`w-4 h-4 ${isActivePath(subItem.path) ? "text-white" : "text-gray-400"}`} />
															{subItem.label}
														</Link>
													))}
												</div>
											)}
										</div>
									) : (
										// Standard Nav Item
										<Link
											key={index}
											to={item.path}
											className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
												isActivePath(item.path)
													? "bg-white/20 text-white font-bold shadow-sm"
													: "text-white/90 hover:bg-white/10 hover:text-white"
											}`}
										>
											<item.icon className={`w-4 h-4 transition-colors ${isActivePath(item.path) ? "text-white" : "text-gray-400 group-hover:text-[#690000]"}`} />
											{item.label}
										</Link>
									)
								)}
						</div>
<<<<<<< Updated upstream
					</nav>
=======

						{/* ====================== */}
						{/* Left Section (Notifications & Profile) */}
						{/* ====================== */}
						<div className="flex items-center gap-2 md:gap-3">
							{user ? (
								<>
									{/* Notifications Bell */}
									<div className="relative" ref={notificationRef}>
										<button
											onClick={() => setShowNotifications(!showNotifications)}
											className={`
												relative p-2.5 rounded-xl transition-all duration-300
												${showNotifications 
													? "bg-[#690000]/10 text-[#690000]" 
													: "text-gray-500 hover:bg-gray-100 hover:text-[#690000]"}
											`}
										>
											<Bell className="w-5 h-5" />
											{notifications.length > 0 && (
												<span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
											)}
										</button>

										{/* Glass Notifications Dropdown */}
										{showNotifications && (
											<div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
												<div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-gradient-to-r from-gray-50/50 to-white">
													<div className="flex items-center gap-2">
														<h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
															<Bell className="w-4 h-4 text-[#690000]" />
															الإشعارات
														</h3>
														<span className="text-xs bg-[#690000] text-white px-2 py-0.5 rounded-full font-bold">{notifications.length}</span>
													</div>
													{notifications.length > 0 && (
														<button
															onClick={() => {
																setNotifications([]);
																// TODO: Call API to mark all as read
															}}
															className="text-[10px] font-bold text-gray-400 hover:text-[#690000] transition-colors"
														>
															تحديد الكل كمقروء
														</button>
													)}
												</div>
												<div className="max-h-[50vh] overflow-y-auto">
													{notifications.length === 0 ? (
														<div className="p-8 text-center text-gray-400 flex flex-col items-center">
															<Bell className="w-10 h-10 opacity-20 mb-2" />
															<p className="text-sm font-medium">لا توجد إشعارات جديدة</p>
														</div>
													) : (
														notifications.map((notif, index) => (
															<div key={index} className="p-4 border-b border-gray-50 hover:bg-[#690000]/5 transition-colors cursor-pointer group">
																<div className="flex gap-3">
																	<div className="w-10 h-10 rounded-xl bg-[#690000]/10 flex items-center justify-center text-[#690000] flex-shrink-0 group-hover:bg-[#690000] group-hover:text-white transition-all">
																		<FileText className="w-5 h-5" />
																	</div>
																	<div className="flex-1 min-w-0">
																		<p className="text-sm text-gray-800 font-bold leading-relaxed truncate">
																			{notif.title}
																		</p>
																		<span className="text-xs text-gray-400 mt-1 block font-medium">
																			{notif.date}
																		</span>
																	</div>
																</div>
															</div>
														))
													)}
												</div>
												{/* Footer Actions */}
												{notifications.length > 0 && (
													<div className="p-2 border-t border-gray-100 bg-gray-50/50">
														<Link
															to="/notifications"
															onClick={() => setShowNotifications(false)}
															className="block w-full text-center text-xs font-bold text-[#690000] hover:bg-[#690000]/10 px-3 py-2 rounded-lg transition-all"
														>
															عرض جميع الإشعارات
														</Link>
													</div>
												)}
											</div>
										)}
									</div>

									{/* User Profile */}
									<div className="relative" ref={profileMenuRef}>
										<button
											onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
											className={`
												flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all duration-300
												${isProfileMenuOpen 
													? "border-[#690000]/30 bg-[#690000]/5" 
													: "border-transparent hover:bg-gray-100"}
											`}
										>
											{/* Avatar with Frame */}
											<div className="relative p-0.5 rounded-full border-2 border-[#690000] bg-white shadow-sm ring-1 ring-black/5">
												<div className={`absolute inset-0 rounded-full bg-[#690000]/20 blur-md transition-opacity ${isProfileMenuOpen ? "opacity-100" : "opacity-0"}`}></div>
												<img
													src={profilePhoto || account_circle}
													alt="Avatar"
													className="w-8 h-8 rounded-full object-cover relative z-10"
												/>
											</div>
											<div className="hidden md:flex flex-col items-start leading-tight">
												<span className="text-sm font-bold text-gray-800">
													{getUserDisplayName().split(' ')[0]}
												</span>
												<span className="text-[10px] text-gray-500 font-medium">
													{user.type === "employee" ? "موظف" : "عميل"}
												</span>
											</div>
											<ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isProfileMenuOpen ? "rotate-180" : ""} hidden md:block`} />
										</button>

										{/* Glass Profile Dropdown */}
										{isProfileMenuOpen && (
											<div className="absolute left-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100/50 p-2 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 text-right">
												
												{/* User Header */}
												<div className="p-3 mb-1.5 bg-gradient-to-br from-[#690000]/5 to-transparent rounded-lg flex items-center gap-3">
													<div className="w-11 h-11 relative p-0.5 rounded-full border-2 border-[#690000] bg-white shadow-sm ring-1 ring-black/5 flex-shrink-0">
														{profilePhoto ? (
															<img src={profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
														) : (
															<div className="w-full h-full rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-[#690000] to-[#8B0000] text-white">
																{getUserDisplayName().charAt(0)}
															</div>
														)}
													</div>
													<div className="overflow-hidden flex-1">
														<p className="text-sm font-bold text-gray-900 truncate">
															{getUserDisplayName()}
														</p>
														<p className="text-xs text-gray-500 truncate font-medium">{user.email}</p>
													</div>
												</div>

												{/* Actions */}
												<div className="space-y-0.5">
													<Link
														to="/profile"
														className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-[#690000] transition-all"
														onClick={() => setIsProfileMenuOpen(false)}
													>
														<User className="w-4 h-4" />
														الملف الشخصي
													</Link>

													{user?.type === "employee" && user?.employeeDetails?.employeeType === "System Admin" && (
														<>
															<Link
																to="/admindashboard"
																className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-[#690000] transition-all"
																onClick={() => setIsProfileMenuOpen(false)}
															>
																<LayoutDashboard className="w-4 h-4" />
																لوحة التحكم
															</Link>
															<Link
																to="/settings"
																className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-[#690000] transition-all"
																onClick={() => setIsProfileMenuOpen(false)}
															>
																<Settings className="w-4 h-4" />
																الإعدادات
															</Link>
														</>
													)}

													<div className="h-px bg-gray-100 my-1"></div>

													<button
														onClick={handleLogout}
														className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
													>
														<LogOut className="w-4 h-4" />
														تسجيل الخروج
													</button>
												</div>
											</div>
										)}
									</div>
								</>
							) : (
								<div className="flex items-center gap-2">
									<Link
										to="/login"
										className="px-5 py-2 rounded-xl text-sm font-bold bg-[#690000] text-white shadow-lg shadow-[#690000]/20 hover:bg-[#800000] hover:shadow-xl hover:shadow-[#690000]/30 active:scale-95 transition-all"
									>
										تسجيل الدخول
									</Link>
								</div>
							)}
						</div>
					</div>
>>>>>>> Stashed changes
				</div>

				{/* ====================== */}
				{/* 3. Left Section (Logo) */}
					{/* ====================== */}
					<div className="flex items-center z-20 flex-shrink-0">
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

			{isMobileMenuOpen && (
				<div className="lg:hidden fixed inset-0 z-[60]" dir="rtl">
					{/* Backdrop */}
					<div 
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => setIsMobileMenuOpen(false)}
						></div>
					
					{/* Menu Panel */}
					<div className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-300">
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b border-gray-100">
							<img src={coloredLogo} alt="Al-Noran" className="h-10" />
							<button
								onClick={() => setIsMobileMenuOpen(false)}
								className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
								>
								<X className="w-6 h-6" />
							</button>
						</div>

						{/* User Info (if logged in) */}
						{user && (
							<div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#690000]/5 to-transparent">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#690000] to-[#8B0000] text-white overflow-hidden shadow-lg border-2 border-white">
										{profilePhoto ? (
											<img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
										) : (
											<div className="w-full h-full flex items-center justify-center font-bold text-lg">
												{getUserDisplayName().charAt(0)}
											</div>
										)}
									</div>
									<div>
										<p className="font-bold text-gray-900">{getUserDisplayName()}</p>
										<p className="text-sm text-gray-500">{getUserRole()}</p>
									</div>
								</div>
							</div>
						)}

						{/* Navigation */}
						<div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
							{navigationItems.map((item, index) => (
								<div key={index}>
									{item.isDropdown ? (
										<div className="space-y-1">
											<button
												onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
												className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
												>
												<span className="flex items-center gap-3">
													<item.icon className="w-5 h-5 text-[#690000]" />
													{item.label}
												</span>
												<ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
											</button>
											{openDropdown === item.label && (
												<div className="bg-gray-50 rounded-xl mx-2 p-2 space-y-0.5 border border-gray-100">
													{item.dropdownItems.map((sub, i) => (
														<Link
														key={i}
														to={sub.path}
														onClick={() => setIsMobileMenuOpen(false)}
														className={`
															flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold
															${isActivePath(sub.path) ? "bg-[#690000] text-white" : "text-gray-600 hover:bg-white"}
															`}
															>
															<sub.icon className={`w-4 h-4 ${isActivePath(sub.path) ? "text-white" : "text-gray-400"}`} />
															{sub.label}
														</Link>
													))}
												</div>
											)}
										</div>
									) : (
										<Link
										to={item.path}
										onClick={() => setIsMobileMenuOpen(false)}
										className={`
											flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all
											${isActivePath(item.path) 
												? "bg-[#690000] text-white shadow-md" 
												: "text-gray-700 hover:bg-gray-50"}
												`}
												>
											<item.icon className={`w-5 h-5 ${isActivePath(item.path) ? "text-white" : "text-[#690000]"}`} />
											{item.label}
										</Link>
									)}
								</div>
							))}
						</div>

						{/* Logout Button */}
						{user && (
							<div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
								<button
									onClick={handleLogout}
									className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-600 font-bold hover:bg-red-50 border border-red-100 transition-all"
									>
									<LogOut className="w-5 h-5" />
									تسجيل الخروج
								</button>
							</div>
						)}
					</div>
				</div>
			)}
			</div>
		</div>
	</header>
	);
};

export default Header;
