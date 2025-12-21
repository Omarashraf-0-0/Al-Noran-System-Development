import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import account_circle from "../assets/images/account_circle.png";
import coloredLogo from "../assets/images/coloredLogo.png";
import dehaze from "../assets/images/dehaze.png";
import NotificationBell from "./NotificationBell";

const Header = () => {
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [user, setUser] = useState(null);
	const userMenuRef = useRef(null);
	const navigate = useNavigate();
	const location = useLocation();

	// Load user data
	useEffect(() => {
		const userData = JSON.parse(localStorage.getItem("user"));
		setUser(userData);
	}, []);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
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
		{ label: "إدارة المدفوعات", path: "/payments-management", icon: "💳" },
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
										className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${isActivePath(item.path)
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
						{/* Using NotificationBell component */}
						<NotificationBell />

						{/* User Menu */}
						<div className="relative" ref={userMenuRef}>
							<button
								onClick={() => setShowUserMenu(!showUserMenu)}
								className="flex items-center gap-2 hover:opacity-80 focus:outline-none"
							>
								<img
									src={account_circle}
									alt="User"
									className="h-10 w-10 rounded-full object-cover"
								/>
								<span className="text-sm font-bold text-gray-700 hidden md:block">
									{getUserDisplayName()}
								</span>
							</button>

							{/* User Dropdown Menu */}
							{showUserMenu && (
								<div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
									<div className="py-1" dir="rtl">
										<a
											href="/profile"
											className="w-full text-right block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
									className={`block px-3 py-2 rounded-md text-sm font-bold transition-colors ${isActivePath(item.path)
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
