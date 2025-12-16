import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import account_circle from "../assets/images/account_circle.png";
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

const Header = () => {
	const [user, setUser] = useState(null);
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [showNotifications, setShowNotifications] = useState(false);
	const [openDropdown, setOpenDropdown] = useState(null);
	const [isScrolled, setIsScrolled] = useState(false);

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

		// Employee navigation
		if (user.type === "employee") {
			const employeeType = user.employeeDetails?.employeeType;
			const baseItems = [
				{ label: "لوحة التحكم", path: "/employeedashboard", icon: LayoutDashboard },
				// Import Section for Employees
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
				// Export Section for Employees
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

			// Add admin-specific items
			if (employeeType === "System Admin" || employeeType === "Department Manager") {
				baseItems.push(
					{ label: "الموظفين", path: "/employees", icon: Users },
					{ label: "التقارير", path: "/reports", icon: BarChart3 }
				);
			}

			// System Admin only
			if (employeeType === "System Admin") {
				baseItems.push({ label: "الإعدادات", path: "/settings", icon: Settings });
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

	return (
		<>
			{/* === EXECUTIVE GLASS RIBBON HEADER === */}
			<header 
				className={`
					sticky top-3 z-50 mx-3 md:mx-6 rounded-2xl transition-all duration-500 font-sans
					bg-white/80 backdrop-blur-2xl border border-white/40
					${isScrolled 
						? "shadow-[0_8px_40px_rgba(0,0,0,0.12)]" 
						: "shadow-[0_4px_20px_rgba(0,0,0,0.06)]"}
				`} 
				dir="rtl"
			>
				{/* Brand Accent Stripe - Matching ShipmentHero */}
				<div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#690000] via-[#8B0000] to-[#1BA3B6] rounded-t-2xl"></div>

				<div className="w-full px-4 md:px-6">
					<div className="flex items-center justify-between h-16 md:h-[70px] py-2 w-full">
						
						{/* ====================== */}
						{/* Right Section (Logo + Nav) */}
						{/* ====================== */}
						<div className="flex items-center gap-4 md:gap-8">
							{/* Mobile Menu Toggle */}
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="md:hidden p-2.5 rounded-xl text-gray-600 hover:bg-[#690000]/10 hover:text-[#690000] transition-all active:scale-95"
							>
								<Menu className="w-6 h-6" />
							</button>

							{/* Logo */}
							<Link
								to={user ? (user.type === "employee" ? "/employeedashboard" : "/home") : "/"}
								className="group relative flex items-center gap-2"
							>
								{/* Glow effect on hover */}
								<div className="absolute inset-0 bg-[#690000]/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-150"></div>
								<img
									src={coloredLogo}
									alt="Al-Noran"
									className="h-10 md:h-12 w-auto object-contain relative z-10 transform group-hover:scale-105 transition-transform duration-300"
								/>
							</Link>

							{/* Desktop Navigation */}
							<nav className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
								{navigationItems.map((item, index) =>
									item.isDropdown ? (
										// Dropdown Item
										<div key={index} className="relative">
											<button
												onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
												className={`
													flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 group
													${item.dropdownItems?.some(sub => isActivePath(sub.path))
														? "bg-[#690000] text-white shadow-lg shadow-[#690000]/20" 
														: "text-gray-600 hover:bg-gray-100 hover:text-[#690000]"}
												`}
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
															className={`
																flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all
																${isActivePath(subItem.path)
																	? "bg-[#690000] text-white"
																	: "text-gray-600 hover:bg-gray-50 hover:text-[#690000]"}
															`}
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
											className={`
												flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 group
												${isActivePath(item.path)
													? "bg-[#690000] text-white shadow-lg shadow-[#690000]/20" 
													: "text-gray-600 hover:bg-gray-100 hover:text-[#690000]"}
											`}
										>
											<item.icon className={`w-4 h-4 transition-colors ${isActivePath(item.path) ? "text-white" : "text-gray-400 group-hover:text-[#690000]"}`} />
											{item.label}
										</Link>
									)
								)}
							</nav>
						</div>

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
													<h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
														<Bell className="w-4 h-4 text-[#690000]" />
														الإشعارات
													</h3>
													<span className="text-xs bg-[#690000] text-white px-2.5 py-1 rounded-full font-bold">{notifications.length}</span>
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
													<div className="p-3 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50">
														<button
															onClick={() => {
																setNotifications([]);
																// TODO: Call API to mark all as read
															}}
															className="flex-1 text-xs font-bold text-gray-500 hover:text-[#690000] hover:bg-white px-3 py-2 rounded-lg transition-all"
														>
															تحديد الكل كمقروء
														</button>
														<Link
															to="/notifications"
															onClick={() => setShowNotifications(false)}
															className="flex-1 text-xs font-bold text-[#690000] hover:bg-[#690000]/10 px-3 py-2 rounded-lg transition-all text-center"
														>
															عرض الكل
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
											{/* Avatar with Glow Ring */}
											<div className="relative">
												<div className={`absolute inset-0 rounded-full bg-[#690000]/30 blur-md transition-opacity ${isProfileMenuOpen ? "opacity-100" : "opacity-0"}`}></div>
												<img
													src={account_circle}
													alt="Avatar"
													className="w-9 h-9 rounded-full ring-2 ring-white shadow-md object-cover relative z-10"
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
													<div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#690000] to-[#8B0000] text-white flex items-center justify-center font-bold text-lg shadow-lg">
														{getUserDisplayName().charAt(0)}
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
				</div>
			</header>

			{/* === MOBILE MENU OVERLAY === */}
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
									<div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#690000] to-[#8B0000] text-white flex items-center justify-center font-bold text-lg shadow-lg">
										{getUserDisplayName().charAt(0)}
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
		</>
	);
};

export default Header;
