import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ExportShipmentHistory = () => {
	const { shipmentId } = useParams();
	const navigate = useNavigate();
	const [shipment, setShipment] = useState(null);
	const [statusHistory, setStatusHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);

	const token = localStorage.getItem("token");

	// Status translations for export shipments
	const statusTranslations = {
		documents_verification: "التحقق من المستندات",
		regulatory_inspection: "فحص الجهات الرقابية",
		payment_cleared: "تم السداد",
		goods_loaded: "تم التحميل",
		in_transit: "في الطريق",
		delivered: "تم التسليم",
		completed: "مكتمل",
		cancelled: "ملغي",
	};

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
				`${import.meta.env.VITE_API_URL}/api/export-shipments/${shipmentId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			// API returns { success: true, shipment: {...} }
			const shipmentData = shipmentResponse.data?.shipment || shipmentResponse.data;
			setShipment(shipmentData);
			
			// Status history is included in the shipment data
			if (shipmentData?.statusHistory) {
				setStatusHistory(shipmentData.statusHistory);
			}

			// Also try dedicated history endpoint
			try {
				const historyResponse = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/export-shipments/${shipmentId}/history`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				if (historyResponse.data?.statusHistory?.length > 0) {
					setStatusHistory(historyResponse.data.statusHistory);
				}
			} catch (historyError) {
				console.log("Could not fetch status history from dedicated endpoint:", historyError);
			}

			setLoading(false);
		} catch (error) {
			console.error("Error fetching export shipment history:", error);
			toast.error("فشل تحميل تاريخ الشحنة");
			setLoading(false);
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "completed":
			case "مكتمل":
				return "bg-green-100 text-green-800 border-green-300";
			case "delivered":
			case "تم التسليم":
				return "bg-emerald-100 text-emerald-800 border-emerald-300";
			case "in_transit":
			case "في الطريق":
				return "bg-blue-100 text-blue-800 border-blue-300";
			case "goods_loaded":
			case "تم التحميل":
				return "bg-cyan-100 text-cyan-800 border-cyan-300";
			case "payment_cleared":
			case "تم السداد":
				return "bg-indigo-100 text-indigo-800 border-indigo-300";
			case "regulatory_inspection":
			case "فحص الجهات الرقابية":
				return "bg-purple-100 text-purple-800 border-purple-300";
			case "documents_verification":
			case "التحقق من المستندات":
				return "bg-orange-100 text-orange-800 border-orange-300";
			case "cancelled":
			case "ملغي":
				return "bg-red-100 text-red-800 border-red-300";
			default:
				return "bg-gray-100 text-gray-800 border-gray-300";
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "completed":
			case "مكتمل":
				return "✅";
			case "delivered":
			case "تم التسليم":
				return "📦";
			case "in_transit":
			case "في الطريق":
				return "🚢";
			case "goods_loaded":
			case "تم التحميل":
				return "📦";
			case "payment_cleared":
			case "تم السداد":
				return "💰";
			case "regulatory_inspection":
			case "فحص الجهات الرقابية":
				return "🔍";
			case "documents_verification":
			case "التحقق من المستندات":
				return "📋";
			case "cancelled":
			case "ملغي":
				return "❌";
			default:
				return "📋";
		}
	};

	const translateStatus = (status) => {
		return statusTranslations[status] || status;
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
								📜 تاريخ شحنة التصدير
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
								<p className="text-sm text-gray-500 mb-1">رقم الشحنة</p>
								<p className="font-bold text-gray-900 text-lg">
									{shipment.shipmentNumber}
								</p>
							</div>
							<div className="text-center">
								<p className="text-sm text-gray-500 mb-1">الحالة الحالية</p>
								<span
									className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(
										shipment.currentStatus
									)}`}
								>
									{getStatusIcon(shipment.currentStatus)}{" "}
									{translateStatus(shipment.currentStatus)}
								</span>
							</div>
							<div className="text-center">
								<p className="text-sm text-gray-500 mb-1">الدولة</p>
								<p className="font-bold text-gray-900">
									{shipment.destinationCountry}
								</p>
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
										إنشاء شحنة التصدير
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

							{/* Status History Events */}
							{statusHistory.map((entry, index) => (
								<div
									key={index}
									className="relative flex items-start gap-4 mb-8"
								>
									<div
										className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold z-10 ${
											index === 0 ? "bg-green-600" : "bg-gray-500"
										}`}
									>
										{getStatusIcon(entry.status)}
									</div>
									<div
										className={`flex-1 border-2 rounded-lg p-4 ${
											index === 0
												? "bg-green-50 border-green-200"
												: "bg-gray-50 border-gray-200"
										}`}
									>
										<h3 className="font-bold text-gray-900 text-lg mb-1">
											{translateStatus(entry.status)}
										</h3>
										{entry.notes && (
											<p className="text-sm text-gray-600 mb-2">
												{entry.notes}
											</p>
										)}
										<p className="text-xs text-gray-500">
											📅{" "}
											{new Date(entry.changedAt).toLocaleDateString("ar-EG", {
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
										{entry.changedBy && (
											<p className="text-xs text-gray-400 mt-1">
												تم التحديث بواسطة:{" "}
												{entry.changedBy.username ||
													entry.changedBy.fullname ||
													"موظف"}
											</p>
										)}
									</div>
								</div>
							))}

							{/* Assigned Employee */}
							{shipment.assignedEmployee && (
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
												{shipment.assignedEmployee.username ||
													shipment.assignedEmployee.fullname ||
													"موظف"}
											</span>
										</p>
										{shipment.assignedEmployee.email && (
											<p className="text-xs text-gray-500">
												📧 {shipment.assignedEmployee.email}
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
							📄 المستندات المطلوبة
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
													{new Date(doc.requestedAt).toLocaleDateString("ar-EG")}
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
								<p className="text-gray-500">لا توجد مستندات مطلوبة</p>
							</div>
						)}
					</div>

					{/* Shipment Details */}
					<div className="bg-white p-6 rounded-2xl shadow-sm">
						<h2 className="text-2xl font-bold text-red-900 mb-6">
							ℹ️ تفاصيل الشحنة
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="p-4 bg-gray-50 rounded-lg">
								<p className="text-sm text-gray-500 mb-1">رقم UCR</p>
								<p className="font-semibold text-gray-900">
									{shipment.ucrNumber}
								</p>
							</div>
							<div className="p-4 bg-gray-50 rounded-lg">
								<p className="text-sm text-gray-500 mb-1">طريقة الشحن</p>
								<p className="font-semibold text-gray-900">
									{shipment.shippingMethod === "air" ? "✈️ جوي" : "🚢 بحري"}
								</p>
							</div>
							{shipment.destinationPort && (
								<div className="p-4 bg-gray-50 rounded-lg">
									<p className="text-sm text-gray-500 mb-1">ميناء الوصول</p>
									<p className="font-semibold text-gray-900">
										{shipment.destinationPort}
									</p>
								</div>
							)}
							<div className="p-4 bg-gray-50 rounded-lg">
								<p className="text-sm text-gray-500 mb-1">عدد الطرود</p>
								<p className="font-semibold text-gray-900">
									{shipment.packagesCount}
								</p>
							</div>
							<div className="p-4 bg-gray-50 rounded-lg">
								<p className="text-sm text-gray-500 mb-1">الوزن الكلي</p>
								<p className="font-semibold text-gray-900">
									{shipment.totalWeight} كجم
								</p>
							</div>
							<div className="p-4 bg-gray-50 rounded-lg">
								<p className="text-sm text-gray-500 mb-1">القيمة</p>
								<p className="font-semibold text-gray-900">
									{shipment.valueInEGP} جنيه
								</p>
							</div>
							{shipment.containersCount > 0 && (
								<div className="p-4 bg-gray-50 rounded-lg">
									<p className="text-sm text-gray-500 mb-1">عدد الحاويات</p>
									<p className="font-semibold text-gray-900">
										{shipment.containersCount}
									</p>
								</div>
							)}
							{shipment.billOfLadingNumber && (
								<div className="p-4 bg-gray-50 rounded-lg">
									<p className="text-sm text-gray-500 mb-1">رقم بوليصة الشحن</p>
									<p className="font-semibold text-gray-900">
										{shipment.billOfLadingNumber}
									</p>
								</div>
							)}
							{shipment.awbNumber && (
								<div className="p-4 bg-gray-50 rounded-lg">
									<p className="text-sm text-gray-500 mb-1">رقم AWB</p>
									<p className="font-semibold text-gray-900">
										{shipment.awbNumber}
									</p>
								</div>
							)}
							{shipment.form46Number && (
								<div className="p-4 bg-gray-50 rounded-lg">
									<p className="text-sm text-gray-500 mb-1">رقم نموذج 46</p>
									<p className="font-semibold text-gray-900">
										{shipment.form46Number}
									</p>
								</div>
							)}
							{(shipment.exportFee > 0 ||
								shipment.serviceFees > 0 ||
								shipment.totalFees > 0) && (
								<>
									{shipment.exportFee > 0 && (
										<div className="p-4 bg-gray-50 rounded-lg">
											<p className="text-sm text-gray-500 mb-1">رسوم التصدير</p>
											<p className="font-semibold text-gray-900">
												{shipment.exportFee} جنيه
											</p>
										</div>
									)}
									{shipment.serviceFees > 0 && (
										<div className="p-4 bg-gray-50 rounded-lg">
											<p className="text-sm text-gray-500 mb-1">رسوم الخدمة</p>
											<p className="font-semibold text-gray-900">
												{shipment.serviceFees} جنيه
											</p>
										</div>
									)}
									{shipment.totalFees > 0 && (
										<div className="p-4 bg-gray-50 rounded-lg">
											<p className="text-sm text-gray-500 mb-1">
												إجمالي الرسوم
											</p>
											<p className="font-semibold text-gray-900">
												{shipment.totalFees} جنيه
											</p>
										</div>
									)}
								</>
							)}
						</div>

						{/* Description */}
						{shipment.generalDescription && (
							<div className="mt-4 p-4 bg-gray-50 rounded-lg">
								<p className="text-sm text-gray-500 mb-1">وصف البضاعة</p>
								<p className="font-semibold text-gray-900">
									{shipment.generalDescription}
								</p>
							</div>
						)}

						{/* Notes */}
						{(shipment.clientNotes || shipment.employeeNotes) && (
							<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
								{shipment.clientNotes && (
									<div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
										<p className="text-sm text-yellow-700 mb-1">
											ملاحظات العميل
										</p>
										<p className="font-semibold text-gray-900">
											{shipment.clientNotes}
										</p>
									</div>
								)}
								{shipment.employeeNotes && (
									<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
										<p className="text-sm text-blue-700 mb-1">
											ملاحظات الموظف
										</p>
										<p className="font-semibold text-gray-900">
											{shipment.employeeNotes}
										</p>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default ExportShipmentHistory;
