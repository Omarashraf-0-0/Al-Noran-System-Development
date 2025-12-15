import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import LoadingSpinner from "../components/LoadingSpinner";

// Status configurations for export shipments (matching backend model)
const STATUS_CONFIG = {
	documents_verification: {
		label: "التحقق من المستندات",
		color: "bg-blue-100 text-blue-800 border-blue-200",
		icon: "📄",
		step: 1,
	},
	regulatory_inspection: {
		label: "فحص الجهات الرقابية",
		color: "bg-purple-100 text-purple-800 border-purple-200",
		icon: "🔍",
		step: 2,
	},
	payment_cleared: {
		label: "تم السداد",
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		icon: "💰",
		step: 3,
	},
	goods_loaded: {
		label: "تم التحميل",
		color: "bg-cyan-100 text-cyan-800 border-cyan-200",
		icon: "📦",
		step: 4,
	},
	in_transit: {
		label: "في الطريق",
		color: "bg-indigo-100 text-indigo-800 border-indigo-200",
		icon: "🚢",
		step: 5,
	},
	delivered: {
		label: "تم التسليم",
		color: "bg-green-100 text-green-800 border-green-200",
		icon: "✅",
		step: 6,
	},
	completed: {
		label: "مكتمل",
		color: "bg-green-200 text-green-900 border-green-300",
		icon: "✨",
		step: 7,
	},
	cancelled: {
		label: "ملغي",
		color: "bg-red-100 text-red-800 border-red-200",
		icon: "❌",
		step: -1,
	},
};

const STATUS_FLOW = [
	"documents_verification",
	"regulatory_inspection",
	"payment_cleared",
	"goods_loaded",
	"in_transit",
	"delivered",
	"completed",
];

const EmployeeExportShipmentsPage = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [shipments, setShipments] = useState([]);
	const [filteredShipments, setFilteredShipments] = useState([]);
	const [statusFilter, setStatusFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("newest");
	const [selectedShipment, setSelectedShipment] = useState(null);
	const [statusModal, setStatusModal] = useState(false);
	const [newStatus, setNewStatus] = useState("");
	const [statusNotes, setStatusNotes] = useState("");
	const [processingAction, setProcessingAction] = useState(false);

	// Fetch all export shipments for employee
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
				`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/all`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setShipments(response.data.shipments || []);
			}
		} catch (error) {
			console.error("Error fetching export shipments:", error);
			if (error.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else if (error.response?.status === 403) {
				toast.error("غير مصرح لك بالوصول لهذه الصفحة");
				navigate("/");
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
			result = result.filter((s) => s.currentStatus === statusFilter);
		}

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(s) =>
					s.shipmentNumber?.toLowerCase().includes(query) ||
					s.destinationCountry?.toLowerCase().includes(query) ||
					s.destinationPort?.toLowerCase().includes(query) ||
					s.userId?.fullname?.toLowerCase().includes(query) ||
					s.userId?.name?.toLowerCase().includes(query) ||
					s.ucrRequestId?.ucrNumber?.toLowerCase().includes(query)
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

	// Format currency
	const formatCurrency = (value) => {
		if (!value) return "—";
		return new Intl.NumberFormat("ar-EG", {
			style: "currency",
			currency: "EGP",
		}).format(value);
	};

	// Get status count
	const getStatusCount = (status) => {
		if (status === "all") return shipments.length;
		return shipments.filter((s) => s.currentStatus === status).length;
	};

	// Open status update modal
	const openStatusModal = (shipment) => {
		setSelectedShipment(shipment);
		setNewStatus(getNextStatus(shipment.currentStatus));
		setStatusNotes("");
		setStatusModal(true);
	};

	// Close status modal
	const closeStatusModal = () => {
		setStatusModal(false);
		setSelectedShipment(null);
		setNewStatus("");
		setStatusNotes("");
	};

	// Get next status in flow
	const getNextStatus = (currentStatus) => {
		const currentIndex = STATUS_FLOW.indexOf(currentStatus);
		if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
			return STATUS_FLOW[currentIndex + 1];
		}
		return currentStatus;
	};

	// Get available statuses for update
	const getAvailableStatuses = (currentStatus) => {
		const currentIndex = STATUS_FLOW.indexOf(currentStatus);
		// Allow moving forward or to cancelled
		const available = [];

		// Add forward statuses
		if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
			available.push(...STATUS_FLOW.slice(currentIndex + 1));
		}

		// Always allow cancelled
		if (currentStatus !== "cancelled") {
			available.push("cancelled");
		}

		return available;
	};

	// Handle status update
	const handleStatusUpdate = async () => {
		if (!selectedShipment || !newStatus) {
			toast.error("يرجى اختيار الحالة الجديدة");
			return;
		}

		setProcessingAction(true);
		try {
			const token = localStorage.getItem("token");
			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${selectedShipment._id}/status`,
				{
					status: newStatus,
					notes: statusNotes,
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("تم تحديث حالة الشحنة بنجاح");
				closeStatusModal();
				fetchShipments();
			}
		} catch (error) {
			console.error("Error updating shipment status:", error);
			toast.error(error.response?.data?.message || "فشل في تحديث الحالة");
		} finally {
			setProcessingAction(false);
		}
	};

	// Get progress percentage (7 steps total)
	const getProgress = (status) => {
		const config = STATUS_CONFIG[status];
		if (!config || config.step <= 0) return 0;
		return Math.round((config.step / 7) * 100);
	};

	return (
		<div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
			<Header />

			<BackgroundContainer>
				<FormContainer title="إدارة الشحنات التصديرية">
					{/* Header */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
						<div className="flex items-center gap-3">
							<span className="text-3xl">📦</span>
							<div>
								<p className="text-gray-600">متابعة وتحديث حالة الشحنات التصديرية</p>
								<p className="text-sm text-gray-500">
									{shipments.filter((s) => !["completed", "cancelled"].includes(s.currentStatus)).length} شحنة نشطة
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
									<p className="text-xs text-blue-600">التحقق من المستندات</p>
									<p className="text-xl font-bold text-blue-800">
										{getStatusCount("documents_verification") +
											getStatusCount("regulatory_inspection")}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
							<div className="flex items-center gap-2">
								<span className="text-2xl">💰</span>
								<div>
									<p className="text-xs text-yellow-600">في انتظار السداد</p>
									<p className="text-xl font-bold text-yellow-800">
										{getStatusCount("payment_cleared")}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
							<div className="flex items-center gap-2">
								<span className="text-2xl">🚢</span>
								<div>
									<p className="text-xs text-cyan-600">في الطريق</p>
									<p className="text-xl font-bold text-cyan-800">
										{getStatusCount("goods_loaded") + getStatusCount("in_transit")}
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
										{getStatusCount("delivered") + getStatusCount("completed")}
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
									placeholder="رقم الشحنة، العميل، الوجهة..."
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
							<p className="text-gray-600">
								{shipments.length === 0
									? "لا توجد شحنات تصديرية"
									: "لا توجد شحنات تطابق معايير البحث"}
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{filteredShipments.map((shipment) => {
								const statusConfig =
									STATUS_CONFIG[shipment.currentStatus] || STATUS_CONFIG.documents_verification;
								const progress = getProgress(shipment.currentStatus);

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
														{shipment.shippingMethod === "air" ? "✈️" : "🚢"}
													</span>
													<div>
														<h3 className="font-bold text-gray-800">
															{shipment.shipmentNumber ||
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

											{/* Client Info */}
											<div className="bg-gray-50 p-2 rounded mb-3">
												<p className="text-sm">
													<span className="text-gray-500">العميل:</span>{" "}
													<span className="font-medium">
														{shipment.userId?.fullname || shipment.userId?.name || "—"}
													</span>
													<span className="text-gray-400 mx-2">|</span>
													<span className="text-gray-500">UCR:</span>{" "}
													<span className="font-medium text-blue-600">
														{shipment.ucrNumber || shipment.ucrRequestId?.ucrNumber || "—"}
													</span>
												</p>
											</div>

											{/* Progress Bar */}
											<div className="mb-3">
												<div className="flex justify-between text-xs text-gray-500 mb-1">
													<span>التقدم</span>
													<span>{progress}%</span>
												</div>
												<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
													<div
														className="h-full bg-gradient-to-l from-green-500 to-green-400 transition-all duration-500"
														style={{ width: `${progress}%` }}
													/>
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
													<p className="text-xs text-gray-500">القيمة</p>
													<p className="font-medium">
														{formatCurrency(shipment.valueInEGP || shipment.ucrRequestId?.valueInEGP)}
													</p>
												</div>
												<div>
													<p className="text-xs text-gray-500">شهادة المنشأ</p>
													<p className="font-medium">
														{shipment.certificateOfOriginStatus === "issued" ? (
															<span className="text-green-600">✅ صادرة</span>
														) : shipment.certificateOfOriginStatus === "pending" ? (
															<span className="text-yellow-600">⏳ قيد الإصدار</span>
														) : shipment.certificateOfOriginStatus === "not_required" ? (
															<span className="text-gray-400">غير مطلوبة</span>
														) : (
															<span className="text-gray-400">—</span>
														)}
													</p>
												</div>
											</div>

											{/* Actions */}
											<div className="flex flex-wrap justify-end gap-2 border-t pt-3">
												<button
													onClick={() =>
														navigate(`/employee/export-shipment/${shipment._id}`)
													}
													className="px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded transition-colors"
												>
													عرض التفاصيل
												</button>
												{shipment.ucrRequestId?._id && (
													<button
														onClick={() =>
															navigate(`/employee/ucr-request/${shipment.ucrRequestId._id}`)
														}
														className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
													>
														عرض UCR
													</button>
												)}
												{!["completed", "cancelled"].includes(
													shipment.currentStatus
												) && (
													<button
														onClick={() => openStatusModal(shipment)}
														className="px-3 py-1.5 text-sm bg-red-700 text-white hover:bg-red-800 rounded transition-colors"
													>
														تحديث الحالة
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

			{/* Status Update Modal */}
			{statusModal && selectedShipment && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full p-6">
						<h3 className="text-lg font-bold mb-4">تحديث حالة الشحنة</h3>

						<p className="text-sm text-gray-600 mb-4">
							الشحنة:{" "}
							<span className="font-medium">
								{selectedShipment.shipmentNumber ||
									selectedShipment._id.slice(-8)}
							</span>
						</p>

						<div className="mb-4">
							<p className="text-sm text-gray-600 mb-2">
								الحالة الحالية:{" "}
								<span
									className={`px-2 py-0.5 rounded text-sm ${
										STATUS_CONFIG[selectedShipment.currentStatus]?.color
									}`}
								>
									{STATUS_CONFIG[selectedShipment.currentStatus]?.icon}{" "}
									{STATUS_CONFIG[selectedShipment.currentStatus]?.label}
								</span>
							</p>
						</div>

						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								الحالة الجديدة *
							</label>
							<select
								value={newStatus}
								onChange={(e) => setNewStatus(e.target.value)}
								className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
							>
								<option value="">اختر الحالة</option>
								{getAvailableStatuses(selectedShipment.currentStatus).map(
									(status) => (
										<option key={status} value={status}>
											{STATUS_CONFIG[status]?.icon} {STATUS_CONFIG[status]?.label}
										</option>
									)
								)}
							</select>
						</div>

						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								ملاحظات
							</label>
							<textarea
								value={statusNotes}
								onChange={(e) => setStatusNotes(e.target.value)}
								rows={3}
								className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
								placeholder="أضف أي ملاحظات حول هذا التحديث..."
							/>
						</div>

						<div className="flex justify-end gap-2">
							<button
								onClick={closeStatusModal}
								disabled={processingAction}
								className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								إلغاء
							</button>
							<button
								onClick={handleStatusUpdate}
								disabled={processingAction || !newStatus}
								className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
							>
								{processingAction ? (
									<span className="flex items-center gap-2">
										<LoadingSpinner size="small" />
										جاري التحديث...
									</span>
								) : (
									"تحديث الحالة"
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			<Footer />
		</div>
	);
};

export default EmployeeExportShipmentsPage;
