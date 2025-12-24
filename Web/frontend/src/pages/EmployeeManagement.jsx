import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import EmployeeStatistics from "../components/EmployeeStatistics";
import EmployeesTable from "../components/EmployeesTable";
import searchIcon from "../assets/images/search.svg";
import AddEmployeePopUp from "../pages/AddEmployeePopUp";
import EmployeeDetailsModal from "../components/EmployeeDetailsModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

export default function EmployeeManagement() {
	const { isDarkMode } = useTheme();
	const [employees, setEmployees] = useState([]);
	const [filteredEmployees, setFilteredEmployees] = useState([]);
	
	// Filtering & Searching
	const [search, setSearch] = useState("");
	const [filterRole, setFilterRole] = useState("All");
	const [filterStatus, setFilterStatus] = useState("All");
	
	// Sorting
	const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "descending" });

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);

	const [showPopup, setShowPopup] = useState(false);
	const [loading, setLoading] = useState(true);
	const [selectedEmployee, setSelectedEmployee] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [employeeToDelete, setEmployeeToDelete] = useState(null);
	const [suspendModalOpen, setSuspendModalOpen] = useState(false);
	const [employeeToSuspend, setEmployeeToSuspend] = useState(null);
	const [suspensionReason, setSuspensionReason] = useState("");

	const user = JSON.parse(localStorage.getItem("user"));
	const adminName = user?.fullname || user?.username || "المدير";
	const token = localStorage.getItem("token");

	// Theme classes
	const theme = {
		pageBg: isDarkMode ? "bg-[#1a1600]" : "bg-[#FFFDF5]",
		textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-[#690000]",
		textSecondary: isDarkMode ? "text-[#D4AF37]/60" : "text-gray-500",
		inputBg: isDarkMode ? "bg-[#2d2600]/50 border-[#D4AF37]/30 text-white placeholder-[#D4AF37]/40" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400",
		modalBg: isDarkMode ? "bg-[#1a1600] border border-[#D4AF37]/20" : "bg-white",
		selectBg: isDarkMode ? "bg-[#2d2600] text-[#F3E5AB] border-[#D4AF37]/30" : "bg-white text-gray-700 border-gray-200",
		paginationBtn: isDarkMode ? "bg-[#2d2600] text-[#D4AF37] hover:bg-[#D4AF37]/20 disabled:opacity-30" : "bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30",
		paginationActive: isDarkMode ? "bg-[#D4AF37] text-[#1a1600]" : "bg-[#690000] text-white",
	};

	const fetchEmployees = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/users`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

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
					active: emp.active
				}));

			setEmployees(employeeData);
			setFilteredEmployees(employeeData); // Initial full list
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

	// Filtering Logic
	useEffect(() => {
		let result = [...employees];

		// 1. Search
		if (search) {
			const q = search.toLowerCase();
			result = result.filter(
				(emp) =>
					emp.name.toLowerCase().includes(q) ||
					emp.username.toLowerCase().includes(q) ||
					emp.email.toLowerCase().includes(q)
			);
		}

		// 2. Filter by Role
		if (filterRole !== "All") {
			result = result.filter((emp) => emp.employeeType === filterRole);
		}

		// 3. Filter by Status
		if (filterStatus !== "All") {
			const isSuspended = filterStatus === "Suspended";
			const isActive = filterStatus === "Active";
			if (isSuspended) result = result.filter(e => e.suspended);
			if (isActive) result = result.filter(e => !e.suspended && e.active);
		}

		// 4. Sorting
		if (sortConfig.key) {
			result.sort((a, b) => {
				const aVal = a[sortConfig.key] || "";
				const bVal = b[sortConfig.key] || "";
				
				if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
				if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
				return 0;
			});
		}

		setFilteredEmployees(result);
		setCurrentPage(1); // Reset to first page
	}, [employees, search, filterRole, filterStatus, sortConfig]);

	// Pagination Logic
	const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
	const paginatedEmployees = filteredEmployees.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const handleSort = (key) => {
		let direction = "ascending";
		if (sortConfig.key === key && sortConfig.direction === "ascending") {
			direction = "descending";
		}
		setSortConfig({ key, direction });
	};

	// Handlers for Modals (Same as before)
	const handleToggleStatus = async (employeeId, currentStatus) => { /* ... */ }; // Not used directly in new table but keep logic
	const handleDeleteEmployee = (employeeId) => { setEmployeeToDelete(employeeId); setDeleteModalOpen(true); };
	const handleSuspendEmployee = (employee) => { setEmployeeToSuspend(employee); setSuspensionReason(""); setSuspendModalOpen(true); };

	const confirmSuspend = async () => {
		if (!employeeToSuspend) return;
		try {
			if (employeeToSuspend.suspended) {
				await axios.patch(`${import.meta.env.VITE_API_URL}/api/users/${employeeToSuspend.id}/unsuspend`, {}, { headers: { Authorization: `Bearer ${token}` } });
				toast.success("تم إعادة تفعيل الموظف بنجاح");
			} else {
				if (!suspensionReason.trim()) { toast.error("الرجاء إدخال سبب الإيقاف"); return; }
				await axios.patch(`${import.meta.env.VITE_API_URL}/api/users/${employeeToSuspend.id}/suspend`, { reason: suspensionReason }, { headers: { Authorization: `Bearer ${token}` } });
				toast.success("تم إيقاف الموظف عن العمل بنجاح");
			}
			fetchEmployees();
		} catch (error) { toast.error("فشل تحديث حالة الإيقاف"); } 
		finally { setSuspendModalOpen(false); setEmployeeToSuspend(null); setSuspensionReason(""); }
	};

	const confirmDelete = async () => {
		if (!employeeToDelete) return;
		try {
			await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${employeeToDelete}`, { headers: { Authorization: `Bearer ${token}` } });
			toast.success("تم حذف الموظف بنجاح");
			fetchEmployees();
		} catch (error) { toast.error("فشل حذف الموظف"); }
		finally { setDeleteModalOpen(false); setEmployeeToDelete(null); }
	};

	const getEmployeeTypeLabel = (type) => {
		const labels = { "Regular Employee": "موظف عادي", "Certified Employee": "موظف معتمد", "Department Manager": "مدير قسم", "System Admin": "مدير النظام" };
		return labels[type] || type;
	};

	return (
		<div className={`flex flex-col min-h-screen ${theme.pageBg} font-sans relative transition-colors duration-300`}>
			<Header />

			{/* Background Decoration */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				<div className={`absolute top-20 left-[-10%] w-[500px] h-[500px] rounded-full filter blur-[120px] opacity-10 ${isDarkMode ? "bg-[#D4AF37]" : "bg-red-500"}`}></div>
				<div className={`absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full filter blur-[100px] opacity-10 ${isDarkMode ? "bg-[#B8860B]" : "bg-red-400"}`}></div>
			</div>

			<main className="relative pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full flex-grow">
				
				{/* 1. Header Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
					<div>
						<h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>إدارة الموظفين 👔</h1>
						<p className={`${theme.textSecondary}`}>مرحباً {adminName}، يمكنك إدارة جميع الموظفين وصلاحياتهم من هنا.</p>
					</div>
					<button
						onClick={() => setShowPopup(true)}
						className={`px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2
							${isDarkMode 
								? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#1a1600] hover:shadow-[#D4AF37]/40 shadow-[#D4AF37]/20" 
								: "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white hover:shadow-[#D4AF37]/30"
							}`}
					>
						<span className="text-xl">+</span> إضافة موظف جديد
					</button>
				</div>

				{/* 2. Stats */}
				<EmployeeStatistics employees={employees} />

				{/* 3. Controls Bar (Search + Filters) */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
					
					{/* Search */}
					<div className="relative w-full md:w-1/3 group">
						<input
							type="text"
							placeholder="بحث..."
							onChange={(e) => setSearch(e.target.value)}
							className={`w-full ${theme.inputBg} rounded-xl py-2.5 pr-10 pl-4 text-right focus:outline-none focus:ring-2 focus:ring-[#1BA3B6]/50 transition-all shadow-sm`}
						/>
						<img src={searchIcon} alt="search" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
					</div>

					{/* Filters */}
					<div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
						<select
							value={filterRole}
							onChange={(e) => setFilterRole(e.target.value)}
							className={`px-4 py-2.5 rounded-xl border appearance-none outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${theme.selectBg}`}
						>
							<option value="All">جميع الوظائف</option>
							<option value="System Admin">مدير النظام</option>
							<option value="Department Manager">مدير قسم</option>
							<option value="Certified Employee">موظف معتمد</option>
							<option value="Regular Employee">موظف عادي</option>
						</select>

						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className={`px-4 py-2.5 rounded-xl border appearance-none outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${theme.selectBg}`}
						>
							<option value="All">جميع الحالات</option>
							<option value="Active">نشط</option>
							<option value="Suspended">موقوف</option>
						</select>
						
						<div className={`p-2.5 rounded-xl border ${theme.selectBg} flex items-center justify-center`}>
							<Filter className="w-5 h-5 opacity-70" />
						</div>
					</div>
				</div>

				{/* 4. Table */}
				{loading ? (
					<div className="flex justify-center py-20">
						<LoadingSpinner />
					</div>
				) : (
					<>
						<EmployeesTable
							employees={paginatedEmployees}
							onViewDetails={(id) => { setSelectedEmployee(id); setShowDetailsModal(true); }}
							onDelete={handleDeleteEmployee}
							onSuspend={handleSuspendEmployee}
							onSort={handleSort}
							sortConfig={sortConfig}
							getEmployeeTypeLabel={getEmployeeTypeLabel}
							emptyMessage={search ? "لا يوجد موظفون مطابقون لبحثك" : "لا يوجد موظفون مسجلون"}
						/>

						{/* Pagination Controls */}
						{totalPages > 1 && (
							<div className="flex justify-center items-center gap-4 mt-8" dir="ltr">
								<button
									onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className={`p-2 rounded-lg transition-all ${theme.paginationBtn}`}
								>
									<ChevronLeft className="w-5 h-5" />
								</button>
								
								<div className="flex gap-2">
									{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
										<button
											key={page}
											onClick={() => setCurrentPage(page)}
											className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
												currentPage === page ? theme.paginationActive : theme.paginationBtn
											}`}
										>
											{page}
										</button>
									))}
								</div>

								<button
									onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
									disabled={currentPage === totalPages}
									className={`p-2 rounded-lg transition-all ${theme.paginationBtn}`}
								>
									<ChevronRight className="w-5 h-5" />
								</button>
							</div>
						)}
					</>
				)}
			</main>

			{/* Popup Modals (Same as before) */}
			{showPopup && <AddEmployeePopUp onClose={() => setShowPopup(false)} onEmployeeAdded={fetchEmployees} />}
			{showDetailsModal && selectedEmployee && <EmployeeDetailsModal employeeId={selectedEmployee} onClose={() => { setShowDetailsModal(false); setSelectedEmployee(null); }} onUpdate={fetchEmployees} />}
			
			{/* Suspension Modal */}
			{suspendModalOpen && employeeToSuspend && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
					<div className={`${theme.modalBg} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
						<h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
							{employeeToSuspend.suspended ? "إعادة تفعيل الموظف" : "إيقاف الموظف عن العمل"}
						</h3>
						<p className={`${theme.textSecondary} mb-4`}>
							الموظف: <strong className={isDarkMode ? "text-white" : "text-gray-900"}>{employeeToSuspend.name}</strong>
						</p>
						
						{employeeToSuspend.suspended ? (
							<p className={`${theme.textSecondary} mb-6`}>هل أنت متأكد من إعادة تفعيل هذا الموظف؟</p>
						) : (
							<>
								<p className={`${theme.textSecondary} mb-2`}>الرجاء إدخال سبب الإيقاف:</p>
								<textarea
									value={suspensionReason}
									onChange={(e) => setSuspensionReason(e.target.value)}
									className={`w-full ${theme.inputBg} rounded-xl p-3 mb-6 min-h-[100px] focus:ring-2 focus:ring-orange-500/50 outline-none`}
									placeholder="اكتب السبب هنا..."
								/>
							</>
						)}
						
						<div className="flex gap-3 justify-end">
							<button onClick={() => { setSuspendModalOpen(false); setEmployeeToSuspend(null); setSuspensionReason(""); }} className={`px-4 py-2 rounded-lg font-bold transition-colors ${isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>إلغاء</button>
							<button onClick={confirmSuspend} className={`px-4 py-2 text-white font-bold rounded-lg shadow-lg ${employeeToSuspend.suspended ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"}`}>{employeeToSuspend.suspended ? "تأكيد التفعيل" : "تأكيد الإيقاف"}</button>
						</div>
					</div>
				</div>
			)}

			<ConfirmDialog isOpen={deleteModalOpen} onConfirm={confirmDelete} onCancel={() => { setDeleteModalOpen(false); setEmployeeToDelete(null); }} title="تأكيد الحذف" message="هل أنت متأكد من أنك تريد حذف هذا الموظف؟" />
		</div>
	);
}
