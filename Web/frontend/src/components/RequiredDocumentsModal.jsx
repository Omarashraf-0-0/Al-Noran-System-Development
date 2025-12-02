import React, { useState } from "react";

const RequiredDocumentsModal = ({
	isOpen,
	onClose,
	onSave,
	uploading = false,
}) => {
	const [requiredDocuments, setRequiredDocuments] = useState([]);
	const [newDocument, setNewDocument] = useState("");

	const handleAddDocument = () => {
		if (newDocument.trim()) {
			setRequiredDocuments([
				...requiredDocuments,
				{ name: newDocument, uploaded: false },
			]);
			setNewDocument("");
		}
	};

	const handleRemoveDocument = (index) => {
		const updated = requiredDocuments.filter((_, i) => i !== index);
		setRequiredDocuments(updated);
	};

	const handleSave = () => {
		onSave(requiredDocuments);
		setRequiredDocuments([]);
		setNewDocument("");
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<h3 className="text-2xl font-bold text-red-900">
							📄 طلب مستندات من العميل
						</h3>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600 transition"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
					<p className="text-sm text-gray-600 mt-2">
						أضف المستندات التي تحتاجها من العميل. سيتم إرسال إشعار له تلقائياً.
					</p>
				</div>

				<div className="p-6">
					{/* Add Document Input */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2 text-right">
							اسم المستند المطلوب
						</label>
						<div className="flex gap-2">
							<input
								type="text"
								value={newDocument}
								onChange={(e) => setNewDocument(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										handleAddDocument();
									}
								}}
								placeholder="مثال: شهادة المنشأ، الفاتورة التجارية..."
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-right"
								disabled={uploading}
							/>
							<button
								onClick={handleAddDocument}
								disabled={!newDocument.trim() || uploading}
								className="bg-red-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-900 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
							>
								إضافة
							</button>
						</div>
					</div>

					{/* Documents List */}
					{requiredDocuments.length > 0 && (
						<div className="space-y-2 mb-6">
							<p className="text-sm font-medium text-gray-700 text-right mb-3">
								المستندات المطلوبة ({requiredDocuments.length}):
							</p>
							{requiredDocuments.map((doc, index) => (
								<div
									key={index}
									className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
								>
									<div className="flex items-center gap-2">
										<span className="text-gray-600">📄</span>
										<span className="text-gray-800 font-medium">
											{doc.name}
										</span>
									</div>
									<button
										onClick={() => handleRemoveDocument(index)}
										disabled={uploading}
										className="text-red-600 hover:text-red-800 transition disabled:text-gray-400"
									>
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</div>
							))}
						</div>
					)}

					{requiredDocuments.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							<svg
								className="w-16 h-16 mx-auto mb-3 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<p>لم يتم إضافة أي مستندات بعد</p>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
					<button
						onClick={onClose}
						disabled={uploading}
						className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
					>
						إلغاء
					</button>
					<button
						onClick={handleSave}
						disabled={requiredDocuments.length === 0 || uploading}
						className="px-6 py-2 bg-red-800 text-white rounded-lg font-medium hover:bg-red-900 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{uploading ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								<span>جاري الإرسال...</span>
							</>
						) : (
							<>
								<span>إرسال الطلب للعميل</span>
								<span>📤</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default RequiredDocumentsModal;
