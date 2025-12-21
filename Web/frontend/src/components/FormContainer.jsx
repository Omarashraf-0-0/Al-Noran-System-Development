import React from "react";
import { useTheme } from "../context/ThemeContext";

const FormContainer = ({ children, className = "", title }) => {
	const { isDarkMode } = useTheme();
	
	return (
		<div className="flex items-center justify-center w-full px-4 pb-12 pt-12 md:pt-24 min-h-[calc(100vh-80px)]">
			<div
				className={`
					p-6 sm:p-10 md:p-14 lg:p-16 rounded-3xl shadow-2xl border backdrop-blur-xl w-full max-w-4xl transition-all duration-300
					${isDarkMode ? "bg-[#1a1010]/90 border-white/10" : "bg-white/90 border-white/40"}
					${className}
				`}
			>
				{title && (
					<h2 className={`text-2xl sm:text-3xl font-bold mb-8 text-center ${isDarkMode ? "text-white" : "text-[#690000]"}`}>
						{title}
					</h2>
				)}
				{children}
			</div>
		</div>
	);
};

export default FormContainer;
