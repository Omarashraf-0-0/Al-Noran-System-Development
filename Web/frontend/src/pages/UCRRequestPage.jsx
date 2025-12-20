import React, { useState, useEffect, useCallback, useRef } from "react";
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

// Helper function to format number with commas
const formatNumberWithCommas = (value) => {
	if (!value) return "";
	const num = value.toString().replace(/,/g, "");
	return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Helper function to parse number from formatted string
const parseFormattedNumber = (value) => {
	if (!value) return "";
	return value.toString().replace(/,/g, "");
};

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
		seaShipmentType: "fcl", // 'fcl' (Full Container Load - حاويات), 'lcl' (Less than Container Load - بضايع عامة), 'parcels' (طرود)
		quantity: "",
		weightUnit: "kilograms",
		containersCount: "",
		clientNotes: "",
	});

	// Container weights for sea shipment (with size)
	const [containerWeights, setContainerWeights] = useState([
		{ containerNumber: "", size: "20ft", weight: "", unit: "kilograms" },
	]);

	// Multiple items
	const [items, setItems] = useState([
		{ description: "", hsCode: "", quantity: "", weight: "", value: "", unit: "" },
	]);

	// Uploaded documents
	const [uploadedDocuments, setUploadedDocuments] = useState([]);
	const [selectedFile, setSelectedFile] = useState(null);
	
	// Document statuses for edit mode (to show which docs need revision)
	const [documentStatuses, setDocumentStatuses] = useState([]);
	const [requestStatus, setRequestStatus] = useState("pending");

	// Document labels
	const DOCUMENT_LABELS = {
		bank_waiver: "التنازل البنكي",
		export_invoice: "الفاتورة الأصلية",
		export_packing_list: "كشف العبوة",
		shipping_permit: "إذن الشحن",
		awb: "بوليصة الشحن الجوي (AWB)",
		bl: "بوليصة الشحن البحري (B/L)",
	};

	// Get documents that need revision
	const documentsNeedingRevision = documentStatuses.filter(ds => ds.status === "needs_revision");

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
				
				// Store request status and document statuses
				setRequestStatus(request.status || "pending");
				setDocumentStatuses(request.documentStatuses || []);
				
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
					seaShipmentType: request.seaShipmentType || "fcl",
					quantity: request.quantity?.toString() || "",
					weightUnit: request.weightUnit || "kilograms",
					containersCount: request.containersCount?.toString() || "",
					clientNotes: request.clientNotes || "",
				});

				// Populate container weights (with size)
				if (request.containerWeights && request.containerWeights.length > 0) {
					setContainerWeights(request.containerWeights.map((c) => ({
						containerNumber: c.containerNumber || "",
						size: c.size || "20ft",
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

	// Scroll to documents section if there are documents needing revision
	useEffect(() => {
		if (documentsNeedingRevision.length > 0 && !fetchingData) {
			// Small delay to ensure DOM is ready
			setTimeout(() => {
				const docsSection = document.getElementById("documents-section");
				if (docsSection) {
					docsSection.scrollIntoView({ behavior: "smooth", block: "center" });
				}
			}, 500);
		}
	}, [documentsNeedingRevision.length, fetchingData]);

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
			{ containerNumber: "", size: "20ft", weight: "", unit: "kilograms" },
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
						id: response.data.upload.id || response.data.upload._id,
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

		// ==========================================
		// COMPREHENSIVE VALIDATION
		// ==========================================

		// 1. Basic required fields
		if (!formData.generalDescription?.trim()) {
			toast.error("الرجاء إدخال وصف البضاعة");
			return;
		}

		if (!formData.totalWeight) {
			toast.error("الرجاء إدخال الوزن الكلي");
			return;
		}

		// packagesCount is required only for air shipments, sea parcels, or sea LCL
		const needsPackagesCount = formData.shippingMethod === "air" || 
			(formData.shippingMethod === "sea" && (formData.seaShipmentType === "parcels" || formData.seaShipmentType === "lcl"));
		
		if (needsPackagesCount && !formData.packagesCount) {
			toast.error("الرجاء إدخال عدد الطرود");
			return;
		}

		if (!formData.valueInEGP) {
			toast.error("الرجاء إدخال قيمة الشحنة بالجنيه المصري");
			return;
		}

		if (!formData.originalInvoiceNumber?.trim()) {
			toast.error("الرجاء إدخال رقم الفاتورة");
			return;
		}

		if (!formData.invoiceDate) {
			toast.error("الرجاء اختيار تاريخ الفاتورة");
			return;
		}

		if (!formData.destinationCountry) {
			toast.error("الرجاء اختيار بلد الوجهة");
			return;
		}

		// 2. Numeric validations - no negative numbers
		const totalWeight = parseFloat(formData.totalWeight);
		const packagesCount = parseInt(formData.packagesCount) || 0;
		const valueInEGP = parseFloat(parseFormattedNumber(formData.valueInEGP));

		if (isNaN(totalWeight) || totalWeight <= 0) {
			toast.error("الوزن الكلي يجب أن يكون رقم موجب أكبر من صفر");
			return;
		}

		if (totalWeight > 1000000) {
			toast.error("الوزن الكلي يبدو كبيرًا جدًا. الرجاء التحقق من القيمة");
			return;
		}

		// Validate packagesCount only when required
		if (needsPackagesCount) {
			if (isNaN(packagesCount) || packagesCount <= 0) {
				toast.error("عدد الطرود يجب أن يكون رقم صحيح موجب");
				return;
			}

			if (packagesCount > 10000) {
				toast.error("عدد الطرود يبدو كبيرًا جدًا. الرجاء التحقق من القيمة");
				return;
			}
		}

		if (isNaN(valueInEGP) || valueInEGP <= 0) {
			toast.error("قيمة الشحنة يجب أن تكون رقم موجب أكبر من صفر");
			return;
		}

		if (valueInEGP > 100000000000) {
			toast.error("قيمة الشحنة تبدو كبيرة جدًا. الرجاء التحقق من القيمة");
			return;
		}

		// 3. Invoice date validation - not future date
		const invoiceDate = new Date(formData.invoiceDate);
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		if (invoiceDate > today) {
			toast.error("تاريخ الفاتورة لا يمكن أن يكون في المستقبل");
			return;
		}

		// 4. Sea shipment specific validations
		if (formData.shippingMethod === "sea") {
			if (formData.seaShipmentType === "fcl") {
				const containersCount = parseInt(formData.containersCount);
				if (!containersCount || containersCount <= 0) {
					toast.error("الرجاء إدخال عدد الحاويات للشحن البحري");
					return;
				}
				if (containersCount > 500) {
					toast.error("عدد الحاويات يبدو كبيرًا جدًا. الرجاء التحقق");
					return;
				}

				// Validate container weights
				const validContainers = containerWeights.filter((c) => c.containerNumber.trim());
				if (validContainers.length > 0) {
					let totalContainerWeight = 0;
					for (const container of validContainers) {
						const cWeight = parseFloat(container.weight);
						if (cWeight && cWeight < 0) {
							toast.error(`وزن الحاوية ${container.containerNumber} لا يمكن أن يكون سالبًا`);
							return;
						}
						if (cWeight && cWeight > 50000) {
							toast.error(`وزن الحاوية ${container.containerNumber} يبدو كبيرًا جدًا`);
							return;
						}
						if (container.unit === "tons") {
							totalContainerWeight += (cWeight || 0) * 1000;
						} else {
							totalContainerWeight += cWeight || 0;
						}
					}
				}
			}
		}

		// 5. Items validation
		if (!items[0] || !items[0].description.trim()) {
			toast.error("الرجاء إدخال وصف البند الأول على الأقل");
			return;
		}

		// Validate first item has required fields
		if (items[0].description.trim()) {
			if (!items[0].quantity || !items[0].value || !items[0].unit) {
				toast.error("الرجاء ملء الكمية والقيمة والوحدة للبند الأول");
				return;
			}
		}

		// Validate all items with descriptions
		let totalItemsWeight = 0;
		let totalItemsValue = 0;
		const validItems = items.filter((item) => item.description.trim());

		for (let i = 0; i < validItems.length; i++) {
			const item = validItems[i];
			const itemNum = i + 1;

			// Check for negative values
			const itemQty = parseFloat(item.quantity);
			const itemWeight = parseFloat(item.weight);
			const itemValue = parseFloat(item.value);

			if (itemQty && itemQty < 0) {
				toast.error(`كمية البند ${itemNum} لا يمكن أن تكون سالبة`);
				return;
			}

			if (itemWeight && itemWeight < 0) {
				toast.error(`وزن البند ${itemNum} لا يمكن أن يكون سالبًا`);
				return;
			}

			if (itemValue && itemValue < 0) {
				toast.error(`قيمة البند ${itemNum} لا يمكن أن تكون سالبة`);
				return;
			}

			// Sum weights and values for cross-validation
			if (itemWeight) totalItemsWeight += itemWeight;
			if (itemValue) totalItemsValue += itemValue;

			// HS Code validation (if provided)
			if (item.hsCode && item.hsCode.trim()) {
				const hsCodePattern = /^[0-9]{4,10}$/;
				if (!hsCodePattern.test(item.hsCode.replace(/\./g, ""))) {
					toast.error(`البند الجمركي للبند ${itemNum} يجب أن يكون من 4 إلى 10 أرقام`);
					return;
				}
			}
		}

		// 6. Cross-validation: Items weight vs total weight
		if (totalItemsWeight > 0 && totalItemsWeight > totalWeight * 1.1) {
			toast.error(`مجموع أوزان البنود (${totalItemsWeight} كجم) أكبر من الوزن الكلي (${totalWeight} كجم). الرجاء التحقق من القيم`);
			return;
		}

		// 7. Cross-validation: Items value vs total value (allow 20% margin for fees etc)
		if (totalItemsValue > 0 && totalItemsValue > valueInEGP * 1.2) {
			toast.error(`مجموع قيم البنود (${totalItemsValue.toLocaleString()} ج.م) أكبر بكثير من القيمة الإجمالية (${valueInEGP.toLocaleString()} ج.م). الرجاء التحقق`);
			return;
		}

		// 8. Document validation
		if (uploadedDocuments.length === 0) {
			toast.error("الرجاء رفع المستند الأول على الأقل");
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

						{/* Step 3: Basic Goods Info - with Sea/Air specific fields */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-4">
								3. بيانات البضاعة الأساسية
							</h3>
							
							{/* Description - always shown */}
							<div className="mb-4">
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
							
							{/* Total Weight - always shown */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
							</div>

							{/* Sea Shipment Type Selection - only for sea */}
							{formData.shippingMethod === "sea" && (
								<div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
									<label className="block text-sm font-medium text-gray-700 mb-3">
										نوع الشحنة البحرية <span className="text-red-500">*</span>
									</label>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
										{/* FCL - Full Container Load */}
										<label className={`flex flex-col items-center justify-center text-center cursor-pointer p-4 border-2 rounded-lg hover:bg-blue-100 transition-colors bg-white ${formData.seaShipmentType === "fcl" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
											<div className="flex items-center gap-2 mb-2">
												<span className="text-2xl">🚢</span>
												<input
													type="radio"
													name="seaShipmentType"
													value="fcl"
													checked={formData.seaShipmentType === "fcl"}
													onChange={handleInputChange}
													className="w-4 h-4 text-blue-600"
												/>
											</div>
											<span className="font-semibold text-gray-800">حاويات</span>
											<span className="text-sm text-blue-600 font-medium">(FCL)</span>
											<p className="text-xs text-gray-500 mt-1">Full Container Load</p>
											<p className="text-xs text-gray-400">حاوية كاملة أو أكثر</p>
										</label>
										
										{/* LCL - Less than Container Load */}
										<label className={`flex flex-col items-center justify-center text-center cursor-pointer p-4 border-2 rounded-lg hover:bg-blue-100 transition-colors bg-white ${formData.seaShipmentType === "lcl" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
											<div className="flex items-center gap-2 mb-2">
												<span className="text-2xl">📦🚢</span>
												<input
													type="radio"
													name="seaShipmentType"
													value="lcl"
													checked={formData.seaShipmentType === "lcl"}
													onChange={handleInputChange}
													className="w-4 h-4 text-blue-600"
												/>
											</div>
											<span className="font-semibold text-gray-800">بضايع عامة</span>
											<span className="text-sm text-blue-600 font-medium">(LCL)</span>
											<p className="text-xs text-gray-500 mt-1">Less than Container Load</p>
											<p className="text-xs text-gray-400">أقل من حاوية كاملة</p>
										</label>
										
										{/* Parcels */}
										<label className={`flex flex-col items-center justify-center text-center cursor-pointer p-4 border-2 rounded-lg hover:bg-blue-100 transition-colors bg-white ${formData.seaShipmentType === "parcels" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
											<div className="flex items-center gap-2 mb-2">
												<span className="text-2xl">📦</span>
												<input
													type="radio"
													name="seaShipmentType"
													value="parcels"
													checked={formData.seaShipmentType === "parcels"}
													onChange={handleInputChange}
													className="w-4 h-4 text-blue-600"
												/>
											</div>
											<span className="font-semibold text-gray-800">طرود</span>
											<p className="text-xs text-gray-500 mt-1">شحن بالطرود والكراتين</p>
											<p className="text-xs text-gray-400">بضاعة منفصلة</p>
										</label>
									</div>
								</div>
							)}

							{/* Packages Count - shown for AIR, SEA+PARCELS, or SEA+LCL */}
							{(formData.shippingMethod === "air" || (formData.shippingMethod === "sea" && (formData.seaShipmentType === "parcels" || formData.seaShipmentType === "lcl"))) && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
									{formData.shippingMethod === "sea" && (
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
									)}
								</div>
							)}

							{/* Containers - shown for SEA+FCL */}
							{formData.shippingMethod === "sea" && formData.seaShipmentType === "fcl" && (
								<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
										<InputField
											id="containersCount"
											type="number"
											label="عدد الحاويات"
											placeholder="2"
											value={formData.containersCount}
											onChange={(e) => {
												const count = parseInt(e.target.value) || 0;
												setFormData((prev) => ({
													...prev,
													containersCount: e.target.value,
													// Reset packagesCount since we're using containers
													packagesCount: count.toString(),
												}));
												// Auto-adjust container weights array
												if (count > containerWeights.length) {
													const newContainers = [...containerWeights];
													for (let i = containerWeights.length; i < count; i++) {
														newContainers.push({ containerNumber: "", size: "20ft", weight: "", unit: "kilograms" });
													}
													setContainerWeights(newContainers);
												} else if (count < containerWeights.length && count > 0) {
													setContainerWeights(containerWeights.slice(0, count));
												}
											}}
											required
										/>
										<InputField
											id="quantity"
											type="number"
											label="الكمية الإجمالية"
											placeholder="100"
											value={formData.quantity}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													quantity: e.target.value,
												}))
											}
										/>
									</div>

									{/* Container Details */}
									{parseInt(formData.containersCount) > 0 && (
										<div className="mt-4 bg-white p-4 rounded-lg border border-blue-200">
											<label className="block text-[#690000] text-sm sm:text-base font-bold mb-3 text-right">
												تفاصيل الحاويات
											</label>
											<div className="space-y-3">
												{containerWeights.slice(0, parseInt(formData.containersCount) || 0).map((container, index) => (
													<div
														key={index}
														className="p-3 bg-blue-50 rounded-lg border border-blue-100"
													>
														<div className="text-sm font-medium text-blue-800 mb-2">
															الحاوية {index + 1}
														</div>
														<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
															<div>
																<label className="text-xs text-gray-600">رقم الحاوية</label>
																<input
																	type="text"
																	value={container.containerNumber}
																	onChange={(e) =>
																		handleContainerChange(index, "containerNumber", e.target.value)
																	}
																	placeholder="CONT-001"
																	className="w-full p-2 text-sm shadow border rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
																	dir="rtl"
																/>
															</div>
															<div>
																<label className="text-xs text-gray-600">مقاس الحاوية</label>
																<select
																	value={container.size || "20ft"}
																	onChange={(e) =>
																		handleContainerChange(index, "size", e.target.value)
																	}
																	className="w-full p-2 text-sm shadow border rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
																	dir="rtl"
																>
																	<option value="20ft">20 قدم</option>
																	<option value="40ft">40 قدم</option>
																	<option value="40ft-hc">40 قدم HC</option>
																	<option value="45ft">45 قدم</option>
																</select>
															</div>
															<div>
																<label className="text-xs text-gray-600">الوزن</label>
																<input
																	type="number"
																	value={container.weight}
																	onChange={(e) =>
																		handleContainerChange(index, "weight", e.target.value)
																	}
																	placeholder="0"
																	className="w-full p-2 text-sm shadow border rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
																	dir="rtl"
																/>
															</div>
															<div>
																<label className="text-xs text-gray-600">الوحدة</label>
																<select
																	value={container.unit}
																	onChange={(e) =>
																		handleContainerChange(index, "unit", e.target.value)
																	}
																	className="w-full p-2 text-sm shadow border rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
																	dir="rtl"
																>
																	<option value="kilograms">كجم</option>
																	<option value="tons">طن</option>
																</select>
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Step 4: Invoice Info */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								4. بيانات الفاتورة
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								💡 بيانات الفاتورة التجارية الأصلية المُصدرة للمستورد - تُستخدم في مستندات التصدير وشهادة المنشأ
							</p>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										القيمة بالجنيه المصري <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										id="valueInEGP"
										value={formatNumberWithCommas(formData.valueInEGP)}
										onChange={(e) => {
											const raw = parseFormattedNumber(e.target.value);
											if (/^\d*$/.test(raw)) {
												setFormData((prev) => ({
													...prev,
													valueInEGP: raw,
												}));
											}
										}}
										placeholder="50,000"
										className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
										dir="rtl"
										required
									/>
									<p className="text-xs text-gray-500 mt-1">
										إجمالي قيمة البضاعة كما في الفاتورة
									</p>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										رقم الفاتورة الأصلية <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										id="originalInvoiceNumber"
										value={formData.originalInvoiceNumber}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												originalInvoiceNumber: e.target.value,
											}))
										}
										placeholder="INV-2025-001"
										className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
										dir="rtl"
										required
									/>
									<p className="text-xs text-gray-500 mt-1">
										الرقم المرجعي للفاتورة التجارية
									</p>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										تاريخ الفاتورة <span className="text-red-500">*</span>
									</label>
									<input
										type="date"
										id="invoiceDate"
										value={formData.invoiceDate}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												invoiceDate: e.target.value,
											}))
										}
										className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
										dir="rtl"
										required
									/>
									<p className="text-xs text-gray-500 mt-1">
										تاريخ إصدار الفاتورة
									</p>
								</div>
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

						{/* Step 5: Multiple Items */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								5. تفاصيل البنود
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								⚠️ البند الأول مطلوب - يمكنك إضافة بنود إضافية اختيارياً
							</p>

							{items.map((item, index) => (
								<div
									key={index}
									className={`p-4 rounded-lg border mb-4 ${
										index === 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
									}`}
								>
									<div className="flex justify-between items-center mb-3">
										<div className="flex items-center gap-2">
											<span className="font-medium text-[#690000]">
												البند {index + 1}
											</span>
											{index === 0 && (
												<span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">مطلوب</span>
											)}
											{index > 0 && (
												<span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded">اختياري</span>
											)}
										</div>
										{items.length > 1 && index > 0 && (
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
										<div>
											<label className="text-xs text-gray-600 mb-1 block">
												وصف الصنف {index === 0 && <span className="text-red-500">*</span>}
											</label>
											<input
												type="text"
												value={item.description}
												onChange={(e) =>
													handleItemChange(index, "description", e.target.value)
												}
												placeholder="مثال: برتقال طازج"
												className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
												dir="rtl"
												required={index === 0}
											/>
										</div>
										<div>
											<label className="text-xs text-gray-600 mb-1 block whitespace-nowrap">
												البند الجمركي (HS Code)
											</label>
											<input
												type="text"
												value={item.hsCode}
												onChange={(e) =>
													handleItemChange(index, "hsCode", e.target.value)
												}
												placeholder="مثال: 0805.10"
												className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
												dir="rtl"
											/>
										</div>
										<div>
											<label className="text-xs text-gray-600 mb-1 block">
												الكمية {index === 0 && <span className="text-red-500">*</span>}
											</label>
											<input
												type="number"
												value={item.quantity}
												onChange={(e) =>
													handleItemChange(index, "quantity", e.target.value)
												}
												placeholder="100"
												className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
												dir="rtl"
												required={index === 0}
											/>
										</div>
										<div>
											<label className="text-xs text-gray-600 mb-1 block">
												الوزن <span className="text-gray-400">(اختياري)</span>
											</label>
											<input
												type="number"
												value={item.weight}
												onChange={(e) =>
													handleItemChange(index, "weight", e.target.value)
												}
												placeholder="0"
												className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
												dir="rtl"
											/>
										</div>
										<div>
											<label className="text-xs text-gray-600 mb-1 block">
												القيمة {index === 0 && <span className="text-red-500">*</span>}
											</label>
											<input
												type="number"
												value={item.value}
												onChange={(e) =>
													handleItemChange(index, "value", e.target.value)
												}
												placeholder="5000"
												className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
												dir="rtl"
												required={index === 0}
											/>
										</div>
										<div>
											<label className="text-xs text-gray-600 mb-1 block">
												الوحدة {index === 0 && <span className="text-red-500">*</span>}
											</label>
											<input
												type="text"
												value={item.unit}
												onChange={(e) =>
													handleItemChange(index, "unit", e.target.value)
												}
												placeholder="كجم / كرتون / قطعة"
												className="w-full p-2 shadow border rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#690000]/50"
												dir="rtl"
												required={index === 0}
											/>
										</div>
									</div>
								</div>
							))}
							<button
								type="button"
								onClick={addItem}
								className="text-sm text-[#690000] hover:text-[#8b0000] font-medium flex items-center gap-1"
							>
								<span className="text-lg">+</span> إضافة بند إضافي (اختياري)
							</button>
						</div>

						{/* Step 6: Documents Upload */}
						<div 
							id="documents-section"
							className={`bg-gray-50 p-4 rounded-lg border ${
								documentsNeedingRevision.length > 0 
									? "border-orange-400 ring-2 ring-orange-300 animate-pulse" 
									: "border-gray-200"
							}`}
						>
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								6. رفع المستندات
							</h3>
							
							{/* Revision needed banner */}
							{documentsNeedingRevision.length > 0 && (
								<div className="mb-4 p-4 bg-orange-100 border-2 border-orange-400 rounded-lg">
									<h4 className="font-bold text-orange-800 mb-2">⚠️ المستندات التالية تحتاج تعديل:</h4>
									<div className="space-y-2">
										{documentsNeedingRevision.map((ds, idx) => {
											// Find matching upload
											const upload = uploadedDocuments.find(u => 
												u.id === ds.uploadId || u.id === ds.uploadId?.toString()
											);
											const docName = upload?.type 
												? DOCUMENT_LABELS[upload.type] || upload.type 
												: "مستند";
											return (
												<div key={idx} className="bg-white rounded p-2 border border-orange-300">
													<p className="font-medium text-orange-700">📄 {docName}</p>
													{ds.employeeNotes && (
														<p className="text-orange-600 text-sm mr-4">💬 {ds.employeeNotes}</p>
													)}
												</div>
											);
										})}
									</div>
									<p className="text-sm text-orange-700 mt-3">
										يرجى حذف المستند القديم ورفع مستند جديد صحيح
									</p>
								</div>
							)}
							
							<p className="text-sm text-gray-600 mb-4">
								📎 المستند الأول مطلوب - المستندات الإضافية اختيارية ويمكن للموظف إضافتها لاحقاً
							</p>

							{/* Certification Type Indicator */}
							<div className="mb-4 p-3 rounded-lg border bg-blue-50 border-blue-200">
								<div className="flex items-center gap-2">
									<span
										className={`w-4 h-4 rounded-full ${
											formData.certificationType === "noran"
												? "bg-green-500"
												: "bg-yellow-500"
										}`}
									></span>
									<span className="font-medium text-blue-800">
										{formData.certificationType === "noran"
											? "شهادة النوران"
											: "شهادتك الخاصة"}
										{" - "}
										{formData.shippingMethod === "air" ? "شحن جوي" : "شحن بحري"}
									</span>
								</div>
							</div>

							{/* 3 Dedicated Upload Boxes */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{getRequiredDocuments().map((docType, index) => {
									const uploadedDoc = uploadedDocuments.find((d) => d.type === docType);
									const isUploaded = !!uploadedDoc;
									const isRequired = index === 0; // Only first document is required
									
									// Check if this specific document needs revision
									const docStatus = documentStatuses.find(ds => 
										uploadedDoc && (ds.uploadId === uploadedDoc.id || ds.uploadId?.toString() === uploadedDoc.id)
									);
									const needsRevision = docStatus?.status === "needs_revision";
									const revisionNotes = docStatus?.employeeNotes;
									
									return (
										<div
											key={docType}
											className={`relative border-2 rounded-xl p-4 transition-all ${
												needsRevision
													? "border-orange-500 bg-orange-50 ring-2 ring-orange-400"
													: isUploaded
														? "border-green-500 bg-green-50"
														: isRequired
															? "border-dashed border-red-300 bg-red-50 hover:border-red-400"
															: "border-dashed border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
											}`}
										>
											{/* Needs Revision Badge */}
											{needsRevision && (
												<div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
													⚠️ يحتاج تعديل
												</div>
											)}
											
											{/* Document Type Header */}
											<div className="text-center mb-3">
												<div className="flex justify-center gap-2 mb-2">
													<span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
														needsRevision ? "bg-orange-500" : isUploaded ? "bg-green-500" : isRequired ? "bg-red-600" : "bg-gray-400"
													}`}>
														{needsRevision ? "!" : isUploaded ? "✓" : index + 1}
													</span>
													{needsRevision && (
														<span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded self-center">يحتاج تعديل</span>
													)}
													{!needsRevision && isRequired && !isUploaded && (
														<span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded self-center">مطلوب</span>
													)}
													{!needsRevision && !isRequired && !isUploaded && (
														<span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded self-center">اختياري</span>
													)}
												</div>
												<h4 className={`font-medium text-sm ${needsRevision ? "text-orange-800" : "text-gray-800"}`}>
													{getDocumentLabel(docType)}
												</h4>
												
												{/* Revision Notes */}
												{needsRevision && revisionNotes && (
													<div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-700 text-right">
														💬 {revisionNotes}
													</div>
												)}
												
												<p className="text-xs text-gray-500 mt-1">
													{docType === "bank_waiver" && "إعفاء بنكي من الجهة المصرفية"}
													{docType === "export_invoice" && "فاتورة التصدير التجارية"}
													{docType === "export_packing_list" && "قائمة التعبئة"}
													{docType === "shipping_permit" && "تصريح الشحن من الجمارك"}
													{docType === "awb" && "بوليصة الشحن الجوي"}
													{docType === "bl" && "بوليصة الشحن البحري"}
												</p>
											</div>

											{isUploaded && !needsRevision ? (
												/* Uploaded State (Approved or Pending) */
												<div className="text-center">
													<div className="mb-2">
														<span className="text-2xl">📄</span>
													</div>
													<p className="text-sm text-green-700 font-medium truncate" title={uploadedDoc.name}>
														{uploadedDoc.name}
													</p>
													<div className="flex justify-center gap-2 mt-3">
														{uploadedDoc.url && (
															<button
																type="button"
																onClick={() => window.open(uploadedDoc.url, "_blank")}
																className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center gap-1"
															>
																👁️ عرض
															</button>
														)}
														<button
															type="button"
															onClick={() => removeDocument(uploadedDoc.id)}
															className="px-3 py-1 text-xs bg-red-600 text-white rounded-full hover:bg-red-700"
														>
															🗑️ حذف
														</button>
													</div>
												</div>
											) : needsRevision ? (
												/* Needs Revision State - Show current doc + reupload option */
												<div className="text-center">
													<div className="mb-2">
														<span className="text-2xl">⚠️</span>
													</div>
													<p className="text-sm text-orange-700 font-medium truncate mb-2" title={uploadedDoc?.name}>
														{uploadedDoc?.name || "المستند الحالي"}
													</p>
													{uploadedDoc?.url && (
														<button
															type="button"
															onClick={() => window.open(uploadedDoc.url, "_blank")}
															className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 mb-3"
														>
															👁️ عرض المستند الحالي
														</button>
													)}
													<div className="border-t border-orange-300 pt-3 mt-2">
														<p className="text-xs text-orange-600 mb-2">📤 ارفع المستند المعدّل:</p>
														<label className="cursor-pointer block">
															<input
																type="file"
																onChange={(e) => {
																	const file = e.target.files[0];
																	if (file) {
																		// Validate file size (10MB max)
																		if (file.size > 10 * 1024 * 1024) {
																			toast.error("حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت");
																			e.target.value = "";
																			return;
																		}
																		setSelectedFile(file);
																		// Auto upload replacement
																		const uploadReplacementFile = async () => {
																			setUploading(true);
																			try {
																				// First delete the old document
																				if (uploadedDoc?.id) {
																					await removeDocument(uploadedDoc.id);
																				}
																				
																				const uploadFormData = new FormData();
																				uploadFormData.append("file", file);
																				uploadFormData.append("category", "ucr_request");
																				uploadFormData.append("userType", "client");
																				uploadFormData.append("documentType", docType);

																				const token = localStorage.getItem("token");
																				const response = await axios.post(
																					`${import.meta.env.VITE_API_URL}/api/uploads`,
																					uploadFormData,
																					{
																						headers: {
																							Authorization: `Bearer ${token}`,
																							"Content-Type": "multipart/form-data",
																						},
																					}
																				);

																				if (response.data.success) {
																					setUploadedDocuments((prev) => [
																						...prev.filter((d) => d.type !== docType),
																						{
																							id: response.data.upload.id || response.data.upload._id,
																							type: docType,
																							name: file.name,
																							url: response.data.upload.url || response.data.upload.publicUrl,
																							key: response.data.upload.key,
																						},
																					]);
																					toast.success(`تم رفع المستند المعدّل بنجاح`);
																				}
																			} catch (error) {
																				console.error("Upload error:", error);
																				toast.error("فشل رفع الملف: " + (error.response?.data?.message || error.message));
																			} finally {
																				setUploading(false);
																				setSelectedFile(null);
																			}
																		};
																		uploadReplacementFile();
																	}
																	e.target.value = "";
																}}
																accept=".pdf,.jpg,.jpeg,.png"
																className="hidden"
															/>
															<span className="inline-block px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors">
																{uploading ? "جاري الرفع..." : "📎 اختر ملف جديد"}
															</span>
														</label>
													</div>
												</div>
											) : (
												/* Upload State */
												<div className="text-center">
													<label className="cursor-pointer block">
														<div className="mb-2">
															<span className="text-3xl">📤</span>
														</div>
														<p className="text-sm text-gray-600 mb-2">
															اضغط لاختيار ملف
														</p>
														<input
															type="file"
															onChange={(e) => {
																const file = e.target.files[0];
																if (file) {
																	// Validate file size (10MB max)
																	if (file.size > 10 * 1024 * 1024) {
																		toast.error("حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت");
																		e.target.value = "";
																		return;
																	}
																	setSelectedFile(file);
																	// Auto upload
																	const uploadSelectedFile = async () => {
																		setUploading(true);
																		try {
																			const uploadFormData = new FormData();
																			uploadFormData.append("file", file);
																			uploadFormData.append("category", "ucr_request");
																			uploadFormData.append("userType", "client");
																			uploadFormData.append("documentType", docType);

																			const token = localStorage.getItem("token");
																			const response = await axios.post(
																				`${import.meta.env.VITE_API_URL}/api/uploads`,
																				uploadFormData,
																				{
																					headers: {
																						Authorization: `Bearer ${token}`,
																						"Content-Type": "multipart/form-data",
																					},
																				}
																			);

																			if (response.data.success) {
																				setUploadedDocuments((prev) => [
																					...prev.filter((d) => d.type !== docType),
																					{
																						id: response.data.upload.id || response.data.upload._id,
																						type: docType,
																						name: file.name,
																						url: response.data.upload.url || response.data.upload.publicUrl,
																						key: response.data.upload.key,
																					},
																				]);
																				toast.success(`تم رفع ${getDocumentLabel(docType)} بنجاح`);
																			}
																		} catch (error) {
																			console.error("Upload error:", error);
																			toast.error("فشل رفع الملف: " + (error.response?.data?.message || error.message));
																		} finally {
																			setUploading(false);
																			setSelectedFile(null);
																		}
																	};
																	uploadSelectedFile();
																}
																e.target.value = "";
															}}
															accept=".pdf,.jpg,.jpeg,.png"
															className="hidden"
														/>
														<span className="inline-block px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors">
															{uploading ? "جاري الرفع..." : "اختر ملف"}
														</span>
													</label>
												</div>
											)}
										</div>
									);
								})}
							</div>

							{/* Upload Progress Summary */}
							<div className="mt-4 p-3 bg-gray-100 rounded-lg">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-700">
										المستندات المرفوعة: {uploadedDocuments.length} من {getRequiredDocuments().length} (المستند الأول مطلوب فقط)
									</span>
									<div className="flex gap-1">
										{getRequiredDocuments().map((docType, index) => {
											const isUploaded = uploadedDocuments.some((d) => d.type === docType);
											return (
												<span
													key={docType}
													className={`w-3 h-3 rounded-full ${
														isUploaded 
															? "bg-green-500" 
															: index === 0 
																? "bg-red-400"
																: "bg-gray-300"
													}`}
													title={getDocumentLabel(docType)}
												></span>
											);
										})}
									</div>
								</div>
								{uploadedDocuments.length >= 1 && (
									<p className="text-sm text-green-600 mt-2 flex items-center gap-1">
										✅ تم رفع المستند المطلوب - يمكنك إضافة المستندات الأخرى اختيارياً
									</p>
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
