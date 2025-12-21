import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";
import { 
	UploadCloud, FileText, X, CheckCircle, AlertCircle, 
	Ship, Plane, Package, User, Building2, MapPin, 
	Mail, Phone, FileDigit, Scale
} from "lucide-react";

// --- Styled Components Helper ---
const InputGroup = ({ icon: Icon, label, value, onChange, placeholder, type = "text", required = false }) => {
	const { isDarkMode } = useTheme();
	
	return (
		<div className="space-y-2">
			<label className={`block text-sm font-bold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
				{label} {required && <span className="text-red-500">*</span>}
			</label>
			<div className="relative">
				<div className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
					<Icon size={18} />
				</div>
				<input
					type={type}
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
					required={required}
					className={`block w-full pr-10 pl-3 py-3 rounded-xl border outline-none transition-all ${
						isDarkMode 
							? "bg-[#1a1010] border-white/10 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder-gray-600" 
							: "bg-white border-gray-200 text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder-gray-400"
					}`}
				/>
			</div>
		</div>
	);
};

const ACIDRequestPage = () => {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	const fileInputRef = useRef(null);

	// --- State Management ---
	// File Upload State
	const [selectedFile, setSelectedFile] = useState(null);
	const [uploadedInvoice, setUploadedInvoice] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);

	// Form Data State
	const [formData, setFormData] = useState({
		shipmentType: "بحري",
		goods: {
			weight: "",
			customsItem: "",
			description: "", 
		},
		supplier: {
			name: "",
			taxNum: "",
			country: "",
			email: "",
			mobileNum: "",
		},
	});

	// --- Auth Check ---
	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("يجب تسجيل الدخول أولاً");
			navigate("/login");
		}
	}, [navigate]);

	// --- Handlers ---

	// Input Changes
	const handleInputChange = (section, field, value) => {
		if (section) {
			setFormData(prev => ({
				...prev,
				[section]: { ...prev[section], [field]: value }
			}));
		} else {
			setFormData(prev => ({ ...prev, [field]: value }));
		}
	};

	// File Selection
	const handleFileSelect = (e) => {
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
		toast.success(`تم اختيار الملف: ${file.name}`);
		// Reset upload state if re-selecting
		setUploadedInvoice(null); 
	};

	// Upload Logic
	const uploadFileToServer = async (file) => {
		const formDataUpload = new FormData();
		formDataUpload.append("file", file);
		formDataUpload.append("category", "acidrequest");
		formDataUpload.append("userType", "client");
		formDataUpload.append("documentType", "proforma_invoice");

		const token = localStorage.getItem("token");
		return axios.post(
			`${import.meta.env.VITE_API_URL}/api/uploads`,
			formDataUpload,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "multipart/form-data",
				},
				onUploadProgress: (progressEvent) => {
					const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					setProgress(percentCompleted);
				},
			}
		);
	};

	const handleDeleteUpload = () => {
		setSelectedFile(null);
		setUploadedInvoice(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		toast.success("تم حذف الملف");
	};

	// Submit Logic
	const handleACIDRequest = async (e) => {
		e.preventDefault();
		
		if (!selectedFile && !uploadedInvoice) {
			toast.error("يجب اختيار الفاتورة المبدئية أولاً");
			return;
		}

		try {
			let uploadId = uploadedInvoice?.id;

			// Step 1: Upload if not already done
			if (selectedFile && !uploadedInvoice) {
				setUploading(true);
				setProgress(0);
				try {
					const response = await uploadFileToServer(selectedFile);
					if (response.data.success) {
						uploadId = response.data.upload.id;
						setUploadedInvoice({
							id: response.data.upload.id,
							filename: response.data.upload.filename,
							url: response.data.upload.url,
						});
						toast.success("تم رفع الفاتورة بنجاح");
					}
				} catch (error) {
					console.error("Upload error:", error);
					toast.error("فشل رفع الملف");
					setUploading(false);
					return;
				}
				setUploading(false);
			}

			// Step 2: Submit Request
			const token = localStorage.getItem("token");
			const requestData = {
				supplier: formData.supplier,
				goods: formData.goods,
				uploads: [uploadId],
				shipmentType: formData.shipmentType,
			};

			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/acid`,
				requestData,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success || response.status === 201) {
				toast.success("تم إرسال طلب الـ ACID بنجاح! ✅");
				setTimeout(() => navigate("/acidrequests"), 1500); // Redirect to requests list
			}

		} catch (error) {
			console.error("Submit error:", error);
			toast.error(error.response?.data?.message || "فشل في إرسال الطلب");
		}
	};



	return (
		<div className={`min-h-screen font-sans relative transition-colors duration-300 ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`}>
			
			{/* Background Ambience */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
				{isDarkMode ? (
					<>
						<div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#2b0000]/20 to-transparent"></div>
						<div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[100px]"></div>
					</>
				) : (
					<div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-red-50/80 to-transparent"></div>
				)}
			</div>

			<Header />

			<main className="relative z-10 pt-28 pb-20 px-4 md:px-6">
				<div className="max-w-4xl mx-auto">
					
					{/* Header Section */}
					<div className="text-center mb-10">
						<h1 className={`text-4xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
							طلب ACID جديد
						</h1>
						<p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
							استخراج رقم تعريفي مسبق للشحنة (ACID)
						</p>
					</div>

					<form onSubmit={handleACIDRequest} className="space-y-8">
						
						{/* 1. Preliminary Invoice Upload */}
						<div className={`p-8 rounded-3xl border shadow-lg backdrop-blur-xl ${
							isDarkMode ? "bg-[#1a1010]/80 border-white/10" : "bg-white/80 border-white"
						}`}>
							<h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
								<FileText className="text-red-500" />
								الفاتورة المبدئية
								<span className="text-red-500">*</span>
							</h2>

							{!selectedFile ? (
								<div 
									onClick={() => fileInputRef.current?.click()}
									className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all group ${
										isDarkMode 
											? "border-gray-700 hover:border-red-500 hover:bg-red-900/5" 
											: "border-gray-300 hover:border-red-500 hover:bg-red-50"
									}`}
								>
									<div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
										isDarkMode ? "bg-red-900/20 text-red-500" : "bg-red-100 text-red-600"
									}`}>
										<UploadCloud size={32} />
									</div>
									<h3 className={`font-bold text-lg mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
										اضغط لرفع الملف
									</h3>
									<p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
										PDF, JPG, PNG (Max 10MB)
									</p>
									<input 
										ref={fileInputRef}
										type="file" 
										className="hidden" 
										accept=".pdf,.jpg,.jpeg,.png"
										onChange={handleFileSelect}
									/>
								</div>
							) : (
								<div className={`relative flex items-center p-4 rounded-xl border ${
									isDarkMode ? "bg-white/5 border-green-500/30" : "bg-green-50 border-green-200"
								}`}>
									<div className={`p-3 rounded-full mr-4 ${
										isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600"
									}`}>
										<CheckCircle size={24} />
									</div>
									<div className="flex-grow">
										<p className={`font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
											{selectedFile.name}
										</p>
										<p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
											{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
										</p>
										{uploading && (
											<div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
												<div className="bg-green-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
											</div>
										)}
									</div>
									<button 
										type="button"
										onClick={handleDeleteUpload}
										className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
									>
										<X size={20} />
									</button>
								</div>
							)}
						</div>

						{/* 2. Shipment Details */}
						<div className={`p-8 rounded-3xl border shadow-lg backdrop-blur-xl ${
							isDarkMode ? "bg-[#1a1010]/80 border-white/10" : "bg-white/80 border-white"
						}`}>
							<h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
								<Package className="text-red-500" />
								بيانات الشحنة
							</h2>
							
							{/* Type Selection */}
							<div className="mb-8">
								<label className={`block text-sm font-bold mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
									نوع الشحنة <span className="text-red-500">*</span>
								</label>
								<div className="grid grid-cols-2 gap-4">
									{[
										{ id: "بحري", label: "شحن بحري", icon: Ship },
										{ id: "جوي", label: "شحن جوي", icon: Plane }
									].map((opt) => (
										<div 
											key={opt.id}
											onClick={() => handleInputChange(null, "shipmentType", opt.id)}
											className={`cursor-pointer rounded-xl p-4 border-2 flex items-center justify-center gap-3 transition-all ${
												formData.shipmentType === opt.id
													? "border-red-500 bg-red-500/5 text-red-500"
													: (isDarkMode ? "border-white/10 bg-white/5 text-gray-400 hover:border-white/20" : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100")
											}`}
										>
											<opt.icon size={24} />
											<span className="font-bold">{opt.label}</span>
										</div>
									))}
								</div>
							</div>

							<div className="grid md:grid-cols-2 gap-6">
								<InputGroup 
									label="البند الجمركي" 
									icon={FileDigit} 
									value={formData.goods.customsItem}
									onChange={(val) => handleInputChange("goods", "customsItem", val)}
									placeholder="مثال: 851713"
									required
								/>
								<InputGroup 
									label="الوزن القائم (كجم)" 
									icon={Scale} 
									type="number"
									value={formData.goods.weight}
									onChange={(val) => handleInputChange("goods", "weight", val)}
									placeholder="0.00"
									required
								/>
								<div className="md:col-span-2">
									<InputGroup 
										label="وصف البضاعة" 
										icon={FileText} 
										value={formData.goods.description}
										onChange={(val) => handleInputChange("goods", "description", val)}
										placeholder="وصف دقيق للبضاعة (مثل: هواتف محمولة، ملابس، ...)"
										required
									/>
								</div>
							</div>
						</div>

						{/* 3. Supplier Details */}
						<div className={`p-8 rounded-3xl border shadow-lg backdrop-blur-xl ${
							isDarkMode ? "bg-[#1a1010]/80 border-white/10" : "bg-white/80 border-white"
						}`}>
							<h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
								<Building2 className="text-red-500" />
								بيانات المورد (الأجنبي)
							</h2>
							
							<div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
								isDarkMode ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-800"
							}`}>
								<AlertCircle className="shrink-0 mt-0.5" size={20} />
								<p className="text-sm">
									يرجى إدخال بيانات الشركة الموردة بدقة كما تظهر في الفاتورة المبدئية. هذه البيانات ستستخدم في تقديم طلب ACID.
								</p>
							</div>

							<div className="grid md:grid-cols-2 gap-6">
								<InputGroup 
									label="اسم المورد" 
									icon={User} 
									value={formData.supplier.name}
									onChange={(val) => handleInputChange("supplier", "name", val)}
									placeholder="اسم الشركة الموردة"
									required
								/>
								<InputGroup 
									label="الرقم الضريبي للمورد" 
									icon={FileDigit} 
									value={formData.supplier.taxNum}
									onChange={(val) => handleInputChange("supplier", "taxNum", val)}
									placeholder="Tax ID Number"
								/>
								<InputGroup 
									label="الدولة" 
									icon={MapPin} 
									value={formData.supplier.country}
									onChange={(val) => handleInputChange("supplier", "country", val)}
									placeholder="بلد المنشأ"
									required
								/>
								<InputGroup 
									label="رقم الهاتف" 
									icon={Phone} 
									value={formData.supplier.mobileNum}
									onChange={(val) => handleInputChange("supplier", "mobileNum", val)}
									placeholder="مع مفتاح الدولة"
								/>
								<div className="md:col-span-2">
									<InputGroup 
										label="البريد الإلكتروني" 
										icon={Mail} 
										type="email"
										value={formData.supplier.email}
										onChange={(val) => handleInputChange("supplier", "email", val)}
										placeholder="supplier@example.com"
									/>
								</div>
							</div>
						</div>

						{/* Submit Button */}
						<div className="pt-6">
							<button
								type="submit"
								disabled={uploading}
								className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
									isDarkMode 
										? "bg-gradient-to-r from-red-600 to-red-800 text-white hover:shadow-red-900/20" 
										: "bg-gradient-to-r from-red-700 to-red-900 text-white hover:shadow-red-500/20"
								} hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed`}
							>
								{uploading ? (
									<>
										<div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										جاري المعالجة...
									</>
								) : (
									<>
										<CheckCircle size={24} />
										تقديم طلب ACID
									</>
								)}
							</button>
						</div>

					</form>
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default ACIDRequestPage;
