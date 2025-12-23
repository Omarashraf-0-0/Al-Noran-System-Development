import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import SearchFilterSort from "../components/SearchFilterSort";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useTheme } from "../context/ThemeContext";
import { 
	ChevronDown, 
	ChevronUp, 
	Users, 
	Package, 
	CheckCircle, 
	Clock, 
	Eye, 
	MessageCircle, 
	LayoutGrid, 
	List,
	ChevronLeft,
	ChevronRight
} from "lucide-react";
import AVATAR from "../assets/images/AVATAR.png";

const MyCustomers = () => {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	
	const [customers, setCustomers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");
	const [sortOption, setSortOption] = useState("newest");
	const [expandedCustomer, setExpandedCustomer] = useState(null);
	const [viewMode, setViewMode] = useState("grid");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	
	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user"));
	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";

	// Filter options
	const filterOptions = [
		{ value: "all", label: "الكل" },
		{ value: "inProgress", label: "قيد التنفيذ" },
		{ value: "completed", label: "مكتملة" },
	];

	// Theme constants
	const themeCardBg = isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100";
	const themeText = isDarkMode ? "text-white" : "text-gray-900";
	const themeSubText = isDarkMode ? "text-gray-400" : "text-gray-500";

	useEffect(() => {
		fetchCustomers();
	}, []);

	const fetchCustomers = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await axios.get(
				`${apiUrl}/api/chat/my-customers`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.success || response.data.customers) {
				setCustomers(response.data.customers || []);
			}
		} catch (err) {
			console.error("Error fetching customers:", err);
			setError(err.response?.data?.message || "فشل تحميل قائمة العملاء");
		} finally {
			setLoading(false);
		}
	};

	const handleOpenChat = async (customer, shipment) => {
		try {
			const response = await axios.post(
				`${apiUrl}/api/chat`,
				{ shipmentId: shipment._id },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.success && response.data.chat) {
				navigate(`/chat?chatId=${response.data.chat._id}`);
			} else {
				toast.error("فشل في فتح المحادثة");
			}
		} catch (err) {
			console.error("Error opening chat:", err);
			toast.error(err.response?.data?.message || "فشل فتح المحادثة");
		}
	};

	const handleViewShipment = (shipmentId) => {
		navigate(`/employee-shipment/${shipmentId}`);
	};

	// Filter and search customers
	const filteredCustomers = customers.filter((customer) => {
		const matchesSearch =
			customer.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			customer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

		if (!matchesSearch) return false;

		if (filterStatus === "all") return true;

		return customer.shipments?.some((s) => {
			if (filterStatus === "completed") {
				return s.status === "مكتملة" || s.status === "تمت بنجاح";
			}
			if (filterStatus === "inProgress") {
				return s.status !== "مكتملة" && s.status !== "تمت بنجاح";
			}
			return true;
		});
	});

	// Sort options
	const sortOptions = [
		{ value: "newest", label: "الأحدث انضماماً" },
		{ value: "oldest", label: "الأقدم انضماماً" },
		{ value: "name", label: "الاسم (أ-ي)" },
		{ value: "shipments", label: "الأكثر شحنات" },
	];

	// Sort customers
	const sortedCustomers = [...filteredCustomers].sort((a, b) => {
		if (sortOption === "newest") {
			return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
		}
		if (sortOption === "oldest") {
			return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
		}
		if (sortOption === "name") {
			return (a.fullname || a.username || "").localeCompare(b.fullname || b.username || "", "ar");
		}
		if (sortOption === "shipments") {
			return (b.shipments?.length || 0) - (a.shipments?.length || 0);
		}
		return 0;
	});

	// Pagination
	const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = sortedCustomers.slice(indexOfFirstItem, indexOfLastItem);

	const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

	const getStatusConfig = (status) => {
		if (status === "مكتملة" || status === "تمت بنجاح") {
			return { bg: "bg-green-100", color: "text-green-700", border: "border-green-200", icon: "✅" };
		}
		if (status === "في الطريق") {
			return { bg: "bg-blue-100", color: "text-blue-700", border: "border-blue-200", icon: "🚚" };
		}
		if (status === "في انتظار الشحن") {
			return { bg: "bg-amber-100", color: "text-amber-700", border: "border-amber-200", icon: "⏳" };
		}
		return { bg: "bg-gray-100", color: "text-gray-700", border: "border-gray-200", icon: "📦" };
	};
	// Modal state
	const [shipmentsModal, setShipmentsModal] = useState({ open: false, customer: null });

	const openShipmentsModal = (customer, e) => {
		e?.stopPropagation();
		setShipmentsModal({ open: true, customer });
	};

	const closeShipmentsModal = () => {
		setShipmentsModal({ open: false, customer: null });
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

			<section className="flex-grow w-full pt-24 pb-12 px-4 md:px-8 relative z-10">
				<div className="max-w-7xl mx-auto">
					{/* Page Header */}
					<div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
						<h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-[#1ba3b6]"}`}>
							<span className="text-4xl">👥</span>
							عملائي
							<span className={`text-sm font-normal px-3 py-1 rounded-full ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-cyan-100 text-[#1ba3b6]"}`}>
								{filteredCustomers.length} عميل
							</span>
						</h1>
						
						{/* Quick Stats */}
						<div className="flex items-center gap-4">
							<div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDarkMode ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200 shadow-sm"}`}>
								<Package size={18} className="text-[#1ba3b6]" />
								<span className={`font-bold ${themeText}`}>
									{customers.reduce((acc, c) => acc + (c.shipments?.length || 0), 0)}
								</span>
								<span className={themeSubText}>شحنة</span>
							</div>
						</div>
					</div>

					{/* Search, Filter, Sort */}
					<SearchFilterSort
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="ابحث بالاسم، البريد الإلكتروني..."
						isFilterOpen={isFilterOpen}
						onToggleFilter={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
						filterValue={filterStatus}
						onFilterChange={setFilterStatus}
						filterOptions={filterOptions}
						filterLabel="تصفية حسب الحالة:"
						onFilterApply={() => setIsFilterOpen(false)}
						isSortOpen={isSortOpen}
						onToggleSort={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
						sortValue={sortOption}
						onSortChange={setSortOption}
						onSortApply={() => setIsSortOpen(false)}
						sortOptions={sortOptions} 
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

					{/* Content */}
					{loading ? (
						<LoadingSpinner />
					) : error ? (
						<ErrorMessage message={error} onRetry={fetchCustomers} retryText="إعادة محاولة" />
					) : sortedCustomers.length === 0 ? (
						<div className={`text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
							<div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
								<span className="text-4xl">{searchTerm || filterStatus !== "all" ? "🔍" : "📭"}</span>
							</div>
							<h3 className={`text-xl font-bold mb-2 ${themeText}`}>
								{searchTerm || filterStatus !== "all" ? "لا توجد نتائج" : "لا يوجد عملاء حالياً"}
							</h3>
							<p className={themeSubText}>
								{searchTerm || filterStatus !== "all"
									? "جرب تغيير البحث أو الفلتر"
									: "لم يتم تعيين أي شحنات لك بعد. سيظهر العملاء هنا عند تعيين شحنات."}
							</p>
						</div>
					) : (
						<>
							{/* Customers Grid/List */}
							<div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
								{currentItems.map((customer) => {
									const completedCount = customer.shipments?.filter(s => s.status === "مكتملة" || s.status === "تمت بنجاح").length || 0;
									const activeCount = (customer.shipments?.length || 0) - completedCount;

									return (
										<div
											key={customer._id}
											className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${themeCardBg} ${isDarkMode ? "hover:border-[#1ba3b6]/30" : "hover:border-[#1ba3b6]/30"} hover:shadow-xl`}
										>
											{/* Customer Header/Card Body */}
											<div
												className={`p-5 cursor-pointer transition-colors ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
												onClick={(e) => openShipmentsModal(customer, e)}
											>
												<div className="flex items-center gap-4">
													{/* Avatar */}
													<div className="relative">
														<div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${isDarkMode ? "bg-gradient-to-br from-[#1ba3b6] to-[#0d5c66] text-white" : "bg-gradient-to-br from-[#1ba3b6] to-[#158a9b] text-white"}`}>
															{customer.fullname?.charAt(0).toUpperCase() || customer.username?.charAt(0).toUpperCase() || "?"}
														</div>
														<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#050a0d]"></div>
													</div>

													{/* Info */}
													<div className="flex-1 min-w-0">
														<h3 className={`text-lg font-bold truncate ${themeText}`}>
															{customer.fullname || customer.username}
														</h3>
														<p className={`text-sm truncate ${themeSubText}`}>{customer.email}</p>
													</div>

													{/* Stats & View Icon */}
													<div className="flex items-center gap-4">
														{/* Stats - Hidden on mobile */}
														<div className="hidden sm:flex items-center gap-4">
															<div className="text-center">
																<p className="text-xl font-bold text-[#1ba3b6]">{customer.shipments?.length || 0}</p>
																<p className={`text-xs ${themeSubText}`}>شحنة</p>
															</div>
															<div className="text-center">
																<p className="text-xl font-bold text-green-500">{completedCount}</p>
																<p className={`text-xs ${themeSubText}`}>مكتملة</p>
															</div>
															<div className="text-center">
																<p className="text-xl font-bold text-blue-500">{activeCount}</p>
																<p className={`text-xs ${themeSubText}`}>نشطة</p>
															</div>
														</div>

														{/* View Icon (Instead of Expand) */}
														<div className={`p-2 rounded-full transition-colors ${isDarkMode ? "bg-white/5 group-hover:bg-[#1ba3b6] group-hover:text-white" : "bg-gray-100 group-hover:bg-[#1ba3b6] group-hover:text-white"}`}>
															<Package size={20} className={isDarkMode ? "text-gray-400 group-hover:text-white" : "text-gray-500 group-hover:text-white"} />
														</div>
													</div>
												</div>

												{/* Mobile Stats */}
												<div className="flex sm:hidden items-center justify-around mt-4 pt-4 border-t border-white/10">
													<div className="text-center">
														<p className="text-lg font-bold text-[#1ba3b6]">{customer.shipments?.length || 0}</p>
														<p className={`text-xs ${themeSubText}`}>شحنة</p>
													</div>
													<div className="text-center">
														<p className="text-lg font-bold text-green-500">{completedCount}</p>
														<p className={`text-xs ${themeSubText}`}>مكتملة</p>
													</div>
													<div className="text-center">
														<p className="text-lg font-bold text-blue-500">{activeCount}</p>
														<p className={`text-xs ${themeSubText}`}>نشطة</p>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>

							{/* Pagination */}
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
										<span className="text-[#1ba3b6]">{currentPage}</span>
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

			{/* Shipments Modal */}
			{shipmentsModal.open && shipmentsModal.customer && (
				<div 
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
					onClick={closeShipmentsModal}
				>
					<div 
						className={`relative rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl transform transition-all scale-100 ${isDarkMode ? "bg-[#1e1e1e] border border-white/10" : "bg-white"}`}
						onClick={e => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? "border-white/10" : "border-gray-100"}`}>
							<h3 className={`text-xl font-bold flex items-center gap-3 ${themeText}`}>
								<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? "bg-gradient-to-br from-[#1ba3b6] to-[#0d5c66] text-white" : "bg-gradient-to-br from-[#1ba3b6] to-[#158a9b] text-white"}`}>
									{shipmentsModal.customer.fullname?.charAt(0).toUpperCase()}
								</div>
								<div>
									<span>شحنات العميل</span>
									<span className={`block text-xs font-normal mt-0.5 ${themeSubText}`}>{shipmentsModal.customer.fullname}</span>
								</div>
							</h3>
							<button onClick={closeShipmentsModal} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${themeSubText}`}>
								✕
							</button>
						</div>

						{/* Modal Body - Scrollable */}
						<div className="p-6 overflow-y-auto custom-scrollbar">
							{shipmentsModal.customer.shipments?.length === 0 ? (
								<div className="text-center py-10">
									<p className={themeSubText}>لا توجد شحنات لهذا العميل</p>
								</div>
							) : (
								<div className="space-y-3">
									{shipmentsModal.customer.shipments?.map((shipment) => {
										const statusConfig = getStatusConfig(shipment.status);
										return (
											<div
												key={shipment._id}
												className={`flex items-center justify-between p-4 rounded-xl transition-all border ${isDarkMode ? "bg-white/5 border-white/5 hover:border-[#1ba3b6]/30" : "bg-gray-50 border-gray-100 hover:border-[#1ba3b6]/30"}`}
											>
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<p className={`font-bold font-mono text-lg ${themeText}`}>{shipment.acid || shipment.shipmentCode || "—"}</p>
														<span className={`text-xs px-3 py-1 rounded-full font-bold border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
															{statusConfig.icon} {shipment.status}
														</span>
													</div>
													<div className="flex items-center gap-4 text-sm">
														{shipment.country && (
															<span className={themeSubText}>
																📍 {shipment.country}
															</span>
														)}
														<span className={themeSubText}>
															📅 {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString("ar-EG") : "—" }
														</span>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<button
														onClick={(e) => { e.stopPropagation(); handleViewShipment(shipment._id); }}
														className={`p-2.5 rounded-xl transition-colors ${isDarkMode ? "bg-white/5 text-gray-400 hover:bg-[#1ba3b6] hover:text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-[#1ba3b6] hover:text-white hover:border-[#1ba3b6]"}`}
														title="عرض التفاصيل"
													>
														<Eye size={18} />
													</button>
													<button
														onClick={(e) => { e.stopPropagation(); handleOpenChat(shipmentsModal.customer, shipment); }}
														className={`p-2.5 rounded-xl transition-colors ${isDarkMode ? "bg-white/5 text-gray-400 hover:bg-green-600 hover:text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-green-600 hover:text-white hover:border-green-600"}`}
														title="محادثة"
													>
														<MessageCircle size={18} />
													</button>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MyCustomers;
