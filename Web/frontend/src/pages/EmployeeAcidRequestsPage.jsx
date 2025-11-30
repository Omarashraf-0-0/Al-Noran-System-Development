import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./EmployeeAcidRequestsPage.css";

const EmployeeAcidRequestsPage = () => {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showShipmentModal, setShowShipmentModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [statusFilter, setStatusFilter] = useState("All");

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
				"http://localhost:3500/api/acid/employee/all",
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
				`http://localhost:3500/api/acid/employee/${requestId}/status`,
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

	const handleIssueAcid = async (requestId) => {
		const acidCode = prompt("Enter ACID Code:");
		if (!acidCode) {
			toast.error("ACID Code is required");
			return;
		}

		await handleStatusChange(requestId, "ACID Issued", acidCode);
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
				"http://localhost:3500/api/shipments",
				payload,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				// Delete the ACID request after shipment is created
				await axios.delete(
					`http://localhost:3500/api/acid/${selectedRequest._id}`,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				toast.success("Shipment created successfully");
				closeShipmentModal();
				fetchAllRequests();
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
			case "ACID Issued":
				return "badge-issued";
			case "Rejected":
				return "badge-rejected";
			default:
				return "";
		}
	};

	const filteredRequests = requests.filter(
		(req) => statusFilter === "All" || req.status === statusFilter
	);

	return (
		<div className="employee-acid-page">
			<Header />
			<div className="employee-acid-container">
				<h1>ACID Request Management</h1>
				<p className="subtitle">Review and manage all client ACID requests</p>

				{/* Filter Section */}
				<div className="filter-section">
					<label>Filter by Status:</label>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="All">All</option>
						<option value="Pending">Pending</option>
						<option value="ACID Issued">ACID Issued</option>
						<option value="Rejected">Rejected</option>
					</select>
				</div>

				{/* Requests Table */}
				{loading ? (
					<div className="loading">Loading ACID requests...</div>
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
											No ACID requests found
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
													<span className="acid-code">{request.acidCode}</span>
												) : (
													<span className="no-acid">Not Issued</span>
												)}
											</td>
											<td>
												<div className="action-buttons">
													{request.status === "Pending" && (
														<>
															<button
																className="btn-approve"
																onClick={() => handleIssueAcid(request._id)}
															>
																Issue ACID
															</button>
															<button
																className="btn-reject"
																onClick={() =>
																	handleStatusChange(request._id, "Rejected")
																}
															>
																Reject
															</button>
														</>
													)}
													{request.status === "ACID Issued" && (
														<button
															className="btn-shipment"
															onClick={() => openShipmentModal(request)}
														>
															Create Shipment
														</button>
													)}
													{request.status === "Rejected" && (
														<span className="rejected-text">Rejected</span>
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
									<label>Status</label>
									<select
										value={shipmentData.status}
										onChange={(e) =>
											setShipmentData({
												...shipmentData,
												status: e.target.value,
											})
										}
									>
										<option value="Pending">Pending</option>
										<option value="In Transit">In Transit</option>
										<option value="Arrived">Arrived</option>
										<option value="Customs Clearance">Customs Clearance</option>
										<option value="Completed">Completed</option>
									</select>
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

			<Footer />
		</div>
	);
};

export default EmployeeAcidRequestsPage;
