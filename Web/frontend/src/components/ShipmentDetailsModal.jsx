import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import close from "../assets/images/close(1).png";

export default function ShipmentDetailsModal({ shipmentId, onClose, onUpdate }) {
	const [shipment, setShipment] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [employees, setEmployees] = useState([]);
	const [formData, setFormData] = useState({
		status: "",
		employee_id: "",
	});

	const token = localStorage.getItem("token");

	useEffect(() => {
		if (shipmentId) {
			fetchShipmentDetails();
			fetchEmployees();
		}
	}, [shipmentId]);

	const fetchEmployees = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/users/getAll`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			// Filter only employees
			const employeeList = response.data.filter((user) => user.type === "employee");
			setEmployees(employeeList);
		} catch (error) {
			console.error("Error fetching employees:", error);
			toast.error("فشل تحميل قائمة الموظفين");
		}
	};

	const fetchShipmentDetails = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			setShipment(response.data);
			setFormData({
				status: response.data.status || "",
				employee_id: response.data.employee_id?._id || response.data.employee_id || "",
			});
			setLoading(false);
		} catch (error) {
			console.error("Error fetching shipment details:", error);
			toast.error("فشل تحميل تفاصيل الشحنة");
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSave = async () => {
		try {
			const updateData = {
				status: formData.status,
				employee_id: formData.employee_id || null,
			};

			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/shipments/${shipment.acid}`,
				updateData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("تم تحديث الشحنة بنجاح");
			setIsEditing(false);
			fetchShipmentDetails();
			if (onUpdate) onUpdate();
		} catch (error) {
			console.error("Error updating shipment:", error);
			toast.error(error.response?.data?.message || "فشل تحديث الشحنة");
		}
	};

	const getStatusBadgeColor = (status) => {
		switch (status) {
			case "Completed":
			case "تمت بنجاح":
				return "bg-green-100 text-green-800";
			case "In Transit":
			case "في الطريق":
				return "bg-blue-100 text-blue-800";
			case "Arrived":
			case "Customs Clearance":
			case "جاري الكشف والتثمين":
			case "في انتظار وصول الإذن":
				return "bg-yellow-100 text-yellow-800";
			case "Pending":
			case "في انتظار الشحن":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg p-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
						<p className="mt-4 text-gray-600">جاري التحميل...</p>
					</div>
				</div>
			</div>
		);
	}

	if (!shipment) {
		return null;
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
					>
						<img src={close} alt="close" className="w-6 h-6" />
					</button>
					<h2 className="text-2xl font-bold text-[#690000]">تفاصيل الشحنة</h2>
				</div>

				{/* Content */}
				<div className="p-6">
					{/* Shipment Card */}
					<div className="bg-gray-50 rounded-lg p-6 mb-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* ACID */}
							<div>
								<p className="text-sm text-gray-500 mb-1">رقم ACID</p>
								<p className="font-semibold text-gray-900">{shipment.acid}</p>
							</div>

							{/* Status */}
							<div>
								<p className="text-sm text-gray-500 mb-1">الحالة</p>
								<span
									className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
										shipment.status
									)}`}
								>
									{shipment.status}
								</span>
							</div>

							{/* Port */}
							<div>
								<p className="text-sm text-gray-500 mb-1">الميناء</p>
								<p className="font-semibold text-gray-900">{shipment.port_name}</p>
							</div>

							{/* Country */}
							<div>
								<p className="text-sm text-gray-500 mb-1">الدولة</p>
								<p className="font-semibold text-gray-900">{shipment.country}</p>
							</div>

							{/* Number of Containers */}
							<div>
								<p className="text-sm text-gray-500 mb-1">عدد الحاويات</p>
								<p className="font-semibold text-gray-900">{shipment.num_of_containers}</p>
							</div>

							{/* Container Types */}
							{shipment.type_of_containers && shipment.type_of_containers.length > 0 && (
								<div>
									<p className="text-sm text-gray-500 mb-1">أنواع الحاويات</p>
									<p className="font-semibold text-gray-900">
										{shipment.type_of_containers.join(", ")}
									</p>
								</div>
							)}

							{/* Client Info */}
							{shipment.user_id && (
								<>
									<div>
										<p className="text-sm text-gray-500 mb-1">اسم العميل</p>
										<p className="font-semibold text-gray-900">
											{shipment.user_id.username || shipment.user_id.fullname || "غير متاح"}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-500 mb-1">البريد الإلكتروني</p>
										<p className="font-semibold text-gray-900">
											{shipment.user_id.email || "غير متاح"}
										</p>
									</div>
								</>
							)}

							{/* Assigned Employee */}
							<div>
								<p className="text-sm text-gray-500 mb-1">الموظف المسؤول</p>
								<p className="font-semibold text-gray-900">
									{shipment.employee_id?.username || shipment.employee_id?.fullname || "لم يعين بعد"}
								</p>
							</div>

							{/* Created Date */}
							<div>
								<p className="text-sm text-gray-500 mb-1">تاريخ الإنشاء</p>
								<p className="font-semibold text-gray-900">
									{new Date(shipment.createdAt).toLocaleDateString("ar-EG")}
								</p>
							</div>
						</div>
					</div>

					{/* Financial Details */}
					{(shipment.clearance_fees || shipment.expenses_and_tips || shipment.sundries) && (
						<div className="mb-6">
							<h3 className="text-lg font-bold text-[#690000] mb-3">
								التفاصيل المالية
							</h3>
							<div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
								{shipment.clearance_fees > 0 && (
									<div>
										<p className="text-sm text-gray-500 mb-1">رسوم التخليص</p>
										<p className="font-semibold text-gray-900">
											{shipment.clearance_fees} جنيه
										</p>
									</div>
								)}
								{shipment.expenses_and_tips > 0 && (
									<div>
										<p className="text-sm text-gray-500 mb-1">المصروفات والإكراميات</p>
										<p className="font-semibold text-gray-900">
											{shipment.expenses_and_tips} جنيه
										</p>
									</div>
								)}
								{shipment.sundries > 0 && (
									<div>
										<p className="text-sm text-gray-500 mb-1">مصروفات متنوعة</p>
										<p className="font-semibold text-gray-900">
											{shipment.sundries} جنيه
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Additional Info */}
					<div className="mb-6">
						<h3 className="text-lg font-bold text-[#690000] mb-3">
							معلومات إضافية
						</h3>
						<div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
							{shipment.policy && (
								<div>
									<p className="text-sm text-gray-500 mb-1">السياسة</p>
									<p className="font-semibold text-gray-900">{shipment.policy}</p>
								</div>
							)}
							<div>
								<p className="text-sm text-gray-500 mb-1">حالة المسودة</p>
								<span
									className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
										shipment.dragt
											? "bg-yellow-100 text-yellow-800"
											: "bg-green-100 text-green-800"
									}`}
								>
									{shipment.dragt ? "مسودة" : "نهائي"}
								</span>
							</div>
						</div>
					</div>

					{/* Edit Form */}
					{isEditing ? (
						<div className="border-t pt-6">
							<h3 className="text-lg font-bold text-[#690000] mb-4">
								تعديل بيانات الشحنة
							</h3>
							<div className="space-y-4">
								{/* Status */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2 text-right">
										الحالة
									</label>
									<select
										name="status"
										value={formData.status}
										onChange={handleInputChange}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:ring-2 focus:ring-red-800 focus:border-transparent"
									>
										<option value="Pending">قيد الانتظار</option>
										<option value="في انتظار الشحن">في انتظار الشحن</option>
										<option value="In Transit">في الطريق</option>
										<option value="Arrived">وصلت</option>
										<option value="في انتظار وصول الإذن">في انتظار وصول الإذن</option>
										<option value="Customs Clearance">التخليص الجمركي</option>
										<option value="جاري الكشف والتثمين">جاري الكشف والتثمين</option>
										<option value="Completed">مكتملة</option>
										<option value="تمت بنجاح">تمت بنجاح</option>
									</select>
								</div>

								{/* Assigned Employee */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2 text-right">
										الموظف المسؤول
									</label>
									<select
										name="employee_id"
										value={formData.employee_id}
										onChange={handleInputChange}
										className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:ring-2 focus:ring-red-800 focus:border-transparent"
									>
										<option value="">-- لم يعين بعد --</option>
										{employees.map((emp) => (
											<option key={emp._id} value={emp._id}>
												{emp.fullname || emp.username} ({emp.email})
											</option>
										))}
									</select>
								</div>

								{/* Buttons */}
								<div className="flex gap-3 justify-end">
									<button
										onClick={() => setIsEditing(false)}
										className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
									>
										إلغاء
									</button>
									<button
										onClick={handleSave}
										className="px-6 py-2 bg-[#690000] text-white rounded-lg hover:bg-[#991b1b] transition-colors"
									>
										حفظ التعديلات
									</button>
								</div>
							</div>
						</div>
					) : (
						<div className="flex justify-end">
							<button
								onClick={() => setIsEditing(true)}
								className="px-6 py-2 bg-[#690000] text-white rounded-lg hover:bg-[#991b1b] transition-colors"
							>
								تعديل البيانات
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
