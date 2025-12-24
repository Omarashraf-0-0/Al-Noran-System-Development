import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { X, User, Mail, Lock, Phone, Briefcase, ChevronDown, CheckCircle, Shield } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import userPic from "../assets/images/AVATAR.png";

export default function AddEmployeePopUp({ onClose, onEmployeeAdded }) {
	const { isDarkMode } = useTheme();
	const [formData, setFormData] = useState({
		fullname: "",
		username: "",
		email: "",
		password: "",
		phone: "",
		employeeType: "",
	});

	const [loading, setLoading] = useState(false);
	const [selectedPermissions, setSelectedPermissions] = useState([]);

	const permissionsList = [
		"صلاحية إصدار فواتير بدون مراجعة",
		"صلاحية تعديل بيانات العملاء",
		"صلاحيه أرشفه الشهادات أو حذفها",
		"صلاحيه الوصول إلى تقارير الإيرادات",
	];

	const employeeTypes = [
		{ value: "System Admin", label: "مدير النظام" },
		{ value: "Department Manager", label: "مدير قسم" },
		{ value: "Certified Employee", label: "موظف معتمد" },
		{ value: "Regular Employee", label: "موظف عادي" },
	];

	// Theme classes
	const theme = {
		modalBg: isDarkMode ? "bg-[#1a1600] border-2 border-[#D4AF37]/20" : "bg-white",
		textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-[#690000]",
		textSecondary: isDarkMode ? "text-[#D4AF37]/70" : "text-gray-500",
		inputBg: isDarkMode ? "bg-[#2d2600] border-[#D4AF37]/30 text-white placeholder-[#D4AF37]/30 focus:border-[#D4AF37]" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#690000]",
		tagBg: isDarkMode ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30" : "bg-red-50 text-red-800 border border-red-100",
		closeHover: isDarkMode ? "hover:bg-[#D4AF37]/20 text-[#D4AF37]" : "hover:bg-red-50 text-gray-500 hover:text-red-600",
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleAddPermission = (e) => {
		const value = e.target.value;
		if (value && !selectedPermissions.includes(value)) {
			setSelectedPermissions([...selectedPermissions, value]);
		}
	};

	const removePermission = (permission) => {
		setSelectedPermissions(selectedPermissions.filter((p) => p !== permission));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!formData.fullname || !formData.username || !formData.email || !formData.password || !formData.phone || !formData.employeeType) {
			toast.error("جميع الحقول مطلوبة");
			return;
		}

		if (formData.password.length < 6) {
			toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
			return;
		}

		try {
			setLoading(true);
			const token = localStorage.getItem("token");

			await axios.post(
				`${import.meta.env.VITE_API_URL}/api/users`,
				{
					...formData,
					type: "employee",
					permissions: selectedPermissions,
					verified: true,
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			toast.success("تم إضافة الموظف بنجاح");
			if (onEmployeeAdded) onEmployeeAdded();
			onClose();
		} catch (error) {
			console.error("Error adding employee:", error);
			toast.error(error.response?.data?.message || "حدث خطأ أثناء إضافة الموظف");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
			<div className={`${theme.modalBg} rounded-3xl shadow-2xl w-full max-w-5xl p-8 md:p-10 relative overflow-hidden animate-in zoom-in-95 duration-200`}>
				
				{/* Header Gradient Line */}
				<div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isDarkMode ? "via-[#D4AF37]" : "via-[#690000]"} to-transparent opacity-80`}></div>

				{/* Close Button */}
				<button 
					onClick={onClose} 
					className={`absolute top-6 left-6 p-2 rounded-full transition-all ${theme.closeHover}`}
				>
					<X className="w-6 h-6" />
				</button>

				<div className="flex flex-col md:flex-row gap-10">
					{/* ---------------- RIGHT EMPLOYEE PREVIEW ---------------- */}
					<div className="md:w-1/3 flex flex-col items-center text-center justify-center border-b md:border-b-0 md:border-l border-gray-100 dark:border-[#D4AF37]/10 pb-8 md:pb-0 md:pl-8">
						<div className={`w-40 h-40 md:w-52 md:h-52 rounded-full flex justify-center items-center overflow-hidden border-4 shadow-xl mb-6 ${isDarkMode ? "border-[#D4AF37]/20 bg-[#2d2600]" : "border-white bg-gray-50"}`}>
							<img src={userPic} alt="employee" className="w-full h-full object-cover" />
						</div>

						<h3 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
							{formData.fullname || "اسم الموظف"}
						</h3>
						<p className={`text-lg ${theme.textSecondary} flex items-center gap-2`}>
							<Briefcase className="w-4 h-4" />
							{formData.employeeType ? employeeTypes.find(t => t.value === formData.employeeType)?.label : "المسمى الوظيفي"}
						</p>
					</div>

					{/* ---------------- LEFT FORM SECTION ---------------- */}
					<form onSubmit={handleSubmit} className="flex-1 space-y-6">
						<div>
							<h2 className={`text-2xl font-bold ${theme.textPrimary} border-r-4 ${isDarkMode ? "border-[#D4AF37]" : "border-[#690000]"} pr-4`}>
								بيانات الموظف الجديد
							</h2>
						</div>

						{/* Row 1: Names */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="relative group">
								<input
									type="text"
									name="fullname"
									value={formData.fullname}
									onChange={handleInputChange}
									placeholder="الاسم بالكامل"
									className={`w-full ${theme.inputBg} rounded-xl py-3 pr-12 pl-4 text-right shadow-sm focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all`}
									required
								/>
								<User className={`w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
							</div>

							<div className="relative group">
								<input
									type="text"
									name="username"
									value={formData.username}
									onChange={handleInputChange}
									placeholder="اسم المستخدم (للدخول)"
									className={`w-full ${theme.inputBg} rounded-xl py-3 pr-12 pl-4 text-right shadow-sm focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all`}
									required
								/>
								<Shield className={`w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
							</div>
						</div>

						{/* Row 2: Contact & Auth */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="relative group">
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									placeholder="البريد الإلكتروني"
									className={`w-full ${theme.inputBg} rounded-xl py-3 pr-12 pl-4 text-right shadow-sm focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all`}
									required
								/>
								<Mail className={`w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
							</div>

							<div className="relative group">
								<input
									type="password"
									name="password"
									value={formData.password}
									onChange={handleInputChange}
									placeholder="كلمة المرور"
									className={`w-full ${theme.inputBg} rounded-xl py-3 pr-12 pl-4 text-right shadow-sm focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all`}
									minLength={6}
									required
								/>
								<Lock className={`w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
							</div>
						</div>

						{/* Row 3: Phone & Type */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="relative group">
								<input
									type="tel"
									name="phone"
									value={formData.phone}
									onChange={handleInputChange}
									placeholder="رقم الهاتف"
									className={`w-full ${theme.inputBg} rounded-xl py-3 pr-12 pl-4 text-right shadow-sm focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all`}
									pattern="[0-9]{11}"
									maxLength={11}
									required
								/>
								<Phone className={`w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
							</div>

							<div className="relative group">
								<select
									name="employeeType"
									value={formData.employeeType}
									onChange={handleInputChange}
									className={`w-full ${theme.inputBg} rounded-xl py-3 pr-12 pl-4 text-right shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all cursor-pointer`}
									required
								>
									<option value="">اختر المسمى الوظيفي</option>
									{employeeTypes.map((type, idx) => (
										<option key={idx} value={type.value}>{type.label}</option>
									))}
								</select>
								<Briefcase className={`w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
								<ChevronDown className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
							</div>
						</div>

						{/* Permissions Section */}
						<div className="relative">
							{/* <label className={`block mb-2 text-sm font-medium ${theme.textPrimary}`}>الصلاحيات الإضافية</label> */}
							<div className="relative mb-3">
								<select
									onChange={handleAddPermission}
									className={`w-full ${theme.inputBg} rounded-xl py-3 pr-12 pl-4 text-right shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all cursor-pointer`}
								>
									<option value="">+ إضافة صلاحية خاصة</option>
									{permissionsList.map((p, idx) => (
										<option key={idx} value={p}>{p}</option>
									))}
								</select>
								<CheckCircle className={`w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
								<ChevronDown className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
							</div>

							<div className="flex flex-wrap gap-2">
								{selectedPermissions.map((perm, index) => (
									<div key={index} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${theme.tagBg} transition-all hover:scale-105`}>
										<span>{perm}</span>
										<button onClick={() => removePermission(perm)} className="hover:text-red-600 transition-colors">
											<X className="w-4 h-4" />
										</button>
									</div>
								))}
							</div>
						</div>

						{/* Submit Button */}
						<div className="flex justify-end pt-4">
							<button
								type="submit"
								disabled={loading}
								className={`
									px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center gap-3
									${isDarkMode 
										? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:shadow-[#D4AF37]/40 shadow-[#D4AF37]/20 text-[#1a1600]" 
										: "bg-gradient-to-r from-[#1BA3B6] to-[#158A9A] hover:shadow-cyan-500/30"}
									${loading ? "opacity-70 cursor-not-allowed" : ""}
								`}
							>
								{loading ? (
									<>جاري الإضافة...</>
								) : (
									<>
										تأكيد وإضافة
										<CheckCircle className="w-5 h-5" />
									</>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
