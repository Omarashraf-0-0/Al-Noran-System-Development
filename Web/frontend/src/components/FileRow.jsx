import React from "react";

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

import axios from "axios";
import toast from "react-hot-toast";

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
	// Get the display label for document type
	const getDocumentTypeLabel = () => {
		if (description) return description;
		if (documentType && documentTypeLabels[documentType]) {
			return documentTypeLabels[documentType];
		}
		return "مستند";
	};

	// Fetch fresh presigned URL if we have an ID
	const getFreshUrl = async () => {
		if (!id) {
			return url;
		}

		try {
			const token = localStorage.getItem("token");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${id}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			return (
				response.data?.upload?.presignedUrl ||
				response.data?.presignedUrl ||
				url
			);
		} catch (error) {
			console.error("Error fetching fresh URL:", error);
			toast.error("فشل تحميل رابط الملف");
			return null;
		}
	};

	const handleView = async () => {
		if (onView) {
			onView();
		} else {
			toast.loading("جاري تحميل الملف...");
			const freshUrl = await getFreshUrl();
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
			toast.loading("جاري تحميل الملف...");
			const freshUrl = await getFreshUrl();
			toast.dismiss();
			if (freshUrl) {
				window.open(freshUrl, "_blank");
			}
		}
	};

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 items-center gap-4 p-4 border-b border-gray-200 last:border-b-0">
			<div className="col-span-2 md:col-span-1">
				<p className="font-semibold text-gray-800">{name}</p>
				<p className="text-xs text-gray-500">{date}</p>
			</div>
			<div className="text-gray-600 text-center hidden md:block">
				{getDocumentTypeLabel()}
			</div>
			<div className="text-gray-600 text-center hidden md:block">
				<button
					onClick={handleView}
					className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
					disabled={!url && !onView}
				>
					راجع الملف
				</button>
			</div>
			<div className="text-start">
				<button
					onClick={handleDownload}
					className="text-cyan-600 font-semibold hover:underline cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
					disabled={!url && !onDownload}
				>
					تحميل الملف
				</button>
			</div>
		</div>
	);
};

export default FileRow;
