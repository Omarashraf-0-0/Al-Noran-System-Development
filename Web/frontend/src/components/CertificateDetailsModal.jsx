import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import close from "../assets/images/close(1).png";

export default function CertificateDetailsModal({
	certificateId,
	onClose,
	onUpdate,
}) {
	const [certificate, setCertificate] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [employees, setEmployees] = useState([]);
	const [formData, setFormData] = useState({
		status: "",
		acidCode: "",
		reviewingBy: "",
	});

	const token = localStorage.getItem("token");

	useEffect(() => {
		if (certificateId) {
			fetchCertificateDetails();
			fetchEmployees();
		}
	}, [certificateId]);

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
			const employeeList = response.data.filter(
				(user) => user.type === "employee"
			);
			setEmployees(employeeList);
		} catch (error) {
			console.error("Error fetching employees:", error);
			toast.error("فشل تحميل قائمة الموظفين");
		}
	};

	const fetchCertificateDetails = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/acid/${certificateId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			setCertificate(response.data);
			setFormData({
				status: response.data.status || "",
				acidCode: response.data.acidCode || "",
				reviewingBy: response.data.reviewingBy?._id || "",
			});
			setLoading(false);
		} catch (error) {
			console.error("Error fetching certificate details:", error);
			toast.error("فشل تحميل تفاصيل الشهادة");
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
				acidCode: formData.acidCode,
				reviewingBy: formData.reviewingBy || null,
			};

			await axios.patch(
				`${
					import.meta.env.VITE_API_URL
				}/api/acid/employee/${certificateId}/status`,
				updateData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("تم تحديث الشهادة بنجاح");
			setIsEditing(false);
			fetchCertificateDetails();
			if (onUpdate) onUpdate();
		} catch (error) {
			console.error("Error updating certificate:", error);
			toast.error(error.response?.data?.message || "فشل تحديث الشهادة");
		}
	};

	const getStatusBadgeColor = (status) => {
		switch (status) {
			case "ACID Issued":
				return "bg-green-100 text-green-800";
			case "Under Review":
				return "bg-yellow-100 text-yellow-800";
			case "Pending":
				return "bg-blue-100 text-blue-800";
			case "Rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusLabel = (status) => {
		switch (status) {
			case "ACID Issued":
				return "صدرت الشهادة";
			case "Under Review":
				return "قيد المراجعة";
			case "Pending":
				return "قيد الانتظار";
			case "Rejected":
				return "مرفوض";
			default:
				return status;
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

	if (!certificate) {
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
					<h2 className="text-2xl font-bold text-[#690000]">تفاصيل الشهادة</h2>
				</div>

				{/* Content */}
				<div className="p-6">
					{/* Certificate Card */}
					<div className="bg-gray-50 rounded-lg p-6 mb-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Request ID */}
							<div>
								<p className="text-sm text-gray-500 mb-1">رقم الطلب</p>
								<p className="font-semibold text-gray-900">{certificate._id}</p>
							</div>

							{/* Status */}
							<div>
								<p className="text-sm text-gray-500 mb-1">الحالة</p>
								<span
									className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
										certificate.status
									)}`}
								>
									{getStatusLabel(certificate.status)}
								</span>
							</div>

							{/* ACID Code */}
							<div>
								<p className="text-sm text-gray-500 mb-1">كود ACID</p>
								<p className="font-semibold text-gray-900">
									{certificate.acidCode || "لم يصدر بعد"}
								</p>
							</div>

							{/* Request Date */}
							<div>
								<p className="text-sm text-gray-500 mb-1">تاريخ الطلب</p>
								<p className="font-semibold text-gray-900">
									{new Date(certificate.requestDate).toLocaleDateString(
										"ar-EG"
									)}
								</p>
							</div>

							{/* Client Info */}
							{certificate.userId && (
								<>
									<div>
										<p className="text-sm text-gray-500 mb-1">اسم العميل</p>
										<p className="font-semibold text-gray-900">
											{certificate.userId.username || "غير متاح"}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-500 mb-1">
											البريد الإلكتروني
										</p>
										<p className="font-semibold text-gray-900">
											{certificate.userId.email || "غير متاح"}
										</p>
									</div>
								</>
							)}

							{/* Reviewing Employee */}
							{certificate.reviewingBy && (
								<div>
									<p className="text-sm text-gray-500 mb-1">الموظف المراجع</p>
									<p className="font-semibold text-gray-900">
										{certificate.reviewingBy.username || "غير متاح"}
									</p>
								</div>
							)}

							{/* Lock Status */}
							<div>
								<p className="text-sm text-gray-500 mb-1">حالة القفل</p>
								<span
									className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
										certificate.isLocked
											? "bg-red-100 text-red-800"
											: "bg-green-100 text-green-800"
									}`}
								>
									{certificate.isLocked ? "مقفل للمراجعة" : "غير مقفل"}
								</span>
							</div>
						</div>
					</div>

					{/* Supplier Information */}
					{certificate.supplier &&
						Object.keys(certificate.supplier).length > 0 && (
							<div className="mb-6">
								<h3 className="text-lg font-bold text-[#690000] mb-3">
									بيانات المورد
								</h3>
								<div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
									{certificate.supplier.name && (
										<div>
											<p className="text-sm text-gray-500 mb-1">اسم المورد</p>
											<p className="font-semibold text-gray-900">
												{certificate.supplier.name}
											</p>
										</div>
									)}
									{certificate.supplier.country && (
										<div>
											<p className="text-sm text-gray-500 mb-1">الدولة</p>
											<p className="font-semibold text-gray-900">
												{certificate.supplier.country}
											</p>
										</div>
									)}
									{certificate.supplier.taxNum && (
										<div>
											<p className="text-sm text-gray-500 mb-1">
												الرقم الضريبي
											</p>
											<p className="font-semibold text-gray-900">
												{certificate.supplier.taxNum}
											</p>
										</div>
									)}
									{certificate.supplier.email && (
										<div>
											<p className="text-sm text-gray-500 mb-1">
												البريد الإلكتروني
											</p>
											<p className="font-semibold text-gray-900">
												{certificate.supplier.email}
											</p>
										</div>
									)}
									{certificate.supplier.mobileNum && (
										<div>
											<p className="text-sm text-gray-500 mb-1">رقم الهاتف</p>
											<p className="font-semibold text-gray-900">
												{certificate.supplier.mobileNum}
											</p>
										</div>
									)}
								</div>
							</div>
						)}

					{/* Goods Information */}
					{certificate.goods && (
						<div className="mb-6">
							<h3 className="text-lg font-bold text-[#690000] mb-3">
								بيانات البضاعة
							</h3>
							<div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-500 mb-1">وصف البضاعة</p>
									<p className="font-semibold text-gray-900">
										{certificate.goods.description}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-500 mb-1">البند الجمركي</p>
									<p className="font-semibold text-gray-900">
										{certificate.goods.customsItem}
									</p>
								</div>
								{certificate.goods.weight && (
									<div>
										<p className="text-sm text-gray-500 mb-1">الوزن (كجم)</p>
										<p className="font-semibold text-gray-900">
											{certificate.goods.weight}
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Shipment Information */}
					{certificate.hasShipment && (
						<div className="mb-6">
							<h3 className="text-lg font-bold text-[#690000] mb-3">
								معلومات الشحنة
							</h3>
							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<p className="text-green-800 font-semibold">
									✓ تم إنشاء شحنة لهذا الطلب
								</p>
								{certificate.shipmentCreatedAt && (
									<p className="text-sm text-green-600 mt-2">
										تاريخ الإنشاء:{" "}
										{new Date(certificate.shipmentCreatedAt).toLocaleDateString(
											"ar-EG"
										)}
									</p>
								)}
							</div>
						</div>
					)}

					{/* Edit Form */}
					{isEditing ? (
						<div className="border-t pt-6">
							<h3 className="text-lg font-bold text-[#690000] mb-4">
								تعديل بيانات الشهادة
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
										<option value="Under Review">قيد المراجعة</option>
										<option value="ACID Issued">صدرت الشهادة</option>
										<option value="Rejected">مرفوض</option>
									</select>
								</div>

								{/* ACID Code */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2 text-right">
										كود ACID
									</label>
									<input
										type="text"
										name="acidCode"
										value={formData.acidCode}
										onChange={handleInputChange}
										placeholder="أدخل كود ACID"
										className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:ring-2 focus:ring-red-800 focus:border-transparent"
									/>
								</div>

								{/* Assigned Employee */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2 text-right">
										الموظف المسؤول
									</label>
									<select
										name="reviewingBy"
										value={formData.reviewingBy}
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
