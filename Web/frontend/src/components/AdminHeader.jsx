import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import account_circle from "../assets/images/account_circle.png";
import notifications_unread from "../assets/images/notifications_unread.png";
import coloredLogo from "../assets/images/coloredLogo.png";
import dehaze from "../assets/images/dehaze.png";
import cancelpreset from "../assets/images/cancel_presentation.png";
import folderCheck from "../assets/images/folder_check.png";
import pdfPic from "../assets/images/picture_as_pdf.png";

const Header = () => {
	const [showNotifications, setShowNotifications] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [user, setUser] = useState(null);
	const notificationRef = useRef(null);
	const userMenuRef = useRef(null);
	const navigate = useNavigate();
	const location = useLocation();

	// Load user data
	useEffect(() => {
		const userData = JSON.parse(localStorage.getItem("user"));
		setUser(userData);
	}, []);

	// Load notifications
	useEffect(() => {
		const loadNotifications = async () => {
			try {
				// TODO: Replace with real API call
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
				notificationRef.current &&
				!notificationRef.current.contains(event.target)
			) {
				setShowNotifications(false);
			}
			if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
				setShowUserMenu(false);
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

	const adminNavItems = [
		{ label: "لوحة التحكم", path: "/admindashboard", icon: "📊" },
		{ label: "إدارة الموظفين", path: "/employeemanagement", icon: "👔" },
		{ label: "إدارة العملاء", path: "/customermanagement", icon: "👥" },
		{ label: "إدارة الشهادات", path: "/certificatesmanagement", icon: "📜" },
		{ label: "إدارة الشحنات", path: "/shipmentsmanagement", icon: "🚢" },
	];

	const getUserDisplayName = () => {
		if (!user) return "مدير";
		return user.fullname || user.username || "مدير النظام";
	};

	return (
		<header className="bg-white shadow-sm">
			<div className="w-full px-6">
				<div className="flex items-center justify-between h-16 w-full">
					{/* Left side - Logo and Desktop Navigation */}
					<div className="flex items-center gap-6">
						{/* Mobile Menu Button */}
						<button
							onClick={() => setShowMobileMenu(!showMobileMenu)}
							className="md:hidden p-1 rounded-md hover:opacity-80 focus:outline-none"
						>
							<img src={dehaze} alt="Menu" className="h-7 w-7 object-contain" />
						</button>

						{/* Logo */}
						<a href="/admindashboard">
							<img
								src={coloredLogo}
								alt="Logo"
								className="h-8 w-auto object-contain cursor-pointer"
							/>
						</a>

						{/* Desktop Navigation */}
						<nav className="hidden md:flex items-center">
							<div className="flex items-baseline space-x-4 space-x-reverse">
								{adminNavItems.map((item) => (
									<a
										key={item.path}
										href={item.path}
										className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${
											isActivePath(item.path)
												? "bg-red-800 text-white"
												: "text-red-800 hover:bg-red-50"
										}`}
									>
										{item.icon && <span className="mr-1">{item.icon}</span>}
										{item.label}
									</a>
								))}
							</div>
						</nav>
					</div>

					{/* Right side - Notifications and User Menu */}
					<div className="flex items-center gap-4">
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
								<div
									className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
									dir="rtl"
								>
									<div className="p-4 border-b border-gray-200">
										<h3 className="text-lg font-bold text-gray-800 text-right">
											التنبيهات
										</h3>
									</div>
									<div className="max-h-96 overflow-y-auto">
										{notifications.length === 0 ? (
											<div className="p-8 text-center text-gray-500">
												<p>لا توجد تنبيهات جديدة</p>
											</div>
										) : (
											notifications.map((item) => (
												<div
													key={item.id}
													className="p-4 border-b border-gray-100"
												>
													<h3 className="text-sm font-semibold text-gray-800 mb-2 text-right">
														{item.title}
													</h3>

													{item.category && (
														<p className="text-gray-500 text-xs flex items-center gap-2 justify-end">
															<span>{item.category}</span>
															<img
																src={item.icon}
																alt="category icon"
																className="w-4 h-4 object-contain"
															/>
														</p>
													)}

													<p className="text-gray-400 text-xs mt-1 text-right">
														{item.date}
													</p>

													{item.actions && (
														<div className="flex gap-2 mt-3 justify-end">
															<button className="flex items-center gap-1 bg-[#6B0F1A] text-white px-3 py-1.5 rounded-md text-xs">
																<img
																	src={folderCheck}
																	alt="approve icon"
																	className="w-3 h-3"
																/>
																<span>اعتماد</span>
															</button>

															<button className="flex items-center gap-1 border border-[#6B0F1A] text-[#6B0F1A] px-3 py-1.5 rounded-md text-xs">
																<img
																	src={cancelpreset}
																	alt="reject icon"
																	className="w-3 h-3"
																/>
																<span>رفض</span>
															</button>
														</div>
													)}
												</div>
											))
										)}
									</div>
								</div>
							)}
						</div>

						{/* User Menu */}
						<div className="relative" ref={userMenuRef}>
							<button
								onClick={() => setShowUserMenu(!showUserMenu)}
								className="rounded-full flex items-center text-sm focus:outline-none hover:opacity-80"
							>
								<img
									src={account_circle}
									alt="User Account"
									className="h-8 w-8 rounded-full object-cover"
								/>
							</button>

							{/* User Dropdown */}
							{showUserMenu && (
								<div
									className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
									dir="rtl"
								>
									<div className="p-4 border-b border-gray-200">
										<p className="text-sm font-bold text-gray-800 text-right">
											{getUserDisplayName()}
										</p>
										<p className="text-xs text-gray-500 text-right">
											مدير النظام
										</p>
									</div>
									<div className="py-2">
										<a
											href="/admindashboard"
											className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-right"
										>
											📊 لوحة التحكم
										</a>
										<a
											href="/employeedashboard"
											className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-right"
										>
											💼 لوحة الموظف
										</a>
										<a
											href="/profile"
											className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-right"
										>
											👤 الملف الشخصي
										</a>
										<button
											onClick={handleLogout}
											className="w-full text-right block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
										>
											🚪 تسجيل الخروج
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Mobile Navigation Menu */}
				{showMobileMenu && (
					<div className="md:hidden border-t border-gray-200">
						<nav className="px-2 pt-2 pb-4 space-y-1">
							{adminNavItems.map((item) => (
								<a
									key={item.path}
									href={item.path}
									className={`block px-3 py-2 rounded-md text-sm font-bold transition-colors ${
										isActivePath(item.path)
											? "bg-red-800 text-white"
											: "text-red-800 hover:bg-red-50"
									}`}
									onClick={() => setShowMobileMenu(false)}
								>
									{item.icon && <span className="mr-2">{item.icon}</span>}
									{item.label}
								</a>
							))}
						</nav>
					</div>
				)}
			</div>
		</header>
	);
};

export default Header;
