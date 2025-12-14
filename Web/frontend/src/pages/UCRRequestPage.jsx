import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import LoadingSpinner from "../components/LoadingSpinner";
import InputField from "../components/InputField";
import TextAreaField from "../components/TextAreaField";
import SelectField from "../components/SelectField";

// Country list for destination
const COUNTRIES = [
	"الإمارات العربية المتحدة",
	"المملكة العربية السعودية",
	"الكويت",
	"قطر",
	"البحرين",
	"عُمان",
	"الأردن",
	"لبنان",
	"سوريا",
	"العراق",
	"اليمن",
	"ليبيا",
	"تونس",
	"الجزائر",
	"المغرب",
	"السودان",
	"ألمانيا",
	"فرنسا",
	"إيطاليا",
	"إسبانيا",
	"بريطانيا",
	"هولندا",
	"بلجيكا",
	"تركيا",
	"روسيا",
	"الصين",
	"اليابان",
	"كوريا الجنوبية",
	"الهند",
	"البرازيل",
	"الولايات المتحدة",
	"كندا",
	"أستراليا",
	"جنوب أفريقيا",
	"أخرى",
];

const UCRRequestPage = () => {
	const navigate = useNavigate();
	const { requestId } = useParams();
	const isEditMode = Boolean(requestId);
	const [loading, setLoading] = useState(false);
	const [fetchingData, setFetchingData] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [user, setUser] = useState(null);

	// Form state
	const [formData, setFormData] = useState({
		certificationType: "noran",
		shippingMethod: "air",
		destinationCountry: "",
		destinationPort: "",
		generalDescription: "",
		totalWeight: "",
		packagesCount: "",
		valueInEGP: "",
		originalInvoiceNumber: "",
		invoiceDate: "",
		// Sea specific
		quantity: "",
		weightUnit: "kilograms",
		containersCount: "",
		clientNotes: "",
	});

	// Container weights for sea shipment
	const [containerWeights, setContainerWeights] = useState([
		{ containerNumber: "", weight: "", unit: "kilograms" },
	]);

	// Multiple items
	const [items, setItems] = useState([
		{ description: "", hsCode: "", quantity: "", weight: "", value: "", unit: "" },
	]);

	// Uploaded documents
	const [uploadedDocuments, setUploadedDocuments] = useState([]);
	const [selectedFile, setSelectedFile] = useState(null);

	// Fetch existing request data when in edit mode
	const fetchRequestData = useCallback(async () => {
		if (!requestId) return;

		setFetchingData(true);
		try {
			const token = localStorage.getItem("token");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/ucr/${requestId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				const request = response.data.data;
				
				// Populate form data
				setFormData({
					certificationType: request.certificationType || "noran",
					shippingMethod: request.shippingMethod || "air",
					destinationCountry: request.destinationCountry || "",
					destinationPort: request.destinationPort || "",
					generalDescription: request.generalDescription || "",
					totalWeight: request.totalWeight?.toString() || "",
					packagesCount: request.packagesCount?.toString() || "",
					valueInEGP: request.valueInEGP?.toString() || "",
					originalInvoiceNumber: request.originalInvoiceNumber || "",
					invoiceDate: request.invoiceDate ? new Date(request.invoiceDate).toISOString().split("T")[0] : "",
					quantity: request.quantity?.toString() || "",
					weightUnit: request.weightUnit || "kilograms",
					containersCount: request.containersCount?.toString() || "",
					clientNotes: request.clientNotes || "",
				});

				// Populate container weights
				if (request.containerWeights && request.containerWeights.length > 0) {
					setContainerWeights(request.containerWeights.map((c) => ({
						containerNumber: c.containerNumber || "",
						weight: c.weight?.toString() || "",
						unit: c.unit || "kilograms",
					})));
				}

				// Populate items
				if (request.items && request.items.length > 0) {
					setItems(request.items.map((item) => ({
						description: item.description || "",
						hsCode: item.hsCode || "",
						quantity: item.quantity?.toString() || "",
						weight: item.weight?.toString() || "",
						value: item.value?.toString() || "",
						unit: item.unit || "",
					})));
				}

				// Populate uploads
				if (request.uploads && request.uploads.length > 0) {
					setUploadedDocuments(request.uploads.map((upload) => ({
						id: upload._id || upload.id,
						type: upload.documentType || "export_invoice",
						name: upload.originalFilename || upload.filename || "مستند",
						url: upload.url || upload.publicUrl,
					})));
				}
			}
		} catch (error) {
			console.error("Error fetching request data:", error);
			toast.error("فشل في جلب بيانات الطلب");
			navigate("/ucr-requests");
		} finally {
			setFetchingData(false);
		}
	}, [requestId, navigate]);

	useEffect(() => {
		const token = localStorage.getItem("token");
		const storedUser = localStorage.getItem("user");

		if (!token) {
			toast.error("يجب تسجيل الدخول أولاً");
			navigate("/login");
			return;
		}

		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);
			// Set default certification type from user profile (only for new requests)
			if (!isEditMode && parsedUser.clientDetails?.exportCertificationType) {
				setFormData((prev) => ({
					...prev,
					certificationType: parsedUser.clientDetails.exportCertificationType,
				}));
			}
		}

		// Fetch existing data if in edit mode
		if (isEditMode) {
			fetchRequestData();
		}
	}, [navigate, isEditMode, fetchRequestData]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleItemChange = (index, field, value) => {
		const newItems = [...items];
		newItems[index][field] = value;
		setItems(newItems);
	};

	const addItem = () => {
		setItems([
			...items,
			{ description: "", hsCode: "", quantity: "", weight: "", value: "", unit: "" },
		]);
	};

	const removeItem = (index) => {
		if (items.length > 1) {
			setItems(items.filter((_, i) => i !== index));
		}
	};

	const handleContainerChange = (index, field, value) => {
		const newContainers = [...containerWeights];
		newContainers[index][field] = value;
		setContainerWeights(newContainers);
	};

	const addContainer = () => {
		setContainerWeights([
			...containerWeights,
			{ containerNumber: "", weight: "", unit: "kilograms" },
		]);
	};

	const removeContainer = (index) => {
		if (containerWeights.length > 1) {
			setContainerWeights(containerWeights.filter((_, i) => i !== index));
		}
	};

	const handleFileSelect = async (e) => {
		const file = e.target.files[0];
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

		setSelectedFile(file);
	};

	const uploadFile = async (documentType) => {
		if (!selectedFile) {
			toast.error("الرجاء اختيار ملف أولاً");
			return;
		}

		setUploading(true);
		try {
			const formDataUpload = new FormData();
			formDataUpload.append("file", selectedFile);
			formDataUpload.append("category", "ucr_request");
			formDataUpload.append("userType", "client");
			formDataUpload.append("documentType", documentType);

			const token = localStorage.getItem("token");
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/uploads`,
				formDataUpload,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "multipart/form-data",
					},
				}
			);

			if (response.data.success) {
				setUploadedDocuments([
					...uploadedDocuments,
					{
						id: response.data.upload._id,
						type: documentType,
						name: selectedFile.name,
						url: response.data.upload.url || response.data.upload.publicUrl,
					},
				]);
				setSelectedFile(null);
				toast.success("تم رفع الملف بنجاح");
			}
		} catch (error) {
			console.error("Error uploading file:", error);
			toast.error("فشل في رفع الملف");
		} finally {
			setUploading(false);
		}
	};

	const removeDocument = (docId) => {
		setUploadedDocuments(uploadedDocuments.filter((doc) => doc.id !== docId));
	};

	// Calculate export fee preview
	const calculateFeePreview = () => {
		if (formData.certificationType !== "noran") return 0;
		const value = parseFloat(formData.valueInEGP) || 0;
		return Math.max(value * 0.1, 3500);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validation
		if (!formData.generalDescription || !formData.totalWeight || !formData.packagesCount) {
			toast.error("الرجاء ملء جميع الحقول الإلزامية");
			return;
		}

		if (!formData.valueInEGP || !formData.originalInvoiceNumber || !formData.invoiceDate) {
			toast.error("الرجاء ملء بيانات الفاتورة");
			return;
		}

		if (!formData.destinationCountry) {
			toast.error("الرجاء اختيار بلد الوجهة");
			return;
		}

		// Sea validation
		if (formData.shippingMethod === "sea" && !formData.containersCount) {
			toast.error("الرجاء إدخال عدد الحاويات للشحن البحري");
			return;
		}

		setLoading(true);
		try {
			const token = localStorage.getItem("token");

			// Prepare items with valid data only
			const validItems = items.filter((item) => item.description.trim());

			// Prepare container weights for sea shipment
			const validContainerWeights =
				formData.shippingMethod === "sea"
					? containerWeights.filter((c) => c.containerNumber.trim())
					: [];

			const requestData = {
				...formData,
				totalWeight: parseFloat(formData.totalWeight),
				packagesCount: parseInt(formData.packagesCount),
				valueInEGP: parseFloat(formData.valueInEGP),
				quantity: formData.quantity ? parseFloat(formData.quantity) : null,
				containersCount: formData.containersCount
					? parseInt(formData.containersCount)
					: null,
				containerWeights: validContainerWeights,
				items: validItems,
				uploads: uploadedDocuments.map((doc) => doc.id),
			};

			let response;
			if (isEditMode) {
				// Update existing request
				response = await axios.patch(
					`${import.meta.env.VITE_API_URL}/api/ucr/${requestId}`,
					requestData,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					}
				);
			} else {
				// Create new request
				response = await axios.post(
					`${import.meta.env.VITE_API_URL}/api/ucr`,
					requestData,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					}
				);
			}

			if (response.data.success) {
				toast.success(isEditMode ? "تم تحديث الطلب بنجاح" : "تم إنشاء طلب UCR بنجاح");
				navigate("/ucr-requests");
			}
		} catch (error) {
			console.error(isEditMode ? "Error updating UCR request:" : "Error creating UCR request:", error);
			toast.error(error.response?.data?.message || (isEditMode ? "فشل في تحديث الطلب" : "فشل في إنشاء الطلب"));
		} finally {
			setLoading(false);
		}
	};

	// Document type labels
	const getDocumentLabel = (type) => {
		const labels = {
			bank_waiver: "التنازل البنكي",
			export_invoice: "الفاتورة الأصلية",
			export_packing_list: "كشف العبوة",
			shipping_permit: "إذن الشحن",
			awb: "بوليصة الشحن الجوي (AWB)",
			bl: "بوليصة الشحن البحري (B/L)",
		};
		return labels[type] || type;
	};

	// Required documents based on certification type
	const getRequiredDocuments = () => {
		if (formData.certificationType === "noran") {
			return ["bank_waiver", "export_invoice", "export_packing_list"];
		}
		return formData.shippingMethod === "air"
			? ["export_invoice", "shipping_permit", "awb"]
			: ["export_invoice", "shipping_permit", "bl"];
	};

	return (
		<div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
			<Header />

			{fetchingData ? (
				<div className="flex-1 flex justify-center items-center">
					<LoadingSpinner />
				</div>
			) : (
			<BackgroundContainer>
				<FormContainer title={isEditMode ? "تعديل طلب UCR" : "طلب رقم UCR (تصدير)"}>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Step 1: Certification & Shipping Method */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-4">
								1. نوع الشهادة وطريقة الشحن
							</h3>

							{/* Certification Type */}
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									نوع الشهادة
								</label>
								<div className="flex gap-4">
									<label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-green-50 transition-colors">
										<input
											type="radio"
											name="certificationType"
											value="noran"
											checked={formData.certificationType === "noran"}
											onChange={handleInputChange}
											className="w-4 h-4 text-green-600"
										/>
										<span className="w-4 h-4 bg-green-500 rounded-full"></span>
										<div>
											<span className="font-medium">على بطاقة الشركة (النوران)</span>
											<p className="text-xs text-gray-500">
												النوران تتولى المستندات - رسوم 10%
											</p>
										</div>
									</label>
									<label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-yellow-50 transition-colors">
										<input
											type="radio"
											name="certificationType"
											value="client"
											checked={formData.certificationType === "client"}
											onChange={handleInputChange}
											className="w-4 h-4 text-yellow-600"
										/>
										<span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
										<div>
											<span className="font-medium">على بطاقتي الخاصة</span>
											<p className="text-xs text-gray-500">
												أنت توفر المستندات - بدون رسوم 10%
											</p>
										</div>
									</label>
								</div>
							</div>

							{/* Shipping Method */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									طريقة الشحن
								</label>
								<div className="flex gap-4">
									<label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-blue-50 transition-colors">
										<input
											type="radio"
											name="shippingMethod"
											value="air"
											checked={formData.shippingMethod === "air"}
											onChange={handleInputChange}
											className="w-4 h-4 text-blue-600"
										/>
										<span className="text-xl">✈️</span>
										<span className="font-medium">جوي</span>
									</label>
									<label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-blue-50 transition-colors">
										<input
											type="radio"
											name="shippingMethod"
											value="sea"
											checked={formData.shippingMethod === "sea"}
											onChange={handleInputChange}
											className="w-4 h-4 text-blue-600"
										/>
										<span className="text-xl">🚢</span>
										<span className="font-medium">بحري</span>
									</label>
								</div>
							</div>
						</div>

						{/* Step 2: Destination */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-4">2. الوجهة</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<SelectField
									id="destinationCountry"
									name="destinationCountry"
									label="بلد الوجهة"
									value={formData.destinationCountry}
									onChange={handleInputChange}
									placeholder="اختر البلد"
									options={COUNTRIES.map((country) => ({
										value: country,
										label: country,
									}))}
									required
								/>
								<InputField
									id="destinationPort"
									type="text"
									label="الميناء / المطار"
									placeholder="مثال: ميناء جدة الإسلامي"
									value={formData.destinationPort}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											destinationPort: e.target.value,
										}))
									}
								/>
							</div>
						</div>

						{/* Step 3: Basic Goods Info */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-4">
								3. بيانات البضاعة الأساسية
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="md:col-span-2">
									<TextAreaField
										id="generalDescription"
										label="الوصف العام للبضاعة"
										placeholder="وصف تفصيلي للبضاعة المراد تصديرها"
										value={formData.generalDescription}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												generalDescription: e.target.value,
											}))
										}
										rows={3}
										required
									/>
								</div>
								<InputField
									id="totalWeight"
									type="number"
									label="الوزن الإجمالي (كجم)"
									placeholder="500"
									value={formData.totalWeight}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											totalWeight: e.target.value,
										}))
									}
									required
								/>
								<InputField
									id="packagesCount"
									type="number"
									label="عدد الطرود"
									placeholder="10"
									value={formData.packagesCount}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											packagesCount: e.target.value,
										}))
									}
									required
								/>
							</div>
						</div>

						{/* Step 4: Invoice Info */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-4">
								4. بيانات الفاتورة
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<InputField
									id="valueInEGP"
									type="number"
									label="القيمة بالجنيه المصري"
									placeholder="50000"
									value={formData.valueInEGP}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											valueInEGP: e.target.value,
										}))
									}
									required
								/>
								<InputField
									id="originalInvoiceNumber"
									type="text"
									label="رقم الفاتورة الأصلية"
									placeholder="INV-2025-001"
									value={formData.originalInvoiceNumber}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											originalInvoiceNumber: e.target.value,
										}))
									}
									required
								/>
								<InputField
									id="invoiceDate"
									type="date"
									label="تاريخ الفاتورة"
									placeholder=""
									value={formData.invoiceDate}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											invoiceDate: e.target.value,
										}))
									}
									required
								/>
							</div>

							{/* Fee Preview for Noran Certified */}
							{formData.certificationType === "noran" && formData.valueInEGP && (
								<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
									<div className="flex items-center gap-2 text-green-800">
										<span className="w-3 h-3 bg-green-500 rounded-full"></span>
										<span className="font-medium">
											رسوم التصدير المتوقعة: {calculateFeePreview().toLocaleString("ar-EG")} جنيه
											مصري
										</span>
									</div>
									<p className="text-xs text-green-600 mt-1">
										(10% من القيمة، الحد الأدنى 3,500 جنيه)
									</p>
								</div>
							)}
						</div>

						{/* Step 5: Sea Specific Fields */}
						{formData.shippingMethod === "sea" && (
							<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
								<h3 className="text-lg font-bold text-gray-800 mb-4">
									5. بيانات الشحن البحري
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
									<InputField
										id="quantity"
										type="number"
										label="الكمية"
										placeholder="100"
										value={formData.quantity}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												quantity: e.target.value,
											}))
										}
									/>
									<SelectField
										id="weightUnit"
										name="weightUnit"
										label="وحدة الوزن"
										value={formData.weightUnit}
										onChange={handleInputChange}
										options={[
											{ value: "kilograms", label: "كيلوجرام" },
											{ value: "tons", label: "طن" },
										]}
									/>
									<InputField
										id="containersCount"
										type="number"
										label="عدد الحاويات"
										placeholder="2"
										value={formData.containersCount}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												containersCount: e.target.value,
											}))
										}
										required={formData.shippingMethod === "sea"}
									/>
								</div>

								{/* Container Weights */}
								<div className="mt-4">
									<label className="block text-[#690000] text-sm sm:text-base font-bold mb-2 text-right">
										أوزان الحاويات
									</label>
									{containerWeights.map((container, index) => (
										<div
											key={index}
											className="flex gap-2 mb-2 items-center"
										>
											<input
												type="text"
												value={container.containerNumber}
												onChange={(e) =>
													handleContainerChange(index, "containerNumber", e.target.value)
												}
												placeholder="رقم الحاوية"
												className="flex-1 p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
												dir="rtl"
											/>
											<input
												type="number"
												value={container.weight}
												onChange={(e) =>
													handleContainerChange(index, "weight", e.target.value)
												}
												placeholder="الوزن"
												className="w-24 p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
												dir="rtl"
											/>
											<select
												value={container.unit}
												onChange={(e) =>
													handleContainerChange(index, "unit", e.target.value)
												}
												className="w-28 p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
												dir="rtl"
											>
												<option value="kilograms">كجم</option>
												<option value="tons">طن</option>
											</select>
											{containerWeights.length > 1 && (
												<button
													type="button"
													onClick={() => removeContainer(index)}
													className="p-2 text-red-600 hover:bg-red-50 rounded"
												>
													✕
												</button>
											)}
										</div>
									))}
									<button
										type="button"
										onClick={addContainer}
										className="text-sm text-[#690000] hover:text-[#8b0000] mt-2 font-medium"
									>
										+ إضافة حاوية
									</button>
								</div>
							</div>
						)}

						{/* Step 6: Multiple Items */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-4">
								{formData.shippingMethod === "sea" ? "6" : "5"}. تفاصيل البنود (اختياري)
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								يمكنك إضافة تفاصيل كل صنف من البضاعة على حدة
							</p>

							{items.map((item, index) => (
								<div
									key={index}
									className="bg-white p-4 rounded-lg border border-gray-200 mb-4"
								>
									<div className="flex justify-between items-center mb-3">
										<span className="font-medium text-[#690000]">
											البند {index + 1}
										</span>
										{items.length > 1 && (
											<button
												type="button"
												onClick={() => removeItem(index)}
												className="text-red-600 hover:text-red-800 text-sm"
											>
												حذف البند
											</button>
										)}
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
										<input
											type="text"
											value={item.description}
											onChange={(e) =>
												handleItemChange(index, "description", e.target.value)
											}
											placeholder="وصف الصنف"
											className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
											dir="rtl"
										/>
										<input
											type="text"
											value={item.hsCode}
											onChange={(e) =>
												handleItemChange(index, "hsCode", e.target.value)
											}
											placeholder="البند الجمركي (HS Code)"
											className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
											dir="rtl"
										/>
										<input
											type="number"
											value={item.quantity}
											onChange={(e) =>
												handleItemChange(index, "quantity", e.target.value)
											}
											placeholder="الكمية"
											className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
											dir="rtl"
										/>
										<input
											type="number"
											value={item.weight}
											onChange={(e) =>
												handleItemChange(index, "weight", e.target.value)
											}
											placeholder="الوزن"
											className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
											dir="rtl"
										/>
										<input
											type="number"
											value={item.value}
											onChange={(e) =>
												handleItemChange(index, "value", e.target.value)
											}
											placeholder="القيمة"
											className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
											dir="rtl"
										/>
										<input
											type="text"
											value={item.unit}
											onChange={(e) =>
												handleItemChange(index, "unit", e.target.value)
											}
											placeholder="الوحدة"
											className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
											dir="rtl"
										/>
									</div>
								</div>
							))}
							<button
								type="button"
								onClick={addItem}
								className="text-sm text-[#690000] hover:text-[#8b0000] font-medium"
							>
								+ إضافة بند جديد
							</button>
						</div>

						{/* Step 7: Documents Upload */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-4">
								{formData.shippingMethod === "sea" ? "7" : "6"}. رفع المستندات
							</h3>

							{/* Certification Type Indicator */}
							<div className="mb-4 p-3 rounded-lg border">
								<div className="flex items-center gap-2">
									<span
										className={`w-4 h-4 rounded-full ${
											formData.certificationType === "noran"
												? "bg-green-500"
												: "bg-yellow-500"
										}`}
									></span>
									<span className="font-medium">
										{formData.certificationType === "noran"
											? "شهادة النوران - المستندات المطلوبة:"
											: "شهادتك الخاصة - المستندات المطلوبة:"}
									</span>
								</div>
								<ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
									{getRequiredDocuments().map((doc) => (
										<li key={doc}>{getDocumentLabel(doc)}</li>
									))}
								</ul>
							</div>

							{/* File Upload */}
							<div className="space-y-4">
								<div className="flex gap-2">
									<input
										type="file"
										onChange={handleFileSelect}
										accept=".pdf,.jpg,.jpeg,.png"
										className="flex-1 p-2 border border-gray-300 rounded-lg"
									/>
								</div>

								{selectedFile && (
									<div className="flex gap-2 flex-wrap">
										<p className="text-sm text-gray-600 w-full">
											الملف المختار: {selectedFile.name}
										</p>
										{getRequiredDocuments().map((docType) => (
											<button
												key={docType}
												type="button"
												onClick={() => uploadFile(docType)}
												disabled={uploading}
												className="px-3 py-1 text-sm bg-red-700 text-white rounded hover:bg-red-800 disabled:bg-gray-400"
											>
												{uploading ? "جاري الرفع..." : `رفع كـ ${getDocumentLabel(docType)}`}
											</button>
										))}
									</div>
								)}

								{/* Uploaded Documents List */}
								{uploadedDocuments.length > 0 && (
									<div className="mt-4">
										<h4 className="font-medium text-gray-700 mb-2">
											المستندات المرفوعة:
										</h4>
										<div className="space-y-2">
											{uploadedDocuments.map((doc) => (
												<div
													key={doc.id}
													className="flex items-center justify-between p-2 bg-white border rounded-lg"
												>
													<div className="flex items-center gap-2">
														<span className="text-green-600">✓</span>
														<span className="text-sm">{getDocumentLabel(doc.type)}</span>
														<span className="text-xs text-gray-500">({doc.name})</span>
													</div>
													<div className="flex items-center gap-2">
														{doc.url && (
															<button
																type="button"
																onClick={() => window.open(doc.url, "_blank")}
																className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
															>
																👁️ معاينة
															</button>
														)}
														<button
															type="button"
															onClick={() => removeDocument(doc.id)}
															className="text-red-600 hover:text-red-800 text-sm"
														>
															حذف
														</button>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Client Notes */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-4">ملاحظات إضافية</h3>
							<TextAreaField
								id="clientNotes"
								label=""
								placeholder="أي ملاحظات أو تعليمات خاصة..."
								value={formData.clientNotes}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										clientNotes: e.target.value,
									}))
								}
								rows={3}
							/>
						</div>

						{/* Submit Button */}
						<div className="flex justify-end gap-4">
							<button
								type="button"
								onClick={() => navigate("/ucr-requests")}
								className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
							>
								إلغاء
							</button>
							<button
								type="submit"
								disabled={loading}
								className="px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors disabled:bg-gray-400 flex items-center gap-2"
							>
								{loading ? (
									<>
										<LoadingSpinner size="small" />
										{isEditMode ? "جاري التحديث..." : "جاري الإرسال..."}
									</>
								) : (
									<>
										<span>{isEditMode ? "💾" : "📤"}</span>
										{isEditMode ? "حفظ التعديلات" : "إرسال طلب UCR"}
									</>
								)}
							</button>
						</div>
					</form>
				</FormContainer>
			</BackgroundContainer>
			)}

			<Footer />
		</div>
	);
};

export default UCRRequestPage;
