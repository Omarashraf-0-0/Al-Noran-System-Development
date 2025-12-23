import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import SearchFilterSort from "../components/SearchFilterSort";
import ShipmentsTable from "../components/ShipmentsTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function EmployeeShipments() {
	const { isDarkMode } = useTheme();
	const [searchTerm, setSearchTerm] = useState("");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [shipments, setShipments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedStatus, setSelectedStatus] = useState("الكل");
	const [sortOption, setSortOption] = useState("newest");
	
	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 12;

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

				const formattedShipments = (response.data || []).map((shipment) => ({
					id: shipment._id,
					userId: shipment.user_id?._id || shipment.user_id,
					clientName: shipment.employerName || shipment.user_id?.fullname || "Unknown Client",
					shipmentNo: shipment.shipmentCode || shipment.shipmentNumber || shipment.acid || shipment.number46 || "N/A",
					acid: shipment.acid || "N/A",
					status: shipment.status || "pending",
					shipmentType: shipment.shipment_type || "بحري",
					createdAt: shipment.createdAt,
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

	// Normalize status logic...
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

	// Filter and sort
	let filteredShipments = shipments.filter((shipment) => {
		const matchesSearch =
			shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.acid.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			selectedStatus === "الكل" ||
			normalizeStatus(shipment.status) === normalizeStatus(selectedStatus);

		return matchesSearch && matchesStatus;
	});

	filteredShipments = [...filteredShipments].sort((a, b) => {
		switch (sortOption) {
			case "newest":
				return new Date(b.createdAt) - new Date(a.createdAt);
			case "oldest":
				return new Date(a.createdAt) - new Date(b.createdAt);
			case "clientAZ":
				return a.clientName.localeCompare(b.clientName, "ar");
			case "clientZA":
				return b.clientName.localeCompare(a.clientName, "ar");
			default:
				return 0;
		}
	});

	// Pagination Logic
	const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredShipments.slice(indexOfFirstItem, indexOfLastItem);

	const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

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
					{/* Header Section */}
					<div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
						<h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-[#1ba3b6]"}`}>
							<span className="text-4xl">📦</span>
							جميع الشحنات
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
					/>

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
								shipments={currentItems}
								maxItems={itemsPerPage}
								linkPrefix="/employee-shipment"
								userType={user?.type}
								isDarkMode={isDarkMode}
							/>

							{/* Pagination Controls */}
							{totalPages > 1 && (
								<div className="flex justify-center items-center gap-4 mt-12" dir="ltr">
									<button
										onClick={prevPage}
										disabled={currentPage === 1}
										className={`p-3 rounded-full transition-all duration-300 ${
											currentPage === 1 
												? (isDarkMode ? "text-gray-700 bg-white/5 cursor-not-allowed" : "text-gray-300 bg-gray-100 cursor-not-allowed") 
												: (isDarkMode ? "hover:bg-[#1ba3b6] hover:text-white bg-white/10 text-white" : "hover:bg-[#1ba3b6] hover:text-white bg-white text-gray-700 shadow-sm")
										}`}
									>
										<ChevronLeft size={24} />
									</button>
									
									<div className={`px-6 py-2 rounded-xl font-bold ${isDarkMode ? "bg-white/5 text-white border border-white/10" : "bg-white text-gray-800 shadow-sm"}`}>
										<span className={isDarkMode ? "text-[#1ba3b6]" : "text-[#1ba3b6]"}>{currentPage}</span>
										<span className="mx-2 opacity-50">/</span>
										<span className="opacity-70">{totalPages}</span>
									</div>

									<button
										onClick={nextPage}
										disabled={currentPage === totalPages}
										className={`p-3 rounded-full transition-all duration-300 ${
											currentPage === totalPages 
												? (isDarkMode ? "text-gray-700 bg-white/5 cursor-not-allowed" : "text-gray-300 bg-gray-100 cursor-not-allowed") 
												: (isDarkMode ? "hover:bg-[#1ba3b6] hover:text-white bg-white/10 text-white" : "hover:bg-[#1ba3b6] hover:text-white bg-white text-gray-700 shadow-sm")
										}`}
									>
										<ChevronRight size={24} />
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
}
