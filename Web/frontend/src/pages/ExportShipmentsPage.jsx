import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import LoadingSpinner from "../components/LoadingSpinner";

// Status configurations for export shipments
const STATUS_CONFIG = {
	pending_ucr: {
		label: "في انتظار UCR",
		color: "bg-gray-100 text-gray-800 border-gray-200",
		icon: "⏳",
		step: 1,
	},
	documents_submitted: {
		label: "المستندات مرفوعة",
		color: "bg-blue-100 text-blue-800 border-blue-200",
		icon: "📄",
		step: 2,
	},
	documents_verified: {
		label: "المستندات موثقة",
		color: "bg-indigo-100 text-indigo-800 border-indigo-200",
		icon: "✅",
		step: 3,
	},
	regulatory_check: {
		label: "الفحص التنظيمي",
		color: "bg-purple-100 text-purple-800 border-purple-200",
		icon: "🔍",
		step: 4,
	},
	customs_clearance: {
		label: "التخليص الجمركي",
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		icon: "🏛️",
		step: 5,
	},
	ready_to_ship: {
		label: "جاهز للشحن",
		color: "bg-cyan-100 text-cyan-800 border-cyan-200",
		icon: "📦",
		step: 6,
	},
	shipped: {
		label: "تم الشحن",
		color: "bg-green-100 text-green-800 border-green-200",
		icon: "🚀",
		step: 7,
	},
	completed: {
		label: "مكتمل",
		color: "bg-green-200 text-green-900 border-green-300",
		icon: "✨",
		step: 8,
	},
	on_hold: {
		label: "معلق",
		color: "bg-orange-100 text-orange-800 border-orange-200",
		icon: "⚠️",
		step: 0,
	},
	cancelled: {
		label: "ملغي",
		color: "bg-red-100 text-red-800 border-red-200",
		icon: "❌",
		step: -1,
	},
};

const ExportShipmentsPage = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [shipments, setShipments] = useState([]);
	const [filteredShipments, setFilteredShipments] = useState([]);
	const [statusFilter, setStatusFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("newest");

	// Fetch export shipments
	const fetchShipments = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
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
				setShipments(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching export shipments:", error);
			if (error.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else {
				toast.error("فشل في جلب الشحنات");
			}
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	useEffect(() => {
		fetchShipments();
	}, [fetchShipments]);

	// Filter and sort shipments
	useEffect(() => {
		let result = [...shipments];

		// Apply status filter
		if (statusFilter !== "all") {
			result = result.filter((shipment) => shipment.currentStatus === statusFilter);
		}

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(shipment) =>
					shipment.exportShipmentNumber?.toLowerCase().includes(query) ||
					shipment.destinationCountry?.toLowerCase().includes(query) ||
					shipment.destinationPort?.toLowerCase().includes(query) ||
					shipment.ucrRequestId?.ucrNumber?.toLowerCase().includes(query)
			);
		}

		// Apply sorting
		result.sort((a, b) => {
			if (sortBy === "newest") {
				return new Date(b.createdAt) - new Date(a.createdAt);
			} else if (sortBy === "oldest") {
				return new Date(a.createdAt) - new Date(b.createdAt);
			}
			return 0;
		});

		setFilteredShipments(result);
	}, [shipments, statusFilter, searchQuery, sortBy]);

	// Format date
	const formatDate = (dateStr) => {
		if (!dateStr) return "—";
		return new Date(dateStr).toLocaleDateString("ar-EG", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Get status count
	const getStatusCount = (status) => {
		if (status === "all") return shipments.length;
		return shipments.filter((s) => s.currentStatus === status).length;
	};

	// Get active shipments (not completed or cancelled)
	const activeShipments = shipments.filter(
		(s) => !["completed", "cancelled"].includes(s.currentStatus)
	);

	return (
		<div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
			<Header />

			<BackgroundContainer>
				<FormContainer title="شحناتي التصديرية">
					{/* Header Section */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
						<div className="flex items-center gap-3">
							<span className="text-3xl">📦</span>
							<div>
								<p className="text-gray-600">
									تتبع شحنات التصدير الخاصة بك
								</p>
								<p className="text-sm text-gray-500">
									{activeShipments.length} شحنة نشطة من أصل {shipments.length}
								</p>
							</div>
						</div>
					</div>

					{/* Quick Stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
						<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
							<div className="flex items-center gap-2">
								<span className="text-2xl">📄</span>
								<div>
									<p className="text-xs text-blue-600">قيد المعالجة</p>
									<p className="text-xl font-bold text-blue-800">
										{getStatusCount("documents_submitted") +
											getStatusCount("documents_verified")}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
							<div className="flex items-center gap-2">
								<span className="text-2xl">🏛️</span>
								<div>
									<p className="text-xs text-yellow-600">التخليص الجمركي</p>
									<p className="text-xl font-bold text-yellow-800">
										{getStatusCount("customs_clearance")}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
							<div className="flex items-center gap-2">
								<span className="text-2xl">📦</span>
								<div>
									<p className="text-xs text-cyan-600">جاهز للشحن</p>
									<p className="text-xl font-bold text-cyan-800">
										{getStatusCount("ready_to_ship")}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-green-50 p-4 rounded-lg border border-green-200">
							<div className="flex items-center gap-2">
								<span className="text-2xl">✨</span>
								<div>
									<p className="text-xs text-green-600">مكتمل</p>
									<p className="text-xl font-bold text-green-800">
										{getStatusCount("completed")}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Filters */}
					<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* Search */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									بحث
								</label>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="رقم الشحنة، الوجهة..."
									className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
								/>
							</div>

							{/* Status Filter */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									الحالة
								</label>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
								>
									<option value="all">الكل ({getStatusCount("all")})</option>
									{Object.entries(STATUS_CONFIG).map(([key, config]) => (
										<option key={key} value={key}>
											{config.icon} {config.label} ({getStatusCount(key)})
										</option>
									))}
								</select>
							</div>

							{/* Sort */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									ترتيب حسب
								</label>
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
								>
									<option value="newest">الأحدث أولاً</option>
									<option value="oldest">الأقدم أولاً</option>
								</select>
							</div>
						</div>
					</div>

					{/* Shipments List */}
					{loading ? (
						<div className="flex justify-center items-center py-12">
							<LoadingSpinner />
						</div>
					) : filteredShipments.length === 0 ? (
						<div className="text-center py-12">
							<span className="text-5xl mb-4 block">📭</span>
							<p className="text-gray-600 mb-4">
								{shipments.length === 0
									? "لا توجد شحنات تصديرية بعد"
									: "لا توجد شحنات تطابق معايير البحث"}
							</p>
							{shipments.length === 0 && (
								<p className="text-sm text-gray-500">
									ستظهر الشحنات هنا بعد الموافقة على طلبات UCR الخاصة بك
								</p>
							)}
						</div>
					) : (
						<div className="space-y-4">
							{filteredShipments.map((shipment) => {
								const statusConfig =
									STATUS_CONFIG[shipment.currentStatus] || STATUS_CONFIG.pending_ucr;

								return (
									<div
										key={shipment._id}
										className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
									>
										<div className="p-4">
											{/* Header */}
											<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
												<div className="flex items-center gap-3">
													<span className="text-xl">
														{shipment.exportType === "air" ? "✈️" : "🚢"}
													</span>
													<div>
														<h3 className="font-bold text-gray-800">
															{shipment.exportShipmentNumber ||
																`شحنة #${shipment._id.slice(-6)}`}
														</h3>
														<p className="text-sm text-gray-500">
															{formatDate(shipment.createdAt)}
														</p>
													</div>
												</div>
												<span
													className={`px-3 py-1 text-sm rounded-full border ${statusConfig.color}`}
												>
													{statusConfig.icon} {statusConfig.label}
												</span>
											</div>

											{/* Progress Bar */}
											<div className="mb-4">
												<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
													<div
														className="h-full bg-gradient-to-l from-green-500 to-green-400 transition-all duration-500"
														style={{
															width: `${Math.max(
																(statusConfig.step / 8) * 100,
																5
															)}%`,
														}}
													/>
												</div>
												<div className="flex justify-between text-xs text-gray-500 mt-1">
													<span>بداية</span>
													<span>{Math.round((statusConfig.step / 8) * 100)}%</span>
													<span>مكتمل</span>
												</div>
											</div>

											{/* Details */}
											<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
												<div>
													<p className="text-xs text-gray-500">الوجهة</p>
													<p className="font-medium">
														{shipment.destinationCountry || "—"}
													</p>
												</div>
												<div>
													<p className="text-xs text-gray-500">الميناء/المطار</p>
													<p className="font-medium">
														{shipment.destinationPort || "—"}
													</p>
												</div>
												<div>
													<p className="text-xs text-gray-500">رقم UCR</p>
													<p className="font-medium text-blue-600">
														{shipment.ucrRequestId?.ucrNumber || "—"}
													</p>
												</div>
												<div>
													<p className="text-xs text-gray-500">شهادة المنشأ</p>
													<p className="font-medium">
														{shipment.certificateOfOrigin?.issued ? (
															<span className="text-green-600">✅ صادرة</span>
														) : shipment.certificateOfOrigin?.applied ? (
															<span className="text-yellow-600">⏳ قيد التطبيق</span>
														) : (
															<span className="text-gray-400">لم تُطبق</span>
														)}
													</p>
												</div>
											</div>

											{/* Sea Shipment Container Info */}
											{shipment.exportType === "sea" &&
												shipment.containerDetails && (
													<div className="bg-blue-50 p-2 rounded mb-3 text-sm">
														<span className="text-blue-700">
															🚢 {shipment.containerDetails.count || 0} حاوية
															{shipment.containerDetails.type &&
																` - ${shipment.containerDetails.type}`}
														</span>
													</div>
												)}

											{/* Actions */}
											<div className="flex justify-end gap-2 border-t pt-3">
												<button
													onClick={() =>
														navigate(`/export-shipment/${shipment._id}`)
													}
													className="px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded transition-colors"
												>
													عرض التفاصيل
												</button>
												{shipment.ucrRequestId?._id && (
													<button
														onClick={() =>
															navigate(`/ucr-request/${shipment.ucrRequestId._id}`)
														}
														className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
													>
														عرض UCR
													</button>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</FormContainer>
			</BackgroundContainer>

			<Footer />
		</div>
	);
};

export default ExportShipmentsPage;
