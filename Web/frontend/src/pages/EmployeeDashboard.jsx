import React, { useState, useEffect, useRef } from "react";
import { LayoutGrid, List, Package, Ship } from "lucide-react";
import Header from "../components/Header";
import WelcomeBanner from "./WelcomeBanner";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import SearchFilterSort from "../components/SearchFilterSort";
import ShipmentsTable from "../components/ShipmentsTable";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

export default function ShipmentsList() {
	const { isDarkMode } = useTheme();
	const [searchTerm, setSearchTerm] = useState("");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [shipments, setShipments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedStatus, setSelectedStatus] = useState("الكل");
	const [selectedType, setSelectedType] = useState("all"); // 'all' | 'import' | 'export'
	const [sortOption, setSortOption] = useState("newest");
	const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

	const user = JSON.parse(localStorage.getItem("user"));
	const userID = user?.id;
	const token = localStorage.getItem("token");

	// Available shipment statuses
	const shipmentStatuses = [
		{ value: "الكل", label: "الكل" },
		{ value: "في انتظار الشحن", label: "في انتظار الشحن" },
		{ value: "في الطريق", label: "في الطريق" },
		{ value: "تم وصول البضاعة", label: "تم وصول البضاعة" },
		{ value: "في انتظار وصول الإذن", label: "في انتظار وصول الإذن" },
		{ value: "تم وصول الإذن", label: "تم وصول الإذن" },
		{ value: "التخليص الجمركي", label: "التخليص الجمركي" },
		{ value: "جارى ادراج الشحنة واستكمال الاجراءات", label: "جارى ادراج الشحنة واستكمال الاجراءات" },
		{ value: "جاري الكشف والتثمين", label: "جاري الكشف والتثمين" },
		{ value: "مكتملة", label: "مكتملة" },
		{ value: "تمت بنجاح", label: "تمت بنجاح" },
	];

	useEffect(() => {
		const fetchAllShipments = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!userID) {
					setError("User ID not found. Please login again.");
					return;
				}

				const [importRes, exportRes] = await Promise.allSettled([
					axios.get(`${import.meta.env.VITE_API_URL}/api/shipments/employee/${userID}`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
					axios.get(`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/all`, {
						headers: { Authorization: `Bearer ${token}` },
					})
				]);

				let mergedShipments = [];

				// Process Import Shipments
				if (importRes.status === 'fulfilled') {
					const imports = (importRes.value.data || []).map((shipment) => ({
						id: shipment._id,
						type: 'import',
						clientName: shipment.employerName || "Unknown Client",
						shipmentNo: shipment.shipmentCode || shipment.shipmentNumber || shipment.acid || shipment.number46 || "N/A",
						acid: shipment.acid || "N/A",
						status: shipment.status || "pending",
						createdAt: shipment.createdAt,
						date: new Date(shipment.createdAt).toLocaleDateString("ar-EG", {
							day: "numeric", month: "long", year: "numeric",
						}),
					}));
					mergedShipments = [...mergedShipments, ...imports];
				}

				// Process Export Shipments
				if (exportRes.status === 'fulfilled' && exportRes.value.data.success) {
					const exports = (exportRes.value.data.shipments || []).map((shipment) => ({
						id: shipment._id,
						type: 'export',
						clientName: shipment.userId?.fullname || shipment.userId?.name || "Unknown Client",
						shipmentNo: shipment.shipmentNumber || `EXP-${shipment._id.slice(-6)}`,
						acid: shipment.ucrNumber || "—", // Using UCR as equivalent to ACID for display
						status: shipment.currentStatus || "pending",
						createdAt: shipment.createdAt,
						date: new Date(shipment.createdAt).toLocaleDateString("ar-EG", {
							day: "numeric", month: "long", year: "numeric",
						}),
					}));
					mergedShipments = [...mergedShipments, ...exports];
				}

				// Sort by newest initially
				mergedShipments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
				setShipments(mergedShipments);

			} catch (error) {
				console.error("Error fetching shipments:", error);
				setError("Failed to fetch some data");
			} finally {
				setLoading(false);
			}
		};

		fetchAllShipments();
	}, [userID, token]);

	const toggleFilter = () => {
		setIsFilterOpen(!isFilterOpen);
		setIsSortOpen(false);
	};
	const toggleSort = () => {
		setIsSortOpen(!isSortOpen);
		setIsFilterOpen(false);
	};

	const handleFilterApply = () => setIsFilterOpen(false);
	const handleSortApply = () => setIsSortOpen(false);

	// Normalize status for comparison
	const normalizeStatus = (status) => {
		const statusNormalization = {
			"Pending": "في انتظار الشحن",
			"documents_verification": "التحقق من المستندات",
			"regulatory_inspection": "فحص الجهات الرقابية",
			"payment_cleared": "تم السداد",
			"goods_loaded": "تم التحميل",
			"in_transit": "في الطريق",
			"delivered": "تم التسليم",
			"completed": "مكتملة",
			"cancelled": "ملغي",
			// ... add other mappings as needed
		};
		return statusNormalization[status] || status;
	};

	// Filter and sort shipments
	let filteredShipments = shipments.filter((shipment) => {
		const matchesSearch =
			shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.acid.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			selectedStatus === "الكل" ||
			normalizeStatus(shipment.status) === normalizeStatus(selectedStatus);
			
		const matchesType = 
			selectedType === "all" ||
			shipment.type === selectedType;

		return matchesSearch && matchesStatus && matchesType;
	});

	// Sort shipments
	filteredShipments = [...filteredShipments].sort((a, b) => {
		switch (sortOption) {
			case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
			case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
			case "clientAZ": return a.clientName.localeCompare(b.clientName, "ar");
			case "clientZA": return b.clientName.localeCompare(a.clientName, "ar");
			default: return 0;
		}
	});

	// Calculate statistics for the banner
	const stats = {
		total: shipments.length,
		importCount: shipments.filter(s => s.type === 'import').length,
		exportCount: shipments.filter(s => s.type === 'export').length,
		active: shipments.filter(s => s.status !== 'مكتملة').length 
	};

	return (
		<div className={`flex flex-col min-h-screen font-sans relative transition-colors duration-300 ${isDarkMode ? "bg-[#050a0d]" : "bg-gray-50"}`}>
			
			{/* Animated Background */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
				{isDarkMode ? (
					<>
						<div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#1ba3b6]/10 rounded-full filter blur-[100px] animate-pulse"></div>
						<div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#0d5c66]/20 rounded-full filter blur-[120px]"></div>
					</>
				) : (
					<div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-cyan-50/50 to-transparent"></div>
				)}
			</div>

			<Header />
			
			<section className="flex-grow w-full pt-28 pb-12 px-4 md:px-8 relative z-10">
				<div className="max-w-7xl mx-auto">
					{/* Welcome Banner with Custom Stats */}
					<WelcomeBanner customStats={stats} />

					{/* Header & Type Filter */}
					<div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
						<h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-[#1ba3b6]"}`}>
							<span className="text-4xl">📦</span>
							شحناتي
							<span className={`text-sm font-normal px-3 py-1 rounded-full ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-cyan-100 text-[#1ba3b6]"}`}>
								{filteredShipments.length} شحنة
							</span>
						</h1>
						
						{/* Type Filter Buttons */}
						<div className={`flex p-1.5 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
							<button 
								onClick={() => setSelectedType("all")}
								className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedType === "all" 
									? "bg-[#1ba3b6] text-white shadow-lg" 
									: (isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}`}
							>
								الكل
							</button>
							<button 
								onClick={() => setSelectedType("import")}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedType === "import" 
									? "bg-[#1ba3b6] text-white shadow-lg" 
									: (isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}`}
							>
								<Package size={16} />
								وارد
							</button>
							<button 
								onClick={() => setSelectedType("export")}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedType === "export" 
									? "bg-[#1ba3b6] text-white shadow-lg" 
									: (isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}`}
							>
								<Ship size={16} />
								صادر
							</button>
						</div>
					</div>

					{/* 🔍 Search + Filter + Sort */}
					<SearchFilterSort
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="ابحث برقم الشحنة، اسم العميل، أو ACID/UCR"
						isFilterOpen={isFilterOpen}
						onToggleFilter={toggleFilter}
						filterValue={selectedStatus}
						onFilterChange={setSelectedStatus}
						filterOptions={shipmentStatuses}
						filterLabel="تصفية حسب الحالة:"
						onFilterApply={handleFilterApply}
						isSortOpen={isSortOpen}
						onToggleSort={toggleSort}
						sortValue={sortOption}
						onSortChange={setSortOption}
						onSortApply={handleSortApply}
						userType={user?.type}
						isDarkMode={isDarkMode}
					>
						<div className={`flex items-center p-1 rounded-2xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
							<button
								onClick={() => setViewMode("grid")}
								className={`p-3 rounded-xl transition-all ${viewMode === "grid" ? (isDarkMode ? "bg-white/10 text-[#1ba3b6]" : "bg-gray-100 text-[#1ba3b6]") : "text-gray-400"}`}
								title="عرض شبكة"
							>
								<LayoutGrid size={20} />
							</button>
							<button
								onClick={() => setViewMode("list")}
								className={`p-3 rounded-xl transition-all ${viewMode === "list" ? (isDarkMode ? "bg-white/10 text-[#1ba3b6]" : "bg-gray-100 text-[#1ba3b6]") : "text-gray-400"}`}
								title="عرض قائمة"
							>
								<List size={20} />
							</button>
						</div>
					</SearchFilterSort>

					{/* 📦 Shipments Grid */}
					{loading ? (
						<LoadingSpinner />
					) : error ? (
						<ErrorMessage
							message={error}
							onRetry={() => window.location.reload()}
							retryText="إعادة محاولة"
						/>
					) : filteredShipments.length === 0 ? (
						<div className={`text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
							<div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
								<span className="text-4xl">📦</span>
							</div>
							<h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>لا توجد شحنات</h3>
							<p className="text-gray-500">لم يتم العثور على شحنات تطابق بحثك</p>
						</div>
					) : (
						<>
							<ShipmentsTable
								shipments={filteredShipments}
								maxItems={12}
								userType={user?.type}
								isDarkMode={isDarkMode}
								viewMode={viewMode}
							/>

							{/* Dynamic View All Buttons */}
							{filteredShipments.length > 12 && (
								<div className="flex justify-center mt-8 gap-4">
									{(selectedType === 'all' || selectedType === 'import') && (
										<a
											href="/employee-shipments"
											className={`px-6 py-3 rounded-xl font-bold transition-all text-sm ${
												isDarkMode 
													? "bg-white/5 hover:bg-white/10 text-white" 
													: "bg-gray-100 hover:bg-gray-200 text-gray-800"
											}`}
										>
											عرض كل الوارد
										</a>
									)}
									{(selectedType === 'all' || selectedType === 'export') && (
										<a
											href="/employee/export-shipments"
											className={`px-6 py-3 rounded-xl font-bold transition-all text-sm ${
												isDarkMode 
													? "bg-white/5 hover:bg-white/10 text-white" 
													: "bg-gray-100 hover:bg-gray-200 text-gray-800"
											}`}
										>
											عرض كل الصادر
										</a>
									)}
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
}
