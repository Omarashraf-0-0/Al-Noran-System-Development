import React from "react";
import { useTheme } from "../context/ThemeContext";

const DataField = ({ label, value, icon, className = "" }) => {
	const { isDarkMode } = useTheme();

	return (
		<div className={`group ${className}`}>
			<label className={`block text-xs font-bold tracking-wider uppercase mb-2 ml-1 transition-colors duration-300 ${
				isDarkMode ? "text-gray-400 group-hover:text-red-400" : "text-gray-500 group-hover:text-red-800"
			}`}>
				{label}
			</label>
			<div className="relative">
				<div
					className={`w-full min-h-[3rem] px-4 py-3 rounded-xl border transition-all duration-300 flex items-center justify-start ${
						isDarkMode
							? "bg-white/5 border-white/10 text-gray-200 group-hover:border-red-500/50 group-hover:bg-white/10"
							: "bg-white border-gray-200 text-gray-800 shadow-sm group-hover:border-red-300 group-hover:shadow-md"
					}`}
				>
					<span className="font-medium text-sm sm:text-base break-words w-[calc(100%-2rem)]">
						{value}
					</span>
				</div>
				<div 
					className={`absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none transition-colors duration-300 ${
						isDarkMode ? "text-gray-500 group-hover:text-red-400" : "text-gray-400 group-hover:text-red-600"
					}`}
				>
					{icon}
				</div>
			</div>
		</div>
	);
};

export default DataField;
