import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import CustomerDetailsModal from "../components/CustomerDetailsModal";
import CustomersTable from "../components/CustomersTable";
import CustomerStatistics from "../components/CustomerStatistics";

import ConfirmDialog from "../components/ConfirmDialog";
import DocumentApprovalSection from "../components/DocumentApprovalSection";
import searchIcon from "../assets/images/search.svg";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

export default function CustomerUI() {
	const { isDarkMode } = useTheme();
	const [customers, setCustomers] = useState([]);
	const [filteredCustomers, setFilteredCustomers] = useState([]);

	// Filtering & Searching
	const [search, setSearch] = useState("");
	const [filterType, setFilterType] = useState("All");
	const [filterStatus, setFilterStatus] = useState("All");

	// Sorting
	const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "descending" });

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);

	const [loading, setLoading] = useState(true);
	const [selectedCustomer, setSelectedCustomer] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [customerToDelete, setCustomerToDelete] = useState(null);

	const user = JSON.parse(localStorage.getItem("user"));
	const adminName = user?.fullname || user?.username || "المدير";
	const token = localStorage.getItem("token");

	// Theme classes
	const theme = {
		pageBg: isDarkMode ? "bg-[#1a1600]" : "bg-[#FFFDF5]",
		textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-[#690000]",
		textSecondary: isDarkMode ? "text-[#D4AF37]/60" : "text-gray-500",
		inputBg: isDarkMode ? "bg-[#2d2600]/50 border-[#D4AF37]/30 text-white placeholder-[#D4AF37]/40" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400",
		selectBg: isDarkMode ? "bg-[#2d2600] text-[#F3E5AB] border-[#D4AF37]/30" : "bg-white text-gray-700 border-gray-200",
		paginationBtn: isDarkMode ? "bg-[#2d2600] text-[#D4AF37] hover:bg-[#D4AF37]/20 disabled:opacity-30" : "bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30",
		paginationActive: isDarkMode ? "bg-[#D4AF37] text-[#1a1600]" : "bg-[#690000] text-white",
	};

	const fetchCustomers = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/users`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			const customerData = response.data
				.filter((user) => user.type === "client")
				.map((cust) => ({
					id: cust._id,
					name: cust.fullname,
					username: cust.username,
					email: cust.email,
					phone: cust.phone,
					status: cust.active ? "نشط" : "غير نشط",
					active: cust.active, // Boolean for easier filtering
					clientType: cust.clientDetails?.clientType || "commercial",
					rank: cust.rank || "",
					taxNumber: cust.taxNumber || "",
					createdAt: cust.createdAt,
				}));

			setCustomers(customerData);
			setFilteredCustomers(customerData);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching customers:", error);
			toast.error("فشل تحميل بيانات العملاء");
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCustomers();
	}, []);

	// Filtering & Sorting Logic
	useEffect(() => {
		let result = [...customers];

		// 1. Search
		if (search) {
			const q = search.toLowerCase();
			result = result.filter(
				(cust) =>
					cust.name.toLowerCase().includes(q) ||
					cust.username.toLowerCase().includes(q) ||
					cust.email.toLowerCase().includes(q)
			);
		}

		// 2. Filter by Type
		if (filterType !== "All") {
			result = result.filter((cust) => cust.clientType === filterType);
		}

		// 3. Filter by Status
		if (filterStatus !== "All") {
			const isActive = filterStatus === "Active";
			if (isActive) result = result.filter(c => c.active === true);
			else result = result.filter(c => c.active === false);
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

		setFilteredCustomers(result);
		setCurrentPage(1); // Reset pagination on filter change
	}, [customers, search, filterType, filterStatus, sortConfig]);

	// Pagination Logic
	const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
	const paginatedCustomers = filteredCustomers.slice(
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

	// Actions
	const handleToggleStatus = async (customerId, currentStatus) => {
		try {
			const newStatus = currentStatus === "نشط" ? false : true;
			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/users/${customerId}`,
				{ active: newStatus },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			toast.success(`تم ${newStatus ? "تفعيل" : "تعطيل"} العميل بنجاح`);
			fetchCustomers();
		} catch (error) {
			console.error("Error updating customer status:", error);
			toast.error("فشل تحديث حالة العميل");
		}
	};

	const handleDeleteCustomer = (customerId) => {
		setCustomerToDelete(customerId);
		setShowDeleteDialog(true);
	};

	const confirmDelete = async () => {
		if (!customerToDelete) return;
		try {
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/users/${customerToDelete}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			toast.success("تم حذف العميل بنجاح");
			fetchCustomers();
			setShowDeleteDialog(false);
			setCustomerToDelete(null);
		} catch (error) {
			console.error("Error deleting customer:", error);
			toast.error("فشل حذف العميل");
			setShowDeleteDialog(false);
			setCustomerToDelete(null);
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
		<div className={`flex flex-col min-h-screen ${theme.pageBg} font-sans relative transition-colors duration-300`}>
			<Header />

			{/* Background Decoration */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				<div className={`absolute top-20 left-[-10%] w-[500px] h-[500px] rounded-full filter blur-[120px] opacity-10 ${isDarkMode ? "bg-[#D4AF37]" : "bg-red-500"}`}></div>
				<div className={`absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full filter blur-[100px] opacity-10 ${isDarkMode ? "bg-[#B8860B]" : "bg-red-400"}`}></div>
			</div>

			<main className="relative pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full flex-grow">
				
				{/* 1. Header Section */}
				<div className="mb-10 text-center md:text-right">
					<h1 className={`text-4xl font-bold ${theme.textPrimary} mb-2`}>
						إدارة العملاء 🤝
					</h1>
					<p className={`${theme.textSecondary}`}>
						مرحباً {adminName}، يمكنك استعراض وإدارة جميع العملاء من هنا.
					</p>
				</div>

				{/* 2. Stats */}
				<CustomerStatistics customers={customers} />

				{/* 3. Document Approval Section */}
				<DocumentApprovalSection />

				{/* 4. Controls Bar (Search + Filters) */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 mt-8">
					{/* Search */}
					<div className="relative w-full md:w-1/3 group">
						<input
							type="text"
							placeholder="البحث باسم العميل / البريد..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className={`w-full ${theme.inputBg} rounded-xl py-2.5 pr-10 pl-4 text-right focus:outline-none focus:ring-2 focus:ring-[#1BA3B6]/50 transition-all shadow-sm`}
						/>
						<img src={searchIcon} alt="search" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
					</div>

					{/* Filters */}
					<div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
						<select
							value={filterType}
							onChange={(e) => setFilterType(e.target.value)}
							className={`px-4 py-2.5 rounded-xl border appearance-none outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${theme.selectBg}`}
						>
							<option value="All">جميع الأنواع</option>
							<option value="commercial">تجاري</option>
							<option value="factory">مصنع</option>
							<option value="personal">شخصي</option>
						</select>

						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className={`px-4 py-2.5 rounded-xl border appearance-none outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${theme.selectBg}`}
						>
							<option value="All">جميع الحالات</option>
							<option value="Active">نشط</option>
							<option value="Inactive">غير نشط</option>
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
						<CustomersTable
							customers={paginatedCustomers}
							search={search}
							onViewDetails={(custId) => {
								setSelectedCustomer(custId);
								setShowDetailsModal(true);
							}}
							onToggleStatus={handleToggleStatus}
							onDelete={handleDeleteCustomer}
							getClientTypeLabel={getClientTypeLabel}
							onSort={handleSort}
							sortConfig={sortConfig}
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

				{/* Details Modal */}
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

				{/* Delete Confirmation Dialog */}
				<ConfirmDialog
					isOpen={showDeleteDialog}
					onConfirm={confirmDelete}
					onCancel={() => {
						setShowDeleteDialog(false);
						setCustomerToDelete(null);
					}}
					title="⚠️ تأكيد الحذف"
					message="هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
					confirmText="حذف"
					cancelText="إلغاء"
					confirmColor="red"
				/>
			</main>
		</div>
	);
}
