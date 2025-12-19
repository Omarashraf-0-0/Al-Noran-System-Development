import React, { useMemo } from "react";

const FileUploadCard = ({
	selectedFile,
	uploadedFile,
	uploading,
	progress,
	onFileSelect,
	onDeleteUpload,
	onViewDocument,
	label = "ملف",
	acceptedTypes = ".pdf,.jpg,.jpeg,.png",
	maxSizeMB = 10,
	required = false,
}) => {
	// Create a local preview URL for the selected file
	const localPreviewUrl = useMemo(() => {
		if (selectedFile && !uploadedFile) {
			return URL.createObjectURL(selectedFile);
		}
		return null;
	}, [selectedFile, uploadedFile]);

	// Handle local file preview
	const handleLocalPreview = () => {
		if (localPreviewUrl) {
			window.open(localPreviewUrl, "_blank");
		}
	};
	return (
		<div
			className={`border-2 rounded-lg p-4 mb-6 transition-all ${
				selectedFile || uploadedFile
					? "border-green-500 bg-green-50"
					: "border-gray-300 bg-white hover:border-blue-400"
			}`}
			dir="rtl"
		>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-3">
					<span className="text-2xl">
						{uploadedFile ? "✅" : selectedFile ? "📄" : "📎"}
					</span>
					<div>
						<h3 className="font-semibold text-gray-800">
							{label} {required && <span className="text-red-500">*</span>}
						</h3>
						<span className="text-xs text-gray-500">
							(PDF أو صورة - حد أقصى {maxSizeMB} ميجابايت)
						</span>
					</div>
				</div>

				{selectedFile || uploadedFile ? (
					<div className="flex gap-2">
						{/* Preview button - works for both uploaded and locally selected files */}
						{uploadedFile ? (
							<button
								type="button"
								onClick={onViewDocument}
								className="btn btn-sm btn-info text-white"
							>
								👁️ عرض
							</button>
						) : selectedFile && localPreviewUrl ? (
							<button
								type="button"
								onClick={handleLocalPreview}
								className="btn btn-sm btn-info text-white"
							>
								👁️ معاينة
							</button>
						) : null}
						<button
							type="button"
							onClick={onDeleteUpload}
							className="btn btn-sm btn-error text-white"
						>
							🗑️ حذف
						</button>
					</div>
				) : (
					<label className="btn btn-sm btn-primary text-white">
						📤 اختر ملف
						<input
							type="file"
							className="hidden"
							accept={acceptedTypes}
							onChange={(e) => onFileSelect(e.target.files[0])}
							disabled={uploading}
						/>
					</label>
				)}
			</div>

			{/* Upload Progress Bar */}
			{uploading && (
				<div className="mt-3">
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${progress}%` }}
						></div>
					</div>
					<p className="text-xs text-gray-600 mt-1 text-center">{progress}%</p>
				</div>
			)}

			{/* File Info - Selected but not uploaded */}
			{selectedFile && !uploadedFile && (
				<div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
					<p>📄 {selectedFile.name}</p>
					<p className="text-gray-500">
						الحجم: {(selectedFile.size / 1024 / 1024).toFixed(2)} ميجابايت
					</p>
					<p className="text-blue-600 font-semibold mt-1">
						⏳ سيتم الرفع عند الضغط على "إرسال الطلب"
					</p>
				</div>
			)}

			{/* File Info - Uploaded */}
			{uploadedFile && (
				<div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
					<p>📄 {uploadedFile.filename}</p>
					<p className="text-gray-500">
						تم الرفع:{" "}
						{new Date(uploadedFile.uploadedAt).toLocaleDateString("ar-EG")}
					</p>
				</div>
			)}
		</div>
	);
};

export default FileUploadCard;
