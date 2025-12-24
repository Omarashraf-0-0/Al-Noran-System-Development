import React from "react";
import { useTheme } from "../context/ThemeContext";

const EmployeeStatistics = ({ employees }) => {
	const { isDarkMode } = useTheme();
	const totalEmployees = employees.length;
	const activeEmployees = employees.filter((e) => e.status === "نشط" || e.status === true || e.active === true).length;
	const suspendedEmployees = employees.filter((e) => e.suspended).length;

	// Theme classes
	const theme = {
		textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-[#690000]",
		textSecondary: isDarkMode ? "text-[#D4AF37]/80" : "text-gray-600",
		cardBg: isDarkMode ? "bg-[#1a1600]/60 border-[#D4AF37]/20" : "bg-white border-gray-100",
		statValue: isDarkMode ? "text-[#D4AF37]" : "text-[#690000]",
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0 mb-8 max-w-6xl mx-auto w-full">
			{/* Total Employees */}
			<div className={`${theme.cardBg} backdrop-blur-md rounded-2xl p-6 border shadow-sm flex items-center justify-between`}>
				<div>
					<p className={`text-sm font-medium ${theme.textSecondary}`}>إجمالي الموظفين</p>
					<h3 className={`text-3xl font-bold ${theme.statValue} mt-1`}>{totalEmployees}</h3>
				</div>
				<div className={`p-3 rounded-xl bg-blue-500/10 text-blue-500 text-2xl`}>
					👥
				</div>
			</div>

			{/* Active Employees */}
			<div className={`${theme.cardBg} backdrop-blur-md rounded-2xl p-6 border shadow-sm flex items-center justify-between`}>
				<div>
					<p className={`text-sm font-medium ${theme.textSecondary}`}>موظفين نشطين</p>
					<h3 className={`text-3xl font-bold text-emerald-500 mt-1`}>{activeEmployees}</h3>
				</div>
				<div className={`p-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-2xl`}>
					✅
				</div>
			</div>

			{/* Suspended Employees */}
			<div className={`${theme.cardBg} backdrop-blur-md rounded-2xl p-6 border shadow-sm flex items-center justify-between`}>
				<div>
					<p className={`text-sm font-medium ${theme.textSecondary}`}>موظفين موقوفين</p>
					<h3 className={`text-3xl font-bold text-red-500 mt-1`}>{suspendedEmployees}</h3>
				</div>
				<div className={`p-3 rounded-xl bg-red-500/10 text-red-500 text-2xl`}>
					⛔
				</div>
			</div>
		</div>
	);
};

export default EmployeeStatistics;
