import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import CustomerDetailsModal from "../components/CustomerDetailsModal";
import CustomersTable from "../components/CustomersTable";
import CustomerStatistics from "../components/CustomerStatistics";
import ConfirmDialog from "../components/ConfirmDialog";
import DocumentApprovalSection from "../components/DocumentApprovalSection";
import bannerPic from "../assets/images/Untitled design (8) 2.png";
import searchIcon from "../assets/images/search.svg";

export default function CustomerUI() {
	const [customers, setCustomers] = useState([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [selectedCustomer, setSelectedCustomer] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [customerToDelete, setCustomerToDelete] = useState(null);

	// TODO: RBAC - Get admin permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canViewCustomers = hasPermission('customer:view');
	// const canEditCustomers = hasPermission('customer:edit');
	// const canDeleteCustomers = hasPermission('customer:delete');
	// const canToggleCustomerStatus = hasPermission('customer:toggleStatus');

	const user = JSON.parse(localStorage.getItem("user"));
	const adminName = user?.fullname || user?.username || "المدير";
	const token = localStorage.getItem("token");

	const fetchCustomers = async () => {
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
		// TODO: RBAC - Check if user has permission to toggle customer status
		// if (!canToggleCustomerStatus) { toast.error('ليس لديك صلاحية لتغيير حالة العملاء'); return; }
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

	const handleDeleteCustomer = (customerId) => {
		// TODO: RBAC - Check if user has permission to delete customers
		// if (!canDeleteCustomers) { toast.error('ليس لديك صلاحية لحذف العملاء'); return; }
		setCustomerToDelete(customerId);
		setShowDeleteDialog(true);
	};

	const confirmDelete = async () => {
		if (!customerToDelete) return;

		try {
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/users/${customerToDelete}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
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
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
			<AdminHeader />

			{/* Welcome Message */}
			<h1 className="text-4xl font-bold text-[#690000] text-right mb-8 mt-8 px-16">
				مرحباً ، {adminName} !
			</h1>

			{/* Stats */}
			{/* TODO: RBAC - Only show statistics if user has permission to view analytics */}
			<CustomerStatistics customers={customers} />

			{/* Banner */}
			<div className="flex justify-center mb-10">
				<img
					src={bannerPic}
					alt="admin illustration"
					className="w-[350px] md:w-[450px] lg:w-[550px] object-contain"
				/>
			</div>

			{/* Document Approval Section */}
			<div className="px-16 mb-10">
				<DocumentApprovalSection />
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
				<LoadingSpinner />
			) : (
				<>
					{/* TODO: RBAC - Only show table if user has permission to view customers */}
					<CustomersTable
						customers={filteredCustomers}
						search={search}
						onViewDetails={(custId) => {
							setSelectedCustomer(custId);
							setShowDetailsModal(true);
						}}
						onToggleStatus={handleToggleStatus}
						onDelete={handleDeleteCustomer}
						getClientTypeLabel={getClientTypeLabel}
					/>
				</>
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

			<div className="mt-16">
				<Footer />
			</div>
		</div>
	);
}
