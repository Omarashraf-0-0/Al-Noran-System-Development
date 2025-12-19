import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WelcomeBanner from "./WelcomeBanner";
import quickReorderIcon from "../assets/images/quick_reorder.png";
import filterListIcon from "../assets/images/filter_list.png";
import filterAltIcon from "../assets/images/filter_alt.png";
import searchIcon from "../assets/images/Search.svg";
import axios from "axios";
import { toast } from "react-hot-toast";

// Status configurations for export shipments
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

export default function EmployeeExportShipmentsPage() {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [shipments, setShipments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedStatus, setSelectedStatus] = useState("الكل");
	const [sortOption, setSortOption] = useState("newest");

	// Status update modal state
	const [statusModal, setStatusModal] = useState(false);
	const [selectedShipment, setSelectedShipment] = useState(null);
	const [newStatus, setNewStatus] = useState("");
	const [statusNotes, setStatusNotes] = useState("");
	const [processingAction, setProcessingAction] = useState(false);

	const token = localStorage.getItem("token");

	// Available shipment statuses for filter
	const shipmentStatuses = [
		{ value: "الكل", label: "الكل" },
		{ value: "documents_verification", label: "التحقق من المستندات" },
		{ value: "regulatory_inspection", label: "فحص الجهات الرقابية" },
		{ value: "payment_cleared", label: "تم السداد" },
		{ value: "goods_loaded", label: "تم التحميل" },
		{ value: "in_transit", label: "في الطريق" },
		{ value: "delivered", label: "تم التسليم" },
		{ value: "completed", label: "مكتمل" },
		{ value: "cancelled", label: "ملغي" },
	];

	// Fetch all export shipments for employee
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
				`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/all`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				const formattedShipments = (response.data.shipments || []).map((shipment) => ({
					id: shipment._id,
					rawData: shipment,
					userId: shipment.userId?._id,
					clientName: shipment.userId?.fullname || shipment.userId?.name || "عميل غير معروف",
					shipmentNo: shipment.shipmentNumber || `شحنة #${shipment._id.slice(-6)}`,
					ucrNumber: shipment.ucrNumber || shipment.ucrRequestId?.ucrNumber || "—",
					destination: shipment.destinationCountry || "—",
					status: shipment.currentStatus || "documents_verification",
					createdAt: shipment.createdAt,
					date: new Date(shipment.createdAt).toLocaleDateString("ar-EG", {
						day: "numeric",
						month: "long",
						year: "numeric",
					}),
				}));
				setShipments(formattedShipments);

				if (formattedShipments.length === 0) {
					toast("لا توجد شحنات تصديرية");
				}
			}
		} catch (err) {
			console.error("Error fetching export shipments:", err);
			if (err.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else if (err.response?.status === 403) {
				toast.error("غير مصرح لك بالوصول لهذه الصفحة");
				navigate("/");
			} else {
				const errorMessage =
					err.response?.data?.message ||
					err.message ||
					"فشل في جلب الشحنات";
				setError(errorMessage);
				toast.error(errorMessage);
			}
		} finally {
			setLoading(false);
		}
	}, [navigate, token]);

	useEffect(() => {
		fetchShipments();
	}, [fetchShipments]);

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

	// Get status label
	const getStatusLabel = (status) => {
		return STATUS_CONFIG[status]?.label || status;
	};

	// Filter and sort shipments
	let filteredShipments = shipments.filter((shipment) => {
		// Filter by search term (shipment number, client name, UCR, destination)
		const matchesSearch =
			shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.ucrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.destination.toLowerCase().includes(searchTerm.toLowerCase());

		// Filter by status
		const matchesStatus =
			selectedStatus === "الكل" ||
			shipment.status === selectedStatus;

		return matchesSearch && matchesStatus;
	});

	// Sort shipments
	filteredShipments = [...filteredShipments].sort((a, b) => {
		switch (sortOption) {
			case "newest": {
				const dateA = new Date(a.createdAt).getTime();
				const dateB = new Date(b.createdAt).getTime();
				return dateB - dateA;
			}
			case "oldest": {
				const dateA = new Date(a.createdAt).getTime();
				const dateB = new Date(b.createdAt).getTime();
				return dateA - dateB;
			}
			case "clientAZ":
				return a.clientName.localeCompare(b.clientName, "ar");
			case "clientZA":
				return b.clientName.localeCompare(a.clientName, "ar");
			default:
				return 0;
		}
	});

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

	// Open status update modal
	const openStatusModal = (shipment) => {
		setSelectedShipment(shipment);
		setNewStatus(getNextStatus(shipment.status));
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

	// Handle status update
	const handleStatusUpdate = async () => {
		if (!selectedShipment || !newStatus) {
			toast.error("يرجى اختيار الحالة الجديدة");
			return;
		}

		setProcessingAction(true);
		try {
			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${selectedShipment.id}/status`,
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
		} catch (err) {
			console.error("Error updating shipment status:", err);
			toast.error(err.response?.data?.message || "فشل في تحديث الحالة");
		} finally {
			setProcessingAction(false);
		}
	};

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
			<Header />
			<WelcomeBanner />

			<section className="flex-grow w-full bg-white py-12 px-8 shadow-inner relative">
				<div className="max-w-6xl mx-auto">
					<h1 className="text-3xl font-bold text-right text-red-800 mb-8">
						الشحنات التصديرية
					</h1>

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
								placeholder="ابحث برقم الشحنة، اسم العميل، UCR، أو الوجهة"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full bg-white shadow-md rounded-full py-2 px-4 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400 text-black"
							/>
							<img
								src={searchIcon}
								alt="Search"
								className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
							/>
						</div>

						{/* Filter Dropdown */}
						{isFilterOpen && (
							<div className="absolute top-14 left-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
								<h4 className="font-semibold text-red-800 mb-3">
									تصفية حسب الحالة:
								</h4>
								<select
									value={selectedStatus}
									onChange={(e) => setSelectedStatus(e.target.value)}
									className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700"
								>
									{shipmentStatuses.map((status) => (
										<option key={status.value} value={status.value}>
											{status.label}
										</option>
									))}
								</select>
								<button
									onClick={handleFilterApply}
									className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition"
								>
									تطبيق
								</button>
							</div>
						)}

						{/* Sort Dropdown */}
						{isSortOpen && (
							<div className="absolute top-14 left-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
								<h4 className="font-semibold text-red-800 mb-3">ترتيب حسب:</h4>
								<select
									value={sortOption}
									onChange={(e) => setSortOption(e.target.value)}
									className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700"
								>
									<option value="newest">الأحدث أولاً</option>
									<option value="oldest">الأقدم أولاً</option>
									<option value="clientAZ">العميل (أ-ي)</option>
									<option value="clientZA">العميل (ي-أ)</option>
								</select>
								<button
									onClick={handleSortApply}
									className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition"
								>
									تطبيق
								</button>
							</div>
						)}
					</div>

					{/* 📦 Shipments Table */}
					{loading ? (
						<div className="flex justify-center items-center py-12 gap-4">
							<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
							<span className="text-gray-600 text-lg">
								جاري تحميل الشحنات...
							</span>
						</div>
					) : error ? (
						<div className="bg-red-50 border border-red-300 rounded-lg p-4 text-right">
							<p className="text-red-800 font-medium mb-3">
								❌ حدث خطأ: {error}
							</p>
							<button
								onClick={() => fetchShipments()}
								className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-700 transition"
							>
								إعادة محاولة
							</button>
						</div>
					) : filteredShipments.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg">لا توجد شحنات تصديرية</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-right border-separate border-spacing-y-3">
								<thead>
									<tr className="bg-red-800 text-white">
										<th className="py-3 px-4 text-right rounded-tr-lg">العميل / التاريخ</th>
										<th className="py-3 px-4 text-right">رقم الشحنة</th>
										<th className="py-3 px-4 text-right">رقم UCR</th>
										<th className="py-3 px-4 text-right">الوجهة</th>
										<th className="py-3 px-4 text-right">الحالة</th>
										<th className="py-3 px-4 text-right rounded-tl-lg">الإجراءات</th>
									</tr>
								</thead>
								<tbody>
									{filteredShipments.map((shipment) => (
										<tr
											key={shipment.id}
											className="bg-gray-100 hover:bg-gray-200 rounded-xl transition text-right"
										>
											<td className="py-3 px-4 align-top">
												<div className="flex flex-col text-sm">
													<span className="text-gray-700 text-base font-semibold">
														{shipment.userId ? (
															<a 
																href={`/client/${shipment.userId}`}
																className="hover:text-[#1BA3B6] hover:underline"
															>
																{shipment.clientName}
															</a>
														) : shipment.clientName}
													</span>
													<span className="text-gray-500 text-xs">
														{shipment.date}
													</span>
												</div>
											</td>

											<td className="py-3 px-4 align-top">
												<div className="flex flex-col text-sm">
													<span className="font-semibold text-gray-800">
														{shipment.shipmentNo}
													</span>
												</div>
											</td>

											<td className="py-3 px-4 align-top">
												<div className="flex flex-col text-sm">
													<span className="text-blue-600 text-base font-medium">
														{shipment.ucrNumber}
													</span>
												</div>
											</td>

											<td className="py-3 px-4 align-top">
												<div className="flex flex-col text-sm">
													<span className="text-gray-700 text-base">
														{shipment.destination}
													</span>
												</div>
											</td>

											<td className="py-3 px-4 align-top">
												<span
													className="bg-blue-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center justify-center gap-2 w-fit"
													style={{ color: "#690000" }}
												>
													<img
														src={quickReorderIcon}
														alt="status icon"
														className="w-4 h-4"
													/>
													{getStatusLabel(shipment.status)}
												</span>
											</td>

											<td className="py-3 px-4 align-top">
												<div className="flex gap-2">
													<a href={`/employee/export-shipment/${shipment.id}`}>
														<button className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium">
															إدارة الشحنة
														</button>
													</a>
													{!["completed", "cancelled"].includes(shipment.status) && (
														<button
															onClick={() => openStatusModal(shipment)}
															className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
														>
															تحديث الحالة
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>

			{/* Status Update Modal */}
			{statusModal && selectedShipment && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full p-6">
						<h3 className="text-lg font-bold mb-4 text-right">تحديث حالة الشحنة</h3>

						<p className="text-sm text-gray-600 mb-4 text-right">
							الشحنة:{" "}
							<span className="font-medium">
								{selectedShipment.shipmentNo}
							</span>
						</p>

						<div className="mb-4 text-right">
							<p className="text-sm text-gray-600 mb-2">
								الحالة الحالية:{" "}
								<span
									className={`px-2 py-0.5 rounded text-sm ${
										STATUS_CONFIG[selectedShipment.status]?.color
									}`}
								>
									{STATUS_CONFIG[selectedShipment.status]?.icon}{" "}
									{STATUS_CONFIG[selectedShipment.status]?.label}
								</span>
							</p>
						</div>

						<div className="mb-4 text-right">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								الحالة الجديدة *
							</label>
							<select
								value={newStatus}
								onChange={(e) => setNewStatus(e.target.value)}
								className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
							>
								<option value="">اختر الحالة</option>
								{getAvailableStatuses(selectedShipment.status).map(
									(status) => (
										<option key={status} value={status}>
											{STATUS_CONFIG[status]?.icon} {STATUS_CONFIG[status]?.label}
										</option>
									)
								)}
							</select>
						</div>

						<div className="mb-4 text-right">
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
								{processingAction ? "جاري التحديث..." : "تحديث الحالة"}
							</button>
						</div>
					</div>
				</div>
			)}

			<Footer />
		</div>
	);
}
