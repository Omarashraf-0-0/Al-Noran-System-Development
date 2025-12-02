import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import userPic from "../assets/images/AVATAR.png";
import DropDown from "../assets/images/arrow_drop_down.png";
import Prod from "../assets/images/productivity.png";
import close from "../assets/images/close(1).png";

export default function AddEmployeePopUp({ onClose, onEmployeeAdded }) {
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

	// Handle input changes
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	// Add permission
	const handleAddPermission = (e) => {
		const value = e.target.value;
		if (value && !selectedPermissions.includes(value)) {
			setSelectedPermissions([...selectedPermissions, value]);
		}
	};

	// Remove permission
	const removePermission = (permission) => {
		setSelectedPermissions(selectedPermissions.filter((p) => p !== permission));
	};

	// Submit form
	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validation
		if (
			!formData.fullname ||
			!formData.username ||
			!formData.email ||
			!formData.password ||
			!formData.phone ||
			!formData.employeeType
		) {
			toast.error("جميع الحقول مطلوبة");
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			toast.error("البريد الإلكتروني غير صحيح");
			return;
		}

		// Password validation (minimum 6 characters)
		if (formData.password.length < 6) {
			toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
			return;
		}

		// Phone validation
		const phoneRegex = /^[0-9]{11}$/;
		if (!phoneRegex.test(formData.phone)) {
			toast.error("رقم الهاتف يجب أن يكون 11 رقم");
			return;
		}

		try {
			setLoading(true);
			const token = localStorage.getItem("token");

			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/users`,
				{
					...formData,
					type: "employee",
					permissions: selectedPermissions,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("تم إضافة الموظف بنجاح");

			// Call the callback to refresh the employee list
			if (onEmployeeAdded) {
				onEmployeeAdded();
			}

			onClose();
		} catch (error) {
			console.error("Error adding employee:", error);
			const errorMessage =
				error.response?.data?.message || "حدث خطأ أثناء إضافة الموظف";
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
			<div className="bg-white rounded-xl shadow-lg w-[90%] max-w-5xl p-10 relative">
				{/* Close Button */}
				<button onClick={onClose} className="absolute top-4 left-4">
					<img
						src={close}
						alt="close icon"
						className="w-6 h-6 cursor-pointer"
					/>
				</button>

				<div className="flex gap-10">
					{/* ---------------- RIGHT EMPLOYEE CARD ---------------- */}
					<div className="w-[320px] flex flex-col items-center text-center">
						<div className="w-52 h-52 bg-[#FFFFFF] rounded-full flex justify-center items-center overflow-hidden">
							<img
								src={userPic}
								alt="employee"
								className="w-full h-full object-cover"
							/>
						</div>

						<h3 className="mt-6 text-xl font-semibold">
							{formData.fullname || "اسم الموظف"}
						</h3>
						<p className="text-gray-500">
							{formData.username || "اسم المستخدم"}
						</p>
					</div>

					{/* ---------------- LEFT FORM SECTION ---------------- */}
					<form onSubmit={handleSubmit} className="flex-1">
						{/* Row 1 */}
						<div className="flex gap-5 mb-6">
							<input
								type="text"
								name="fullname"
								value={formData.fullname}
								onChange={handleInputChange}
								placeholder="اسم الموظف"
								className="w-1/2 bg-white border rounded-2xl py-3 px-4 text-right shadow-xl
                focus:border-[#690000] focus:outline-none focus:ring-0"
								required
							/>

							<input
								type="text"
								name="username"
								value={formData.username}
								onChange={handleInputChange}
								placeholder="اسم المستخدم"
								className="w-1/2 bg-white border rounded-2xl py-3 px-4 text-right shadow-xl
                focus:border-[#690000] focus:outline-none focus:ring-0"
								required
							/>
						</div>

						{/* Row 2 */}
						<div className="flex gap-5 mb-6">
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								placeholder="البريد الإلكتروني"
								className="w-1/2 bg-white border rounded-2xl py-3 px-4 text-right shadow-xl
                focus:border-[#690000] focus:outline-none focus:ring-0"
								required
							/>

							<input
								type="password"
								name="password"
								value={formData.password}
								onChange={handleInputChange}
								placeholder="كلمة المرور (6 أحرف على الأقل)"
								className="w-1/2 bg-white border rounded-2xl py-3 px-4 text-right shadow-xl
                focus:border-[#690000] focus:outline-none focus:ring-0"
								minLength={6}
								required
							/>
						</div>

						{/* Row 3 */}
						<div className="flex gap-5 mb-6">
							<input
								type="tel"
								name="phone"
								value={formData.phone}
								onChange={handleInputChange}
								placeholder="رقم الهاتف (11 رقم)"
								className="w-1/2 bg-white border rounded-2xl py-3 px-4 text-right shadow-xl
                focus:border-[#690000] focus:outline-none focus:ring-0"
								pattern="[0-9]{11}"
								maxLength={11}
								required
							/>

							<div className="relative w-1/2">
								<select
									name="employeeType"
									value={formData.employeeType}
									onChange={handleInputChange}
									className="w-full bg-white border rounded-2xl py-3 px-4 text-right shadow-xl appearance-none
                  focus:border-[#690000] focus:outline-none focus:ring-0"
									required
								>
									<option value="">اختر المسمى الوظيفي</option>
									{employeeTypes.map((type, idx) => (
										<option key={idx} value={type.value}>
											{type.label}
										</option>
									))}
								</select>
								<img
									src={DropDown}
									alt="dropdown"
									className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
								/>
							</div>
						</div>

						{/* Permissions Dropdown */}
						<div className="relative mb-4">
							<select
								onChange={handleAddPermission}
								className="w-full bg-white border rounded-2xl py-3 px-4 text-right shadow-xl appearance-none
                focus:border-[#690000] focus:outline-none focus:ring-0"
							>
								<option value="">اختر صلاحية</option>
								{permissionsList.map((p, idx) => (
									<option key={idx} value={p}>
										{p}
									</option>
								))}
							</select>

							{/* Dropdown icon */}
							<img
								src={DropDown}
								alt="dropdown"
								className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
							/>
						</div>

						{/* Selected permissions as tags */}
						<div className="flex flex-wrap gap-4 mb-6">
							{selectedPermissions.map((perm, index) => (
								<div
									key={index}
									className="flex items-center gap-3 bg-red-200 text-red-900 px-4 py-2 rounded-xl"
								>
									<span>{perm}</span>
									<button onClick={() => removePermission(perm)}>
										<img src={close} className="w-4 h-4 cursor-pointer" />
									</button>
								</div>
							))}
						</div>

						{/* Confirm Button */}
						<div className="flex justify-between items-center mt-8">
							<button
								type="submit"
								disabled={loading}
								className={`bg-[#1BA3B6] text-white px-8 py-2 rounded-lg flex items-center gap-2 ${
									loading
										? "opacity-50 cursor-not-allowed"
										: "hover:bg-[#158a9a]"
								}`}
							>
								{loading ? "جاري الإضافة..." : "تأكيد"}
								<img
									src={Prod}
									alt="confirm icon"
									className="w-5 h-5 object-contain"
								/>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
