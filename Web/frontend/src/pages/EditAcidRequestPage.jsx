import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";
import contractIcon from "../assets/images/contract.png";
import {
	FileText,
	Package,
	User,
	Globe,
	Phone,
	Mail,
	Weight,
	ArrowLeft,
	Save,
} from "lucide-react";

const EditAcidRequestPage = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [uploadedInvoice, setUploadedInvoice] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);

	const [formData, setFormData] = useState({
		supplier: {
			name: "",
			taxNum: "",
			country: "",
			email: "",
			mobileNum: "",
		},
		goods: {
			description: "",
			customsItem: "",
			weight: "",
		},
		uploads: [],
	});

	const token = localStorage.getItem("token");

	useEffect(() => {
		const fetchRequestData = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!requestId) {
					setError("رقم الطلب غير موجود");
					return;
				}

				if (!token) {
					toast.error("الرجاء تسجيل الدخول");
					navigate("/login");
					return;
				}

				// Fetch ACID request by ID
				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/acid/${requestId}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				console.log("Fetched ACID request data:", response.data);

				// Check if request can be edited (only Pending status)
				if (response.data.status !== "Pending") {
					toast.error("لا يمكن تعديل طلب تم معالجته");
					navigate(`/acidrequest/${requestId}`);
					return;
				}

				// Set form data
				setFormData({
					supplier: response.data.supplier || {
						name: "",
						taxNum: "",
						country: "",
						email: "",
						mobileNum: "",
					},
					goods: response.data.goods || {
						description: "",
						customsItem: "",
						weight: "",
					},
					uploads: response.data.uploads || [],
				});

				// Set uploaded invoice if exists
				if (response.data.uploads && response.data.uploads.length > 0) {
					setUploadedInvoice({
						id: response.data.uploads[0],
						exists: true,
					});
				}
			} catch (error) {
				console.error("Error fetching ACID request:", error);
				const errorMessage =
					error.response?.data?.message ||
					error.message ||
					"فشل في تحميل بيانات الطلب";
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchRequestData();
	}, [requestId, token, navigate]);

	const handleInputChange = (field, value) => {
		if (field.includes(".")) {
			const [parent, child] = field.split(".");
			setFormData((prev) => ({
				...prev,
				[parent]: {
					...prev[parent],
					[child]: value,
				},
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[field]: value,
			}));
		}
	};

	const handleFileSelect = (e) => {
		const file = e.target.files[0];
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

		setSelectedFile(file);
		toast.success(`تم اختيار الملف: ${file.name}`);
	};

	const uploadFileToServer = async (file) => {
		const formDataUpload = new FormData();
		formDataUpload.append("file", file);
		formDataUpload.append("category", "acidrequest");
		formDataUpload.append("userType", "client");
		formDataUpload.append("documentType", "proforma_invoice");

		const response = await axios.post(
			`${import.meta.env.VITE_API_URL}/api/uploads`,
			formDataUpload,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "multipart/form-data",
				},
				onUploadProgress: (progressEvent) => {
					const percentCompleted = Math.round(
						(progressEvent.loaded * 100) / progressEvent.total
					);
					setProgress(percentCompleted);
				},
			}
		);

		return response;
	};

	const handleDeleteUpload = () => {
		setSelectedFile(null);
		setUploadedInvoice(null);
		toast.success("تم حذف الملف");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validation
		if (
			!formData.supplier.name ||
			!formData.supplier.taxNum ||
			!formData.supplier.country
		) {
			toast.error("الرجاء إدخال بيانات المورد الأساسية");
			return;
		}

		if (!formData.goods.description || !formData.goods.weight) {
			toast.error("الرجاء إدخال بيانات البضاعة الأساسية");
			return;
		}

		try {
			setSaving(true);
			let uploadIds = formData.uploads;

			// Upload new file if selected
			if (selectedFile) {
				setUploading(true);
				setProgress(0);
				toast.loading("جاري رفع الفاتورة الجديدة...");

				try {
					const response = await uploadFileToServer(selectedFile);

					if (response.data.success) {
						uploadIds = [response.data.upload.id];
						toast.dismiss();
						toast.success("تم رفع الفاتورة بنجاح");
					}
				} catch (error) {
					console.error("Upload error:", error);
					toast.dismiss();
					toast.error(
						error.response?.data?.message || "فشل رفع الملف. حاول مرة أخرى"
					);
					setSaving(false);
					setUploading(false);
					return;
				} finally {
					setUploading(false);
				}
			}

			// Update ACID request
			const updateData = {
				supplier: formData.supplier,
				goods: {
					...formData.goods,
					weight: parseFloat(formData.goods.weight),
				},
				uploads: uploadIds,
			};

			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/acid/${requestId}`,
				updateData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data) {
				toast.success("تم تحديث الطلب بنجاح! ✅");
				setTimeout(() => {
					navigate(`/acidrequest/${requestId}`);
				}, 1500);
			}
		} catch (error) {
			console.error("Error updating ACID request:", error);
			const errorMessage =
				error.response?.data?.message || error.message || "فشل في تحديث الطلب";
			toast.error(errorMessage);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col min-h-screen bg-gray-50">
				<Header />
				<main className="flex-grow flex items-center justify-center">
					<div className="text-center">
						<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-900 mx-auto mb-4"></div>
						<p className="text-gray-600 text-lg">جاري تحميل البيانات...</p>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col min-h-screen bg-gray-50">
				<Header />
				<main className="flex-grow flex items-center justify-center">
					<div className="text-center">
						<p className="text-red-600 text-lg mb-4">{error}</p>
						<button
							onClick={() => navigate("/acidrequests")}
							className="px-6 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800"
						>
							العودة للطلبات
						</button>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-screen bg-gray-50" dir="rtl">
			<Header />

			<main className="flex-grow px-4 py-8">
				{/* Hero Image */}
				<div className="flex justify-center mb-8">
					<img
						src={mainIllustration}
						alt="Main Illustration"
						className="w-80 h-auto object-contain"
					/>
				</div>

				{/* Form Container */}
				<div className="max-w-5xl mx-auto">
					<div className="bg-white shadow-lg rounded-lg p-8 md:p-12">
						{/* Page Title */}
						<h1 className="text-3xl md:text-4xl font-bold text-center text-red-900 mb-2">
							تعديل طلب ACID
						</h1>
						<p className="text-center text-gray-600 mb-8">
							يمكنك تعديل بيانات الطلب قبل المعالجة
						</p>

						<form onSubmit={handleSubmit}>
							{/* Proforma Invoice Upload Section */}
							<div className="mb-12">
								<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
									<FileText className="w-6 h-6" />
									<span>الفاتورة المبدئية</span>
								</h2>
								<div
									className={`border-2 rounded-lg p-4 transition-all ${
										selectedFile || uploadedInvoice
											? "border-green-500 bg-green-50"
											: "border-gray-300 bg-white hover:border-blue-400"
									}`}
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-3">
											<span className="text-2xl">
												{uploadedInvoice ? "✅" : selectedFile ? "📄" : "📎"}
											</span>
											<div>
												<h3 className="font-semibold text-gray-800">
													فاتورة مبدئية <span className="text-red-500">*</span>
												</h3>
												<span className="text-xs text-gray-500">
													{selectedFile
														? selectedFile.name
														: uploadedInvoice
														? "فاتورة موجودة"
														: "(PDF أو صورة - حد أقصى 10 ميجابايت)"}
												</span>
											</div>
										</div>

										{selectedFile || uploadedInvoice ? (
											<div className="flex gap-2">
												<button
													type="button"
													onClick={handleDeleteUpload}
													className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
												>
													🗑️ حذف
												</button>
											</div>
										) : (
											<label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
												📤 اختر ملف جديد
												<input
													type="file"
													className="hidden"
													accept=".pdf,.jpg,.jpeg,.png"
													onChange={handleFileSelect}
													disabled={uploading}
												/>
											</label>
										)}
									</div>

									{/* Upload Progress Bar */}
									{uploading && (
										<div className="mt-3">
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className="bg-blue-600 h-2 rounded-full transition-all duration-300"
													style={{ width: `${progress}%` }}
												></div>
											</div>
											<p className="text-xs text-gray-600 mt-1 text-center">
												{progress}%
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Supplier Information Section */}
							<div className="mb-12">
								<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
									<User className="w-6 h-6" />
									<span>بيانات المورد</span>
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-gray-700 font-semibold mb-2">
											اسم المورد <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={formData.supplier.name}
											onChange={(e) =>
												handleInputChange("supplier.name", e.target.value)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
											placeholder="أدخل اسم المورد"
											required
										/>
									</div>
									<div>
										<label className="block text-gray-700 font-semibold mb-2">
											الرقم الضريبي <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={formData.supplier.taxNum}
											onChange={(e) =>
												handleInputChange("supplier.taxNum", e.target.value)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
											placeholder="أدخل الرقم الضريبي"
											required
										/>
									</div>
									<div>
										<label className="block text-gray-700 font-semibold mb-2">
											الدولة <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={formData.supplier.country}
											onChange={(e) =>
												handleInputChange("supplier.country", e.target.value)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
											placeholder="أدخل الدولة"
											required
										/>
									</div>
									<div>
										<label className="block text-gray-700 font-semibold mb-2">
											البريد الإلكتروني
										</label>
										<input
											type="email"
											value={formData.supplier.email}
											onChange={(e) =>
												handleInputChange("supplier.email", e.target.value)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
											placeholder="أدخل البريد الإلكتروني"
										/>
									</div>
									<div>
										<label className="block text-gray-700 font-semibold mb-2">
											رقم الهاتف
										</label>
										<input
											type="tel"
											value={formData.supplier.mobileNum}
											onChange={(e) =>
												handleInputChange("supplier.mobileNum", e.target.value)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
											placeholder="أدخل رقم الهاتف"
										/>
									</div>
								</div>
							</div>

							{/* Goods Information Section */}
							<div className="mb-12">
								<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
									<Package className="w-6 h-6" />
									<span>بيانات البضاعة</span>
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="md:col-span-2">
										<label className="block text-gray-700 font-semibold mb-2">
											وصف البضاعة <span className="text-red-500">*</span>
										</label>
										<textarea
											value={formData.goods.description}
											onChange={(e) =>
												handleInputChange("goods.description", e.target.value)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
											placeholder="أدخل وصف البضاعة"
											rows="3"
											required
										/>
									</div>
									<div>
										<label className="block text-gray-700 font-semibold mb-2">
											البند الجمركي
										</label>
										<input
											type="text"
											value={formData.goods.customsItem}
											onChange={(e) =>
												handleInputChange("goods.customsItem", e.target.value)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
											placeholder="أدخل البند الجمركي"
										/>
									</div>
									<div>
										<label className="block text-gray-700 font-semibold mb-2">
											الوزن المبدئي (كجم){" "}
											<span className="text-red-500">*</span>
										</label>
										<input
											type="number"
											step="0.01"
											value={formData.goods.weight}
											onChange={(e) =>
												handleInputChange("goods.weight", e.target.value)
											}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
											placeholder="أدخل الوزن"
											required
										/>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
								<button
									type="button"
									onClick={() => navigate(`/acidrequest/${requestId}`)}
									className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all"
									disabled={saving}
								>
									<ArrowLeft className="w-5 h-5" />
									<span>إلغاء</span>
								</button>

								<button
									type="submit"
									className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-red-900 text-white font-bold rounded-lg shadow-md hover:bg-red-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
									disabled={saving || uploading}
								>
									{saving ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
											<span>جاري الحفظ...</span>
										</>
									) : (
										<>
											<Save className="w-5 h-5" />
											<span>حفظ التعديلات</span>
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default EditAcidRequestPage;
