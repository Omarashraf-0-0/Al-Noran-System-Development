import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WelcomeBanner from "./WelcomeBanner";
import LoadingSpinner from "../components/LoadingSpinner";
import FilterStatusCards from "../components/FilterStatusCards";
import AcidRequestsTable from "../components/AcidRequestsTable";
import ShipmentModal from "../components/ShipmentModal";
import ShipmentDetailsModal from "../components/ShipmentDetailsModal";
import AcidConfirmationModal from "../components/AcidConfirmationModal";
import filterListIcon from "../assets/images/filter_list.png";
import filterAltIcon from "../assets/images/filter_alt.png";
import searchIcon from "../assets/images/Search.svg";
import "./EmployeeAcidRequestsPage.css";

const EmployeeAcidRequestsPage = () => {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showShipmentModal, setShowShipmentModal] = useState(false);
	const [showShipmentDetailsModal, setShowShipmentDetailsModal] =
		useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [statusFilter, setStatusFilter] = useState("All");
	const [issuedByMe, setIssuedByMe] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [confirmData, setConfirmData] = useState(null);
	const [acidCodeInput, setAcidCodeInput] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [sortOption, setSortOption] = useState("newest");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);

	// TODO: RBAC - Get user permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canReviewRequests = hasPermission('acid:review');
	// const canIssueAcid = hasPermission('acid:issue');
	// const canCreateShipment = hasPermission('shipment:create');

	// Shipment form data
	const [shipmentData, setShipmentData] = useState({
		portName: "",
		country: "",
		numContainers: 1,
		containerTypes: ["20ft"],
		status: "Pending",
		policy: "",
		arrivalDate: "",
	});

	useEffect(() => {
		fetchAllRequests();
	}, [issuedByMe]);

	const fetchAllRequests = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("token");
			let url = `${import.meta.env.VITE_API_URL}/api/acid/employee/all`;
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
			toast.error(
				error.response?.data?.message || "Failed to fetch ACID requests"
			);
		} finally {
			setLoading(false);
		}
	};

	const handleStatusChange = async (requestId, newStatus, acidCode = null) => {
		try {
			const token = localStorage.getItem("token");
			const payload = { status: newStatus };

			// Add ACID code if issuing ACID
			if (newStatus === "ACID Issued" && acidCode) {
				payload.acidCode = acidCode;
			}

			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${requestId}/status`,
				payload,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("ACID request status updated successfully");
				fetchAllRequests();
			}
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error(error.response?.data?.message || "Failed to update status");
		}
	};

	// Lock request for review
	const handleLockRequest = async (requestId) => {
		try {
			const token = localStorage.getItem("token");
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${requestId}/lock`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("Request locked for review");
				fetchAllRequests();
			}
		} catch (error) {
			console.error("Error locking request:", error);
			if (error.response?.status === 423) {
				toast.error(error.response.data.message);
			} else {
				toast.error(error.response?.data?.message || "Failed to lock request");
			}
		}
	};

	// Unlock request
	const handleUnlockRequest = async (requestId) => {
		try {
			const token = localStorage.getItem("token");
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${requestId}/unlock`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("Request unlocked");
				fetchAllRequests();
			}
		} catch (error) {
			console.error("Error unlocking request:", error);
			toast.error(error.response?.data?.message || "Failed to unlock request");
		}
	};

	// Step 1: Request confirmation with data preview
	const requestIssueConfirmation = async (requestId) => {
		try {
			const token = localStorage.getItem("token");
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${requestId}/issue`,
				{ confirmed: false },
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.needsConfirmation) {
				setConfirmData(response.data.request);
				setShowConfirmModal(true);
			}
		} catch (error) {
			console.error("Error requesting confirmation:", error);
			toast.error(
				error.response?.data?.message || "Failed to get request data"
			);
		}
	};

	// Step 2: Confirm and issue ACID
	const handleIssueAcid = async () => {
		if (!acidCodeInput || acidCodeInput.trim() === "") {
			toast.error("ACID Code is required");
			return;
		}

		try {
			const token = localStorage.getItem("token");
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/${
					confirmData.id
				}/issue`,
				{
					confirmed: true,
					acidCode: acidCodeInput,
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("ACID issued successfully!");
				setShowConfirmModal(false);
				setConfirmData(null);
				setAcidCodeInput("");
				fetchAllRequests();
			}
		} catch (error) {
			console.error("Error issuing ACID:", error);
			toast.error(error.response?.data?.message || "Failed to issue ACID");
		}
	};

	const handleShowShipmentDetails = (request) => {
		setSelectedRequest(request);
		setShowShipmentDetailsModal(true);
	};

	const openShipmentModal = (request) => {
		if (!request.acidCode) {
			toast.error("ACID Code must be issued before creating shipment");
			return;
		}
		setSelectedRequest(request);
		setShipmentData({
			portName: "",
			country: request.supplier?.country || "",
			numContainers: 1,
			containerTypes: ["20ft"],
			status: "Pending",
			policy: "",
			arrivalDate: "",
		});
		setShowShipmentModal(true);
	};

	const closeShipmentModal = () => {
		setShowShipmentModal(false);
		setSelectedRequest(null);
		setShipmentData({
			portName: "",
			country: "",
			numContainers: 1,
			containerTypes: ["20ft"],
			status: "Pending",
			policy: "",
			arrivalDate: "",
		});
	};

	const handleShipmentSubmit = async (e) => {
		e.preventDefault();

		if (!selectedRequest) return;

		// Validate required fields
		if (
			!shipmentData.portName ||
			!shipmentData.country ||
			!shipmentData.arrivalDate
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		try {
			const token = localStorage.getItem("token");

			// Create shipment payload
			const user = JSON.parse(localStorage.getItem("user"));

			// Extract upload IDs if uploads is an array of objects
			let uploadIds = [];
			if (selectedRequest.uploads && Array.isArray(selectedRequest.uploads)) {
				uploadIds = selectedRequest.uploads
					.map((upload) => {
						// If upload is an object with _id, extract it
						if (typeof upload === "object" && upload._id) {
							return upload._id;
						}
						// Otherwise, assume it's already an ID
						return upload;
					})
					.filter((id) => id); // Remove nulls/undefined
			}

			const payload = {
				user_id: selectedRequest.userId._id || selectedRequest.userId,
				employee_id: user.id || user._id, // Assign current employee to shipment
				acid: selectedRequest.acidCode,
				shipment_type: selectedRequest.shipmentType || "بحري", // نقل نوع الشحنة من ACID request
				port_name: shipmentData.portName.trim(),
				country: shipmentData.country.trim(),
				num_of_containers: parseInt(shipmentData.numContainers) || 1,
				type_of_containers: shipmentData.containerTypes.filter((t) => t), // Remove empty values
				status: shipmentData.status || "Pending",
				policy: shipmentData.policy || "",
				arrivalDate: shipmentData.arrivalDate, // Keep as arrivalDate for backend
				acid_request_id: selectedRequest._id, // Link to ACID request
				uploads: uploadIds, // Send only IDs
				token: token, // Some endpoints might need this
				// Add missing fields from ACID request
				importerName:
					selectedRequest.supplier?.name ||
					selectedRequest.userId?.fullname ||
					selectedRequest.userId?.username,
				employerName: user.fullname || user.username,
				shipmentDescription: selectedRequest.goods?.description || "",
				number46: "", // سيتم إضافته لاحقاً من قبل الموظف
			};

			console.log("📦 Submitting shipment payload:", payload);

			// Create shipment via shipment endpoint
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/shipments`,
				payload,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				// Mark ACID request as having a shipment
				try {
					console.log("Shipment creation response:", response.data);
					const shipmentId = response.data.data?._id || response.data.data?.id;
					console.log("Extracted shipment ID:", shipmentId);

					if (!shipmentId) {
						console.error("No shipment ID in response:", response.data);
						throw new Error("Shipment created but ID not found in response");
					}

					const updatePayload = {
						hasShipment: true,
						shipmentId: shipmentId,
						shipmentCreatedAt: new Date(),
					};
					console.log("Updating ACID request with payload:", updatePayload);

					await axios.patch(
						`${import.meta.env.VITE_API_URL}/api/acid/${selectedRequest._id}`,
						updatePayload,
						{
							headers: { Authorization: `Bearer ${token}` },
						}
					);

					toast.success("Shipment created successfully");
					closeShipmentModal();
					// Refresh the requests list to show updated status
					await fetchAllRequests();
				} catch (updateError) {
					console.error("Error updating ACID request:", updateError);
					toast.error("Shipment created but failed to update ACID request");
					closeShipmentModal();
					await fetchAllRequests();
				}
			}
		} catch (error) {
			console.error("❌ Error creating shipment:", error);
			console.error("Error response:", error.response?.data);

			const errorMessage =
				error.response?.data?.message ||
				error.response?.data?.error ||
				error.message ||
				"Failed to create shipment";

			toast.error(errorMessage);
		}
	};

	const handleContainerTypeChange = (index, value) => {
		const newTypes = [...shipmentData.containerTypes];
		newTypes[index] = value;
		setShipmentData({ ...shipmentData, containerTypes: newTypes });
	};

	const addContainer = () => {
		setShipmentData({
			...shipmentData,
			numContainers: shipmentData.numContainers + 1,
			containerTypes: [...shipmentData.containerTypes, "20ft"],
		});
	};

	const removeContainer = () => {
		if (shipmentData.numContainers > 1) {
			const newTypes = [...shipmentData.containerTypes];
			newTypes.pop();
			setShipmentData({
				...shipmentData,
				numContainers: shipmentData.numContainers - 1,
				containerTypes: newTypes,
			});
		}
	};

	const getStatusBadgeClass = (status) => {
		switch (status) {
			case "Pending":
				return "badge-pending";
			case "Under Review":
				return "badge-under-review";
			case "ACID Issued":
				return "badge-issued";
			case "Rejected":
				return "badge-rejected";
			default:
				return "";
		}
	};

	// Toggle functions for dropdowns
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

	// Filter and search
	let filteredRequests = requests.filter((req) => {
		// Status filter
		const matchesStatus = statusFilter === "All" || req.status === statusFilter;

		// Filter by issued by me (only show ACID requests I issued)
		const user = JSON.parse(localStorage.getItem("user"));
		const currentUserId = user.id || user._id;
		const matchesIssuedByMe =
			!issuedByMe ||
			req.issuedBy?._id === currentUserId ||
			req.issuedBy === currentUserId;

		// Search filter (ACID code, client name, supplier name)
		const searchLower = searchTerm.toLowerCase();
		const matchesSearch =
			searchTerm === "" ||
			req.acidCode?.toLowerCase().includes(searchLower) ||
			req.userId?.username?.toLowerCase().includes(searchLower) ||
			req.userId?.email?.toLowerCase().includes(searchLower) ||
			req.supplier?.name?.toLowerCase().includes(searchLower);

		return matchesStatus && matchesSearch && matchesIssuedByMe;
	});

	// Sort requests
	filteredRequests = [...filteredRequests].sort((a, b) => {
		switch (sortOption) {
			case "newest": {
				const dateA = new Date(a.requestDate || a.createdAt).getTime();
				const dateB = new Date(b.requestDate || b.createdAt).getTime();
				return dateB - dateA;
			}
			case "oldest": {
				const dateA = new Date(a.requestDate || a.createdAt).getTime();
				const dateB = new Date(b.requestDate || b.createdAt).getTime();
				return dateA - dateB;
			}
			case "clientAZ":
				return (a.userId?.username || "").localeCompare(
					b.userId?.username || "",
					"ar"
				);
			case "clientZA":
				return (b.userId?.username || "").localeCompare(
					a.userId?.username || "",
					"ar"
				);
			default:
				return 0;
		}
	});

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans">
			<Header />
			<WelcomeBanner />

			<section className="flex-grow w-full bg-white py-12 px-8 shadow-inner">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-3xl font-bold text-right text-red-800 mb-2">
						إدارة طلبات ACID
					</h1>
					<p className="text-right text-gray-600 mb-8">
						مراجعة وإدارة جميع طلبات ACID من العملاء
					</p>
					{/* Filter Section */}
					{/* TODO: RBAC - Only show filters if user has permission */}
					<FilterStatusCards
						requests={requests}
						statusFilter={statusFilter}
						onFilterChange={setStatusFilter}
					/>
					{/* Search + Filter + Sort Controls */}
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
								placeholder="ابحث بواسطة كود ACID، اسم العميل، أو اسم المورد"
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
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700"
								>
									<option value="All">الكل</option>
									<option value="Pending">قيد الانتظار</option>
									<option value="Under Review">قيد المراجعة</option>
									<option value="ACID Issued">تم الإصدار</option>
									<option value="Rejected">مرفوض</option>
								</select>

								<div className="mb-3 border-t pt-3">
									<label className="flex items-center gap-2 cursor-pointer justify-end">
										<span className="text-gray-700 text-sm">
											طلبات قمت بإصدارها
										</span>
										<input
											type="checkbox"
											checked={issuedByMe}
											onChange={(e) => setIssuedByMe(e.target.checked)}
											className="form-checkbox h-4 w-4 text-red-800"
										/>
									</label>
								</div>

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
					</div>{" "}
					{/* Requests Table */}
					{/* TODO: RBAC - Check permissions for table actions */}
					{loading ? (
						<LoadingSpinner />
					) : (
						<AcidRequestsTable
							requests={filteredRequests}
							onLockRequest={handleLockRequest}
							onUnlockRequest={handleUnlockRequest}
							onIssueAcid={requestIssueConfirmation}
							onReject={(requestId) =>
								handleStatusChange(requestId, "Rejected")
							}
							onCreateShipment={openShipmentModal}
							onShowShipmentDetails={handleShowShipmentDetails}
							getStatusBadgeClass={getStatusBadgeClass}
						/>
					)}
				</div>
			</section>

			{/* Shipment Creation Modal */}
			{/* TODO: RBAC - Check permission for shipment creation */}
			<ShipmentModal
				show={showShipmentModal}
				selectedRequest={selectedRequest}
				shipmentData={shipmentData}
				onClose={closeShipmentModal}
				onSubmit={handleShipmentSubmit}
				onDataChange={setShipmentData}
				onContainerTypeChange={handleContainerTypeChange}
				onAddContainer={addContainer}
				onRemoveContainer={removeContainer}
			/>

			{/* Shipment Details Modal */}
			{showShipmentDetailsModal && (
				<ShipmentDetailsModal
					shipmentId={selectedRequest?.shipmentId?._id}
					onClose={() => {
						setShowShipmentDetailsModal(false);
						setSelectedRequest(null);
					}}
				/>
			)}

			{/* Confirmation Modal for ACID Issuance */}
			{/* TODO: RBAC - Check permission for ACID issuance */}
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

			<Footer />
		</div>
	);
};

export default EmployeeAcidRequestsPage;
