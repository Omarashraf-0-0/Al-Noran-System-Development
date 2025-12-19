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

export default function ExportShipmentsPage() {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [shipments, setShipments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedStatus, setSelectedStatus] = useState("الكل");
	const [sortOption, setSortOption] = useState("newest");

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

	// Fetch export shipments for client
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
					shipmentNo: shipment.shipmentNumber || `شحنة #${shipment._id.slice(-6)}`,
					ucrNumber: shipment.ucrNumber || shipment.ucrRequestId?.ucrNumber || "—",
					destination: shipment.destinationCountry || "—",
					port: shipment.destinationPort || "—",
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
		// Filter by search term (shipment number, UCR, destination)
		const matchesSearch =
			shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
			default:
				return 0;
		}
	});

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
			<Header />
			<WelcomeBanner />

			<section className="flex-grow w-full bg-white py-12 px-8 shadow-inner relative">
				<div className="max-w-6xl mx-auto">
					<h1 className="text-3xl font-bold text-right text-red-800 mb-8">
						شحناتي التصديرية
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
								placeholder="ابحث برقم الشحنة، UCR، أو الوجهة"
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

						{/* 🧩 Filter Dropdown */}
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

						{/* 🧩 Sort Dropdown */}
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
										<th className="py-3 px-4 text-right rounded-tr-lg">التاريخ</th>
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
													{shipment.port !== "—" && (
														<span className="text-gray-500 text-xs">
															{shipment.port}
														</span>
													)}
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
												<a href={`/export-shipment/${shipment.id}`}>
													<button className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium">
														عرض التفاصيل
													</button>
												</a>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
