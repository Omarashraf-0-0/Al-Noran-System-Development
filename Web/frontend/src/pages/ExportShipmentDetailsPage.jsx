import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Datafield from "../components/DataField";
import RequestDocumentsModal from "../components/RequestDocumentsModal";
import contractIcon from "../assets/images/contract.png";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";
import { useTheme } from "../context/ThemeContext";
import { Download, Eye } from "lucide-react";

// Proxy download function to handle S3 files securely
const handleProxyDownload = async (fileId, fileName) => {
	if (!fileId) {
		toast.error("لا يمكن تحميل هذا الملف");
		return;
	}
	const toastId = toast.loading("جاري بدء التحميل...");
	try {
		const token = localStorage.getItem("token");
		const response = await fetch(`${import.meta.env.VITE_API_URL}/api/uploads/${fileId}/download`, {
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!response.ok) throw new Error("Download failed");

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
		
		// Use a temporary anchor to trigger download
		const link = document.createElement('a');
		link.href = blobUrl;
		link.setAttribute('download', downloadName);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(blobUrl);
		
		toast.success("تم التحميل بنجاح", { id: toastId });
	} catch (error) {
		console.error("Download error:", error);
		toast.error("فشل التحميل", { id: toastId });
	}
};

// Status configurations - aligned with backend ExportShipment model
const STATUS_CONFIG = {
	documents_verification: {
		label: "التحقق من المستندات",
		color: "bg-blue-100 text-blue-800 border-blue-200",
		icon: "📄",
		step: 1,
	},
	regulatory_inspection: {
		label: "فحص الجهات الرقابية",
		color: "bg-purple-100 text-purple-800 border-purple-200",
		icon: "🔍",
		step: 2,
	},
	payment_cleared: {
		label: "تم السداد",
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		icon: "💳",
		step: 3,
	},
	goods_loaded: {
		label: "تم التحميل",
		color: "bg-cyan-100 text-cyan-800 border-cyan-200",
		icon: "📦",
		step: 4,
	},
	in_transit: {
		label: "في الطريق",
		color: "bg-orange-100 text-orange-800 border-orange-200",
		icon: "🚚",
		step: 5,
	},
	delivered: {
		label: "تم التسليم",
		color: "bg-green-100 text-green-800 border-green-200",
		icon: "✅",
		step: 6,
	},
	completed: {
		label: "مكتمل",
		color: "bg-green-200 text-green-900 border-green-300",
		icon: "✨",
		step: 7,
	},
	cancelled: {
		label: "ملغي",
		color: "bg-red-100 text-red-800 border-red-200",
		icon: "❌",
		step: -1,
	},
};

// Status flow - 7 steps for progress stepper
const STATUS_STEPS = [
	{ key: "documents_verification", label: "التحقق من المستندات" },
	{ key: "regulatory_inspection", label: "فحص الجهات الرقابية" },
	{ key: "payment_cleared", label: "تم السداد" },
	{ key: "goods_loaded", label: "تم التحميل" },
	{ key: "in_transit", label: "في الطريق" },
	{ key: "delivered", label: "تم التسليم" },
	{ key: "completed", label: "مكتمل" },
];

// Export Shipment Stepper Component (matching ShipmentStatus.jsx design)
const ExportStepper = ({ currentStatus, isDarkMode }) => {
	const getStepIndex = (status) => {
		const index = STATUS_STEPS.findIndex((s) => s.key === status);
		return index >= 0 ? index : 0;
	};

	const activeStepIndex = getStepIndex(currentStatus);

	// Special case for cancelled
	if (currentStatus === "cancelled") {
		return (
			<div className="w-full py-4">
				<div className={`border rounded-lg p-4 text-center ${
					isDarkMode 
						? "bg-red-900/20 border-red-700/50" 
						: "bg-red-50 border-red-200"
				}`}>
					<span className="text-3xl mb-2 block">❌</span>
					<p className={`font-bold ${isDarkMode ? "text-red-400" : "text-red-800"}`}>تم إلغاء الشحنة</p>
				</div>
			</div>
		);
	}

	// Show 7 steps with scroll on mobile
	return (
		<div className="w-full pb-4">
			<div className="flex items-start justify-between py-6 px-2 overflow-x-auto">
				{STATUS_STEPS.map((step, index) => {
					const isActive = index <= activeStepIndex;
					const isCurrent = index === activeStepIndex;
					const isLastStep = index === STATUS_STEPS.length - 1;

					const circleClass = isActive
						? isCurrent
							? isDarkMode 
								? "bg-red-700 ring-4 ring-red-900/50"
								: "bg-red-900 ring-4 ring-red-200"
							: isDarkMode ? "bg-red-700" : "bg-red-900"
						: isDarkMode ? "bg-gray-700" : "bg-gray-300";
					const textClass = isActive
						? isDarkMode ? "text-red-400 font-bold" : "text-red-900 font-bold"
						: isDarkMode ? "text-gray-500" : "text-gray-400";
					const nextStepIsActive =
						index < STATUS_STEPS.length - 1 && index + 1 <= activeStepIndex;
					const lineClass = nextStepIsActive 
						? isDarkMode ? "bg-red-700" : "bg-red-900" 
						: isDarkMode ? "bg-gray-700" : "bg-gray-300";

					return (
						<React.Fragment key={step.key}>
							<div className="flex flex-col items-center text-center flex-shrink-0" style={{ minWidth: "70px" }}>
								<div
									className={`w-10 h-10 rounded-full transition-all duration-500 ${circleClass} relative z-10 flex items-center justify-center`}
								>
									{isActive && (
										<span className="text-white text-lg">
											{isCurrent ? "●" : "✓"}
										</span>
									)}
								</div>
								<p
									className={`mt-3 text-xs ${textClass} px-1 max-w-[80px]`}
									style={{ lineHeight: "1.3" }}
								>
									{step.label}
								</p>
							</div>
							{!isLastStep && (
								<div
									className={`h-1.5 transition-colors duration-500 ${lineClass} self-start flex-shrink-0`}
									style={{
										width: "40px",
										marginTop: "18px",
									}}
								/>
							)}
						</React.Fragment>
					);
				})}
			</div>
		</div>
	);
};

const ExportShipmentDetailsPage = () => {
	const { shipmentId, id } = useParams();
	const actualId = shipmentId || id; // Support both parameter names
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	const [loading, setLoading] = useState(true);
	const [shipment, setShipment] = useState(null);
	const [userType, setUserType] = useState("client");

	// Document request modal state (for employee) - Same workflow as EmployeeShipmentManagement
	const [showDocumentRequestModal, setShowDocumentRequestModal] = useState(false);
	const [documentName, setDocumentName] = useState("");
	const [requiredDocuments, setRequiredDocuments] = useState([]); // Local array before saving
	const [savingDocuments, setSavingDocuments] = useState(false);

	// File upload state (for client)
	const [pendingFiles, setPendingFiles] = useState({});
	const [uploadingDoc, setUploadingDoc] = useState(null);
	const [deletingDoc, setDeletingDoc] = useState(null);

	const token = localStorage.getItem("token");

	// Check user type
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const user = JSON.parse(storedUser);
			setUserType(user.type || "client");
		}
	}, []);

	// Fetch shipment details
	const fetchShipmentDetails = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				toast.error("يجب تسجيل الدخول أولاً");
				navigate("/login");
				return;
			}

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/export-shipments/${actualId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setShipment(response.data.shipment || response.data.data);
			}
		} catch (error) {
			console.error("Error fetching shipment details:", error);
			if (error.response?.status === 404) {
				toast.error("الشحنة غير موجودة");
				navigate(userType === "employee" ? "/employee/export-shipments" : "/export-shipments");
			} else if (error.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else {
				toast.error("فشل في جلب تفاصيل الشحنة");
			}
		} finally {
			setLoading(false);
		}
	}, [actualId, navigate, userType]);

	useEffect(() => {
		fetchShipmentDetails();
	}, [fetchShipmentDetails]);

	// Format date
	const formatDate = (dateStr) => {
		if (!dateStr) return "—";
		return new Date(dateStr).toLocaleDateString("ar-EG", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Format currency
	const formatCurrency = (value) => {
		if (!value && value !== 0) return "—";
		return new Intl.NumberFormat("ar-EG", {
			style: "currency",
			currency: "EGP",
		}).format(value);
	};

	// =====================
	// Document Request Handlers (for Employee) - Same workflow as EmployeeShipmentManagement
	// =====================
	
	// Add document to local array (not saved yet)
	const handleAddDocumentRequest = () => {
		if (!documentName.trim()) {
			toast.error("يرجى إدخال اسم المستند");
			return;
		}
		
		// Check if document already exists in local array
		if (requiredDocuments.some(doc => doc.name.toLowerCase() === documentName.trim().toLowerCase())) {
			toast.error("هذا المستند مضاف بالفعل");
			return;
		}
		
		setRequiredDocuments([
			...requiredDocuments,
			{ name: documentName.trim(), uploaded: false },
		]);
		setDocumentName("");
		toast.success("تم إضافة المستند للقائمة");
	};
	
	// Remove document from local array (not saved yet)
	const handleRemoveDocumentRequest = (index) => {
		const updated = requiredDocuments.filter((_, i) => i !== index);
		setRequiredDocuments(updated);
		toast.success("تم حذف المستند من القائمة");
	};
	
	// Save all documents to backend
	const handleSaveDocumentRequests = async () => {
		if (requiredDocuments.length === 0) {
			toast.error("يرجى إضافة مستند واحد على الأقل");
			return;
		}

		setSavingDocuments(true);
		try {
			toast.loading("جاري إرسال طلب المستندات...");
			
			// Send each document request to the backend
			for (const doc of requiredDocuments) {
				await axios.post(
					`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${actualId}/request-document`,
					{ documentName: doc.name },
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
			}
			
			toast.dismiss();
			toast.success("تم حفظ المستندات المطلوبة وإرسال إشعار للعميل");
			setShowDocumentRequestModal(false);
			setRequiredDocuments([]);
			fetchShipmentDetails();
		} catch (error) {
			toast.dismiss();
			const errorMsg = error.response?.data?.message || "فشل في حفظ المستندات المطلوبة";
			toast.error(errorMsg);
		} finally {
			setSavingDocuments(false);
		}
	};

	// Delete a saved document request (with confirmation)
	const handleDeleteSavedDocument = async (doc) => {
		if (!window.confirm(`هل أنت متأكد من حذف طلب المستند "${doc.name}"؟`)) {
			return;
		}

		setDeletingDoc(doc._id);
		try {
			toast.loading("جاري حذف طلب المستند...");
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${actualId}/required-documents/${doc._id}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			toast.dismiss();
			toast.success("تم حذف طلب المستند بنجاح");
			fetchShipmentDetails();
		} catch (error) {
			toast.dismiss();
			const errorMsg = error.response?.data?.message || "فشل في حذف طلب المستند";
			toast.error(errorMsg);
		} finally {
			setDeletingDoc(null);
		}
	};

	const handleViewDocument = async (doc) => {
		if (!doc.fileId || doc.fileId === "temp-file-id") {
			toast.error("معرف الملف غير صالح");
			return;
		}

		try {
			toast.loading("جاري تحميل الملف...");
			const fileResponse = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${doc.fileId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			toast.dismiss();

			const fileUrl = fileResponse.data?.upload?.presignedUrl || fileResponse.data?.presignedUrl;
			if (fileUrl) {
				window.open(fileUrl, "_blank");
			} else {
				toast.error("لم يتم العثور على رابط الملف");
			}
		} catch (error) {
			toast.dismiss();
			toast.error("فشل تحميل الملف");
		}
	};

	// =====================
	// File Upload Handlers (for Client)
	// =====================
	const handleFileSelect = (docName, file) => {
		// Validate file size (10MB max)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت");
			return;
		}
		
		setPendingFiles((prev) => ({
			...prev,
			[docName]: file,
		}));
	};

	const handleDeletePendingFile = (docName) => {
		setPendingFiles((prev) => {
			const newFiles = { ...prev };
			delete newFiles[docName];
			return newFiles;
		});
	};

	const handleSaveFile = async (docName) => {
		const file = pendingFiles[docName];
		if (!file) return;

		setUploadingDoc(docName);
		try {
			toast.loading(`جاري رفع ${docName}...`);

			// Step 1: Upload file to S3
			const formData = new FormData();
			formData.append("file", file);
			formData.append("category", "export_shipment");
			formData.append("relatedId", actualId);
			// Don't send documentType - it's not needed for export shipments
			// The document name is stored in the requiredDocuments array

			const uploadResponse = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/uploads`,
				formData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "multipart/form-data",
					},
				}
			);

			const uploadId = uploadResponse.data.upload?._id || uploadResponse.data.upload?.id || uploadResponse.data.uploadId;

			// Step 2: Link upload to export shipment required document
			await axios.post(
				`${import.meta.env.VITE_API_URL}/api/export-shipments/${actualId}/upload-required/${encodeURIComponent(docName)}`,
				{ uploadId },
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			toast.dismiss();
			toast.success(`تم رفع ${docName} بنجاح`);

			// Clear pending file
			handleDeletePendingFile(docName);
			fetchShipmentDetails();
		} catch (error) {
			toast.dismiss();
			const errorMsg = error.response?.data?.message || "فشل في رفع الملف";
			toast.error(errorMsg);
		} finally {
			setUploadingDoc(null);
		}
	};

	if (loading) {
		return (
			<div className={`min-h-screen transition-colors ${isDarkMode ? "bg-[#0a0505] text-gray-200" : "bg-gray-50 text-gray-800"}`}>
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className={`max-w-5xl mx-auto p-6 sm:p-10 rounded-2xl shadow-sm ${isDarkMode ? "bg-[#1a1010]/80" : "bg-white"}`}>
						<div className="flex justify-center items-center py-12 gap-4">
							<div className={`spinner border-4 rounded-full w-12 h-12 animate-spin ${isDarkMode ? "border-gray-700 border-t-red-700" : "border-gray-300 border-t-red-800"}`}></div>
							<span className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
								جاري تحميل بيانات الشحنة...
							</span>
						</div>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	if (!shipment) {
		return (
			<div className={`min-h-screen transition-colors ${isDarkMode ? "bg-[#0a0505] text-gray-200" : "bg-gray-50 text-gray-800"}`}>
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className={`max-w-5xl mx-auto p-6 sm:p-10 rounded-2xl shadow-sm text-center ${isDarkMode ? "bg-[#1a1010]/80" : "bg-white"}`}>
						<span className="text-6xl mb-4 block">❌</span>
						<p className={`mb-4 text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>الشحنة غير موجودة</p>
						<button
							onClick={() =>
								navigate(
									userType === "employee"
										? "/employee/export-shipments"
										: "/export-shipments"
								)
							}
							className="px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-700 transition font-bold"
						>
							العودة للشحنات
						</button>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	const statusConfig = STATUS_CONFIG[shipment.currentStatus] || STATUS_CONFIG.documents_verification;
	const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === shipment.currentStatus);
	const progressPercent = Math.round(((currentStepIndex + 1) / STATUS_STEPS.length) * 100);

	return (
		<div className={`min-h-screen transition-colors ${isDarkMode ? "bg-[#0a0505] text-gray-200" : "bg-gray-50 text-gray-800"}`}>
			<Header />

			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className={`max-w-5xl mx-auto p-6 sm:p-10 rounded-2xl shadow-sm transition-colors ${isDarkMode ? "bg-[#1a1010]/80" : "bg-white"}`}>
					{/* Back Button */}
					<button
						onClick={() =>
							navigate(
								userType === "employee"
									? "/employee/export-shipments"
									: "/export-shipments"
							)
						}
						className={`mb-6 flex items-center gap-2 font-medium ${isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-800 hover:text-red-600"}`}
					>
						<span>→</span>
						<span>العودة للشحنات</span>
					</button>

					{/* Header with Status Badge */}
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-4">
							<span className="text-4xl">
								{shipment.shippingMethod === "air" ? "✈️" : "🚢"}
							</span>
							<div>
								<h1 className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
									شحنة تصديرية - {shipment.shippingMethod === "air" ? "جوي" : "بحري"}
								</h1>
								<p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
									رقم الشحنة: {shipment.shipmentNumber || `#${shipment._id?.slice(-8)}`}
								</p>
							</div>
						</div>
						<span
							className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${statusConfig.color}`}
						>
							{statusConfig.icon} {statusConfig.label}
						</span>
					</div>

					{/* Top Illustration */}
					<div className="flex justify-center mb-8">
						<img
							src={mainIllustration}
							alt="Export Shipment Illustration"
							className="w-full max-w-md h-auto"
						/>
					</div>

					{/* Progress Stepper */}
					<div className={`rounded-xl p-6 mb-8 transition-colors ${isDarkMode ? "bg-white/5 border border-white/10" : "bg-gray-50"}`}>
						<div className="flex items-center justify-between mb-4">
							<h2 className={`text-xl font-bold ${isDarkMode ? "text-red-400" : "text-red-900"}`}>حالة الشحنة</h2>
							{currentStepIndex >= 0 && (
								<span className={`text-sm font-bold px-3 py-1 rounded-full ${isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-800"}`}>
									{progressPercent}% مكتمل
								</span>
							)}
						</div>
						<ExportStepper currentStatus={shipment.currentStatus} isDarkMode={isDarkMode} />
					</div>

					{/* Cancel Reason */}
					{shipment.currentStatus === "cancelled" && shipment.notes && (
						<div className={`border-2 rounded-xl p-4 mb-6 ${isDarkMode ? "bg-red-900/20 border-red-700/50" : "bg-red-50 border-red-200"}`}>
							<p className={`font-bold mb-2 ${isDarkMode ? "text-red-400" : "text-red-800"}`}>سبب الإلغاء:</p>
							<p className={isDarkMode ? "text-red-300" : "text-red-700"}>{shipment.notes}</p>
						</div>
					)}

					{/* UCR Number Display (if issued) */}
					{shipment.ucrRequestId?.ucrNumber && (
						<div className={`border-2 rounded-xl p-4 mb-6 text-center ${isDarkMode ? "bg-indigo-900/30 border-indigo-700/50" : "bg-indigo-50 border-indigo-200"}`}>
							<p className={`font-bold mb-2 ${isDarkMode ? "text-indigo-300" : "text-indigo-800"}`}>رقم UCR</p>
							<p className={`text-3xl font-mono ${isDarkMode ? "text-indigo-200" : "text-indigo-900"}`}>
								{shipment.ucrRequestId.ucrNumber}
							</p>
						</div>
					)}

					{/* Data Fields Section */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-8 mb-8">
						{/* Client Name - Show to employees */}
						{userType === "employee" && shipment.userId && (
							<Datafield
								label="اسم العميل"
								value={shipment.userId.fullname || shipment.userId.name || "غير محدد"}
								icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
							/>
						)}
						<Datafield
							label="رقم الشحنة"
							value={shipment.shipmentNumber || "—"}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						<Datafield
							label="نوع الشحن"
							value={shipment.shippingMethod === "air" ? "✈️ جوي" : "🚢 بحري"}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						<Datafield
							label="بلد الوجهة"
							value={shipment.destinationCountry || "غير محدد"}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						<Datafield
							label={shipment.shippingMethod === "air" ? "المطار" : "الميناء"}
							value={shipment.destinationPort || "غير محدد"}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						{shipment.ucrRequestId?.valueInEGP && (
							<Datafield
								label="قيمة البضاعة"
								value={formatCurrency(shipment.ucrRequestId.valueInEGP)}
								icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
							/>
						)}
						{shipment.ucrRequestId?.certificationType && (
							<Datafield
								label="نوع الشهادة"
								value={
									shipment.ucrRequestId.certificationType === "noran"
										? "🟢 شهادة النوران"
										: "🟡 شهادة العميل"
								}
								icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
							/>
						)}
						<Datafield
							label="تاريخ الإنشاء"
							value={formatDate(shipment.createdAt)}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						<Datafield
							label="آخر تحديث"
							value={formatDate(shipment.updatedAt)}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						{shipment.estimatedShippingDate && (
							<Datafield
								label="تاريخ الشحن المتوقع"
								value={formatDate(shipment.estimatedShippingDate)}
								icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
							/>
						)}
						{shipment.actualShippingDate && (
							<Datafield
								label="تاريخ الشحن الفعلي"
								value={formatDate(shipment.actualShippingDate)}
								icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
							/>
						)}
					</div>

					{/* Certificate of Origin Section */}
					<div className={`rounded-xl p-6 mb-6 ${isDarkMode ? "bg-purple-900/20 border border-purple-700/30" : "bg-purple-50"}`}>
						<h3 className={`font-bold mb-4 ${isDarkMode ? "text-purple-300" : "text-purple-800"}`}>شهادة المنشأ</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className={`p-3 rounded-lg border ${isDarkMode ? "bg-purple-900/30 border-purple-700/40" : "bg-white border-purple-200"}`}>
								<p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>حالة الشهادة</p>
								<p className={`font-bold ${
									shipment.certificateOfOriginStatus === "issued" 
										? isDarkMode ? "text-green-400" : "text-green-600" 
										: shipment.certificateOfOriginStatus === "pending" 
											? isDarkMode ? "text-yellow-400" : "text-yellow-600" 
											: isDarkMode ? "text-gray-500" : "text-gray-400"
								}`}>
									{shipment.certificateOfOriginStatus === "issued" ? "صادرة" : 
									 shipment.certificateOfOriginStatus === "pending" ? "قيد الإصدار" : 
									 "لم يتم التقديم"}
								</p>
							</div>
							{shipment.certificateOfOriginNumber && (
								<div className={`p-3 rounded-lg border ${isDarkMode ? "bg-purple-900/30 border-purple-700/40" : "bg-white border-purple-200"}`}>
									<p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>رقم الشهادة</p>
									<p className={`font-mono font-bold ${isDarkMode ? "text-purple-300" : "text-purple-800"}`}>
										{shipment.certificateOfOriginNumber}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Sea Shipment: Container Info */}
					{shipment.shippingMethod === "sea" && shipment.containerWeights && shipment.containerWeights.length > 0 && (
						<div className={`rounded-xl p-6 mb-6 ${isDarkMode ? "bg-blue-900/20 border border-blue-700/30" : "bg-blue-50"}`}>
							<h3 className={`font-bold mb-3 ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
								أوزان الحاويات ({shipment.containerWeights.length} حاوية)
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
								{shipment.containerWeights.map((container, idx) => (
									<div key={idx} className={`p-3 rounded-lg border ${isDarkMode ? "bg-blue-900/30 border-blue-700/40" : "bg-white border-blue-200"}`}>
										<p className={`text-xs ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
											{container.containerNumber || `حاوية ${idx + 1}`}
										</p>
										<p className={`text-xl font-bold ${isDarkMode ? "text-blue-200" : "text-blue-800"}`}>
											{container.weight?.toLocaleString() || container} {container.unit || "كجم"}
										</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Status History */}
					{shipment.statusHistory && shipment.statusHistory.length > 0 && (
						<div className={`rounded-xl p-6 mb-6 ${isDarkMode ? "bg-white/5 border border-white/10" : "bg-gray-50"}`}>
							<h3 className={`font-bold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>سجل الحالات</h3>
							<div className="relative">
								{/* Timeline Line */}
								<div className={`absolute right-4 top-2 bottom-2 w-0.5 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />

								<div className="space-y-4">
									{shipment.statusHistory
										.slice()
										.reverse()
										.map((history, index) => {
											const historyConfig =
												STATUS_CONFIG[history.status] || STATUS_CONFIG.documents_verification;
											return (
												<div key={index} className="flex gap-4 pr-2">
													{/* Timeline Dot */}
													<div
														className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
															index === 0
																? isDarkMode ? "bg-red-700 text-white" : "bg-red-800 text-white"
																: isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
														}`}
													>
														{historyConfig.icon}
													</div>
													<div className={`flex-1 p-3 rounded-lg border ${isDarkMode ? "bg-[#1a1010] border-white/10" : "bg-white border-gray-200"}`}>
														<div className="flex justify-between items-start">
															<div>
																<p className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
																	{historyConfig.label}
																</p>
																{history.notes && (
																	<p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
																		{history.notes}
																	</p>
																)}
															</div>
															<span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
																{formatDate(history.timestamp)}
															</span>
														</div>
													</div>
												</div>
											);
										})}
								</div>
							</div>
						</div>
					)}

					{/* Shipment Notes */}
					{shipment.notes && (
						<div className={`rounded-xl p-6 mb-6 border ${isDarkMode ? "bg-amber-900/20 border-amber-700/30" : "bg-yellow-50 border-yellow-200"}`}>
							<h3 className={`font-bold mb-3 ${isDarkMode ? "text-amber-300" : "text-yellow-800"}`}>ملاحظات</h3>
							<p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{shipment.notes}</p>
						</div>
					)}

					{/* Documents Section from UCR Request */}
					{shipment.ucrRequestId?.uploads && shipment.ucrRequestId.uploads.length > 0 && (
						<div className={`rounded-xl p-6 mb-6 ${isDarkMode ? "bg-green-900/20 border border-green-700/30" : "bg-green-50"}`}>
							<h3 className={`font-bold mb-3 ${isDarkMode ? "text-green-300" : "text-green-800"}`}>
								المستندات المرفقة ({shipment.ucrRequestId.uploads.length})
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
								{shipment.ucrRequestId.uploads.map((doc, index) => {
									const docLabels = {
										bank_waiver: "إعفاء بنكي",
										export_invoice: "فاتورة التصدير",
										export_packing_list: "قائمة التعبئة",
										shipping_permit: "تصريح الشحن",
										awb: "بوليصة الشحن الجوي",
										bl: "بوليصة الشحن البحري",
									};
									const fileId = doc._id || doc.id;
									const fileName = doc.originalname || doc.filename || "document";
									return (
										<div
											key={index}
											className={`flex items-center justify-between p-3 rounded-lg border ${
												isDarkMode 
													? "bg-green-900/30 border-green-700/40" 
													: "bg-white border-green-200"
											}`}
										>
											<div className="flex items-center gap-2">
												<span className={`text-xl ${isDarkMode ? "text-green-400" : "text-green-600"}`}>📄</span>
												<div>
													<p className={`font-medium text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
														{docLabels[doc.documentType] || doc.documentType}
													</p>
													<p className={`text-xs truncate max-w-[120px] ${isDarkMode ? "text-gray-500" : "text-gray-500"}`} title={fileName}>
														{fileName}
													</p>
												</div>
											</div>
											<div className="flex gap-1">
												{doc.url && (
													<a
														href={doc.url}
														target="_blank"
														rel="noopener noreferrer"
														className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition flex items-center gap-1"
														title="عرض"
													>
														<Eye className="w-4 h-4" />
													</a>
												)}
												{fileId && (
													<button
														onClick={() => handleProxyDownload(fileId, fileName)}
														className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700 transition flex items-center gap-1"
														title="تحميل"
													>
														<Download className="w-4 h-4" />
													</button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Required Documents Section - Employee can request, Client can upload */}
					{(shipment.requiredDocuments?.length > 0 || userType === "employee") && (
						<div className={`rounded-xl p-6 mb-6 border-2 ${isDarkMode ? "bg-orange-900/20 border-orange-700/40" : "bg-orange-50 border-orange-200"}`}>
							<div className="flex justify-between items-center mb-4">
								<h3 className={`font-bold ${isDarkMode ? "text-orange-300" : "text-orange-800"}`}>
									المستندات المطلوبة
									{shipment.requiredDocuments?.length > 0 && (
										<span className="text-sm font-normal mr-2">
											({shipment.requiredDocuments.filter(d => d.uploaded).length}/{shipment.requiredDocuments.length} مكتمل)
										</span>
									)}
								</h3>
								{userType === "employee" && (
									<button
										onClick={() => setShowDocumentRequestModal(true)}
										className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition flex items-center gap-2 text-sm font-medium"
									>
										<span>+</span>
										<span>طلب مستندات</span>
									</button>
								)}
							</div>

							{shipment.requiredDocuments?.length > 0 ? (
								<div className="space-y-3">
									{shipment.requiredDocuments.map((doc) => (
										<div
											key={doc._id}
											className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border-2 ${
												doc.uploaded
													? isDarkMode 
														? "bg-green-900/20 border-green-700/40" 
														: "bg-green-50 border-green-200"
													: isDarkMode 
														? "bg-yellow-900/20 border-yellow-700/40" 
														: "bg-yellow-50 border-yellow-200"
											}`}
										>
											<div className="flex items-center gap-3 mb-2 sm:mb-0">
												<span className={`text-2xl ${doc.uploaded 
													? isDarkMode ? "text-green-400" : "text-green-600" 
													: isDarkMode ? "text-yellow-400" : "text-yellow-600"
												}`}>
													{doc.uploaded ? "✅" : "⏳"}
												</span>
												<div>
													<p className={`font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{doc.name}</p>
													<p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
														{doc.uploaded
															? `تم الرفع: ${formatDate(doc.uploadedAt)}`
															: `تم الطلب: ${formatDate(doc.requestedAt)}`}
													</p>
												</div>
											</div>

											{/* Employee View: View/Delete buttons for uploaded documents */}
											{userType === "employee" && doc.uploaded && doc.fileId && (
												<div className="flex gap-2">
													<button
														onClick={() => handleViewDocument(doc)}
														className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-1"
													>
														<Eye className="w-4 h-4" />
														<span>عرض</span>
													</button>
													<button
														onClick={() => handleProxyDownload(doc.fileId, doc.name || "document")}
														className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-1"
													>
														<Download className="w-4 h-4" />
														<span>تحميل</span>
													</button>
													<button
														onClick={() => handleDeleteSavedDocument(doc)}
														disabled={deletingDoc === doc._id}
														className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-1 disabled:opacity-50"
													>
														<span>{deletingDoc === doc._id ? "جاري الحذف..." : "حذف"}</span>
														<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
														</svg>
													</button>
												</div>
											)}

											{/* Client View: View/Download buttons for uploaded documents */}
											{userType !== "employee" && doc.uploaded && doc.fileId && (
												<div className="flex gap-2">
													<button
														onClick={() => handleViewDocument(doc)}
														className="bg-blue-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-1 text-sm"
													>
														<Eye className="w-4 h-4" />
													</button>
													<button
														onClick={() => handleProxyDownload(doc.fileId, doc.name || "document")}
														className="bg-green-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-1 text-sm"
													>
														<Download className="w-4 h-4" />
													</button>
												</div>
											)}

											{/* Employee View: Delete button for pending (not uploaded) documents */}
											{userType === "employee" && !doc.uploaded && (
												<button
													onClick={() => handleDeleteSavedDocument(doc)}
													disabled={deletingDoc === doc._id}
													className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-1 disabled:opacity-50"
												>
													<span>{deletingDoc === doc._id ? "جاري الحذف..." : "حذف الطلب"}</span>
													<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
														<path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
													</svg>
												</button>
											)}

											{/* Client View: Upload section */}
											{userType !== "employee" && !doc.uploaded && (
												<div className="w-full sm:w-auto mt-3 sm:mt-0">
													{pendingFiles[doc.name] ? (
														<div className="flex items-center gap-2 flex-wrap">
															<span className="text-sm text-gray-600 max-w-[150px] truncate">
																📎 {pendingFiles[doc.name].name}
															</span>
															<button
																onClick={() => {
																	const file = pendingFiles[doc.name];
																	const fileUrl = URL.createObjectURL(file);
																	window.open(fileUrl, "_blank");
																}}
																className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition text-sm"
															>
																عرض
															</button>
															<button
																onClick={() => handleSaveFile(doc.name)}
																disabled={uploadingDoc === doc.name}
																className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
															>
																{uploadingDoc === doc.name ? "جاري الرفع..." : "حفظ"}
															</button>
															<button
																onClick={() => handleDeletePendingFile(doc.name)}
																disabled={uploadingDoc === doc.name}
																className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
															>
																حذف
															</button>
														</div>
													) : (
														<label className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer flex items-center gap-2">
															<span>📤 اختر ملف</span>
															<input
																type="file"
																accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
																className="hidden"
																onChange={(e) => {
																	const file = e.target.files?.[0];
																	if (file) {
																		handleFileSelect(doc.name, file);
																	}
																}}
															/>
														</label>
													)}
												</div>
											)}

											{/* Client View: Already uploaded - show view/download buttons */}
											{userType !== "employee" && doc.uploaded && doc.fileId && (
												<div className="flex gap-2">
													<button
														onClick={() => handleViewDocument(doc)}
														className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-1"
													>
														<span>عرض</span>
														<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
															<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
															<path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
														</svg>
													</button>
													<span className="text-green-600 font-medium flex items-center gap-1 px-2">
														✅ تم الرفع
													</span>
												</div>
											)}
											
											{/* Client View: Already uploaded but no fileId */}
											{userType !== "employee" && doc.uploaded && !doc.fileId && (
												<span className="text-green-600 font-medium flex items-center gap-1">
													✅ تم الرفع
												</span>
											)}
										</div>
									))}
								</div>
							) : (
								<p className={`text-center py-4 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
									{userType === "employee" 
										? "لم يتم طلب أي مستندات بعد. انقر على 'طلب مستندات' لطلب مستندات من العميل."
										: "لا توجد مستندات مطلوبة حالياً."
									}
								</p>
							)}
						</div>
					)}

					{/* Action Buttons */}
					<div className={`flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-6 border-t-2 ${isDarkMode ? "border-white/10" : "border-gray-200"}`}>
						{/* Back to list */}
						<button
							onClick={() =>
								navigate(
									userType === "employee"
										? "/employee/export-shipments"
										: "/export-shipments"
								)
							}
							className={`w-full sm:w-auto px-6 py-3 font-bold rounded-lg transition ${
								isDarkMode 
									? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							← العودة للشحنات
						</button>

						{/* View UCR Request */}
						{shipment.ucrRequestId?._id && (
							<button
								onClick={() => navigate(
									userType === "employee" 
										? `/employee/ucr-request/${shipment.ucrRequestId._id}`
										: `/ucr-request/${shipment.ucrRequestId._id}`
								)}
								className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
							>
								<span>عرض طلب UCR</span>
							</button>
						)}

						{/* Shipment History Button (for employees) */}
						{userType === "employee" && (
							<button
								onClick={() => navigate(`/export-shipment-history/${actualId}`)}
								className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
							>
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
										clipRule="evenodd"
									/>
								</svg>
								<span>تاريخ الشحنة</span>
							</button>
						)}

						{/* Completed message */}
						{shipment.currentStatus === "completed" && (
							<span className={`w-full sm:w-auto px-6 py-3 font-bold rounded-lg flex items-center justify-center gap-2 ${
								isDarkMode 
									? "bg-green-900/30 text-green-400" 
									: "bg-green-100 text-green-800"
							}`}>
								<span>تم إكمال الشحنة بنجاح!</span>
							</span>
						)}
					</div>
				</div>
			</main>

			{/* Request Documents Modal (for Employee) */}
			<RequestDocumentsModal
				isOpen={showDocumentRequestModal}
				onClose={() => {
					setShowDocumentRequestModal(false);
					setDocumentName("");
					setRequiredDocuments([]);
				}}
				newDocument={documentName}
				onNewDocumentChange={setDocumentName}
				requiredDocuments={requiredDocuments}
				onAddDocument={handleAddDocumentRequest}
				onRemoveDocument={handleRemoveDocumentRequest}
				onSave={handleSaveDocumentRequests}
				uploading={savingDocuments}
			/>

			<Footer />
		</div>
	);
};

export default ExportShipmentDetailsPage;
