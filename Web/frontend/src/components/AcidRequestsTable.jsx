import React from "react";
import { useNavigate } from "react-router-dom";

const AcidRequestsTable = ({
	requests,
	onLockRequest,
	onUnlockRequest,
	onIssueAcid,
	onReject,
	onCreateShipment,
	onShowShipmentDetails,
	getStatusBadgeClass,
}) => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const currentUserId = user.id || user._id;
	const navigate = useNavigate();

	return (
		<div className="requests-table-container">
			<table className="requests-table">
				<thead>
					<tr>
						<th>رقم الطلب</th>
						<th>العميل</th>
						<th>المورد</th>
						<th>البضائع</th>
						<th>نوع الشحنة</th>
						<th>تاريخ الطلب</th>
						<th>الحالة</th>
						<th>كود ACID</th>
						<th>الإجراءات</th>
					</tr>
				</thead>
				<tbody>
					{requests.length === 0 ? (
						<tr>
							<td colSpan="9" className="no-data">
								لا توجد نتائج مطابقة للبحث
							</td>
						</tr>
					) : (
						requests.map((request) => (
							<tr key={request._id}>
								<td>{request._id.substring(0, 8)}...</td>
								<td>
									<div className="client-info">
										<strong>{request.userId?.username || "غير محدد"}</strong>
										<br />
										<small>{request.userId?.email || ""}</small>
										<br />
										<small className="text-gray-500" dir="ltr">{request.userId?.phone || ""}</small>
									</div>
								</td>
								<td>
									<div className="supplier-info">
										<strong>{request.supplier?.name}</strong>
										<br />
										<small>الرقم الضريبي: {request.supplier?.taxNum}</small>
									</div>
								</td>
								<td>
									<div className="goods-info">
										<strong>{request.goods?.description}</strong>
										<br />
										<small>الوزن: {request.goods?.weight} كجم</small>
									</div>
								</td>
								<td>
									<span className="shipment-type-badge">
										{request.shipmentType === "جوي" ||
										request.shipmentType === "air"
											? "✈️ جوي"
											: "🚢 بحري"}
									</span>
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
													✅ تم إنشاء الشحنة
												</span>
											)}
										</div>
									) : (
										<span className="no-acid">لم يصدر بعد</span>
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
													title="قفل الطلب لبدء المراجعة"
												>
													🔒 بدء المراجعة
												</button>
												<button
													className="btn-reject"
													onClick={() => onReject(request._id)}
												>
													رفض
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
													إصدار ACID
												</button>
												<button
													className="btn-unlock"
													onClick={() => onUnlockRequest(request._id)}
													title="إلغاء القفل"
												>
													🔓 إلغاء القفل
												</button>
												<button
													className="btn-reject"
													onClick={() => onReject(request._id)}
												>
													رفض
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
													إنشاء شحنة
												</button>
											)}
										{request.status === "ACID Issued" &&
											request.hasShipment && (
												<div className="shipment-created-info">
													<span className="shipment-status">
														🚢 تم إنشاء الشحنة
													</span>
													<small className="shipment-date">
														{new Date(
															request.shipmentCreatedAt
														).toLocaleDateString("ar-EG")}
													</small>
													<div
														style={{
															display: "flex",
															gap: "4px",
															flexDirection: "column",
															marginTop: "5px",
														}}
													>
														{request.shipmentId && (
															<button
																className="btn-view-shipment-status"
																onClick={() => {
																	const shipmentId =
																		request.shipmentId?._id ||
																		request.shipmentId;
																	if (shipmentId) {
																		// Employees go to employee-shipment management page
																		const userType =
																			user?.type || user?.userType;
																		if (userType === "employee") {
																			navigate(
																				`/employee-shipment/${shipmentId}`
																			);
																		} else {
																			navigate(`/shipmentstatus/${shipmentId}`);
																		}
																	} else {
																		navigate(
																			`/shipmentstatus/${request.acidCode}`
																		);
																	}
																}}
																style={{
																	padding: "4px 8px",
																	fontSize: "0.75rem",
																	backgroundColor: "#059669",
																	color: "white",
																	border: "none",
																	borderRadius: "4px",
																	cursor: "pointer",
																	width: "100%",
																}}
															>
																🔍 إدارة الشحنة
															</button>
														)}
													</div>
												</div>
											)}
										{request.status === "Rejected" && (
											<span className="rejected-text">مرفوض</span>
										)}
										{request.isLocked && (
											<div
												className="lock-indicator"
												title={`قيد المراجعة بواسطة ${
													request.reviewingBy?.username || "موظف"
												}`}
											>
												🔒 مقفول ({request.reviewingBy?._id === currentUserId ? 'بواسطتي' : request.reviewingBy?.username || 'موظف'})
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
