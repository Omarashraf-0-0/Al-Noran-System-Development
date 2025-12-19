import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import close from "../assets/images/close(1).png";
import userPic from "../assets/images/AVATAR.png";

export default function CustomerDetailsModal({
	customerId,
	onClose,
	onUpdate,
}) {
	const [customer, setCustomer] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
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

	const getClientTypeLabel = (type) => {
		const labels = {
			commercial: "تجاري",
			factory: "مصنع",
			personal: "شخصي",
		};
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
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
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
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("تم تحديث بيانات العميل بنجاح");
			setIsEditing(false);
			if (onUpdate) {
				onUpdate();
			}
			fetchCustomerDetails();
		} catch (error) {
			console.error("Error updating customer:", error);
			toast.error("فشل تحديث بيانات العميل");
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

	if (!customer) {
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
					<p className="text-center text-gray-500">لم يتم العثور على العميل</p>
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
					{/* Right Side - Customer Card */}
					<div className="w-[320px] flex flex-col items-center text-center">
						<div className="w-52 h-52 bg-gray-100 rounded-full flex justify-center items-center overflow-hidden">
							<img
								src={userPic}
								alt="customer"
								className="w-full h-full object-cover"
							/>
						</div>

						<h3 className="mt-6 text-2xl font-bold text-gray-800">
							{customer.fullname}
						</h3>
						<p className="text-gray-500 text-sm mb-2">{customer.username}</p>

						<div className="mt-4 space-y-2 w-full">
							<div
								className={`px-4 py-2 rounded-lg text-sm font-semibold ${
									customer.active
										? "bg-green-100 text-green-800"
										: "bg-red-100 text-red-800"
								}`}
							>
								{customer.active ? "نشط" : "غير نشط"}
							</div>

							<div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold">
								{getClientTypeLabel(customer.clientDetails?.clientType)}
							</div>

							{customer.rank && (
								<div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-sm font-semibold">
									⭐ رتبة {customer.rank}
								</div>
							)}
						</div>

						<div className="mt-6 text-right w-full space-y-1 text-sm text-gray-600">
							<p>
								<span className="font-semibold">تاريخ التسجيل:</span>{" "}
								{new Date(customer.createdAt).toLocaleDateString("ar-EG")}
							</p>
							<p>
								<span className="font-semibold">آخر تحديث:</span>{" "}
								{new Date(customer.updatedAt).toLocaleDateString("ar-EG")}
							</p>
						</div>
					</div>

					{/* Left Side - Details */}
					<div className="flex-1">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold text-gray-800">
								تفاصيل العميل
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
												fullname: customer.fullname,
												username: customer.username,
												email: customer.email,
												phone: customer.phone,
												clientType:
													customer.clientDetails?.clientType || "commercial",
												ssn: customer.clientDetails?.ssn || "",
												taxNumber: customer.taxNumber || "",
												rank: customer.rank || "",
												active: customer.active,
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
										{customer.fullname}
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
										{customer.username}
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
										{customer.email}
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
										{customer.phone}
									</p>
								)}
							</div>

							{/* Client Type */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									نوع العميل:
								</label>
								{isEditing ? (
									<select
										name="clientType"
										value={formData.clientType}
										onChange={handleInputChange}
										className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
									>
										{clientTypes.map((type) => (
											<option key={type.value} value={type.value}>
												{type.label}
											</option>
										))}
									</select>
								) : (
									<p className="flex-1 text-right text-gray-600">
										{getClientTypeLabel(customer.clientDetails?.clientType)}
									</p>
								)}
							</div>

							{/* SSN (for personal clients) */}
							{(formData.clientType === "personal" ||
								customer.clientDetails?.clientType === "personal") && (
								<div className="flex items-center gap-4">
									<label className="w-1/3 text-right font-semibold text-gray-700">
										الرقم القومي:
									</label>
									{isEditing ? (
										<input
											type="text"
											name="ssn"
											value={formData.ssn}
											onChange={handleInputChange}
											className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
										/>
									) : (
										<p className="flex-1 text-right text-gray-600">
											{customer.clientDetails?.ssn || "غير محدد"}
										</p>
									)}
								</div>
							)}

							{/* Tax Number */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									الرقم الضريبي:
								</label>
								{isEditing ? (
									<input
										type="text"
										name="taxNumber"
										value={formData.taxNumber}
										onChange={handleInputChange}
										className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
									/>
								) : (
									<p className="flex-1 text-right text-gray-600">
										{customer.taxNumber || "غير محدد"}
									</p>
								)}
							</div>

							{/* Rank */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									الرتبة:
								</label>
								{isEditing ? (
									<select
										name="rank"
										value={formData.rank}
										onChange={handleInputChange}
										className="flex-1 border rounded-lg py-2 px-4 text-right focus:border-[#690000] focus:outline-none bg-white text-gray-800"
									>
										<option value="">بدون رتبة</option>
										{ranks.map((rank) => (
											<option key={rank.value} value={rank.value}>
												{rank.label}
											</option>
										))}
									</select>
								) : (
									<p className="flex-1 text-right text-gray-600">
										{customer.rank ? `رتبة ${customer.rank}` : "بدون رتبة"}
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
										{customer.active ? "نشط" : "غير نشط"}
									</p>
								)}
							</div>

							{/* User ID */}
							<div className="flex items-center gap-4">
								<label className="w-1/3 text-right font-semibold text-gray-700">
									معرف المستخدم:
								</label>
								<p className="flex-1 text-right text-gray-600 text-sm font-mono">
									{customer._id}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
