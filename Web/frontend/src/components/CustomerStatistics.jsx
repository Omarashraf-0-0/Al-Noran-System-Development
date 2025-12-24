import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Users, UserCheck } from "lucide-react";

/**
 * CustomerStatistics Component
 * Displays statistics for customers (total customers, active customers)
 */
const CustomerStatistics = ({ customers }) => {
	const { isDarkMode } = useTheme();
	const totalCustomers = customers.length;
	const activeCustomers = customers.filter(
		(c) => c.status === "نشط" || c.active === true
	).length;

	// Theme classes
	const theme = {
		cardBg: isDarkMode
			? "bg-[#1a1600]/60 border-[#D4AF37]/20"
			: "bg-white border-gray-100",
		textSecondary: isDarkMode ? "text-[#D4AF37]/80" : "text-gray-600",
		statValue: isDarkMode ? "text-[#D4AF37]" : "text-[#690000]",
		iconTotalBg: isDarkMode ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-blue-50 text-blue-600",
		iconActiveBg: isDarkMode ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-600",
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0 mb-8 max-w-4xl mx-auto w-full">
			{/* Total Customers */}
			<div
				className={`${theme.cardBg} backdrop-blur-md rounded-2xl p-6 border shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-default`}
			>
				<div>
					<p className={`text-sm font-medium ${theme.textSecondary}`}>
						إجمالي العملاء
					</p>
					<h3 className={`text-3xl font-bold ${theme.statValue} mt-1`}>
						{totalCustomers}
					</h3>
				</div>
				<div className={`p-3 rounded-xl ${theme.iconTotalBg}`}>
					<Users className="w-8 h-8" />
				</div>
			</div>

			{/* Active Customers */}
			<div
				className={`${theme.cardBg} backdrop-blur-md rounded-2xl p-6 border shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-default`}
			>
				<div>
					<p className={`text-sm font-medium ${theme.textSecondary}`}>
						العملاء النشطين
					</p>
					<h3 className="text-3xl font-bold text-emerald-500 mt-1">
						{activeCustomers}
					</h3>
				</div>
				<div className={`p-3 rounded-xl ${theme.iconActiveBg}`}>
					<UserCheck className="w-8 h-8" />
				</div>
			</div>
		</div>
	);
};

export default CustomerStatistics;
