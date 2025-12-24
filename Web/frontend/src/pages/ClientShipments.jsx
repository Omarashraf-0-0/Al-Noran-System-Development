import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Search, Filter, SortAsc, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Ship, LayoutGrid, List, Package, Clock, CheckCircle, AlertCircle, Anchor } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

// Helpers & Translations
import { t } from "../constants/shipmentTranslations";
import { getStatusCategory } from "../utils/shipmentHelpers";

export default function ClientShipments() {
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
	const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

	// Refs for popup positioning
	const filterBtnRef = useRef(null);
	const sortBtnRef = useRef(null);

	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const [jumpToPage, setJumpToPage] = useState("");
	const itemsPerPage = viewMode === "grid" ? 9 : 6;

	const user = JSON.parse(localStorage.getItem("user"));
	const userID = user?.id || user?._id;
	const token = localStorage.getItem("token");
	const displayName = (user?.fullname || user?.username || "العميل").split(' ').slice(0, 2).join(' ');

	// Available shipment statuses for filter
	const shipmentStatuses = [
		{ value: "الكل", label: "الكل" },
		{ value: "Active", label: "نشطة" },
		{ value: "Pending", label: "قيد الانتظار" },
		{ value: "Completed", label: "مكتملة" },
	];

	// Fetch shipments
	const fetchShipments = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			if (!token || !userID) {
				toast.error("يجب تسجيل الدخول أولاً");
				navigate("/login");
				return;
			}

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/user/${userID}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			const formatted = (response.data || []).map((s) => ({
				id: s._id,
				code: s.shipmentCode || s.acid || "—",
				acid: s.acid || "—",
				bl: s.number46 || s.shipmentNumber || "—",
				status: s.status || "pending",
				client: s.employerName || displayName,
				port: s.port_name || "—",
				type: s.shipmentType || "sea",
				createdAt: s.createdAt,
				date: new Date(s.createdAt).toLocaleDateString("ar-EG", {
					day: "numeric", month: "long", year: "numeric"
				}),
				updatedAt: new Date(s.updatedAt || s.createdAt),
			}));

			setShipments(formatted);
		} catch (err) {
			console.error("Error fetching shipments:", err);
			if (err.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else {
				setError(err.response?.data?.message || "فشل في جلب الشحنات");
			}
		} finally {
			setLoading(false);
		}
	}, [navigate, token, userID, displayName]);

	useEffect(() => {
		fetchShipments();
	}, [fetchShipments]);

	const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };
	const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };

	// Filter and Sort Logic
	let filteredShipments = shipments.filter((shipment) => {
		const matchesSearch = 
			shipment.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.bl.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.acid.toLowerCase().includes(searchTerm.toLowerCase());
		
		const category = getStatusCategory(shipment.status);
		const matchesStatus = selectedStatus === "الكل" || category === selectedStatus;

		return matchesSearch && matchesStatus;
	});

	filteredShipments = [...filteredShipments].sort((a, b) => {
		switch (sortOption) {
			case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
			case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
			case "last_updated": return new Date(b.updatedAt) - new Date(a.updatedAt);
			default: return 0;
		}
	});

	// Stats
	const stats = {
		total: shipments.length,
		active: shipments.filter(s => getStatusCategory(s.status) === "Active").length,
		completed: shipments.filter(s => getStatusCategory(s.status) === "Completed").length,
		pending: shipments.filter(s => getStatusCategory(s.status) === "Pending").length,
	};

	// Pagination Logic
	const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredShipments.slice(indexOfFirstItem, indexOfLastItem);

	const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

	// Reset page when filter/search changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, selectedStatus, sortOption, viewMode]);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (filterBtnRef.current && !filterBtnRef.current.contains(e.target)) {
				setIsFilterOpen(false);
			}
			if (sortBtnRef.current && !sortBtnRef.current.contains(e.target)) {
				setIsSortOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Handle jump to page
	const handleJumpToPage = (e) => {
		e.preventDefault();
		const pageNum = parseInt(jumpToPage);
		if (pageNum >= 1 && pageNum <= totalPages) {
			setCurrentPage(pageNum);
			setJumpToPage("");
		} else {
			toast.error(`الرجاء إدخال رقم صفحة بين 1 و ${totalPages}`);
		}
	};

	return (
		<div className={`flex flex-col min-h-screen font-sans relative transition-colors duration-300 ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`}>
			
			{/* Animated Background */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
				{isDarkMode ? (
					<>
						<div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#690000]/10 rounded-full filter blur-[100px] animate-pulse"></div>
						<div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#2b0000]/20 rounded-full filter blur-[120px]"></div>
					</>
				) : (
					<div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-red-50/50 to-transparent"></div>
				)}
			</div>

			<Header />
			
			<section className="flex-grow w-full pt-24 pb-12 px-4 md:px-8 relative z-10">
				<div className="max-w-7xl mx-auto">
					
					{/* Header Section with Stats */}
					<div className="mb-8">
						<div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
							<h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-red-800"}`}>
								<Ship className={isDarkMode ? "text-red-500" : "text-red-800"} size={32} />
								شحناتي
								<span className={`text-sm font-normal px-3 py-1 rounded-full ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-red-100 text-red-800"}`}>
									{filteredShipments.length} شحنة
								</span>
							</h1>
						</div>

						{/* Stats Cards */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							{[
								{ label: "الإجمالي", value: stats.total, icon: Package, color: "blue" },
								{ label: "نشطة", value: stats.active, icon: Clock, color: "amber" },
								{ label: "مكتملة", value: stats.completed, icon: CheckCircle, color: "green" },
								{ label: "قيد الانتظار", value: stats.pending, icon: AlertCircle, color: "gray" },
							].map((stat, i) => (
								<button
									key={i}
									onClick={() => setSelectedStatus(i === 0 ? "الكل" : i === 1 ? "Active" : i === 2 ? "Completed" : "Pending")}
									className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] ${
										isDarkMode 
											? "bg-white/5 border-white/10 hover:bg-white/10" 
											: "bg-white border-gray-100 hover:shadow-lg"
									}`}
								>
									<div className="flex items-center gap-3">
										<div className={`p-2 rounded-xl ${
											stat.color === "blue" ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600") :
											stat.color === "amber" ? (isDarkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600") :
											stat.color === "green" ? (isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600") :
											(isDarkMode ? "bg-gray-500/20 text-gray-400" : "bg-gray-100 text-gray-600")
										}`}>
											<stat.icon size={20} />
										</div>
										<div className="text-right">
											<p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{loading ? "—" : stat.value}</p>
											<p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>{stat.label}</p>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* 🔍 Search + Filter + Sort + View Toggle */}
					<div className={`mb-8 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-lg border relative z-20 ${
						isDarkMode ? "bg-[#1a1010]/80 backdrop-blur-xl border-white/10" : "bg-white/80 backdrop-blur-xl border-white/40"
					}`}>
						{/* Search Bar */}
						<div className="relative flex-1 w-full">
							<input
								type="text"
								placeholder="ابحث برقم الشحنة أو ACID..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className={`w-full rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 transition-all ${
									isDarkMode 
										? "bg-black/30 border-white/10 text-white placeholder-gray-500 focus:ring-red-500/50" 
										: "bg-gray-100 border-transparent text-gray-900 placeholder-gray-400 focus:ring-red-500/30"
								}`}
							/>
							<Search className={`absolute left-4 top-3.5 w-5 h-5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
						</div>

						{/* Filter & Sort Buttons */}
						<div className="flex items-center gap-3 w-full md:w-auto">
							
							{/* Filter Button & Dropdown */}
							<div className="relative" ref={filterBtnRef}>
								<button 
									onClick={toggleFilter} 
									className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
										isFilterOpen ? "bg-red-600 text-white" : (isDarkMode ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-red-50 text-red-800 hover:bg-red-100")
									}`}
								>
									<Filter size={18} />
									<span className="hidden sm:inline">تصفية</span>
								</button>
								{isFilterOpen && (
									<div className={`absolute top-full right-0 mt-2 w-56 p-3 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10 text-gray-200" : "bg-white border-gray-100 text-gray-700"}`} dir="rtl">
										<h4 className="font-bold mb-2 text-sm opacity-70">تصفية حسب الحالة</h4>
										<div className="space-y-1">
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
							</div>

							{/* Sort Button & Dropdown */}
							<div className="relative" ref={sortBtnRef}>
								<button 
									onClick={toggleSort} 
									className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
										isSortOpen ? "bg-red-600 text-white" : (isDarkMode ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200")
									}`}
								>
									<SortAsc size={18} />
									<span className="hidden sm:inline">ترتيب</span>
								</button>
								{isSortOpen && (
									<div className={`absolute top-full right-0 mt-2 w-48 p-3 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10 text-gray-200" : "bg-white border-gray-100 text-gray-700"}`} dir="rtl">
										<h4 className="font-bold mb-2 text-sm opacity-70">ترتيب حسب</h4>
										{[
											{ v: "newest", l: "الأحدث أولاً" },
											{ v: "oldest", l: "الأقدم أولاً" },
											{ v: "last_updated", l: "آخر تحديث" }
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

							{/* View Mode Toggle */}
							<div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
								<button
									onClick={() => setViewMode("grid")}
									className={`p-2.5 rounded-lg transition-all ${viewMode === "grid" ? (isDarkMode ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-700") : (isDarkMode ? "text-gray-500" : "text-gray-400")}`}
									title="عرض شبكة"
								>
									<LayoutGrid size={18} />
								</button>
								<button
									onClick={() => setViewMode("list")}
									className={`p-2.5 rounded-lg transition-all ${viewMode === "list" ? (isDarkMode ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-700") : (isDarkMode ? "text-gray-500" : "text-gray-400")}`}
									title="عرض قائمة"
								>
									<List size={18} />
								</button>
							</div>
						</div>
					</div>

					{/* 📦 Shipments Display */}
					{loading ? (
						<div className="flex flex-col items-center justify-center py-20">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
							<p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>جاري تحميل الشحنات...</p>
						</div>
					) : error ? (
						<div className={`rounded-xl p-6 text-center ${isDarkMode ? "bg-red-900/20 border border-red-700" : "bg-red-50 border border-red-200"}`}>
							<AlertCircle className={`mx-auto mb-3 ${isDarkMode ? "text-red-400" : "text-red-600"}`} size={40} />
							<p className={`font-medium mb-4 ${isDarkMode ? "text-red-400" : "text-red-800"}`}>{error}</p>
							<button onClick={fetchShipments} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
								إعادة محاولة
							</button>
						</div>
					) : filteredShipments.length === 0 ? (
						<div className={`text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
							<div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
								<Anchor className={isDarkMode ? "text-gray-600" : "text-gray-300"} size={40} />
							</div>
							<h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>لا توجد شحنات</h3>
							<p className="text-gray-500">لم يتم العثور على شحنات تطابق بحثك</p>
						</div>
					) : (
						<>
							{/* Grid View */}
							{viewMode === "grid" ? (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
									{currentItems.map((shipment) => (
										<Link
											key={shipment.id}
											to={`/shipmentstatus/${shipment.code !== '—' ? shipment.code : shipment.acid !== '—' ? shipment.acid : shipment.id}`}
											className={`group p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
												isDarkMode 
													? "bg-[#1a1010]/80 border-white/10 hover:border-red-900/50" 
													: "bg-white border-gray-100 hover:border-red-200"
											}`}
										>
											<div className="flex items-start justify-between mb-4">
												<div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-900/30" : "bg-red-50"}`}>
													<Ship className={isDarkMode ? "text-red-400" : "text-red-700"} size={24} />
												</div>
												<span className={`px-3 py-1 rounded-full text-xs font-medium ${
													getStatusCategory(shipment.status) === "Completed" 
														? (isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700")
														: getStatusCategory(shipment.status) === "Active"
														? (isDarkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-700")
														: (isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600")
												}`}>
													{shipment.status}
												</span>
											</div>

											<h3 className={`font-bold text-lg mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
												{shipment.code}
											</h3>
											<p className={`text-sm mb-3 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
												ACID: {shipment.acid}
											</p>

											<div className={`flex items-center justify-between pt-3 border-t ${isDarkMode ? "border-white/10" : "border-gray-100"}`}>
												<span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{shipment.date}</span>
												<span className={`text-xs font-medium ${isDarkMode ? "text-red-400" : "text-red-700"}`}>
													عرض التفاصيل ←
												</span>
											</div>
										</Link>
									))}
								</div>
							) : (
								/* List View */
								<div className="space-y-3 mb-8">
									{currentItems.map((shipment) => (
										<Link
											key={shipment.id}
											to={`/shipmentstatus/${shipment.code !== '—' ? shipment.code : shipment.acid !== '—' ? shipment.acid : shipment.id}`}
											className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
												isDarkMode 
													? "bg-[#1a1010]/80 border-white/10 hover:border-red-900/50" 
													: "bg-white border-gray-100 hover:border-red-200"
											}`}
										>
											<div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-900/30" : "bg-red-50"}`}>
												<Ship className={isDarkMode ? "text-red-400" : "text-red-700"} size={24} />
											</div>
											
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-3 mb-1">
													<h3 className={`font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
														{shipment.code}
													</h3>
													<span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
														getStatusCategory(shipment.status) === "Completed" 
															? (isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700")
															: getStatusCategory(shipment.status) === "Active"
															? (isDarkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-700")
															: (isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600")
													}`}>
														{shipment.status}
													</span>
												</div>
												<p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
													ACID: {shipment.acid} • {shipment.date}
												</p>
											</div>

											<ChevronLeft className={`shrink-0 transition-transform group-hover:-translate-x-1 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} size={20} />
										</Link>
									))}
								</div>
							)}

							{/* Enhanced Pagination */}
							{totalPages > 1 && (
								<div className={`flex flex-wrap justify-center items-center gap-3 mt-8 p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-white shadow-sm"}`} dir="ltr">
									{/* First Page */}
									<button
										onClick={() => setCurrentPage(1)}
										disabled={currentPage === 1}
										className={`p-2 rounded-lg transition-colors ${
											currentPage === 1 
												? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") 
												: (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")
										}`}
										title="الصفحة الأولى"
									>
										<ChevronsLeft size={20} />
									</button>

									{/* Previous Page */}
									<button
										onClick={prevPage}
										disabled={currentPage === 1}
										className={`p-2 rounded-lg transition-colors ${
											currentPage === 1 
												? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") 
												: (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")
										}`}
										title="الصفحة السابقة"
									>
										<ChevronLeft size={20} />
									</button>

									{/* Page Numbers */}
									<div className="flex items-center gap-1">
										{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
											let pageNum;
											if (totalPages <= 5) {
												pageNum = i + 1;
											} else if (currentPage <= 3) {
												pageNum = i + 1;
											} else if (currentPage >= totalPages - 2) {
												pageNum = totalPages - 4 + i;
											} else {
												pageNum = currentPage - 2 + i;
											}
											return (
												<button
													key={pageNum}
													onClick={() => setCurrentPage(pageNum)}
													className={`w-10 h-10 rounded-lg font-medium transition-all ${
														currentPage === pageNum 
															? "bg-red-600 text-white" 
															: (isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700")
													}`}
												>
													{pageNum}
												</button>
											);
										})}
									</div>

									{/* Next Page */}
									<button
										onClick={nextPage}
										disabled={currentPage === totalPages}
										className={`p-2 rounded-lg transition-colors ${
											currentPage === totalPages 
												? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") 
												: (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")
										}`}
										title="الصفحة التالية"
									>
										<ChevronRight size={20} />
									</button>

									{/* Last Page */}
									<button
										onClick={() => setCurrentPage(totalPages)}
										disabled={currentPage === totalPages}
										className={`p-2 rounded-lg transition-colors ${
											currentPage === totalPages 
												? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") 
												: (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")
										}`}
										title="الصفحة الأخيرة"
									>
										<ChevronsRight size={20} />
									</button>

									{/* Divider */}
									<div className={`w-px h-8 mx-2 ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`}></div>

									{/* Jump to Page */}
									<form onSubmit={handleJumpToPage} className="flex items-center gap-2">
										<span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>الذهاب إلى</span>
										<input
											type="number"
											min="1"
											max={totalPages}
											value={jumpToPage}
											onChange={(e) => setJumpToPage(e.target.value)}
											placeholder="#"
											className={`w-16 px-3 py-2 rounded-lg text-center text-sm focus:outline-none focus:ring-2 ${
												isDarkMode 
													? "bg-white/10 text-white placeholder-gray-500 focus:ring-red-500/50" 
													: "bg-gray-100 text-gray-900 placeholder-gray-400 focus:ring-red-500/30"
											}`}
										/>
										<button 
											type="submit"
											className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
												isDarkMode ? "bg-red-900/50 text-red-400 hover:bg-red-900" : "bg-red-100 text-red-700 hover:bg-red-200"
											}`}
										>
											انتقال
										</button>
									</form>

									{/* Page Info */}
									<span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
										({currentPage} من {totalPages})
									</span>
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
