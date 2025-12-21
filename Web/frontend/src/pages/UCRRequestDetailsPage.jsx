import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Datafield from "../components/DataField";
import contractIcon from "../assets/images/contract.png";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";
import { useTheme } from "../context/ThemeContext";
import { ArrowRight, FileText, Eye, Download } from "lucide-react";
import FileViewerModal from "../components/FileViewerModal";

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

// UCR Status configurations
const STATUS_CONFIG = {
	pending: {
		label: "قيد المراجعة",
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		icon: "⏳",
		step: 1,
	},
	under_review: {
		label: "قيد التدقيق",
		color: "bg-blue-100 text-blue-800 border-blue-200",
		icon: "🔍",
		step: 2,
	},
	approved: {
		label: "معتمد",
		color: "bg-green-100 text-green-800 border-green-200",
		icon: "✅",
		step: 3,
	},
	ucr_issued: {
		label: "تم إصدار UCR",
		color: "bg-indigo-100 text-indigo-800 border-indigo-200",
		icon: "📋",
		step: 4,
	},
	rejected: {
		label: "مرفوض",
		color: "bg-red-100 text-red-800 border-red-200",
		icon: "❌",
		step: -1,
	},
	needs_revision: {
		label: "يحتاج تعديل",
		color: "bg-orange-100 text-orange-800 border-orange-200",
		icon: "⚠️",
		step: 0,
	},
};

// Document type labels
const DOCUMENT_LABELS = {
	bank_waiver: "التنازل البنكي",
	export_invoice: "الفاتورة الأصلية",
	export_packing_list: "كشف العبوة",
	shipping_permit: "إذن الشحن",
	awb: "بوليصة الشحن الجوي (AWB)",
	bl: "بوليصة الشحن البحري (B/L)",
};

// UCR Progress Stepper Component
const UCRStepper = ({ currentStatus, isDarkMode }) => {
	const steps = [
		{ key: "pending", label: "قيد المراجعة" },
		{ key: "under_review", label: "قيد التدقيق" },
		{ key: "approved", label: "معتمد" },
		{ key: "ucr_issued", label: "تم إصدار UCR" },
	];

	const getStepIndex = (status) => {
		const statusMap = {
			pending: 0,
			under_review: 1,
			approved: 2,
			ucr_issued: 3,
		};
		return statusMap[status] ?? 0;
	};

	const activeStepIndex = getStepIndex(currentStatus);

	// Special case for rejected/needs_revision - show as step 0
	if (currentStatus === "rejected" || currentStatus === "needs_revision") {
		return (
			<div className="w-full py-4">
				<div className={`border rounded-lg p-4 text-center ${
					isDarkMode 
						? "bg-red-900/20 border-red-800" 
						: "bg-red-50 border-red-200"
				}`}>
					<span className="text-3xl mb-2 block">
						{currentStatus === "rejected" ? "❌" : "⚠️"}
					</span>
					<p className={`font-bold ${
						isDarkMode ? "text-red-400" : "text-red-800"
					}`}>
						{currentStatus === "rejected" ? "تم رفض الطلب" : "يحتاج تعديل"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full pb-4">
			<div className="flex items-start justify-between py-6 px-2">
				{steps.map((step, index) => {
					const isActive = index <= activeStepIndex;
					const isCurrent = index === activeStepIndex;
					const isLastStep = index === steps.length - 1;

					// Circle Color
					const circleClass = isActive
						? isCurrent
							? isDarkMode ? "bg-red-600 ring-4 ring-red-900" : "bg-red-900 ring-4 ring-red-200"
							: isDarkMode ? "bg-red-800" : "bg-red-900"
						: isDarkMode ? "bg-gray-700" : "bg-gray-300";

					// Text Color
					const textClass = isActive
						? isDarkMode ? "text-red-400 font-bold" : "text-red-900 font-bold"
						: isDarkMode ? "text-gray-500" : "text-gray-400";
					
					// Line Color
					const nextStepIsActive =
						index < steps.length - 1 && index + 1 <= activeStepIndex;
					const lineClass = nextStepIsActive 
						? isDarkMode ? "bg-red-800" : "bg-red-900" 
						: isDarkMode ? "bg-gray-700" : "bg-gray-300";

					return (
						<React.Fragment key={step.key}>
							<div className="flex flex-col items-center text-center flex-1">
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
									className={`mt-3 text-sm ${textClass} px-1 max-w-[100px]`}
									style={{ lineHeight: "1.3" }}
								>
									{step.label}
								</p>
							</div>
							{!isLastStep && (
								<div
									className={`h-1.5 transition-colors duration-500 ${lineClass} self-start`}
									style={{
										width: "100%",
										maxWidth: "120px",
										marginTop: "18px",
										flexShrink: 1,
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

const UCRRequestDetailsPage = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	const [loading, setLoading] = useState(true);
	const [request, setRequest] = useState(null);
	const [userType, setUserType] = useState("client");
	const [viewerData, setViewerData] = useState({ open: false, url: null, name: null, type: null });
	
	// Document review state (for employees)
	const [docReviewModal, setDocReviewModal] = useState({ open: false, doc: null, action: null });
	const [docReviewNotes, setDocReviewNotes] = useState("");
	const [processingDocReview, setProcessingDocReview] = useState(false);

	// Check user type on mount
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const user = JSON.parse(storedUser);
			setUserType(user.type || "client");
		}
	}, []);

	// Fetch request details
	const fetchRequestDetails = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				toast.error("يجب تسجيل الدخول أولاً");
				navigate("/login");
				return;
			}

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/ucr/${requestId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setRequest(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching UCR request details:", error);
			if (error.response?.status === 404) {
				toast.error("الطلب غير موجود");
				navigate(userType === "employee" ? "/employee/ucr-requests" : "/ucr-requests");
			} else if (error.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else {
				toast.error("فشل في جلب تفاصيل الطلب");
			}
		} finally {
			setLoading(false);
		}
	}, [requestId, navigate, userType]);

	useEffect(() => {
		fetchRequestDetails();
	}, [fetchRequestDetails]);

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

	// Handle delete
	const handleDelete = async () => {
		if (
			!window.confirm(
				"هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
			)
		) {
			return;
		}

		try {
			const token = localStorage.getItem("token");
			const response = await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/ucr/${requestId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("تم حذف الطلب بنجاح");
				navigate("/ucr-requests");
			}
		} catch (error) {
			console.error("Error deleting request:", error);
			toast.error(error.response?.data?.message || "فشل في حذف الطلب");
		}
	};

	// Handle track shipment navigation
	const handleTrackShipment = () => {
		if (request.hasExportShipment && request.exportShipmentId) {
			// Get the actual shipment ID
			const shipmentId = request.exportShipmentId._id || request.exportShipmentId;
			if (userType === "employee") {
				// Navigate to specific export shipment details page for employee
				navigate(`/employee/export-shipment/${shipmentId}`);
			} else {
				navigate(`/export-shipment/${shipmentId}`);
			}
		}
	};

	// Handle document review (for employees)
	const handleDocumentReview = async (status) => {
		if (!docReviewModal.doc) return;
		
		// Require notes for rejection and revision
		if ((status === "rejected" || status === "needs_revision") && !docReviewNotes.trim()) {
			toast.error("يجب إدخال سبب الرفض أو ملاحظات التعديل");
			return;
		}

		setProcessingDocReview(true);
		try {
			const token = localStorage.getItem("token");
			const uploadId = docReviewModal.doc._id || docReviewModal.doc.id;
			
			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/ucr/employee/${requestId}/document/${uploadId}/status`,
				{
					status,
					employeeNotes: docReviewNotes.trim() || undefined,
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				const messages = {
					approved: "تم اعتماد المستند بنجاح",
					rejected: "تم رفض المستند",
					needs_revision: "تم طلب تعديل المستند",
					pending: "تم إعادة تعيين حالة المستند",
				};
				toast.success(messages[status] || "تم تحديث حالة المستند");
				setDocReviewModal({ open: false, doc: null, action: null });
				setDocReviewNotes("");
				fetchRequestDetails(); // Refresh data
			}
		} catch (error) {
			console.error("Error updating document status:", error);
			toast.error(error.response?.data?.message || "فشل في تحديث حالة المستند");
		} finally {
			setProcessingDocReview(false);
		}
	};

	// Open document review modal
	const openDocReviewModal = (doc, action) => {
		setDocReviewModal({ open: true, doc, action });
		setDocReviewNotes("");
	};

	// Close document review modal
	const closeDocReviewModal = () => {
		setDocReviewModal({ open: false, doc: null, action: null });
		setDocReviewNotes("");
	};

	if (loading) {
		return (
			<div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`}>
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className={`max-w-5xl mx-auto p-6 sm:p-10 rounded-3xl shadow-sm ${
						isDarkMode ? "bg-[#1a1010]/80 border border-white/10" : "bg-white"
					}`}>
						<div className="flex justify-center items-center py-12 gap-4">
							<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
							<span className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
								جاري تحميل بيانات الطلب...
							</span>
						</div>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	if (!request) {
		return (
			<div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`}>
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className={`max-w-5xl mx-auto p-6 sm:p-10 rounded-3xl shadow-sm text-center ${
						isDarkMode ? "bg-[#1a1010]/80 border border-white/10" : "bg-white"
					}`}>
						<span className="text-6xl mb-4 block">❌</span>
						<p className={`mb-4 text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>الطلب غير موجود</p>
						<button
							onClick={() =>
								navigate(
									userType === "employee"
										? "/employee/ucr-requests"
										: "/ucr-requests"
								)
							}
							className="px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-700 transition font-bold"
						>
							العودة للطلبات
						</button>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;

	return (
		<div className={`min-h-screen flex flex-col transition-colors duration-300 relative overflow-hidden ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`}>
			{/* Animated Background Elements */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				{isDarkMode ? (
					<>
						<div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#690000]/20 rounded-full filter blur-[100px] animate-pulse-glow"></div>
						<div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#2b0000]/30 rounded-full filter blur-[120px] animate-float-slow"></div>
					</>
				) : (
					<>
						<div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#ffcccc]/40 rounded-full filter blur-[100px] animate-pulse-glow"></div>
						<div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#ffe6e6]/60 rounded-full filter blur-[120px] animate-float-slow"></div>
					</>
				)}
			</div>

			<Header />

			<main className="flex-grow relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className={`max-w-5xl mx-auto p-6 sm:p-10 rounded-3xl shadow-2xl border backdrop-blur-xl transition-all duration-300 ${
					isDarkMode 
						? "bg-[#1a1010]/80 border-white/10 text-gray-200" 
						: "bg-white/90 border-white/40 text-gray-800"
				}`}>
					{/* Back Button */}
					{/* Back Button */}
					<button
						onClick={() =>
							navigate(
								userType === "employee"
									? "/employee/ucr-requests"
									: "/ucr-requests"
							)
						}
						className={`mb-6 flex items-center gap-2 font-medium transition-colors ${
							isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-800 hover:text-red-600"
						}`}
					>
						<ArrowRight className="w-5 h-5" />
						<span>العودة للطلبات</span>
					</button>

					{/* Header with Status Badge */}
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-4">
							<span className="text-4xl">
								{request.shippingMethod === "air" ? "✈️" : "🚢"}
							</span>
							<div>
								<h1 className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
									طلب UCR - {request.shippingMethod === "air" ? "جوي" : "بحري"}
								</h1>
								<p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"} text-sm`}>
									رقم الطلب: {request.ucrNumber || `#${request._id?.slice(-8)}`}
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
							alt="UCR Request Illustration"
							className="w-full max-w-md h-auto"
						/>
					</div>

					{/* UCR Progress Stepper */}
					<div className={`rounded-3xl p-6 mb-8 border transition-colors ${
						isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
					}`}>
						<h2 className={`text-xl font-bold text-center mb-4 ${isDarkMode ? "text-red-400" : "text-red-900"}`}>
							حالة الطلب
						</h2>
						<UCRStepper currentStatus={request.status} isDarkMode={isDarkMode} />
					</div>

					{/* Rejection/Revision Reason */}
					{request.status === "rejected" && request.rejectionReason && (
						<div className={`border-2 rounded-xl p-4 mb-6 ${
							isDarkMode 
								? "bg-red-900/20 border-red-700/50" 
								: "bg-red-50 border-red-200"
						}`}>
							<p className={`font-bold mb-2 ${isDarkMode ? "text-red-400" : "text-red-800"}`}>سبب الرفض:</p>
							<p className={isDarkMode ? "text-red-300" : "text-red-700"}>{request.rejectionReason}</p>
						</div>
					)}

					{request.status === "needs_revision" && (
						<div className={`border-2 rounded-xl p-4 mb-6 ${
							isDarkMode 
								? "bg-orange-900/20 border-orange-700/50" 
								: "bg-orange-50 border-orange-200"
						}`}>
							<p className={`font-bold mb-2 ${isDarkMode ? "text-orange-400" : "text-orange-800"}`}>
								مطلوب تعديل المستندات التالية:
							</p>
							
							{/* Show specific documents that need revision */}
							{request.documentStatuses?.filter(ds => ds.status === "needs_revision").length > 0 ? (
								<div className="space-y-2 mb-4">
									{request.documentStatuses.filter(ds => ds.status === "needs_revision").map((ds, idx) => {
										// Find the matching upload to get document type
										const upload = request.uploads?.find(u => 
											(u._id === ds.uploadId) || (u.id === ds.uploadId) || 
											(u._id?.toString() === ds.uploadId?.toString())
										);
										const docName = upload?.documentType 
											? DOCUMENT_LABELS[upload.documentType] || upload.documentType 
											: "مستند";
										return (
											<div key={idx} className={`rounded-lg p-3 border ${
												isDarkMode 
													? "bg-orange-900/30 border-orange-700/40" 
													: "bg-white border-orange-200"
											}`}>
												<p className={`font-bold ${isDarkMode ? "text-orange-300" : "text-orange-700"}`}>{docName}</p>
												{ds.employeeNotes && (
													<p className={`text-sm mt-1 mr-4 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>{ds.employeeNotes}</p>
												)}
											</div>
										);
									})}
								</div>
							) : request.employeeNotes ? (
								<p className={`mb-4 ${isDarkMode ? "text-orange-300" : "text-orange-700"}`}>{request.employeeNotes}</p>
							) : null}

							{userType === "client" && (
								<button
									onClick={() => navigate(`/ucr-request/${requestId}/edit`)}
									className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-bold"
								>
									تعديل الطلب الآن
								</button>
							)}
						</div>
					)}

					{/* UCR Number Display (when issued) */}
					{request.status === "ucr_issued" && request.ucrNumber && (
						<div className={`rounded-xl p-4 mb-6 text-center border-2 transition-colors ${
							isDarkMode 
								? "bg-indigo-900/30 border-indigo-700/50" 
								: "bg-indigo-50 border-indigo-200"
						}`}>
							<p className={`font-bold mb-2 ${isDarkMode ? "text-indigo-300" : "text-indigo-800"}`}>
								رقم UCR الصادر
							</p>
							<p className={`text-3xl font-mono ${isDarkMode ? "text-indigo-200" : "text-indigo-900"}`}>
								{request.ucrNumber}
							</p>
							<p className={`text-sm mt-2 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>
								صدر بتاريخ: {formatDate(request.ucrIssuedAt)}
							</p>
						</div>
					)}

					{/* Data Fields Section */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-8 mb-8">
						<Datafield
							label="نوع الشهادة"
							value={
								request.certificationType === "noran"
									? "🟢 شهادة النوران"
									: "🟡 شهادة العميل"
							}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						<Datafield
							label="طريقة الشحن"
							value={request.shippingMethod === "air" ? "✈️ جوي" : "🚢 بحري"}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						<Datafield
							label="بلد الوجهة"
							value={request.destinationCountry || "غير محدد"}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						<Datafield
							label="الميناء/المطار"
							value={request.destinationPort || "غير محدد"}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						<Datafield
							label="الوزن الإجمالي"
							value={`${request.totalWeight || 0} كجم`}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						<Datafield
							label="عدد الطرود"
							value={request.packagesCount || "—"}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						<Datafield
							label="رقم الفاتورة"
							value={request.originalInvoiceNumber || "—"}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						<Datafield
							label="تاريخ الفاتورة"
							value={formatDate(request.invoiceDate)}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						<Datafield
							label="القيمة بالجنيه المصري"
							value={formatCurrency(request.valueInEGP)}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						{request.certificationType === "noran" && (
							<Datafield
								label="رسوم التصدير (10%)"
								value={formatCurrency(request.exportFee || request.fees?.exportFee)}
								icon={
									<img src={contractIcon} alt="icon" className="w-5 h-5" />
								}
							/>
						)}
						<Datafield
							label="تاريخ الإنشاء"
							value={formatDate(request.createdAt)}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
						<Datafield
							label="آخر تحديث"
							value={formatDate(request.updatedAt)}
							icon={
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
							}
						/>
					</div>

					{/* Goods Description */}
					<div className={`rounded-3xl p-6 mb-6 border transition-colors ${
						isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
					}`}>
						<h3 className={`font-bold mb-3 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>📦 وصف البضاعة</h3>
						<p className={`p-4 rounded-xl border ${
							isDarkMode ? "bg-black/20 border-white/5 text-gray-300" : "bg-white border-gray-200 text-gray-700"
						}`}>
							{request.generalDescription || "لا يوجد وصف"}
						</p>
					</div>

					{/* Sea Shipment Type Info */}
					{request.shippingMethod === "sea" && request.seaShipmentType && (
						<div className={`rounded-3xl p-4 mb-6 border ${
							isDarkMode ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-100"
						}`}>
							<div className="flex items-center gap-3">
								<span className="text-2xl">
									{request.seaShipmentType === "fcl" || request.seaShipmentType === "containers" ? "🚢" : 
									 request.seaShipmentType === "lcl" ? "📦🚢" : "📦"}
								</span>
								<div>
									<p className={`font-bold ${isDarkMode ? "text-blue-400" : "text-blue-800"}`}>
										{request.seaShipmentType === "fcl" || request.seaShipmentType === "containers" ? "حاويات (FCL) - Full Container Load" : 
										 request.seaShipmentType === "lcl" ? "بضايع عامة (LCL) - Less than Container Load" : 
										 "طرود"}
									</p>
									<p className={`text-sm ${isDarkMode ? "text-blue-300" : "text-blue-600"}`}>
										{request.seaShipmentType === "fcl" || request.seaShipmentType === "containers" ? "شحن بحاوية كاملة أو أكثر" : 
										 request.seaShipmentType === "lcl" ? "شحن بضاعة أقل من حاوية كاملة" : 
										 "شحن بالطرود والكراتين"}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Sea Shipment: Container Info */}
					{request.shippingMethod === "sea" && request.containersCount > 0 && (
						<div className={`rounded-3xl p-6 mb-6 border transition-colors ${
							isDarkMode ? "bg-blue-900/10 border-blue-900/30" : "bg-blue-50 border-blue-100"
						}`}>
							<h3 className={`font-bold mb-3 ${isDarkMode ? "text-blue-400" : "text-blue-800"}`}>
								🚢 معلومات الحاويات ({request.containersCount} حاوية)
							</h3>
							{request.containerWeights && request.containerWeights.length > 0 ? (
								<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
									{request.containerWeights.map((container, index) => (
										<div
											key={index}
											className={`p-3 rounded-xl border ${
												isDarkMode ? "bg-[#1a1010] border-white/10" : "bg-white border-blue-200"
											}`}
										>
											<p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>حاوية {index + 1}</p>
											<p className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
												{container.containerNumber || `#${index + 1}`}
											</p>
											{container.size && (
												<p className={`text-sm font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
													{container.size === "20ft" ? "20 قدم" : 
													 container.size === "40ft" ? "40 قدم" : 
													 container.size === "40ft-hc" ? "40 قدم HC" : 
													 container.size === "45ft" ? "45 قدم" : container.size}
												</p>
											)}
											{container.weight && (
												<p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
													{container.weight}{" "}
													{container.unit === "tons" ? "طن" : "كجم"}
												</p>
											)}
										</div>
									))}
								</div>
							) : (
								<p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>عدد الحاويات: {request.containersCount}</p>
							)}
						</div>
					)}

					{/* Items List */}
					{request.items && request.items.length > 0 && (
						<div className={`rounded-3xl p-6 mb-6 border transition-colors ${
							isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
						}`}>
							<h3 className={`font-bold mb-3 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
								📋 تفاصيل البنود ({request.items.length})
							</h3>
							<div className="overflow-x-auto">
								<table className={`w-full text-sm rounded-xl overflow-hidden ${
									isDarkMode ? "bg-[#1a1010] text-gray-300" : "bg-white"
								}`}>
									<thead className={`${isDarkMode ? "bg-red-900/50 text-gray-200" : "bg-red-800 text-white"}`}>
										<tr>
											<th className="p-3 text-right">الوصف</th>
											<th className="p-3 text-right">البند الجمركي</th>
											<th className="p-3 text-right">الكمية</th>
											<th className="p-3 text-right">الوزن</th>
											<th className="p-3 text-right">القيمة</th>
										</tr>
									</thead>
									<tbody className={`divide-y ${isDarkMode ? "divide-gray-800" : "divide-gray-200"}`}>
										{request.items.map((item, index) => (
											<tr key={index} className={`transition-colors ${
												isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
											}`}>
												<td className="p-3">{item.description || "—"}</td>
												<td className="p-3 font-mono opacity-80">{item.hsCode || "—"}</td>
												<td className="p-3">
													{item.quantity} {item.unit || ""}
												</td>
												<td className="p-3">{item.weight || "—"} كجم</td>
												<td className="p-3 font-medium">{formatCurrency(item.value)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Documents Section */}
					{request.uploads && request.uploads.length > 0 && (
						<div className={`rounded-3xl p-6 mb-6 border transition-colors ${
							isDarkMode ? "bg-green-900/10 border-green-900/30" : "bg-green-50 border-green-100"
						}`}>
							<h3 className={`font-bold mb-3 ${isDarkMode ? "text-green-400" : "text-green-800"}`}>
								📄 المستندات المرفقة ({request.uploads.length})
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{request.uploads.map((doc, index) => {
									// Find document status if exists
									const docStatus = request.documentStatuses?.find(
										(ds) => ds.uploadId === doc._id || ds.uploadId === doc.id
									);
									const status = docStatus?.status || "pending";
									
									// Dynamic Status Colors
									const getStatusStyles = (s) => {
										const styles = {
											pending: isDarkMode ? "bg-yellow-900/20 border-yellow-700 text-yellow-400" : "bg-yellow-100 border-yellow-300 text-yellow-800",
											approved: isDarkMode ? "bg-green-900/20 border-green-700 text-green-400" : "bg-green-100 border-green-300 text-green-800",
											rejected: isDarkMode ? "bg-red-900/20 border-red-700 text-red-400" : "bg-red-100 border-red-300 text-red-800",
											needs_revision: isDarkMode ? "bg-orange-900/20 border-orange-700 text-orange-400" : "bg-orange-100 border-orange-300 text-orange-800",
										};
										return styles[s] || styles.pending;
									};
									
									const statusStyle = getStatusStyles(status);
									const statusLabel = {
										pending: "قيد المراجعة",
										approved: "معتمد",
										rejected: "مرفوض",
										needs_revision: "يحتاج تعديل"
									}[status] || "قيد المراجعة";
									
									const statusIcon = {
										pending: "⏳",
										approved: "✅",
										rejected: "❌",
										needs_revision: "⚠️"
									}[status] || "⏳";

									return (
										<div
											key={index}
											className={`p-3 rounded-lg border-2 ${statusStyle}`}
										>
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<span className="text-xl">📄</span>
													<div>
														<p className={`font-medium text-sm ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
															{DOCUMENT_LABELS[doc.documentType] || doc.documentType}
														</p>
														<p className={`text-xs truncate max-w-[200px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
															{doc.originalname || doc.filename || "مستند"}
														</p>
													</div>
												</div>
												<span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 font-bold ${
													isDarkMode ? "bg-black/40" : "bg-white/50"
												}`}>
													{statusIcon} {statusLabel}
												</span>
											</div>
											
											{/* Employee notes if any */}
											{docStatus?.employeeNotes && (
												<div className={`mt-2 p-2 rounded text-sm ${
													isDarkMode ? "bg-black/20 text-gray-300" : "bg-white text-gray-800"
												}`}>
													<span className="opacity-70">💬 ملاحظة: </span>
													<span>{docStatus.employeeNotes}</span>
												</div>
											)}

											{/* Action buttons */}
											<div className="mt-2 flex justify-between items-center gap-2">
												{/* View and Download buttons */}
												{doc.url && (
													<div className="flex gap-2">
														<button
															onClick={() => setViewerData({
																open: true,
																url: doc.url,
																name: doc.originalname || doc.filename || "المستند",
																type: doc.mimetype || (doc.filename?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
																fileId: doc._id
															})}
															className={`px-3 py-1 rounded text-sm transition flex items-center gap-1 ${
																isDarkMode 
																	? "bg-blue-600 hover:bg-blue-500 text-white" 
																	: "bg-blue-600 hover:bg-blue-700 text-white"
															}`}
														>
															<Eye className="w-3 h-3" />
															عرض
														</button>
														<button
															onClick={() => handleProxyDownload(doc._id, doc.originalname || doc.filename || "document")}
															className={`px-3 py-1 rounded text-sm transition flex items-center gap-1 ${
																isDarkMode
																	? "bg-gray-700 hover:bg-gray-600 text-white"
																	: "bg-gray-600 hover:bg-gray-700 text-white"
															}`}
														>
															<Download className="w-3 h-3" />
															تحميل
														</button>
													</div>
												)}
												
												{/* Employee review buttons - always visible for employees */}
												{userType === "employee" && (
													<div className="flex gap-1 flex-wrap">
														{/* Show approve/revision/reject for pending documents */}
														{status === "pending" && (
															<>
																<button
																	onClick={() => openDocReviewModal(doc, "approve")}
																	className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition"
																>
																	اعتماد
																</button>
																<button
																	onClick={() => openDocReviewModal(doc, "revision")}
																	className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 transition"
																>
																	طلب تعديل
																</button>
																<button
																	onClick={() => openDocReviewModal(doc, "reject")}
																	className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition"
																>
																	رفض
																</button>
															</>
														)}
														{/* Show reset button for non-pending documents (already reviewed) */}
														{status !== "pending" && (
															<button
																onClick={() => openDocReviewModal(doc, "reset")}
																className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700 transition"
															>
																🔄 إعادة تعيين
															</button>
														)}
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* No documents message */}
					{(!request.uploads || request.uploads.length === 0) && (
						<div className={`rounded-xl p-6 mb-6 text-center ${
							isDarkMode ? "bg-gray-800/50" : "bg-gray-50"
						}`}>
							<span className="text-3xl mb-2 block">📭</span>
							<p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>لم يتم رفع أي مستندات بعد</p>
						</div>
					)}

					{/* Client Notes */}
					{request.clientNotes && (
						<div className={`rounded-xl p-6 mb-6 border transition-colors ${
							isDarkMode 
								? "bg-amber-900/20 border-amber-700/30" 
								: "bg-yellow-50 border-yellow-200"
						}`}>
							<h3 className={`font-bold mb-3 ${isDarkMode ? "text-amber-300" : "text-yellow-800"}`}>
								ملاحظات العميل
							</h3>
							<p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{request.clientNotes}</p>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-200/20">
						{/* Back to list */}
						<button
							onClick={() =>
								navigate(
									userType === "employee"
										? "/employee/ucr-requests"
										: "/ucr-requests"
								)
							}
							className={`w-full sm:w-auto px-6 py-3 font-bold rounded-lg transition ${
								isDarkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							← العودة للطلبات
						</button>

						{/* Edit button (pending or needs_revision, client only) */}
						{(request.status === "pending" || request.status === "needs_revision") && userType === "client" && (
							<button
								onClick={() => navigate(`/ucr-request/${requestId}/edit`)}
								className={`w-full sm:w-auto px-6 py-3 text-white font-bold rounded-lg transition ${
									request.status === "needs_revision" 
										? "bg-orange-600 hover:bg-orange-700 animate-pulse" 
										: "bg-yellow-600 hover:bg-yellow-700"
								}`}
							>
								{request.status === "needs_revision" ? "⚠️ تعديل الطلب (مطلوب تعديل)" : "✏️ تعديل الطلب"}
							</button>
						)}

						{/* Delete button (pending or needs_revision, client only) */}
						{(request.status === "pending" || request.status === "needs_revision") && userType === "client" && (
							<button
								onClick={handleDelete}
								className={`w-full sm:w-auto px-6 py-3 font-bold rounded-lg transition ${
									isDarkMode ? "bg-red-900/50 text-red-200 hover:bg-red-900/80" : "bg-red-600 text-white hover:bg-red-700"
								}`}
							>
								🗑️ حذف الطلب
							</button>
						)}

						{/* Track Shipment button (when shipment exists) */}
						{request.hasExportShipment && request.exportShipmentId && (
							<button
								onClick={handleTrackShipment}
								className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
							>
								<span>📦</span>
								<span>متابعة الشحنة</span>
							</button>
						)}

						{/* Waiting for UCR message */}
						{request.status === "approved" && !request.hasExportShipment && (
							<span className={`w-full sm:w-auto px-6 py-3 font-bold rounded-lg flex items-center justify-center gap-2 ${
								isDarkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-800"
							}`}>
								<span>⏳</span>
								<span>في انتظار إصدار UCR</span>
							</span>
						)}
					</div>
				</div>
			</main>

			{/* Document Review Modal (for employees) */}
			{docReviewModal.open && docReviewModal.doc && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
					<div className={`rounded-2xl max-w-md w-full p-6 shadow-2xl ${
						isDarkMode ? "bg-[#1a1010] border border-white/10 text-gray-200" : "bg-white text-gray-800"
					}`}>
						<h3 className="text-lg font-bold mb-4">
							{docReviewModal.action === "approve" && "✅ اعتماد المستند"}
							{docReviewModal.action === "reject" && "❌ رفض المستند"}
							{docReviewModal.action === "revision" && "⚠️ طلب تعديل المستند"}
							{docReviewModal.action === "reset" && "🔄 إعادة تعيين حالة المستند"}
						</h3>

						<p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
							المستند:{" "}
							<span className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
								{DOCUMENT_LABELS[docReviewModal.doc.documentType] || docReviewModal.doc.documentType}
							</span>
						</p>

						{/* View document link */}
						{docReviewModal.doc.url && (
							<div className="mb-4">
								<a
									href={docReviewModal.doc.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-800 underline text-sm"
								>
									👁️ عرض
								</a>
							</div>
						)}

						{docReviewModal.action !== "reset" && (
							<div className="mb-4">
								<label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
									{docReviewModal.action === "approve" && "ملاحظات (اختياري)"}
									{docReviewModal.action === "reject" && "سبب الرفض *"}
									{docReviewModal.action === "revision" && "ملاحظات التعديل المطلوب *"}
								</label>
								<textarea
									value={docReviewNotes}
									onChange={(e) => setDocReviewNotes(e.target.value)}
									rows={3}
									className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
										isDarkMode 
											? "bg-black/30 border-white/10 text-white placeholder-gray-500" 
											: "bg-white border-gray-300 text-black"
									}`}
									placeholder={
										docReviewModal.action === "approve"
											? "أضف أي ملاحظات (اختياري)..."
											: "اكتب السبب أو الملاحظات هنا..."
									}
								/>
							</div>
						)}

						{docReviewModal.action === "reset" && (
							<div className={`mb-4 p-3 rounded-lg ${isDarkMode ? "bg-white/5" : "bg-gray-100"}`}>
								<p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
									سيتم إعادة تعيين حالة المستند إلى "قيد المراجعة" وإزالة أي ملاحظات سابقة.
								</p>
							</div>
						)}

						<div className="flex justify-end gap-2">
							<button
								onClick={closeDocReviewModal}
								disabled={processingDocReview}
								className={`px-4 py-2 border rounded-lg disabled:opacity-50 ${
									isDarkMode 
										? "border-white/20 text-gray-300 hover:bg-white/5" 
										: "border-gray-300 text-gray-700 hover:bg-gray-50"
								}`}
							>
								إلغاء
							</button>
							<button
								onClick={() => {
									if (docReviewModal.action === "approve") handleDocumentReview("approved");
									else if (docReviewModal.action === "reject") handleDocumentReview("rejected");
									else if (docReviewModal.action === "revision") handleDocumentReview("needs_revision");
									else if (docReviewModal.action === "reset") handleDocumentReview("pending");
								}}
								disabled={processingDocReview}
								className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
									docReviewModal.action === "approve"
										? "bg-green-600 hover:bg-green-700"
										: docReviewModal.action === "reject"
										? "bg-red-600 hover:bg-red-700"
										: docReviewModal.action === "reset"
										? "bg-gray-600 hover:bg-gray-700"
										: "bg-yellow-600 hover:bg-yellow-700"
								}`}
							>
								{processingDocReview && (
									<div className="spinner border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
								)}
								{docReviewModal.action === "approve" && "تأكيد الاعتماد"}
								{docReviewModal.action === "reject" && "تأكيد الرفض"}
								{docReviewModal.action === "revision" && "إرسال طلب التعديل"}
								{docReviewModal.action === "reset" && "إعادة تعيين"}
							</button>
						</div>
					</div>
				</div>
			)}

			<Footer />
			
			<FileViewerModal
				isOpen={viewerData.open}
				onClose={() => setViewerData(prev => ({ ...prev, open: false }))}
				fileUrl={viewerData.url}
				fileName={viewerData.name}
				fileType={viewerData.type}
				fileId={viewerData.fileId}
			/>
		</div>
	);
};

export default UCRRequestDetailsPage;
