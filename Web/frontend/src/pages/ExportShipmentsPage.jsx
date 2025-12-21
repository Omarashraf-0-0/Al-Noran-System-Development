import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Search, Filter, SortAsc, ChevronLeft, ChevronRight, Globe, AlertCircle } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import ShipmentCard from "../components/ShipmentCard";

// Status configurations for export shipments
const STATUS_CONFIG = {
	documents_verification: { label: "التحقق من المستندات", value: "documents_verification" },
	regulatory_inspection: { label: "فحص الجهات الرقابية", value: "regulatory_inspection" },
	payment_cleared: { label: "تم السداد", value: "payment_cleared" },
	goods_loaded: { label: "تم التحميل", value: "goods_loaded" },
	in_transit: { label: "في الطريق", value: "in_transit" },
	delivered: { label: "تم التسليم", value: "delivered" },
	completed: { label: "مكتمل", value: "completed" },
	cancelled: { label: "ملغي", value: "cancelled" },
};

export default function ExportShipmentsPage() {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	const [searchTerm, setSearchTerm] = useState("");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [shipments, setShipments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedStatus, setSelectedStatus] = useState("الكل");
	const [sortOption, setSortOption] = useState("newest");

	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 9;

	const token = localStorage.getItem("token");

	// Available shipment statuses for filter
	const shipmentStatuses = [
		{ value: "الكل", label: "الكل" },
		...Object.values(STATUS_CONFIG)
	];

	// Fetch export shipments
	const fetchShipments = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			if (!token) {
				toast.error("يجب تسجيل الدخول أولاً");
				navigate("/login");
				return;
			}

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/export-shipments`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				const formattedShipments = (response.data.shipments || []).map((shipment) => ({
					id: shipment._id,
					type: "export",
					shipmentNo: shipment.shipmentNumber || `شحنة #${shipment._id.slice(-6)}`,
					clientName: shipment.destinationCountry || "وجهة غير محددة", // Display Destination as Client/Primary Info
					portName: shipment.destinationPort || "—",
					status: STATUS_CONFIG[shipment.currentStatus]?.label || shipment.currentStatus,
					ucr: shipment.ucrNumber || shipment.ucrRequestId?.ucrNumber || "—",
					link: `/export-shipment/${shipment._id}`,
					createdAt: shipment.createdAt,
					date: new Date(shipment.createdAt).toLocaleDateString("ar-EG", {
						day: "numeric",
						month: "long",
						year: "numeric",
					}),
				}));
				setShipments(formattedShipments);
			}
		} catch (err) {
			console.error("Error fetching export shipments:", err);
			if (err.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else {
				setError(err.response?.data?.message || "فشل في جلب الشحنات");
			}
		} finally {
			setLoading(false);
		}
	}, [navigate, token]);

	useEffect(() => {
		fetchShipments();
	}, [fetchShipments]);

	const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };
	const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };

	// Filter and Sort Logic
	let filteredShipments = shipments.filter((shipment) => {
		const matchesSearch = 
			shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.ucr.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.clientName.toLowerCase().includes(searchTerm.toLowerCase()); // clientName is destination here
		
		const matchesStatus = selectedStatus === "الكل" || shipment.status === STATUS_CONFIG[selectedStatus]?.label || shipment.status === selectedStatus;
		
		// Note: The comparison above is tricky because shipment.status is already the LABEL.
		// STATUS_CONFIG keys are 'in_transit' etc.
		// If selectedStatus is 'in_transit', we need to check if shipment.status === "في الطريق".
		
		// Correction:
		const selectedLabel = STATUS_CONFIG[selectedStatus]?.label;
		const statusCheck = selectedStatus === "الكل" || shipment.status === selectedLabel;

		return matchesSearch && statusCheck;
	});

	filteredShipments = [...filteredShipments].sort((a, b) => {
		switch (sortOption) {
			case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
			case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
			default: return 0;
		}
	});

	// Pagination Logic
	const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredShipments.slice(indexOfFirstItem, indexOfLastItem);

	const paginate = (pageNumber) => setCurrentPage(pageNumber);
	const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

	return (
		<div className={`flex flex-col min-h-screen font-sans relative transition-colors duration-300 ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`}>
			
			{/* Animated Background */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
				{isDarkMode ? (
					<>
						<div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#690000]/10 rounded-full filter blur-[100px] animate-pulse-glow"></div>
						<div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#2b0000]/20 rounded-full filter blur-[120px] animate-float-slow"></div>
					</>
				) : (
					<div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-red-50/50 to-transparent"></div>
				)}
			</div>

			<Header />
			
			<section className="flex-grow w-full pt-24 pb-12 px-4 md:px-8 relative z-10">
				<div className="max-w-7xl mx-auto">
					{/* Header Section */}
					<div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
						<h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-red-800"}`}>
							<Globe className={isDarkMode ? "text-blue-500" : "text-red-800"} size={32} />
							شحناتي التصديرية
							<span className={`text-sm font-normal px-3 py-1 rounded-full ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-red-100 text-red-800"}`}>
								{filteredShipments.length} شحنة
							</span>
						</h1>
					</div>

					{/* 🔍 Search + Filter + Sort */}
					<div className={`mb-10 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-lg border relative z-20 ${
						isDarkMode ? "bg-[#1a1010]/80 backdrop-blur-xl border-white/10" : "bg-white/80 backdrop-blur-xl border-white/40"
					}`}>
						{/* Search Bar */}
						<div className="relative flex-1 w-full">
							<input
								type="text"
								placeholder="ابحث برقم الشحنة، UCR، أو الوجهة..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className={`w-full rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 transition-all ${
									isDarkMode 
										? "bg-black/30 border-white/10 text-white placeholder-gray-500 focus:ring-blue-500/50" 
										: "bg-gray-100 border-transparent text-gray-900 placeholder-gray-400 focus:ring-red-500/30"
								}`}
							/>
							<Search className={`absolute left-4 top-3.5 w-5 h-5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
						</div>

						{/* Buttons */}
						<div className="flex items-center gap-3 w-full md:w-auto">
							<button onClick={toggleFilter} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
								isFilterOpen || isDarkMode ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-50 text-red-800 hover:bg-red-100"
							}`}>
								<Filter size={20} />
								<span className="hidden sm:inline">تصفية</span>
							</button>
							<button onClick={toggleSort} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
								isSortOpen || isDarkMode ? "bg-[#2b1515] text-red-400 border border-red-900/30 hover:bg-[#3d1a1a]" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
							}`}>
								<SortAsc size={20} />
								<span className="hidden sm:inline">ترتيب</span>
							</button>
						</div>

						{/* Filter Dropdown */}
						{isFilterOpen && (
							<div className={`absolute top-full left-0 mt-2 w-64 p-4 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10 text-gray-200" : "bg-white border-gray-100 text-gray-700"}`} dir="rtl">
								<h4 className="font-bold mb-3 text-sm opacity-70">تصفية حسب الحالة</h4>
								<div className="max-h-60 overflow-y-auto space-y-1">
									{shipmentStatuses.map((status) => (
										<button
											key={status.value}
											onClick={() => { setSelectedStatus(status.value); setIsFilterOpen(false); }}
											className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
												selectedStatus === status.value 
													? (isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-800")
													: "hover:bg-gray-500/10"
											}`}
										>
											{status.label}
										</button>
									))}
								</div>
							</div>
						)}

						{/* Sort Dropdown */}
						{isSortOpen && (
							<div className={`absolute top-full left-32 mt-2 w-56 p-4 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10 text-gray-200" : "bg-white border-gray-100 text-gray-700"}`} dir="rtl">
								<h4 className="font-bold mb-3 text-sm opacity-70">ترتيب حسب</h4>
								{[
									{ v: "newest", l: "الأحدث أولاً" },
									{ v: "oldest", l: "الأقدم أولاً" }
								].map((opt) => (
									<button
										key={opt.v}
										onClick={() => { setSortOption(opt.v); setIsSortOpen(false); }}
										className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
											sortOption === opt.v
												? (isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-800")
												: "hover:bg-gray-500/10"
										}`}
									>
										{opt.l}
									</button>
								))}
							</div>
						)}
					</div>

					{/* 📦 Shipments Grid */}
					{loading ? (
						<div className="flex flex-col items-center justify-center py-20">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
							<p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>جاري تحميل شحنات الصادر...</p>
						</div>
					) : error ? (
						<div className={`bg-red-50 border border-red-300 rounded-lg p-4 text-right ${isDarkMode ? "bg-red-900/20 border-red-700" : ""}`}>
							<p className={`font-medium mb-3 flex items-center gap-2 ${isDarkMode ? "text-red-400" : "text-red-800"}`}>
								<AlertCircle size={20} /> حدث خطأ: {error}
							</p>
							<button onClick={() => fetchShipments()} className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-700 transition">
								إعادة محاولة
							</button>
						</div>
					) : filteredShipments.length === 0 ? (
						<div className={`text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
							<div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
								<Inbox className={isDarkMode ? "text-gray-600" : "text-gray-300"} size={40} />
							</div>
							<h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>لا توجد شحنات تصديرية</h3>
							<p className="text-gray-500">لم يتم العثور على شحنات تطابق بحثك</p>
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
								{currentItems.map((shipment) => (
									<ShipmentCard key={shipment.id} shipment={shipment} />
								))}
							</div>

							{/* Pagination Controls */}
							{totalPages > 1 && (
								<div className="flex justify-center items-center gap-4 mt-8" dir="ltr">
									<button
										onClick={prevPage}
										disabled={currentPage === 1}
										className={`p-2 rounded-full transition-colors ${
											currentPage === 1 
												? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") 
												: (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")
										}`}
									>
										<ChevronLeft size={24} />
									</button>
									
									<div className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? "bg-white/5 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
										Page {currentPage} of {totalPages}
									</div>

									<button
										onClick={nextPage}
										disabled={currentPage === totalPages}
										className={`p-2 rounded-full transition-colors ${
											currentPage === totalPages 
												? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") 
												: (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")
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

			<Footer />
		</div>
	);
}

function Inbox({ className, size }) {
	return (
		<svg 
			xmlns="http://www.w3.org/2000/svg" 
			width={size} 
			height={size} 
			viewBox="0 0 24 24" 
			fill="none" 
			stroke="currentColor" 
			strokeWidth="2" 
			strokeLinecap="round" 
			strokeLinejoin="round" 
			className={className}
		>
			<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
			<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
		</svg>
	);
}
