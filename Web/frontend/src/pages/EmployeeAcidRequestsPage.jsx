import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WelcomeBanner from "./WelcomeBanner";
import filterListIcon from "../assets/images/filter_list.png";
import filterAltIcon from "../assets/images/filter_alt.png";
import searchIcon from "../assets/images/Search.svg";
import "./EmployeeAcidRequestsPage.css";

const EmployeeAcidRequestsPage = () => {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showShipmentModal, setShowShipmentModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [statusFilter, setStatusFilter] = useState("All");
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [confirmData, setConfirmData] = useState(null);
	const [acidCodeInput, setAcidCodeInput] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [sortOption, setSortOption] = useState("newest");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);

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
	}, []);

	const fetchAllRequests = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("token");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/all`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

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

		try {
			const token = localStorage.getItem("token");

			// Create shipment payload
			const user = JSON.parse(localStorage.getItem("user"));
			const payload = {
				user_id: selectedRequest.userId._id,
				employee_id: user.id, // Assign current employee to shipment
				acid: selectedRequest.acidCode,
				port_name: shipmentData.portName,
				country: shipmentData.country,
				num_of_containers: shipmentData.numContainers,
				type_of_containers: shipmentData.containerTypes,
				status: shipmentData.status,
				policy: shipmentData.policy,
				arrival_date: shipmentData.arrivalDate,
				acid_request_id: selectedRequest._id, // Link to ACID request
				uploads: selectedRequest.uploads || [], // Include uploads from ACID request
				token: token, // Some endpoints might need this
			};

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
			console.error("Error creating shipment:", error);
			toast.error(error.response?.data?.message || "Failed to create shipment");
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

		// Search filter (ACID code, client name, supplier name)
		const searchLower = searchTerm.toLowerCase();
		const matchesSearch =
			searchTerm === "" ||
			req.acidCode?.toLowerCase().includes(searchLower) ||
			req.userId?.username?.toLowerCase().includes(searchLower) ||
			req.userId?.email?.toLowerCase().includes(searchLower) ||
			req.supplier?.name?.toLowerCase().includes(searchLower);

		return matchesStatus && matchesSearch;
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
					<div className="filter-section-enhanced">
						<div className="filter-header">
							<h3 className="filter-title">📊 Filter Requests</h3>
							<p className="filter-subtitle">Quick access by status</p>
						</div>
						<div className="filter-cards">
							<button
								className={`filter-card ${
									statusFilter === "All" ? "active" : ""
								}`}
								onClick={() => setStatusFilter("All")}
							>
								<div className="filter-icon">📋</div>
								<div className="filter-content">
									<span className="filter-count">{requests.length}</span>
									<span className="filter-label">All Requests</span>
								</div>
							</button>
							<button
								className={`filter-card ${
									statusFilter === "Pending" ? "active" : ""
								}`}
								onClick={() => setStatusFilter("Pending")}
							>
								<div className="filter-icon">⏳</div>
								<div className="filter-content">
									<span className="filter-count">
										{requests.filter((r) => r.status === "Pending").length}
									</span>
									<span className="filter-label">Pending</span>
								</div>
							</button>
							<button
								className={`filter-card ${
									statusFilter === "Under Review" ? "active" : ""
								}`}
								onClick={() => setStatusFilter("Under Review")}
							>
								<div className="filter-icon">🔍</div>
								<div className="filter-content">
									<span className="filter-count">
										{requests.filter((r) => r.status === "Under Review").length}
									</span>
									<span className="filter-label">Under Review</span>
								</div>
							</button>
							<button
								className={`filter-card ${
									statusFilter === "ACID Issued" ? "active" : ""
								}`}
								onClick={() => setStatusFilter("ACID Issued")}
							>
								<div className="filter-icon">✅</div>
								<div className="filter-content">
									<span className="filter-count">
										{requests.filter((r) => r.status === "ACID Issued").length}
									</span>
									<span className="filter-label">ACID Issued</span>
								</div>
							</button>
							<button
								className={`filter-card ${
									statusFilter === "Rejected" ? "active" : ""
								}`}
								onClick={() => setStatusFilter("Rejected")}
							>
								<div className="filter-icon">❌</div>
								<div className="filter-content">
									<span className="filter-count">
										{requests.filter((r) => r.status === "Rejected").length}
									</span>
									<span className="filter-label">Rejected</span>
								</div>
							</button>
						</div>
					</div>
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
					{loading ? (
						<div className="flex justify-center items-center py-12 gap-4">
							<div className="spinner"></div>
							<span className="text-gray-600 text-lg">
								جاري تحميل الطلبات...
							</span>
						</div>
					) : (
						<div className="requests-table-container">
							<table className="requests-table">
								<thead>
									<tr>
										<th>Request ID</th>
										<th>Client</th>
										<th>Supplier</th>
										<th>Goods</th>
										<th>Request Date</th>
										<th>Status</th>
										<th>ACID Code</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{filteredRequests.length === 0 ? (
										<tr>
											<td colSpan="8" className="no-data">
												{searchTerm
													? "لا توجد نتائج مطابقة للبحث"
													: "لا توجد طلبات ACID"}
											</td>
										</tr>
									) : (
										filteredRequests.map((request) => (
											<tr key={request._id}>
												<td>{request._id.substring(0, 8)}...</td>
												<td>
													<div className="client-info">
														<strong>{request.userId?.username || "N/A"}</strong>
														<br />
														<small>{request.userId?.email || ""}</small>
													</div>
												</td>
												<td>
													<div className="supplier-info">
														<strong>{request.supplier?.name}</strong>
														<br />
														<small>Tax: {request.supplier?.taxNum}</small>
													</div>
												</td>
												<td>
													<div className="goods-info">
														<strong>{request.goods?.description}</strong>
														<br />
														<small>Weight: {request.goods?.weight}kg</small>
													</div>
												</td>
												<td>
													{new Date(request.requestDate).toLocaleDateString()}
												</td>
												<td>
													<span
														className={`status-badge ${getStatusBadgeClass(
															request.status
														)}`}
													>
														{request.status}
													</span>
												</td>
												<td>
													{request.acidCode ? (
														<div className="acid-code-container">
															<span className="acid-code">
																{request.acidCode}
															</span>
															{request.hasShipment && (
																<span className="shipment-badge">
																	✅ Shipment Created
																</span>
															)}
														</div>
													) : (
														<span className="no-acid">Not Issued</span>
													)}
												</td>
												<td>
													<div className="action-buttons">
														{request.status === "Pending" &&
															!request.isLocked && (
																<>
																	<button
																		className="btn-lock"
																		onClick={() =>
																			handleLockRequest(request._id)
																		}
																		title="Lock request to start review"
																	>
																		🔒 Start Review
																	</button>
																	<button
																		className="btn-reject"
																		onClick={() =>
																			handleStatusChange(
																				request._id,
																				"Rejected"
																			)
																		}
																	>
																		Reject
																	</button>
																</>
															)}
														{request.status === "Under Review" &&
															request.isLocked && (
																<>
																	<button
																		className="btn-approve"
																		onClick={() =>
																			requestIssueConfirmation(request._id)
																		}
																	>
																		Issue ACID
																	</button>
																	<button
																		className="btn-unlock"
																		onClick={() =>
																			handleUnlockRequest(request._id)
																		}
																		title="Unlock request"
																	>
																		🔓 Unlock
																	</button>
																	<button
																		className="btn-reject"
																		onClick={() =>
																			handleStatusChange(
																				request._id,
																				"Rejected"
																			)
																		}
																	>
																		Reject
																	</button>
																</>
															)}
														{request.status === "ACID Issued" &&
															!request.hasShipment && (
																<button
																	className="btn-shipment"
																	onClick={() => openShipmentModal(request)}
																>
																	Create Shipment
																</button>
															)}
														{request.status === "ACID Issued" &&
															request.hasShipment && (
																<div className="shipment-created-info">
																	<span className="shipment-status">
																		🚢 Shipment Created
																	</span>
																	<small className="shipment-date">
																		{new Date(
																			request.shipmentCreatedAt
																		).toLocaleDateString()}
																	</small>
																</div>
															)}
														{request.status === "Rejected" && (
															<span className="rejected-text">Rejected</span>
														)}
														{request.isLocked && (
															<div
																className="lock-indicator"
																title={`Reviewing by ${
																	request.reviewingBy?.username || "Employee"
																}`}
															>
																🔒 Locked
															</div>
														)}
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>

			{/* Shipment Creation Modal */}
			{showShipmentModal && selectedRequest && (
				<div className="modal-overlay" onClick={closeShipmentModal}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h2>Create Shipment</h2>
							<button className="close-btn" onClick={closeShipmentModal}>
								×
							</button>
						</div>

						<div className="modal-body">
							<div className="request-summary">
								<h3>ACID Request Details</h3>
								<p>
									<strong>ACID Code:</strong> {selectedRequest.acidCode}
								</p>
								<p>
									<strong>Client:</strong> {selectedRequest.userId?.username}
								</p>
								<p>
									<strong>Supplier:</strong> {selectedRequest.supplier?.name}
								</p>
								<p>
									<strong>Goods:</strong> {selectedRequest.goods?.description}
								</p>
							</div>

							<form onSubmit={handleShipmentSubmit} className="shipment-form">
								<div className="form-group">
									<label>Port Name *</label>
									<input
										type="text"
										required
										value={shipmentData.portName}
										onChange={(e) =>
											setShipmentData({
												...shipmentData,
												portName: e.target.value,
											})
										}
										placeholder="Enter port name"
									/>
								</div>

								<div className="form-group">
									<label>Country *</label>
									<input
										type="text"
										required
										value={shipmentData.country}
										onChange={(e) =>
											setShipmentData({
												...shipmentData,
												country: e.target.value,
											})
										}
										placeholder="Enter country"
									/>
								</div>

								<div className="form-group">
									<label>Number of Containers *</label>
									<div className="container-controls">
										<button
											type="button"
											onClick={removeContainer}
											disabled={shipmentData.numContainers <= 1}
										>
											-
										</button>
										<span>{shipmentData.numContainers}</span>
										<button type="button" onClick={addContainer}>
											+
										</button>
									</div>
								</div>

								<div className="form-group">
									<label>Container Types *</label>
									{shipmentData.containerTypes.map((type, index) => (
										<select
											key={index}
											value={type}
											onChange={(e) =>
												handleContainerTypeChange(index, e.target.value)
											}
											className="container-type-select"
										>
											<option value="20ft">20ft</option>
											<option value="40ft">40ft</option>
											<option value="45ft">45ft</option>
										</select>
									))}
								</div>

								<div className="form-group">
									<label>Expected Arrival Date *</label>
									<input
										type="date"
										required
										value={shipmentData.arrivalDate}
										onChange={(e) =>
											setShipmentData({
												...shipmentData,
												arrivalDate: e.target.value,
											})
										}
									/>
								</div>

								<div className="form-group">
									<label>Policy (Optional)</label>
									<input
										type="text"
										value={shipmentData.policy}
										onChange={(e) =>
											setShipmentData({
												...shipmentData,
												policy: e.target.value,
											})
										}
										placeholder="Enter policy details"
									/>
								</div>

								<div className="modal-actions">
									<button
										type="button"
										className="btn-cancel"
										onClick={closeShipmentModal}
									>
										Cancel
									</button>
									<button type="submit" className="btn-submit">
										Create Shipment
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Confirmation Modal for ACID Issuance */}
			{showConfirmModal && confirmData && (
				<div
					className="modal-overlay"
					onClick={() => setShowConfirmModal(false)}
				>
					<div
						className="modal-content confirmation-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="modal-header">
							<h2>⚠️ Confirm ACID Issuance</h2>
							<button
								className="close-btn"
								onClick={() => setShowConfirmModal(false)}
							>
								×
							</button>
						</div>

						<div className="modal-body">
							<div className="confirmation-message">
								<p className="warning-text">
									Please review the following data carefully before issuing the
									ACID code. This action cannot be undone.
								</p>
							</div>

							<div className="request-summary confirmation-details">
								<h3>📋 Request Details</h3>

								<div className="detail-section">
									<h4>👤 Client Information</h4>
									<p>
										<strong>Username:</strong>{" "}
										{confirmData.userId?.username || "N/A"}
									</p>
									<p>
										<strong>Email:</strong> {confirmData.userId?.email || "N/A"}
									</p>
								</div>

								<div className="detail-section">
									<h4>🏭 Supplier Information</h4>
									<p>
										<strong>Name:</strong> {confirmData.supplier?.name || "N/A"}
									</p>
									<p>
										<strong>Tax Number:</strong>{" "}
										{confirmData.supplier?.taxNum || "N/A"}
									</p>
									<p>
										<strong>Country:</strong>{" "}
										{confirmData.supplier?.country || "N/A"}
									</p>
									<p>
										<strong>Email:</strong>{" "}
										{confirmData.supplier?.email || "N/A"}
									</p>
									<p>
										<strong>Mobile:</strong>{" "}
										{confirmData.supplier?.mobileNum || "N/A"}
									</p>
								</div>

								<div className="detail-section">
									<h4>📦 Goods Information</h4>
									<p>
										<strong>Description:</strong>{" "}
										{confirmData.goods?.description || "N/A"}
									</p>
									<p>
										<strong>Customs Item:</strong>{" "}
										{confirmData.goods?.customsItem || "N/A"}
									</p>
									<p>
										<strong>Weight:</strong>{" "}
										{confirmData.goods?.weight
											? `${confirmData.goods.weight} kg`
											: "N/A"}
									</p>
								</div>

								<div className="detail-section">
									<h4>📅 Request Information</h4>
									<p>
										<strong>Request Date:</strong>{" "}
										{new Date(confirmData.requestDate).toLocaleString()}
									</p>
									<p>
										<strong>Uploads:</strong> {confirmData.uploads?.length || 0}{" "}
										document(s)
									</p>
								</div>

								{confirmData.uploads && confirmData.uploads.length > 0 && (
									<div className="detail-section">
										<h4>📄 Uploaded Documents</h4>
										<div className="documents-list">
											{confirmData.uploads.map((upload, index) => {
												const documentUrl =
													upload.url || upload.s3Url || upload.presignedUrl;
												return (
													<div
														key={upload._id || index}
														className="document-item"
													>
														<span className="document-name">
															{upload.documentType || "Document"} -{" "}
															{upload.originalname || upload.filename}
														</span>
														<button
															type="button"
															className="btn-view-doc"
															onClick={() => {
																console.log("Upload object:", upload);
																console.log("Document URL:", documentUrl);
																if (documentUrl) {
																	window.open(documentUrl, "_blank");
																} else {
																	toast.error("Document URL not available");
																}
															}}
															disabled={!documentUrl}
														>
															👁️ View
														</button>
													</div>
												);
											})}
										</div>
									</div>
								)}
							</div>

							<div className="acid-code-input">
								<label htmlFor="acidCode">
									<strong>Enter ACID Code:</strong>{" "}
									<span className="required">*</span>
								</label>
								<input
									id="acidCode"
									type="text"
									value={acidCodeInput}
									onChange={(e) => setAcidCodeInput(e.target.value)}
									placeholder="Enter the ACID code"
									className="acid-input-field"
									required
								/>
							</div>

							<div className="modal-actions">
								<button
									type="button"
									className="btn-cancel"
									onClick={() => {
										setShowConfirmModal(false);
										setAcidCodeInput("");
									}}
								>
									Cancel
								</button>
								<button
									type="button"
									className="btn-confirm"
									onClick={handleIssueAcid}
									disabled={!acidCodeInput.trim()}
								>
									✅ Confirm & Issue ACID
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<Footer />
		</div>
	);
};

export default EmployeeAcidRequestsPage;
