import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import CertificateDetailsModal from "../components/CertificateDetailsModal";
import bannerPic from "../assets/images/Untitled design (8) 2.png";
import searchIcon from "../assets/images/search.svg";

export default function CertificatesManagement() {
	const [certificates, setCertificates] = useState([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [selectedCertificate, setSelectedCertificate] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

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

	const handleDeleteCertificate = async (certId) => {
		if (!window.confirm("هل أنت متأكد من حذف هذه الشهادة؟")) {
			return;
		}

		try {
			await axios.delete(`${import.meta.env.VITE_API_URL}/api/acid/${certId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			toast.success("تم حذف الشهادة بنجاح");
			fetchCertificates();
		} catch (error) {
			console.error("Error deleting certificate:", error);
			toast.error("فشل حذف الشهادة");
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
				<div className="flex justify-center items-center py-20">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div>
				</div>
			) : (
				<>
					{/* Certificates Table */}
					<div className="overflow-x-auto px-4 mb-8">
						<table className="w-full text-center border-collapse bg-white shadow-md rounded-lg">
							<thead>
								<tr className="text-white border-b border-red-900 bg-red-800">
									<th className="py-4 px-4">#</th>
									<th className="py-4 px-4">رقم الطلب</th>
									<th className="py-4 px-4">اسم العميل</th>
									<th className="py-4 px-4">الموظف المسؤول</th>
									<th className="py-4 px-4">الحالة</th>
									<th className="py-4 px-4">تاريخ الطلب</th>
									<th className="py-4 px-4">حالة القفل</th>
									<th className="py-4 px-4">الإجراءات</th>
								</tr>
							</thead>

							<tbody>
								{filteredCertificates.length === 0 ? (
									<tr>
										<td colSpan="8" className="py-6 text-gray-500">
											لا يوجد شهادات مطابقة لبحثك
										</td>
									</tr>
								) : (
									filteredCertificates.map((cert, index) => (
										<tr
											key={cert.id}
											className="border-b border-red-100 text-gray-800 hover:bg-red-50"
										>
											<td className="py-4 px-4 font-semibold text-red-900">
												{index + 1}
											</td>
											<td className="py-4 px-4 font-mono text-sm">
												{cert.certificateNumber}
											</td>
											<td className="py-4 px-4">{cert.clientName}</td>
											<td className="py-4 px-4">{cert.employeeName}</td>
											<td
												className={`py-4 px-4 font-semibold ${getStatusColor(
													cert.stage
												)}`}
											>
												{getStatusLabel(cert.stage)}
											</td>
											<td className="py-4 px-4">
												{new Date(cert.requestDate).toLocaleDateString("ar-EG")}
											</td>
											<td className="py-4 px-4">
												{cert.isLocked ? (
													<span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
														مقفل
													</span>
												) : (
													<span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
														مفتوح
													</span>
												)}
											</td>
											<td className="py-4 px-4">
												<div className="flex gap-2 justify-center">
													<button
														onClick={() => {
															setSelectedCertificate(cert.id);
															setShowDetailsModal(true);
														}}
														className="text-blue-600 hover:text-blue-800 underline text-sm"
													>
														عرض التفاصيل
													</button>
													<button
														onClick={() => handleDeleteCertificate(cert.id)}
														className="text-red-600 hover:text-red-800 underline text-sm"
													>
														حذف
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Statistics */}
					<div className="px-16 mb-8">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div className="bg-white rounded-lg shadow p-4 text-center">
								<p className="text-2xl font-bold text-[#690000]">
									{certificates.length}
								</p>
								<p className="text-sm text-gray-600">إجمالي الطلبات</p>
							</div>
							<div className="bg-white rounded-lg shadow p-4 text-center">
								<p className="text-2xl font-bold text-green-600">
									{certificates.filter((c) => c.stage === "ACID Issued").length}
								</p>
								<p className="text-sm text-gray-600">صدرت الشهادة</p>
							</div>
							<div className="bg-white rounded-lg shadow p-4 text-center">
								<p className="text-2xl font-bold text-yellow-600">
									{
										certificates.filter((c) => c.stage === "Under Review")
											.length
									}
								</p>
								<p className="text-sm text-gray-600">قيد المراجعة</p>
							</div>
							<div className="bg-white rounded-lg shadow p-4 text-center">
								<p className="text-2xl font-bold text-blue-600">
									{certificates.filter((c) => c.stage === "Pending").length}
								</p>
								<p className="text-sm text-gray-600">قيد الانتظار</p>
							</div>
						</div>
					</div>
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

			<div className="mt-16">
				<Footer />
			</div>
		</div>
	);
}
