import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Globe, ArrowRight } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const CurrentShipments = () => {
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
						shipmentNo: shipment.shipmentCode || shipment.acid || shipment.number46 || "N/A",
						clientName: shipment.port_name || "Unknown Port", // Using port as secondary info
						status: shipment.status || "pending",
						date: new Date(shipment.createdAt),
						link: `/shipmentstatus/${shipment.acid}`
					}));
					combinedShipments = [...combinedShipments, ...imports];
				}

				// Process Export Shipments (UCR)
				if (exportRes.status === "fulfilled") {
					const exports = (exportRes.value.data.shipments || []).map(shipment => ({
						id: shipment._id,
						type: "export", // صادر
						shipmentNo: shipment.ucrRequestId?.requestNumber || "N/A",
						clientName: "تصدير",
						status: shipment.currentStatus || "pending",
						date: new Date(shipment.createdAt),
						link: `/export-shipment/${shipment._id}`
					}));
					combinedShipments = [...combinedShipments, ...exports];
				}

				// Sort by date (newest first) and take top 5
				combinedShipments.sort((a, b) => b.date - a.date);
				
				const formattedShipments = combinedShipments.slice(0, 5).map(s => ({
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
					<h2 className="text-2xl font-bold text-[#690000] mb-2">آخر الشحنات</h2>
					<p className="text-gray-500">تابع شحناتك الواردة والصادرة</p>
				</div>
				<a
					href="/client-shipments"
					className="text-[#1BA3B6] hover:text-[#147a89] font-bold flex items-center gap-2 group transition-colors"
				>
					<span>عرض السجل الكامل</span>
					<span className="group-hover:-translate-x-1 transition-transform">
						←
					</span>
				</a>
			</div>

			{loading ? (
				<div className="flex justify-center items-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
					<LoadingSpinner />
					<span className="text-gray-500 mr-4 font-medium">جاري تحميل الشحنات...</span>
				</div>
			) : error && shipments.length === 0 ? (
				<div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center">
					<p className="text-red-800 font-bold mb-4 text-lg">❌ {error}</p>
				</div>
			) : shipments.length === 0 ? (
				<div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
					<div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
						<FileText className="text-gray-300" size={32} />
					</div>
					<h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد شحنات نشطة</h3>
					<p className="text-gray-500 max-w-md mx-auto mb-8">
						يمكنك البدء بطلب رقم ACID أو UCR جديد من القائمة أعلاه.
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{shipments.map((shipment) => (
						<a
							key={`${shipment.type}-${shipment.id}`}
							href={shipment.link}
							className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#1BA3B6]/30 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group cursor-pointer block"
						>
							{/* Info Section */}
							<div className="flex-1 flex items-start gap-4">
								<div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
									shipment.type === 'import' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
								}`}>
									{shipment.type === 'import' ? <FileText size={24} /> : <Globe size={24} />}
								</div>
								<div>
									<div className="flex items-center gap-2 mb-1">
										<h3 className="font-bold text-lg text-gray-800 group-hover:text-[#1BA3B6] transition-colors">
											{shipment.shipmentNo}
										</h3>
										<span className={`text-xs px-2 py-0.5 rounded-full border ${
											shipment.type === 'import' 
												? 'bg-red-50 border-red-100 text-red-700' 
												: 'bg-blue-50 border-blue-100 text-blue-700'
										}`}>
											{shipment.type === 'import' ? 'وارد' : 'صادر'}
										</span>
									</div>
									<div className="flex items-center gap-2 text-sm text-gray-500">
										<span>{shipment.clientName}</span>
										<span className="w-1 h-1 bg-gray-300 rounded-full"></span>
										<span>{shipment.date}</span>
									</div>
								</div>
							</div>

							{/* Status Section */}
							<div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
								<span
									className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 bg-gray-50 text-gray-600`}
								>
									<span className={`w-2 h-2 rounded-full ${
										shipment.status === "approved" || shipment.status === "completed" ? "bg-green-500" :
										shipment.status === "pending" || shipment.status === "documents_verification" ? "bg-amber-500" :
										"bg-gray-500"
									}`}></span>
									{shipment.status}
								</span>

								<span 
									className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-[#690000] group-hover:border-[#690000] group-hover:bg-red-50 transition-all"
								>
									<ArrowRight size={20} />
								</span>
							</div>
						</a>
					))}
				</div>
			)}
		</div>
	);
};

export default CurrentShipments;
