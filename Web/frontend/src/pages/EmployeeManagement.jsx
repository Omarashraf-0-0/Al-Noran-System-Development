import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import EmployeeStatistics from "../components/EmployeeStatistics";
import EmployeesTable from "../components/EmployeesTable";
import bannerPic from "../assets/images/Untitled design (8) 2.png";
import searchIcon from "../assets/images/search.svg";
import AddEmployeePopUp from "../pages/AddEmployeePopUp";
import EmployeeDetailsModal from "../components/EmployeeDetailsModal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function EmployeeManagement() {
	const [employees, setEmployees] = useState([]);
	const [search, setSearch] = useState("");
	const [showPopup, setShowPopup] = useState(false);
	const [loading, setLoading] = useState(true);
	const [selectedEmployee, setSelectedEmployee] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [employeeToDelete, setEmployeeToDelete] = useState(null);
	const [suspendModalOpen, setSuspendModalOpen] = useState(false);
	const [employeeToSuspend, setEmployeeToSuspend] = useState(null);
	const [suspensionReason, setSuspensionReason] = useState("");

	// TODO: RBAC - Get user permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canViewEmployees = hasPermission('employee:view');
	// const canAddEmployee = hasPermission('employee:add');
	// const canEditEmployee = hasPermission('employee:edit');
	// const canDeleteEmployee = hasPermission('employee:delete');

	const user = JSON.parse(localStorage.getItem("user"));
	const adminName = user?.fullname || user?.username || "المدير";
	const token = localStorage.getItem("token");

	const fetchEmployees = async () => {
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
					suspended: emp.employeeDetails?.suspended || false,
					suspensionReason: emp.employeeDetails?.suspensionReason,
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

	const handleDeleteEmployee = (employeeId) => {
		setEmployeeToDelete(employeeId);
		setDeleteModalOpen(true);
	};

	const handleSuspendEmployee = (employee) => {
		setEmployeeToSuspend(employee);
		setSuspensionReason("");
		setSuspendModalOpen(true);
	};

	const confirmSuspend = async () => {
		if (!employeeToSuspend) return;

		try {
			if (employeeToSuspend.suspended) {
				// Unsuspend employee
				await axios.patch(
					`${import.meta.env.VITE_API_URL}/api/users/${
						employeeToSuspend.id
					}/unsuspend`,
					{},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				toast.success("تم إعادة تفعيل الموظف بنجاح");
			} else {
				// Suspend employee
				if (!suspensionReason.trim()) {
					toast.error("الرجاء إدخال سبب الإيقاف");
					return;
				}
				await axios.patch(
					`${import.meta.env.VITE_API_URL}/api/users/${
						employeeToSuspend.id
					}/suspend`,
					{ reason: suspensionReason },
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				toast.success("تم إيقاف الموظف عن العمل بنجاح");
			}
			fetchEmployees();
		} catch (error) {
			console.error("Error updating employee suspension:", error);
			toast.error(error.response?.data?.message || "فشل تحديث حالة الإيقاف");
		} finally {
			setSuspendModalOpen(false);
			setEmployeeToSuspend(null);
			setSuspensionReason("");
		}
	};

	const confirmDelete = async () => {
		if (!employeeToDelete) return;

		try {
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/users/${employeeToDelete}`,
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
		} finally {
			setDeleteModalOpen(false);
			setEmployeeToDelete(null);
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
			{/* TODO: RBAC - Only show stats if user has permission */}
			<EmployeeStatistics employees={employees} />

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
			{/* TODO: RBAC - Only show table if user has permission */}
			{loading ? (
				<LoadingSpinner />
			) : (
				<EmployeesTable
					employees={filteredEmployees}
					onViewDetails={(id) => {
						setSelectedEmployee(id);
						setShowDetailsModal(true);
					}}
					onToggleStatus={handleToggleStatus}
					onDelete={handleDeleteEmployee}
					onSuspend={handleSuspendEmployee}
					getEmployeeTypeLabel={getEmployeeTypeLabel}
					emptyMessage={
						search ? "لا يوجد موظفون مطابقون لبحثك" : "لا يوجد موظفون"
					}
				/>
			)}

			{/* Add Employee Button */}
			{/* TODO: RBAC - Only show button if user has permission */}
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
			{/* Suspension Modal */}
			{suspendModalOpen && employeeToSuspend && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-xl font-bold text-gray-900 mb-4">
							{employeeToSuspend.suspended
								? "إعادة تفعيل الموظف"
								: "إيقاف الموظف عن العمل"}
						</h3>
						<p className="text-gray-700 mb-4">
							الموظف: <strong>{employeeToSuspend.name}</strong>
						</p>
						{employeeToSuspend.suspended ? (
							<p className="text-gray-600 mb-4">
								هل أنت متأكد من إعادة تفعيل هذا الموظف؟
							</p>
						) : (
							<>
								<p className="text-gray-600 mb-4">الرجاء إدخال سبب الإيقاف:</p>
								<textarea
									value={suspensionReason}
									onChange={(e) => setSuspensionReason(e.target.value)}
									className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[100px]"
									placeholder="اكتب السبب هنا..."
								/>
							</>
						)}
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => {
									setSuspendModalOpen(false);
									setEmployeeToSuspend(null);
									setSuspensionReason("");
								}}
								className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
							>
								إلغاء
							</button>
							<button
								onClick={confirmSuspend}
								className={`px-4 py-2 text-white rounded-lg ${
									employeeToSuspend.suspended
										? "bg-blue-600 hover:bg-blue-700"
										: "bg-orange-600 hover:bg-orange-700"
								}`}
							>
								{employeeToSuspend.suspended ? "إعادة تفعيل" : "تأكيد الإيقاف"}
							</button>
						</div>
					</div>
				</div>
			)}
			<ConfirmDialog
				isOpen={deleteModalOpen}
				onConfirm={confirmDelete}
				onCancel={() => {
					setDeleteModalOpen(false);
					setEmployeeToDelete(null);
				}}
				title="تأكيد الحذف"
				message="هل أنت متأكد من أنك تريد حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
			/>
			<div className="mt-16">
				<Footer />
			</div>
		</div>
	);
}
