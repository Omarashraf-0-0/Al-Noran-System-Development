import React from "react";

/**
 * RequestDocumentsModal - Modal for requesting documents from client
 *
 * TODO: RBAC - This component should check permissions:
 * - canRequestDocuments: Allow requesting documents from client
 */
const RequestDocumentsModal = ({
	isOpen,
	onClose,
	newDocument,
	onNewDocumentChange,
	requiredDocuments,
	onAddDocument,
	onRemoveDocument,
	onSave,
	uploading,
}) => {
	if (!isOpen) return null;

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			onAddDocument();
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-2xl font-bold text-gray-800">
						📄 طلب مستندات من العميل
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>

				<p className="text-gray-600 mb-6">
					أضف المستندات المطلوبة من العميل. سيتم إرسال إشعار له بالمستندات التي
					يجب رفعها.
				</p>

				{/* Add Document Input */}
				<div className="flex gap-2 mb-4">
					<input
						type="text"
						value={newDocument}
						onChange={(e) => onNewDocumentChange(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="اسم المستند المطلوب (مثال: شهادة منشأ)"
						className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
					/>
					<button
						onClick={onAddDocument}
						className="px-6 py-2 bg-red-800 text-white rounded-lg font-medium hover:bg-red-900 transition"
					>
						إضافة
					</button>
				</div>

				{/* Document List */}
				<div className="space-y-2 mb-6">
					{requiredDocuments.length === 0 ? (
						<div className="text-center py-8 bg-gray-50 rounded-lg">
							<p className="text-gray-500">لم يتم إضافة مستندات بعد</p>
						</div>
					) : (
						requiredDocuments.map((doc, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
							>
								<div className="flex items-center gap-2">
									<span className="text-red-800">📄</span>
									<span className="text-gray-800 font-medium">{doc.name}</span>
								</div>
								<button
									onClick={() => onRemoveDocument(index)}
									className="text-red-600 hover:text-red-800"
								>
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clipRule="evenodd"
										/>
									</svg>
								</button>
							</div>
						))
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
					>
						إلغاء
					</button>
					<button
						onClick={onSave}
						disabled={requiredDocuments.length === 0 || uploading}
						className="flex-1 px-4 py-3 bg-red-800 text-white rounded-lg font-bold hover:bg-red-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{uploading ? "جاري الإرسال..." : "إرسال الطلب للعميل"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default RequestDocumentsModal;
