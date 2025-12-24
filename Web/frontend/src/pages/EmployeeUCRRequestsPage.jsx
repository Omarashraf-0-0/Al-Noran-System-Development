import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import SearchFilterSort from "../components/SearchFilterSort";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useTheme } from "../context/ThemeContext";

import { ChevronLeft, ChevronRight, Lock, Unlock, CheckCircle, XCircle, AlertTriangle, FileText, Anchor, Truck, Eye, LayoutGrid, List } from "lucide-react";

// Status configurations
const STATUS_CONFIG = {
	pending: { label: "قيد المراجعة", color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200", icon: "⏳" },
	under_review: { label: "قيد التدقيق", color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200", icon: "👀" },
	approved: { label: "معتمد", color: "text-green-600", bg: "bg-green-100", border: "border-green-200", icon: "✅" },
	rejected: { label: "مرفوض", color: "text-red-600", bg: "bg-red-100", border: "border-red-200", icon: "❌" },
	needs_revision: { label: "يحتاج تعديل", color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200", icon: "⚠️" },
	ucr_issued: { label: "تم إصدار UCR", color: "text-indigo-600", bg: "bg-indigo-100", border: "border-indigo-200", icon: "📋" },
	completed: { label: "مكتمل", color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200", icon: "✨" },
};

const EmployeeUCRRequestsPage = () => {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [requests, setRequests] = useState([]);
	const [filteredRequests, setFilteredRequests] = useState([]);
	
	// Filtering & Sorting
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortOption, setSortOption] = useState("newest");
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	const [isSortOpen, setIsSortOpen] = useState(false);
	const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// Modals & Actions
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [actionModal, setActionModal] = useState({ open: false, type: null });
	const [actionNotes, setActionNotes] = useState("");
	const [processingAction, setProcessingAction] = useState(false);
	const [ucrNumber, setUcrNumber] = useState("");
	const [issueUcrModal, setIssueUcrModal] = useState({ open: false, request: null });

	const user = JSON.parse(localStorage.getItem("user"));
	const token = localStorage.getItem("token");

	// Status options for filter
	const statusOptions = [
		{ value: "all", label: "الكل" },
		{ value: "pending", label: "قيد المراجعة" },
		{ value: "under_review", label: "قيد التدقيق" },
		{ value: "approved", label: "معتمد" },
		{ value: "rejected", label: "مرفوض" },
		{ value: "needs_revision", label: "يحتاج تعديل" },
		{ value: "ucr_issued", label: "تم إصدار UCR" },
		{ value: "completed", label: "مكتمل" },
	];

	const fetchRequests = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			if (!token) return;
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/ucr/employee/all`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			if (response.data.success) {
				setRequests(response.data.data || []);
			}
		} catch (error) {
			console.error("Error fetching UCR requests:", error);
			setError(error.response?.data?.message || "فشل في جلب الطلبات");
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		fetchRequests();
	}, [fetchRequests]);

	// --- Actions ---

	const handleLock = async (requestId, e) => {
		e?.stopPropagation();
		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/ucr/employee/${requestId}/lock`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				toast.success("تم قفل الطلب بنجاح");
				fetchRequests();
			}
		} catch (error) {
			console.error("Error locking request:", error);
			toast.error(error.response?.data?.message || "فشل قفل الطلب");
		}
	};

	const handleUnlock = async (requestId, e) => {
		e?.stopPropagation();
		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/ucr/employee/${requestId}/unlock`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				toast.success("تم فتح الطلب");
				fetchRequests();
			}
		} catch (error) {
			console.error("Error unlocking request:", error);
			toast.error(error.response?.data?.message || "فشل فتح الطلب");
		}
	};

	const handleActionSubmit = async () => {
		if (!selectedRequest || !actionModal.type) return;
		
		const type = actionModal.type;
		if ((type === 'reject' || type === 'revision') && !actionNotes.trim()) {
			toast.error("يجب إدخال الملاحظات");
			return;
		}

		setProcessingAction(true);
		try {
			let status = "";
			if (type === 'approve') status = "approved";
			else if (type === 'reject') status = "rejected";
			else if (type === 'revision') status = "needs_revision";

			const payload = {
				status: status,
				[type === 'reject' ? 'rejectionReason' : 'employeeNotes']: actionNotes,
			};

			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/ucr/employee/${selectedRequest._id}/status`,
				payload,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				toast.success("تم تحديث حالة الطلب");
				closeActionModal();
				fetchRequests();
			}
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error(error.response?.data?.message || "فشل تحديث الحالة");
		} finally {
			setProcessingAction(false);
		}
	};

	const handleIssueUCR = async () => {
		if (!issueUcrModal.request || !ucrNumber.trim()) {
			toast.error("يجب إدخال رقم UCR");
			return;
		}

		setProcessingAction(true);
		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/ucr/employee/${issueUcrModal.request._id}/issue-ucr`,
				{ ucrNumber: ucrNumber.trim() },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				toast.success(response.data.message || "تم إصدار UCR بنجاح");
				closeIssueUcrModal();
				fetchRequests();
				if (response.data.shipment) {
					navigate("/employee/export-shipments");
				}
			}
		} catch (error) {
			console.error("Error issuing UCR:", error);
			toast.error(error.response?.data?.message || "فشل إصدار UCR");
		} finally {
			setProcessingAction(false);
		}
	};

	// --- Logic: Filter & Sort ---
	useEffect(() => {
		let result = [...requests];

		if (statusFilter !== "all") {
			result = result.filter((req) => req.status === statusFilter);
		}

		if (searchTerm) {
			const query = searchTerm.toLowerCase();
			result = result.filter(
				(req) =>
					req.ucrNumber?.toLowerCase().includes(query) ||
					req.generalDescription?.toLowerCase().includes(query) ||
					req.destinationCountry?.toLowerCase().includes(query) ||
					req.userId?.name?.toLowerCase().includes(query) ||
					req.userId?.email?.toLowerCase().includes(query)
			);
		}

		result.sort((a, b) => {
			if (sortOption === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
			if (sortOption === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
			return 0;
		});

		setFilteredRequests(result);
	}, [requests, statusFilter, searchTerm, sortOption]);


	// Pagination Logic
	const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

	const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

	// Modals Open/Close
	const openActionModal = (request, type, e) => {
		e?.stopPropagation();
		setSelectedRequest(request);
		setActionModal({ open: true, type });
		setActionNotes("");
	};
	const closeActionModal = () => {
		setActionModal({ open: false, type: null });
		setActionNotes("");
		setSelectedRequest(null);
	};
	const openIssueUcrModal = (request, e) => {
		e?.stopPropagation();
		setIssueUcrModal({ open: true, request });
		setUcrNumber("");
	};
	const closeIssueUcrModal = () => {
		setIssueUcrModal({ open: false, request: null });
		setUcrNumber("");
	};

	// Constants for UI
	const isAdmin = user?.type === 'admin' || user?.employeeDetails?.employeeType === 'System Admin';

	const themeCardBg = isDarkMode ? (isAdmin ? "bg-[#1a1600]/80 border-[#D4AF37]/20" : "bg-white/5 border-white/5") : (isAdmin ? "bg-white border-gray-100 shadow-sm" : "bg-white border-gray-100");
	const themeText = isDarkMode ? (isAdmin ? "text-[#D4AF37]" : "text-white") : (isAdmin ? "text-[#690000]" : "text-gray-900");
	const themeSubText = isDarkMode ? "text-gray-400" : "text-gray-500";
	const themePageBg = isDarkMode ? (isAdmin ? "bg-[#0a0800]" : "bg-[#050a0d]") : (isAdmin ? "bg-[#FFFDF5]" : "bg-gray-50");
	const themeAccentText = isDarkMode ? (isAdmin ? "text-[#D4AF37]" : "text-[#1ba3b6]") : (isAdmin ? "text-[#690000]" : "text-[#1ba3b6]");
	const themeAccentBg = isDarkMode ? (isAdmin ? "bg-[#D4AF37]/10" : "bg-white/10") : (isAdmin ? "bg-amber-100" : "bg-cyan-100");

	return (
		<div className={`flex flex-col min-h-screen font-sans relative transition-colors duration-300 ${themePageBg}`}>
			
			{/* Animated Background */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
				{isDarkMode ? (
					<>
						<div className={`absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full filter blur-[100px] animate-pulse ${isAdmin ? "bg-[#D4AF37]/10" : "bg-[#1ba3b6]/10"}`}></div>
						<div className={`absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full filter blur-[120px] ${isAdmin ? "bg-[#690000]/10" : "bg-[#0d5c66]/20"}`}></div>
					</>
				) : (
					<div className={`absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b ${isAdmin ? "from-amber-50/50" : "from-cyan-50/50"} to-transparent`}></div>
				)}
			</div>
			
			<Header />

			<section className="flex-grow w-full pt-24 pb-12 px-4 md:px-8 relative z-10">
				<div className="max-w-7xl mx-auto">
					{/* Header Section */}
					<div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
						<h1 className={`text-3xl font-bold flex items-center gap-3 ${themeAccentText}`}>
							<span className="text-4xl">📋</span>
							إدارة طلبات UCR
							<span className={`text-sm font-normal px-3 py-1 rounded-full ${isDarkMode ? (isAdmin ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-white/10 text-gray-400") : (isAdmin ? "bg-amber-100 text-[#690000]" : "bg-cyan-100 text-[#1ba3b6]")}`}>
								{filteredRequests.length} طلب
							</span>
						</h1>
					</div>

					{/* Search, Filter, Sort */}
					<SearchFilterSort
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="ابحث برقم UCR، العميل، الوجهة..."
						isFilterOpen={isFilterOpen}
						onToggleFilter={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
						filterValue={statusFilter}
						onFilterChange={setStatusFilter}
						filterOptions={statusOptions}
						filterLabel="تصفية حسب الحالة:"
						onFilterApply={() => setIsFilterOpen(false)}
						isSortOpen={isSortOpen}
						onToggleSort={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
						sortValue={sortOption}
						onSortChange={setSortOption}
						onSortApply={() => setIsSortOpen(false)}
						userType={user?.type}
						isDarkMode={isDarkMode}
					>
						<div className={`flex items-center p-1 rounded-2xl border ${isDarkMode ? (isAdmin ? "bg-black/20 border-[#D4AF37]/20" : "bg-white/5 border-white/10") : (isAdmin ? "bg-white border-gray-200" : "bg-white border-gray-200")}`}>
							<button
								onClick={() => setViewMode("grid")}
								className={`p-3 rounded-xl transition-all ${viewMode === "grid" ? (isDarkMode ? (isAdmin ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/10 text-[#1ba3b6]") : (isAdmin ? "bg-amber-100 text-[#690000]" : "bg-gray-100 text-[#1ba3b6]")) : "text-gray-400"}`}
								title="عرض شبكة"
							>
								<LayoutGrid size={20} />
							</button>
							<button
								onClick={() => setViewMode("list")}
								className={`p-3 rounded-xl transition-all ${viewMode === "list" ? (isDarkMode ? (isAdmin ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/10 text-[#1ba3b6]") : (isAdmin ? "bg-amber-100 text-[#690000]" : "bg-gray-100 text-[#1ba3b6]")) : "text-gray-400"}`}
								title="عرض قائمة"
							>
								<List size={20} />
							</button>
						</div>
					</SearchFilterSort>

					{/* Grid of Cards */}
					{loading ? (
						<LoadingSpinner />
					) : error ? (
						<ErrorMessage message={error} onRetry={fetchRequests} retryText="إعادة محاولة" />
					) : filteredRequests.length === 0 ? (
						<div className={`text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
							<div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
								<span className="text-4xl">📭</span>
							</div>
							<h3 className={`text-xl font-bold mb-2 ${themeText}`}>لا توجد طلبات UCR</h3>
							<p className={themeSubText}>لم يتم العثور على طلبات تطابق بحثك</p>
						</div>
					) : (
						<>
							<div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
								{currentItems.map((request) => {
									const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
									const isLocked = request.isLocked;
									const isLockedByOthers = isLocked && request.reviewingBy?._id !== user.id;

									return (
										<div
											key={request._id}
											className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex ${viewMode === "grid" ? "flex-col justify-between" : "grid grid-cols-12 gap-4 items-center"}
												${themeCardBg} ${isDarkMode ? (isAdmin ? "hover:border-[#D4AF37]/50" : "hover:border-[#1ba3b6]/30") : (isAdmin ? "hover:border-[#D4AF37]/50" : "hover:border-[#1ba3b6]/30")}
											`}
											onClick={() => {
                        navigate(`/employee/ucr-request/${request._id}`);
                      }}
										>
											{/* Top: Status & Date */}
											<div className={`${viewMode === "list" ? "col-span-2 flex flex-col gap-1" : "flex justify-between items-start mb-4"}`}>
												<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} w-fit`}>
													<span>{statusConfig.icon}</span>
													{statusConfig.label}
												</span>
												<span className={`text-xs ${themeSubText} ${viewMode === "list" ? "" : ""}`}>
													{new Date(request.createdAt).toLocaleDateString("ar-EG")}
												</span>
											</div>

											{/* Middle: Info */}
											<div className={`${viewMode === "list" ? "col-span-3" : "mb-4"}`}>
												<h3 className={`text-lg font-bold mb-1 break-all ${request.ucrNumber ? (isAdmin ? (isDarkMode ? "text-[#D4AF37]" : "text-[#690000]") : "text-[#1ba3b6]") : themeText}`}>
													{request.ucrNumber || "لم يصدر بعد"}
												</h3>
												{request.supplier && (
													<p className={`text-sm mb-2 ${themeSubText}`}>
														المورد: {request.supplier.name} ({request.supplier.country})
													</p>
												)}
												
												{viewMode === "grid" && (
													<div className="flex items-center gap-2 mb-2">
														<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? (isAdmin ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/10 text-white") : (isAdmin ? "bg-amber-100 text-[#690000]" : "bg-gray-100 text-gray-700")}`}>
															{request.userId?.username?.charAt(0).toUpperCase()}
														</div>
														<span className={`text-sm ${themeText}`}>
															{request.userId?.fullname || request.userId?.username}
														</span>
													</div>
												)}
												
												{/* Locked Status */}
												{isLocked && (
													<div className="mt-2 text-xs flex items-center gap-1 text-red-500 font-medium bg-red-500/10 px-2 py-1 rounded-lg w-fit">
														<Lock size={12} />
														<span>مقفول بواسطة: {request.reviewingBy?.username || "مستخدم"}</span>
													</div>
												)}
											</div>
											
											{/* User Column (List View Only) */}
											{viewMode === "list" && (
												<div className="col-span-2 flex items-center gap-2 overflow-hidden">
													<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? (isAdmin ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/10 text-white") : (isAdmin ? "bg-amber-100 text-[#690000]" : "bg-gray-100 text-gray-700")}`}>
														{request.userId?.username?.charAt(0).toUpperCase()}
													</div>
													<div className="flex flex-col">
														<span className={`text-sm font-bold ${themeText}`}>
															{request.userId?.fullname || request.userId?.username}
														</span>
													</div>
												</div>
											)}

											{/* Bottom: Actions */}
											<div 
												className={`${viewMode === "list" ? "col-span-5 flex justify-end gap-1 flex-wrap" : "pt-4 border-t flex flex-wrap gap-2 justify-end"} ${isDarkMode ? "border-white/5" : "border-gray-100"}`}
												onClick={(e) => e.stopPropagation()} // Prevent card click when clicking buttons
											>
												{/* View Details */}
												<button
													onClick={(e) => {
														e.stopPropagation();
														navigate(`/employee/ucr-request/${request._id}`);
													}}
													className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100"
												>
													<Eye size={14} /> تفاصيل
												</button>

												{/* Lock/Unlock */}
												{request.status === "pending" && (
													!isLocked ? (
														<button
															onClick={(e) => handleLock(request._id, e)}
															className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
														>
															<Lock size={14} /> قفل
														</button>
													) : (
														!isLockedByOthers && (
															<button
																onClick={(e) => handleUnlock(request._id, e)}
																className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
															>
																<Unlock size={14} /> فتح
															</button>
														)
													)
												)}

												{/* Actions: Approve / Revise / Reject with LABELS */}
												{((request.status === "under_review" || (request.status === "pending" && isLocked)) && !isLockedByOthers) && (
													<>
														<button
															onClick={(e) => openActionModal(request, "approve", e)}
															className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200"
															title="قبول"
														>
															<CheckCircle size={14} /> قبول
														</button>
														<button
															onClick={(e) => openActionModal(request, "revision", e)}
															className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200"
															title="طلب تعديل"
														>
															<AlertTriangle size={14} /> تعديل
														</button>
														<button
															onClick={(e) => openActionModal(request, "reject", e)}
															className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200"
															title="رفض"
														>
															<XCircle size={14} /> رفض
														</button>
													</>
												)}

												{/* Issue UCR */}
												{request.status === "approved" && (
													<button
														onClick={(e) => openIssueUcrModal(request, e)}
														className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
													>
														<Anchor size={14} /> إصدار UCR
													</button>
												)}

												{/* Track Shipment */}
												{request.status === "ucr_issued" && request.hasExportShipment && (
													<button
														onClick={(e) => { e.stopPropagation(); navigate("/employee/export-shipments"); }}
														className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-green-50 text-green-600 hover:bg-green-100"
													>
														<Truck size={14} /> متابعة
													</button>
												)}
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
												: (isDarkMode ? (isAdmin ? "hover:bg-[#D4AF37] hover:text-black bg-[#D4AF37]/10 text-[#D4AF37]" : "hover:bg-[#1ba3b6] hover:text-white bg-white/10 text-white") : (isAdmin ? "hover:bg-[#D4AF37] hover:text-white bg-white text-gray-700 shadow-sm" : "hover:bg-[#1ba3b6] hover:text-white bg-white text-gray-700 shadow-sm"))
										}`}
									>
										<ChevronLeft size={24} />
									</button>
									
									<div className={`px-6 py-2 rounded-xl font-bold ${isDarkMode ? "bg-white/5 text-white border border-white/10" : "bg-white text-gray-800 shadow-sm"}`}>
										<span className={isAdmin ? (isDarkMode ? "text-[#D4AF37]" : "text-[#690000]") : "text-[#1ba3b6]"}>{currentPage}</span>
										<span className="mx-2 opacity-50">/</span>
										<span className="opacity-70">{totalPages}</span>
									</div>

									<button
										onClick={nextPage}
										disabled={currentPage === totalPages}
										className={`p-3 rounded-full transition-all duration-300 ${
											currentPage === totalPages 
												? (isDarkMode ? "text-gray-700 bg-white/5 cursor-not-allowed" : "text-gray-300 bg-gray-100 cursor-not-allowed") 
												: (isDarkMode ? (isAdmin ? "hover:bg-[#D4AF37] hover:text-black bg-[#D4AF37]/10 text-[#D4AF37]" : "hover:bg-[#1ba3b6] hover:text-white bg-white/10 text-white") : (isAdmin ? "hover:bg-[#D4AF37] hover:text-white bg-white text-gray-700 shadow-sm" : "hover:bg-[#1ba3b6] hover:text-white bg-white text-gray-700 shadow-sm"))
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

			{/* -- Modals -- */}
			
			{/* Action Modal (Approve/Reject/Revise) */}
			{actionModal.open && (
				<div 
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
					onClick={closeActionModal}
				>
					<div 
						className={`relative rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all scale-100 ${isDarkMode ? "bg-[#1e1e1e] border border-white/10" : "bg-white"}`}
						onClick={e => e.stopPropagation()}
					>
						<h3 className={`text-xl font-bold mb-4 text-right ${themeText}`}>
							{actionModal.type === 'approve' ? '✅ اعتماد الطلب' : actionModal.type === 'reject' ? '❌ رفض الطلب' : '⚠️ طلب تعديل'}
						</h3>

						<div className="mb-6 text-right">
							<label className={`block text-sm font-bold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
								ملاحظات {actionModal.type === 'reject' ? 'الرفض' : actionModal.type === 'revision' ? 'التعديل' : 'الاعتماد'}
								{actionModal.type !== 'approve' && <span className="text-red-500">*</span>}
							</label>
							<textarea
								value={actionNotes}
								onChange={(e) => setActionNotes(e.target.value)}
								rows={3}
								className={`w-full p-3 border rounded-xl focus:ring-2 outline-none transition-all resize-none ${
									isAdmin ? "focus:ring-[#D4AF37]" : "focus:ring-[#1ba3b6]"
								} ${
									isDarkMode 
										? "bg-black/30 border-white/10 text-white placeholder-gray-500" 
										: "bg-white border-gray-300 text-gray-900"
								}`}
								placeholder="أكتب ملاحظاتك هنا..."
							/>
						</div>

						<div className="flex justify-end gap-3">
							<button
								onClick={closeActionModal}
								disabled={processingAction}
								className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
									isDarkMode 
										? "bg-white/10 text-white hover:bg-white/20" 
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								إلغاء
							</button>
							<button
								onClick={handleActionSubmit}
								disabled={processingAction || ((actionModal.type === 'reject' || actionModal.type === 'revision') && !actionNotes.trim())}
								className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
									${actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 
									  actionModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}
								`}
							>
								{processingAction ? "جاري التحديث..." : "تأكيد"}
							</button>
						</div>
					</div>
				</div>
			)}
			
			{/* Issue UCR Modal */}
			{issueUcrModal.open && (
				<div 
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
					onClick={closeIssueUcrModal}
				>
					<div 
						className={`relative rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all scale-100 ${isDarkMode ? "bg-[#1e1e1e] border border-white/10" : "bg-white"}`}
						onClick={e => e.stopPropagation()}
					>
						<h3 className={`text-xl font-bold mb-4 text-right flex items-center gap-2 ${themeText}`}>
							<Anchor size={24} /> إصدار رقم UCR
						</h3>
						
						<p className={`text-sm mb-4 text-right ${themeSubText}`}>
							سيتم إنشاء شحنة تصدير جديدة تلقائياً عند إصدار رقم UCR.
						</p>

						<div className="mb-6 text-right">
							<label className={`block text-sm font-bold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
								رقم UCR من النافذة <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={ucrNumber}
								onChange={(e) => setUcrNumber(e.target.value)}
								className={`w-full p-3 border rounded-xl focus:ring-2 outline-none transition-all text-left ${isAdmin ? "focus:ring-[#D4AF37]" : "focus:ring-[#1ba3b6]"} ${
									isDarkMode 
										? "bg-black/30 border-white/10 text-white placeholder-gray-500" 
										: "bg-white border-gray-300 text-gray-900"
								}`}
								placeholder="أدخل الرقم هنا..."
								dir="ltr"
							/>
						</div>

						<div className="flex justify-end gap-3">
							<button
								onClick={closeIssueUcrModal}
								disabled={processingAction}
								className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
									isDarkMode 
										? "bg-white/10 text-white hover:bg-white/20" 
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								إلغاء
							</button>
							<button
								onClick={handleIssueUCR}
								disabled={processingAction || !ucrNumber.trim()}
								className={`px-5 py-2.5 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
									isAdmin 
									? "bg-[#D4AF37] hover:bg-[#b5952f] shadow-[#D4AF37]/20" 
									: "bg-[#1ba3b6] hover:bg-[#158a9b] shadow-[#1ba3b6]/20"
								}`}
							>
								{processingAction ? "جاري الإصدار..." : "إصدار وإنشاء الشحنة"}
							</button>
						</div>
					</div>
				</div>
			)}

		</div>
	);
};

export default EmployeeUCRRequestsPage;
