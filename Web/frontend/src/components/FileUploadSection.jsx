import React from "react";
import { FileText } from "lucide-react";

/**
 * FileUploadSection Component
 * File upload UI with progress bar for invoice/document upload
 */
const FileUploadSection = ({
	selectedFile,
	uploadedFile,
	uploading,
	progress,
	onFileSelect,
	onDelete,
	title = "الفاتورة المبدئية",
	required = true,
}) => {
	return (
		<div className="mb-12">
			<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
				<FileText className="w-6 h-6" />
				<span>{title}</span>
			</h2>
			<div
				className={`border-2 rounded-lg p-4 transition-all ${
					selectedFile || uploadedFile
						? "border-green-500 bg-green-50"
						: "border-gray-300 bg-white hover:border-blue-400"
				}`}
			>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-3">
						<span className="text-2xl">
							{uploadedFile ? "✅" : selectedFile ? "📄" : "📎"}
						</span>
						<div>
							<h3 className="font-semibold text-gray-800">
								{title}
								{required && <span className="text-red-500"> *</span>}
							</h3>
							<span className="text-xs text-gray-500">
								{selectedFile
									? selectedFile.name
									: uploadedFile
									? "فاتورة موجودة"
									: "(PDF أو صورة - حد أقصى 10 ميجابايت)"}
							</span>
						</div>
					</div>

					{selectedFile || uploadedFile ? (
						<div className="flex gap-2">
							<button
								type="button"
								onClick={onDelete}
								className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
							>
								🗑️ حذف
							</button>
						</div>
					) : (
						<label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
							📤 اختر ملف جديد
							<input
								type="file"
								className="hidden"
								accept=".pdf,.jpg,.jpeg,.png"
								onChange={onFileSelect}
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
						<p className="text-xs text-gray-600 mt-1 text-center">
							{progress}%
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default FileUploadSection;
