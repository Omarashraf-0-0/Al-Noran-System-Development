import React from "react";
import { useTheme } from "../context/ThemeContext";

/**
 * UploadProgress Component
 * Displays overall progress of document uploads
 */
const UploadProgress = ({ completedCount, totalCount }) => {
	const { isDarkMode } = useTheme();
	const completionPercentage = Math.round((completedCount / totalCount) * 100);

	return (
		<div className={`mb-8 p-4 rounded-xl border transition-all duration-300 ${
			isDarkMode 
				? "bg-gradient-to-r from-red-900/20 to-black/40 border-red-500/20" 
				: "bg-gradient-to-r from-red-50 to-white border-red-100"
		}`}>
			<div className="flex justify-between items-center mb-3">
				<span className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
					التقدم الإجمالي
				</span>
				<span className={`text-sm font-bold ${isDarkMode ? "text-red-400" : "text-red-700"}`}>
					{completedCount} / {totalCount}
				</span>
			</div>
			<div className={`w-full rounded-full h-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
				<div
					className="bg-gradient-to-r from-red-600 to-red-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg shadow-red-500/30"
					style={{ width: `${completionPercentage}%` }}
				></div>
			</div>
			<p className={`text-xs mt-2 font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
				{completionPercentage}% مكتمل
			</p>
		</div>
	);
};

export default UploadProgress;
