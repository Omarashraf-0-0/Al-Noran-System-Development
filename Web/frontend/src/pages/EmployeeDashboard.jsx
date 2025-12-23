import React, { useState, useEffect, useRef } from "react";
import { LayoutGrid, List } from "lucide-react";
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
	const [sortOption, setSortOption] = useState("newest");
	const [notificationCount, setNotificationCount] = useState(0);
	const [notifications, setNotifications] = useState([]);
	const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
	const notificationRef = useRef(null);
	const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

	// TODO: RBAC - Get user permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canViewShipments = hasPermission('shipment:view');
	// const canManageShipments = hasPermission('shipment:manage');

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
		const fetchShipments = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!userID) {
					setError("User ID not found. Please login again.");
					toast.error("User ID not found. Please login again.");
					return;
				}

				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/shipments/employee/${userID}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				console.log("Fetched shipments:", response.data);

				const formattedShipments = (response.data || []).map((shipment) => ({
					id: shipment._id,
					clientName: shipment.employerName || "Unknown Client",
					shipmentNo: shipment.shipmentCode || shipment.shipmentNumber || shipment.acid || shipment.number46 || "N/A",
					acid: shipment.acid || "N/A",
					status: shipment.status || "pending",
					createdAt: shipment.createdAt, // Keep raw date for sorting
					date: new Date(shipment.createdAt).toLocaleDateString("ar-EG", {
						day: "numeric",
						month: "long",
						year: "numeric",
					}),
				}));

				setShipments(formattedShipments);

				if (formattedShipments.length === 0) {
					toast("لا توجد شحنات");
				}
			} catch (error) {
				console.error("Error fetching shipments:", error);
				const errorMessage =
					error.response?.data?.message ||
					error.message ||
					"Failed to fetch shipments";
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchShipments();
	}, [userID, token]);

	const toggleFilter = () => {
		setIsFilterOpen(!isFilterOpen);
		setIsSortOpen(false);
	};
	const toggleSort = () => {
		setIsSortOpen(!isSortOpen);
		setIsFilterOpen(false);
	};

	const handleFilterApply = () => {
		setIsFilterOpen(false);
	};

	const handleSortApply = () => {
		setIsSortOpen(false);
	};

	// Normalize status for comparison (all Arabic)
	const normalizeStatus = (status) => {
		const statusNormalization = {
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
		return statusNormalization[status] || status;
	};

	// Filter and sort shipments
	let filteredShipments = shipments.filter((shipment) => {
		// Filter by search term (shipment number, client name, ACID)
		const matchesSearch =
			shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.acid.toLowerCase().includes(searchTerm.toLowerCase());

		// Filter by status - normalize both the filter and shipment status for comparison
		const matchesStatus =
			selectedStatus === "الكل" ||
			normalizeStatus(shipment.status) === normalizeStatus(selectedStatus);

		return matchesSearch && matchesStatus;
	});

	// Sort shipments
	filteredShipments = [...filteredShipments].sort((a, b) => {
		switch (sortOption) {
			case "newest": {
				const dateA = new Date(a.createdAt).getTime();
				const dateB = new Date(b.createdAt).getTime();
				return dateB - dateA;
			}
			case "oldest": {
				const dateA = new Date(a.createdAt).getTime();
				const dateB = new Date(b.createdAt).getTime();
				return dateA - dateB;
			}
			case "clientAZ":
				return a.clientName.localeCompare(b.clientName, "ar");
			case "clientZA":
				return b.clientName.localeCompare(a.clientName, "ar");
			default:
				return 0;
		}
	});

	// Determine Theme based on User - Default Employee Turquoise
	const theme = {
		pageBg: isDarkMode 
			? "bg-[#050f14]" 
			: "bg-[#F0FEFF]",
		sectionBg: isDarkMode 
			? "bg-[#0a1a1f] border-[#163a42]" 
			: "bg-white border-cyan-50",
		heading: isDarkMode ? "text-[#1ba3b6]" : "text-[#1ba3b6]",
		button: "bg-gradient-to-r from-[#1ba3b6] to-[#158A9A] hover:bg-[#158A9A] text-white shadow-lg hover:shadow-[#1ba3b6]/30",
	};

	return (
		<div className={`flex flex-col min-h-screen font-sans relative transition-colors duration-300 ${isDarkMode ? "bg-[#050a0d]" : "bg-gray-50"}`}>
			
			{/* Animated Background - Turquoise Theme */}
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
			
			<section className="flex-grow w-full pt-24 pb-12 px-4 md:px-8 relative z-10">
				<div className="max-w-7xl mx-auto">
					{/* Welcome Banner - Same width as content */}
					<WelcomeBanner />

					{/* Header Section */}
					<div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
						<h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-[#1ba3b6]"}`}>
							<span className="text-4xl">📦</span>
							شحناتي
							<span className={`text-sm font-normal px-3 py-1 rounded-full ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-cyan-100 text-[#1ba3b6]"}`}>
								{filteredShipments.length} شحنة
							</span>
						</h1>
					</div>

					{/* 🔍 Search + Filter + Sort */}
					<SearchFilterSort
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="ابحث برقم الشحنة، اسم العميل، أو ACID"
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
								linkPrefix="/employee-shipment"
								userType={user?.type}
								isDarkMode={isDarkMode}
								viewMode={viewMode}
							/>

							{/* View All Button */}
							{filteredShipments.length > 12 && (
								<div className="flex justify-center mt-8">
									<a
										href="/employee-shipments"
										className={`px-8 py-3 rounded-xl font-bold transition-all transform hover:-translate-y-1 ${
											isDarkMode 
												? "bg-gradient-to-r from-[#1ba3b6] to-[#158A9A] text-white shadow-lg hover:shadow-[#1ba3b6]/30" 
												: "bg-[#1ba3b6] text-white hover:bg-[#158A9A]"
										}`}
									>
										عرض جميع الشحنات ({filteredShipments.length})
									</a>
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
}
