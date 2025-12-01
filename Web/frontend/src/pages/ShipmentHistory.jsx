import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ShipmentHistory = () => {
	const { shipmentId } = useParams();
	const navigate = useNavigate();
	const [shipment, setShipment] = useState(null);
	const [uploads, setUploads] = useState([]);
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);

	const token = localStorage.getItem("token");

	useEffect(() => {
		// Get user from localStorage
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);
		} else {
			toast.error("يجب تسجيل الدخول أولاً");
			navigate("/login");
		}
	}, [navigate]);

	useEffect(() => {
		if (shipmentId && token) {
			fetchShipmentHistory();
		}
	}, [shipmentId, token]);

	const fetchShipmentHistory = async () => {
		try {
			setLoading(true);

			// Fetch shipment details
			const shipmentResponse = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			setShipment(shipmentResponse.data);

			// Fetch uploads/documents related to this shipment
			try {
				const uploadsResponse = await axios.get(
					`${
						import.meta.env.VITE_API_URL
					}/api/uploads?category=shipment&relatedId=${
						shipmentResponse.data._id
					}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				setUploads(uploadsResponse.data?.uploads || []);
			} catch (uploadError) {
				console.log("Could not fetch uploads:", uploadError);
				setUploads([]);
			}

			setLoading(false);
		} catch (error) {
			console.error("Error fetching shipment history:", error);
			toast.error("فشل تحميل تاريخ الشحنة");
			setLoading(false);
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "Completed":
			case "تمت بنجاح":
				return "bg-green-100 text-green-800 border-green-300";
			case "In Transit":
			case "في الطريق":
				return "bg-blue-100 text-blue-800 border-blue-300";
			case "Arrived":
			case "Customs Clearance":
			case "جاري الكشف والتثمين":
			case "في انتظار وصول الإذن":
				return "bg-yellow-100 text-yellow-800 border-yellow-300";
			case "Pending":
			case "في انتظار الشحن":
				return "bg-gray-100 text-gray-800 border-gray-300";
			default:
				return "bg-gray-100 text-gray-800 border-gray-300";
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "Completed":
			case "تمت بنجاح":
				return "✅";
			case "In Transit":
			case "في الطريق":
				return "🚢";
			case "Arrived":
				return "📦";
			case "Customs Clearance":
			case "جاري الكشف والتثمين":
				return "🔍";
			case "في انتظار وصول الإذن":
				return "⏳";
			case "Pending":
			case "في انتظار الشحن":
				return "⏸️";
			default:
				return "📋";
		}
	};

	const handleDownloadDocument = async (fileId, fileName) => {
		try {
			toast.loading("جاري تحميل المستند...");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${fileId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			toast.dismiss();
			const fileUrl =
				response.data?.upload?.presignedUrl || response.data?.presignedUrl;
			if (fileUrl) {
				window.open(fileUrl, "_blank");
			} else {
				toast.error("لم يتم العثور على رابط الملف");
			}
		} catch (error) {
			console.error("Error downloading document:", error);
			toast.dismiss();
			toast.error("فشل تحميل المستند");
		}
	};

	if (loading) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<Header />
				<div className="flex justify-center items-center py-12 gap-4">
					<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
					<span className="text-gray-600 text-lg">جاري التحميل...</span>
				</div>
			</div>
		);
	}

	if (!shipment) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
						<div className="text-center">
							<p className="text-red-600 text-lg mb-4">
								لم يتم العثور على الشحنة
							</p>
							<button
								onClick={() => navigate(-1)}
								className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-900 transition"
							>
								← العودة
							</button>
						</div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="bg-gray-50 min-h-screen">
			<Header />

			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="max-w-5xl mx-auto">
					{/* Header */}
					<div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
						<div className="flex items-center justify-between mb-4">
							<h1 className="text-3xl font-bold text-red-900">
								📜 تاريخ الشحنة
							</h1>
							<button
								onClick={() => navigate(-1)}
								className="text-gray-600 hover:text-red-800 text-sm font-medium flex items-center gap-2"
							>
								<span>←</span>
								<span>العودة</span>
							</button>
						</div>

						{/* Shipment Basic Info */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
							<div className="text-center">
								<p className="text-sm text-gray-500 mb-1">رقم ACID</p>
								<p className="font-bold text-gray-900 text-lg">
									{shipment.acid}
								</p>
							</div>
							<div className="text-center">
								<p className="text-sm text-gray-500 mb-1">الحالة الحالية</p>
								<span
									className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(
										shipment.status
									)}`}
								>
									{getStatusIcon(shipment.status)} {shipment.status}
								</span>
							</div>
							<div className="text-center">
								<p className="text-sm text-gray-500 mb-1">الدولة</p>
								<p className="font-bold text-gray-900">{shipment.country}</p>
							</div>
						</div>
					</div>

					{/* Timeline Section */}
					<div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
						<h2 className="text-2xl font-bold text-red-900 mb-6">
							⏱️ المراحل الزمنية
						</h2>

						<div className="relative">
							{/* Timeline Line */}
							<div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>

							{/* Creation Event */}
							<div className="relative flex items-start gap-4 mb-8">
								<div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold z-10">
									🆕
								</div>
								<div className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
									<h3 className="font-bold text-gray-900 text-lg mb-1">
										إنشاء الشحنة
									</h3>
									<p className="text-sm text-gray-600 mb-2">
										تم إنشاء الشحنة في النظام
									</p>
									<p className="text-xs text-gray-500">
										📅{" "}
										{new Date(shipment.createdAt).toLocaleDateString("ar-EG", {
											weekday: "long",
											year: "numeric",
											month: "long",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
							</div>

							{/* Current Status Event */}
							<div className="relative flex items-start gap-4 mb-8">
								<div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold z-10">
									{getStatusIcon(shipment.status)}
								</div>
								<div className="flex-1 bg-green-50 border-2 border-green-200 rounded-lg p-4">
									<h3 className="font-bold text-gray-900 text-lg mb-1">
										الحالة: {shipment.status}
									</h3>
									<p className="text-sm text-gray-600 mb-2">آخر تحديث للشحنة</p>
									<p className="text-xs text-gray-500">
										📅{" "}
										{new Date(shipment.updatedAt).toLocaleDateString("ar-EG", {
											weekday: "long",
											year: "numeric",
											month: "long",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
							</div>

							{/* Assigned Employee */}
							{shipment.employee_id && (
								<div className="relative flex items-start gap-4 mb-8">
									<div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold z-10">
										👔
									</div>
									<div className="flex-1 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
										<h3 className="font-bold text-gray-900 text-lg mb-1">
											تعيين موظف
										</h3>
										<p className="text-sm text-gray-600 mb-2">
											تم تعيين:{" "}
											<span className="font-semibold">
												{shipment.employee_id.username ||
													shipment.employee_id.fullname ||
													"موظف"}
											</span>
										</p>
										{shipment.employee_id.email && (
											<p className="text-xs text-gray-500">
												📧 {shipment.employee_id.email}
											</p>
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Documents Section */}
					<div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
						<h2 className="text-2xl font-bold text-red-900 mb-6">
							📄 المستندات المرفقة
						</h2>

						{shipment.requiredDocuments &&
						shipment.requiredDocuments.length > 0 ? (
							<div className="space-y-3">
								{shipment.requiredDocuments.map((doc, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-red-300 transition-all"
									>
										<div className="flex items-center gap-3">
											<span
												className={`px-3 py-1 rounded-full text-sm font-semibold ${
													doc.uploaded
														? "bg-green-100 text-green-800"
														: "bg-yellow-100 text-yellow-800"
												}`}
											>
												{doc.uploaded ? "✓ مرفوع" : "⏳ مطلوب"}
											</span>
											{doc.uploaded && doc.fileId && (
												<button
													onClick={() =>
														handleDownloadDocument(doc.fileId, doc.name)
													}
													className="text-blue-600 hover:text-blue-800 text-sm font-medium underline flex items-center gap-1"
												>
													<span>📥</span>
													<span>تحميل</span>
												</button>
											)}
										</div>
										<div className="text-right">
											<p className="font-bold text-gray-900">{doc.name}</p>
											{doc.uploadedAt && (
												<p className="text-sm text-gray-500">
													{new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
												</p>
											)}
											{!doc.uploaded && doc.requestedAt && (
												<p className="text-sm text-gray-500">
													تم الطلب:{" "}
													{new Date(doc.requestedAt).toLocaleDateString(
														"ar-EG"
													)}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 bg-gray-50 rounded-lg">
								<svg
									className="w-16 h-16 mx-auto text-gray-400 mb-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
									/>
								</svg>
								<p className="text-gray-500">لا توجد مستندات مرفقة</p>
							</div>
						)}
					</div>

					{/* Uploaded Files from S3 */}
					{uploads.length > 0 && (
						<div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
							<h2 className="text-2xl font-bold text-red-900 mb-6">
								📎 ملفات إضافية
							</h2>
							<div className="space-y-3">
								{uploads.map((upload, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-red-300 transition-all"
									>
										<button
											onClick={() =>
												handleDownloadDocument(upload._id, upload.originalname)
											}
											className="text-blue-600 hover:text-blue-800 text-sm font-medium underline flex items-center gap-2"
										>
											<span>📥</span>
											<span>تحميل</span>
										</button>
										<div className="text-right">
											<p className="font-bold text-gray-900">
												{upload.originalname || upload.filename}
											</p>
											<p className="text-sm text-gray-500">
												{new Date(
													upload.uploadedAt || upload.createdAt
												).toLocaleDateString("ar-EG")}
											</p>
											{upload.documentType && (
												<span className="text-xs text-gray-400">
													{upload.documentType}
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Shipment Details */}
					<div className="bg-white p-6 rounded-2xl shadow-sm">
						<h2 className="text-2xl font-bold text-red-900 mb-6">
							ℹ️ تفاصيل الشحنة
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="p-4 bg-gray-50 rounded-lg">
								<p className="text-sm text-gray-500 mb-1">الميناء</p>
								<p className="font-semibold text-gray-900">
									{shipment.port_name}
								</p>
							</div>
							<div className="p-4 bg-gray-50 rounded-lg">
								<p className="text-sm text-gray-500 mb-1">عدد الحاويات</p>
								<p className="font-semibold text-gray-900">
									{shipment.num_of_containers}
								</p>
							</div>
							{shipment.type_of_containers &&
								shipment.type_of_containers.length > 0 && (
									<div className="p-4 bg-gray-50 rounded-lg">
										<p className="text-sm text-gray-500 mb-1">أنواع الحاويات</p>
										<p className="font-semibold text-gray-900">
											{shipment.type_of_containers.join(", ")}
										</p>
									</div>
								)}
							{shipment.number46 && (
								<div className="p-4 bg-gray-50 rounded-lg">
									<p className="text-sm text-gray-500 mb-1">رقم البوليصة</p>
									<p className="font-semibold text-gray-900">
										{shipment.number46}
									</p>
								</div>
							)}
							{(shipment.clearance_fees > 0 ||
								shipment.expenses_and_tips > 0 ||
								shipment.sundries > 0) && (
								<>
									{shipment.clearance_fees > 0 && (
										<div className="p-4 bg-gray-50 rounded-lg">
											<p className="text-sm text-gray-500 mb-1">رسوم التخليص</p>
											<p className="font-semibold text-gray-900">
												{shipment.clearance_fees} جنيه
											</p>
										</div>
									)}
									{shipment.expenses_and_tips > 0 && (
										<div className="p-4 bg-gray-50 rounded-lg">
											<p className="text-sm text-gray-500 mb-1">
												المصروفات والإكراميات
											</p>
											<p className="font-semibold text-gray-900">
												{shipment.expenses_and_tips} جنيه
											</p>
										</div>
									)}
									{shipment.sundries > 0 && (
										<div className="p-4 bg-gray-50 rounded-lg">
											<p className="text-sm text-gray-500 mb-1">
												مصروفات متنوعة
											</p>
											<p className="font-semibold text-gray-900">
												{shipment.sundries} جنيه
											</p>
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default ShipmentHistory;
