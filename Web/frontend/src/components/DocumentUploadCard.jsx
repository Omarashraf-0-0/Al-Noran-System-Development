import React from "react";
import { useTheme } from "../context/ThemeContext";

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
	const { isDarkMode } = useTheme();

	// Determine border and background based on approval status
	const getBorderStyle = () => {
		if (!isUploaded) {
			return isDarkMode 
				? "border-white/10 bg-white/5 hover:border-red-500/50 hover:bg-red-900/10" 
				: "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50";
		}

		const status = isUploaded.approvalStatus;
		if (status === "approved") {
			return isDarkMode 
				? "border-green-500/30 bg-green-900/10" 
				: "border-green-500 bg-green-50";
		}
		if (status === "rejected") {
			return isDarkMode 
				? "border-red-500/50 bg-red-900/10" 
				: "border-red-500 bg-red-50";
		}
		// pending
		return isDarkMode 
			? "border-yellow-500/30 bg-yellow-900/10" 
			: "border-yellow-500 bg-yellow-50";
	};

	return (
		<div
			className={`border rounded-xl p-5 transition-all duration-300 ${getBorderStyle()}`}
		>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-4">
					<span className="text-2xl">{isUploaded ? "✅" : "📎"}</span>
					<div>
						<h3 className={`font-bold text-lg ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
							{index + 1}. {doc.label}
						</h3>
						{doc.required && (
							<span className="text-xs text-red-500 font-medium">* مطلوب</span>
						)}
					</div>
				</div>

				{isUploaded ? (
					<div className="flex gap-2">
						<button
							onClick={() => onView(isUploaded.id)}
							className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
								isDarkMode 
									? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" 
									: "bg-blue-100 text-blue-700 hover:bg-blue-200"
							}`}
						>
							👁️ عرض
						</button>
						<button
							onClick={() => onDelete(doc.key, isUploaded.id)}
							className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
								isDarkMode 
									? "bg-red-600/20 text-red-400 hover:bg-red-600/30" 
									: "bg-red-100 text-red-700 hover:bg-red-200"
							}`}
						>
							🗑️ حذف
						</button>
					</div>
				) : (
					<label className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md ${
						isDarkMode 
							? "bg-red-700 hover:bg-red-600 text-white shadow-red-900/20" 
							: "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
					}`}>
						{isUploading ? (
							<>
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								<span className="opacity-90">...</span>
							</>
						) : (
							<>
								<span>📤</span>
								<span>رفع</span>
							</>
						)}
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
					<div className={`w-full rounded-full h-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
						<div
							className="bg-red-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${uploadProgress}%` }}
						></div>
					</div>
					<p className={`text-xs mt-1 text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
						{uploadProgress}%
					</p>
				</div>
			)}

			{/* File Info */}
			{isUploaded && (
				<div className={`mt-3 text-sm p-3 rounded-lg border ${
					isDarkMode ? "bg-black/20 border-white/5" : "bg-white border-gray-100"
				}`}>
					<p className={`font-medium mb-1 truncate ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
						📄 {isUploaded.filename}
					</p>
					<p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
						تم الرفع:{" "}
						{new Date(isUploaded.uploadedAt).toLocaleDateString("ar-EG")}
					</p>
					
					{/* Approval Status Badge */}
					{isUploaded.approvalStatus && (
						<div className="mt-2 flex items-center gap-2">
							<span
								className={`px-2 py-1 rounded text-xs font-bold ${
									isUploaded.approvalStatus === "approved"
										? (isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700")
										: isUploaded.approvalStatus === "rejected"
										? (isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700")
										: (isDarkMode ? "bg-yellow-500/20 text-yellow-500" : "bg-yellow-100 text-yellow-700")
								}`}
							>
								{isUploaded.approvalStatus === "approved"
									? "✅ تمت الموافقة"
									: isUploaded.approvalStatus === "rejected"
									? "❌ مرفوض"
									: "⏳ قيد المراجعة"}
							</span>
						</div>
					)}
					
					{/* Rejection Reason */}
					{isUploaded.approvalStatus === "rejected" &&
						isUploaded.rejectionReason && (
							<div className={`mt-2 p-2 rounded border ${
								isDarkMode ? "bg-red-900/20 border-red-500/30" : "bg-red-50 border-red-200"
							}`}>
								<p className={`font-medium ${isDarkMode ? "text-red-400" : "text-red-700"}`}>سبب الرفض:</p>
								<p className={isDarkMode ? "text-red-300/80" : "text-red-600"}>{isUploaded.rejectionReason}</p>
							</div>
						)}
				</div>
			)}
		</div>
	);
};

export default DocumentUploadCard;
