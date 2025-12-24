import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Search, Filter, SortAsc, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileCode, AlertCircle, Package, LayoutGrid, List

 } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import ShipmentCard from "../components/ShipmentCard";

export default function AcidRequestsPage() {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	const [searchTerm, setSearchTerm] = useState("");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortOption, setSortOption] = useState("newest");
	const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
	
	// Refs for popup positioning
	const filterBtnRef = useRef(null);
	const sortBtnRef = useRef(null);
	
	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = viewMode === "grid" ? 9 : 6;
	const [jumpToPage, setJumpToPage] = useState("");

	const token = localStorage.getItem("token");

	// Status Helpers
	const getStatusText = (status) => {
		switch (status) {
			case "ACID Issued": return "تم إصدار ACID";
			case "Under Review": return "قيد المراجعة";
			case "Rejected": return "مرفوض";
			case "Pending": return "قيد الانتظار";
			default: return status || "غير محدد";
		}
	};
	
	const statusOptions = [
		{ value: "all", label: "الكل" },
		{ value: "ACID Issued", label: "تم إصدار ACID" },
		{ value: "Under Review", label: "قيد المراجعة" },
		{ value: "Rejected", label: "مرفوض" },
		{ value: "Pending", label: "قيد الانتظار" },
	];

	useEffect(() => {
		const fetchAcidRequests = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!token) {
					toast.error("الرجاء تسجيل الدخول");
					navigate("/login");
					return;
				}

				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/acid`,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				const requestsArray = response.data?.requests || response.data || [];
				const formattedRequests = requestsArray.map((request) => ({
					id: request._id,
					type: "acid_request",
					shipmentNo: request.acidCode || `طلب #${request._id.slice(-6)}`,
					clientName: request.supplierName || request.supplier?.name || "غير محدد",
					portName: request.goods?.customsItem || "غير محدد",
					secondaryIcon: Package,
					status: getStatusText(request.status),
					acid: request.acidCode,
					link: `/acidrequest/${request._id}`,
					createdAt: request.createdAt,
					date: (request.requestDate || request.createdAt) ? new Date(request.requestDate || request.createdAt).toLocaleDateString("ar-EG", {
						day: "numeric",
						month: "long",
						year: "numeric",
					}) : "غير محدد",
					rawStatus: request.status,
					rawCode: request.acidCode || "",
					rawSupplier: request.supplierName || ""
				}));

				setRequests(formattedRequests);
			} catch (error) {
				console.error("Error fetching ACID requests:", error);
				setError("فشل في تحميل طلبات ACID");
				toast.error("فشل في تحميل طلبات ACID");
			} finally {
				setLoading(false);
			}
		};

		fetchAcidRequests();
	}, [token, navigate]);

	const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };
	const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };

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

	// Filter & Sort
	let filteredRequests = requests.filter((req) => {
		const matchesSearch = 
			req.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
			req.clientName.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = statusFilter === "all" || req.rawStatus === statusFilter;
		return matchesSearch && matchesStatus;
	});

	filteredRequests = [...filteredRequests].sort((a, b) => {
		switch (sortOption) {
			case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
			case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
			case "supplierAZ": return a.clientName.localeCompare(b.clientName, "ar");
			default: return 0;
		}
	});

	// Pagination
	const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
	const currentItems = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

	// Reset to page 1 when filter/search changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, statusFilter, viewMode]);

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
			
			{/* Background */}
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
					<div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
						<h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-red-800"}`}>
							<FileCode className={isDarkMode ? "text-red-500" : "text-red-800"} size={32} />
							طلبات ACID
							<span className={`text-sm font-normal px-3 py-1 rounded-full ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-red-100 text-red-800"}`}>
								{filteredRequests.length} طلب
							</span>
						</h1>
						
						<button
							onClick={() => navigate("/acidrequest")}
							className="bg-red-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg hover:shadow-red-900/20 flex items-center gap-2"
						>
							<span className="text-xl">+</span>
							طلب جديد
						</button>
					</div>

					{/* Operations Bar */}
					<div className={`mb-10 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-lg border relative z-20 ${
						isDarkMode ? "bg-[#1a1010]/80 backdrop-blur-xl border-white/10" : "bg-white/80 backdrop-blur-xl border-white/40"
					}`}>
						{/* Search Input */}
						<div className="relative flex-1 w-full">
							<input
								type="text"
								placeholder="ابحث برقم ACID أو المورد..."
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

						{/* Filter, Sort, and View Toggle */}
						<div className="flex items-center gap-3 w-full md:w-auto">
							{/* Filter Button */}
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
								
								{/* Filter Dropdown */}
								{isFilterOpen && (
									<div className={`absolute top-full right-0 mt-2 w-56 p-3 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10 text-gray-200" : "bg-white border-gray-100 text-gray-700"}`} dir="rtl">
										<h4 className="font-bold mb-2 text-sm opacity-70">تصفية حسب الحالة</h4>
										<div className="space-y-1">
											{statusOptions.map((status) => (
												<button
													key={status.value}
													onClick={() => { setStatusFilter(status.value); setIsFilterOpen(false); }}
													className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
														statusFilter === status.value 
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

							{/* Sort Button */}
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

								{/* Sort Dropdown */}
								{isSortOpen && (
									<div className={`absolute top-full right-0 mt-2 w-48 p-3 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10 text-gray-200" : "bg-white border-gray-100 text-gray-700"}`} dir="rtl">
										<h4 className="font-bold mb-2 text-sm opacity-70">ترتيب حسب</h4>
										{[
											{ v: "newest", l: "الأحدث أولاً" },
											{ v: "oldest", l: "الأقدم أولاً" },
											{ v: "supplierAZ", l: "المورد (أ-ي)" }
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

					{/* Content */}
					{loading ? (
						<div className="flex flex-col items-center justify-center py-20">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
							<p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>جاري تحميل الطلبات...</p>
						</div>
					) : error ? (
						<div className={`bg-red-50 border border-red-300 rounded-lg p-4 text-right ${isDarkMode ? "bg-red-900/20 border-red-700" : ""}`}>
							<p className={`font-medium mb-3 flex items-center gap-2 ${isDarkMode ? "text-red-400" : "text-red-800"}`}>
								<AlertCircle size={20} /> {error}
							</p>
						</div>
					) : filteredRequests.length === 0 ? (
						<div className={`text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
							<div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
								<FileCode className={isDarkMode ? "text-gray-600" : "text-gray-300"} size={40} />
							</div>
							<h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>لا توجد طلبات ACID</h3>
							<button
								onClick={() => navigate("/acidrequest")}
								className="mt-4 bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
							>
								إضافة طلب جديد
							</button>
						</div>
					) : (
						<>
							{/* Requests Grid/List */}
							<div className={viewMode === "grid" 
								? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10" 
								: "flex flex-col gap-4 mb-10"
							}>
								{currentItems.map((request) => (
									<ShipmentCard key={request.id} shipment={request} viewMode={viewMode} />
								))}
							</div>

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
										onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
										onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
