import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DocumentUploadPage = () => {
	const navigate = useNavigate();
	const [userInfo, setUserInfo] = useState(null);
	const [clientType, setClientType] = useState(null);
	const [uploads, setUploads] = useState({});
	const [uploading, setUploading] = useState({});
	const [progress, setProgress] = useState({});

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
			{ key: "personal_id", label: "البطاقة الشخصية", required: true },
			{ key: "sample_document", label: "مستند داعم", required: true },
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
					};
				}
			});
			console.log("Mapped uploads:", existingUploads);
			setUploads(existingUploads);
		} catch (error) {
			console.error("Error fetching existing uploads:", error);
		}
	};

	const handleFileSelect = async (documentKey, documentType, file) => {
		if (!file) return;

		// Validate file type
		const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("نوع الملف غير مدعوم. الرجاء رفع PDF أو صورة فقط");
			return;
		}

		// Validate file size (10MB)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت");
			return;
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
						setProgress((prev) => ({ ...prev, [documentKey]: percentCompleted }));
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

			if (response.data.success && response.data.upload.url) {
				// Open the fresh presigned URL
				console.log("Opening URL:", response.data.upload.url);
				window.open(response.data.upload.url, "_blank");
			} else {
				console.error("Invalid response format:", response.data);
				toast.error("فشل في الحصول على رابط الملف");
			}
		} catch (error) {
			console.error("Error fetching document URL:", error);
			console.error("Error details:", error.response?.data);
			toast.error(error.response?.data?.message || "فشل في عرض الملف");
		}
	};

	const handleFinish = () => {
		const requirements = documentRequirements[clientType] || [];
		const uploadedCount = Object.keys(uploads).length;
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

		// TODO: When dashboard is ready, change this to navigate("/dashboard")
		navigate("/shipmentstatus");
	};

	if (!clientType) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="loading loading-spinner loading-lg text-primary"></div>
					<p className="mt-4 text-gray-600">جاري التحميل...</p>
				</div>
			</div>
		);
	}

	const requirements = documentRequirements[clientType] || [];
	const completedCount = Object.keys(uploads).length;
	const totalCount = requirements.length;
	const completionPercentage = Math.round((completedCount / totalCount) * 100);

	return (
		<>
			<Navbar />
			<BackgroundContainer>
				<FormContainer>
					<div className="w-full max-w-4xl mx-auto p-6" dir="rtl">
						{/* Header */}
						<div className="text-center mb-8">
							<h1 className="text-3xl font-bold text-gray-800 mb-2">
								📄 رفع المستندات المطلوبة
							</h1>
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
						<div className="mb-8 p-4 bg-blue-50 rounded-lg">
							<div className="flex justify-between items-center mb-2">
								<span className="text-sm font-medium text-gray-700">
									التقدم الإجمالي
								</span>
								<span className="text-sm font-medium text-blue-600">
									{completedCount} / {totalCount}
								</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-3">
								<div
									className="bg-blue-600 h-3 rounded-full transition-all duration-300"
									style={{ width: `${completionPercentage}%` }}
								></div>
							</div>
							<p className="text-xs text-gray-600 mt-1">
								{completionPercentage}% مكتمل
							</p>
						</div>

						{/* Document Upload Cards */}
						<div className="space-y-4 mb-6">
							{requirements.map((doc, index) => {
								const isUploaded = uploads[doc.key];
								const isUploading = uploading[doc.key];
								const uploadProgress = progress[doc.key] || 0;

								return (
									<div
										key={doc.key}
										className={`border-2 rounded-lg p-4 transition-all ${
											isUploaded
												? "border-green-500 bg-green-50"
												: "border-gray-300 bg-white hover:border-blue-400"
										}`}
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-3">
												<span className="text-2xl">
													{isUploaded ? "✅" : "📎"}
												</span>
												<div>
													<h3 className="font-semibold text-gray-800">
														{index + 1}. {doc.label}
													</h3>
													{doc.required && (
														<span className="text-xs text-red-500">
															* مطلوب
														</span>
													)}
												</div>
											</div>

											{isUploaded ? (
												<div className="flex gap-2">
													<button
														onClick={() => handleViewDocument(isUploaded.id)}
														className="btn btn-sm btn-info text-white"
													>
														👁️ عرض
													</button>
													<button
														onClick={() =>
															handleDeleteUpload(doc.key, isUploaded.id)
														}
														className="btn btn-sm btn-error text-white"
													>
														🗑️ حذف
													</button>
												</div>
											) : (
												<label className="btn btn-sm btn-primary text-white">
													{isUploading ? "جاري الرفع..." : "📤 رفع"}
													<input
														type="file"
														className="hidden"
														accept=".pdf,.jpg,.jpeg,.png"
														onChange={(e) =>
															handleFileSelect(
																doc.key,
																doc.key,
																e.target.files[0]
															)
														}
														disabled={isUploading}
													/>
												</label>
											)}
										</div>

										{/* Upload Progress Bar */}
										{isUploading && (
											<div className="mt-3">
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div
														className="bg-blue-600 h-2 rounded-full transition-all duration-300"
														style={{ width: `${uploadProgress}%` }}
													></div>
												</div>
												<p className="text-xs text-gray-600 mt-1 text-center">
													{uploadProgress}%
												</p>
											</div>
										)}

										{/* File Info */}
										{isUploaded && (
											<div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
												<p>📄 {isUploaded.filename}</p>
												<p className="text-gray-500">
													تم الرفع: {new Date(isUploaded.uploadedAt).toLocaleDateString("ar-EG")}
												</p>
											</div>
										)}
									</div>
								);
							})}
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
