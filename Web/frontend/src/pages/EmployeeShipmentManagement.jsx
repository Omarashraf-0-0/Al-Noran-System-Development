import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Stepper from "../components/Stepper";
import FileRow from "../components/FileRow";
import Footer from "../components/Footer";
import supportAgent from "../assets/images/support_agent.png";
import documentText from "../assets/images/document-text.png";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";
import contractIcon from "../assets/images/contract.png";
import Datafield from "../components/DataField";
import axios from "axios";
import { toast } from "react-hot-toast";

const EmployeeShipmentManagement = () => {
	const { shipmentId } = useParams();
	const navigate = useNavigate();

	const [shipment, setShipment] = useState(null);
	const [fileItems, setFileItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [user, setUser] = useState(null);

	// Status change state
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState("");
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// Required documents state
	const [showDocumentModal, setShowDocumentModal] = useState(false);
	const [requiredDocuments, setRequiredDocuments] = useState([]);
	const [newDocument, setNewDocument] = useState("");
	const [uploadingDoc, setUploadingDoc] = useState(false);

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
		// Get user from localStorage
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);

			// Check if user is employee
			if (parsedUser.type !== "employee") {
				toast.error("غير مصرح لك بالوصول لهذه الصفحة");
				navigate("/");
			}
		} else {
			toast.error("يجب تسجيل الدخول أولاً");
			navigate("/login");
		}
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

		if (token) {
			fetchShipmentData();
		}
	}, [shipmentId, token]);

	const getStatusColor = (status) => {
		const statusObj = availableStatuses.find((s) => s.value === status);
		return statusObj ? statusObj.color : "bg-gray-100 text-gray-800";
	};

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

			// Send required documents to backend
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

	const handleContactClient = () => {
		// TODO: Implement contact client functionality
		toast.info("سيتم إضافة نظام المراسلة قريباً");
	};

	if (loading) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<Header />
				<div className="flex justify-center items-center py-12 gap-4">
					<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
					<span className="text-gray-600 text-lg">
						جاري تحميل بيانات الشحنة...
					</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm">
						<div className="bg-red-50 border border-red-300 rounded-lg p-4 text-right">
							<p className="text-red-800 font-medium">❌ حدث خطأ: {error}</p>
							<button
								onClick={() => window.location.reload()}
								className="mt-2 bg-red-800 text-white px-4 py-2 rounded hover:bg-red-700 transition"
							>
								إعادة محاولة
							</button>
						</div>
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
							<div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 mb-8">
								<h3 className="text-xl font-bold text-red-900 mb-4 text-center">
									🔄 إدارة حالة الشحنة
								</h3>

								<div className="flex flex-col md:flex-row items-center justify-center gap-4">
									{/* Current Status Display */}
									<div className="text-center">
										<p className="text-sm text-gray-600 mb-2">
											الحالة الحالية:
										</p>
										<span
											className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(
												shipment.status
											)}`}
										>
											{availableStatuses.find(
												(s) => s.value === shipment.status
											)?.label || shipment.status}
										</span>
									</div>

									{/* Change Status Dropdown */}
									<div className="relative">
										<button
											onClick={() => setShowStatusDropdown(!showStatusDropdown)}
											className="bg-red-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-900 transition-all shadow-md flex items-center gap-2"
										>
											<span>تغيير الحالة</span>
											<svg
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
													clipRule="evenodd"
												/>
											</svg>
										</button>

										{/* Dropdown Menu */}
										{showStatusDropdown && (
											<div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
												<div className="p-2">
													{availableStatuses.map((status) => (
														<button
															key={status.value}
															onClick={() => handleStatusChange(status.value)}
															className={`w-full text-right px-4 py-3 rounded-md mb-1 transition-colors ${
																status.value === shipment.status
																	? "bg-red-50 text-red-800 font-bold"
																	: "hover:bg-gray-50 text-gray-700"
															}`}
														>
															<span
																className={`inline-block px-3 py-1 rounded-full text-sm ${status.color} mb-1`}
															>
																{status.label}
															</span>
														</button>
													))}
												</div>
											</div>
										)}
									</div>

									{/* Request Documents Button */}
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
								</div>
							</div>

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

							{/* Required Documents Status Section (for Employee) */}
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
			{showConfirmDialog && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
						<h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
							⚠️ تأكيد تغيير الحالة
						</h3>
						<p className="text-gray-600 text-center mb-6">
							هل أنت متأكد من تغيير حالة الشحنة إلى:
						</p>
						<div className="flex justify-center mb-6">
							<span
								className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${getStatusColor(
									selectedStatus
								)}`}
							>
								{
									availableStatuses.find((s) => s.value === selectedStatus)
										?.label
								}
							</span>
						</div>
						<p className="text-sm text-gray-500 text-center mb-6">
							سيتم إرسال إشعار للعميل بالتحديث
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setShowConfirmDialog(false)}
								className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
							>
								إلغاء
							</button>
							<button
								onClick={confirmStatusChange}
								className="flex-1 px-4 py-3 bg-red-800 text-white rounded-lg font-bold hover:bg-red-900 transition"
							>
								تأكيد
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Required Documents Modal */}
			{showDocumentModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-6">
							<h3 className="text-2xl font-bold text-gray-800">
								📄 طلب مستندات من العميل
							</h3>
							<button
								onClick={() => setShowDocumentModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<svg
									className="w-6 h-6"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
						</div>

						<p className="text-gray-600 mb-6">
							أضف المستندات المطلوبة من العميل. سيتم إرسال إشعار له بالمستندات
							التي يجب رفعها.
						</p>

						{/* Add Document Input */}
						<div className="flex gap-2 mb-4">
							<input
								type="text"
								value={newDocument}
								onChange={(e) => setNewDocument(e.target.value)}
								onKeyPress={(e) =>
									e.key === "Enter" && handleAddRequiredDocument()
								}
								placeholder="اسم المستند المطلوب (مثال: شهادة منشأ)"
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
							<button
								onClick={handleAddRequiredDocument}
								className="px-6 py-2 bg-red-800 text-white rounded-lg font-medium hover:bg-red-900 transition"
							>
								إضافة
							</button>
						</div>

						{/* Document List */}
						<div className="space-y-2 mb-6">
							{requiredDocuments.length === 0 ? (
								<div className="text-center py-8 bg-gray-50 rounded-lg">
									<p className="text-gray-500">لم يتم إضافة مستندات بعد</p>
								</div>
							) : (
								requiredDocuments.map((doc, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
									>
										<div className="flex items-center gap-2">
											<span className="text-red-800">📄</span>
											<span className="text-gray-800 font-medium">
												{doc.name}
											</span>
										</div>
										<button
											onClick={() => handleRemoveRequiredDocument(index)}
											className="text-red-600 hover:text-red-800"
										>
											<svg
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
													clipRule="evenodd"
												/>
											</svg>
										</button>
									</div>
								))
							)}
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3">
							<button
								onClick={() => setShowDocumentModal(false)}
								className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
							>
								إلغاء
							</button>
							<button
								onClick={handleSaveRequiredDocuments}
								disabled={requiredDocuments.length === 0 || uploadingDoc}
								className="flex-1 px-4 py-3 bg-red-800 text-white rounded-lg font-bold hover:bg-red-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
							>
								{uploadingDoc ? "جاري الإرسال..." : "إرسال الطلب للعميل"}
							</button>
						</div>
					</div>
				</div>
			)}

			<Footer />
		</div>
	);
};

export default EmployeeShipmentManagement;
