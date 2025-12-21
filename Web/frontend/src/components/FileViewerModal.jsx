import React, { useState, useEffect } from "react";
import { X, Download, ExternalLink, Loader2, FileText } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-hot-toast";

const FileViewerModal = ({ isOpen, onClose, fileUrl, fileName, fileType, fileId }) => {
	const { isDarkMode } = useTheme();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const handleDownload = async () => {
		const toastId = toast.loading("جاري بدء التحميل...");
		try {
			if (!fileId) {
				console.error("Missing fileId for secure download");
				toast.error("لا يمكن تحميل الملف بشكل آمن (مفقود المعرف)");
				toast.dismiss(toastId);
				return;
			}

			// ✅ Proxy Download (Hides S3 URL)
			const token = localStorage.getItem("token");
			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/uploads/${fileId}/download`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error("Proxy download failed");
			
			// Extract filename from Content-Disposition header if available
			let downloadName = fileName || "document";
			const disposition = response.headers.get('Content-Disposition');
			if (disposition) {
				const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
				const matches = filenameRegex.exec(disposition);
				if (matches != null && matches[1]) { 
					downloadName = decodeURIComponent(matches[1].replace(/['"]/g, ''));
				}
			}

			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = blobUrl;
			link.download = downloadName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(blobUrl);
			toast.success("تم التحميل بنجاح");
		} catch (e) {
			console.error("Download failed", e);
			toast.error("فشل التحميل");
		}
		toast.dismiss(toastId);
	};
	useEffect(() => {
		if (isOpen) {
			setLoading(true);
			setError(false);
		}
	}, [isOpen, fileUrl]);

	if (!isOpen) return null;

	const isImage = fileType?.startsWith("image/") || fileUrl?.match(/\.(jpeg|jpg|png|gif|webp)$/i);
	const isPdf = fileType === "application/pdf" || fileUrl?.match(/\.pdf$/i);

	const handleLoad = () => setLoading(false);
	const handleError = () => {
		setLoading(false);
		setError(true);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
			{/* Backdrop */}
			<div 
				className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
				onClick={onClose}
			></div>

			{/* Modal Content */}
			<div className={`relative w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-colors duration-300 ${
				isDarkMode ? "bg-[#1a1010] text-white border border-white/10" : "bg-white text-gray-900"
			}`}>
				{/* Header */}
				<div className={`px-6 py-4 flex items-center justify-between border-b ${
					isDarkMode ? "border-white/10 bg-black/20" : "border-gray-100 bg-gray-50/50"
				}`}>
					<div className="flex items-center gap-3 overflow-hidden">
						<div className={`p-2 rounded-lg ${isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}>
							<FileText className="w-5 h-5" />
						</div>
						<div className="min-w-0">
							<h3 className="font-bold text-sm sm:text-lg truncate" title={fileName}>
								{fileName || "معاينة الملف"}
							</h3>
						</div>
					</div>
					
					<div className="flex items-center gap-2">
						{fileUrl && (
							<button 
								onClick={handleDownload}
								className={`p-2 rounded-lg transition-colors ${
									isDarkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-600 hover:text-black"
								}`}
								title="تحميل"
							>
								<Download className="w-5 h-5" />
							</button>
						)}
						<button 
							onClick={onClose}
							className={`p-2 rounded-lg transition-colors ${
								isDarkMode ? "hover:bg-red-900/50 text-gray-400 hover:text-red-400" : "hover:bg-red-100 text-gray-600 hover:text-red-600"
							}`}
						>
							<X className="w-6 h-6" />
						</button>
					</div>
				</div>

				{/* Body */}
				<div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-auto p-4">
					{loading && (
						<div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 transition-opacity">
							<Loader2 className="w-10 h-10 animate-spin mb-3 text-red-500" />
							<p className="text-sm opacity-80">جاري تحميل الملف...</p>
						</div>
					)}

					{error ? (
						<div className="text-center text-white p-6 max-w-md">
							<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
								<X className="w-8 h-8" />
							</div>
							<p className="text-lg font-bold mb-2">تعذر عرض الملف</p>
							<p className="opacity-70 text-sm mb-6">قد يكون الملف تالفاً أو أن الصيغة غير مدعومة للمعاينة المباشرة.</p>
							<a 
								href={fileUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="px-6 py-2 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition"
							>
								<span className="flex items-center gap-2">
									<Download className="w-4 h-4" />
									<span>تحميل الملف بدلاً من ذلك</span>
								</span>
							</a>
						</div>
					) : (
						<>
							{isImage ? (
								<img 
									src={fileUrl} 
									alt={fileName} 
									className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
									onLoad={handleLoad}
									onError={handleError}
								/>
							) : isPdf ? (
								<iframe 
									src={`${fileUrl}#toolbar=0`} 
									title={fileName}
									className={`w-full h-full rounded-lg bg-white transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
									onLoad={handleLoad}
									onError={handleError}
								/>
							) : (
								<div className="text-center text-white p-6">
									<FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
									<p className="text-lg font-bold mb-2">المعاينة غير متاحة لهذه الصيغة</p>
									<p className="opacity-70 text-sm mb-6">يرجى تحميل الملف لعرضه.</p>
									<a 
										href={fileUrl}
										download={fileName}
										className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
									>
										تحميل الملف
									</a>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default FileViewerModal;
