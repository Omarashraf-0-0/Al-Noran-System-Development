import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WelcomeBanner from "./WelcomeBanner";
import quickReorderIcon from "../assets/images/quick_reorder.png";
import filterListIcon from "../assets/images/filter_list.png";
import filterAltIcon from "../assets/images/filter_alt.png";
import searchIcon from "../assets/images/Search.svg";

// Status configurations
const STATUS_CONFIG = {
	pending: {
		label: "قيد المراجعة",
		color: "bg-yellow-200",
		textColor: "#856404",
	},
	under_review: {
		label: "قيد التدقيق",
		color: "bg-blue-200",
		textColor: "#0c5460",
	},
	approved: {
		label: "معتمد",
		color: "bg-green-200",
		textColor: "#155724",
	},
	rejected: {
		label: "مرفوض",
		color: "bg-red-200",
		textColor: "#721c24",
	},
	needs_revision: {
		label: "يحتاج تعديل",
		color: "bg-orange-200",
		textColor: "#856404",
	},
	ucr_issued: {
		label: "تم إصدار UCR",
		color: "bg-indigo-200",
		textColor: "#3730a3",
	},
	completed: {
		label: "مكتمل",
		color: "bg-green-300",
		textColor: "#155724",
	},
};

const UCRRequestsPage = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [requests, setRequests] = useState([]);
	const [filteredRequests, setFilteredRequests] = useState([]);
	const [statusFilter, setStatusFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("newest");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [error, setError] = useState(null);

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

	// Fetch UCR requests
	const fetchRequests = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				toast.error("يجب تسجيل الدخول أولاً");
				navigate("/login");
				return;
			}

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/ucr`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setRequests(response.data.data || []);
			}
		} catch (error) {
			console.error("Error fetching UCR requests:", error);
			const errorMessage = error.response?.data?.message || "فشل في جلب الطلبات";
			setError(errorMessage);
			if (error.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else {
				toast.error(errorMessage);
			}
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	useEffect(() => {
		fetchRequests();
	}, [fetchRequests]);

	// Filter and sort requests
	useEffect(() => {
		let result = [...requests];

		// Apply status filter
		if (statusFilter !== "all") {
			result = result.filter((req) => req.status === statusFilter);
		}

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(req) =>
					req.ucrNumber?.toLowerCase().includes(query) ||
					req.generalDescription?.toLowerCase().includes(query) ||
					req.destinationCountry?.toLowerCase().includes(query)
			);
		}

		// Apply sorting
		result.sort((a, b) => {
			if (sortBy === "newest") {
				return new Date(b.createdAt) - new Date(a.createdAt);
			} else if (sortBy === "oldest") {
				return new Date(a.createdAt) - new Date(b.createdAt);
			} else if (sortBy === "value_high") {
				return (b.valueInEGP || 0) - (a.valueInEGP || 0);
			} else if (sortBy === "value_low") {
				return (a.valueInEGP || 0) - (b.valueInEGP || 0);
			}
			return 0;
		});

		setFilteredRequests(result);
	}, [requests, statusFilter, searchQuery, sortBy]);

	// Toggle filter dropdown
	const toggleFilter = () => {
		setIsFilterOpen(!isFilterOpen);
		setIsSortOpen(false);
	};

	// Toggle sort dropdown
	const toggleSort = () => {
		setIsSortOpen(!isSortOpen);
		setIsFilterOpen(false);
	};

	// Format date
	const formatDate = (dateStr) => {
		if (!dateStr) return "—";
		return new Date(dateStr).toLocaleDateString("ar-EG", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Format currency
	const formatCurrency = (value) => {
		if (!value) return "—";
		return new Intl.NumberFormat("ar-EG", {
			style: "currency",
			currency: "EGP",
			maximumFractionDigits: 0,
		}).format(value);
	};

	// Get status style
	const getStatusStyle = (status) => {
		const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
		return {
			className: config.color,
			color: config.textColor,
		};
	};

	// Handle delete request
	const handleDelete = async (requestId) => {
		if (!window.confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;

		try {
			const token = localStorage.getItem("token");
			const response = await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/ucr/${requestId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("تم حذف الطلب بنجاح");
				fetchRequests();
			}
		} catch (error) {
			console.error("Error deleting request:", error);
			toast.error(error.response?.data?.message || "فشل في حذف الطلب");
		}
	};

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
			<Header />
			<WelcomeBanner />

			<section className="flex-grow w-full bg-white py-12 px-8 shadow-inner relative">
				<div className="max-w-6xl mx-auto">
					{/* Header with Add Button */}
					<div className="flex items-center justify-between mb-8">
						<h1 className="text-3xl font-bold text-right text-red-800">
							طلباتي UCR
						</h1>
						<button
							onClick={() => navigate("/ucr-request")}
							className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
						>
							<span className="text-xl">+</span>
							طلب جديد
						</button>
					</div>

					{/* 🔍 Search + Filter + Sort */}
					<div className="flex items-center justify-center mb-8 gap-4 relative">
						{/* Left side — Filter + Sort */}
						<div className="flex items-center gap-3">
							{/* Filter Button */}
							<button
								onClick={toggleFilter}
								className={`flex items-center gap-2 font-medium transition-colors ${
									isFilterOpen
										? "bg-red-800 text-white px-3 py-1 rounded-md"
										: "text-red-800"
								}`}
							>
								<img
									src={filterAltIcon}
									alt="Filter"
									className="w-5 h-5 object-contain"
								/>
								تصفية
							</button>

							{/* Sort Button */}
							<button
								onClick={toggleSort}
								className={`flex items-center gap-2 font-medium transition-colors ${
									isSortOpen
										? "bg-red-800 text-white px-3 py-1 rounded-md"
										: "text-red-800"
								}`}
							>
								<img
									src={filterListIcon}
									alt="Sort"
									className="w-5 h-5 object-contain"
								/>
								ترتيب
							</button>
						</div>

						{/* Search Bar */}
						<div className="relative w-1/2">
							<input
								type="text"
								placeholder="ابحث برقم الطلب أو UCR أو الوجهة..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full bg-white shadow-md rounded-full py-2 px-4 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400 text-black"
							/>
							<img
								src={searchIcon}
								alt="Search"
								className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
							/>
						</div>

						{/* 🧩 Filter Dropdown */}
						{isFilterOpen && (
							<div className="absolute top-14 left-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
								<h4 className="font-semibold text-red-800 mb-3">
									تصفية حسب الحالة:
								</h4>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700"
								>
									{statusOptions.map((status) => (
										<option key={status.value} value={status.value}>
											{status.label}
										</option>
									))}
								</select>
								<button
									onClick={() => setIsFilterOpen(false)}
									className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition"
								>
									تطبيق
								</button>
							</div>
						)}

						{/* 🧩 Sort Dropdown */}
						{isSortOpen && (
							<div className="absolute top-14 left-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
								<h4 className="font-semibold text-red-800 mb-3">ترتيب حسب:</h4>
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700"
								>
									<option value="newest">الأحدث أولاً</option>
									<option value="oldest">الأقدم أولاً</option>
									<option value="value_high">القيمة الأعلى</option>
									<option value="value_low">القيمة الأقل</option>
								</select>
								<button
									onClick={() => setIsSortOpen(false)}
									className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition"
								>
									تطبيق
								</button>
							</div>
						)}
					</div>

					{/* 📋 Requests Table */}
					{loading ? (
						<div className="flex justify-center items-center py-12 gap-4">
							<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
							<span className="text-gray-600 text-lg">جاري تحميل الطلبات...</span>
						</div>
					) : error ? (
						<div className="bg-red-50 border border-red-300 rounded-lg p-4 text-right">
							<p className="text-red-800 font-medium mb-3">❌ حدث خطأ: {error}</p>
							<button
								onClick={() => window.location.reload()}
								className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-700 transition"
							>
								إعادة محاولة
							</button>
						</div>
					) : filteredRequests.length === 0 ? (
						<div className="text-center py-12">
							<span className="text-5xl mb-4 block">📭</span>
							<p className="text-gray-500 text-lg mb-4">
								{requests.length === 0
									? "لا توجد طلبات UCR بعد"
									: "لا توجد طلبات تطابق معايير البحث"}
							</p>
							{requests.length === 0 && (
								<button
									onClick={() => navigate("/ucr-request")}
									className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
								>
									إنشاء أول طلب UCR
								</button>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-right border-separate border-spacing-y-3">
								<tbody>
									{filteredRequests.map((request) => {
										const statusStyle = getStatusStyle(request.status);
										return (
											<tr
												key={request._id}
												className="bg-gray-100 hover:bg-gray-200 rounded-xl transition text-right"
											>
												<td className="py-3 px-4 align-top">
													<div className="flex flex-col text-sm">
														<span className="text-gray-700 text-base font-semibold">
															{request.ucrNumber || `طلب #${request._id?.slice(-6)}`}
														</span>
														<span className="text-gray-500 text-xs">
															{formatDate(request.createdAt)}
														</span>
													</div>
												</td>

												<td className="py-3 px-4 align-top">
													<div className="flex flex-col text-sm">
														<span className="text-gray-700 text-base font-semibold flex items-center gap-1">
															{request.shippingMethod === "air" ? "✈️" : "🚢"}
															{request.destinationCountry || "غير محدد"}
														</span>
														{request.destinationPort && (
															<span className="text-gray-500 text-xs">
																{request.destinationPort}
															</span>
														)}
													</div>
												</td>

												<td className="py-3 px-4 align-top">
													<span className="text-gray-600 text-sm">
														{formatCurrency(request.valueInEGP)}
													</span>
												</td>

												<td className="py-3 px-4 align-top">
													<span
														className={`${statusStyle.className} text-xs font-semibold px-3 py-1 rounded-full flex items-center justify-center gap-2 w-fit`}
														style={{ color: statusStyle.color }}
													>
														<img
															src={quickReorderIcon}
															alt="status icon"
															className="w-4 h-4"
														/>
														{STATUS_CONFIG[request.status]?.label || request.status}
													</span>
												</td>

												<td className="py-3 px-4 align-top">
													<div className="flex items-center gap-2">
														<button
															onClick={() => navigate(`/ucr-request/${request._id}`)}
															className="text-blue-600 text-sm font-medium underline cursor-pointer hover:text-blue-800"
														>
															عرض التفاصيل
														</button>
														{request.status === "pending" && (
															<>
																<span className="text-gray-300">|</span>
																<button
																	onClick={() => navigate(`/ucr-request/${request._id}/edit`)}
																	className="text-yellow-600 text-sm font-medium underline cursor-pointer hover:text-yellow-800"
																>
																	تعديل
																</button>
																<span className="text-gray-300">|</span>
																<button
																	onClick={() => handleDelete(request._id)}
																	className="text-red-600 text-sm font-medium underline cursor-pointer hover:text-red-800"
																>
																	حذف
																</button>
															</>
														)}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
};

export default UCRRequestsPage;
