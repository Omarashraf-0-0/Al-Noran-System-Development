import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = ({ showAuth = false, showSearch = false, onSearchClick = null }) => {
	const [scrolled, setScrolled] = useState(false);
	const [user, setUser] = useState(null);

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

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
				scrolled
					? "bg-white/95 backdrop-blur-md shadow-lg py-2"
					: "bg-gradient-to-b from-black/30 to-transparent py-4 md:py-6"
			}`}
		>
			<div className="container mx-auto px-4 flex items-center justify-between">

				{/* Right Section - Logo and Nav */}
				<div className="flex items-center gap-12">
					<Link to="/" className="flex items-center gap-2">
						{/* Use colored logo when scrolled, white logo when transparent (if available, else colored) */}
						<img
							src="/src/assets/images/coloredLogo.png"
							alt="النوران"
							className={`h-10 w-auto transition-transform hover:scale-105 ${
								scrolled ? "" : "brightness-0 invert drop-shadow-md"
							}`}
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
											? "text-gray-700 hover:text-[#690000]"
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
											? "text-gray-700 hover:text-[#690000]"
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
					{showSearch && (
						<button
							onClick={handleSearchClick}
							className={`p-2 rounded-full transition-colors ${
								scrolled
									? "text-gray-600 hover:bg-gray-100"
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
									? "bg-[#690000] text-white hover:bg-[#8B0000] shadow-lg hover:shadow-[#690000]/30"
									: "bg-white text-[#690000] hover:bg-gray-50 shadow-xl hover:shadow-2xl"
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
