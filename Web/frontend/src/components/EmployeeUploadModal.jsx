import React from "react";

/**
 * EmployeeUploadModal - Popup for uploading employee documents
 */
const EmployeeUploadModal = ({
	isOpen,
	onClose,
	documentName,
	onDocumentNameChange,
	selectedFile,
	onFileSelect,
	onUpload,
	uploadingFile,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-6 rounded-t-xl">
					<div className="flex justify-between items-center">
						<h2 className="text-2xl font-bold flex items-center gap-2">
							<span>📤</span>
							<span>رفع مستند جديد</span>
						</h2>
						<button
							onClick={onClose}
							className="text-white hover:bg-red-700 rounded-full p-2 transition-all"
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
				</div>

				{/* Body */}
				<div className="p-6">
					<div className="space-y-6">
						{/* Document Name */}
						<div>
							<label className="block text-sm font-bold text-gray-700 mb-2 text-right">
								اسم المستند <span className="text-red-600">*</span>
							</label>
							<input
								type="text"
								value={documentName}
								onChange={(e) => onDocumentNameChange(e.target.value)}
								placeholder="مثال: فاتورة، شهادة منشأ، بوليصة شحن"
								className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-right focus:ring-2 focus:ring-red-800 focus:border-red-800 transition"
								dir="rtl"
							/>
						</div>

						{/* File Selection */}
						<div>
							<label className="block text-sm font-bold text-gray-700 mb-2 text-right">
								اختر الملف <span className="text-red-600">*</span>
							</label>
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-800 transition">
								<input
									type="file"
									id="file-upload"
									onChange={onFileSelect}
									className="hidden"
									accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
								/>
								<label
									htmlFor="file-upload"
									className="cursor-pointer flex flex-col items-center"
								>
									<svg
										className="w-12 h-12 text-gray-400 mb-3"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
										/>
									</svg>
									<span className="text-gray-600 font-medium mb-1">
										اضغط لاختيار ملف
									</span>
									<span className="text-gray-400 text-sm">
										PDF, JPG, PNG, DOC, DOCX
									</span>
								</label>
							</div>
							{selectedFile && (
								<div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="bg-green-100 p-2 rounded-lg">
												<svg
													className="w-6 h-6 text-green-600"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fillRule="evenodd"
														d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
														clipRule="evenodd"
													/>
												</svg>
											</div>
											<div className="text-right">
												<p className="font-medium text-gray-800">
													{selectedFile.name}
												</p>
												<p className="text-sm text-gray-500">
													{(selectedFile.size / 1024).toFixed(2)} KB
												</p>
											</div>
										</div>
										<svg
											className="w-6 h-6 text-green-600"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="bg-gray-50 px-6 py-4 rounded-b-xl flex gap-3 justify-end">
					<button
						onClick={onClose}
						className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all"
					>
						إلغاء
					</button>
					<button
						onClick={onUpload}
						disabled={uploadingFile || !selectedFile || !documentName.trim()}
						className="px-6 py-3 bg-red-800 text-white rounded-lg font-bold hover:bg-red-900 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{uploadingFile ? (
							<>
								<svg
									className="animate-spin h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								<span>جاري الرفع...</span>
							</>
						) : (
							<>
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
										clipRule="evenodd"
									/>
								</svg>
								<span>رفع المستند</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default EmployeeUploadModal;
