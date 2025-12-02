import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Stepper from "../components/Stepper";
import FileRow from "../components/FileRow";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AdminStatusControl from "../components/AdminStatusControl";
import RequiredDocumentsModal from "../components/RequiredDocumentsModal";
import ConfirmDialog from "../components/ConfirmDialog";
import supportAgent from "../assets/images/support_agent.png";
import documentText from "../assets/images/document-text.png";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";
import contractIcon from "../assets/images/contract.png";
import Datafield from "../components/DataField";
import axios from "axios";
import { toast } from "react-hot-toast";

const AdminShipmentManagement = () => {
	const { shipmentId } = useParams();
	const navigate = useNavigate();

	const [shipment, setShipment] = useState(null);
	const [fileItems, setFileItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [user, setUser] = useState(null);

	// Status change state
	const [selectedStatus, setSelectedStatus] = useState("");
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// Required documents state
	const [showDocumentModal, setShowDocumentModal] = useState(false);
	const [uploadingDoc, setUploadingDoc] = useState(false);

	// TODO: RBAC - Get admin permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canChangeStatus = hasPermission('shipment:updateStatus');
	// const canRequestDocuments = hasPermission('shipment:requestDocuments');
	// const canViewAllShipments = hasPermission('shipment:viewAll');

	const token = localStorage.getItem("token");

	// Available statuses
	const availableStatuses = [
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
		{
			value: "Completed",
			label: "مكتملة",
			color: "bg-green-100 text-green-800",
		},
		{
			value: "تمت بنجاح",
			label: "تمت بنجاح",
			color: "bg-teal-100 text-teal-800",
		},
	];

	useEffect(() => {
		// Get user from localStorage (optional for preview)
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);

			// TODO: RBAC - Check if user has admin permission
			// Example implementation:
			// if (!hasPermission('admin:access')) {
			// 	toast.error("غير مصرح لك بالوصول لهذه الصفحة");
			// 	navigate("/");
			// 	return;
			// }
		}
		// TODO: RBAC - Redirect if not authenticated
		// else {
		// 	toast.error("يجب تسجيل الدخول أولاً");
		// 	navigate("/login");
		// }
	}, [navigate]);

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

				// If no token, use mock data for preview
				if (!token) {
					console.log("No token found - using mock data for preview");
					setTimeout(() => {
						setShipment({
							_id: shipmentId,
							acid: "ACID-2024-12345",
							importerName: "شركة الاستيراد المثالية",
							employerName: "محمد أحمد",
							status: "In Transit",
							shipmentDescription: "شحنة أجهزة إلكترونية",
							country: "الصين",
							number46: "BL-2024-5678",
							num_of_containers: "2",
							port_name: "ميناء الإسكندرية",
							requiredDocuments: [
								{
									_id: "doc1",
									name: "شهادة المنشأ",
									uploaded: true,
									uploadedAt: new Date(),
									requestedAt: new Date(Date.now() - 86400000),
									fileId: "file123",
								},
								{
									_id: "doc2",
									name: "الفاتورة التجارية",
									uploaded: false,
									requestedAt: new Date(Date.now() - 172800000),
								},
							],
						});
						setSelectedStatus("In Transit");
						setFileItems([
							{
								name: "invoice.pdf",
								date: "١٥ نوفمبر ٢٠٢٤",
								url: "#",
								id: "file1",
								documentType: "فاتورة",
								description: "الفاتورة الأصلية",
							},
							{
								name: "packing_list.pdf",
								date: "١٤ نوفمبر ٢٠٢٤",
								url: "#",
								id: "file2",
								documentType: "قائمة التعبئة",
								description: "قائمة التعبئة والشحن",
							},
						]);
						setLoading(false);
					}, 500);
					return;
				}

				// Fetch shipment details
				const shipmentResponse = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				setShipment(shipmentResponse.data);
				setSelectedStatus(shipmentResponse.data.status);

				// Fetch existing required documents
				try {
					const reqDocsResponse = await axios.get(
						`${import.meta.env.VITE_API_URL}/api/shipments/id/${
							shipmentResponse.data._id
						}/required-documents`,
						{
							headers: {
								Authorization: `Bearer ${token}`,
							},
						}
					);

					const existingDocs =
						reqDocsResponse.data?.data?.requiredDocuments || [];
					console.log("Existing required documents:", existingDocs);
					// Note: Don't set these to the requiredDocuments state as that's for new documents being added
					// They're stored in the shipment itself
				} catch (reqDocsError) {
					console.log(
						"Note: Could not fetch required documents:",
						reqDocsError.message
					);
				}

				// Fetch shipment files
				try {
					const filesResponse = await axios.get(
						`${
							import.meta.env.VITE_API_URL
						}/api/uploads?category=shipment&relatedId=${
							shipmentResponse.data._id
						}`,
						{
							headers: {
								Authorization: `Bearer ${token}`,
							},
						}
					);

					console.log("Files response:", filesResponse.data);

					// API returns { success, count, uploads: [...] }
					const uploads =
						filesResponse.data?.uploads || filesResponse.data || [];

					const shipmentFiles = uploads.map((file) => ({
						name: file.filename || file.originalname || "ملف",
						date: new Date(
							file.uploadedAt || file.createdAt
						).toLocaleDateString("ar-EG", {
							day: "numeric",
							month: "long",
							year: "numeric",
						}),
						url: file.presignedUrl || file.url,
						id: file._id,
						documentType: file.documentType,
						description: file.description,
					}));

					console.log("Formatted shipment files:", shipmentFiles);
					setFileItems(shipmentFiles);
				} catch (fileError) {
					console.log("Note: Could not fetch files:", fileError.message);
					setFileItems([]);
				}
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

		fetchShipmentData();
	}, [shipmentId, token]);

	const getStatusColor = (status) => {
		const statusObj = availableStatuses.find((s) => s.value === status);
		return statusObj ? statusObj.color : "bg-gray-100 text-gray-800";
	};

	const handleStatusChange = (newStatus) => {
		// TODO: RBAC - Check permission before allowing status change
		// if (!canChangeStatus) {
		// 	toast.error("ليس لديك صلاحية لتغيير حالة الشحنة");
		// 	return;
		// }
		setSelectedStatus(newStatus);
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

	const handleSaveRequiredDocuments = async (documents) => {
		// TODO: RBAC - Check permission before requesting documents
		// if (!canRequestDocuments) {
		// 	toast.error("ليس لديك صلاحية لطلب مستندات");
		// 	return;
		// }

		try {
			setUploadingDoc(true);
			toast.loading("جاري إرسال طلب المستندات...");

			// Send required documents to backend
			await axios.post(
				`${
					import.meta.env.VITE_API_URL
				}/api/shipments/id/${shipmentId}/required-documents`,
				{ documents },
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

	const handleContactClient = () => {
		// TODO: Implement contact client functionality
		toast.info("سيتم إضافة نظام المراسلة قريباً");
	};

	if (loading) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<Header />
				<LoadingSpinner message="جاري تحميل بيانات الشحنة..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm">
						<ErrorMessage
							error={error}
							onRetry={() => window.location.reload()}
							retryButtonText="إعادة محاولة"
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
							{/* Admin Badge */}
							<div className="flex justify-between items-center mb-6">
								<div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
									<p className="text-sm text-purple-800 font-medium">
										👑 وضع المسؤول - إدارة الشحنة
									</p>
								</div>
								<button
									onClick={() => navigate("/")}
									className="text-gray-600 hover:text-red-800 text-sm font-medium"
								>
									← العودة للصفحة الرئيسية
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
							{/* TODO: RBAC - Only show status controls if user has permission */}
							<AdminStatusControl
								currentStatus={shipment.status}
								availableStatuses={availableStatuses}
								onStatusChange={handleStatusChange}
								getStatusColor={getStatusColor}
							/>
							{/* Request Documents Button */}
							{/* TODO: RBAC - Only show if user has document request permission */}
							<div className="flex justify-center mb-8">
								<button
									onClick={() => setShowDocumentModal(true)}
									className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md flex items-center gap-2"
								>
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
											clipRule="evenodd"
										/>
									</svg>
									<span>طلب مستندات</span>
								</button>
							</div>{" "}
							{/* Stepper */}
							<Stepper currentStatus={shipment.status} />
							{/* Shipment Details */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-12 mb-12">
								<Datafield
									label="اسم العميل"
									value={
										shipment.importerName || shipment.employerName || "غير محدد"
									}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="رقم الـ ACID"
									value={shipment.acid || "غير محدد"}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="الحالة"
									value={
										availableStatuses.find((s) => s.value === shipment.status)
											?.label || shipment.status
									}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="وصف الشحنة"
									value={shipment.shipmentDescription || "غير محدد"}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="البلد"
									value={shipment.country || "غير محدد"}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="رقم البوليصة"
									value={shipment.number46 || "غير محدد"}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="عدد الحاويات"
									value={shipment.num_of_containers || "غير محدد"}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="ميناء الوصول"
									value={shipment.port_name || "غير محدد"}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
							</div>
							{/* Required Documents Status Section (for Admin) */}
							{shipment.requiredDocuments &&
								shipment.requiredDocuments.length > 0 && (
									<div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
										<div className="flex items-center justify-between mb-6">
											<h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
												<span>📋</span>
												<span>المستندات المطلوبة من العميل</span>
												<span className="text-sm font-normal text-gray-600">
													(
													{
														shipment.requiredDocuments.filter(
															(doc) => doc.uploaded
														).length
													}{" "}
													/ {shipment.requiredDocuments.length} مرفوعة)
												</span>
											</h2>
											<button
												onClick={async () => {
													try {
														toast.loading("جاري تحديث البيانات...");
														const response = await axios.get(
															`${
																import.meta.env.VITE_API_URL
															}/api/shipments/id/${shipmentId}`,
															{
																headers: {
																	Authorization: `Bearer ${token}`,
																},
															}
														);
														setShipment(response.data);
														toast.dismiss();
														toast.success("تم تحديث البيانات بنجاح");
													} catch (error) {
														toast.dismiss();
														toast.error("فشل تحديث البيانات");
														console.error("Refresh error:", error);
													}
												}}
												className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
											>
												<span>🔄</span>
												<span>تحديث</span>
											</button>
										</div>

										<div className="space-y-3">
											{shipment.requiredDocuments.map((doc, index) => (
												<div
													key={doc._id || index}
													className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
														doc.uploaded
															? "bg-green-50 border-green-300"
															: "bg-yellow-50 border-yellow-300"
													}`}
												>
													<div className="flex items-center gap-3 flex-1">
														{doc.uploaded ? (
															<span className="text-2xl">✅</span>
														) : (
															<span className="text-2xl animate-pulse">⏳</span>
														)}
														<div>
															<p className="font-bold text-gray-800">
																{doc.name}
															</p>
															<p className="text-sm text-gray-500">
																{doc.uploaded
																	? `تم الرفع: ${new Date(
																			doc.uploadedAt
																	  ).toLocaleDateString("ar-EG")}`
																	: `تم الطلب: ${new Date(
																			doc.requestedAt
																	  ).toLocaleDateString("ar-EG")}`}
															</p>
														</div>
													</div>

													{doc.uploaded &&
														doc.fileId &&
														doc.fileId !== "temp-file-id" && (
															<button
																onClick={async () => {
																	try {
																		// Validate fileId before making request
																		if (
																			!doc.fileId ||
																			doc.fileId === "temp-file-id"
																		) {
																			toast.error("معرف الملف غير صالح");
																			console.error(
																				"Invalid fileId:",
																				doc.fileId
																			);
																			return;
																		}

																		toast.loading("جاري تحميل الملف...");
																		console.log(
																			"Fetching file with ID:",
																			doc.fileId
																		);

																		const fileResponse = await axios.get(
																			`${
																				import.meta.env.VITE_API_URL
																			}/api/uploads/${doc.fileId}`,
																			{
																				headers: {
																					Authorization: `Bearer ${token}`,
																				},
																			}
																		);
																		toast.dismiss();

																		const fileUrl =
																			fileResponse.data?.upload?.presignedUrl ||
																			fileResponse.data?.presignedUrl;
																		if (fileUrl) {
																			window.open(fileUrl, "_blank");
																		} else {
																			toast.error(
																				"لم يتم العثور على رابط الملف"
																			);
																			console.error(
																				"No presigned URL in response:",
																				fileResponse.data
																			);
																		}
																	} catch (error) {
																		toast.dismiss();
																		const errorMsg =
																			error.response?.data?.message ||
																			error.message ||
																			"فشل تحميل الملف";
																		toast.error(errorMsg);
																		console.error("File fetch error:", {
																			fileId: doc.fileId,
																			error:
																				error.response?.data || error.message,
																			fullError: error,
																		});
																	}
																}}
																className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-1"
															>
																<span>عرض المستند</span>
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
														)}
												</div>
											))}
										</div>

										<div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
											<p className="text-sm text-blue-800 text-center">
												💡 يمكنك رؤية حالة المستندات المطلوبة التي طلبتها من
												العميل
											</p>
										</div>
									</div>
								)}
							{/* Files Section */}
							<div className="mt-16">
								<h2 className="text-2xl font-bold text-center text-red-900 mb-8">
									📁 ملفات الشحنة
								</h2>
								{fileItems.length === 0 ? (
									<div className="text-center py-8 bg-gray-50 rounded-lg">
										<p className="text-gray-500">لا توجد ملفات متاحة</p>
									</div>
								) : (
									<div className="space-y-4">
										{fileItems.map((item, index) => (
											<div
												key={index}
												className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
											>
												<FileRow
													name={item.name}
													date={item.date}
													documentType={item.documentType}
													description={item.description}
													url={item.url}
													id={item.id}
												/>
												{item.url && (
													<a
														href={item.url}
														target="_blank"
														rel="noopener noreferrer"
														className="text-blue-600 hover:text-blue-800 text-sm font-medium"
													>
														عرض ↗
													</a>
												)}
											</div>
										))}
									</div>
								)}
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
			<ConfirmDialog
				isOpen={showConfirmDialog}
				onConfirm={confirmStatusChange}
				onCancel={() => setShowConfirmDialog(false)}
				title="⚠️ تأكيد تغيير الحالة"
				message={
					<div className="text-center">
						<p className="text-gray-600 mb-4">
							هل أنت متأكد من تغيير حالة الشحنة إلى:
						</p>
						<span
							className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${getStatusColor(
								selectedStatus
							)}`}
						>
							{availableStatuses.find((s) => s.value === selectedStatus)?.label}
						</span>
						<p className="text-sm text-gray-500 mt-4">
							سيتم إرسال إشعار للعميل بالتحديث
						</p>
					</div>
				}
				confirmText="تأكيد"
				cancelText="إلغاء"
				confirmColor="red"
			/>{" "}
			{/* Required Documents Modal */}
			{/* TODO: RBAC - Only allow document requests if user has permission */}
			<RequiredDocumentsModal
				isOpen={showDocumentModal}
				onClose={() => setShowDocumentModal(false)}
				onSave={handleSaveRequiredDocuments}
				uploading={uploadingDoc}
			/>{" "}
			<Footer />
		</div>
	);
};

export default AdminShipmentManagement;
