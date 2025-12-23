import React from "react";
import AcidStatusBadge from "./AcidStatusBadge";
import { useTheme } from "../context/ThemeContext";
import { FileText, Calendar, Plane, Ship } from "lucide-react";

const AcidRequestHeader = ({ requestData, illustration }) => {
	const { isDarkMode } = useTheme();

	return (
		<>
			{/* Top illustration */}
			<div className="flex justify-center mb-10 relative">
				<div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full filter blur-[80px] -z-10 ${
					isDarkMode ? "bg-red-900/40" : "bg-red-200/60"
				}`}></div>
				<img
					src={illustration}
					alt="ACID Request Illustration"
					className="w-full max-w-lg h-auto drop-shadow-xl animate-float-slow"
				/>
			</div>

			{/* Main Header Card */}
			<div className={`rounded-3xl p-6 sm:p-8 mb-8 border backdrop-blur-md transition-all duration-300 flex flex-wrap gap-6 items-center justify-between ${
				isDarkMode 
					? "bg-white/5 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" 
					: "bg-white/80 border-white/60 shadow-xl shadow-red-900/5"
			}`}>
				{/* Status & ID Column */}
				<div className="flex flex-col gap-4">
					<AcidStatusBadge
						status={requestData.status}
						isLocked={requestData.isLocked}
					/>
					
					{requestData.acidCode && requestData.acidCode !== "null" && (
						<div className="flex items-center gap-3 mt-2">
							<div className={`p-2 rounded-lg ${isDarkMode ? "bg-red-500/20" : "bg-red-100"}`}>
								<FileText className={`w-6 h-6 ${isDarkMode ? "text-red-400" : "text-red-600"}`} />
							</div>
							<div>
								<p className={`text-xs uppercase tracking-wider font-bold ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
									رقم ACID
								</p>
								<p className={`text-3xl font-bold tracking-tight ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
									{requestData.acidCode}
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Info Grid (Date & Type) */}
				<div className="flex flex-wrap gap-4 sm:gap-8">
					<div className={`px-5 py-3 rounded-2xl border flex items-center gap-3 ${
						isDarkMode ? "bg-black/20 border-white/5" : "bg-gray-50 border-gray-100"
					}`}>
						<div className={`p-2 rounded-xl ${isDarkMode ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500 shadow-sm"}`}>
							<Calendar className="w-5 h-5" />
						</div>
						<div>
							<p className={`text-xs font-bold ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>تاريخ الطلب</p>
							<p className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
								{new Date(
									requestData.requestDate || requestData.createdAt
								).toLocaleDateString("ar-EG", {
									day: "numeric",
									month: "short",
									year: "numeric",
								})}
							</p>
						</div>
					</div>

					<div className={`px-5 py-3 rounded-2xl border flex items-center gap-3 ${
						isDarkMode ? "bg-black/20 border-white/5" : "bg-gray-50 border-gray-100"
					}`}>
						<div className={`p-2 rounded-xl ${
							requestData.shipmentType === "جوي"
								? isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600 shadow-sm"
								: isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-600 shadow-sm"
						}`}>
							{requestData.shipmentType === "جوي" ? <Plane className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
						</div>
						<div>
							<p className={`text-xs font-bold ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>نوع الشحنة</p>
							<p className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
								{requestData.shipmentType === "جوي" ? "شحن جوي" : "شحن بحري"}
							</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default AcidRequestHeader;
