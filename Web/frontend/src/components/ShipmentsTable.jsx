import React from "react";
import { useNavigate } from "react-router-dom";
import quickReorderIcon from "../assets/images/quick_reorder.png";

const ShipmentsTable = ({
	shipments,
	maxItems = 5,
	linkPrefix = "/employee-shipment",
	userType = "client",
	isDarkMode = true
}) => {
	const navigate = useNavigate();

	const getThemeConfig = () => {
		if (userType === 'admin') {
			return { headerBg: "#D4AF37", statusColor: "#D4AF37", linkColor: "#D4AF37" };
		}
		if (userType === 'employee') {
			return { headerBg: "#1ba3b6", statusColor: "#1ba3b6", linkColor: "#1ba3b6" };
		}
		return { headerBg: "#991B1B", statusColor: "#991B1B", linkColor: "#2563EB" };
	};
	const theme = getThemeConfig();

	if (shipments.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500 text-lg">لا توجد شحنات</p>
			</div>
		);
	}

	// Logic to ensure no duplicates and correct return structure
	const displayedShipments = maxItems
		? shipments.slice(0, maxItems)
		: shipments;

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{displayedShipments.map((shipment) => (
				<div
					key={shipment.id}
					onClick={() => navigate(`${linkPrefix}/${shipment.id}`)}
					className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer block text-right
						${userType === 'client' 
							? "bg-white border-gray-100 hover:border-red-100 hover:shadow-lg" 
							: isDarkMode
								? "bg-white/5 border-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-[#1ba3b6]/5 backdrop-blur-sm"
								: "bg-white border-gray-100 hover:border-[#1ba3b6]/30 hover:shadow-lg hover:shadow-[#1ba3b6]/10"
						}
					`}
				>
					{/* Top Row: Status & Date */}
					<div className="flex justify-between items-start mb-4">
						<span
							className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
								${userType === 'client' 
									? "bg-white border-gray-200 text-gray-700" 
									: "text-white"}
							`}
							style={userType !== 'client' ? { 
								backgroundColor: `${theme.statusColor}20`, 
								borderColor: `${theme.statusColor}40`,
								color: isDarkMode ? 'white' : theme.statusColor 
							} : {}}
						>
							<span className={`w-1.5 h-1.5 rounded-full animate-pulse ${userType === 'client' ? "bg-green-500" : "bg-white"}`}
								style={userType !== 'client' ? { backgroundColor: isDarkMode ? 'white' : theme.statusColor } : {}}
							></span>
							{shipment.status}
						</span>

						<span className={`text-xs flex items-center gap-1 ${userType === 'client' || !isDarkMode ? "text-gray-400" : "text-white/40"}`}>
							📅 {shipment.date}
						</span>
					</div>

					{/* Main Info */}
					<div className="mb-6">
						<h3 className={`text-xl font-bold mb-2 break-all transition-colors ${
							userType === 'client' 
								? "text-gray-800 group-hover:text-red-700" 
								: isDarkMode
									? "text-white group-hover:text-[#1ba3b6]"
									: "text-gray-800 group-hover:text-[#1ba3b6]"
						}`}>
							{shipment.shipmentNo}
						</h3>
						<div className={`flex flex-col gap-2 text-sm ${userType === 'client' || !isDarkMode ? "text-gray-500" : "text-white/60"}`}>
							<div className="flex items-center gap-2">
								👤 <span>{shipment.clientName}</span>
							</div>
						</div>
					</div>

					{/* Action Footer */}
					<div className={`pt-4 border-t flex justify-between items-center ${userType === 'client' || !isDarkMode ? "border-gray-50" : "border-white/5"}`}>
						<div className="flex flex-col">
							<span className={`text-xs ${userType === 'client' || !isDarkMode ? "text-gray-500" : "text-white/40"}`}>
								رقم ACID
							</span>
							<span className={`font-mono text-sm ${
								userType === 'client' || !isDarkMode 
									? (shipment.acid ? "text-gray-700" : "text-gray-400 italic") 
									: (shipment.acid ? "text-white/80" : "text-white/30 italic")
							}`}>
								{shipment.acid || "—"}
							</span>
						</div>
						
						<button 
							className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
								${userType === 'client' 
									? "bg-gray-50 group-hover:bg-red-800 group-hover:text-white text-gray-700" 
									: isDarkMode
										? "bg-white/5 group-hover:bg-[#1ba3b6] group-hover:text-white text-white/70"
										: "bg-gray-50 group-hover:bg-[#1ba3b6] group-hover:text-white text-gray-700"
								}
							`}
						>
							التفاصيل
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

export default ShipmentsTable;
