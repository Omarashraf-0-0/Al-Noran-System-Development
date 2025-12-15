import React from "react";

const ShipmentModal = ({
	show,
	selectedRequest,
	shipmentData,
	onClose,
	onSubmit,
	onDataChange,
	onContainerTypeChange,
	onAddContainer,
	onRemoveContainer,
}) => {
	if (!show || !selectedRequest) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2>Create Shipment</h2>
					<button className="close-btn" onClick={onClose}>
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

					<form onSubmit={onSubmit} className="shipment-form">
						<div className="form-group">
							<label>Port Name *</label>
							<select
								required
								value={shipmentData.portName}
								onChange={(e) =>
									onDataChange({ ...shipmentData, portName: e.target.value })
								}
								className="form-select"
							>
								<option value="">اختر الميناء</option>
								<option value="ميناء الإسكندرية">ميناء الإسكندرية (Port of Alexandria)</option>
								<option value="ميناء الدخيلة">ميناء الدخيلة (El-Dekheila)</option>
								<option value="ميناء دمياط">ميناء دمياط (Port of Damietta)</option>
								<option value="ميناء بورسعيد">ميناء بورسعيد (Port Said)</option>
								<option value="ميناء السويس">ميناء السويس (Port of Suez)</option>
								<option value="ميناء الأدبية">ميناء الأدبية (Port of Adabiya)</option>
								<option value="ميناء العين السخنة">ميناء العين السخنة (Port of Ain Sukhna)</option>
								<option value="ميناء سفاجا">ميناء سفاجا (Port of Safaga)</option>
								<option value="ميناء نويبع">ميناء نويبع (Port of Nuweiba)</option>
							</select>
						</div>

						<div className="form-group">
							<label>Country *</label>
							<input
								type="text"
								required
								value={shipmentData.country}
								onChange={(e) =>
									onDataChange({ ...shipmentData, country: e.target.value })
								}
								placeholder="Enter country"
							/>
						</div>

						<div className="form-group">
							<label>Number of Containers *</label>
							<div className="container-controls">
								<button
									type="button"
									onClick={onRemoveContainer}
									disabled={shipmentData.numContainers <= 1}
								>
									-
								</button>
								<span>{shipmentData.numContainers}</span>
								<button type="button" onClick={onAddContainer}>
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
									onChange={(e) => onContainerTypeChange(index, e.target.value)}
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
									onDataChange({
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
									onDataChange({ ...shipmentData, policy: e.target.value })
								}
								placeholder="Enter policy details"
							/>
						</div>

						<div className="modal-actions">
							<button type="button" className="btn-cancel" onClick={onClose}>
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
	);
};

export default ShipmentModal;
