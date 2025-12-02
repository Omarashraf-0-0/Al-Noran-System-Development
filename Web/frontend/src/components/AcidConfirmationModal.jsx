import React from "react";
import { toast } from "react-hot-toast";

const AcidConfirmationModal = ({
	show,
	confirmData,
	acidCodeInput,
	onClose,
	onConfirm,
	onAcidCodeChange,
}) => {
	if (!show || !confirmData) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal-content confirmation-modal"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<h2>⚠️ Confirm ACID Issuance</h2>
					<button className="close-btn" onClick={onClose}>
						×
					</button>
				</div>

				<div className="modal-body">
					<div className="confirmation-message">
						<p className="warning-text">
							Please review the following data carefully before issuing the ACID
							code. This action cannot be undone.
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
								<strong>Email:</strong> {confirmData.supplier?.email || "N/A"}
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
											<div key={upload._id || index} className="document-item">
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
							onChange={(e) => onAcidCodeChange(e.target.value)}
							placeholder="Enter the ACID code"
							className="acid-input-field"
							required
						/>
					</div>

					<div className="modal-actions">
						<button type="button" className="btn-cancel" onClick={onClose}>
							Cancel
						</button>
						<button
							type="button"
							className="btn-confirm"
							onClick={onConfirm}
							disabled={!acidCodeInput.trim()}
						>
							✅ Confirm & Issue ACID
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AcidConfirmationModal;
