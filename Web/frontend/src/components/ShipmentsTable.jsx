import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, Ship } from "lucide-react"; // Import icons

const ShipmentsTable = ({
	shipments,
	maxItems = 5,
	linkPrefix = "/employee-shipment",
	userType = "client",
	isDarkMode = true,
	viewMode = "grid"
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

	const handleNavigate = (shipment) => {
		if (shipment.type === 'export') {
			navigate(`/employee/export-shipment/${shipment.id}`);
		} else {
			// Default to import (or whatever linkPrefix was set to, usually /employee-shipment)
			navigate(`${linkPrefix}/${shipment.id}`);
		}
	};

	return (
		<div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
			{displayedShipments.map((shipment) => (
				<div
					key={shipment.id}
					onClick={() => handleNavigate(shipment)}
					className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer block text-right
						${userType === 'client' 
							? "bg-white border-gray-100 hover:border-red-100 hover:shadow-lg" 
							: isDarkMode
								? `bg-white/5 border-white/5 hover:border-white/20 hover:shadow-lg backdrop-blur-sm`
								: `bg-white border-gray-100 hover:shadow-lg`
						}
						${viewMode === "list" ? "grid grid-cols-12 gap-4 items-center p-4" : ""}
					`}
                    style={userType !== 'client' ? {
                        borderColor: isDarkMode ? undefined : theme.statusColor + '4D', // 30% opacity
                        boxShadowColor: theme.statusColor + '1A' // 10% opacity
                    } : {}}
				>
					{/* Top Row: Status & Type & Date */}
					<div className={`${viewMode === "list" ? "col-span-4 flex flex-col gap-2" : "flex justify-between items-start mb-4"}`}>
						<div className="flex flex-col gap-2">
							{/* Type Badge (Only if mixed types are expected or type is present) */}
							{shipment.type && (
								<div className={`flex items-center gap-1 text-[10px] font-bold w-fit px-2 py-0.5 rounded-full ${
									shipment.type === 'export' 
										? (isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-600 border border-orange-100')
										: (isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100')
								}`}>
									{shipment.type === 'export' ? <Ship size={10} /> : <Package size={10} />}
									{shipment.type === 'export' ? 'صادر' : 'وارد'}
								</div>
							)}

							<span
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border w-fit
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
						</div>

						{viewMode === "grid" && (
							<span className={`text-xs flex items-center gap-1 mt-1 ${userType === 'client' || !isDarkMode ? "text-gray-400" : "text-white/40"}`}>
								📅 {shipment.date}
							</span>
						)}
					</div>

					{/* Main Info */}
					<div className={`${viewMode === "list" ? "col-span-4" : "mb-6"}`}>
						<h3 className={`text-xl font-bold mb-2 break-all transition-colors ${
							userType === 'client' 
								? "text-gray-800 group-hover:text-red-700" 
								: isDarkMode
									? "text-white"
									: "text-gray-800"
						}`}
                        style={userType !== 'client' ? { color: 'inherit' } : {}}
                        // We will handle group-hover color via inline style or class if possible, but simpler to rely on dynamic class if we could. 
                        // Since we can't easily inject dynamic class for group-hover, we might stick to a conditional class if we had many themes.
                        // Actually, let's use style for hover effect? No, React style doesn't support pseudo classes.
                        // Let's fallback to standard classes if possible or use the theme config more effectively.
                        // For Admin (Gold), we want text-[#D4AF37] on hover.
                        // For Employee (Teal), text-[#1ba3b6].
                        >
                            <span className={`transition-colors ${userType === 'admin' ? "group-hover:text-[#D4AF37]" : (userType === 'employee' ? "group-hover:text-[#1ba3b6]" : "")}`}>
							    {shipment.shipmentNo}
                            </span>
						</h3>
						
						{viewMode === "list" && (
							<div className={`text-xs flex items-center gap-1 ${userType === 'client' || !isDarkMode ? "text-gray-400" : "text-white/40"}`}>
								📅 {shipment.date}
							</div>
						)}

						{/* Client Name */}
						{viewMode === "grid" && (
							<div className={`flex flex-col gap-2 text-sm ${userType === 'client' || !isDarkMode ? "text-gray-500" : "text-white/60"}`}>
								<div className="flex items-center gap-2">
									👤 <span>{shipment.clientName}</span>
								</div>
							</div>
						)}
					</div>

					{/* Client Info Column (List View Only) */}
					{viewMode === "list" && (
						<div className="col-span-2">
							<div className={`flex flex-col gap-1 text-sm ${userType === 'client' || !isDarkMode ? "text-gray-600" : "text-white/80"}`}>
								<div className="flex items-center gap-2 font-medium">
									👤 <span>{shipment.clientName}</span>
								</div>
								<div className="flex flex-col">
									<span className={`text-xs ${userType === 'client' || !isDarkMode ? "text-gray-500" : "text-white/40"}`}>
										{shipment.type === 'export' ? 'UCR' : 'ACID'}
									</span>
									<span className={`font-mono text-xs ${
										userType === 'client' || !isDarkMode 
											? (shipment.acid ? "text-gray-700" : "text-gray-400 italic") 
											: (shipment.acid ? "text-white/80" : "text-white/30 italic")
									}`}>
										{shipment.acid || "—"}
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Action Footer */}
					<div className={`${viewMode === "list" ? "col-span-2 flex justify-end" : "pt-4 border-t flex justify-between items-center"} ${userType === 'client' || !isDarkMode ? "border-gray-50" : "border-white/5"}`}>
						{viewMode === "grid" && (
							<div className="flex flex-col">
								<span className={`text-xs ${userType === 'client' || !isDarkMode ? "text-gray-500" : "text-white/40"}`}>
									{shipment.type === 'export' ? 'UCR' : 'ACID'}
								</span>
								<span className={`font-mono text-sm ${
									userType === 'client' || !isDarkMode 
										? (shipment.acid ? "text-gray-700" : "text-gray-400 italic") 
										: (shipment.acid ? "text-white/80" : "text-white/30 italic")
								}`}>
									{shipment.acid || "—"}
								</span>
							</div>
						)}
						
						<button 
							className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
								${userType === 'client' 
									? "bg-gray-50 group-hover:bg-red-800 group-hover:text-white text-gray-700" 
									: isDarkMode
										? `bg-white/5 text-white/70 ${userType === 'admin' ? "group-hover:bg-[#D4AF37] group-hover:text-black" : "group-hover:bg-[#1ba3b6] group-hover:text-white"}`
										: `bg-gray-50 text-gray-700 ${userType === 'admin' ? "group-hover:bg-[#D4AF37] group-hover:text-white" : "group-hover:bg-[#1ba3b6] group-hover:text-white"}`
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
