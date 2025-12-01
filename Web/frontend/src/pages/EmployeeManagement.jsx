import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import bannerPic from "../assets/images/Untitled design (8) 2.png";
import searchIcon from "../assets/images/search.svg";
import AddEmployeePopUp from "../pages/AddEmployeePopUp";
import EmployeeDetailsModal from "../components/EmployeeDetailsModal";

export default function EmployeeManagement() {
	const [employees, setEmployees] = useState([]);
	const [search, setSearch] = useState("");
	const [showPopup, setShowPopup] = useState(false);
	const [loading, setLoading] = useState(true);
	const [selectedEmployee, setSelectedEmployee] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	const user = JSON.parse(localStorage.getItem("user"));
	const adminName = user?.fullname || user?.username || "المدير";
	const token = localStorage.getItem("token");

	const fetchEmployees = async () => {
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

			// Filter only employees
			const employeeData = response.data
				.filter((user) => user.type === "employee")
				.map((emp) => ({
					id: emp._id,
					name: emp.fullname,
					username: emp.username,
					email: emp.email,
					phone: emp.phone,
					status: emp.active ? "نشط" : "غير نشط",
					employeeType: emp.employeeDetails?.employeeType || "Regular Employee",
					verified: emp.employeeDetails?.verified || false,
					createdAt: emp.createdAt,
				}));

			setEmployees(employeeData);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching employees:", error);
			toast.error("فشل تحميل بيانات الموظفين");
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchEmployees();
	}, []);

	// Filter employees by search text (name, username, email)
	const filteredEmployees = employees.filter(
		(emp) =>
			emp.name.toLowerCase().includes(search.toLowerCase()) ||
			emp.username.toLowerCase().includes(search.toLowerCase()) ||
			emp.email.toLowerCase().includes(search.toLowerCase())
	);

	const handleToggleStatus = async (employeeId, currentStatus) => {
		try {
			const newStatus = currentStatus === "نشط" ? false : true;
			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/users/${employeeId}`,
				{ active: newStatus },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success(`تم ${newStatus ? "تفعيل" : "تعطيل"} الموظف بنجاح`);
			fetchEmployees();
		} catch (error) {
			console.error("Error updating employee status:", error);
			toast.error("فشل تحديث حالة الموظف");
		}
	};

	const handleDeleteEmployee = async (employeeId) => {
		if (!window.confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
			return;
		}

		try {
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/users/${employeeId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("تم حذف الموظف بنجاح");
			fetchEmployees();
		} catch (error) {
			console.error("Error deleting employee:", error);
			toast.error("فشل حذف الموظف");
		}
	};

	const getEmployeeTypeLabel = (type) => {
		const labels = {
			"Regular Employee": "موظف عادي",
			"Certified Employee": "موظف معتمد",
			"Department Manager": "مدير قسم",
			"System Admin": "مدير النظام",
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

			{/* Banner */}
			<div className="flex justify-center mb-10">
				<img
					src={bannerPic}
					alt="admin illustration"
					className="w-[350px] md:w-[450px] lg:w-[550px] object-contain"
				/>
			</div>

			{/* Section Title and Stats */}
			<div className="flex justify-between items-center px-16 mb-6">
				<div className="text-right">
					<h2 className="text-4xl font-bold text-[#690000]">الموظفين</h2>
					<p className="text-gray-600 mt-2">
						إجمالي الموظفين: {employees.length} | نشط:{" "}
						{employees.filter((e) => e.status === "نشط").length}
					</p>
				</div>
			</div>

			{/* Search Bar */}
			<div className="flex justify-center mb-8">
				<div className="relative w-full max-w-xl">
					<input
						type="text"
						placeholder="البحث بالكود / اسم الموظف"
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

			{/* Employees Table */}
			{loading ? (
				<div className="flex justify-center items-center py-12">
					<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
					<span className="text-gray-600 text-lg mr-4">
						جاري تحميل الموظفين...
					</span>
				</div>
			) : (
				<div className="overflow-x-auto px-8">
					<table className="w-full text-center border-collapse bg-white rounded-lg shadow">
						<thead>
							<tr className="border-b bg-gradient-to-r from-red-800 to-red-900 text-white">
								<th className="py-4 px-4">#</th>
								<th className="py-4 px-4">اسم الموظف</th>
								<th className="py-4 px-4">اسم المستخدم</th>
								<th className="py-4 px-4">نوع الموظف</th>
								<th className="py-4 px-4">الحالة</th>
								<th className="py-4 px-4">البريد الإلكتروني</th>
								<th className="py-4 px-4">الهاتف</th>
								<th className="py-4 px-4">الإجراءات</th>
							</tr>
						</thead>

						<tbody>
							{filteredEmployees.length === 0 ? (
								<tr>
									<td colSpan="8" className="py-8 text-gray-500">
										{search ? "لا يوجد موظفون مطابقون لبحثك" : "لا يوجد موظفون"}
									</td>
								</tr>
							) : (
								filteredEmployees.map((emp, index) => (
									<tr
										key={emp.id}
										className="border-b text-gray-700 hover:bg-gray-50"
									>
										<td className="py-4 px-4 font-semibold text-gray-500">
											{index + 1}
										</td>
										<td className="py-4 px-4 font-semibold">{emp.name}</td>
										<td className="py-4 px-4">{emp.username}</td>
										<td className="py-4 px-4">
											<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
												{getEmployeeTypeLabel(emp.employeeType)}
											</span>
										</td>
										<td className="py-4 px-4">
											<span
												className={`px-3 py-1 rounded-full text-xs font-semibold ${
													emp.status === "نشط"
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
												}`}
											>
												{emp.status}
											</span>
										</td>
										<td className="py-4 px-4">{emp.email}</td>
										<td className="py-4 px-4">{emp.phone}</td>
										<td className="py-4 px-4">
											<div className="flex gap-2 justify-center flex-wrap">
												<button
													onClick={() => {
														setSelectedEmployee(emp.id);
														setShowDetailsModal(true);
													}}
													className="bg-[#1BA3B6] text-white px-3 py-1 rounded text-xs font-semibold hover:bg-[#158a9a]"
													title="عرض التفاصيل"
												>
													👁️ عرض
												</button>
												<button
													onClick={() => handleToggleStatus(emp.id, emp.status)}
													className={`px-3 py-1 rounded text-xs font-semibold ${
														emp.status === "نشط"
															? "bg-yellow-500 text-white hover:bg-yellow-600"
															: "bg-green-500 text-white hover:bg-green-600"
													}`}
													title={emp.status === "نشط" ? "تعطيل" : "تفعيل"}
												>
													{emp.status === "نشط" ? "تعطيل" : "تفعيل"}
												</button>
												<button
													onClick={() => handleDeleteEmployee(emp.id)}
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

			{/* Add Employee Button */}
			<div className="flex justify-center mt-10">
				<button
					onClick={() => setShowPopup(true)}
					className="bg-[#1BA3B6] text-white px-6 py-3 rounded-md flex items-center gap-2 hover:opacity-90"
				>
					+ إضافة موظف جديد
				</button>
			</div>
			{showPopup && (
				<AddEmployeePopUp
					onClose={() => setShowPopup(false)}
					onEmployeeAdded={fetchEmployees}
				/>
			)}
			{showDetailsModal && selectedEmployee && (
				<EmployeeDetailsModal
					employeeId={selectedEmployee}
					onClose={() => {
						setShowDetailsModal(false);
						setSelectedEmployee(null);
					}}
					onUpdate={fetchEmployees}
				/>
			)}
			<div className="mt-16">
				<Footer />
			</div>
		</div>
	);
}
