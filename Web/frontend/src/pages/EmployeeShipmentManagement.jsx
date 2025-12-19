import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Stepper from "../components/Stepper";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusControlSection from "../components/StatusControlSection";
import RequiredDocumentsSection from "../components/RequiredDocumentsSection";
import EmployeeUploadModal from "../components/EmployeeUploadModal";
import StatusConfirmDialog from "../components/StatusConfirmDialog";
import RequestDocumentsModal from "../components/RequestDocumentsModal";
import ShipmentDetailsGrid from "../components/ShipmentDetailsGrid";
import supportAgent from "../assets/images/support_agent.png";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";

// TODO: RBAC - Get user permissions from context/store
// Example: const { user, hasPermission } = useAuth();
// const canViewShipment = hasPermission('shipment:view');
// const canEditStatus = hasPermission('shipment:editStatus');
// const canUploadDocuments = hasPermission('shipment:upload');
// const canRequestDocuments = hasPermission('shipment:requestDocs');

// Available statuses for shipments (Arabic only)
const AVAILABLE_STATUSES = [
	{
		value: "في انتظار الشحن",
		label: "في انتظار الشحن",
		color: "bg-orange-100 text-orange-800",
	},
	{
		value: "في الطريق",
		label: "في الطريق",
		color: "bg-blue-100 text-blue-800",
	},
	{
		value: "تم وصول البضاعة",
		label: "تم وصول البضاعة",
		color: "bg-cyan-100 text-cyan-800",
	},
	{
		value: "في انتظار وصول الإذن",
		label: "في انتظار وصول الإذن",
		color: "bg-purple-100 text-purple-800",
	},
	{
		value: "تم وصول الإذن",
		label: "تم وصول الإذن",
		color: "bg-teal-100 text-teal-800",
	},
	{
		value: "التخليص الجمركي",
		label: "التخليص الجمركي",
		color: "bg-indigo-100 text-indigo-800",
	},
	{
		value: "جارى ادراج الشحنة واستكمال الاجراءات",
		label: "جارى ادراج الشحنة واستكمال الاجراءات",
		color: "bg-amber-100 text-amber-800",
	},
	{
		value: "جاري الكشف والتثمين",
		label: "جاري الكشف والتثمين",
		color: "bg-pink-100 text-pink-800",
	},
	{
		value: "مكتملة",
		label: "مكتملة",
		color: "bg-green-100 text-green-800",
	},
	{
		value: "تمت بنجاح",
		label: "تمت بنجاح",
		color: "bg-emerald-100 text-emerald-800",
	},
];

// Sub-statuses for "جاري الكشف والتثمين" phase
const AVAILABLE_SUB_STATUSES = [
	{ value: "انتظار الرسوم الجمركية من المصلحة", label: "انتظار الرسوم الجمركية من المصلحة" },
	{ value: "ادخال رقم المطالبة و صورة المطالبة", label: "ادخال رقم المطالبة و صورة المطالبة" },
	{ value: "اختيار جهة الدفع", label: "اختيار جهة الدفع" },
	{ value: "في انتظار استلام الافراج الجمركى", label: "في انتظار استلام الافراج الجمركى" },
	{ value: "مرحلة الترانزيت", label: "مرحلة الترانزيت" },
];

// Payment parties
const PAYMENT_PARTIES = [
	{ value: "العميل", label: "العميل" },
	{ value: "الشركة", label: "الشركة (النوران)" },
];

const EmployeeShipmentManagement = () => {
	const { shipmentId } = useParams();
	const navigate = useNavigate();
	const token = localStorage.getItem("token");

	// Core state
	const [shipment, setShipment] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Status change state
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState("");
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	// Sub-status state for "جاري الكشف والتثمين" phase
	const [showSubStatusDropdown, setShowSubStatusDropdown] = useState(false);

	// Required documents state
	const [showDocumentModal, setShowDocumentModal] = useState(false);
	const [requiredDocuments, setRequiredDocuments] = useState([]);
	const [newDocument, setNewDocument] = useState("");
	const [uploadingDoc, setUploadingDoc] = useState(false);

	// Document upload state
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [documentName, setDocumentName] = useState("");
	const [uploadingFile, setUploadingFile] = useState(false);

	// Auth check
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			if (parsedUser.type !== "employee") {
				toast.error("غير مصرح لك بالوصول لهذه الصفحة");
				navigate("/");
			}
		} else {
			toast.error("يجب تسجيل الدخول أولاً");
			navigate("/login");
		}
	}, [navigate]);

	// Fetch shipment data
	useEffect(() => {
		const fetchShipmentData = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!shipmentId) {
					setError("معرف الشحنة غير موجود");
					toast.error("معرف الشحنة غير موجود");
					return;
				}

				const shipmentResponse = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setShipment(shipmentResponse.data);
				setSelectedStatus(shipmentResponse.data.status);
			} catch (error) {
				console.error("Error fetching shipment data:", error);
				const errorMessage =
					error.response?.data?.message ||
					error.message ||
					"فشل تحميل بيانات الشحنة";
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		if (token) {
			fetchShipmentData();
		}
	}, [shipmentId, token]);

	// Helper functions
	const getStatusColor = (status) => {
		const statusObj = AVAILABLE_STATUSES.find((s) => s.value === status);
		return statusObj ? statusObj.color : "bg-gray-100 text-gray-800";
	};

	// Status handlers
	const handleStatusChange = (newStatus) => {
		setSelectedStatus(newStatus);
		setShowStatusDropdown(false);
		setShowConfirmDialog(true);
	};

	const confirmStatusChange = async () => {
		try {
			toast.loading("جاري تحديث حالة الشحنة...");
			await axios.put(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
				{ status: selectedStatus },
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			setShipment((prev) => ({ ...prev, status: selectedStatus }));
			toast.dismiss();
			toast.success("تم تحديث حالة الشحنة بنجاح");
			setShowConfirmDialog(false);
		} catch (error) {
			console.error("Error updating shipment status:", error);
			toast.dismiss();
			toast.error(error.response?.data?.message || "فشل تحديث حالة الشحنة");
		}
	};

	// Sub-status update handler
	const handleSubStatusChange = async (newSubStatus) => {
		try {
			toast.loading("جاري تحديث الحالة الفرعية...");
			await axios.put(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
				{ subStatus: newSubStatus },
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			setShipment((prev) => ({ ...prev, subStatus: newSubStatus }));
			setShowSubStatusDropdown(false);
			toast.dismiss();
			toast.success("تم تحديث الحالة الفرعية بنجاح");
		} catch (error) {
			console.error("Error updating sub-status:", error);
			toast.dismiss();
			toast.error(error.response?.data?.message || "فشل تحديث الحالة الفرعية");
		}
	};

	// Payment party update handler
	const handlePaymentPartyChange = async (newPaymentParty) => {
		try {
			toast.loading("جاري تحديث جهة الدفع...");
			await axios.put(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
				{ paymentParty: newPaymentParty },
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			setShipment((prev) => ({ ...prev, paymentParty: newPaymentParty }));
			toast.dismiss();
			toast.success("تم تحديث جهة الدفع بنجاح");
		} catch (error) {
			console.error("Error updating payment party:", error);
			toast.dismiss();
			toast.error(error.response?.data?.message || "فشل تحديث جهة الدفع");
		}
	};

	// Number46 update handler
	const handleNumber46Update = async (newNumber46) => {
		try {
			toast.loading("جاري تحديث رقم 46...");
			await axios.put(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
				{ number46: newNumber46 },
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			setShipment((prev) => ({ ...prev, number46: newNumber46 }));
			toast.dismiss();
			toast.success("تم تحديث رقم 46 بنجاح");
		} catch (error) {
			console.error("Error updating number46:", error);
			toast.dismiss();
			toast.error(error.response?.data?.message || "فشل تحديث رقم 46");
		}
	};

	// Document request handlers
	const handleAddRequiredDocument = () => {
		if (newDocument.trim()) {
			setRequiredDocuments([
				...requiredDocuments,
				{ name: newDocument, uploaded: false },
			]);
			setNewDocument("");
			toast.success("تم إضافة المستند المطلوب");
		}
	};

	const handleRemoveRequiredDocument = (index) => {
		const updated = requiredDocuments.filter((_, i) => i !== index);
		setRequiredDocuments(updated);
		toast.success("تم حذف المستند المطلوب");
	};

	const handleSaveRequiredDocuments = async () => {
		try {
			setUploadingDoc(true);
			toast.loading("جاري إرسال طلب المستندات...");
			await axios.post(
				`${import.meta.env.VITE_API_URL
				}/api/shipments/id/${shipmentId}/required-documents`,
				{ documents: requiredDocuments },
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			toast.dismiss();
			toast.success("تم حفظ المستندات المطلوبة وإرسال إشعار للعميل");
			setShowDocumentModal(false);
			setRequiredDocuments([]);
		} catch (error) {
			console.error("Error saving required documents:", error);
			toast.dismiss();
			toast.error(
				error.response?.data?.message || "فشل حفظ المستندات المطلوبة"
			);
		} finally {
			setUploadingDoc(false);
		}
	};

	// File upload handlers
	const handleFileSelect = (e) => {
		const file = e.target.files[0];
		if (file) {
			setSelectedFile(file);
			setDocumentName(file.name);
		}
	};

	const handleUploadDocument = async () => {
		if (!selectedFile || !documentName) {
			toast.error("الرجاء اختيار ملف وإدخال اسم المستند");
			return;
		}

		try {
			setUploadingFile(true);
			toast.loading("جاري رفع المستند...");

			// Upload file to S3
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("category", "shipment");
			formData.append("relatedId", shipmentId);

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

			const uploadedFileId =
				uploadResponse.data.upload.id || uploadResponse.data.upload._id;

			// Add document to shipment's requiredDocuments
			const updatedDocuments = [
				...(shipment.requiredDocuments || []),
				{
					name: documentName,
					uploaded: true,
					fileId: uploadedFileId,
					uploadedAt: new Date(),
				},
			];

			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/shipments/${shipment.acid}`,
				{ requiredDocuments: updatedDocuments },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			toast.dismiss();
			toast.success("تم رفع المستند بنجاح");

			// Reset form and refresh
			setSelectedFile(null);
			setDocumentName("");
			setShowUploadModal(false);

			const shipmentResponse = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setShipment(shipmentResponse.data);
		} catch (error) {
			console.error("Error uploading document:", error);
			toast.dismiss();
			toast.error(error.response?.data?.message || "فشل رفع المستند");
		} finally {
			setUploadingFile(false);
		}
	};

	const handleDownloadDocument = async (fileId, fileName) => {
		try {
			toast.loading("جاري تحميل المستند...");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${fileId}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			toast.dismiss();
			const fileUrl =
				response.data?.upload?.presignedUrl || response.data?.presignedUrl;
			if (fileUrl) {
				window.open(fileUrl, "_blank");
			} else {
				toast.error("لم يتم العثور على رابط الملف");
			}
		} catch (error) {
			console.error("Error downloading document:", error);
			toast.dismiss();
			toast.error("فشل تحميل المستند");
		}
	};

	const handleDeleteUploadedDocument = async (docId, docName) => {
		// Confirmation dialog
		const confirmed = window.confirm(
			`هل أنت متأكد من حذف المستند "${docName}"؟\nسيتم إعادة تعيين حالة المستند ليتمكن العميل من رفعه مرة أخرى.`
		);
		if (!confirmed) return;

		try {
			toast.loading("جاري حذف المستند...");
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}/required-documents/${docId}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			toast.dismiss();
			toast.success("تم حذف المستند بنجاح");
			// Refresh shipment data
			fetchShipment();
		} catch (error) {
			console.error("Error deleting document:", error);
			toast.dismiss();
			toast.error(error.response?.data?.message || "فشل حذف المستند");
		}
	};

	const handleContactClient = () => {
		if (shipment?._id) {
			navigate(`/shipment-chat/${shipment._id}`);
		} else {
			toast.error("لا يمكن فتح المحادثة، الرجاء المحاولة مرة أخرى");
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<Header />
				<div className="flex justify-center items-center py-12">
					<LoadingSpinner message="جاري تحميل بيانات الشحنة..." />
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm">
						<ErrorMessage
							message={error}
							onRetry={() => window.location.reload()}
						/>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="bg-gray-50 min-h-screen text-gray-800">
			<Header />

			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm">
					{shipment && (
						<>
							{/* Employee Badge */}
							<div className="flex justify-between items-center mb-6">
								<div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
									<p className="text-sm text-blue-800 font-medium">
										👔 وضع الموظف - إدارة الشحنة
									</p>
								</div>
								<button
									onClick={() => navigate("/employeedashboard")}
									className="text-gray-600 hover:text-red-800 text-sm font-medium"
								>
									← العودة للوحة التحكم
								</button>
							</div>

							{/* Top illustration */}
							<div className="flex justify-center mb-10">
								<img
									src={mainIllustration}
									alt="Shipment Illustration"
									className="w-full max-w-lg h-auto"
								/>
							</div>

							{/* Status Control Section */}
							{/* TODO: RBAC - Only show if hasPermission('shipment:editStatus') */}
							<StatusControlSection
								currentStatus={shipment.status}
								availableStatuses={AVAILABLE_STATUSES}
								showDropdown={showStatusDropdown}
								onToggleDropdown={() =>
									setShowStatusDropdown(!showStatusDropdown)
								}
								onStatusChange={handleStatusChange}
								onRequestDocuments={() => setShowDocumentModal(true)}
								getStatusColor={getStatusColor}
							/>

							{/* Sub-Status Control Section - Only show when status is "جاري الكشف والتثمين" */}
							{shipment.status === "جاري الكشف والتثمين" && (
								<div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-6 mb-8">
									<h3 className="text-lg font-bold text-pink-900 mb-4 flex items-center gap-2">
										<span>📋</span>
										<span>الحالة الفرعية لمرحلة الكشف والتثمين</span>
									</h3>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* Sub-Status Dropdown */}
										<div className="relative">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												الحالة الفرعية الحالية
											</label>
											<div className="relative">
												<button
													onClick={() => setShowSubStatusDropdown(!showSubStatusDropdown)}
													className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-pink-300 rounded-lg text-right font-medium hover:border-pink-500 transition"
												>
													<span className="text-gray-700">
														{shipment.subStatus || "اختر الحالة الفرعية"}
													</span>
													<svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
														<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
													</svg>
												</button>

												{showSubStatusDropdown && (
													<div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
														{AVAILABLE_SUB_STATUSES.map((subStatus) => (
															<button
																key={subStatus.value}
																onClick={() => handleSubStatusChange(subStatus.value)}
																className={`w-full px-4 py-3 text-right hover:bg-pink-50 transition ${shipment.subStatus === subStatus.value
																		? "bg-pink-100 text-pink-900 font-bold"
																		: "text-gray-700"
																	}`}
															>
																{subStatus.label}
															</button>
														))}
													</div>
												)}
											</div>
										</div>

										{/* Payment Party Selection - Only show when sub-status is "اختيار جهة الدفع" */}
										{shipment.subStatus === "اختيار جهة الدفع" && (
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													جهة الدفع
												</label>
												<div className="flex gap-3">
													{PAYMENT_PARTIES.map((party) => (
														<button
															key={party.value}
															onClick={() => handlePaymentPartyChange(party.value)}
															className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${shipment.paymentParty === party.value
																	? "bg-pink-600 text-white shadow-md"
																	: "bg-white border-2 border-pink-300 text-gray-700 hover:border-pink-500"
																}`}
														>
															{party.label}
														</button>
													))}
												</div>
												{shipment.paymentParty && (
													<p className="mt-2 text-sm text-pink-700">
														✅ تم اختيار: <strong>{shipment.paymentParty === "العميل" ? "العميل" : "الشركة (النوران)"}</strong>
													</p>
												)}
											</div>
										)}
									</div>

									{/* Current Sub-Status Display */}
									{shipment.subStatus && (
										<div className="mt-4 bg-white rounded-lg p-4 border border-pink-200">
											<p className="text-sm text-gray-600">
												الحالة الفرعية الحالية:
											</p>
											<p className="text-lg font-bold text-pink-800">
												{shipment.subStatus}
												{shipment.subStatus === "اختيار جهة الدفع" && shipment.paymentParty && (
													<span className="text-sm font-normal text-gray-600 mr-2">
														({shipment.paymentParty === "العميل" ? "العميل" : "الشركة"})
													</span>
												)}
											</p>
										</div>
									)}
								</div>
							)}

							{/* Stepper */}
							<Stepper currentStatus={shipment.status} subStatus={shipment.subStatus} />

							{/* Shipment Details */}
							{/* TODO: RBAC - Only show if hasPermission('shipment:view') */}
							<ShipmentDetailsGrid
								shipment={shipment}
								availableStatuses={AVAILABLE_STATUSES}
								isEmployee={true}
								onNumber46Update={handleNumber46Update}
							/>

							{/* Unified Shipment Files Section */}
							{/* TODO: RBAC - Only show if hasPermission('shipment:viewDocs') && hasPermission('shipment:upload') */}
							<div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
								{/* Header with Action Buttons */}
								<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
									<h2 className="text-2xl font-bold text-red-900 flex items-center gap-2">
										<span>📁</span>
										<span>ملفات الشحنة</span>
									</h2>

									<div className="flex flex-wrap gap-3">
										{/* Refresh Button */}
										<button
											onClick={() => window.location.reload()}
											className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition shadow-md"
										>
											<svg
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
													clipRule="evenodd"
												/>
											</svg>
											<span>تحديث</span>
										</button>

										{/* Upload Document Button */}
										<button
											onClick={() => setShowUploadModal(!showUploadModal)}
											className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow-md"
										>
											<svg
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											<span>رفع مستند</span>
										</button>

										{/* Request Document Button */}
										<button
											onClick={() => setShowDocumentModal(true)}
											className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition shadow-md"
										>
											<svg
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
													clipRule="evenodd"
												/>
											</svg>
											<span>طلب مستند</span>
										</button>
									</div>
								</div>

								{/* Proforma Invoice Files - من طلب ACID */}
								{shipment.acid_request_id?.uploads &&
									shipment.acid_request_id.uploads.length > 0 && (
										<div className="mb-8">
											<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
												<span>📄</span>
												<span>الفاتورة المبدئية (من طلب ACID)</span>
											</h3>
											<div className="space-y-3">
												{shipment.acid_request_id.uploads.map(
													(upload, index) => (
														<div
															key={upload._id || index}
															className="flex items-center justify-between bg-white border border-blue-200 rounded-lg p-4 hover:shadow-md transition"
														>
															<div className="flex items-center gap-3">
																<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
																	<span className="text-2xl">📄</span>
																</div>
																<div className="text-right">
																	<p className="font-medium text-gray-800">
																		{upload.originalname ||
																			upload.filename ||
																			"فاتورة مبدئية"}
																	</p>
																	<p className="text-sm text-gray-500">
																		{upload.createdAt
																			? new Date(
																				upload.createdAt
																			).toLocaleDateString("ar-EG")
																			: ""}
																	</p>
																</div>
															</div>
															<button
																onClick={() =>
																	handleDownloadDocument(
																		upload._id,
																		upload.originalname || upload.filename
																	)
																}
																className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
															>
																<span>عرض</span>
																<svg
																	className="w-4 h-4"
																	fill="currentColor"
																	viewBox="0 0 20 20"
																>
																	<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
																	<path
																		fillRule="evenodd"
																		d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
																		clipRule="evenodd"
																	/>
																</svg>
															</button>
														</div>
													)
												)}
											</div>
										</div>
									)}

								{/* Uploaded Documents Section */}
								<div className="mb-8">
									<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
										<span>✅</span>
										<span>المستندات المرفوعة</span>
									</h3>
									{shipment.requiredDocuments?.filter((doc) => doc.uploaded)
										.length > 0 ? (
										<div className="space-y-3">
											{shipment.requiredDocuments
												.filter((doc) => doc.uploaded)
												.map((doc, index) => (
													<div
														key={index}
														className="flex items-center justify-between bg-white border border-green-200 rounded-lg p-4 hover:shadow-md transition"
													>
														<div className="flex items-center gap-3">
															<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
																<span className="text-2xl">📄</span>
															</div>
															<div className="text-right">
																<p className="font-medium text-gray-800">
																	{doc.name}
																</p>
																{doc.uploadedAt && (
																	<p className="text-sm text-gray-500">
																		{new Date(
																			doc.uploadedAt
																		).toLocaleDateString("ar-EG")}
																	</p>
																)}
															</div>
														</div>
														<div className="flex items-center gap-2">
															<button
																onClick={() =>
																	handleDownloadDocument(doc.fileId, doc.name)
																}
																className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
															>
																<span>عرض</span>
																<svg
																	className="w-4 h-4"
																	fill="currentColor"
																	viewBox="0 0 20 20"
																>
																	<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
																	<path
																		fillRule="evenodd"
																		d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
																		clipRule="evenodd"
																	/>
																</svg>
															</button>
															<button
																onClick={() => handleDeleteUploadedDocument(doc._id, doc.name)}
																className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-2"
															>
																<span>حذف</span>
																<svg
																	className="w-4 h-4"
																	fill="currentColor"
																	viewBox="0 0 20 20"
																>
																	<path
																		fillRule="evenodd"
																		d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
																		clipRule="evenodd"
																	/>
																</svg>
															</button>
														</div>
													</div>
												))}
										</div>
									) : (
										<div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
											<svg
												className="w-16 h-16 mx-auto text-gray-400 mb-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											<p className="text-gray-500 text-lg">
												لا توجد مستندات مرفوعة بعد
											</p>
											<p className="text-gray-400 text-sm mt-2">
												استخدم زر "رفع مستند" لإضافة مستندات
											</p>
										</div>
									)}
								</div>

								{/* Required Documents Not Uploaded Yet */}
								<div>
									<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
										<span>⏳</span>
										<span>المستندات المطلوبة (لم ترفع بعد)</span>
									</h3>
									{shipment.requiredDocuments?.filter((doc) => !doc.uploaded)
										.length > 0 ? (
										<div className="space-y-3">
											{shipment.requiredDocuments
												.filter((doc) => !doc.uploaded)
												.map((doc, index) => (
													<div
														key={index}
														className="flex items-center justify-between bg-white border border-yellow-200 rounded-lg p-4 hover:shadow-md transition"
													>
														<div className="flex items-center gap-3">
															<span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
																⏳ قيد الانتظار
															</span>
															<button
																onClick={() => handleDeleteUploadedDocument(doc._id, doc.name)}
																className="bg-red-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-1 text-sm"
															>
																<span>حذف الطلب</span>
																<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
																	<path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
																</svg>
															</button>
														</div>
														<div className="text-right">
															<p className="font-bold text-gray-900">
																{doc.name}
															</p>
															<p className="text-sm text-gray-500">
																في انتظار الرفع من العميل
															</p>
														</div>
													</div>
												))}
										</div>
									) : (
										<div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
											<svg
												className="w-16 h-16 mx-auto text-gray-400 mb-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<p className="text-gray-500 text-lg">
												جميع المستندات المطلوبة تم رفعها
											</p>
											<p className="text-gray-400 text-sm mt-2">
												لا توجد مستندات معلقة حالياً
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
								<button
									onClick={handleContactClient}
									className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-all transform hover:scale-105"
								>
									<img
										src={supportAgent}
										alt="Support Agent"
										className="w-6 h-6 filter brightness-0 invert"
									/>
									<span>تواصل مع العميل</span>
								</button>

								<button
									onClick={() => navigate(`/shipment-history/${shipmentId}`)}
									className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105"
								>
									<svg
										className="w-6 h-6"
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
							</div>
						</>
					)}
				</div>
			</main>

			{/* Status Confirmation Dialog */}
			<StatusConfirmDialog
				isOpen={showConfirmDialog}
				selectedStatus={selectedStatus}
				availableStatuses={AVAILABLE_STATUSES}
				getStatusColor={getStatusColor}
				onConfirm={confirmStatusChange}
				onCancel={() => setShowConfirmDialog(false)}
			/>

			{/* Required Documents Modal */}
			<RequestDocumentsModal
				isOpen={showDocumentModal}
				onClose={() => setShowDocumentModal(false)}
				newDocument={newDocument}
				onNewDocumentChange={setNewDocument}
				requiredDocuments={requiredDocuments}
				onAddDocument={handleAddRequiredDocument}
				onRemoveDocument={handleRemoveRequiredDocument}
				onSave={handleSaveRequiredDocuments}
				uploading={uploadingDoc}
			/>

			{/* Upload Modal */}
			<EmployeeUploadModal
				isOpen={showUploadModal}
				onClose={() => {
					setShowUploadModal(false);
					setSelectedFile(null);
					setDocumentName("");
				}}
				documentName={documentName}
				onDocumentNameChange={setDocumentName}
				selectedFile={selectedFile}
				onFileSelect={handleFileSelect}
				onUpload={handleUploadDocument}
				uploadingFile={uploadingFile}
			/>

			<Footer />
		</div>
	);
};

export default EmployeeShipmentManagement;
