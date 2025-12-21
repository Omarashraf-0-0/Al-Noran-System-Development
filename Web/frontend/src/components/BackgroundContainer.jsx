import React from "react";
import { useTheme } from "../context/ThemeContext";

const BackgroundContainer = ({ children }) => {
	const { isDarkMode } = useTheme();

	return (
		<div className={`min-h-screen w-full relative transition-colors duration-300 overflow-x-hidden ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`}>
			{/* Animated Background Elements */}
			<div className="fixed inset-0 pointer-events-none z-0">
				{isDarkMode ? (
					<>
						<div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#690000]/10 rounded-full filter blur-[100px] animate-pulse-glow"></div>
						<div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#2b0000]/20 rounded-full filter blur-[120px] animate-float-slow"></div>
					</>
				) : (
					<>
						<div className="absolute top-0 right-0 w-full h-[600px] bg-gradient-to-b from-red-50/80 to-transparent"></div>
						<div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-red-100/50 rounded-full filter blur-[80px] animate-pulse-slow"></div>
					</>
				)}
			</div>

			{/* Content Wrapper */}
			<div className="relative z-10 w-full flex flex-col min-h-screen">
				{children}
			</div>
		</div>
	);
};

export default BackgroundContainer;
