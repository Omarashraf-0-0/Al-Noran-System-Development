import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WelcomeBanner from "./WelcomeBanner";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import SearchFilterSort from "../components/SearchFilterSort";
import ShipmentsTable from "../components/ShipmentsTable";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ShipmentsList() {
	const [searchTerm, setSearchTerm] = useState("");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [shipments, setShipments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedStatus, setSelectedStatus] = useState("الكل");
	const [sortOption, setSortOption] = useState("newest");

	// TODO: RBAC - Get user permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canViewShipments = hasPermission('shipment:view');
	// const canManageShipments = hasPermission('shipment:manage');

	const user = JSON.parse(localStorage.getItem("user"));
	const userID = user?.id;
	const token = localStorage.getItem("token");

	// Available shipment statuses
	const shipmentStatuses = [
		{ value: "الكل", label: "الكل" },
		{ value: "Pending", label: "قيد الانتظار" },
		{ value: "في انتظار الشحن", label: "في انتظار الشحن" },
		{ value: "In Transit", label: "في الطريق" },
		{ value: "Arrived", label: "تم وصول البضاعة" },
		{ value: "في انتظار وصول الإذن", label: "في انتظار وصول الإذن" },
		{ value: "Customs Clearance", label: "التخليص الجمركي" },
		{ value: "جاري الكشف والتثمين", label: "جاري الكشف والتثمين" },
		{ value: "Completed", label: "مكتملة" },
		{ value: "تمت بنجاح", label: "تمت بنجاح" },
	];

	useEffect(() => {
		const fetchShipments = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!userID) {
					setError("User ID not found. Please login again.");
					toast.error("User ID not found. Please login again.");
					return;
				}

				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/shipments/employee/${userID}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				console.log("Fetched shipments:", response.data);

				const formattedShipments = (response.data || []).map((shipment) => ({
					id: shipment._id,
					clientName: shipment.employerName || "Unknown Client",
					shipmentNo: shipment.number46 || shipment.shipmentNumber || "N/A",
					acid: shipment.acid || "N/A",
					status: shipment.status || "pending",
					createdAt: shipment.createdAt, // Keep raw date for sorting
					date: new Date(shipment.createdAt).toLocaleDateString("ar-EG", {
						day: "numeric",
						month: "long",
						year: "numeric",
					}),
				}));

				setShipments(formattedShipments);

				if (formattedShipments.length === 0) {
					toast("لا توجد شحنات");
				}
			} catch (error) {
				console.error("Error fetching shipments:", error);
				const errorMessage =
					error.response?.data?.message ||
					error.message ||
					"Failed to fetch shipments";
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchShipments();
	}, [userID, token]);

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

	// Normalize status for comparison (handles both English and Arabic)
	const normalizeStatus = (status) => {
		const statusNormalization = {
			Pending: "Pending",
			"قيد الانتظار": "Pending",
			"في انتظار الشحن": "في انتظار الشحن",
			"In Transit": "In Transit",
			"في الطريق": "In Transit",
			Arrived: "Arrived",
			"تم وصول البضاعة": "Arrived",
			"في انتظار وصول الإذن": "في انتظار وصول الإذن",
			"Customs Clearance": "Customs Clearance",
			"التخليص الجمركي": "Customs Clearance",
			"جاري الكشف والتثمين": "جاري الكشف والتثمين",
			Completed: "Completed",
			مكتملة: "Completed",
			"تمت بنجاح": "تمت بنجاح",
		};
		return statusNormalization[status] || status;
	};

	// Filter and sort shipments
	let filteredShipments = shipments.filter((shipment) => {
		// Filter by search term (shipment number, client name, ACID)
		const matchesSearch =
			shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			shipment.acid.toLowerCase().includes(searchTerm.toLowerCase());

		// Filter by status - normalize both the filter and shipment status for comparison
		const matchesStatus =
			selectedStatus === "الكل" ||
			normalizeStatus(shipment.status) === normalizeStatus(selectedStatus);

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

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
			<Header />
			<WelcomeBanner />

			<section className="flex-grow w-full bg-white py-12 px-8 shadow-inner relative">
				<div className="max-w-6xl mx-auto">
					<h1 className="text-3xl font-bold text-right text-red-800 mb-8">
						شحناتي
					</h1>

					{/* 🔍 Search + Filter + Sort */}
					{/* TODO: RBAC - Only show controls if user has permission */}
					<SearchFilterSort
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="ابحث برقم الشحنة، اسم العميل، أو ACID"
						isFilterOpen={isFilterOpen}
						onToggleFilter={toggleFilter}
						filterValue={selectedStatus}
						onFilterChange={setSelectedStatus}
						filterOptions={shipmentStatuses}
						filterLabel="تصفية حسب الحالة:"
						onFilterApply={handleFilterApply}
						isSortOpen={isSortOpen}
						onToggleSort={toggleSort}
						sortValue={sortOption}
						onSortChange={setSortOption}
						onSortApply={handleSortApply}
					/>

					{/* 📦 Shipments Table */}
					{/* TODO: RBAC - Only show shipments if user has permission */}
					{loading ? (
						<LoadingSpinner />
					) : error ? (
						<ErrorMessage
							message={error}
							onRetry={() => window.location.reload()}
							retryText="إعادة محاولة"
						/>
					) : (
						<>
							<ShipmentsTable
								shipments={filteredShipments}
								maxItems={5}
								linkPrefix="/employee-shipment"
							/>

							{/* View All Button */}
							{filteredShipments.length > 5 && (
								<div className="flex justify-center mt-8">
									<a
										href="/employee-shipments"
										className="bg-red-800 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition font-semibold"
									>
										عرض جميع الشحنات ({filteredShipments.length})
									</a>
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
