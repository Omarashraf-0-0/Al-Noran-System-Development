import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Eye, Download, FileText } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// Map document types to Arabic labels
const documentTypeLabels = {
	commercial_register: "السجل التجاري",
	tax_card: "البطاقة الضريبية",
	contract: "العقد",
	industrial_register: "السجل الصناعي",
	certificate_vat: "شهادة القيمة المضافة",
	production_supplies: "مستلزمات الإنتاج",
	power_of_attorney: "التوكيل",
	personal_id_of_representative: "بطاقة ممثل/مندوب",
	import_export_card: "بطاقة استيراد/تصدير",
	trade_certificates: "شهادات تجارية",
	personal_id: "البطاقة الشخصية",
	sample_document: "مستند داعم",
	bill_of_lading: "بوليصة الشحن",
	delivery_permit: "تصريح التسليم",
	discharge_docs: "مستندات التفريغ",
	proforma_invoice: "فاتورة مبدئية",
	invoice: "فاتورة",
	report: "تقرير",
	other: "مستند آخر",
};

const FileRow = ({
	name,
	date,
	documentType = null,
	description = null,
	url = null,
	id = null,
	onView = null,
	onDownload = null,
}) => {
	const { isDarkMode } = useTheme();

	// Get the display label for document type
	const getDocumentTypeLabel = () => {
		if (description) return description;
		if (documentType && documentTypeLabels[documentType]) {
			return documentTypeLabels[documentType];
		}
		return "مستند";
	};

	// Fetch fresh presigned URL if we have an ID
	const getFreshUrl = async (isDownload = false) => {
		if (!id) {
			return url;
		}

		try {
			const token = localStorage.getItem("token");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${id}${isDownload ? '?download=true' : ''}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			
			// ... (rest of check logic)

			return (
				response.data?.upload?.presignedUrl ||
				response.data?.upload?.url ||
				response.data?.presignedUrl ||
				url
			);
		} catch (error) {
			// ... (rest of error logic)
			return null;
		}
	};

	const handleView = async () => {
		if (onView) {
			onView();
		} else {
			toast.loading("جاري تحميل الملف...");
			const freshUrl = await getFreshUrl(false);
			toast.dismiss();
			if (freshUrl) {
				window.open(freshUrl, "_blank");
			}
		}
	};

	const handleDownload = async () => {
		if (onDownload) {
			onDownload();
		} else {
			if (!id) {
				toast.error("لا يمكن تحميل هذا الملف");
				return;
			}
			const toastId = toast.loading("جاري بدء التحميل...");
			try {
				const token = localStorage.getItem("token");
				const response = await fetch(`${import.meta.env.VITE_API_URL}/api/uploads/${id}/download`, {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (!response.ok) throw new Error("Download failed");

				// Extract filename from Content-Disposition header if available
				let downloadName = name || "document";
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
				
				// Use a temporary anchor to trigger download
				const link = document.createElement('a');
				link.href = blobUrl;
				link.setAttribute('download', downloadName);
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(blobUrl);
				
				toast.success("تم التحميل بنجاح");
			} catch (error) {
				console.error("Download error:", error);
				toast.error("فشل التحميل");
			}
			toast.dismiss(toastId);
		}
	};

	return (
		<div className={`grid grid-cols-2 md:grid-cols-4 items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
			isDarkMode 
				? "hover:bg-white/5 border-b border-white/5 last:border-0" 
				: "hover:bg-gray-50 border-b border-gray-100 last:border-0"
		}`}>
			{/* File Name & Date */}
			<div className="col-span-2 md:col-span-1 flex items-center gap-3">
				<div className={`p-2 rounded-lg ${isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"}`}>
					<FileText className="w-5 h-5" />
				</div>
				<div>
					<p className={`font-semibold text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{name}</p>
					<p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>{date}</p>
				</div>
			</div>

			{/* Doc Type */}
			<div className={`text-center hidden md:block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
				{getDocumentTypeLabel()}
			</div>

			{/* View Action */}
			<div className="text-center hidden md:block">
				<button
					onClick={handleView}
					className={`flex items-center justify-center gap-2 mx-auto text-sm font-medium transition-colors ${
						isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"
					}`}
					disabled={!url && !onView}
				>
					<Eye className="w-4 h-4" />
					<span>عرض</span>
				</button>
			</div>

			{/* Download Action */}
			<div className="text-start md:text-center">
				<button
					onClick={handleDownload}
					className={`flex items-center justify-center gap-2 mx-auto text-sm font-medium transition-colors ${
						isDarkMode 
							? "text-cyan-400 hover:text-cyan-300 disabled:text-gray-600" 
							: "text-cyan-600 hover:text-cyan-800 disabled:text-gray-300"
					}`}
					disabled={!url && !onDownload}
				>
					<Download className="w-4 h-4" />
					<span>تحميل</span>
				</button>
			</div>
		</div>
	);
};

export default FileRow;
