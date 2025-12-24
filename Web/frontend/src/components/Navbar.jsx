import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const Navbar = ({ showAuth = false, showSearch = false, onSearchClick = null }) => {
	const [scrolled, setScrolled] = useState(false);
	const [user, setUser] = useState(null);
	const { isDarkMode, toggleTheme } = useTheme();

	// Handle scroll effect
	useEffect(() => {
		const handleScroll = () => {
			const isScrolled = window.scrollY > 10;
			setScrolled(isScrolled);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

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

	const handleSearchClick = () => {
		if (onSearchClick) {
			onSearchClick();
		} else {
			const searchSection = document.getElementById("search-section");
			if (searchSection) {
				searchSection.scrollIntoView({ behavior: "smooth" });
			}
		}
	};

	// Determine dashboard path based on user type
	const getDashboardPath = () => {
		if (!user) return "/login";
		if (user.type === "employee") return "/employeedashboard";
		return "/home"; // Default for clients
	};

	// Determine theme colors based on user type
	const getThemeColors = () => {
		if (user?.type === "admin") {
			return {
				button: "bg-[#D4AF37] text-white hover:bg-[#B5952F] shadow-lg hover:shadow-[#D4AF37]/30",
				textHover: isDarkMode ? "text-gray-200 hover:text-[#D4AF37]" : "text-gray-700 hover:text-[#D4AF37]",
				logoFilter: "sepia(100%) hue-rotate(10deg) saturate(300%)" // Gold
			};
		}
		if (user?.type === "employee") {
			return {
				button: "bg-[#1ba3b6] text-white hover:bg-[#158A9A] shadow-lg hover:shadow-[#1ba3b6]/30",
				textHover: isDarkMode ? "text-gray-200 hover:text-[#1ba3b6]" : "text-gray-700 hover:text-[#1ba3b6]",
				logoFilter: "sepia(100%) hue-rotate(130deg) saturate(300%)" // Turquoise/Cyan
			};
		}
		// Default Client Theme (Red)
		return {
			button: "bg-[#690000] text-white hover:bg-[#8B0000] shadow-lg hover:shadow-[#690000]/30",
			textHover: isDarkMode ? "text-gray-200 hover:text-[#690000]" : "text-gray-700 hover:text-[#690000]",
			logoFilter: ""
		};
	};

	const themeColors = getThemeColors();

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
				scrolled
					? (isDarkMode ? "bg-[#0a0a0a]/95 backdrop-blur-md shadow-lg border-b border-white/5 py-2" : "bg-white/95 backdrop-blur-md shadow-lg py-2")
					: "bg-gradient-to-b from-black/60 to-transparent py-4 md:py-6"
			}`}
		>
			<div className="container mx-auto px-4 flex items-center justify-between">

				{/* Right Section - Logo and Nav */}
				<div className="flex items-center gap-12">
					<Link to="/" className="flex items-center gap-2">
						{/* Use colored logo when scrolled, white logo when transparent */}
						<img
							src="/images/coloredLogo.png"
							alt="النوران"
							className={`h-10 w-auto transition-transform hover:scale-105 ${
								scrolled && !isDarkMode ? "" : "brightness-0 invert drop-shadow-md"
							}`}
							style={scrolled && (user?.type === "employee" || user?.type === "admin") ? { filter: themeColors.logoFilter } : {}}
						/>
					</Link>

				<nav className="hidden md:flex items-center gap-8">
						{[
							{ label: "الرئيسية", path: "/" },
							{ label: "عن النوران", action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
							{ label: "خدماتنا", action: () => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }) },
							{ label: "تتبع الشحنة", action: () => document.getElementById("tracking-section")?.scrollIntoView({ behavior: "smooth" }) },
						].map((item, index) => (
							item.action ? (
								<button
									key={index}
									onClick={item.action}
									className={`text-base font-medium transition-colors ${
										scrolled
											? themeColors.textHover
											: "text-white/90 hover:text-white"
									}`}
								>
									{item.label}
								</button>
							) : (
								<Link
									key={index}
									to={item.path}
									className={`text-base font-medium transition-colors ${
										scrolled
											? themeColors.textHover
											: "text-white/90 hover:text-white"
									}`}
								>
									{item.label}
								</Link>
							)
						))}
				</nav>
				</div>

				{/* Left Section - Actions */}
				<div className="flex items-center gap-4">
					{/* Theme Toggle */}
					<button
						onClick={toggleTheme}
						className={`p-2 rounded-full transition-all duration-300 ${
							scrolled
								? (isDarkMode ? "bg-white/10 text-yellow-400 hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200")
								: "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
						}`}
						title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
					>
						{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
					</button>

					{showSearch && (
						<button
							onClick={handleSearchClick}
							className={`p-2 rounded-full transition-colors ${
								scrolled
									? (isDarkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100")
									: "text-white hover:bg-white/10"
							}`}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</button>
					)}

					{showAuth && (
						<Link
							to={user ? getDashboardPath() : "/login"}
							className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 ${
								scrolled
									? themeColors.button
									: "bg-white text-gray-900 hover:bg-gray-50 shadow-xl hover:shadow-2xl"
							}`}
						>
							{user ? (
								<span className="flex items-center gap-2">
									<span>👤</span>
									<span>لوحة التحكم</span>
								</span>
							) : (
								<span>تسجيل الدخول</span>
							)}
						</Link>
					)}
				</div>
			</div>
		</header>
	);
};

export default Navbar;
