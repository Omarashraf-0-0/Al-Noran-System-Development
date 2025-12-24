import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const AuthNavbar = () => {
	const location = useLocation();
    const { isDarkMode, toggleTheme } = useTheme();
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
					? isDarkMode ? "bg-[#1a1a1a]/90 backdrop-blur-md shadow-lg border-b border-white/5 py-2" : "bg-white shadow-md py-2" 
					: "bg-transparent py-4 md:py-6"
			}`}
		>
			<div className="container mx-auto px-4 flex items-center justify-between">
				{/* Left Section - Logo */}
				<Link to="/" className="flex items-center gap-2">
					<img
						src="/images/coloredLogo.png"
						alt="النوران"
						className={`h-10 w-auto transition-transform hover:scale-105 ${
							scrolled && !isDarkMode ? "" : "brightness-0 invert drop-shadow-md"
						}`}
					/>
				</Link>

				{/* Center - Navigation Links (Desktop) */}
				<nav className="hidden md:flex items-center gap-8">
					<Link
						to="/"
						className={`text-base font-medium transition-colors ${
							scrolled
								? isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-[#690000]"
								: "text-white/90 hover:text-white"
						}`}
					>
						الرئيسية
					</Link>
				</nav>

				{/* Right Section - Auth Links */}
				<div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-all duration-300 ${
                            scrolled
                                ? isDarkMode ? "bg-white/10 text-yellow-400 hover:bg-white/20" : "bg-gray-100 text-[#690000] hover:bg-gray-200"
                                : "bg-white/20 text-yellow-300 hover:bg-white/30 backdrop-blur-sm"
                        }`}
                        aria-label="Toggle Dark Mode"
                    >
                        {isDarkMode ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

					{isLoginPage ? (
						<Link
							to="/register"
							className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all transform hover:-translate-y-0.5 ${
								scrolled
									? isDarkMode 
                                        ? "bg-[#690000] text-white hover:bg-[#8B0000] shadow-lg hover:shadow-red-900/20"
                                        : "bg-[#690000] text-white hover:bg-[#8B0000] shadow-lg hover:shadow-red-900/20"
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
									? isDarkMode
                                        ? "bg-[#690000] text-white hover:bg-[#8B0000] shadow-lg hover:shadow-red-900/20"
                                        : "bg-[#690000] text-white hover:bg-[#8B0000] shadow-lg hover:shadow-red-900/20"
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
