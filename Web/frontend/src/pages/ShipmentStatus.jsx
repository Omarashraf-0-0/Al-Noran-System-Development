import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Stepper from "../components/Stepper";
import FileRow from "../components/FileRow";
import Footer from "../components/Footer";
import NotificationBell from "../components/NotificationBell";
import supportAgent from "../assets/images/support_agent.png";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";
import contractIcon from "../assets/images/contract.png";
import Datafield from "../components/DataField";
import axios from "axios";
import { toast } from "react-hot-toast";
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

// Helper function to add notifications
const addNotification = (shipmentId, notification) => {
	const stored = localStorage.getItem(`notifications_${shipmentId}`);
	const notifications = stored ? JSON.parse(stored) : [];


	const newNotif = {
		id: Date.now(),
		...notification,
		timestamp: new Date().toISOString(),
		read: false,
	};

	notifications.unshift(newNotif);
	localStorage.setItem(
		`notifications_${shipmentId}`,
		JSON.stringify(notifications)
	);

	// Show toast
	toast(notification.message, {
		icon: notification.icon || "📢",
		duration: 5000,
	});
};

const ShipmentStatus = () => {
	const { shipmentId } = useParams();
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();

	const [shipment, setShipment] = useState(null);
	const [fileItems, setFileItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [requiredDocuments, setRequiredDocuments] = useState([]);
	const [showRequiredDocsModal, setShowRequiredDocsModal] = useState(false);
	// State for pending files (selected but not yet uploaded)
	const [pendingFiles, setPendingFiles] = useState({});
	const [uploadingDoc, setUploadingDoc] = useState(null);

	const token = localStorage.getItem("token");

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

				console.log("Fetching shipment with key:", shipmentId);

				let fetchedShipment = null;

				// 1. Check if shipmentId is a valid Mongo ID (24 hex chars)
				const isMongoId = /^[0-9a-fA-F]{24}$/.test(shipmentId);

				if (isMongoId) {
					// Fetch by ID directly
					try {
						const response = await axios.get(
							`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
							{ headers: { Authorization: `Bearer ${token}` } }
						);
						fetchedShipment = response.data;
					} catch (err) {
						if (err.response?.status === 404) {
							// If not found by ID, might be a 24-char code? Fallback to search
							console.Warn("Not found by ID, trying search...");
						} else {
							throw err;
						}
					}
				}

				// 2. If not MongoID or not found by ID, search by Code/ACID/Number46
				if (!fetchedShipment) {
					// We need the user ID to fetch their shipments
					const user = JSON.parse(localStorage.getItem("user"));
					const userId = user?.id || user?._id;

					if (!userId) {
						throw new Error("User ID not found");
					}

					const response = await axios.get(
						`${import.meta.env.VITE_API_URL}/api/shipments/user/${userId}`,
						{ headers: { Authorization: `Bearer ${token}` } }
					);

					const allShipments = response.data || [];
					fetchedShipment = allShipments.find(s => 
						s.shipmentCode === shipmentId || 
						s.acid === shipmentId || 
						s.number46 === shipmentId
					);
				}

				if (!fetchedShipment) {
					throw new Error("لم يتم العثور على الشحنة");
				}

				console.log("✅ Fetched shipment:", fetchedShipment);
				setShipment(fetchedShipment);
				const realId = fetchedShipment._id;

				// --- Fetch Related Data (Required Docs & Files) ---

				// Fetch required documents
				try {
					const requiredDocsResponse = await axios.get(
						`${import.meta.env.VITE_API_URL}/api/shipments/id/${realId}/required-documents`,
						{ headers: { Authorization: `Bearer ${token}` } }
					);

					const docs = requiredDocsResponse.data?.data?.requiredDocuments || [];
					setRequiredDocuments(docs);

					// Show modal if there are pending required documents
					const pendingDocs = docs.filter((doc) => !doc.uploaded);
					if (pendingDocs.length > 0) {
						toast("لديك مستندات مطلوبة يجب رفعها", {
							icon: "📄",
							duration: 5000,
						});
					}
				} catch (reqDocsError) {
					console.log("Note: Could not fetch required documents:", reqDocsError.message);
					setRequiredDocuments([]);
				}

				// Fetch shipment files/uploads
				try {
					const filesResponse = await axios.get(
						`${import.meta.env.VITE_API_URL}/api/uploads?category=shipment&relatedId=${realId}`,
						{ headers: { Authorization: `Bearer ${token}` } }
					);

					console.log("Fetched files:", filesResponse.data);

					// API returns { success, count, uploads: [...] }
					const uploads = filesResponse.data?.uploads || filesResponse.data || [];

					const shipmentFiles = uploads.map((file) => ({
						name: file.filename || file.originalname || "ملف",
						date: new Date(file.uploadedAt || file.createdAt).toLocaleDateString("ar-EG", {
							day: "numeric",
							month: "long",
							year: "numeric",
						}),
						url: file.presignedUrl || file.url,
						id: file._id,
						documentType: file.documentType,
						description: file.description,
					}));

					setFileItems(shipmentFiles);
				} catch (fileError) {
					console.log("Note: Could not fetch files:", fileError.message);
					setFileItems([]);
				}

			} catch (error) {
				console.error("Error fetching shipment data:", error);
				const errorMessage = error.response?.data?.message || error.message || "فشل تحميل بيانات الشحنة";
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchShipmentData();

		// Polling disabled for testing
		// const pollInterval = setInterval(() => {
		// 	fetchShipmentData();
		// }, 30000);

		// return () => clearInterval(pollInterval);
	}, [shipmentId, token]);

	// Watch for status changes
	useEffect(() => {
		if (shipment && shipment.status) {
			const lastStatus = localStorage.getItem(`lastStatus_${shipmentId}`);

			if (lastStatus && lastStatus !== shipment.status) {
				// Status changed!
				addNotification(shipmentId, {
					icon: "🚚",
					title: "تحديث حالة الشحنة",
					message: `تم تغيير حالة شحنتك إلى: ${shipment.status}`,
				});
			}

			localStorage.setItem(`lastStatus_${shipmentId}`, shipment.status);
		}
	}, [shipment?.status, shipmentId]);

	// Watch for new required documents
	useEffect(() => {
		if (requiredDocuments.length > 0) {
			const lastCount = parseInt(
				localStorage.getItem(`lastReqDocsCount_${shipmentId}`) || "0"
			);

			if (requiredDocuments.length > lastCount) {
				const newDocs = requiredDocuments.slice(
					0,
					requiredDocuments.length - lastCount
				);
				newDocs.forEach((doc) => {
					if (!doc.uploaded) {
						addNotification(shipmentId, {
							icon: "📄",
							title: "مستند جديد مطلوب",
							message: `يرجى رفع: ${doc.name}`,
						});
					}
				});
			}

			localStorage.setItem(
				`lastReqDocsCount_${shipmentId}`,
				requiredDocuments.length.toString()
			);
		}
	}, [requiredDocuments.length, shipmentId]);

	return (
		// Full page wrapper
		<div className={`min-h-screen transition-colors ${isDarkMode ? "bg-[#0a0505] text-gray-200" : "bg-gray-50 text-gray-800"}`}>
			{/*  Header Section */}
			<Header />

			{/*  Main content area */}
			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Centered content card */}
				<div className={`max-w-5xl mx-auto p-6 sm:p-10 rounded-2xl shadow-sm transition-colors ${isDarkMode ? "bg-[#1a1010]/80" : "bg-white"}`}>
					{/* Loading State */}
					{loading ? (
						<div className="flex justify-center items-center py-12 gap-4">
							<div className={`spinner border-4 rounded-full w-12 h-12 animate-spin ${isDarkMode ? "border-gray-700 border-t-red-700" : "border-gray-300 border-t-red-800"}`}></div>
							<span className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
								جاري تحميل بيانات الشحنة...
							</span>
						</div>
					) : error ? (
						<div className={`border rounded-lg p-4 text-right ${isDarkMode ? "bg-red-900/20 border-red-700/50" : "bg-red-50 border-red-300"}`}>
							<p className={`font-medium ${isDarkMode ? "text-red-400" : "text-red-800"}`}>حدث خطأ: {error}</p>
							<button
								onClick={() => window.location.reload()}
								className="mt-2 bg-red-800 text-white px-4 py-2 rounded hover:bg-red-700 transition"
							>
								إعادة محاولة
							</button>
						</div>
					) : shipment ? (
						<>
							{/* Notification Bell */}
							<div className="flex justify-end mb-4">
								<NotificationBell shipmentId={shipment._id} />
							</div>

							{/*  Top illustration */}
							<div className="flex justify-center mb-10">
								<img
									src={mainIllustration}
									alt="Shipment Illustration"
									className="w-full max-w-lg h-auto"
								/>
							</div>

							{/*  Stepper: shipment status progress */}
							<Stepper currentStatus={shipment.status} />

							{/*  Input fields section - Display real shipment data */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-12 mb-12">
								<Datafield
									label="اسم المورد"
									value={
										shipment.importerName || "غير محدد"
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
									label="نوع الشحنة"
									value={
										shipment.shipment_type === "جوي" ? "✈️ جوي" : "🚢 بحري"
									}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="الحالة"
									value={shipment.status || "قيد الانتظار"}
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
									label="ميناء الوصول"
									value={shipment.port_name || "غير محدد"}
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
									label="أنواع الحاويات"
									value={shipment.type_of_containers?.join(", ") || "غير محدد"}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="رقم 46"
									value={shipment.number46 || "غير محدد"}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="البوليصة (اختياري)"
									value={shipment.policy || "غير محدد"}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
								<Datafield
									label="تاريخ إصدار الـ ACID"
									value={
										shipment.acid_request_id?.createdAt
											? new Date(shipment.acid_request_id.createdAt).toLocaleDateString(
													"ar-EG"
											  )
											: shipment.createdAt
											? new Date(shipment.createdAt).toLocaleDateString("ar-EG")
											: "غير محدد"
									}
									icon={
										<img src={contractIcon} alt="icon" className="w-5 h-5" />
									}
								/>
							</div>

							{/* Proforma Invoice Section - من طلب ACID */}
							{shipment.acid_request_id?.uploads &&
								shipment.acid_request_id.uploads.length > 0 && (
									<div className={`mt-12 border-2 rounded-xl p-6 ${
										isDarkMode 
											? "bg-blue-900/20 border-blue-700/30" 
											: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
									}`}>
										<h2 className={`text-2xl font-bold flex items-center gap-2 mb-6 ${isDarkMode ? "text-red-400" : "text-red-900"}`}>
											<span>الفاتورة المبدئية</span>
										</h2>
										<div className="space-y-3">
											{shipment.acid_request_id.uploads.map((upload, index) => (
												<div
													key={upload._id || index}
													className={`flex items-center justify-between rounded-lg p-4 hover:shadow-md transition border ${
														isDarkMode 
															? "bg-blue-900/30 border-blue-700/40" 
															: "bg-white border-blue-200"
													}`}
												>
													<div className="flex items-center gap-3">
														<div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? "bg-blue-900/50" : "bg-blue-100"}`}>
															<span className="text-2xl">📄</span>
														</div>
														<div className="text-right">
															<p className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
																{upload.originalname ||
																	upload.filename ||
																	"فاتورة مبدئية"}
															</p>
															<p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
																{upload.createdAt
																	? new Date(
																			upload.createdAt
																	  ).toLocaleDateString("ar-EG")
																	: ""}
															</p>
														</div>
													</div>
													<button
														onClick={async () => {
															try {
																toast.loading("جاري تحميل الملف...");
																console.log(
																	"📥 Fetching upload with ID:",
																	upload._id
																);

																const fileResponse = await axios.get(
																	`${
																		import.meta.env.VITE_API_URL
																	}/api/uploads/${upload._id}`,
																	{
																		headers: {
																			Authorization: `Bearer ${token}`,
																		},
																	}
																);

																console.log(
																	"✅ Upload response:",
																	fileResponse.data
																);
																toast.dismiss();

																const fileUrl =
																	fileResponse.data?.presignedUrl ||
																	fileResponse.data?.upload?.presignedUrl ||
																	fileResponse.data?.url ||
																	fileResponse.data?.upload?.url ||
																	fileResponse.data?.s3Url ||
																	fileResponse.data?.upload?.s3Url;

																console.log("🔗 File URL:", fileUrl);

																if (fileUrl) {
																	window.open(fileUrl, "_blank");
																} else {
																	console.error(
																		"❌ No URL found in response:",
																		fileResponse.data
																	);
																	toast.error("لم يتم العثور على رابط الملف");
																}
															} catch (error) {
																toast.dismiss();
																toast.error("فشل تحميل الملف");
																console.error(
																	"❌ Error downloading file:",
																	error
																);
																console.error(
																	"Error details:",
																	error.response?.data
																);
															}
														}}
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
											))}
										</div>
									</div>
								)}

							{/* Required Documents Section */}
							{requiredDocuments.length > 0 && (
								<div className={`mt-12 border-2 rounded-xl p-6 ${
									isDarkMode 
										? "bg-orange-900/20 border-orange-700/40" 
										: "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200"
								}`}>
									<div className="flex items-center justify-between mb-6">
										<h2 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? "text-red-400" : "text-red-900"}`}>
											<span>مستندات الشحنه</span>
										</h2>
										{requiredDocuments.filter((doc) => !doc.uploaded).length >
											0 && (
											<span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
												{
													requiredDocuments.filter((doc) => !doc.uploaded)
														.length
												}{" "}
												قيد الانتظار
											</span>
										)}
									</div>

									<div className="space-y-3">
										{requiredDocuments.map((doc, index) => {
											// Debug logging
											console.log(`Document "${doc.name}":`, {
												uploaded: doc.uploaded,
												fileId: doc.fileId,
												showViewButton: doc.uploaded && doc.fileId,
											});

											return (
												<div
													key={doc._id || index}
													className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
														doc.uploaded
															? isDarkMode 
																? "bg-green-900/20 border-green-700/40" 
																: "bg-green-50 border-green-300"
															: isDarkMode 
																? "bg-[#1a1010] border-orange-700/50 hover:border-orange-600/70" 
																: "bg-white border-orange-300 hover:border-orange-400"
													}`}
												>
													<div className="flex items-center gap-3 flex-1">
														{doc.uploaded ? (
															<span className="text-2xl">✅</span>
														) : (
															<span className="text-2xl animate-pulse">⏳</span>
														)}
														<div>
															<p className={`font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
																{doc.name}
															</p>
															<p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
																{doc.uploaded
																	? `تم الرفع: ${new Date(
																			doc.uploadedAt
																	  ).toLocaleDateString("ar-EG")}`
																	: `مطلوب منذ: ${new Date(
																			doc.requestedAt
																	  ).toLocaleDateString("ar-EG")}`}
															</p>
														</div>
													</div>

													<div className="flex gap-2">
														{doc.uploaded && doc.fileId ? (
															<>
																<button
																	onClick={async () => {
																		try {
																			console.log(
																				"Fetching file with ID:",
																				doc.fileId
																			);
																			toast.loading("جاري تحميل الملف...");
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
																			console.log(
																				"File response:",
																				fileResponse.data
																			);
																			toast.dismiss();
																			const fileUrl =
																				fileResponse.data?.upload?.presignedUrl ||
																				fileResponse.data?.presignedUrl;
																			console.log("Presigned URL:", fileUrl);
																			if (fileUrl) {
																				window.open(fileUrl, "_blank");
																			} else {
																				toast.error(
																					"لم يتم العثور على رابط الملف"
																				);
																				console.error(
																					"No presigned URL found in response"
																				);
																			}
																		} catch (error) {
																			toast.dismiss();
																			const errorMsg =
																				error.response?.data?.message ||
																				error.message;
																			toast.error(`فشل تحميل الملف: ${errorMsg}`);
																			console.error("File fetch error:", {
																				fileId: doc.fileId,
																				error:
																					error.response?.data || error.message,
																				fullError: error,
																			});
																		}
																	}}
																	className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-1"
																	title="عرض"
																>
																	<Eye className="w-4 h-4" />
																</button>
																<button
																	onClick={() => handleProxyDownload(doc.fileId, doc.name || "document")}
																	className="bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-1"
																	title="تحميل"
																>
																	<Download className="w-4 h-4" />
																</button>
															</>
														) : (
															<button
																onClick={() => {
																	setShowRequiredDocsModal(true);
																}}
																className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition"
															>
																رفع الآن
															</button>
														)}
													</div>
												</div>
											);
										})}
									</div>

									{requiredDocuments.filter((doc) => !doc.uploaded).length >
										0 && (
										<div className={`mt-4 p-4 border rounded-lg ${
											isDarkMode 
												? "bg-yellow-900/20 border-yellow-700/40" 
												: "bg-yellow-50 border-yellow-300"
										}`}>
											<p className={`text-sm text-center ${isDarkMode ? "text-yellow-400" : "text-yellow-800"}`}>
												يرجى رفع المستندات المطلوبة لتجنب أي تأخير في معالجة
												شحنتك
											</p>
										</div>
									)}
								</div>
							)}

							{/*  Shipment files section */}
							{/* <div className="mt-16">
								<h2 className="text-2xl font-bold text-center text-red-900 mb-8">
									📁 ملفات الشحنة
								</h2>
								{fileItems.length === 0 ? (
									<p className="text-center text-gray-500">
										لا توجد ملفات متاحة
									</p>
								) : (
									<div className="space-y-4">
										{fileItems.map((item, index) => (
											<FileRow
												key={index}
												name={item.name}
												date={item.date}
												documentType={item.documentType}
												description={item.description}
												url={item.url}
												id={item.id}
											/>
										))}
									</div>
								)}
							</div> */}

							{/*  Action buttons */}
							<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
								{/* Contact Your Agent Button */}
								{shipment?.employee_id && (
									<button
										onClick={() => navigate(`/shipment-chat/${shipment._id}`)}
										className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-900 to-red-700 text-white font-bold rounded-lg shadow-md hover:from-red-800 hover:to-red-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700"
									>
										<svg
											className="w-6 h-6"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
												clipRule="evenodd"
											/>
										</svg>
										<span>تواصل مع موظفك</span>
									</button>
								)}
							</div>
						</>
					) : null}
				</div>
			</main>

			{/* Required Documents Upload Modal */}
			{showRequiredDocsModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className={`rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto ${
						isDarkMode ? "bg-[#1a1010]" : "bg-white"
					}`}>
						<div className="flex justify-between items-center mb-6">
							<h3 className={`text-2xl font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
								رفع المستندات المطلوبة
							</h3>
							<button
								onClick={() => setShowRequiredDocsModal(false)}
								className={`${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
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

						<div className="space-y-4">
							{requiredDocuments
								.filter((doc) => !doc.uploaded)
								.map((doc, index) => {
									const pendingFile = pendingFiles[doc._id];
									const isUploading = uploadingDoc === doc._id;
									
									// Handler for file selection (just saves to state, doesn't upload)
									const handleFileSelect = (e) => {
										const file = e.target.files[0];
										if (!file) return;
										
										// Validate file size (10MB max)
										if (file.size > 10 * 1024 * 1024) {
											toast.error("حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت");
											e.target.value = "";
											return;
										}
										
										setPendingFiles(prev => ({
											...prev,
											[doc._id]: file
										}));
									};
									
									// Handler to save/upload the file
									const handleSaveFile = async () => {
										if (!pendingFile) return;
										
										try {
											setUploadingDoc(doc._id);
											toast.loading("جاري رفع المستند...");

											// Step 1: Upload file to S3
											const formData = new FormData();
											formData.append("file", pendingFile);
											formData.append("category", "shipment");
											formData.append("relatedId", shipment._id);
											formData.append("documentType", "other");
											formData.append("description", `Required document: ${doc.name}`);

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
												uploadResponse.data?.upload?.id ||
												uploadResponse.data?.upload?._id ||
												uploadResponse.data?.id ||
												uploadResponse.data?._id;

											if (!uploadedFileId) {
												throw new Error("No file ID returned from upload");
											}

											// Step 2: Mark document as uploaded in shipment
											await axios.patch(
												`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipment._id}/required-documents/${doc._id}`,
												{ fileId: uploadedFileId },
												{
													headers: { Authorization: `Bearer ${token}` },
												}
											);

											toast.dismiss();
											toast.success("تم رفع المستند بنجاح");

											// Clear pending file
											handleCancelFile();

											// Refresh required documents
											const updatedReqDocsResponse = await axios.get(
												`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipment._id}/required-documents`,
												{ headers: { Authorization: `Bearer ${token}` } }
											);
											const updatedDocs = updatedReqDocsResponse.data?.data?.requiredDocuments || [];
											setRequiredDocuments(updatedDocs);

											// Refresh shipment state
											const shipmentRefresh = await axios.get(
												`${import.meta.env.VITE_API_URL}/api/shipments/${shipmentId}`,
												{ headers: { Authorization: `Bearer ${token}` } }
											);
											setShipment(shipmentRefresh.data);

											// Refresh files list
											const filesResponse = await axios.get(
												`${import.meta.env.VITE_API_URL}/api/uploads?category=shipment&relatedId=${shipment._id}`,
												{ headers: { Authorization: `Bearer ${token}` } }
											);
											const uploads = filesResponse.data?.uploads || filesResponse.data || [];
											const shipmentFiles = uploads.map((file) => ({
												name: file.filename || file.originalname || "ملف",
												date: new Date(file.uploadedAt || file.createdAt).toLocaleDateString("ar-EG", {
													day: "numeric", month: "long", year: "numeric",
												}),
												url: file.presignedUrl || file.url,
												id: file._id,
												documentType: file.documentType,
												description: file.description,
											}));
											setFileItems(shipmentFiles);

											// Close modal if all docs uploaded
											const remaining = updatedDocs.filter(d => !d.uploaded);
											if (remaining.length === 0) {
												setShowRequiredDocsModal(false);
											}
										} catch (error) {
											toast.dismiss();
											toast.error("فشل رفع المستند: " + (error.response?.data?.message || error.message));
											console.error("Upload error:", error);
										} finally {
											setUploadingDoc(null);
										}
									};
									
									return (
										<div
											key={doc._id || index}
											className={`border-2 rounded-lg p-4 ${
												isDarkMode ? "border-orange-700/50 bg-orange-900/20" : "border-orange-200"
											}`}
										>
											<div className="flex items-center justify-between mb-3">
												<h4 className={`font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{doc.name}</h4>
												<span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
													مطلوب منذ{" "}
													{new Date(doc.requestedAt).toLocaleDateString("ar-EG")}
												</span>
											</div>

											{pendingFile ? (
												// Show selected file with save/delete buttons
												<div className="space-y-3">
													<div className={`flex items-center gap-2 p-3 rounded-lg ${
														isDarkMode ? "bg-blue-900/30 border border-blue-700/50" : "bg-blue-50 border border-blue-200"
													}`}>
														<span className="text-xl">📄</span>
														<div className="flex-1 min-w-0">
															<p className={`font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{pendingFile.name}</p>
															<p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
																{(pendingFile.size / 1024).toFixed(1)} KB
															</p>
														</div>
													</div>
													<div className="flex gap-2">
														<button
															onClick={handleSaveFile}
															disabled={isUploading}
															className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
														>
															{isUploading ? (
																<>
																	<span className="animate-spin">⏳</span>
																	جاري الحفظ...
																</>
															) : (
																<>
																	<span>✓</span>
																	حفظ
																</>
															)}
														</button>
														<button
															onClick={handleCancelFile}
															disabled={isUploading}
															className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
														>
															<span>✕</span>
															حذف
														</button>
													</div>
												</div>
											) : (
												// Show file selection button
												<div className="flex gap-2">
													<input
														type="file"
														id={`file-${doc._id}`}
														className="hidden"
														onChange={handleFileSelect}
													/>
													<label
														htmlFor={`file-${doc._id}`}
														className="flex-1 cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition text-center"
													>
														اختر ملف
													</label>
												</div>
											)}
										</div>
									);
								})}

							{requiredDocuments.filter((doc) => !doc.uploaded).length ===
								0 && (
								<div className="text-center py-8">
									<span className="text-6xl">✅</span>
									<p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
										تم رفع جميع المستندات المطلوبة
									</p>
								</div>
							)}
						</div>

						<div className="mt-6 flex justify-end">
							<button
								onClick={() => setShowRequiredDocsModal(false)}
								className={`px-6 py-2 rounded-lg font-medium transition ${
									isDarkMode 
										? "bg-gray-700 text-gray-200 hover:bg-gray-600" 
										: "bg-gray-200 text-gray-700 hover:bg-gray-300"
								}`}
							>
								إغلاق
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Footer Section */}
			<Footer />
		</div>
	);
};

export default ShipmentStatus;
