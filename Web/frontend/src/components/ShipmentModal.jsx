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
		<div className="modal-overlay" onClick={onClose} dir="rtl">
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2>إنشاء شحنة</h2>
					<button className="close-btn" onClick={onClose}>
						×
					</button>
				</div>

				<div className="modal-body">
					<div className="request-summary">
						<h3>تفاصيل طلب ACID</h3>
						<p>
							<strong>كود ACID:</strong> {selectedRequest.acidCode}
						</p>
						<p>
							<strong>العميل:</strong> {selectedRequest.userId?.username}
						</p>
						<p>
							<strong>المورد:</strong> {selectedRequest.supplier?.name}
						</p>
						<p>
							<strong>البضائع:</strong> {selectedRequest.goods?.description}
						</p>
					</div>

					<form onSubmit={onSubmit} className="shipment-form">
						<div className="form-group">
							<label>اسم الميناء *</label>
							<select
								required
								value={shipmentData.portName}
								onChange={(e) =>
									onDataChange({ ...shipmentData, portName: e.target.value })
								}
								className="form-select"
							>
								<option value="">اختر الميناء</option>
								<option value="ميناء الإسكندرية">ميناء الإسكندرية</option>
								<option value="ميناء الدخيلة">ميناء الدخيلة</option>
								<option value="ميناء دمياط">ميناء دمياط</option>
								<option value="ميناء بورسعيد">ميناء بورسعيد</option>
								<option value="ميناء السويس">ميناء السويس</option>
								<option value="ميناء الأدبية">ميناء الأدبية</option>
								<option value="ميناء العين السخنة">ميناء العين السخنة</option>
								<option value="ميناء سفاجا">ميناء سفاجا</option>
								<option value="ميناء نويبع">ميناء نويبع</option>
							</select>
						</div>

						<div className="form-group">
							<label>الدولة *</label>
							<input
								type="text"
								required
								value={shipmentData.country}
								onChange={(e) =>
									onDataChange({ ...shipmentData, country: e.target.value })
								}
								placeholder="أدخل اسم الدولة"
							/>
						</div>

						<div className="form-group">
							<label>عدد الحاويات *</label>
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
							<label>أنواع الحاويات *</label>
							{shipmentData.containerTypes.map((type, index) => (
								<select
									key={index}
									value={type}
									onChange={(e) => onContainerTypeChange(index, e.target.value)}
									className="container-type-select"
								>
									<option value="20ft">20 قدم</option>
									<option value="40ft">40 قدم</option>
									<option value="45ft">45 قدم</option>
								</select>
							))}
						</div>

						<div className="form-group">
							<label>تاريخ الوصول المتوقع *</label>
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
							<label>البوليصة (اختياري)</label>
							<input
								type="text"
								value={shipmentData.policy}
								onChange={(e) =>
									onDataChange({ ...shipmentData, policy: e.target.value })
								}
								placeholder="أدخل تفاصيل البوليصة"
							/>
						</div>

						<div className="modal-actions">
							<button type="button" className="btn-cancel" onClick={onClose}>
								إلغاء
							</button>
							<button type="submit" className="btn-submit">
								إنشاء الشحنة
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default ShipmentModal;
