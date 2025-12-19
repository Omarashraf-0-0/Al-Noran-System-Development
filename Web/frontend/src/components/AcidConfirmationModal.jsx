import React from "react";
import { toast } from "react-hot-toast";
import axios from "axios";

const AcidConfirmationModal = ({
	show,
	confirmData,
	acidCodeInput,
	onClose,
	onConfirm,
	onAcidCodeChange,
}) => {
	if (!show || !confirmData) return null;

	const handleViewDocument = async (uploadId) => {
		try {
			toast.loading("جاري تحميل المستند...");
			const token = localStorage.getItem("token");

			console.log("📥 Fetching upload with ID:", uploadId);

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${uploadId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			console.log("✅ Upload response:", response.data);

			toast.dismiss();

			// Get presigned URL from response - check all possible locations
			const fileUrl =
				response.data?.presignedUrl ||
				response.data?.upload?.presignedUrl ||
				response.data?.url ||
				response.data?.upload?.url ||
				response.data?.s3Url ||
				response.data?.upload?.s3Url;

			console.log("🔗 File URL:", fileUrl);

			if (fileUrl) {
				window.open(fileUrl, "_blank");
			} else {
				console.error("❌ No URL found in response:", response.data);
				toast.error("لم يتم العثور على رابط الملف");
			}
		} catch (error) {
			console.error("❌ Error downloading document:", error);
			console.error("Error details:", error.response?.data);
			toast.dismiss();
			toast.error(error.response?.data?.message || "فشل تحميل المستند");
		}
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal-content confirmation-modal"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<h2>⚠️ تأكيد إصدار رقم ACID</h2>
					<button className="close-btn" onClick={onClose}>
						×
					</button>
				</div>

				<div className="modal-body">
					<div className="confirmation-message">
						<p className="warning-text">
							يرجى مراجعة البيانات التالية بعناية قبل إصدار رقم ACID. لا يمكن
							التراجع عن هذا الإجراء.
						</p>
					</div>

					<div className="request-summary confirmation-summary">
						<h4>ملخص الطلب</h4>
						<p>
							<strong>العميل:</strong>{" "}
							{confirmData.userId?.username || "غير متوفر"}
						</p>
						<p>
							<strong>المورد:</strong>{" "}
							{confirmData.supplier?.name || "غير متوفر"}
						</p>
						<p>
							<strong>وصف البضاعة:</strong>{" "}
							{confirmData.goods?.description || "غير متوفر"}
						</p>
					</div>

					<div className="request-summary confirmation-details">
						<h3>📋 تفاصيل الطلب</h3>

						<div className="detail-section">
							<h4>👤 بيانات العميل</h4>
							<p>
								<strong>اسم المستخدم:</strong>{" "}
								{confirmData.userId?.username || "غير متوفر"}
							</p>
							<p>
								<strong>البريد الإلكتروني:</strong>{" "}
								{confirmData.userId?.email || "غير متوفر"}
							</p>
							<p>
								<strong>رقم الهاتف:</strong>{" "}
								{confirmData.userId?.phone || "غير متوفر"}
							</p>
						</div>

						<div className="detail-section">
							<h4>🏭 بيانات المورد</h4>
							<p>
								<strong>الاسم:</strong>{" "}
								{confirmData.supplier?.name || "غير متوفر"}
							</p>
							<p>
								<strong>الرقم الضريبي:</strong>{" "}
								{confirmData.supplier?.taxNum || "غير متوفر"}
							</p>
							<p>
								<strong>الدولة:</strong>{" "}
								{confirmData.supplier?.country || "غير متوفر"}
							</p>
							<p>
								<strong>البريد الإلكتروني:</strong>{" "}
								{confirmData.supplier?.email || "غير متوفر"}
							</p>
							<p>
								<strong>رقم الجوال:</strong>{" "}
								{confirmData.supplier?.mobileNum || "غير متوفر"}
							</p>
						</div>

						<div className="detail-section">
							<h4>📦 بيانات البضاعة</h4>
							<p>
								<strong>الوصف:</strong>{" "}
								{confirmData.goods?.description || "غير متوفر"}
							</p>
							<p>
								<strong>بند جمركي:</strong>{" "}
								{confirmData.goods?.customsItem || "غير متوفر"}
							</p>
							<p>
								<strong>الوزن:</strong>{" "}
								{confirmData.goods?.weight
									? `${confirmData.goods.weight} كجم`
									: "غير متوفر"}
							</p>
						</div>

						<div className="detail-section">
							<h4>📅 بيانات الطلب</h4>
							<p>
								<strong>تاريخ الطلب:</strong>{" "}
								{new Date(confirmData.requestDate).toLocaleString("ar-EG")}
							</p>
							<p>
								<strong>المرفقات:</strong> {confirmData.uploads?.length || 0}{" "}
								مستند(ات)
							</p>
						</div>

						{confirmData.uploads && confirmData.uploads.length > 0 && (
							<div className="detail-section">
								<h4>📄 المستندات المرفقة</h4>
								<div className="documents-list">
									{confirmData.uploads.map((upload, index) => {
										const uploadId = upload._id || upload;
										return (
											<div key={uploadId || index} className="document-item">
												<span className="document-name">
													{upload.documentType || "مستند"} -{" "}
													{upload.originalname || upload.filename || "ملف"}
												</span>
												<button
													type="button"
													className="btn-view-doc"
													onClick={() => handleViewDocument(uploadId)}
												>
													👁️ عرض
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
							<strong>أدخل رقم ACID:</strong>{" "}
							<span className="required">*</span>
						</label>
						<input
							id="acidCode"
							type="text"
							value={acidCodeInput}
							onChange={(e) => onAcidCodeChange(e.target.value)}
							placeholder="أدخل رقم ACID"
							className="acid-input-field"
							required
						/>
					</div>

					<div className="modal-actions">
						<button type="button" className="btn-cancel" onClick={onClose}>
							إلغاء
						</button>
						<button
							type="button"
							className="btn-confirm"
							onClick={onConfirm}
							disabled={!acidCodeInput.trim()}
						>
							✅ تأكيد وإصدار
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AcidConfirmationModal;
