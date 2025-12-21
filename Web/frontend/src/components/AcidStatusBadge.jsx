import React from "react";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const AcidStatusBadge = ({ status, isLocked }) => {
	const { isDarkMode } = useTheme();

	const getStatusConfig = () => {
		switch (status) {
			case "ACID Issued":
			case "approved":
			case "completed":
				return {
					baseClass: isDarkMode 
						? "bg-green-500/10 border-green-500/30 text-green-400" 
						: "bg-green-50 border-green-200 text-green-700",
					icon: <CheckCircle className="w-5 h-5" />,
					text: "تم إصدار ACID",
					glow: isDarkMode ? "shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "",
				};
			case "Rejected":
				return {
					baseClass: isDarkMode 
						? "bg-red-500/10 border-red-500/30 text-red-400" 
						: "bg-red-50 border-red-200 text-red-700",
					icon: <XCircle className="w-5 h-5" />,
					text: "مرفوض",
					glow: isDarkMode ? "shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "",
				};
			case "Under Review":
				return {
					baseClass: isDarkMode 
						? "bg-orange-500/10 border-orange-500/30 text-orange-400" 
						: "bg-orange-50 border-orange-200 text-orange-800",
					icon: <Loader2 className="w-5 h-5 animate-spin" />,
					text: "قيد المراجعة",
					glow: "",
				};
			case "Pending":
			default:
				return {
					baseClass: isDarkMode 
						? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" 
						: "bg-yellow-50 border-yellow-200 text-yellow-800",
					icon: <Clock className="w-5 h-5 animate-pulse" />,
					text: "في انتظار المراجعة",
					glow: "",
				};
		}
	};

	const { baseClass, icon, text, glow } = getStatusConfig();

	return (
		<div className="flex flex-col gap-3">
			<div
				className={`
					${baseClass} ${glow}
					px-5 py-2.5 rounded-full border backdrop-blur-md
					flex items-center gap-2.5 w-fit font-bold tracking-wide shadow-sm
					transition-all duration-300 hover:scale-105 select-none
				`}
			>
				{icon}
				<span>{text}</span>
			</div>
			{isLocked && (
				<div 
					className={`
						px-4 py-2 rounded-lg border flex items-center gap-3
						${isDarkMode 
							? "bg-gray-800/50 border-gray-700 text-gray-300" 
							: "bg-gray-50 border-gray-200 text-gray-600"}
					`}
				>
					<span className="text-lg">🔒</span>
					<span className="text-xs font-medium opacity-80 leading-relaxed">
						الطلب قيد المعالجة حالياً ولا يمكن تعديله
					</span>
				</div>
			)}
		</div>
	);
};

export default AcidStatusBadge;
