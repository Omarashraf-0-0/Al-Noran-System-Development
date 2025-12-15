import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import account_circle from "../assets/images/account_circle.png";
import notifications_unread from "../assets/images/notifications_unread.png";
import coloredLogo from "../assets/images/coloredLogo.png";
import dehaze from "../assets/images/dehaze.png";
import cancelpreset from "../assets/images/cancel_presentation.png";
import folderCheck from "../assets/images/folder_check.png";
import pdfPic from "../assets/images/picture_as_pdf.png";

const Header = () => {
	const [user, setUser] = useState(null);
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [showNotifications, setShowNotifications] = useState(false);
	const [openDropdown, setOpenDropdown] = useState(null); // For navigation dropdowns

	const navigate = useNavigate();
	const location = useLocation();
	const profileMenuRef = useRef(null);
	const notificationRef = useRef(null);
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

	// Load notifications
	useEffect(() => {
		const loadNotifications = async () => {
			try {
				// TODO: Replace with real API call
				// const res = await fetch("/api/notifications");
				// const data = await res.json();
				// setNotifications(data);

				setNotifications([
					{
						id: 1,
						title: "تم رفع مستند من العميل : ياسمين",
						category: "فاتورة مبدائية",
						date: "تاريخ الجمعة 29 أكتوبر",
						actions: true,
						icon: pdfPic,
					},
					{
						id: 2,
						title: "الموظف : اسم أعتمد مستند لشحنة رقم : AIR-005",
						category: "فاتورة مبدائية",
						date: "تاريخ الجمعة 29 أكتوبر",
						actions: false,
						icon: pdfPic,
					},
					{
						id: 3,
						title: "تم تسجيل عميل جديد اسمه نوع العميل",
						category: "",
						date: "تاريخ الجمعة 29 أكتوبر",
						actions: false,
						icon: pdfPic,
					},
				]);
			} catch (err) {
				console.error("Error loading notifications:", err);
			}
		};

		loadNotifications();
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
			if (
				notificationRef.current &&
				!notificationRef.current.contains(event.target)
			) {
				setShowNotifications(false);
			}
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target)
			) {
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
					]
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
					]
				},
				{ label: "رفع المستندات", path: "/upload-documents", icon: "📄" },
				{ label: "الدعم", path: "/chat", icon: "💬" },
			];
		}

		// Employee navigation
		if (user.type === "employee") {
			const employeeType = user.employeeDetails?.employeeType;
			const baseItems = [
				{ label: "لوحة التحكم", path: "/employeedashboard", icon: "📊" },
				{ label: "الشحنات", path: "/employee-shipments", icon: "📦" },
				// Import Section for Employees
				{ 
					label: "الاستيراد", 
					path: "/import", 
					icon: "📥",
					isDropdown: true,
					dropdownItems: [
						{ label: "طلبات ACID", path: "/employee/acid-requests", icon: "📋" },
						{ label: "شحنات الاستيراد", path: "/employee-shipments", icon: "🚢" },
					]
				},
				// Export Section for Employees
				{ 
					label: "التصدير", 
					path: "/export", 
					icon: "📤",
					isDropdown: true,
					dropdownItems: [
						{ label: "طلبات UCR", path: "/employee/ucr-requests", icon: "📋" },
						{ label: "شحنات التصدير", path: "/employee/export-shipments", icon: "🚢" },
					]
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

	return (
		<header className="bg-white shadow-sm sticky top-0 z-50">
			<div className="w-full px-4 md:px-6">
				<div className="flex items-center justify-between h-16 w-full">
					{/* ====================== */}
					{/* Left Section (Logo + Menu + Nav Links) */}
					{/* ====================== */}
					<div className="flex items-center gap-4 md:gap-6">
						{/* Mobile Menu Toggle */}
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden p-1 rounded-md hover:opacity-80 focus:outline-none"
						>
							<img src={dehaze} alt="Menu" className="h-7 w-7 object-contain" />
						</button>

						{/* Logo */}
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
								className="h-8 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
							/>
						</Link>

						{/* Desktop Navigation Links */}
						<nav className="hidden md:flex items-center" ref={dropdownRef}>
							<div className="flex items-baseline space-x-4 space-x-reverse">
								{navigationItems.map((item, index) => (
									item.isDropdown ? (
										// Dropdown Navigation Item
										<div key={index} className="relative">
											<button
												onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
												className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
													item.dropdownItems?.some(sub => isActivePath(sub.path))
														? "text-red-800 font-bold bg-red-50"
														: "text-gray-700 hover:text-red-800 hover:bg-gray-50"
												}`}
											>
												<span className="inline-block ml-1">{item.icon}</span>
												{item.label}
												<svg 
													className={`w-4 h-4 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} 
													fill="none" 
													stroke="currentColor" 
													viewBox="0 0 24 24"
												>
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
												</svg>
											</button>
											
											{/* Dropdown Menu */}
											{openDropdown === item.label && (
												<div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
													{item.dropdownItems?.map((subItem, subIndex) => (
														<Link
															key={subIndex}
															to={subItem.path}
															onClick={() => setOpenDropdown(null)}
															className={`block px-4 py-2 text-sm transition-colors ${
																isActivePath(subItem.path)
																	? "text-red-800 font-bold bg-red-50"
																	: "text-gray-700 hover:text-red-800 hover:bg-gray-50"
															}`}
														>
															<span className="inline-block ml-2">{subItem.icon}</span>
															{subItem.label}
														</Link>
													))}
												</div>
											)}
										</div>
									) : (
										// Regular Navigation Item
										<Link
											key={index}
											to={item.path}
											className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
												isActivePath(item.path)
													? "text-red-800 font-bold bg-red-50"
													: "text-gray-700 hover:text-red-800 hover:bg-gray-50"
											}`}
										>
											<span className="inline-block ml-1">{item.icon}</span>
											{item.label}
										</Link>
									)
								))}
							</div>
						</nav>
					</div>

					{/* ====================== */}
					{/* Right Section (Notifications & Profile) */}
					{/* ====================== */}
					<div className="flex items-center gap-3 md:gap-4">
						{user ? (
							<>
								{/* Notifications */}
								<div className="relative" ref={notificationRef}>
									<button
										onClick={() => setShowNotifications(!showNotifications)}
										className="p-1 rounded-full hover:opacity-80 focus:outline-none relative"
									>
										<img
											src={notifications_unread}
											alt="Notifications"
											className="h-8 w-8 object-contain"
										/>
										{notifications.length > 0 && (
											<span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
												{notifications.length}
											</span>
										)}
									</button>

									{/* Notifications Dropdown */}
									{showNotifications && (
										<div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
											<div className="p-4 border-b border-gray-200">
												<h3 className="text-lg font-bold text-gray-800">
													الإشعارات
												</h3>
											</div>
											<div className="max-h-96 overflow-y-auto">
												{notifications.length === 0 ? (
													<div className="p-8 text-center text-gray-500">
														<p>لا توجد إشعارات جديدة</p>
													</div>
												) : (
													notifications.map((notification, index) => (
														<div
															key={index}
															className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
														>
															<p className="text-sm text-gray-800">
																{notification.message}
															</p>
															<p className="text-xs text-gray-500 mt-1">
																{notification.time}
															</p>
														</div>
													))
												)}
											</div>
										</div>
									)}
								</div>

								{/* User Profile */}
								<div className="relative" ref={profileMenuRef}>
									<button
										onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
										className="flex items-center gap-2 hover:opacity-80 focus:outline-none"
									>
										<img
											src={account_circle}
											alt="User Account"
											className="h-8 w-8 rounded-full object-cover"
										/>
										<span className="hidden md:block text-sm font-medium text-gray-700">
											{getUserDisplayName()}
										</span>
									</button>

									{/* Profile Dropdown */}
									{isProfileMenuOpen && (
										<div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
											<div className="p-4 border-b border-gray-200">
												<p className="text-sm font-bold text-gray-800">
													{getUserDisplayName()}
												</p>
												<p className="text-xs text-gray-500">{user.email}</p>
												<p className="text-xs text-red-600 mt-1">
													{getUserRole()}
												</p>
											</div>
											<div className="py-2">
												<Link
													to="/profile"
													className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
													onClick={() => setIsProfileMenuOpen(false)}
												>
													👤 الملف الشخصي
												</Link>
												{/* Only show admin dashboard link for System Admin */}
												{user?.type === "employee" &&
													user?.employeeDetails?.employeeType ===
														"System Admin" && (
														<Link
															to="/admindashboard"
															className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
															onClick={() => setIsProfileMenuOpen(false)}
														>
															📊 لوحة التحكم
														</Link>
													)}
												{/* Only show settings for System Admin */}
												{user?.type === "employee" &&
													user?.employeeDetails?.employeeType ===
														"System Admin" && (
														<Link
															to="/settings"
															className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
															onClick={() => setIsProfileMenuOpen(false)}
														>
															⚙️ الإعدادات
														</Link>
													)}
												<button
													onClick={handleLogout}
													className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
												>
													🚪 تسجيل الخروج
												</button>
											</div>
										</div>
									)}
								</div>
							</>
						) : (
							<Link
								to="/login"
								className="flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-colors text-sm font-medium"
							>
								<span>تسجيل الدخول</span>
							</Link>
						)}
					</div>
				</div>

				{/* Mobile Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t border-gray-200 py-4">
						<nav className="flex flex-col space-y-2">
							{navigationItems.map((item, index) => (
								item.isDropdown ? (
									// Dropdown in mobile
									<div key={index} className="flex flex-col">
										<button
											onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
											className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
												item.dropdownItems?.some(sub => isActivePath(sub.path))
													? "text-red-800 font-bold bg-red-50"
													: "text-gray-700 hover:text-red-800 hover:bg-gray-50"
											}`}
										>
											<span>
												<span className="inline-block ml-2">{item.icon}</span>
												{item.label}
											</span>
											<svg 
												className={`w-4 h-4 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} 
												fill="none" 
												stroke="currentColor" 
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>
										{openDropdown === item.label && (
											<div className="mr-6 border-r-2 border-red-200">
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
																? "text-red-800 font-bold bg-red-50"
																: "text-gray-600 hover:text-red-800 hover:bg-gray-50"
														}`}
													>
														<span className="inline-block ml-2">{subItem.icon}</span>
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
												? "text-red-800 font-bold bg-red-50"
												: "text-gray-700 hover:text-red-800 hover:bg-gray-50"
										}`}
									>
										<span className="inline-block ml-2">{item.icon}</span>
										{item.label}
									</Link>
								)
							))}
						</nav>
					</div>
				)}
			</div>
		</header>
	);
};

export default Header;
