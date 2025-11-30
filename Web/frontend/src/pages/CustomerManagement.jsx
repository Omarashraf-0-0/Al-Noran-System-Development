import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import CustomerDetailsModal from "../components/CustomerDetailsModal";
import bannerPic from "../assets/images/Untitled design (8) 2.png";
import searchIcon from "../assets/images/search.svg";

export default function CustomerUI() {
	const [customers, setCustomers] = useState([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [selectedCustomer, setSelectedCustomer] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	const user = JSON.parse(localStorage.getItem("user"));
	const adminName = user?.fullname || user?.username || "المدير";
	const token = localStorage.getItem("token");

	const fetchCustomers = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/users/getAll`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			// Filter only clients
			const customerData = response.data
				.filter((user) => user.type === "client")
				.map((cust) => ({
					id: cust._id,
					name: cust.fullname,
					username: cust.username,
					email: cust.email,
					phone: cust.phone,
					status: cust.active ? "نشط" : "غير نشط",
					clientType: cust.clientDetails?.clientType || "commercial",
					rank: cust.rank || "",
					taxNumber: cust.taxNumber || "",
					createdAt: cust.createdAt,
				}));

			setCustomers(customerData);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching customers:", error);
			toast.error("فشل تحميل بيانات العملاء");
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCustomers(); // load customers on page load
	}, []);

	// Filter customers by search text (name, username, email)
	const filteredCustomers = customers.filter(
		(cust) =>
			cust.name.toLowerCase().includes(search.toLowerCase()) ||
			cust.username.toLowerCase().includes(search.toLowerCase()) ||
			cust.email.toLowerCase().includes(search.toLowerCase())
	);

	const handleToggleStatus = async (customerId, currentStatus) => {
		try {
			const newStatus = currentStatus === "نشط" ? false : true;
			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/users/${customerId}`,
				{ active: newStatus },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success(`تم ${newStatus ? "تفعيل" : "تعطيل"} العميل بنجاح`);
			fetchCustomers();
		} catch (error) {
			console.error("Error updating customer status:", error);
			toast.error("فشل تحديث حالة العميل");
		}
	};

	const handleDeleteCustomer = async (customerId) => {
		if (!window.confirm("هل أنت متأكد من حذف هذا العميل؟")) {
			return;
		}

		try {
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/users/${customerId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("تم حذف العميل بنجاح");
			fetchCustomers();
		} catch (error) {
			console.error("Error deleting customer:", error);
			toast.error("فشل حذف العميل");
		}
	};

	const getClientTypeLabel = (type) => {
		const labels = {
			commercial: "تجاري",
			factory: "مصنع",
			personal: "شخصي",
		};
		return labels[type] || type;
	};

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
			<AdminHeader />

			{/* Welcome Message */}
			<h1 className="text-4xl font-bold text-[#690000] text-right mb-8 mt-8 px-16">
				مرحباً ، {adminName} !
			</h1>

			{/* Stats */}
			<div className="flex justify-end gap-6 px-16 mb-4">
				<div className="text-right">
					<span className="text-gray-600 text-lg">إجمالي العملاء: </span>
					<span className="text-[#690000] font-bold text-xl">
						{customers.length}
					</span>
				</div>
				<div className="text-right">
					<span className="text-gray-600 text-lg">العملاء النشطون: </span>
					<span className="text-green-600 font-bold text-xl">
						{customers.filter((c) => c.status === "نشط").length}
					</span>
				</div>
			</div>

			{/* Banner */}
			<div className="flex justify-center mb-10">
				<img
					src={bannerPic}
					alt="admin illustration"
					className="w-[350px] md:w-[450px] lg:w-[550px] object-contain"
				/>
			</div>

			{/* Section Title */}
			<h2 className="text-4xl font-bold text-[#690000] text-right my-8 px-16">
				العملاء
			</h2>

			{/* Search Bar */}
			<div className="flex justify-center mb-8">
				<div className="relative w-full max-w-xl">
					<input
						type="text"
						placeholder="البحث باسم العميل / اسم المستخدم / البريد الإلكتروني"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-600 rounded-full py-2 pr-4 pl-10 text-right focus:outline-none focus:ring-2 focus:ring-[#6B0F1A]"
					/>

					<img
						src={searchIcon}
						alt="search icon"
						className="absolute left-4 top-2.5 w-5 h-5 opacity-100"
					/>
				</div>
			</div>

			{/* Customers Table */}
			{loading ? (
				<div className="flex justify-center items-center py-12">
					<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
					<span className="text-gray-600 text-lg mr-4">
						جاري تحميل العملاء...
					</span>
				</div>
			) : (
				<div className="overflow-x-auto px-8">
					<table className="w-full text-center border-collapse bg-white rounded-lg shadow">
						<thead>
							<tr className="border-b bg-gradient-to-r from-red-800 to-red-900 text-white">
								<th className="py-4 px-4">#</th>
								<th className="py-4 px-4">اسم العميل</th>
								<th className="py-4 px-4">اسم المستخدم</th>
								<th className="py-4 px-4">نوع العميل</th>
								<th className="py-4 px-4">الحالة</th>
								<th className="py-4 px-4">البريد الإلكتروني</th>
								<th className="py-4 px-4">الهاتف</th>
								<th className="py-4 px-4">الإجراءات</th>
							</tr>
						</thead>

						<tbody>
							{filteredCustomers.length === 0 ? (
								<tr>
									<td colSpan="8" className="py-8 text-gray-500">
										{search ? "لا يوجد عملاء مطابقون لبحثك" : "لا يوجد عملاء"}
									</td>
								</tr>
							) : (
								filteredCustomers.map((cust, index) => (
									<tr
										key={cust.id}
										className="border-b text-gray-700 hover:bg-gray-50"
									>
										<td className="py-4 px-4 font-semibold text-gray-500">
											{index + 1}
										</td>
										<td className="py-4 px-4 font-semibold">{cust.name}</td>
										<td className="py-4 px-4">{cust.username}</td>
										<td className="py-4 px-4">
											<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
												{getClientTypeLabel(cust.clientType)}
											</span>
										</td>
										<td className="py-4 px-4">
											<span
												className={`px-3 py-1 rounded-full text-xs font-semibold ${
													cust.status === "نشط"
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
												}`}
											>
												{cust.status}
											</span>
										</td>
										<td className="py-4 px-4">{cust.email}</td>
										<td className="py-4 px-4">{cust.phone}</td>
										<td className="py-4 px-4">
											<div className="flex gap-2 justify-center flex-wrap">
												<button
													onClick={() => {
														setSelectedCustomer(cust.id);
														setShowDetailsModal(true);
													}}
													className="bg-[#1BA3B6] text-white px-3 py-1 rounded text-xs font-semibold hover:bg-[#158a9a]"
													title="عرض التفاصيل"
												>
													👁️ عرض
												</button>
												<button
													onClick={() =>
														handleToggleStatus(cust.id, cust.status)
													}
													className={`px-3 py-1 rounded text-xs font-semibold ${
														cust.status === "نشط"
															? "bg-yellow-500 text-white hover:bg-yellow-600"
															: "bg-green-500 text-white hover:bg-green-600"
													}`}
													title={cust.status === "نشط" ? "تعطيل" : "تفعيل"}
												>
													{cust.status === "نشط" ? "تعطيل" : "تفعيل"}
												</button>
												<button
													onClick={() => handleDeleteCustomer(cust.id)}
													className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700"
													title="حذف"
												>
													🗑️ حذف
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			)}

			{showDetailsModal && selectedCustomer && (
				<CustomerDetailsModal
					customerId={selectedCustomer}
					onClose={() => {
						setShowDetailsModal(false);
						setSelectedCustomer(null);
					}}
					onUpdate={fetchCustomers}
				/>
			)}

			<div className="mt-16">
				<Footer />
			</div>
		</div>
	);
}
