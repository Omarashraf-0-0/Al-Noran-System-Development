import React from "react";
import { Link } from "react-router-dom";

const HeroSection = () => {
	const user = JSON.parse(localStorage.getItem("user") || "null");

	return (
		<section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
			{/* Background Image with Parallax-like effect */}
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
				style={{
					backgroundImage: "url('/src/assets/images/hero-bg.png')",
				}}
			>
				{/* Modern Gradient Overlay with Brand Colors - Darker for consistency */}
				<div className="absolute inset-0 bg-gradient-to-t from-[#690000]/95 via-black/70 to-black/50"></div>
			</div>

			{/* Floating Elements/Decoration with Brand Colors */}
			<div className="absolute top-20 left-20 w-40 h-40 bg-[#690000] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
			<div className="absolute top-40 right-20 w-40 h-40 bg-[#1ba3b6] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
			<div className="absolute bottom-40 left-1/3 w-32 h-32 bg-[#1ba3b6] rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse animation-delay-4000"></div>

			{/* Content */}
			<div className="relative z-10 container mx-auto px-4 text-center">
				<div className="flex flex-col items-center justify-center space-y-8">
					{/* Small Watermark Logo with Glow Effect */}
					<div className="w-36 h-36 md:w-44 md:h-44 mb-4 opacity-95 drop-shadow-2xl animate-fade-in">
						<img
							src="/src/assets/images/coloredLogo.svg"
							alt="النوران"
							className="w-full h-full object-contain filter drop-shadow-lg"
						/>
					</div>

					{/* Main Heading */}
					<h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-lg max-w-5xl animate-fade-in-up">
						شريكك الموثوق في <br />
						<span className="text-[#1ba3b6] drop-shadow-[0_0_30px_rgba(27,163,182,0.5)]">
							عالم التصدير والتخليص الجمركي
						</span>
					</h1>

					{/* Subheading */}
					<p className="text-lg md:text-2xl text-gray-100 max-w-3xl leading-relaxed font-light animate-fade-in-up animation-delay-200">
						أكثر من 10 سنوات من الخبرة. ننهي إجراءاتك بدقة، ونبني جسور الثقة بين الأسواق
						العالمية والمحلية.
					</p>

					{/* Stats Row */}
					<div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-4 animate-fade-in-up animation-delay-400">
						<div className="text-center">
							<div className="text-3xl md:text-4xl font-bold text-[#1ba3b6]">+10</div>
							<div className="text-sm md:text-base text-gray-200">سنوات خبرة</div>
						</div>
						<div className="text-center">
							<div className="text-3xl md:text-4xl font-bold text-[#1ba3b6]">+1000</div>
							<div className="text-sm md:text-base text-gray-200">عميل سعيد</div>
						</div>
						<div className="text-center">
							<div className="text-3xl md:text-4xl font-bold text-[#1ba3b6]">+5000</div>
							<div className="text-sm md:text-base text-gray-200">شحنة مكتملة</div>
						</div>
					</div>

					{/* CTAs */}
					<div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fade-in-up animation-delay-600">
						{user ? (
							<Link
								to={user.type === "employee" ? "/employeedashboard" : "/home"}
								className="group px-10 py-4 bg-[#690000] hover:bg-[#8B0000] text-white text-lg font-bold rounded-full shadow-lg hover:shadow-[#690000]/40 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
							>
								<span className="flex items-center gap-2">
									لوحة التحكم
									<svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
									</svg>
								</span>
							</Link>
						) : (
							<Link
								to="/register"
								className="group px-10 py-4 bg-[#690000] hover:bg-[#8B0000] text-white text-lg font-bold rounded-full shadow-lg hover:shadow-[#690000]/40 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
							>
								<span className="flex items-center gap-2">
									ابدأ الآن مجاناً
									<svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
									</svg>
								</span>
							</Link>
						)}
						<button
							onClick={() => {
								document
									.getElementById("tracking-section")
									?.scrollIntoView({ behavior: "smooth" });
							}}
							className="group px-10 py-4 bg-white/10 hover:bg-[#1ba3b6]/20 backdrop-blur-md text-white border-2 border-[#1ba3b6]/50 hover:border-[#1ba3b6] text-lg font-bold rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1"
						>
							<span className="flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
								تتبع شحنتك
							</span>
						</button>
					</div>
				</div>
			</div>

			{/* Scroll Indicator */}
			<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
				<div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
					<div className="w-1 h-3 bg-white/50 rounded-full animate-pulse"></div>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
