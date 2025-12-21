import React from "react";
import { Link } from "react-router-dom";
import { Calendar, User, Truck, Anchor, CheckCircle, Clock, Package, AlertCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const ShipmentCard = ({ shipment }) => {
	const { isDarkMode } = useTheme();

	// Normalize status for comparison
	const normalizeStatus = (status) => {
		const statusMap = {
			"Pending": "في انتظار الشحن",
			"قيد الانتظار": "في انتظار الشحن",
			"في انتظار الشحن": "في انتظار الشحن",
			"In Transit": "في الطريق",
			"في الطريق": "في الطريق",
			"Arrived": "تم وصول البضاعة",
			"تم وصول البضاعة": "تم وصول البضاعة",
			"في انتظار وصول الإذن": "في انتظار وصول الإذن",
			"تم وصول الإذن": "تم وصول الإذن",
			"Customs Clearance": "التخليص الجمركي",
			"التخليص الجمركي": "التخليص الجمركي",
			"جارى ادراج الشحنة واستكمال الاجراءات": "جارى ادراج الشحنة واستكمال الاجراءات",
			"جاري الكشف والتثمين": "جاري الكشف والتثمين",
			"Completed": "مكتملة",
			"مكتملة": "مكتملة",
			"تمت بنجاح": "تمت بنجاح",
		};
		return statusMap[status] || status;
	};

	// Helper for Status Style
	const getStatusStyle = (status) => {
		const label = normalizeStatus(status);
		// Green - Success/Completed
		if (['مكتملة', 'تمت بنجاح', 'معتمد', 'تم إصدار ACID', 'تم إصدار UCR', 'Approved', 'Completed'].includes(label)) 
			return { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle, darkBg: "bg-green-900/30", darkText: "text-green-400" };
		
		// Blue - In Transit/Active
		if (['في الطريق', 'تم وصول البضاعة', 'In Transit', 'Arrived'].includes(label)) 
			return { bg: "bg-blue-100", text: "text-blue-800", icon: Truck, darkBg: "bg-blue-900/30", darkText: "text-blue-400" };
		
		// Purple - Processing/Customs
		if (['التخليص الجمركي', 'جاري الكشف والتثمين', 'Customs Clearance'].includes(label)) 
			return { bg: "bg-purple-100", text: "text-purple-800", icon: Anchor, darkBg: "bg-purple-900/30", darkText: "text-purple-400" };
		
		// Red - Rejected/Cancelled
		if (['مرفوض', 'mlghi', 'Cancelled', 'Rejected'].includes(label)) 
			return { bg: "bg-red-100", text: "text-red-800", icon: AlertCircle, darkBg: "bg-red-900/30", darkText: "text-red-400" };
			
		// Orange - Needs Revision
		if (['يحتاج تعديل', 'Needs Revision'].includes(label)) 
			return { bg: "bg-orange-100", text: "text-orange-800", icon: AlertCircle, darkBg: "bg-orange-900/30", darkText: "text-orange-400" };

		// Yellow - Default/Pending
		return { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock, darkBg: "bg-yellow-900/30", darkText: "text-yellow-400" };
	};

	const statusStyle = getStatusStyle(shipment.status);
	const StatusIcon = statusStyle.icon;

	// Determine link destination
	const linkDestination = shipment.link || `/shipmentstatus/${(shipment.shipmentNo && shipment.shipmentNo !== "N/A") ? shipment.shipmentNo : shipment.acid || shipment.id || ""}`;

	return (
		<Link
			to={linkDestination}
			className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer block text-right ${
				isDarkMode 
					? "bg-[#1a1010]/90 border-white/5 hover:border-red-500/30 hover:shadow-red-900/20" 
					: "bg-white border-gray-100 hover:shadow-lg hover:border-red-100"
			}`}
		>
			{/* Top Row: Status & Type & Date */}
			<div className="flex justify-between items-start mb-4">
				<div className="flex items-center gap-2">
					<span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? statusStyle.darkBg + " " + statusStyle.darkText : statusStyle.bg + " " + statusStyle.text}`}>
						<StatusIcon size={14} />
						{normalizeStatus(shipment.status)}
					</span>
					{shipment.type && (
						<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
							['import', 'acid_request'].includes(shipment.type)
								? (isDarkMode ? 'bg-red-900/20 border-red-900/30 text-red-400' : 'bg-red-50 border-red-100 text-red-700')
								: (isDarkMode ? 'bg-blue-900/20 border-blue-900/30 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700')
						}`}>
							{shipment.type === 'import' && 'وارد'}
							{shipment.type === 'export' && 'صادر'}
							{shipment.type === 'acid_request' && 'طلب ACID'}
							{shipment.type === 'ucr_request' && 'طلب UCR'}
						</span>
					)}
				</div>
				<span className={`text-xs flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
					<Calendar size={12} />
					{shipment.date}
				</span>
			</div>

			{/* Main Info */}
			<div className="mb-6">
				<h3 className={`text-xl font-bold mb-2 break-all ${isDarkMode ? "text-gray-100 group-hover:text-red-400" : "text-gray-800 group-hover:text-red-700"} transition-colors`}>
					{shipment.shipmentNo}
				</h3>
				<div className={`flex flex-col gap-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
					<div className="flex items-center gap-2">
						<User size={14} />
						<span>{shipment.clientName}</span>
					</div>
					<div className="flex items-center gap-2">
						{shipment.secondaryIcon ? <shipment.secondaryIcon size={14} /> : <Anchor size={14} />}
						<span>{shipment.portName}</span>
					</div>
				</div>
			</div>

			{/* Action Footer */}
			<div className={`pt-4 border-t flex justify-between items-center ${isDarkMode ? "border-white/5" : "border-gray-50"}`}>
				<div className="flex flex-col">
					<span className="text-xs text-gray-500">
						{['export', 'ucr_request'].includes(shipment.type) ? 'رقم UCR' : 'رقم ACID'}
					</span>
					<span className={`font-mono text-sm ${
						(shipment.acid || shipment.ucr) 
							? (isDarkMode ? "text-gray-300" : "text-gray-700") 
							: "text-gray-400 italic text-xs mt-0.5"
					}`}>
						{shipment.acid || shipment.ucr || "لم يتم إصداره"}
					</span>
				</div>
				<div
					className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
						isDarkMode 
							? "bg-white/5 group-hover:bg-red-600 group-hover:text-white text-gray-300" 
							: "bg-gray-50 group-hover:bg-red-800 group-hover:text-white text-gray-700"
					}`}
				>
					التفاصيل
				</div>
			</div>
		</Link>
	);
};

export default ShipmentCard;
