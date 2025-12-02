import React from "react";

/**
 * DocumentUploadCard Component
 * Displays a single document upload card with upload/view/delete actions
 */
const DocumentUploadCard = ({
	doc,
	index,
	isUploaded,
	isUploading,
	uploadProgress,
	onFileSelect,
	onView,
	onDelete,
}) => {
	return (
		<div
			className={`border-2 rounded-lg p-4 transition-all ${
				isUploaded
					? "border-green-500 bg-green-50"
					: "border-gray-300 bg-white hover:border-blue-400"
			}`}
		>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-3">
					<span className="text-2xl">{isUploaded ? "✅" : "📎"}</span>
					<div>
						<h3 className="font-semibold text-gray-800">
							{index + 1}. {doc.label}
						</h3>
						{doc.required && (
							<span className="text-xs text-red-500">* مطلوب</span>
						)}
					</div>
				</div>

				{isUploaded ? (
					<div className="flex gap-2">
						<button
							onClick={() => onView(isUploaded.id)}
							className="btn btn-sm btn-info text-white"
						>
							👁️ عرض
						</button>
						<button
							onClick={() => onDelete(doc.key, isUploaded.id)}
							className="btn btn-sm btn-error text-white"
						>
							🗑️ حذف
						</button>
					</div>
				) : (
					<label className="btn btn-sm btn-primary text-white">
						{isUploading ? "جاري الرفع..." : "📤 رفع"}
						<input
							type="file"
							className="hidden"
							accept=".pdf,.jpg,.jpeg,.png"
							onChange={(e) =>
								onFileSelect(doc.key, doc.key, e.target.files[0])
							}
							disabled={isUploading}
						/>
					</label>
				)}
			</div>

			{/* Upload Progress Bar */}
			{isUploading && (
				<div className="mt-3">
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${uploadProgress}%` }}
						></div>
					</div>
					<p className="text-xs text-gray-600 mt-1 text-center">
						{uploadProgress}%
					</p>
				</div>
			)}

			{/* File Info */}
			{isUploaded && (
				<div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
					<p>📄 {isUploaded.filename}</p>
					<p className="text-gray-500">
						تم الرفع:{" "}
						{new Date(isUploaded.uploadedAt).toLocaleDateString("ar-EG")}
					</p>
				</div>
			)}
		</div>
	);
};

export default DocumentUploadCard;
