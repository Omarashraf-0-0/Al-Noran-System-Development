import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const AuthNavbar = () => {
	const location = useLocation();
	const [scrolled, setScrolled] = useState(false);
	
	const isLoginPage = location.pathname === "/login";

	// Handle scroll effect
	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<header 
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				scrolled 
					? "bg-white shadow-md py-2" 
					: "bg-transparent py-4 md:py-6"
			}`}
		>
			<div className="container mx-auto px-4 flex items-center justify-between">
				{/* Left Section - Logo */}
				<Link to="/" className="flex items-center gap-2">
					<img
						src="/src/assets/images/coloredLogo.png"
						alt="النوران"
						className={`h-10 w-auto transition-transform hover:scale-105 ${
							scrolled ? "" : "brightness-0 invert drop-shadow-md"
						}`}
					/>
				</Link>

				{/* Center - Navigation Links (Desktop) */}
				<nav className="hidden md:flex items-center gap-8">
					<Link
						to="/"
						className={`text-base font-medium transition-colors ${
							scrolled
								? "text-gray-700 hover:text-[#690000]"
								: "text-white/90 hover:text-white"
						}`}
					>
						الرئيسية
					</Link>
				</nav>

				{/* Right Section - Auth Links */}
				<div className="flex items-center gap-4">
					{isLoginPage ? (
						<Link
							to="/register"
							className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all transform hover:-translate-y-0.5 ${
								scrolled
									? "bg-[#690000] text-white hover:bg-[#8B0000] shadow-lg hover:shadow-red-900/20"
									: "bg-white text-[#690000] hover:bg-gray-100 shadow-xl"
							}`}
						>
							<span>إنشاء حساب</span>
						</Link>
					) : (
						<Link
							to="/login"
							className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all transform hover:-translate-y-0.5 ${
								scrolled
									? "bg-[#690000] text-white hover:bg-[#8B0000] shadow-lg hover:shadow-red-900/20"
									: "bg-white text-[#690000] hover:bg-gray-100 shadow-xl"
							}`}
						>
							<span>تسجيل الدخول</span>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
};

export default AuthNavbar;
