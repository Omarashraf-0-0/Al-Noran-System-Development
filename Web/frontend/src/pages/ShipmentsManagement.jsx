import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import ShipmentDetailsModal from "../components/ShipmentDetailsModal";
import bannerPic from "../assets/images/Untitled design (8) 2.png";
import searchIcon from "../assets/images/search.svg";

export default function ShipmentsManagement() {
	const [shipments, setShipments] = useState([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [selectedShipment, setSelectedShipment] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	const user = JSON.parse(localStorage.getItem("user"));
	const adminName = user?.fullname || user?.username || "المدير";
	const token = localStorage.getItem("token");

	// Fetch Shipments from backend
	const fetchShipments = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/getAll`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			// Transform backend data
			const shipmentsData = response.data.map((ship) => ({
				id: ship._id,
				acid: ship.acid,
				clientName: ship.user_id?.username || ship.user_id?.fullname || "غير متاح",
				clientEmail: ship.user_id?.email || "",
				employeeName: ship.employee_id?.username || ship.employee_id?.fullname || "لم يعين بعد",
				status: ship.status,
				port: ship.port_name,
				country: ship.country,
				numContainers: ship.num_of_containers,
				createdAt: ship.createdAt,
				dragt: ship.dragt,
			}));

			setShipments(shipmentsData);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching shipments:", error);
			toast.error("فشل تحميل بيانات الشحنات");
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchShipments();
	}, []);

	// Filter shipments
	const filteredShipments = shipments.filter(
		(ship) =>
			ship.acid.toLowerCase().includes(search.toLowerCase()) ||
			ship.clientName.toLowerCase().includes(search.toLowerCase()) ||
			ship.employeeName.toLowerCase().includes(search.toLowerCase()) ||
			ship.port.toLowerCase().includes(search.toLowerCase())
	);

	const handleDeleteShipment = async (shipmentAcid) => {
		if (!window.confirm("هل أنت متأكد من حذف هذه الشحنة؟")) {
			return;
		}

		try {
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/shipments/${shipmentAcid}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.success("تم حذف الشحنة بنجاح");
			fetchShipments();
		} catch (error) {
			console.error("Error deleting shipment:", error);
			toast.error("فشل حذف الشحنة");
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "Completed":
			case "تمت بنجاح":
				return "text-green-600";
			case "In Transit":
			case "في الطريق":
				return "text-blue-600";
			case "Arrived":
			case "Customs Clearance":
			case "جاري الكشف والتثمين":
			case "في انتظار وصول الإذن":
				return "text-yellow-600";
			case "Pending":
			case "في انتظار الشحن":
				return "text-gray-600";
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
				إدارة الشحنات
			</h2>

			{/* Search Bar */}
			<div className="flex justify-center mb-8">
				<div className="relative w-full max-w-xl">
					<input
						type="text"
						placeholder="البحث برقم ACID / اسم العميل / اسم الموظف / الميناء"
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
					{/* Shipments Table */}
					<div className="overflow-x-auto px-4 mb-8">
						<table className="w-full text-center border-collapse bg-white shadow-md rounded-lg">
							<thead>
								<tr className="text-white border-b border-red-900 bg-red-800">
									<th className="py-4 px-4">#</th>
									<th className="py-4 px-4">رقم ACID</th>
									<th className="py-4 px-4">اسم العميل</th>
									<th className="py-4 px-4">الموظف المسؤول</th>
									<th className="py-4 px-4">الميناء</th>
									<th className="py-4 px-4">الدولة</th>
									<th className="py-4 px-4">عدد الحاويات</th>
									<th className="py-4 px-4">الحالة</th>
									<th className="py-4 px-4">تاريخ الإنشاء</th>
									<th className="py-4 px-4">الإجراءات</th>
								</tr>
							</thead>

							<tbody>
								{filteredShipments.length === 0 ? (
									<tr>
										<td colSpan="10" className="py-6 text-gray-500">
											لا يوجد شحنات مطابقة لبحثك
										</td>
									</tr>
								) : (
									filteredShipments.map((ship, index) => (
										<tr
											key={ship.id}
											className="border-b border-red-100 text-gray-800 hover:bg-red-50"
										>
											<td className="py-4 px-4 font-semibold text-red-900">
												{index + 1}
											</td>
											<td className="py-4 px-4 font-mono text-sm">{ship.acid}</td>
											<td className="py-4 px-4">{ship.clientName}</td>
											<td className="py-4 px-4">{ship.employeeName}</td>
											<td className="py-4 px-4">{ship.port}</td>
											<td className="py-4 px-4">{ship.country}</td>
											<td className="py-4 px-4">{ship.numContainers}</td>
											<td
												className={`py-4 px-4 font-semibold ${getStatusColor(
													ship.status
												)}`}
											>
												{ship.status}
											</td>
											<td className="py-4 px-4">
												{new Date(ship.createdAt).toLocaleDateString("ar-EG")}
											</td>
											<td className="py-4 px-4">
												<div className="flex gap-2 justify-center">
													<button
														onClick={() => {
															setSelectedShipment(ship.id);
															setShowDetailsModal(true);
														}}
														className="text-blue-600 hover:text-blue-800 underline text-sm"
													>
														عرض التفاصيل
													</button>
													<button
														onClick={() => handleDeleteShipment(ship.acid)}
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
									{shipments.length}
								</p>
								<p className="text-sm text-gray-600">إجمالي الشحنات</p>
							</div>
							<div className="bg-white rounded-lg shadow p-4 text-center">
								<p className="text-2xl font-bold text-green-600">
									{
										shipments.filter(
											(s) => s.status === "Completed" || s.status === "تمت بنجاح"
										).length
									}
								</p>
								<p className="text-sm text-gray-600">مكتملة</p>
							</div>
							<div className="bg-white rounded-lg shadow p-4 text-center">
								<p className="text-2xl font-bold text-blue-600">
									{
										shipments.filter(
											(s) => s.status === "In Transit" || s.status === "في الطريق"
										).length
									}
								</p>
								<p className="text-sm text-gray-600">في الطريق</p>
							</div>
							<div className="bg-white rounded-lg shadow p-4 text-center">
								<p className="text-2xl font-bold text-gray-600">
									{
										shipments.filter(
											(s) => s.status === "Pending" || s.status === "في انتظار الشحن"
										).length
									}
								</p>
								<p className="text-sm text-gray-600">قيد الانتظار</p>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Shipment Details Modal */}
			{showDetailsModal && selectedShipment && (
				<ShipmentDetailsModal
					shipmentId={selectedShipment}
					onClose={() => {
						setShowDetailsModal(false);
						setSelectedShipment(null);
					}}
					onUpdate={fetchShipments}
				/>
			)}

			<div className="mt-16">
				<Footer />
			</div>
		</div>
	);
}
