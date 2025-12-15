import React from "react";
import { Link } from "react-router-dom";

const HeroSection = () => {
	const user = JSON.parse(localStorage.getItem("user") || "null");

	return (
		<section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
			{/* Background Image with Parallax-like effect */}
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
				style={{
					backgroundImage: "url('/src/assets/images/hero-bg.png')",
				}}
			>
				{/* Modern Gradient Overlay */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
			</div>

			{/* Floating Elements/Decoration (Optional) */}
			<div className="absolute top-20 left-20 w-32 h-32 bg-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
			<div className="absolute top-40 right-20 w-32 h-32 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

			{/* Content */}
			<div className="relative z-10 container mx-auto px-4 text-center">
				<div className="flex flex-col items-center justify-center space-y-8 animate-fade-in-up">
					{/* Small Watermark Logo */}
					<div className="w-24 h-24 md:w-32 md:h-32 mb-4 opacity-90 drop-shadow-2xl">
						<img
							src="/src/assets/images/coloredLogo.svg"
							alt="النوران"
							className="w-full h-full object-contain filter drop-shadow-lg"
						/>
					</div>

					{/* Main Heading */}
					<h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-lg max-w-5xl">
						شريكك الموثوق في <br />
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-white">
							عالم التصدير والتخليص الجمركي
						</span>
					</h1>

					{/* Subheading */}
					<p className="text-lg md:text-2xl text-gray-200 max-w-3xl leading-relaxed font-light">
						أكثر من 10 سنوات من الخبرة. ننهي إجراءاتك بدقة، ونبني جسور الثقة بين الأسواق
						العالمية والمحلية.
					</p>

					{/* CTAs */}
					<div className="flex flex-col sm:flex-row gap-4 mt-8">
						{!user && (
							<Link
								to="/register"
								className="px-8 py-4 bg-red-700 hover:bg-red-800 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-red-900/50 transition-all transform hover:-translate-y-1"
							>
								ابدأ الآن مجاناً
							</Link>
						)}
						<button
							onClick={() => {
								document
									.getElementById("tracking-section")
									?.scrollIntoView({ behavior: "smooth" });
							}}
							className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 text-lg font-bold rounded-full shadow-lg transition-all transform hover:-translate-y-1"
						>
							تتبع شحنتك
						</button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
