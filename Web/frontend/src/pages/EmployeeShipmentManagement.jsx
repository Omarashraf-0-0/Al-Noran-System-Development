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
import EmployeeUploadSection from "../components/EmployeeUploadSection";
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

// Available statuses for shipments
const AVAILABLE_STATUSES = [
	{
		value: "Pending",
		label: "قيد الانتظار",
		color: "bg-yellow-100 text-yellow-800",
	},
	{
		value: "في انتظار الشحن",
		label: "في انتظار الشحن",
		color: "bg-orange-100 text-orange-800",
	},
	{
		value: "In Transit",
		label: "في الطريق",
		color: "bg-blue-100 text-blue-800",
	},
	{
		value: "Arrived",
		label: "تم وصول البضاعة",
		color: "bg-green-100 text-green-800",
	},
	{
		value: "في انتظار وصول الإذن",
		label: "في انتظار وصول الإذن",
		color: "bg-purple-100 text-purple-800",
	},
	{
		value: "Customs Clearance",
		label: "التخليص الجمركي",
		color: "bg-indigo-100 text-indigo-800",
	},
	{
		value: "جاري الكشف والتثمين",
		label: "جاري الكشف والتثمين",
		color: "bg-pink-100 text-pink-800",
	},
	{ value: "Completed", label: "مكتملة", color: "bg-green-100 text-green-800" },
	{
		value: "تمت بنجاح",
		label: "تمت بنجاح",
		color: "bg-teal-100 text-teal-800",
	},
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

	// Number46 update handler
	const handleNumber46Update = async (newNumber46) => {
		try {
			toast.loading("جاري تحديث رقم البوليصة...");
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
			toast.success("تم تحديث رقم البوليصة بنجاح");
		} catch (error) {
			console.error("Error updating number46:", error);
			toast.dismiss();
			toast.error(error.response?.data?.message || "فشل تحديث رقم البوليصة");
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
				`${
					import.meta.env.VITE_API_URL
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

							{/* Stepper */}
							<Stepper currentStatus={shipment.status} />

							{/* Shipment Details */}
							{/* TODO: RBAC - Only show if hasPermission('shipment:view') */}
							<ShipmentDetailsGrid
								shipment={shipment}
								availableStatuses={AVAILABLE_STATUSES}
								isEmployee={true}
								onNumber46Update={handleNumber46Update}
							/>

							{/* Required Documents Status Section */}
							{/* TODO: RBAC - Only show if hasPermission('shipment:viewDocs') */}
							<RequiredDocumentsSection
								requiredDocuments={shipment.requiredDocuments}
								shipmentId={shipmentId}
								token={token}
								onShipmentUpdate={setShipment}
							/>

							{/* Employee Document Upload Section */}
							{/* TODO: RBAC - Only show if hasPermission('shipment:upload') */}
							<EmployeeUploadSection
								showUploadForm={showUploadModal}
								onToggleUploadForm={() => setShowUploadModal(!showUploadModal)}
								documentName={documentName}
								onDocumentNameChange={setDocumentName}
								selectedFile={selectedFile}
								onFileSelect={handleFileSelect}
								onUpload={handleUploadDocument}
								uploadingFile={uploadingFile}
								requiredDocuments={shipment.requiredDocuments}
								onDownloadDocument={handleDownloadDocument}
							/>

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
									className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-md hover:bg-purple-700 transition-all transform hover:scale-105"
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

			<Footer />
		</div>
	);
};

export default EmployeeShipmentManagement;
