import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { 
	X, User, Mail, Phone, Briefcase, Hash, CreditCard, 
	Award, Calendar, Edit3, Save, Loader2 
} from "lucide-react";
import userPic from "../assets/images/AVATAR.png";

export default function CustomerDetailsModal({
	customerId,
	onClose,
	onUpdate,
}) {
	const { isDarkMode } = useTheme();
	const [customer, setCustomer] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [formData, setFormData] = useState({
		fullname: "",
		username: "",
		email: "",
		phone: "",
		clientType: "",
		ssn: "",
		taxNumber: "",
		rank: "",
		active: true,
	});

	const token = localStorage.getItem("token");

	// Options
	const clientTypes = [
		{ value: "commercial", label: "تجاري" },
		{ value: "factory", label: "مصنع" },
		{ value: "personal", label: "شخصي" },
	];

	const ranks = [
		{ value: "1", label: "رتبة 1" },
		{ value: "2", label: "رتبة 2" },
		{ value: "3", label: "رتبة 3" },
	];

	// Theme classes
	const theme = {
		modalBg: isDarkMode ? "bg-[#1a1010] border-white/10" : "bg-white border-gray-100",
		headerBg: isDarkMode ? "bg-[#2d2600]/50 border-white/5" : "bg-gray-50 border-gray-100",
		textPrimary: isDarkMode ? "text-[#D4AF37]" : "text-[#690000]",
		textSecondary: isDarkMode ? "text-gray-400" : "text-gray-500",
		inputBg: isDarkMode ? "bg-[#2d2600]/30 border-[#D4AF37]/30 text-white focus:border-[#D4AF37]" : "bg-white border-gray-300 text-gray-900 focus:border-[#690000]",
		label: isDarkMode ? "text-[#D4AF37]/80" : "text-gray-700",
		iconPill: isDarkMode ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-[#690000]/10 text-[#690000]",
		divider: isDarkMode ? "border-white/10" : "border-gray-100",
	};

	const getClientTypeLabel = (type) => {
		const labels = { commercial: "تجاري", factory: "مصنع", personal: "شخصي" };
		return labels[type] || type;
	};

	useEffect(() => {
		fetchCustomerDetails();
	}, [customerId]);

	const fetchCustomerDetails = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/users`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			const cust = response.data.find((user) => user._id === customerId);
			if (cust) {
				setCustomer(cust);
				setFormData({
					fullname: cust.fullname,
					username: cust.username,
					email: cust.email,
					phone: cust.phone,
					clientType: cust.clientDetails?.clientType || "commercial",
					ssn: cust.clientDetails?.ssn || "",
					taxNumber: cust.taxNumber || "",
					rank: cust.rank || "",
					active: cust.active,
				});
			}
			setLoading(false);
		} catch (error) {
			console.error("Error fetching customer details:", error);
			toast.error("فشل تحميل بيانات العميل");
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/users/${customerId}`,
				{
					fullname: formData.fullname,
					username: formData.username,
					email: formData.email,
					phone: formData.phone,
					type: "client",
					clientType: formData.clientType,
					ssn: formData.ssn,
					taxNumber: formData.taxNumber,
					rank: formData.rank || null,
					active: formData.active,
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			toast.success("تم تحديث بيانات العميل بنجاح");
			setIsEditing(false);
			if (onUpdate) onUpdate();
			fetchCustomerDetails();
		} catch (error) {
			console.error("Error updating customer:", error);
			toast.error("فشل تحديث بيانات العميل");
		} finally {
			setSaving(false);
		}
	};

	if (!customer && !loading) return null;

	return ReactDOM.createPortal(
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

			<div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden ${theme.modalBg}`} dir="rtl">
				
				{/* Close Button */}
				<button 
					onClick={onClose}
					className={`absolute top-4 left-4 z-10 p-2 rounded-full transition-colors ${isDarkMode ? "bg-black/40 text-white hover:bg-red-500 hover:text-white" : "bg-white/80 text-gray-600 hover:bg-red-100 hover:text-red-600"}`}
				>
					<X className="w-5 h-5" />
				</button>

				{loading ? (
					<div className="w-full h-96 flex flex-col items-center justify-center">
						<Loader2 className={`w-12 h-12 animate-spin mb-4 ${theme.textPrimary}`} />
						<p className={theme.textSecondary}>جاري تحميل البيانات...</p>
					</div>
				) : (
					<>
						{/* Sidebar / Avatar Section */}
						<div className={`w-full md:w-80 p-8 flex flex-col items-center text-center relative overflow-hidden ${isDarkMode ? "bg-[#2d2600]/20" : "bg-gray-50"}`}>
							{/* Background Blobs */}
							<div className={`absolute top-[-50px] right-[-50px] w-32 h-32 rounded-full blur-3xl opacity-20 ${isDarkMode ? "bg-[#D4AF37]" : "bg-[#690000]"}`}></div>
							
							<div className="relative w-40 h-40 mb-6">
								<div className={`absolute inset-0 rounded-full animate-pulse opacity-20 ${isDarkMode ? "bg-[#D4AF37]" : "bg-[#690000]"}`}></div>
								<img
									src={userPic}
									alt="customer"
									className="w-full h-full rounded-full object-cover border-4 border-white dark:border-[#2d2600] shadow-lg relative z-10"
								/>
								<div className={`absolute bottom-2 right-2 p-2 rounded-full border-2 border-white dark:border-[#1a1010] z-20 ${customer.active ? "bg-green-500" : "bg-red-500"}`}></div>
							</div>

							<h3 className={`text-xl font-bold mb-1 ${theme.textPrimary}`}>
								{customer.fullname}
							</h3>
							<p className={`text-sm mb-6 ${theme.textSecondary}`}>@{customer.username}</p>

							<div className="w-full space-y-3">
								<div className={`flex items-center justify-between px-4 py-3 rounded-xl ${isDarkMode ? "bg-black/20" : "bg-white border border-gray-100"}`}>
									<span className={`text-xs ${theme.textSecondary}`}>الحالة</span>
									<span className={`px-2 py-0.5 rounded text-xs font-bold ${customer.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
										{customer.active ? "نشط" : "غير نشط"}
									</span>
								</div>
								
								<div className={`flex items-center justify-between px-4 py-3 rounded-xl ${isDarkMode ? "bg-black/20" : "bg-white border border-gray-100"}`}>
									<span className={`text-xs ${theme.textSecondary}`}>النوع</span>
									<span className={`px-2 py-0.5 rounded text-xs font-bold ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
										{getClientTypeLabel(customer.clientDetails?.clientType)}
									</span>
								</div>

								{customer.rank && (
									<div className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed ${isDarkMode ? "border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37]" : "border-yellow-200 bg-yellow-50 text-yellow-700"}`}>
										<Award className="w-4 h-4" />
										<span className="text-sm font-bold">رتبة {customer.rank}</span>
									</div>
								)}
							</div>

							<div className={`mt-auto pt-6 text-xs w-full text-right space-y-2 ${theme.textSecondary}`}>
								<div className="flex justify-between">
									<span>تاريخ التسجيل:</span>
									<span className="font-mono">{new Date(customer.createdAt).toLocaleDateString("ar-EG")}</span>
								</div>
								<div className="flex justify-between">
									<span>آخر تحديث:</span>
									<span className="font-mono">{new Date(customer.updatedAt).toLocaleDateString("ar-EG")}</span>
								</div>
							</div>
						</div>

						{/* Main Content / Form Section */}
						<div className="flex-1 p-8 flex flex-col">
							<div className="flex justify-between items-center mb-8 border-b pb-4 dark:border-white/5">
								<div>
									<h2 className={`text-2xl font-bold ${theme.textPrimary}`}>بيانات العميل</h2>
									<p className={`text-sm ${theme.textSecondary}`}>عرض وإدارة المعلومات الشخصية والبيانات المالية</p>
								</div>
								{!isEditing ? (
									<button
										onClick={() => setIsEditing(true)}
										className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg ${isDarkMode ? "bg-linear-to-r from-[#D4AF37] to-[#B8860B] text-black" : "bg-linear-to-r from-[#690000] to-[#8B0000] text-white hover:shadow-red-500/20"}`}
									>
										<Edit3 className="w-4 h-4" /> تعديل
									</button>
								) : (
									<div className="flex gap-2">
										<button
											onClick={() => {
												setIsEditing(false);
												setFormData({
													fullname: customer.fullname,
													username: customer.username,
													email: customer.email,
													phone: customer.phone,
													clientType: customer.clientDetails?.clientType || "commercial",
													ssn: customer.clientDetails?.ssn || "",
													taxNumber: customer.taxNumber || "",
													rank: customer.rank || "",
													active: customer.active,
												});
											}}
											className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
										>
											إلغاء
										</button>
										<button
											onClick={handleSave}
											disabled={saving}
											className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg ${saving ? "opacity-70 cursor-wait" : ""} ${isDarkMode ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20" : "bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-500/20"}`}
										>
											{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
											حفظ
										</button>
									</div>
								)}
							</div>

							<div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar" style={{maxHeight: 'calc(80vh - 150px)'}}>
								{/* Personal Info Group */}
								<div>
									<h4 className={`text-xs font-bold uppercase tracking-wider mb-4 opacity-50 ${theme.textPrimary}`}>المعلومات الشخصية</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<label className={`text-sm font-medium flex items-center gap-2 ${theme.label}`}>
												<User className="w-4 h-4 opacity-50" /> الاسم الكامل
											</label>
											{isEditing ? (
												<input
													type="text"
													name="fullname"
													value={formData.fullname}
													onChange={handleInputChange}
													className={`w-full p-3 rounded-xl outline-none border-2 transition-colors ${theme.inputBg}`}
												/>
											) : (
												<p className={`p-3 rounded-xl border-b ${theme.headerBg} ${theme.textPrimary} font-bold`}>{customer.fullname}</p>
											)}
										</div>

										<div className="space-y-2">
											<label className={`text-sm font-medium flex items-center gap-2 ${theme.label}`}>
												<Hash className="w-4 h-4 opacity-50" /> اسم المستخدم
											</label>
											{isEditing ? (
												<input
													type="text"
													name="username"
													value={formData.username}
													onChange={handleInputChange}
													className={`w-full p-3 rounded-xl outline-none border-2 transition-colors ${theme.inputBg}`}
												/>
											) : (
												<p className={`p-3 rounded-xl border-b ${theme.headerBg} font-mono dir-ltr text-right ${theme.textSecondary}`}>{customer.username}</p>
											)}
										</div>

										<div className="space-y-2">
											<label className={`text-sm font-medium flex items-center gap-2 ${theme.label}`}>
												<Mail className="w-4 h-4 opacity-50" /> البريد الإلكتروني
											</label>
											{isEditing ? (
												<input
													type="email"
													name="email"
													value={formData.email}
													onChange={handleInputChange}
													className={`w-full p-3 rounded-xl outline-none border-2 transition-colors ${theme.inputBg}`}
												/>
											) : (
												<p className={`p-3 rounded-xl border-b ${theme.headerBg} ${theme.textSecondary}`}>{customer.email}</p>
											)}
										</div>

										<div className="space-y-2">
											<label className={`text-sm font-medium flex items-center gap-2 ${theme.label}`}>
												<Phone className="w-4 h-4 opacity-50" /> الهاتف
											</label>
											{isEditing ? (
												<input
													type="tel"
													name="phone"
													value={formData.phone}
													onChange={handleInputChange}
													className={`w-full p-3 rounded-xl outline-none border-2 transition-colors ${theme.inputBg}`}
												/>
											) : (
												<p className={`p-3 rounded-xl border-b ${theme.headerBg} ${theme.textSecondary} dir-ltr text-right`}>{customer.phone}</p>
											)}
										</div>
									</div>
								</div>

								{/* Business Info Group */}
								<div>
									<h4 className={`text-xs font-bold uppercase tracking-wider mb-4 opacity-50 ${theme.textPrimary} mt-6 border-t pt-6 ${theme.divider}`}>بيانات العمل</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<label className={`text-sm font-medium flex items-center gap-2 ${theme.label}`}>
												<Briefcase className="w-4 h-4 opacity-50" /> نوع العميل
											</label>
											{isEditing ? (
												<select
													name="clientType"
													value={formData.clientType}
													onChange={handleInputChange}
													className={`w-full p-3 rounded-xl outline-none border-2 transition-colors appearance-none ${theme.inputBg}`}
												>
													{clientTypes.map((type) => (
														<option key={type.value} value={type.value}>{type.label}</option>
													))}
												</select>
											) : (
												<p className={`p-3 rounded-xl border-b ${theme.headerBg} ${theme.textSecondary}`}>{getClientTypeLabel(customer.clientDetails?.clientType)}</p>
											)}
										</div>

										{(formData.clientType === "personal" || customer.clientDetails?.clientType === "personal") && (
											<div className="space-y-2">
												<label className={`text-sm font-medium flex items-center gap-2 ${theme.label}`}>
													<CreditCard className="w-4 h-4 opacity-50" /> الرقم القومي
												</label>
												{isEditing ? (
													<input
														type="text"
														name="ssn"
														value={formData.ssn}
														onChange={handleInputChange}
														className={`w-full p-3 rounded-xl outline-none border-2 transition-colors ${theme.inputBg}`}
													/>
												) : (
													<p className={`p-3 rounded-xl border-b ${theme.headerBg} ${theme.textSecondary}`}>{customer.clientDetails?.ssn || "غير محدد"}</p>
												)}
											</div>
										)}

										<div className="space-y-2">
											<label className={`text-sm font-medium flex items-center gap-2 ${theme.label}`}>
												<FileText className="w-4 h-4 opacity-50" /> الرقم الضريبي
											</label>
											{isEditing ? (
												<input
													type="text"
													name="taxNumber"
													value={formData.taxNumber}
													onChange={handleInputChange}
													className={`w-full p-3 rounded-xl outline-none border-2 transition-colors ${theme.inputBg}`}
												/>
											) : (
												<p className={`p-3 rounded-xl border-b ${theme.headerBg} ${theme.textSecondary}`}>{customer.taxNumber || "غير محدد"}</p>
											)}
										</div>

										<div className="space-y-2">
											<label className={`text-sm font-medium flex items-center gap-2 ${theme.label}`}>
												<Award className="w-4 h-4 opacity-50" /> الرتبة
											</label>
											{isEditing ? (
												<select
													name="rank"
													value={formData.rank}
													onChange={handleInputChange}
													className={`w-full p-3 rounded-xl outline-none border-2 transition-colors appearance-none ${theme.inputBg}`}
												>
													<option value="">بدون رتبة</option>
													{ranks.map((rank) => (
														<option key={rank.value} value={rank.value}>{rank.label}</option>
													))}
												</select>
											) : (
												<p className={`p-3 rounded-xl border-b ${theme.headerBg} ${theme.textSecondary}`}>{customer.rank ? `رتبة ${customer.rank}` : "بدون رتبة"}</p>
											)}
										</div>

										{isEditing && (
											<div className="space-y-2">
												<label className={`text-sm font-medium flex items-center gap-2 ${theme.label}`}>
													<CheckCircle className="w-4 h-4 opacity-50" /> حالة الحساب
												</label>
												<select
													name="active"
													value={formData.active}
													onChange={(e) => setFormData({ ...formData, active: e.target.value === "true" })}
													className={`w-full p-3 rounded-xl outline-none border-2 transition-colors appearance-none ${theme.inputBg}`}
												>
													<option value="true">نشط</option>
													<option value="false">غير نشط</option>
												</select>
											</div>
										)}
									</div>
								</div>
								
								<div className="pt-4 text-xs opacity-50 font-mono text-center">
									User ID: {customer._id}
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>,
		document.body
	);
}

// Missing icons import fix
import { CheckCircle, FileText } from "lucide-react";
