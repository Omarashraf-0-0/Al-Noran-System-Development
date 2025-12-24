import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Download, Loader2, FileText, Eye } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-hot-toast";

const FileViewerModal = (props) => {
	// ✅ Handle props: support both viewerData object (new) and individual props (legacy)
	const { viewerData, onClose } = props;
	const data = viewerData || props;

	const isOpen = data.open || data.isOpen;
	const fileUrl = data.url || data.fileUrl || (data.fileId && typeof data.fileId === 'string' && data.fileId.includes('http') ? data.fileId : null);
	const fileName = data.name || data.fileName;
	const fileType = data.type || data.fileType;
	// Intelligent ID detection
	let rawFileId = data.fileId;

	// Case 1: If fileId is missing but fileUrl contains a Mongo ID, extract it
	if (!rawFileId && fileUrl && typeof fileUrl === 'string') {
		try {
			const parts = fileUrl.split('/');
			const lastPart = parts[parts.length - 1].split('?')[0];
			if (/^[0-9a-fA-F]{24}$/.test(lastPart)) {
				console.log("🔧 Auto-detected fileId from fileUrl:", lastPart);
				rawFileId = lastPart;
			}
		} catch (e) {
			console.log("⚠️ Error fishing fileId from URL:", e);
		}
	}

	// Case 2: If fileId is provided but is actually a URL (Legacy data), extract ID
	if (rawFileId && typeof rawFileId === 'string' && rawFileId.includes('http')) {
		try {
			const parts = rawFileId.split('/');
			const lastPart = parts[parts.length - 1].split('?')[0];
			// Check if it looks like a Mongo ID (24 hex chars)
			if (/^[0-9a-fA-F]{24}$/.test(lastPart)) {
				console.log("🔧 Auto-corrected fileId from URL:", lastPart);
				rawFileId = lastPart;
			}
		} catch (e) {
			console.log("⚠️ Error parsing fileId URL:", e);
		}
	}
	const fileId = rawFileId;
	const propS3Key = data.s3Key;
	const { isDarkMode } = useTheme();
	// State for resolved file type from proxy response
	const [resolvedType, setResolvedType] = useState(fileType);

	// Update resolvedType when prop changes
	useEffect(() => {
		setResolvedType(fileType);
	}, [fileType]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [blobUrl, setBlobUrl] = useState(null);

	// ✅ Load file through proxy to bypass CORS
	useEffect(() => {
		if (!isOpen) return;

		// 🔍 DEBUG: Log all props
		console.log("📂 FileViewerModal opened with:", {
			fileUrl,
			fileName,
			fileType,
			fileId,
			propS3Key,
			isMongoId: fileId && /^[0-9a-fA-F]{24}$/.test(fileId)
		});

		setLoading(true);
		setError(false);
		setBlobUrl(null);
		setResolvedType(fileType); // Reset type based on prop

		// Try to load through proxy first if we have a fileId or URL
		const loadFile = async () => {
			const token = localStorage.getItem("token");
			console.log("🔑 Token exists:", !!token);

			// Try multiple approaches
			let response = null;

			// Approach 1: If fileId is a MongoDB ID, use proxy by ID
			if (fileId && /^[0-9a-fA-F]{24}$/.test(fileId)) {
				console.log("🚀 Approach 1: Using proxy with fileId:", fileId);
				try {
					response = await fetch(`${import.meta.env.VITE_API_URL}/api/uploads/${fileId}/download`, {
						headers: { Authorization: `Bearer ${token}` }
					});
					console.log("📦 Proxy response:", response.status, response.ok);
				} catch (e) {
					console.log("❌ Proxy approach failed:", e);
				}
			} else {
				console.log("⏭️ Skipping Approach 1: fileId is not a valid MongoDB ID");
			}

			// Approach 2: If no success yet, try by S3 Key from URL (our robust fallback)
			if ((!response || !response.ok) && (propS3Key || (fileUrl && fileUrl.includes('amazonaws.com')))) {
				console.log("🚀 Approach 2: Extracting s3Key from URL for Proxy Download");
				// Extract key logic...
				let extractedS3Key = propS3Key;
				if (!extractedS3Key && fileUrl) {
					try {
						const urlObj = new URL(fileUrl);
						const path = decodeURIComponent(urlObj.pathname);
						if (path.startsWith('/')) {
							extractedS3Key = path.substring(1);
						} else {
							extractedS3Key = path;
						}
						// If key contains valid MongoDB ID (24 hex), it might be wrong... 
						// but let's trust the extraction for now.
					} catch (e) {
						// Fallback split
						extractedS3Key = fileUrl.split('.com/')[1]?.split('?')[0];
					}
				}

				if (extractedS3Key) {
					console.log("🔑 Extracted s3Key:", extractedS3Key);
					try {
						// Use proxy-download-key
						response = await fetch(`${import.meta.env.VITE_API_URL}/api/uploads/proxy-download-key?key=${encodeURIComponent(extractedS3Key)}`, {
							headers: { Authorization: `Bearer ${token}` }
						});
						console.log("📦 Proxy Key response:", response.status, response.ok);
						if (!response.ok) {
							const errBody = await response.text();
							console.log("❌ Proxy Key error body:", errBody);
						}
					} catch (e) {
						console.log("❌ Approach 2 failed:", e);
					}
				}
			} else {
				if (!response) console.log("⏭️ Skipping Approach 2: response not ok");
			}

			// Approach 3: Direct fetch (CORS prone, but worth last shot)
			if (!response || !response.ok) {
				console.log("🚀 Approach 3: Direct fetch from fileUrl");
				if (fileUrl) {
					try {
						response = await fetch(fileUrl);
					} catch (e) {
						console.log("❌ Direct fetch failed (likely CORS):", e);
					}
				}
			}

			if (response && response.ok) {
				try {
					const blob = await response.blob();
					const url = URL.createObjectURL(blob);
					console.log("🔗 Blob URL created:", url);
					console.log("📄 Detected MIME type:", blob.type);
					setBlobUrl(url);
					setResolvedType(blob.type); // Update type from actual content
					setLoading(false);
					return;
				} catch (e) {
					console.log("❌ Blob creation failed:", e);
				}
			} else {
				console.log("⚠️ All approaches failed. Will try to display fileUrl directly.");
			}

			// All approaches failed - just try to use fileUrl directly and let browser handle it
			setLoading(false);
		};

		loadFile();

		// Cleanup blob URL on unmount
		return () => {
			if (blobUrl) {
				URL.revokeObjectURL(blobUrl);
			}
		};
	}, [isOpen, fileUrl, fileId, propS3Key]);

	const handleDownload = async () => {
		const toastId = toast.loading("جاري بدء التحميل...");
		try {
			// Determine download strategy
			let downloadUrl = null;
			let isProxy = false;

			if (fileId && /^[0-9a-fA-F]{24}$/.test(fileId)) {
				// Strategy 1: Valid MongoDB ID -> Use standard download proxy
				downloadUrl = `${import.meta.env.VITE_API_URL}/api/uploads/${fileId}/download`;
				isProxy = true;
			} else if (fileUrl && fileUrl.includes('amazonaws.com')) {
				// Strategy 2: S3 URL -> Extract Key and use PROXY download (bypasses CORS)
				const extractedS3Key = propS3Key || fileUrl.split('.com/')[1]?.split('?')[0];

				if (extractedS3Key) {
					// Use our new backend proxy endpoint that streams the file from S3 (via query param to handle slashes)
					downloadUrl = `${import.meta.env.VITE_API_URL}/api/uploads/proxy-download-key?key=${encodeURIComponent(extractedS3Key)}`;
					isProxy = true;
				}
			}

			// Fallback to existing fileUrl
			if (!downloadUrl) downloadUrl = fileUrl;

			if (!downloadUrl) {
				toast.error("رابط الملف غير متوفر", { id: toastId });
				return;
			}

			if (isProxy) {
				const token = localStorage.getItem("token");
				const response = await fetch(downloadUrl, {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (!response.ok) throw new Error("Proxy download failed");

				let downloadName = fileName || "document";
				const disposition = response.headers.get('Content-Disposition');
				if (disposition) {
					const filenameStarRegex = /filename\*=UTF-8''([^;\n]*)/;
					const starMatches = filenameStarRegex.exec(disposition);
					if (starMatches && starMatches[1]) {
						downloadName = decodeURIComponent(starMatches[1]);
					} else {
						const filenameRegex = /filename[^;=\n]*((['"]).*?\2|[^;\n]*)/;
						const matches = filenameRegex.exec(disposition);
						if (matches != null && matches[1]) {
							downloadName = decodeURIComponent(matches[1].replace(/['"]/g, ''));
						}
					}
				}

				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = downloadName;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
				toast.success("تم التحميل بنجاح", { id: toastId });
			} else {
				// Direct download (Blob or S3)
				try {
					const response = await fetch(downloadUrl);
					const blob = await response.blob();
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = fileName || "download";
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
					toast.success("تم التحميل بنجاح", { id: toastId });
				} catch (e) {
					// Last resort for direct download failure (e.g. CORS)
					console.error("Direct fetch failed, opening in new tab", e);
					window.open(downloadUrl, "_blank");
					toast.success("تم فتح الملف في نافذة جديدة", { id: toastId });
				}
			}
		} catch (error) {
			console.error("Download error:", error);
			toast.error("فشل التحميل", { id: toastId });
		}
	};

	if (!isOpen) return null;

	// Use blobUrl if available, otherwise fall back to fileUrl
	const displayUrl = blobUrl || fileUrl;

	// Don't show error if still loading - wait for proxy to complete
	if (!displayUrl && !loading) {
		return (
			<div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
				<div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
				<div className="relative bg-red-900/90 text-white p-8 rounded-2xl text-center z-10">
					<X className="w-12 h-12 mx-auto mb-4 text-red-400" />
					<p className="font-bold text-lg">رابط الملف غير متوفر</p>
					<button onClick={onClose} className="mt-4 px-6 py-2 bg-white/20 rounded-lg">إغلاق</button>
				</div>
			</div>
		);
	}

	// Show loading state while proxy is fetching the file
	if (!displayUrl && loading) {
		return (
			<div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
				<div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
				<div className={`relative w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col items-center justify-center shadow-2xl overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#1a1010] text-white border border-white/10" : "bg-white text-gray-900"
					}`}>
					<Loader2 className="w-12 h-12 animate-spin mb-4 text-red-500" />
					<p className="text-lg font-bold">جاري تحميل الملف...</p>
					<button
						onClick={onClose}
						className="mt-6 px-6 py-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 transition"
					>
						إلغاء
					</button>
				</div>
			</div>
		);
	}

	const cleanUrl = (fileUrl || fileName || "").split('?')[0].toLowerCase();
	// Use resolvedType (from Blob) if available, otherwise fallback
	const finalType = resolvedType || fileType;

	const isPdf = finalType === "application/pdf" || cleanUrl.endsWith('.pdf');
	const isImage = finalType?.startsWith("image/") || cleanUrl.match(/\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i) || (!finalType && !isPdf);

	const handleLoad = () => setLoading(false);
	const handleError = (e) => {
		console.warn("🖼️ Image render error ignored:", e);
		// Don't set error state for blobs, just stop loading and let browser show what it can
		setLoading(false);
		// setError(true); <--- Disabled to prevent blocking UI
	};

	return ReactDOM.createPortal(
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 text-right" dir="rtl">
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
				onClick={onClose}
			></div>

			<div className={`relative w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#1a1010] text-white border border-white/10" : "bg-white text-gray-900"
				}`}>
				{/* Header */}
				<div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? "border-white/10 bg-black/20" : "border-gray-100 bg-gray-50/50"
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
						{/* Open in New Tab Button */}
						{displayUrl && (
							<a
								href={displayUrl}
								target="_blank"
								rel="noreferrer"
								className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-600 hover:text-black"
									}`}
								title="فتح في نافذة جديدة"
							>
								<Eye className="w-5 h-5" />
							</a>
						)}
						<button
							onClick={handleDownload}
							className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-600 hover:text-black"
								}`}
							title="تحميل"
						>
							<Download className="w-5 h-5" />
						</button>
						<button
							onClick={onClose}
							className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-red-900/50 text-gray-400 hover:text-red-400" : "hover:bg-red-100 text-gray-600 hover:text-red-600"
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
							<button
								onClick={handleDownload}
								className="px-6 py-2 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition"
							>
								<span className="flex items-center gap-2">
									<Download className="w-4 h-4" />
									<span>تحميل الملف بدلاً من ذلك</span>
								</span>
							</button>
						</div>
					) : (
						<>
							{isImage ? (
								<img
									src={displayUrl}
									alt={fileName}
									className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
									onLoad={handleLoad}
									onError={handleError}
								/>
							) : isPdf ? (
								<iframe
									src={`${displayUrl}#toolbar=0`}
									title={fileName}
									className={`w-full h-full rounded-lg bg-white transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
									onLoad={handleLoad}
								// Remove onError for iframe to avoid cross-origin noise
								// onError={handleError} 
								/>
							) : (
								<div className="text-center text-white p-6">
									<FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
									<p className="text-lg font-bold mb-2">المعاينة غير متاحة لهذه الصيغة</p>
									<p className="opacity-70 text-sm mb-6">يرجى تحميل الملف لعرضه.</p>
									<button
										onClick={handleDownload}
										className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
									>
										تحميل الملف
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>,
		document.body
	);
};

export default FileViewerModal;
