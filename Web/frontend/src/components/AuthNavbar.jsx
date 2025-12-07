import React from "react";
import { Link, useLocation } from "react-router-dom";
import coloredLogo from "../assets/images/coloredLogo.png";

const AuthNavbar = () => {
	const location = useLocation();
	const primaryColor = "#690000";

	const isLoginPage = location.pathname === "/login";
	const isRegisterPage = location.pathname === "/register";

	return (
		<header className="bg-white shadow-sm sticky top-0 z-50">
			<div className="w-full px-4 md:px-6">
				<div className="flex items-center justify-between h-16 w-full">
					{/* Left Section - Logo */}
					<div className="flex items-center gap-4">
						<Link to="/" className="flex items-center">
							<img
								src={coloredLogo}
								alt="النوران"
								className="h-10 w-auto cursor-pointer"
							/>
						</Link>
					</div>

					{/* Center - Navigation Links */}
					<nav className="hidden md:flex items-center gap-8">
						<Link
							to="/"
							className="text-gray-700 hover:text-red-800 transition-colors font-medium"
						>
							الرئيسية
						</Link>
						<Link
							to="/home"
							className="text-gray-700 hover:text-red-800 transition-colors font-medium"
						>
							تتبع شحنة
						</Link>
						<span className="text-gray-700 hover:text-red-800 transition-colors font-medium cursor-pointer">
							الدعم
						</span>
					</nav>

					{/* Right Section - Auth Links */}
					<div className="flex items-center gap-4">
						{!isLoginPage && (
							<Link
								to="/login"
								className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
								style={{
									color: primaryColor,
									border: `1px solid ${primaryColor}`,
								}}
							>
								تسجيل الدخول
							</Link>
						)}
						{!isRegisterPage && (
							<Link
								to="/register"
								className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
								style={{ backgroundColor: primaryColor }}
							>
								إنشاء حساب
							</Link>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default AuthNavbar;
