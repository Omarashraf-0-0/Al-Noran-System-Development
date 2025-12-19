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

const DocumentUploadPage = () => {
	const navigate = useNavigate();
	const [userInfo, setUserInfo] = useState(null);
	const [clientType, setClientType] = useState(null);
	const [isEgyptian, setIsEgyptian] = useState(true); // Default to Egyptian
	const [uploads, setUploads] = useState({});
	const [uploading, setUploading] = useState({});
	const [progress, setProgress] = useState({});

	// TODO: RBAC - Get user permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canUploadDocuments = hasPermission('document:upload');
	// const canDeleteDocuments = hasPermission('document:delete');
	// const canViewDocuments = hasPermission('document:view');

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
			{
				key: "personal_id_of_representative",
				label: "بطاقة ممثل",
				required: true,
			},
		],
		commercial: [
			{ key: "commercial_register", label: "السجل التجاري", required: true },
			{ key: "tax_card", label: "البطاقة الضريبية", required: true },
			{ key: "contract", label: "العقد", required: true },
			{ key: "certificate_vat", label: "شهادة القيمة المضافة", required: true },
			{
				key: "import_export_card",
				label: "بطاقة استيراد/تصدير",
				required: true,
			},
			{ key: "power_of_attorney", label: "التوكيل", required: true },
			{
				key: "personal_id_of_representative",
				label: "بطاقة ممثل",
				required: true,
			},
			{ key: "trade_certificates", label: "شهادات تجارية", required: true },
		],
		personal: [
			{ key: "power_of_attorney", label: "التوكيل", required: true },
			// Dynamic requirement based on isEgyptian state
			isEgyptian
				? { key: "personal_id", label: "البطاقة الشخصية", required: true }
				: { key: "passport", label: "جواز السفر", required: true },
			// { key: "sample_document", label: "مستند داعم", required: true },
		],
	};

	useEffect(() => {
		// Check if user is logged in
		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("يجب تسجيل الدخول أولاً");
			navigate("/login");
			return;
		}

		// Get user info from token or API
		fetchUserInfo(token);
		fetchExistingUploads(token);
	}, []);

	const fetchUserInfo = async (token) => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/auth/me`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			setUserInfo(response.data.user);
			setClientType(response.data.user.clientDetails?.clientType || "personal");

			// Update localStorage with fresh user info to reflect verification status immediately
			localStorage.setItem("user", JSON.stringify(response.data.user));

			// Check verification status from backend (auto-verify if consistent)
			try {
				const checkRes = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/users/check-verification`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				if (checkRes.data && checkRes.data.user) {
					console.log("Verified status checked:", checkRes.data.verified);
					setUserInfo(checkRes.data.user);
					localStorage.setItem("user", JSON.stringify(checkRes.data.user));
				}
			} catch (err) {
				console.error("Verification check failed:", err);
			}
		} catch (error) {
			console.error("Error fetching user info:", error);
			// If token invalid, redirect to login
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
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			console.log("Fetched existing uploads:", response.data);

			// Map existing uploads to state
			const existingUploads = {};
			response.data.uploads?.forEach((upload) => {
				if (upload.documentType) {
					existingUploads[upload.documentType] = {
						id: upload._id || upload.id, // MongoDB uses _id
						filename: upload.filename,
						url: upload.url,
						uploadedAt: upload.uploadedAt,
						approvalStatus: upload.approvalStatus || "pending",
						rejectionReason: upload.rejectionReason,
					};
				}
			});
			console.log("Mapped uploads:", existingUploads);
			setUploads(existingUploads);

			// If passport already exists, switch to non-Egyptian view
			if (existingUploads["passport"]) {
				setIsEgyptian(false);
			}
		} catch (error) {
			console.error("Error fetching existing uploads:", error);
		}
	};

	const handleFileSelect = async (documentKey, documentType, file) => {
		// TODO: RBAC - Check if user has permission to upload documents
		// if (!canUploadDocuments) { toast.error('ليس لديك صلاحية لرفع المستندات'); return; }
		if (!file) return;

		// Validate file type
		const allowedTypes = [
			"application/pdf",
			"image/jpeg",
			"image/jpg",
			"image/png",
		];
		if (!allowedTypes.includes(file.type)) {
			toast.error("نوع الملف غير مدعوم. الرجاء رفع PDF أو صورة فقط");
			return;
		}

		// Validate file size (10MB)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت");
			return;
		}

		// 🔍 Validation: Check if it's an Egyptian National ID
		// Only validate if user is Egyptian AND uploading a personal ID
		if (
			isEgyptian &&
			(documentKey === "personal_id" ||
				documentKey === "personal_id_of_representative")
		) {
			const loadingToast = toast.loading("جاري التحقق من هوية المستند...");
			try {
				const result = await Tesseract.recognize(file, "ara+eng", {
					logger: (m) => console.log(m),
				});
				const text = result.data.text.toLowerCase();
				console.log("OCR Result:", text);

				const keywords = [
					"مصر",
					"بطاقة",
					"قومي",
					"egypt",
					"identity",
					"national",
					"جمهورية",
					"id",
				];
				const isValid = keywords.some((keyword) => text.includes(keyword));

				toast.dismiss(loadingToast);

				if (!isValid) {
					toast.error(
						"عفواً، هذا المستند لا يبدو وكأنه بطاقة رقم قومي مصرية. يرجى رفع صورة واضحة."
					);
					return;
				}
				toast.success("تم التحقق من المستند بنجاح! ✅");
			} catch (err) {
				console.error("OCR Error:", err);
				toast.dismiss(loadingToast);
				toast.error("حدث خطأ أثناء فحص المستند. يرجى المحاولة مرة أخرى.");
				return;
			}
		}

		// Start upload
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
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "multipart/form-data",
					},
					onUploadProgress: (progressEvent) => {
						const percentCompleted = Math.round(
							(progressEvent.loaded * 100) / progressEvent.total
						);
						setProgress((prev) => ({
							...prev,
							[documentKey]: percentCompleted,
						}));
					},
				}
			);

			if (response.data.success) {
				setUploads((prev) => ({
					...prev,
					[documentKey]: {
						id: response.data.upload.id,
						filename: response.data.upload.filename,
						url: response.data.upload.url,
						uploadedAt: response.data.upload.uploadedAt,
					},
				}));
				toast.success(`تم رفع ${documentType} بنجاح`);
			}
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(
				error.response?.data?.message || "فشل رفع الملف. حاول مرة أخرى"
			);
		} finally {
			setUploading((prev) => ({ ...prev, [documentKey]: false }));
		}
	};

	const handleDeleteUpload = async (documentKey, uploadId) => {
		// TODO: RBAC - Check if user has permission to delete documents
		// if (!canDeleteDocuments) { toast.error('ليس لديك صلاحية لحذف المستندات'); return; }
		try {
			const token = localStorage.getItem("token");
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/uploads/${uploadId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			setUploads((prev) => {
				const newUploads = { ...prev };
				delete newUploads[documentKey];
				return newUploads;
			});
			toast.success("تم حذف الملف بنجاح");
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("فشل حذف الملف");
		}
	};

	const handleViewDocument = async (uploadId) => {
		// TODO: RBAC - Check if user has permission to view documents
		// if (!canViewDocuments) { toast.error('ليس لديك صلاحية لعرض المستندات'); return; }
		try {
			const token = localStorage.getItem("token");
			console.log("Fetching document with ID:", uploadId);

			// Fetch fresh presigned URL from backend
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${uploadId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			console.log("Document response:", response.data);

			// Check for AWS permission error
			if (
				response.data.upload?.permissionError ||
				response.data.warning ||
				response.data.error
			) {
				console.error("AWS Permission Error:", response.data.error);

				// Show detailed bilingual error message
				toast.error(
					response.data.warning ||
					"⚠️ لا يمكن عرض الملف حالياً بسبب قيود AWS\n" +
					"File cannot be viewed due to AWS permission restrictions\n\n" +
					"الملف محفوظ بأمان - يرجى الاتصال بالمسؤول\n" +
					"File is safely stored - Please contact administrator",
					{
						duration: 7000,
						style: {
							minWidth: "400px",
							fontSize: "14px",
							whiteSpace: "pre-line",
						},
					}
				);

				// Log technical details for debugging
				if (response.data.error) {
					console.error("Technical Details:", {
						code: response.data.error.code,
						message: response.data.error.message,
						action: response.data.error.action,
						info: response.data.error.technicalInfo,
					});
				}
				return;
			}

			if (response.data.success && response.data.upload.url) {
				// Open the fresh presigned URL
				console.log("✅ Opening document URL:", response.data.upload.url);
				window.open(response.data.upload.url, "_blank");
			} else {
				console.error("Invalid response format:", response.data);
				toast.error("فشل في الحصول على رابط الملف / Failed to get file URL");
			}
		} catch (error) {
			console.error("❌ Error fetching document URL:", error);
			console.error("Error details:", error.response?.data);

			// Show user-friendly error message
			if (
				error.response?.data?.message?.includes("AWS") ||
				error.response?.data?.message?.includes("permission") ||
				error.response?.data?.message?.includes("AccessDenied")
			) {
				toast.error(
					"⚠️ مشكلة مؤقتة في عرض الملفات - يرجى الاتصال بالمسؤول\n" +
					"Temporary issue viewing files - Please contact administrator\n\n" +
					"الملفات محفوظة بأمان\nFiles are safely stored",
					{
						duration: 7000,
						style: {
							minWidth: "400px",
							fontSize: "14px",
							whiteSpace: "pre-line",
						},
					}
				);
			} else {
				toast.error(
					error.response?.data?.message ||
					"فشل في عرض الملف / Failed to view file"
				);
			}
		}
	};

	const handleFinish = () => {
		const requirements = documentRequirements[clientType] || [];
		// Only count uploads that match the current requirements (exclude profilePhoto and other non-required docs)
		const requiredKeys = requirements.map((doc) => doc.key);
		const uploadedCount = Object.keys(uploads).filter((key) =>
			requiredKeys.includes(key)
		).length;
		const totalRequired = requirements.length;

		if (uploadedCount < totalRequired) {
			toast.success(
				`تم حفظ تقدمك (${uploadedCount}/${totalRequired}). يمكنك الاستكمال لاحقاً`,
				{ duration: 4000 }
			);
		} else {
			toast.success("تم رفع جميع المستندات المطلوبة بنجاح! ✅", {
				duration: 4000,
			});
		}

		// Redirect to home page
		navigate("/home");
	};

	if (!clientType) {
		return <LoadingSpinner />;
	}

	const requirements = documentRequirements[clientType] || [];
	// Only count uploads that match the current requirements (exclude profilePhoto and other non-required docs)
	const requiredKeys = requirements.map((doc) => doc.key);
	const completedCount = Object.keys(uploads).filter((key) =>
		requiredKeys.includes(key)
	).length;
	const totalCount = requirements.length;

	return (
		<>
			<Header />
			<BackgroundContainer>
				<FormContainer>
					<div className="w-full max-w-4xl mx-auto p-6" dir="rtl">
						{/* Header */}
						<div className="text-center mb-8">
							<h1 className="text-3xl font-bold text-gray-800 mb-2">
								📄 رفع المستندات المطلوبة
							</h1>

							{/* Verification Status Warning */}
							{!userInfo?.clientDetails?.documentsVerified && (
								<div className="bg-orange-50 border-r-4 border-orange-500 p-4 mb-6 rounded shadow-sm text-right mx-auto max-w-2xl">
									<div className="flex items-center">
										<div className="flex-shrink-0 text-orange-500 text-2xl ml-3">
											⚠️
										</div>
										<div>
											<p className="font-bold text-orange-800">
												تنبيه هام
											</p>
											<p className="text-sm text-orange-700 mt-1">
												لا يمكنك استخدام باقي خصائص التطبيق حتى يتم رفع جميع المستندات المطلوبة ومراجعتها والموافقة عليها من قبل الإدارة.
											</p>
										</div>
									</div>
								</div>
							)}

							<p className="text-gray-600">
								نوع العميل:{" "}
								<span className="font-semibold">
									{clientType === "factory"
										? "مصنع"
										: clientType === "commercial"
											? "تجاري"
											: "فردي"}
								</span>
							</p>
						</div>

						{/* Overall Progress */}
						<UploadProgress
							completedCount={completedCount}
							totalCount={totalCount}
						/>

						{/* Nationality Toggle for Personal Accounts */}
						{clientType === "personal" && (
							<div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
								<div className="flex items-center justify-between">
									<span className="text-gray-700 font-medium">الجنسية:</span>
									<div className="flex items-center gap-4">
										<label className="cursor-pointer flex items-center gap-2">
											<input
												type="radio"
												name="nationality"
												className="radio radio-primary radio-sm"
												checked={isEgyptian}
												onChange={() => setIsEgyptian(true)}
											/>
											<span className="text-sm">مصري (بطاقة رقم قومي)</span>
										</label>
										<label className="cursor-pointer flex items-center gap-2">
											<input
												type="radio"
												name="nationality"
												className="radio radio-primary radio-sm"
												checked={!isEgyptian}
												onChange={() => setIsEgyptian(false)}
											/>
											<span className="text-sm">غير مصري (جواز سفر)</span>
										</label>
									</div>
								</div>
							</div>
						)}

						{/* Document Upload Cards - TODO: RBAC - Only show upload cards if user has permission */}
						<div className="space-y-4 mb-6">
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
								onClick={handleFinish}
								className="btn btn-success text-white px-8"
							>
								{completedCount === totalCount ? "✅ إنهاء" : "💾 حفظ والخروج"}
							</button>
							<button
								onClick={() => navigate("/home")}
								className="btn btn-outline"
							>
								إلغاء
							</button>
						</div>

						{/* Helper Text */}
						<div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-sm text-gray-700 text-center">
								💡 <strong>ملاحظة:</strong> يمكنك رفع المستندات تدريجياً. تقدمك
								محفوظ ويمكنك الاستكمال في أي وقت.
							</p>
						</div>
					</div>
				</FormContainer>
			</BackgroundContainer>
		</>
	);
};

export default DocumentUploadPage;
