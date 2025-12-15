import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import FileUploadSection from "../components/FileUploadSection";
import SupplierInfoForm from "../components/SupplierInfoForm";
import GoodsInfoForm from "../components/GoodsInfoForm";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";
import { ArrowLeft, Save } from "lucide-react";

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

	// TODO: RBAC - Get user permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canEditAcidRequest = hasPermission('acid:edit');
	// const canUploadDocuments = hasPermission('document:upload');

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
		shipmentType: "بحري", // Default to sea shipment
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

				// Check if request is locked
				if (response.data.isLocked) {
					toast.error(
						"الطلب قيد المعالجة من قبل أحد الموظفين ولا يمكن تعديله حالياً"
					);
					navigate(`/acidrequest/${requestId}`);
					return;
				}

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
					shipmentType: response.data.shipmentType || "بحري",
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
		// TODO: RBAC - Check if user has permission to edit ACID requests
		// if (!canEditAcidRequest) { toast.error('ليس لديك صلاحية لتعديل طلبات ACID'); return; }
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
				shipmentType: formData.shipmentType || "بحري",
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
				<LoadingSpinner />
				<Footer />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col min-h-screen bg-gray-50">
				<Header />
				<ErrorMessage
					message={error}
					onRetry={() => navigate("/acidrequests")}
					retryText="العودة للطلبات"
				/>
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
							{/* TODO: RBAC - Only show file upload if user has permission */}
							<FileUploadSection
								selectedFile={selectedFile}
								uploadedFile={uploadedInvoice}
								uploading={uploading}
								progress={progress}
								onFileSelect={handleFileSelect}
								onDelete={handleDeleteUpload}
								title="الفاتورة المبدئية"
								required={true}
							/>

							{/* Shipment Type Selection */}
							<div className="mb-6">
								<label className="block text-gray-700 text-lg font-bold mb-3">
									نوع الشحنة <span className="text-red-500">*</span>
								</label>
								<div className="flex gap-6">
									<label className="flex items-center cursor-pointer">
										<input
											type="radio"
											name="shipmentType"
											value="بحري"
											checked={formData.shipmentType === "بحري"}
											onChange={(e) => handleInputChange("shipmentType", e.target.value)}
											className="ml-2 w-5 h-5 text-red-900 focus:ring-red-900"
										/>
										<span className="text-gray-700 text-lg">🚢 بحري</span>
									</label>
									<label className="flex items-center cursor-pointer">
										<input
											type="radio"
											name="shipmentType"
											value="جوي"
											checked={formData.shipmentType === "جوي"}
											onChange={(e) => handleInputChange("shipmentType", e.target.value)}
											className="ml-2 w-5 h-5 text-red-900 focus:ring-red-900"
										/>
										<span className="text-gray-700 text-lg">✈️ جوي</span>
									</label>
								</div>
							</div>

							{/* Supplier Information Section */}
							{/* TODO: RBAC - Only show supplier form if user has permission */}
							<SupplierInfoForm
								supplierData={formData.supplier}
								onChange={handleInputChange}
							/>

							{/* Goods Information Section */}
							{/* TODO: RBAC - Only show goods form if user has permission */}
							<GoodsInfoForm
								goodsData={formData.goods}
								onChange={handleInputChange}
							/>

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
