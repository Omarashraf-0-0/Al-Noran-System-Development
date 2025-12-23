import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import SearchFilterSort from "../components/SearchFilterSort";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import CreateShipmentModal from "../components/CreateShipmentModal";
import ShipmentDetailsModal from "../components/ShipmentDetailsModal";
import RequestDetailsModal from "../components/RequestDetailsModal";
import AcidConfirmationModal from "../components/AcidConfirmationModal";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, ChevronRight, Lock, Unlock, FileText, Anchor, Truck, Eye } from "lucide-react";

const EmployeeAcidRequestsPage = () => {
	const { isDarkMode } = useTheme();
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	
	// Modals State
	const [showShipmentModal, setShowShipmentModal] = useState(false);
	const [showShipmentDetailsModal, setShowShipmentDetailsModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [confirmData, setConfirmData] = useState(null);
	const [acidCodeInput, setAcidCodeInput] = useState("");
	
	// Filter & Sort State
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [issuedByMe, setIssuedByMe] = useState(false);
	const [lockedByMe, setLockedByMe] = useState(false);
	const [sortOption, setSortOption] = useState("newest");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8; // Slightly larger cards, so fewer per page

	// Shipment form data
	const [shipmentData, setShipmentData] = useState({
		portName: "",
		country: "",
		numContainers: 1,
		containerTypes: ["20ft"],
		status: "في انتظار الشحن",
		policy: "",
		arrivalDate: "",
	});

	const user = JSON.parse(localStorage.getItem("user"));
	const token = localStorage.getItem("token");

	// Status Config for Filters
	const statusOptions = [
		{ value: "All", label: "الكل" },
		{ value: "Pending", label: "قيد الانتظار" },
		{ value: "Under Review", label: "قيد المراجعة" },
		{ value: "ACID Issued", label: "تم الإصدار" },
		{ value: "Rejected", label: "مرفوض" },
	];

	useEffect(() => {
		fetchAllRequests();
	}, [issuedByMe, lockedByMe]);

	const fetchAllRequests = async () => {
		try {
			setLoading(true);
			setError(null);
			if (!token) return;

			let url = `${import.meta.env.VITE_API_URL}/api/acid/employee/all`;
			// The backend might handle these query params, preserving existing logic
			if (issuedByMe) {
				url += `?issuedByMe=true`;
			}
			const response = await axios.get(url, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.data.success) {
				setRequests(response.data.requests);
			}
		} catch (error) {
			console.error("Error fetching ACID requests:", error);
			setError(error.response?.data?.message || "Failed to fetch ACID requests");
		} finally {
			setLoading(false);
		}
	};

	// --- Logic Handlers (Preserved) ---

	const handleStatusChange = async (requestId, newStatus, acidCode = null) => {
		try {
			const payload = { status: newStatus };
			if (newStatus === "ACID Issued" && acidCode) {
				payload.acidCode = acidCode;
			}
			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${requestId}/status`,
				payload,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				toast.success("تم تحديث حالة الطلب بنجاح");
				fetchAllRequests();
			}
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error(error.response?.data?.message || "فشل تحديث الحالة");
		}
	};

	const handleLockRequest = async (requestId, e) => {
		e?.stopPropagation();
		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${requestId}/lock`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				toast.success("تم قفل الطلب للمراجعة");
				fetchAllRequests();
			}
		} catch (error) {
			console.error("Error locking request:", error);
			toast.error(error.response?.data?.message || "فشل قفل الطلب");
		}
	};

	const handleUnlockRequest = async (requestId, e) => {
		e?.stopPropagation();
		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${requestId}/unlock`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				toast.success("تم فتح الطلب");
				fetchAllRequests();
			}
		} catch (error) {
			console.error("Error unlocking request:", error);
			toast.error(error.response?.data?.message || "فشل فتح الطلب");
		}
	};

	const requestIssueConfirmation = async (requestId, e) => {
		e?.stopPropagation();
		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${requestId}/issue`,
				{ confirmed: false },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.needsConfirmation) {
				setConfirmData(response.data.request);
				setShowConfirmModal(true);
			}
		} catch (error) {
			console.error("Error requesting confirmation:", error);
			toast.error(error.response?.data?.message || "فشل في التحقق من البيانات");
		}
	};

	const handleIssueAcid = async () => {
		if (!acidCodeInput || acidCodeInput.trim() === "") {
			toast.error("يجب إدخال كود ACID");
			return;
		}

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${confirmData.id}/issue`,
				{
					confirmed: true,
					acidCode: acidCodeInput,
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				toast.success("تم إصدار ACID بنجاح!");
				setShowConfirmModal(false);
				setConfirmData(null);
				setAcidCodeInput("");
				fetchAllRequests();
			}
		} catch (error) {
			console.error("Error issuing ACID:", error);
			toast.error(error.response?.data?.message || "فشل إصدار ACID");
		}
	};

	const handleShowShipmentDetails = (request) => {
		setSelectedRequest(request);
		setShowShipmentDetailsModal(true);
	};

	const openShipmentModal = (request, e) => {
		e?.stopPropagation();
		if (!request.acidCode) {
			toast.error("يجب إصدار كود ACID أولاً");
			return;
		}
		setSelectedRequest(request);
		setShipmentData({
			portName: "",
			country: request.supplier?.country || "",
			numContainers: 1,
			containerTypes: ["20ft"],
			status: "في انتظار الشحن",
			policy: "",
			arrivalDate: "",
		});
		setShowShipmentModal(true);
	};

	const closeShipmentModal = () => {
		setShowShipmentModal(false);
		setSelectedRequest(null);
	};

	const handleShipmentSubmit = async (e) => {
		e.preventDefault();
		if (!selectedRequest) return;

		if (!shipmentData.portName || !shipmentData.country || !shipmentData.arrivalDate) {
			toast.error("يرجى ملء جميع الحقول المطلوبة");
			return;
		}

		try {
			// Extract upload IDs
			let uploadIds = [];
			if (selectedRequest.uploads && Array.isArray(selectedRequest.uploads)) {
				uploadIds = selectedRequest.uploads
					.map((upload) => (typeof upload === "object" && upload._id ? upload._id : upload))
					.filter((id) => id);
			}

			const payload = {
				user_id: selectedRequest.userId._id || selectedRequest.userId,
				employee_id: user.id || user._id,
				acid: selectedRequest.acidCode,
				shipment_type: selectedRequest.shipmentType || "بحري",
				port_name: shipmentData.portName.trim(),
				country: shipmentData.country.trim(),
				num_of_containers: parseInt(shipmentData.numContainers) || 1,
				type_of_containers: shipmentData.containerTypes.filter((t) => t),
				status: shipmentData.status || "Pending",
				policy: shipmentData.policy || "",
				arrivalDate: shipmentData.arrivalDate,
				acid_request_id: selectedRequest._id,
				uploads: uploadIds,
				importerName: selectedRequest.supplier?.name || selectedRequest.userId?.fullname || selectedRequest.userId?.username,
				employerName: user.fullname || user.username,
				shipmentDescription: selectedRequest.goods?.description || "",
				number46: "",
			};

			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/shipments`,
				payload,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				const shipmentId = response.data.data?._id || response.data.data?.id;
				await axios.patch(
					`${import.meta.env.VITE_API_URL}/api/acid/${selectedRequest._id}`,
					{
						hasShipment: true,
						shipmentId: shipmentId,
						shipmentCreatedAt: new Date(),
					},
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				toast.success("تم إنشاء الشحنة بنجاح");
				closeShipmentModal();
				fetchAllRequests();
			}
		} catch (error) {
			console.error("❌ Error creating shipment:", error);
			toast.error(error.response?.data?.message || "فشل إنشاء الشحنة");
		}
	};

	// --- Filtering & Sorting ---

	const filterAndSortRequests = () => {
		let result = [...requests];

		// Status Filter
		if (statusFilter !== "All") {
			result = result.filter(req => req.status === statusFilter);
		}

		// "Issued By Me" Filter
		if (issuedByMe) {
			const currentUserId = user.id || user._id;
			result = result.filter(req => req.issuedBy?._id === currentUserId || req.issuedBy === currentUserId);
		}

		// "Locked By Me" Filter
		if (lockedByMe) {
			const currentUserId = user.id || user._id;
			result = result.filter(req => 
				req.isLocked && (req.reviewingBy?._id === currentUserId || req.reviewingBy === currentUserId)
			);
		}

		// Search
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase();
			result = result.filter(req => 
				req.acidCode?.toLowerCase().includes(searchLower) ||
				req.userId?.username?.toLowerCase().includes(searchLower) ||
				req.userId?.email?.toLowerCase().includes(searchLower) ||
				req.supplier?.name?.toLowerCase().includes(searchLower)
			);
		}

		// Sorting
		result.sort((a, b) => {
			if (sortOption === "newest") {
				return new Date(b.requestDate || b.createdAt) - new Date(a.requestDate || a.createdAt);
			} else if (sortOption === "oldest") {
				return new Date(a.requestDate || a.createdAt) - new Date(b.requestDate || b.createdAt);
			} else if (sortOption === "clientAZ") {
				return (a.userId?.username || "").localeCompare(b.userId?.username || "", "ar");
			} else if (sortOption === "clientZA") {
				return (b.userId?.username || "").localeCompare(a.userId?.username || "", "ar");
			}
			return 0;
		});

		return result;
	};

	const filteredRequests = filterAndSortRequests();
	
	// Pagination Logic
	const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

	const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

	// Helper: Get badge styles
	const getStatusConfig = (status) => {
		switch (status) {
			case "Pending":
				return { color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200", icon: "⏳", label: "قيد الانتظار" };
			case "Under Review":
				return { color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200", icon: "👀", label: "قيد المراجعة" };
			case "ACID Issued":
				return { color: "text-green-600", bg: "bg-green-100", border: "border-green-200", icon: "✅", label: "تم الإصدار" };
			case "Rejected":
				return { color: "text-red-600", bg: "bg-red-100", border: "border-red-200", icon: "❌", label: "مرفوض" };
			default:
				return { color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200", icon: "❓", label: status };
		}
	};
	
	// Theme Helpers
	const themeCardBg = isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100";
	const themeText = isDarkMode ? "text-white" : "text-gray-900";
	const themeSubText = isDarkMode ? "text-gray-400" : "text-gray-500";

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
					{/* Header Section */}
					<div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
						<h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-[#1ba3b6]"}`}>
							<span className="text-4xl">🧾</span>
							إدارة طلبات ACID
							<span className={`text-sm font-normal px-3 py-1 rounded-full ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-cyan-100 text-[#1ba3b6]"}`}>
								{filteredRequests.length} طلب
							</span>
						</h1>
					</div>

					{/* Search, Filter, Sort */}
					<SearchFilterSort
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="ابحث بكود ACID، اسم العميل، أو المورد..."
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
						// Custom filters can be injected here or handled via extra UI, for now standard filters
					/>

					{/* Custom Filter Checkboxes (below main bar) */}
					<div className="flex justify-center gap-6 mb-8 text-sm font-medium">
						<label className={`flex items-center gap-2 cursor-pointer ${themeText}`}>
							<input
								type="checkbox"
								checked={issuedByMe}
								onChange={(e) => setIssuedByMe(e.target.checked)}
								className="w-4 h-4 text-[#1ba3b6] rounded focus:ring-0"
							/>
							طلبات أصدرتها أنا
						</label>
						<label className={`flex items-center gap-2 cursor-pointer ${themeText}`}>
							<input
								type="checkbox"
								checked={lockedByMe}
								onChange={(e) => setLockedByMe(e.target.checked)}
								className="w-4 h-4 text-[#1ba3b6] rounded focus:ring-0"
							/>
							<span>🔒 طلبات مقفولة بواسطتي</span>
						</label>
					</div>

					{/* Grid of Cards */}
					{loading ? (
						<LoadingSpinner />
					) : error ? (
						<ErrorMessage message={error} onRetry={fetchAllRequests} retryText="إعادة محاولة" />
					) : filteredRequests.length === 0 ? (
						<div className={`text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
							<div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
								<span className="text-4xl">📭</span>
							</div>
							<h3 className={`text-xl font-bold mb-2 ${themeText}`}>لا توجد طلبات ACID</h3>
							<p className={themeSubText}>لم يتم العثور على طلبات تطابق بحثك</p>
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
								{currentItems.map((request) => {
									const statusConfig = getStatusConfig(request.status);
									const isLocked = request.isLocked;
									const isLockedByOthers = isLocked && request.reviewingBy?._id !== user.id;

									return (
										<div
											key={request._id}
											className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between
												${themeCardBg} ${isDarkMode ? "hover:border-[#1ba3b6]/30" : "hover:border-[#1ba3b6]/30"}
											`}
											onClick={() => {
												setSelectedRequest(request);
												setShowDetailsModal(true);
											}}
										>
											{/* Top: Status & Date */}
											<div className="flex justify-between items-start mb-4">
												<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
													<span>{statusConfig.icon}</span>
													{statusConfig.label}
												</span>
												<span className={`text-xs ${themeSubText}`}>
													{new Date(request.createdAt).toLocaleDateString("ar-EG")}
												</span>
											</div>

											{/* Middle: Info */}
											<div className="mb-4">
												<h3 className={`text-lg font-bold mb-1 break-all ${request.acidCode ? "text-[#1ba3b6]" : themeText}`}>
													{request.acidCode || "لم يصدر بعد"}
												</h3>
												{request.supplier && (
													<p className={`text-sm mb-2 ${themeSubText}`}>
														المورد: {request.supplier.name} ({request.supplier.country})
													</p>
												)}
												<div className="flex items-center gap-2 mb-2">
													<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}>
														{request.userId?.username?.charAt(0).toUpperCase()}
													</div>
													<span className={`text-sm ${themeText}`}>
														{request.userId?.fullname || request.userId?.username}
													</span>
												</div>
												
												{/* Locked Status */}
												{isLocked && (
													<div className="mt-2 text-xs flex items-center gap-1 text-red-500 font-medium bg-red-500/10 px-2 py-1 rounded-lg w-fit">
														<Lock size={12} />
														<span>مقفول بواسطة: {request.reviewingBy?.username || "مستخدم"}</span>
													</div>
												)}
											</div>

											{/* Bottom: Actions */}
											<div 
												className={`pt-4 border-t flex flex-wrap gap-2 justify-end ${isDarkMode ? "border-white/5" : "border-gray-100"}`}
												onClick={(e) => e.stopPropagation()} // Prevent card click when clicking buttons
											>
												{/* View Details */}
												<button
													onClick={(e) => {
														e.stopPropagation();
														setSelectedRequest(request);
														setShowDetailsModal(true);
													}}
													className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100"
												>
													<Eye size={14} /> تفاصيل
												</button>

												{/* Lock/Unlock */}
												{request.status === "Pending" && (
													!isLocked ? (
														<button
															onClick={(e) => handleLockRequest(request._id, e)}
															className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
														>
															<Lock size={14} /> قفل
														</button>
													) : (
														!isLockedByOthers && (
															<button
																onClick={(e) => handleUnlockRequest(request._id, e)}
																className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
															>
																<Unlock size={14} /> فتح
															</button>
														)
													)
												)}

												{/* Issue ACID (Only if locked by me or Pending/UnderReview) */}
												{(request.status === "Pending" || request.status === "Under Review") && 
													(!isLocked || (!isLockedByOthers)) && (
														<button
															onClick={(e) => requestIssueConfirmation(request._id, e)}
															className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-[#1ba3b6] text-white hover:bg-[#158a9b]"
														>
															<Anchor size={14} /> إصدار
														</button>
													)
												}
												{/* Reject (Only if locked by me or Pending/UnderReview) -> Need handleStatusChange */}
												{(request.status === "Pending" || request.status === "Under Review") && 
													(!isLocked || (!isLockedByOthers)) && (
														<button
															onClick={() => handleStatusChange(request._id, "Rejected")}
															className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200"
														>
															رفض
														</button>
													)
												}

												{/* Create Shipment */}
												{request.status === "ACID Issued" && !request.hasShipment && (
													<button
														onClick={(e) => openShipmentModal(request, e)}
														className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
													>
														<Truck size={14} /> شحنة
													</button>
												)}
												
												{/* Shipment Created Indicator */}
												{request.hasShipment && (
													<span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-600 flex items-center gap-1">
														<Truck size={14} /> تم الشحن
													</span>
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

			{/* -- Modals -- */}
			
			<CreateShipmentModal
				show={showShipmentModal}
				data={selectedRequest}
				onClose={closeShipmentModal}
				onConfirm={async (formData) => {
					if (!selectedRequest) return;

					try {
						// Extract upload IDs
						let uploadIds = [];
						if (selectedRequest.uploads && Array.isArray(selectedRequest.uploads)) {
							uploadIds = selectedRequest.uploads
								.map((upload) => (typeof upload === "object" && upload._id ? upload._id : upload))
								.filter((id) => id);
						}

						const payload = {
							user_id: selectedRequest.userId._id || selectedRequest.userId,
							employee_id: user.id || user._id,
							acid: selectedRequest.acidCode,
							shipment_type: selectedRequest.shipmentType || "بحري",
							port_name: formData.portName.trim(),
							country: formData.country.trim(),
							num_of_containers: formData.containerCount || 1,
							type_of_containers: formData.containerTypes,
							status: "في انتظار الشحن",
							policy: formData.billOfLading || "",
							arrivalDate: formData.arrivalDate,
							acid_request_id: selectedRequest._id,
							uploads: uploadIds,
							importerName: selectedRequest.supplier?.name || selectedRequest.userId?.fullname || selectedRequest.userId?.username,
							employerName: user.fullname || user.username,
							shipmentDescription: selectedRequest.goods?.description || "",
							number46: "",
						};

						const response = await axios.post(
							`${import.meta.env.VITE_API_URL}/api/shipments`,
							payload,
							{ headers: { Authorization: `Bearer ${token}` } }
						);

						if (response.data.success) {
							const shipmentId = response.data.data?._id || response.data.data?.id;
							await axios.patch(
								`${import.meta.env.VITE_API_URL}/api/acid/${selectedRequest._id}`,
								{
									hasShipment: true,
									shipmentId: shipmentId,
									shipmentCreatedAt: new Date(),
								},
								{ headers: { Authorization: `Bearer ${token}` } }
							);

							toast.success("تم إنشاء الشحنة بنجاح");
							closeShipmentModal();
							fetchAllRequests();
						}
					} catch (error) {
						console.error("❌ Error creating shipment:", error);
						toast.error(error.response?.data?.message || "فشل إنشاء الشحنة");
					}
				}}
			/>

			{showShipmentDetailsModal && (
				<ShipmentDetailsModal
					shipmentId={selectedRequest?.shipmentId?._id}
					onClose={() => {
						setShowShipmentDetailsModal(false);
						setSelectedRequest(null);
					}}
				/>
			)}

			<AcidConfirmationModal
				show={showConfirmModal}
				confirmData={confirmData}
				acidCodeInput={acidCodeInput}
				onClose={() => {
					setShowConfirmModal(false);
					setAcidCodeInput("");
				}}
				onConfirm={handleIssueAcid}
				onAcidCodeChange={setAcidCodeInput}
			/>
      
      {/* Request Details Modal */}
			<RequestDetailsModal 
				show={showDetailsModal}
				onClose={() => setShowDetailsModal(false)}
				title="تفاصيل طلب ACID"
				data={selectedRequest}
				type="acid"
			>
        {selectedRequest && !selectedRequest.acidCode && selectedRequest.status !== "Rejected" && (
           <button
             onClick={(e) => {
               setShowDetailsModal(false);
               requestIssueConfirmation(selectedRequest._id, e);
             }}
             className="px-5 py-2.5 rounded-xl font-bold bg-[#1ba3b6] text-white hover:bg-[#158a9b] flex items-center gap-2"
           >
             <Anchor size={18} />
              إصدار ACID
           </button>
        )}
      </RequestDetailsModal>
		</div>
	);
};

export default EmployeeAcidRequestsPage;
