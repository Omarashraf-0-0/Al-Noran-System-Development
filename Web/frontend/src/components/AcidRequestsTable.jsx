import React from "react";

const AcidRequestsTable = ({
	requests,
	onLockRequest,
	onUnlockRequest,
	onIssueAcid,
	onReject,
	onCreateShipment,
	getStatusBadgeClass,
}) => {
	return (
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
					{requests.length === 0 ? (
						<tr>
							<td colSpan="8" className="no-data">
								لا توجد نتائج مطابقة للبحث
							</td>
						</tr>
					) : (
						requests.map((request) => (
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
								<td>{new Date(request.requestDate).toLocaleDateString()}</td>
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
											<span className="acid-code">{request.acidCode}</span>
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
										{/* TODO: RBAC - Check permission for locking requests */}
										{request.status === "Pending" && !request.isLocked && (
											<>
												<button
													className="btn-lock"
													onClick={() => onLockRequest(request._id)}
													title="Lock request to start review"
												>
													🔒 Start Review
												</button>
												<button
													className="btn-reject"
													onClick={() => onReject(request._id)}
												>
													Reject
												</button>
											</>
										)}
										{/* TODO: RBAC - Check permission for issuing ACID */}
										{request.status === "Under Review" && request.isLocked && (
											<>
												<button
													className="btn-approve"
													onClick={() => onIssueAcid(request._id)}
												>
													Issue ACID
												</button>
												<button
													className="btn-unlock"
													onClick={() => onUnlockRequest(request._id)}
													title="Unlock request"
												>
													🔓 Unlock
												</button>
												<button
													className="btn-reject"
													onClick={() => onReject(request._id)}
												>
													Reject
												</button>
											</>
										)}
										{/* TODO: RBAC - Check permission for creating shipments */}
										{request.status === "ACID Issued" &&
											!request.hasShipment && (
												<button
													className="btn-shipment"
													onClick={() => onCreateShipment(request)}
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
	);
};

export default AcidRequestsTable;
