import React from "react";

/**
 * EmployeeUploadSection - Upload form and documents list for employee
 *
 * TODO: RBAC - This component should check permissions:
 * - canUploadDocuments: Allow uploading documents
 * - canDownloadDocuments: Allow downloading documents
 */
const EmployeeUploadSection = ({
	showUploadForm,
	onToggleUploadForm,
	documentName,
	onDocumentNameChange,
	selectedFile,
	onFileSelect,
	onUpload,
	uploadingFile,
	requiredDocuments,
	onDownloadDocument,
}) => {
	return (
		<div className="mt-12 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-red-900 flex items-center gap-2">
					<span>📤</span>
					<span>رفع مستندات الموظف</span>
				</h2>
				{/* TODO: RBAC - Only show if hasPermission('shipment:uploadDocuments') */}
				<button
					onClick={onToggleUploadForm}
					className="bg-red-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-900 transition-all shadow-md flex items-center gap-2"
				>
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
							clipRule="evenodd"
						/>
					</svg>
					<span>رفع مستند جديد</span>
				</button>
			</div>

			{/* Upload Form */}
			{showUploadForm && (
				<div className="bg-white rounded-lg p-6 mb-6 border-2 border-red-300">
					<h3 className="text-lg font-bold text-red-900 mb-4">
						إضافة مستند جديد
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2 text-right">
								اسم المستند
							</label>
							<input
								type="text"
								value={documentName}
								onChange={(e) => onDocumentNameChange(e.target.value)}
								placeholder="مثال: فاتورة، شهادة منشأ، بوليصة شحن"
								className="w-full border border-gray-300 rounded-lg px-4 py-3 text-right focus:ring-2 focus:ring-red-800 focus:border-transparent"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2 text-right">
								اختر الملف
							</label>
							<input
								type="file"
								onChange={onFileSelect}
								className="w-full border border-gray-300 rounded-lg px-4 py-3 text-right focus:ring-2 focus:ring-red-800 focus:border-transparent"
								accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
							/>
						</div>
					</div>
					{selectedFile && (
						<div className="mt-4 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
							<button
								onClick={onUpload}
								disabled={uploadingFile}
								className="bg-red-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-900 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
							>
								{uploadingFile ? "جاري الرفع..." : "رفع المستند"}
							</button>
							<div className="text-right">
								<p className="text-sm font-medium text-gray-700">
									الملف المحدد:
								</p>
								<p className="text-sm text-gray-600">{selectedFile.name}</p>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Documents List */}
			{requiredDocuments && requiredDocuments.length > 0 ? (
				<div className="space-y-3">
					<h3 className="text-lg font-semibold text-gray-800 mb-3">
						المستندات المرفوعة ({requiredDocuments.length})
					</h3>
					{requiredDocuments.map((doc, index) => (
						<div
							key={index}
							className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-red-300 transition-all"
						>
							<div className="flex items-center gap-3">
								<span
									className={`px-3 py-1 rounded-full text-sm font-semibold ${
										doc.uploaded
											? "bg-green-100 text-green-800"
											: "bg-yellow-100 text-yellow-800"
									}`}
								>
									{doc.uploaded ? "✓ مرفوع" : "⏳ مطلوب"}
								</span>
								{doc.uploaded && doc.fileId && (
									<button
										onClick={() => onDownloadDocument(doc.fileId, doc.name)}
										className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
									>
										📥 تحميل
									</button>
								)}
							</div>
							<div className="text-right">
								<p className="font-bold text-gray-900">{doc.name}</p>
								{doc.uploadedAt && (
									<p className="text-sm text-gray-500">
										{new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
					<svg
						className="w-16 h-16 mx-auto text-gray-400 mb-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
						/>
					</svg>
					<p className="text-gray-500 text-lg">لا توجد مستندات مرفوعة بعد</p>
					<p className="text-gray-400 text-sm mt-2">
						استخدم زر "رفع مستند جديد" لإضافة مستندات
					</p>
				</div>
			)}
		</div>
	);
};

export default EmployeeUploadSection;
