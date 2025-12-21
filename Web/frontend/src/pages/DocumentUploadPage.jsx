import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import LoadingSpinner from "../components/LoadingSpinner";
import UploadProgress from "../components/UploadProgress";
import DocumentUploadCard from "../components/DocumentUploadCard";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Tesseract from "tesseract.js";
import { useTheme } from "../context/ThemeContext";
import { AlertCircle, FileText, UploadCloud, Save, X, CheckCircle } from "lucide-react";
import FileViewerModal from "../components/FileViewerModal";

const DocumentUploadPage = () => {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	const [userInfo, setUserInfo] = useState(null);
	const [clientType, setClientType] = useState(null);
	const [isEgyptian, setIsEgyptian] = useState(true); // Default to Egyptian
	const [uploads, setUploads] = useState({});
	const [uploading, setUploading] = useState({});
	const [progress, setProgress] = useState({});
	const [viewerData, setViewerData] = useState({ open: false, url: null, name: null, type: null });

	// Document requirements based on client type
	const documentRequirements = {
		factory: [
			{ key: "commercial_register", label: "السجل التجاري", required: true },
			{ key: "tax_card", label: "البطاقة الضريبية", required: true },
			{ key: "contract", label: "العقد", required: true },
			{ key: "industrial_register", label: "السجل الصناعي", required: true },
			{ key: "certificate_vat", label: "شهادة القيمة المضافة", required: true },
			{ key: "production_supplies", label: "مستلزمات الإنتاج", required: true },
			{ key: "power_of_attorney", label: "التوكيل", required: true },
			{ key: "personal_id_of_representative", label: "بطاقة ممثل", required: true },
		],
		commercial: [
			{ key: "commercial_register", label: "السجل التجاري", required: true },
			{ key: "tax_card", label: "البطاقة الضريبية", required: true },
			{ key: "contract", label: "العقد", required: true },
			{ key: "certificate_vat", label: "شهادة القيمة المضافة", required: true },
			{ key: "import_export_card", label: "بطاقة استيراد/تصدير", required: true },
			{ key: "power_of_attorney", label: "التوكيل", required: true },
			{ key: "personal_id_of_representative", label: "بطاقة ممثل", required: true },
			{ key: "trade_certificates", label: "شهادات تجارية", required: true },
		],
		personal: [
			{ key: "power_of_attorney", label: "التوكيل", required: true },
			isEgyptian
				? { key: "personal_id", label: "البطاقة الشخصية", required: true }
				: { key: "passport", label: "جواز السفر", required: true },
		],
	};

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("يجب تسجيل الدخول أولاً");
			navigate("/login");
			return;
		}
		fetchUserInfo(token);
		fetchExistingUploads(token);
	}, []);

	const fetchUserInfo = async (token) => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/auth/me`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setUserInfo(response.data.user);
			setClientType(response.data.user.clientDetails?.clientType || "personal");
			localStorage.setItem("user", JSON.stringify(response.data.user));

			try {
				const checkRes = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/users/check-verification`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				if (checkRes.data && checkRes.data.user) {
					setUserInfo(checkRes.data.user);
					localStorage.setItem("user", JSON.stringify(checkRes.data.user));
				}
			} catch (err) {
				console.error("Verification check failed:", err);
			}
		} catch (error) {
			console.error("Error fetching user info:", error);
			if (error.response?.status === 401) {
				toast.error("جلسة منتهية، يرجى تسجيل الدخول مرة أخرى");
				localStorage.removeItem("token");
				navigate("/login");
			}
		}
	};

	const fetchExistingUploads = async (token) => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads?category=registration`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			const existingUploads = {};
			response.data.uploads?.forEach((upload) => {
				if (upload.documentType) {
					existingUploads[upload.documentType] = {
						id: upload._id || upload.id,
						filename: upload.filename,
						url: upload.url,
						uploadedAt: upload.uploadedAt,
						approvalStatus: upload.approvalStatus || "pending",
						rejectionReason: upload.rejectionReason,
					};
				}
			});
			setUploads(existingUploads);

			if (existingUploads["passport"]) {
				setIsEgyptian(false);
			}
		} catch (error) {
			console.error("Error fetching existing uploads:", error);
		}
	};

	const handleFileSelect = async (documentKey, documentType, file) => {
		if (!file) return;

		const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("نوع الملف غير مدعوم. الرجاء رفع PDF أو صورة فقط");
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			toast.error("حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت");
			return;
		}

		if (isEgyptian && (documentKey === "personal_id" || documentKey === "personal_id_of_representative")) {
			const loadingToast = toast.loading("جاري التحقق من هوية المستند...");
			try {
				const result = await Tesseract.recognize(file, "ara+eng");
				const text = result.data.text.toLowerCase();
				const keywords = ["مصر", "بطاقة", "قومي", "egypt", "identity", "national", "جمهورية", "id"];
				const isValid = keywords.some((keyword) => text.includes(keyword));

				toast.dismiss(loadingToast);
				if (!isValid) {
					toast.error("عفواً، هذا المستند لا يبدو وكأنه بطاقة رقم قومي مصرية. يرجى رفع صورة واضحة.");
					return;
				}
				toast.success("تم التحقق من المستند بنجاح! ✅");
			} catch (err) {
				toast.dismiss(loadingToast);
				toast.error("حدث خطأ أثناء فحص المستند.");
				return;
			}
		}

		setUploading((prev) => ({ ...prev, [documentKey]: true }));
		setProgress((prev) => ({ ...prev, [documentKey]: 0 }));

		const formData = new FormData();
		formData.append("file", file);
		formData.append("category", "registration");
		formData.append("userType", "client");
		formData.append("clientType", clientType);
		formData.append("documentType", documentType);

		try {
			const token = localStorage.getItem("token");
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/uploads`,
				formData,
				{
					headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
					onUploadProgress: (progressEvent) => {
						const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
						setProgress((prev) => ({ ...prev, [documentKey]: percentCompleted }));
					},
				}
			);

			if (response.status === 200 || response.data.success) {
				const uploadedFile = response.data.file || response.data.upload;
				if (uploadedFile) {
					setUploads((prev) => ({
						...prev,
						[documentKey]: {
							id: uploadedFile.id || uploadedFile._id,
							filename: uploadedFile.filename || uploadedFile.originalname,
							url: uploadedFile.url || uploadedFile.location,
							uploadedAt: uploadedFile.createdAt || uploadedFile.uploadedAt || new Date().toISOString(),
							// Preserve existing approval status if available, otherwise pending
							approvalStatus: uploadedFile.approvalStatus || "pending", 
							rejectionReason: uploadedFile.rejectionReason,
						},
					}));
					toast.success(`تم رفع ${documentType} بنجاح`);
				}
			}
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(error.response?.data?.message || "فشل رفع الملف.");
		} finally {
			setUploading((prev) => ({ ...prev, [documentKey]: false }));
		}
	};

	const handleDeleteUpload = async (documentKey, uploadId) => {
		try {
			const token = localStorage.getItem("token");
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/uploads/${uploadId}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setUploads((prev) => {
				const newUploads = { ...prev };
				delete newUploads[documentKey];
				return newUploads;
			});
			toast.success("تم حذف الملف بنجاح");
		} catch (error) {
			toast.error("فشل حذف الملف");
		}
	};

	const handleViewDocument = async (uploadId) => {
		try {
			const token = localStorage.getItem("token");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${uploadId}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.upload?.permissionError) {
				toast.error("لا يمكن عرض الملف حالياً بسبب قيود AWS. يرجى الاتصال بالمسؤول.");
				return;
			}

			if (response.data.success && response.data.upload.url) {
				setViewerData({
					open: true,
					url: response.data.upload.url,
					name: response.data.upload.filename || "المستند",
					type: response.data.upload.mimetype || (response.data.upload.filename?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
					fileId: uploadId
				});
			} else {
				toast.error("فشل في الحصول على رابط الملف");
			}
		} catch (error) {
			toast.error("فشل في عرض الملف");
		}
	};

	const handleFinish = () => {
		const requirements = documentRequirements[clientType] || [];
		const requiredKeys = requirements.map((doc) => doc.key);
		const uploadedCount = Object.keys(uploads).filter((key) => requiredKeys.includes(key)).length;
		const totalRequired = requirements.length;

		if (uploadedCount < totalRequired) {
			toast.success(`تم حفظ تقدمك (${uploadedCount}/${totalRequired}).`, { duration: 4000 });
		} else {
			toast.success("تم رفع جميع المستندات المطلوبة بنجاح! ✅", { duration: 4000 });
		}
		navigate("/home");
	};

	if (!clientType) {
		return <LoadingSpinner />;
	}

	const requirements = documentRequirements[clientType] || [];
	const requiredKeys = requirements.map((doc) => doc.key);
	const completedCount = Object.keys(uploads).filter((key) => requiredKeys.includes(key)).length;
	const totalCount = requirements.length;

	return (
		<>
			<BackgroundContainer>
				<Header />
				<div className="pt-24 pb-12 w-full flex justify-center">
					<FormContainer title="رفع المستندات المطلوبة">
						<div className="w-full max-w-4xl mx-auto p-2" dir="rtl">
							
							{/* Header Section */}
							<div className="text-center mb-8">
								<h1 className={`text-3xl font-bold mb-3 flex items-center justify-center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
									<UploadCloud className="text-red-600" size={32} />
									رفع المستندات المطلوبة
								</h1>
								<p className={`text-lg font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
									نوع العميل:{" "}
									<span className="text-red-600 font-bold">
										{clientType === "factory" ? "مصنع" : clientType === "commercial" ? "تجاري" : "فردي"}
									</span>
								</p>
							</div>

							{/* Verification Warning */}
							{!userInfo?.clientDetails?.documentsVerified && (
								<div className={`mb-8 p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
									isDarkMode ? "bg-orange-900/10 border-orange-500/30" : "bg-orange-50 border-orange-200"
								}`}>
									<AlertCircle className="text-orange-500 shrink-0 mt-1" size={24} />
									<div>
										<h3 className={`font-bold text-lg mb-1 ${isDarkMode ? "text-orange-400" : "text-orange-800"}`}>
											تنبيه هام
										</h3>
										<p className={`text-sm ${isDarkMode ? "text-orange-300/80" : "text-orange-700"}`}>
											لا يمكنك استخدام باقي خصائص التطبيق حتى يتم رفع جميع المستندات المطلوبة ومراجعتها والموافقة عليها من قبل الإدارة.
										</p>
									</div>
								</div>
							)}

							{/* Progress Bar */}
							<UploadProgress completedCount={completedCount} totalCount={totalCount} />

							{/* Nationality Toggle (Personal) */}
							{clientType === "personal" && (
								<div className={`mb-8 p-6 rounded-2xl border transition-all ${
									isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
								}`}>
									<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
										<span className={`font-bold text-lg ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
											الجنسية:
										</span>
										<div className="flex items-center gap-4 bg-black/5 dark:bg-black/20 p-1 rounded-xl">
											{[
												{ isEg: true, label: "مصري (بطاقة رقم قومي)" },
												{ isEg: false, label: "غير مصري (جواز سفر)" }
											].map((opt) => (
												<button
													key={opt.label}
													onClick={() => setIsEgyptian(opt.isEg)}
													className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
														isEgyptian === opt.isEg
															? "bg-red-600 text-white shadow-lg"
															: "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
													}`}
												>
													{opt.label}
												</button>
											))}
										</div>
									</div>
								</div>
							)}

							{/* Documents List */}
							<div className="space-y-4 mb-10">
								{requirements.map((doc, index) => (
									<DocumentUploadCard
										key={doc.key}
										doc={doc}
										index={index}
										isUploaded={uploads[doc.key]}
										isUploading={uploading[doc.key]}
										uploadProgress={progress[doc.key] || 0}
										onFileSelect={handleFileSelect}
										onView={handleViewDocument}
										onDelete={handleDeleteUpload}
									/>
								))}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-4 justify-center mt-8">
								<button
									onClick={() => navigate("/home")}
									className={`px-6 py-3 rounded-xl font-bold border transition-colors ${
										isDarkMode 
											? "border-gray-700 text-gray-300 hover:bg-white/5" 
											: "border-gray-300 text-gray-700 hover:bg-gray-50"
									}`}
								>
									إلغاء
								</button>
								<button
									onClick={handleFinish}
									className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${
										completedCount === totalCount
											? "bg-gradient-to-r from-green-600 to-green-500 hover:shadow-green-500/30 text-white"
											: "bg-gradient-to-r from-red-700 to-red-600 hover:shadow-red-500/30 text-white"
									} hover:scale-105 active:scale-95`}
								>
									{completedCount === totalCount ? <CheckCircle size={20} /> : <Save size={20} />}
									{completedCount === totalCount ? "إنهاء وإرسال" : "حفظ والخروج"}
								</button>
							</div>

							{/* Helper Text */}
							<div className={`mt-8 p-4 rounded-xl border text-center ${
								isDarkMode ? "bg-blue-900/10 border-blue-500/20 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-800"
							}`}>
								<p className="text-sm font-medium">
									💡 يمكنك رفع المستندات تدريجياً. تقدمك محفوظ ويمكنك الاستكمال في أي وقت.
								</p>
							</div>

						</div>
					</FormContainer>
				</div>
			</BackgroundContainer>

			<FileViewerModal
				isOpen={viewerData.open}
				onClose={() => setViewerData(prev => ({ ...prev, open: false }))}
				fileUrl={viewerData.url}
				fileName={viewerData.name}
				fileType={viewerData.type}
				fileId={viewerData.fileId}
			/>
		</>
	);
};

export default DocumentUploadPage;
