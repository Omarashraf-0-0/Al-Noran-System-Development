import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { FileText, Globe, FileCheck, Package, ArrowLeft, User, Phone, Mail, Building } from "lucide-react";

const ClientProfilePage = () => {
	const { clientId } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [data, setData] = useState(null);
	const [activeTab, setActiveTab] = useState("shipments");
	const token = localStorage.getItem("token");
	
	// Get current user info
	const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
	const isEmployee = currentUser?.type === "employee";
	const employeeId = isEmployee ? (currentUser?.id || currentUser?._id) : null;

	useEffect(() => {
		const fetchClientProfile = async () => {
			try {
				setLoading(true);
				// For employees, filter by their ID to show only their work
				const url = employeeId 
					? `${import.meta.env.VITE_API_URL}/api/users/${clientId}/profile?employeeId=${employeeId}`
					: `${import.meta.env.VITE_API_URL}/api/users/${clientId}/profile`;
				
				const response = await axios.get(url, { 
					headers: { Authorization: `Bearer ${token}` } 
				});
				setData(response.data);
			} catch (err) {
				console.error("Error fetching client profile:", err);
				setError("فشل في تحميل بيانات العميل");
			} finally {
				setLoading(false);
			}
		};

		if (clientId && token) {
			fetchClientProfile();
		}
	}, [clientId, token, employeeId]);

	const getStatusColor = (status) => {
		const s = (status || "").toLowerCase();
		if (s.includes("completed") || s.includes("approved") || s.includes("تمت")) return "bg-green-100 text-green-800";
		if (s.includes("pending") || s.includes("انتظار")) return "bg-amber-100 text-amber-800";
		if (s.includes("rejected") || s.includes("مرفوض")) return "bg-red-100 text-red-800";
		return "bg-gray-100 text-gray-800";
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="flex justify-center items-center py-40">
					<LoadingSpinner />
					<span className="mr-4 text-gray-600">جاري تحميل بيانات العميل...</span>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="container mx-auto px-4 py-20 text-center">
					<div className="bg-red-50 p-8 rounded-2xl">
						<p className="text-red-800 font-bold text-xl mb-4">❌ {error || "بيانات غير متوفرة"}</p>
						<button 
							onClick={() => navigate(-1)}
							className="px-6 py-2 bg-[#690000] text-white rounded-lg hover:bg-[#8B0000]"
						>
							العودة
						</button>
					</div>
				</div>
			</div>
		);
	}

	const { client, importShipments, exportShipments, acidRequests, ucrRequests, stats } = data;

	return (
		<div className="min-h-screen bg-gray-50" dir="rtl">
			<Header />
			
			{/* Header Section */}
			<div className="bg-gradient-to-l from-[#690000] to-[#8B0000] text-white py-8">
				<div className="container mx-auto px-4">
					<button 
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
					>
						<ArrowLeft size={20} />
						<span>العودة</span>
					</button>
					
					<div className="flex flex-col md:flex-row items-start md:items-center gap-6">
						<div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
							<User size={40} className="text-white" />
						</div>
						<div className="flex-1">
							<h1 className="text-3xl font-bold mb-2">{client.fullname || client.username}</h1>
							<div className="flex flex-wrap gap-4 text-white/90">
								<span className="flex items-center gap-2">
									<Phone size={16} />
									{client.phone || "غير محدد"}
								</span>
								<span className="flex items-center gap-2">
									<Mail size={16} />
									{client.email || "غير محدد"}
								</span>
								<span className="flex items-center gap-2">
									<Building size={16} />
									{client.clientDetails?.clientType === "factory" ? "مصنع" : 
									 client.clientDetails?.clientType === "commercial" ? "تجاري" : "فردي"}
								</span>
							</div>
						</div>
						<div className={`px-4 py-2 rounded-full text-sm font-bold ${
							client.clientDetails?.documentsVerified 
								? "bg-green-500 text-white" 
								: "bg-amber-400 text-amber-900"
						}`}>
							{client.clientDetails?.documentsVerified ? "✓ مفعل" : "⏳ غير مفعل"}
						</div>
					</div>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="container mx-auto px-4 -mt-6">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
						<div className="text-3xl font-bold text-[#690000]">{stats.totalImport}</div>
						<div className="text-gray-500 text-sm">شحنات وارد</div>
					</div>
					<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
						<div className="text-3xl font-bold text-blue-600">{stats.totalExport}</div>
						<div className="text-gray-500 text-sm">شحنات صادر</div>
					</div>
					<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
						<div className="text-3xl font-bold text-amber-600">{stats.totalAcidRequests}</div>
						<div className="text-gray-500 text-sm">طلبات ACID</div>
					</div>
					<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
						<div className="text-3xl font-bold text-teal-600">{stats.totalUcrRequests}</div>
						<div className="text-gray-500 text-sm">طلبات UCR</div>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="container mx-auto px-4 mt-8">
				<div className="flex gap-2 mb-6 overflow-x-auto pb-2">
					{[
						{ id: "shipments", label: "الشحنات", icon: Package },
						{ id: "requests", label: "الطلبات", icon: FileCheck },
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
								activeTab === tab.id
									? "bg-[#690000] text-white shadow-lg"
									: "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
							}`}
						>
							<tab.icon size={20} />
							{tab.label}
						</button>
					))}
				</div>

				{/* Shipments Tab */}
				{activeTab === "shipments" && (
					<div className="space-y-6 pb-10">
						{/* Import Shipments */}
						<div>
							<h3 className="text-xl font-bold text-[#690000] mb-4 flex items-center gap-2">
								<FileText size={24} />
								شحنات الوارد ({importShipments.length})
							</h3>
							{importShipments.length === 0 ? (
								<div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500">
									لا توجد شحنات وارد
								</div>
							) : (
								<div className="grid gap-4">
									{importShipments.map((shipment) => (
										<a
											key={shipment._id}
											href={`/shipmentstatus/${shipment.acid}`}
											className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#690000]/30 transition-all flex items-center justify-between gap-4"
										>
											<div className="flex items-center gap-4">
												<div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
													<FileText className="text-red-800" size={24} />
												</div>
												<div>
													<div className="font-bold text-gray-800">{shipment.shipmentCode || shipment.acid || "N/A"}</div>
													<div className="text-sm text-gray-500">{shipment.port_name} • {new Date(shipment.createdAt).toLocaleDateString("ar-EG")}</div>
												</div>
											</div>
											<span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shipment.status)}`}>
												{shipment.status}
											</span>
										</a>
									))}
								</div>
							)}
						</div>

						{/* Export Shipments */}
						<div>
							<h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
								<Globe size={24} />
								شحنات الصادر ({exportShipments.length})
							</h3>
							{exportShipments.length === 0 ? (
								<div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500">
									لا توجد شحنات صادر
								</div>
							) : (
								<div className="grid gap-4">
									{exportShipments.map((shipment) => (
										<a
											key={shipment._id}
											href={`/export-shipment/${shipment._id}`}
											className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between gap-4"
										>
											<div className="flex items-center gap-4">
												<div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
													<Globe className="text-blue-800" size={24} />
												</div>
												<div>
													<div className="font-bold text-gray-800">{shipment.ucrRequestId?.requestNumber || "N/A"}</div>
													<div className="text-sm text-gray-500">{new Date(shipment.createdAt).toLocaleDateString("ar-EG")}</div>
												</div>
											</div>
											<span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shipment.currentStatus)}`}>
												{shipment.currentStatus}
											</span>
										</a>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				{/* Requests Tab */}
				{activeTab === "requests" && (
					<div className="space-y-6 pb-10">
						{/* ACID Requests */}
						<div>
							<h3 className="text-xl font-bold text-amber-600 mb-4 flex items-center gap-2">
								<FileCheck size={24} />
								طلبات ACID ({acidRequests.length})
							</h3>
							{acidRequests.length === 0 ? (
								<div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500">
									لا توجد طلبات ACID
								</div>
							) : (
								<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
									<table className="w-full">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الطلب</th>
												<th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الميناء</th>
												<th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
												<th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-100">
											{acidRequests.map((req) => (
												<tr key={req._id} className="hover:bg-gray-50">
													<td className="px-4 py-3 font-medium">{req.requestNumber || req._id.slice(-8)}</td>
													<td className="px-4 py-3">{req.portName || "N/A"}</td>
													<td className="px-4 py-3">
														<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
															{req.status}
														</span>
													</td>
													<td className="px-4 py-3 text-gray-500 text-sm">
														{new Date(req.createdAt).toLocaleDateString("ar-EG")}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* UCR Requests */}
						<div>
							<h3 className="text-xl font-bold text-teal-600 mb-4 flex items-center gap-2">
								<Globe size={24} />
								طلبات UCR ({ucrRequests.length})
							</h3>
							{ucrRequests.length === 0 ? (
								<div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500">
									لا توجد طلبات UCR
								</div>
							) : (
								<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
									<table className="w-full">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الطلب</th>
												<th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
												<th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-100">
											{ucrRequests.map((req) => (
												<tr key={req._id} className="hover:bg-gray-50">
													<td className="px-4 py-3 font-medium">{req.requestNumber || req._id.slice(-8)}</td>
													<td className="px-4 py-3">
														<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
															{req.status}
														</span>
													</td>
													<td className="px-4 py-3 text-gray-500 text-sm">
														{new Date(req.createdAt).toLocaleDateString("ar-EG")}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			<Footer />
		</div>
	);
};

export default ClientProfilePage;
