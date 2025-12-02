import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import close from "../assets/images/close(1).png";
import userPic from "../assets/images/AVATAR.png";

export default function EmployeeDetailsModal({
	employeeId,
	onClose,
	onUpdate,
}) {
	const [employee, setEmployee] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		fullname: "",
		username: "",
		email: "",
		phone: "",
		employeeType: "",
		active: true,
	});

	const token = localStorage.getItem("token");

	const employeeTypes = [
		{ value: "System Admin", label: "مدير النظام" },
		{ value: "Department Manager", label: "مدير قسم" },
		{ value: "Certified Employee", label: "موظف معتمد" },
		{ value: "Regular Employee", label: "موظف عادي" },
	];

	const getEmployeeTypeLabel = (type) => {
		const labels = {
			"Regular Employee": "موظف عادي",
			"Certified Employee": "موظف معتمد",
			"Department Manager": "مدير قسم",
			"System Admin": "مدير النظام",
		};
		return labels[type] || type;
	};

	useEffect(() => {
		fetchEmployeeDetails();
	}, [employeeId]);

	const fetchEmployeeDetails = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/users`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			const emp = response.data.find((user) => user._id === employeeId);
			if (emp) {
				setEmployee(emp);
				setFormData({
					fullname: emp.fullname,
					username: emp.username,
					email: emp.email,
					phone: emp.phone,
					employeeType: emp.employeeDetails?.employeeType || "Regular Employee",
					active: emp.active,
				});
			}
			setLoading(false);
		} catch (error) {
			console.error("Error fetching employee details:", error);
			toast.error("فشل تحميل بيانات الموظف");
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSave = async () => {
		try {
			const updateData = {
				fullname: formData.fullname,
				username: formData.username,
				email: formData.email,
				phone: formData.phone,
				type: "employee",
				employeeType: formData.employeeType,
				active: formData.active,
				// Explicitly clear clientDetails for employees
				clientType: null,
			};

			console.log("Updating employee with data:", updateData);

			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/users/${employeeId}`,
				updateData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			console.log("Update response:", response.data);
			toast.success("تم تحديث بيانات الموظف بنجاح");
			setIsEditing(false);
			if (onUpdate) {
				onUpdate();
			}
			fetchEmployeeDetails();
		} catch (error) {
			console.error("Error updating employee:", error);
			console.error("Error response:", error.response?.data);
			toast.error(error.response?.data?.message || "فشل تحديث بيانات الموظف");
		}
	};

	if (loading) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
				<div className="bg-white rounded-xl shadow-lg w-[90%] max-w-4xl p-10">
					<div className="flex justify-center items-center py-12">
						<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
						<span className="text-gray-600 text-lg mr-4">جاري التحميل...</span>
					</div>
				</div>
			</div>
		);
	}

	if (!employee) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
				<div className="bg-white rounded-xl shadow-lg w-[90%] max-w-4xl p-10">
					<button onClick={onClose} className="absolute top-4 left-4">
						<img
							src={close}
							alt="close icon"
							className="w-6 h-6 cursor-pointer"
						/>
					</button>
					<p className="text-center text-gray-500">لم يتم العثور على الموظف</p>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 overflow-y-auto">
			<div className="bg-white rounded-xl shadow-lg w-[90%] max-w-5xl p-10 relative my-8">
				{/* Close Button */}
				<button onClick={onClose} className="absolute top-4 left-4">
					<img
						src={close}
						alt="close icon"
						className="w-6 h-6 cursor-pointer"
					/>
				</button>

				<div className="flex gap-10">
					{/* Right Side - Employee Card */}
					<div className="w-[320px] flex flex-col items-center text-center">
						<div className="w-52 h-52 bg-gray-100 rounded-full flex justify-center items-center overflow-hidden">
							<img
								src={userPic}
								alt="employee"
								className="w-full h-full object-cover"
							/>
						</div>

						<h3 className="mt-6 text-2xl font-bold text-gray-800">
							{employee.fullname}
						</h3>
						<p className="text-gray-500 text-sm mb-2">{employee.username}</p>

						<div className="mt-4 space-y-2 w-full">
							<div
								className={`px-4 py-2 rounded-lg text-sm font-semibold ${
									employee.active
										? "bg-green-100 text-green-800"
										: "bg-red-100 text-red-800"
								}`}
							>
								{employee.active ? "نشط" : "غير نشط"}
							</div>

							<div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold">
								{getEmployeeTypeLabel(employee.employeeDetails?.employeeType)}
							</div>

							{employee.employeeDetails?.verified && (
								<div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-sm font-semibold">
									✓ موظف معتمد
								</div>
							)}
						</div>

						<div className="mt-6 text-right w-full space-y-1 text-sm text-gray-600">
							<p>
								<span className="font-semibold">تاريخ الإنضمام:</span>{" "}
								{new Date(employee.createdAt).toLocaleDateString("ar-EG")}
							</p>
							<p>
								<span className="font-semibold">آخر تحديث:</span>{" "}
								{new Date(employee.updatedAt).toLocaleDateString("ar-EG")}
							</p>
						</div>
					</div>

					{/* Left Side - Details */}
					<div className="flex-1">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold text-gray-800">
								تفاصيل الموظف
							</h2>
							{!isEditing ? (
								<button
									onClick={() => setIsEditing(true)}
									className="bg-[#1BA3B6] text-white px-6 py-2 rounded-lg hover:bg-[#158a9a]"
								>
									✏️ تعديل
								</button>
							) : (
								<div className="flex gap-2">
									<button
										onClick={handleSave}
										className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
									>
										💾 حفظ
									</button>
									<button
										onClick={() => {
											setIsEditing(false);
											setFormData({
												fullname: employee.fullname,
												username: employee.username,
												email: employee.email,
												phone: employee.phone,
												employeeType:
													employee.employeeDetails?.employeeType ||
													"Regular Employee",
												active: employee.active,
											});
										}}
										className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
									>
										✖️ إلغاء
									</button>
								</div>
							)}
						</div>

						{/* Information Grid */}
						<div className="space-y-4">
							{/* Fullname */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									الاسم الكامل:
								</label>
								{isEditing ? (
									<input
										type="text"
										name="fullname"
										value={formData.fullname}
										onChange={handleInputChange}
										className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
									/>
								) : (
									<p className="flex-1 text-right text-gray-600">
										{employee.fullname}
									</p>
								)}
							</div>

							{/* Username */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									اسم المستخدم:
								</label>
								{isEditing ? (
									<input
										type="text"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
									/>
								) : (
									<p className="flex-1 text-right text-gray-600">
										{employee.username}
									</p>
								)}
							</div>

							{/* Email */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									البريد الإلكتروني:
								</label>
								{isEditing ? (
									<input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
									/>
								) : (
									<p className="flex-1 text-right text-gray-600">
										{employee.email}
									</p>
								)}
							</div>

							{/* Phone */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									رقم الهاتف:
								</label>
								{isEditing ? (
									<input
										type="tel"
										name="phone"
										value={formData.phone}
										onChange={handleInputChange}
										className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
									/>
								) : (
									<p className="flex-1 text-right text-gray-600">
										{employee.phone}
									</p>
								)}
							</div>

							{/* Employee Type */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									نوع الموظف:
								</label>
								{isEditing ? (
									<select
										name="employeeType"
										value={formData.employeeType}
										onChange={handleInputChange}
										className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
									>
										{employeeTypes.map((type) => (
											<option key={type.value} value={type.value}>
												{type.label}
											</option>
										))}
									</select>
								) : (
									<p className="flex-1 text-right text-gray-600">
										{getEmployeeTypeLabel(
											employee.employeeDetails?.employeeType
										)}
									</p>
								)}
							</div>

							{/* Active Status */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									الحالة:
								</label>
								{isEditing ? (
									<select
										name="active"
										value={formData.active}
										onChange={(e) =>
											setFormData({
												...formData,
												active: e.target.value === "true",
											})
										}
										className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
									>
										<option value="true">نشط</option>
										<option value="false">غير نشط</option>
									</select>
								) : (
									<p className="flex-1 text-right text-gray-600">
										{employee.active ? "نشط" : "غير نشط"}
									</p>
								)}
							</div>

							{/* Verified Status */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									التحقق:
								</label>
								<p className="flex-1 text-right text-gray-600">
									{employee.employeeDetails?.verified ? "معتمد ✓" : "غير معتمد"}
								</p>
							</div>

							{/* User ID */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									معرف المستخدم:
								</label>
								<p className="flex-1 text-right text-gray-600 text-sm font-mono">
									{employee._id}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
