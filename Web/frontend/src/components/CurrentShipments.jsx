import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FileText, Globe } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { useTheme } from "../context/ThemeContext";
import ShipmentCard from "./ShipmentCard";

const CurrentShipments = () => {
	const { isDarkMode } = useTheme();
	const [shipments, setShipments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchAllShipments = async () => {
			try {
				setLoading(true);
				setError(null);

				const user = JSON.parse(localStorage.getItem("user"));
				const userID = user?.id || user?._id;
				const token = localStorage.getItem("token");

				if (!userID) {
					setError("User ID not found. Please login again.");
					setLoading(false);
					return;
				}

				const importEndpoint = `${import.meta.env.VITE_API_URL}/api/shipments/user/${userID}`;
				const exportEndpoint = `${import.meta.env.VITE_API_URL}/api/export-shipments`;

				// Fetch both concurrently
				const [importRes, exportRes] = await Promise.allSettled([
					axios.get(importEndpoint, { headers: { Authorization: `Bearer ${token}` } }),
					axios.get(exportEndpoint, { headers: { Authorization: `Bearer ${token}` } })
				]);

				let combinedShipments = [];

				// Process Import Shipments (ACID)
				if (importRes.status === "fulfilled") {
					const imports = (importRes.value.data || []).map(shipment => ({
						id: shipment._id,
						type: "import", // وارد
						shipmentNo: shipment.number46 || shipment.shipmentCode || shipment.acid || "N/A",
						clientName: shipment.importerName || "غير محدد",
						portName: shipment.port_name || "غير محدد",
						status: shipment.status || "pending",
						date: new Date(shipment.createdAt),
						link: `/shipmentstatus/${shipment.acid}`,
						acid: shipment.acid // Fallback
					}));
					combinedShipments = [...combinedShipments, ...imports];
				}

				// Process Export Shipments (UCR)
				if (exportRes.status === "fulfilled") {
					const exports = (exportRes.value.data.shipments || []).map(shipment => ({
						id: shipment._id,
						type: "export", // صادر
						shipmentNo: shipment.ucrRequestId?.requestNumber || "N/A",
						clientName: "شحنة تصدير",
						portName: "تصدير", 
						status: shipment.currentStatus || "pending",
						date: new Date(shipment.createdAt),
						link: `/export-shipment/${shipment._id}`
					}));
					combinedShipments = [...combinedShipments, ...exports];
				}

				// Sort by date (newest first) and take top 6 (multiple of 3 for grid)
				combinedShipments.sort((a, b) => b.date - a.date);
				
				const formattedShipments = combinedShipments.slice(0, 6).map(s => ({
					...s,
					date: s.date.toLocaleDateString("ar-EG", {
						day: "numeric",
						month: "long",
						year: "numeric",
					})
				}));

				setShipments(formattedShipments);

			} catch (error) {
				console.error("Error fetching shipments:", error);
				setError("فشل في تحميل الشحنات");
			} finally {
				setLoading(false);
			}
		};

		fetchAllShipments();
	}, []);

	return (
		<div className="container mx-auto px-4 pb-16" dir="rtl">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-red-500" : "text-[#690000]"}`}>آخر الشحنات</h2>
					<p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>تابع شحناتك الواردة والصادرة</p>
				</div>
				<div className="flex items-center gap-3">
					<Link
						to="/client-shipments"
						className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
							isDarkMode 
								? "bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-900/30" 
								: "bg-red-50 text-red-800 hover:bg-red-100 border border-red-100"
						}`}
					>
						<FileText size={16} />
						<span>سجل الوارد</span>
					</Link>
					<Link
						to="/export-shipments"
						className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
							isDarkMode 
								? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 border border-blue-900/30" 
								: "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-100"
						}`}
					>
						<Globe size={16} />
						<span>سجل الصادر</span>
					</Link>
				</div>
			</div>

			{loading ? (
				<div 
					className={`flex justify-center items-center py-20 rounded-3xl shadow-sm border ${
						isDarkMode 
							? "bg-[#1a1010] border-white/5" 
							: "bg-white border-gray-100"
					}`}
				>
					<LoadingSpinner />
					<span className={`mr-4 font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>جاري تحميل الشحنات...</span>
				</div>
			) : error && shipments.length === 0 ? (
				<div className={`border rounded-3xl p-10 text-center ${
					isDarkMode 
						? "bg-red-900/10 border-red-900/20" 
						: "bg-red-50 border-red-100"
				}`}>
					<p className={`font-bold mb-4 text-lg ${isDarkMode ? "text-red-400" : "text-red-800"}`}>❌ {error}</p>
				</div>
			) : shipments.length === 0 ? (
				<div 
					className={`text-center py-20 rounded-3xl shadow-sm border ${
						isDarkMode 
							? "bg-[#1a1010] border-white/5" 
							: "bg-white border-gray-100"
					}`}
				>
					<div 
						className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
							isDarkMode ? "bg-white/5" : "bg-gray-50"
						}`}
					>
						<FileText className={isDarkMode ? "text-gray-500" : "text-gray-300"} size={32} />
					</div>
					<h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>لا توجد شحنات نشطة</h3>
					<p className={`max-w-md mx-auto mb-8 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
						يمكنك البدء بطلب رقم ACID أو UCR جديد من القائمة أعلاه.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{shipments.map((shipment) => (
						<ShipmentCard key={`${shipment.type}-${shipment.id}`} shipment={shipment} />
					))}
				</div>
			)}
		</div>
	);
};

export default CurrentShipments;
