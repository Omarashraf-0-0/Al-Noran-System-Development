import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({
	showAuth = false,
	showSearch = false,
	onSearchClick = null,
}) => {
	const handleSearchClick = () => {
		if (onSearchClick) {
			onSearchClick();
		} else {
			// Default behavior: scroll to search section if it exists
			const searchSection = document.getElementById("search-section");
			if (searchSection) {
				searchSection.scrollIntoView({ behavior: "smooth" });
			}
		}
	};

	return (
		<>
			<header className="bg-[#1BA3B6] text-white p-4 shadow-md">
				<div className="container mx-auto flex items-center justify-between">

					{/* Right Section - Auth and Search */}
          <div className="flex gap-8">
            {/* need the logo to direct to the landing page */}
						<img
							src="/src/assets/images/logo.png"
							alt="النوران"
							className="h-10 cursor-pointer"
							onClick={() => window.location.href = "/"}
						/>
            <nav className="hidden md:flex gap-8">
						<span className="text-xl cursor-pointer hover:text-gray-200 transition-colors">
							الدعم
						</span>
						<span className="text-xl cursor-pointer hover:text-gray-200 transition-colors">
							تتبع الشحنة
						</span>
						<span className="text-xl cursor-pointer hover:text-gray-200 transition-colors">
							الشحن
						</span>
					</nav>

					</div>
          {/* Center - Navigation Links */}
					
					{/* Left Section - Logo */}

					<div className="flex items-center gap-6">
						{/* Search Icon */}
						{showSearch && (
							<button
								onClick={handleSearchClick}
								className="hover:text-gray-200 transition-colors"
								aria-label="بحث"
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

						{/* Auth Links with User Icon */}
						{showAuth && (
							<Link
								to="/login"
								className="flex items-center gap-2 hover:text-gray-200 transition-colors"
							>
								<svg
									className="w-6 h-6"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
										clipRule="evenodd"
									/>
								</svg>
								<span className="text-lg">تسجيل الدخول / إنشاء حساب</span>
							</Link>
						)}
					</div>

					

					
				</div>
			</header>
		</>
	);
};

export default Navbar;
