import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import CertificateDetailsModal from "../components/CertificateDetailsModal";
import CertificatesTable from "../components/CertificatesTable";
import CertificateStatistics from "../components/CertificateStatistics";
import ConfirmDialog from "../components/ConfirmDialog";
import bannerPic from "../assets/images/Untitled design (8) 2.png";
import searchIcon from "../assets/images/search.svg";

export default function CertificatesManagement() {
	const [certificates, setCertificates] = useState([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [selectedCertificate, setSelectedCertificate] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [certificateToDelete, setCertificateToDelete] = useState(null);

	// TODO: RBAC - Get admin permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canViewCertificates = hasPermission('certificate:view');
	// const canDeleteCertificates = hasPermission('certificate:delete');
	// const canEditCertificates = hasPermission('certificate:edit');

	const user = JSON.parse(localStorage.getItem("user"));
	const adminName = user?.fullname || user?.username || "المدير";
	const token = localStorage.getItem("token");

	// --------------------------------------
	// Fetch Certificates from backend
	// --------------------------------------
	const fetchCertificates = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/acid/employee/all`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			// Transform backend data to match frontend structure
			const certificatesData = response.data.requests.map((req) => ({
				id: req._id,
				certificateNumber: req.acidCode || req._id.slice(-8).toUpperCase(),
				clientName: req.userId?.username || "غير متاح",
				clientEmail: req.userId?.email || "",
				employeeName: req.reviewingBy?.username || "لم يعين بعد",
				stage: req.status,
				isLocked: req.isLocked,
				hasShipment: req.hasShipment,
				requestDate: req.requestDate,
				goods: req.goods,
				supplier: req.supplier,
			}));

			setCertificates(certificatesData);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching certificates:", error);
			toast.error("فشل تحميل بيانات الشهادات");
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCertificates();
	}, []);

	// --------------------------------------
	// FILTER certificates
	// --------------------------------------
	const filteredCertificates = certificates.filter(
		(cert) =>
			cert.certificateNumber.toLowerCase().includes(search.toLowerCase()) ||
			cert.clientName.toLowerCase().includes(search.toLowerCase()) ||
			cert.employeeName.toLowerCase().includes(search.toLowerCase())
	);

	const handleDeleteCertificate = (certId) => {
		// TODO: RBAC - Check if user has permission to delete certificates
		// if (!canDeleteCertificates) { toast.error('ليس لديك صلاحية لحذف الشهادات'); return; }
		setCertificateToDelete(certId);
		setShowDeleteDialog(true);
	};

	const confirmDelete = async () => {
		if (!certificateToDelete) return;

		try {
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/acid/${certificateToDelete}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("تم حذف الشهادة بنجاح");
			fetchCertificates();
			setShowDeleteDialog(false);
			setCertificateToDelete(null);
		} catch (error) {
			console.error("Error deleting certificate:", error);
			toast.error("فشل حذف الشهادة");
			setShowDeleteDialog(false);
			setCertificateToDelete(null);
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

	const getStatusColor = (status) => {
		switch (status) {
			case "ACID Issued":
				return "text-green-600";
			case "Under Review":
				return "text-yellow-600";
			case "Pending":
				return "text-blue-600";
			case "Rejected":
				return "text-red-600";
			default:
				return "text-gray-600";
		}
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

			{/* Section Title */}
			<h2 className="text-4xl font-bold text-[#690000] text-right my-8 px-16">
				إدارة الشهادات (ACID Requests)
			</h2>

			{/* Search Bar */}
			<div className="flex justify-center mb-8">
				<div className="relative w-full max-w-xl">
					<input
						type="text"
						placeholder="البحث بالكود / اسم العميل / اسم الموظف"
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

			{/* Loading State */}
			{loading ? (
				<LoadingSpinner />
			) : (
				<>
					{/* Certificates Table */}
					{/* TODO: RBAC - Only show table if user has permission to view certificates */}
					<CertificatesTable
						certificates={filteredCertificates}
						onViewDetails={(certId) => {
							setSelectedCertificate(certId);
							setShowDetailsModal(true);
						}}
						onDelete={handleDeleteCertificate}
						getStatusLabel={getStatusLabel}
						getStatusColor={getStatusColor}
					/>

					{/* Statistics */}
					{/* TODO: RBAC - Only show statistics if user has permission to view analytics */}
					<CertificateStatistics certificates={certificates} />
				</>
			)}

			{/* Certificate Details Modal */}
			{showDetailsModal && selectedCertificate && (
				<CertificateDetailsModal
					certificateId={selectedCertificate}
					onClose={() => {
						setShowDetailsModal(false);
						setSelectedCertificate(null);
					}}
					onUpdate={fetchCertificates}
				/>
			)}

			{/* Delete Confirmation Dialog */}
			<ConfirmDialog
				isOpen={showDeleteDialog}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteDialog(false);
					setCertificateToDelete(null);
				}}
				title="⚠️ تأكيد الحذف"
				message="هل أنت متأكد من حذف هذه الشهادة؟ لا يمكن التراجع عن هذا الإجراء."
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
