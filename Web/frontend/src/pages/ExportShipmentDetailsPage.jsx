import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import LoadingSpinner from "../components/LoadingSpinner";

// Status configurations
const STATUS_CONFIG = {
	pending_ucr: {
		label: "في انتظار UCR",
		color: "bg-gray-100 text-gray-800 border-gray-200",
		icon: "⏳",
		step: 1,
	},
	documents_submitted: {
		label: "المستندات مرفوعة",
		color: "bg-blue-100 text-blue-800 border-blue-200",
		icon: "📄",
		step: 2,
	},
	documents_verified: {
		label: "المستندات موثقة",
		color: "bg-indigo-100 text-indigo-800 border-indigo-200",
		icon: "✅",
		step: 3,
	},
	regulatory_check: {
		label: "الفحص التنظيمي",
		color: "bg-purple-100 text-purple-800 border-purple-200",
		icon: "🔍",
		step: 4,
	},
	customs_clearance: {
		label: "التخليص الجمركي",
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		icon: "🏛️",
		step: 5,
	},
	ready_to_ship: {
		label: "جاهز للشحن",
		color: "bg-cyan-100 text-cyan-800 border-cyan-200",
		icon: "📦",
		step: 6,
	},
	shipped: {
		label: "تم الشحن",
		color: "bg-green-100 text-green-800 border-green-200",
		icon: "🚀",
		step: 7,
	},
	completed: {
		label: "مكتمل",
		color: "bg-green-200 text-green-900 border-green-300",
		icon: "✨",
		step: 8,
	},
	on_hold: {
		label: "معلق",
		color: "bg-orange-100 text-orange-800 border-orange-200",
		icon: "⚠️",
		step: 0,
	},
	cancelled: {
		label: "ملغي",
		color: "bg-red-100 text-red-800 border-red-200",
		icon: "❌",
		step: -1,
	},
};

const STATUS_STEPS = [
	"pending_ucr",
	"documents_submitted",
	"documents_verified",
	"regulatory_check",
	"customs_clearance",
	"ready_to_ship",
	"shipped",
	"completed",
];

const ExportShipmentDetailsPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [shipment, setShipment] = useState(null);

	// Fetch shipment details
	const fetchShipmentDetails = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				toast.error("يجب تسجيل الدخول أولاً");
				navigate("/login");
				return;
			}

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/export-shipments/${id}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setShipment(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching shipment details:", error);
			if (error.response?.status === 404) {
				toast.error("الشحنة غير موجودة");
				navigate("/export-shipments");
			} else if (error.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else {
				toast.error("فشل في جلب تفاصيل الشحنة");
			}
		} finally {
			setLoading(false);
		}
	}, [id, navigate]);

	useEffect(() => {
		fetchShipmentDetails();
	}, [fetchShipmentDetails]);

	// Format date
	const formatDate = (dateStr) => {
		if (!dateStr) return "—";
		return new Date(dateStr).toLocaleDateString("ar-EG", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Format currency
	const formatCurrency = (value) => {
		if (!value && value !== 0) return "—";
		return new Intl.NumberFormat("ar-EG", {
			style: "currency",
			currency: "EGP",
		}).format(value);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
				<Header />
				<div className="flex-1 flex justify-center items-center">
					<LoadingSpinner />
				</div>
				<Footer />
			</div>
		);
	}

	if (!shipment) {
		return (
			<div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
				<Header />
				<div className="flex-1 flex flex-col justify-center items-center">
					<span className="text-5xl mb-4">❌</span>
					<p className="text-gray-600 mb-4">الشحنة غير موجودة</p>
					<button
						onClick={() => navigate("/export-shipments")}
						className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
					>
						العودة للشحنات
					</button>
				</div>
				<Footer />
			</div>
		);
	}

	const statusConfig = STATUS_CONFIG[shipment.currentStatus] || STATUS_CONFIG.pending_ucr;
	const currentStepIndex = STATUS_STEPS.indexOf(shipment.currentStatus);

	return (
		<div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
			<Header />

			<BackgroundContainer>
				<FormContainer
					title={
						<div className="flex items-center gap-3">
							<span className="text-2xl">
								{shipment.exportType === "air" ? "✈️" : "🚢"}
							</span>
							<span>تفاصيل الشحنة التصديرية</span>
						</div>
					}
				>
					{/* Back Button */}
					<button
						onClick={() => navigate("/export-shipments")}
						className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
					>
						<span>→</span>
						<span>العودة للشحنات</span>
					</button>

					{/* Status Header */}
					<div className="bg-gradient-to-l from-red-50 to-white p-6 rounded-lg border border-red-100 mb-6">
						<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
							<div className="flex items-center gap-4">
								<span className="text-4xl">{statusConfig.icon}</span>
								<div>
									<h3 className="text-xl font-bold text-gray-800">
										{shipment.exportShipmentNumber ||
											`شحنة #${shipment._id.slice(-8)}`}
									</h3>
									<p className="text-gray-500">
										آخر تحديث: {formatDate(shipment.updatedAt)}
									</p>
								</div>
							</div>
							<span
								className={`px-4 py-2 rounded-full text-sm font-medium border ${statusConfig.color}`}
							>
								{statusConfig.icon} {statusConfig.label}
							</span>
						</div>

						{/* Progress Tracker */}
						{!["cancelled", "on_hold"].includes(shipment.currentStatus) && (
							<div className="mt-6">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm text-gray-600">تقدم الشحنة</span>
									<span className="text-sm font-medium text-red-700">
										{Math.round(((currentStepIndex + 1) / STATUS_STEPS.length) * 100)}%
									</span>
								</div>
								<div className="h-3 bg-gray-200 rounded-full overflow-hidden">
									<div
										className="h-full bg-gradient-to-l from-green-500 to-green-400 transition-all duration-700"
										style={{
											width: `${((currentStepIndex + 1) / STATUS_STEPS.length) * 100}%`,
										}}
									/>
								</div>

								{/* Step Indicators */}
								<div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2">
									{STATUS_STEPS.map((step, index) => {
										const stepConfig = STATUS_CONFIG[step];
										const isCompleted = index < currentStepIndex;
										const isCurrent = index === currentStepIndex;

										return (
											<div
												key={step}
												className={`flex flex-col items-center p-2 rounded-lg ${
													isCurrent
														? "bg-red-100 border border-red-200"
														: isCompleted
														? "bg-green-50"
														: "bg-gray-50"
												}`}
											>
												<span
													className={`text-lg ${
														isCurrent
															? "scale-125"
															: isCompleted
															? "opacity-60"
															: "opacity-30"
													}`}
												>
													{stepConfig.icon}
												</span>
												<span className="text-xs text-center mt-1 text-gray-600">
													{stepConfig.label}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* Main Details Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						{/* Shipment Info */}
						<div className="bg-white p-4 rounded-lg border border-gray-200">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-red-700 rounded-full"></span>
								معلومات الشحنة
							</h4>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-gray-600">رقم الشحنة:</span>
									<span className="font-medium font-mono">
										{shipment.exportShipmentNumber || "—"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">نوع الشحن:</span>
									<span className="font-medium">
										{shipment.exportType === "air" ? "✈️ جوي" : "🚢 بحري"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">تاريخ الإنشاء:</span>
									<span className="font-medium">{formatDate(shipment.createdAt)}</span>
								</div>
								{shipment.estimatedShippingDate && (
									<div className="flex justify-between">
										<span className="text-gray-600">تاريخ الشحن المتوقع:</span>
										<span className="font-medium text-blue-600">
											{formatDate(shipment.estimatedShippingDate)}
										</span>
									</div>
								)}
								{shipment.actualShippingDate && (
									<div className="flex justify-between">
										<span className="text-gray-600">تاريخ الشحن الفعلي:</span>
										<span className="font-medium text-green-600">
											{formatDate(shipment.actualShippingDate)}
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Destination Info */}
						<div className="bg-white p-4 rounded-lg border border-gray-200">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-blue-700 rounded-full"></span>
								الوجهة
							</h4>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-gray-600">بلد الوجهة:</span>
									<span className="font-medium">{shipment.destinationCountry}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">
										{shipment.exportType === "air" ? "المطار:" : "الميناء:"}
									</span>
									<span className="font-medium">
										{shipment.destinationPort || "غير محدد"}
									</span>
								</div>
							</div>
						</div>

						{/* UCR Info */}
						{shipment.ucrRequestId && (
							<div className="bg-white p-4 rounded-lg border border-gray-200">
								<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
									<span className="w-2 h-2 bg-green-700 rounded-full"></span>
									طلب UCR المرتبط
								</h4>
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-gray-600">رقم UCR:</span>
										<span className="font-medium text-blue-600">
											{shipment.ucrRequestId.ucrNumber || "—"}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">نوع الشهادة:</span>
										<span
											className={`px-2 py-0.5 rounded text-sm ${
												shipment.ucrRequestId.certificationType === "noran"
													? "bg-green-100 text-green-800"
													: "bg-yellow-100 text-yellow-800"
											}`}
										>
											{shipment.ucrRequestId.certificationType === "noran"
												? "شهادة النوران"
												: "شهادة العميل"}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">القيمة:</span>
										<span className="font-medium">
											{formatCurrency(shipment.ucrRequestId.valueInEGP)}
										</span>
									</div>
									<button
										onClick={() =>
											navigate(`/ucr-request/${shipment.ucrRequestId._id}`)
										}
										className="w-full mt-2 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
									>
										عرض تفاصيل UCR
									</button>
								</div>
							</div>
						)}

						{/* Certificate of Origin */}
						<div className="bg-white p-4 rounded-lg border border-gray-200">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-purple-700 rounded-full"></span>
								شهادة المنشأ
							</h4>
							<div className="space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-gray-600">حالة الطلب:</span>
									<span
										className={`px-2 py-1 rounded text-sm ${
											shipment.certificateOfOrigin?.applied
												? "bg-green-100 text-green-800"
												: "bg-gray-100 text-gray-600"
										}`}
									>
										{shipment.certificateOfOrigin?.applied
											? "✅ تم التقديم"
											: "❌ لم يتم التقديم"}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-600">حالة الإصدار:</span>
									<span
										className={`px-2 py-1 rounded text-sm ${
											shipment.certificateOfOrigin?.issued
												? "bg-green-100 text-green-800"
												: "bg-yellow-100 text-yellow-800"
										}`}
									>
										{shipment.certificateOfOrigin?.issued
											? "✅ صادرة"
											: "⏳ لم تصدر بعد"}
									</span>
								</div>
								{shipment.certificateOfOrigin?.certificateNumber && (
									<div className="flex justify-between">
										<span className="text-gray-600">رقم الشهادة:</span>
										<span className="font-medium font-mono">
											{shipment.certificateOfOrigin.certificateNumber}
										</span>
									</div>
								)}
								{shipment.certificateOfOrigin?.issuedDate && (
									<div className="flex justify-between">
										<span className="text-gray-600">تاريخ الإصدار:</span>
										<span className="font-medium">
											{formatDate(shipment.certificateOfOrigin.issuedDate)}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Sea Shipment - Container Details */}
					{shipment.exportType === "sea" && shipment.containerDetails && (
						<div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="text-xl">🚢</span>
								تفاصيل الحاويات
							</h4>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<p className="text-xs text-blue-600">عدد الحاويات</p>
									<p className="text-xl font-bold text-blue-800">
										{shipment.containerDetails.count || 0}
									</p>
								</div>
								{shipment.containerDetails.type && (
									<div>
										<p className="text-xs text-blue-600">نوع الحاوية</p>
										<p className="font-medium text-blue-800">
											{shipment.containerDetails.type}
										</p>
									</div>
								)}
								{shipment.containerDetails.sealNumbers &&
									shipment.containerDetails.sealNumbers.length > 0 && (
										<div className="md:col-span-2">
											<p className="text-xs text-blue-600">أرقام الختم</p>
											<p className="font-mono text-sm text-blue-800">
												{shipment.containerDetails.sealNumbers.join(", ")}
											</p>
										</div>
									)}
							</div>
						</div>
					)}

					{/* Status History */}
					{shipment.statusHistory && shipment.statusHistory.length > 0 && (
						<div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-indigo-700 rounded-full"></span>
								سجل الحالات
							</h4>
							<div className="relative">
								{/* Timeline Line */}
								<div className="absolute right-4 top-2 bottom-2 w-0.5 bg-gray-200" />

								<div className="space-y-4">
									{shipment.statusHistory
										.slice()
										.reverse()
										.map((history, index) => {
											const historyConfig =
												STATUS_CONFIG[history.status] || STATUS_CONFIG.pending_ucr;
											return (
												<div key={index} className="flex gap-4 pr-2">
													{/* Timeline Dot */}
													<div
														className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
															index === 0
																? "bg-red-700 text-white"
																: "bg-gray-100 text-gray-600"
														}`}
													>
														{historyConfig.icon}
													</div>
													<div className="flex-1 bg-gray-50 p-3 rounded-lg">
														<div className="flex justify-between items-start">
															<div>
																<p className="font-medium">
																	{historyConfig.label}
																</p>
																{history.notes && (
																	<p className="text-sm text-gray-600 mt-1">
																		{history.notes}
																	</p>
																)}
															</div>
															<span className="text-xs text-gray-500">
																{formatDate(history.timestamp)}
															</span>
														</div>
													</div>
												</div>
											);
										})}
								</div>
							</div>
						</div>
					)}

					{/* Notes */}
					{shipment.notes && (
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
							<h4 className="font-bold text-gray-800 mb-2">ملاحظات</h4>
							<p className="text-gray-700">{shipment.notes}</p>
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end gap-3 border-t pt-4">
						<button
							onClick={() => navigate("/export-shipments")}
							className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
						>
							العودة للشحنات
						</button>
						{shipment.ucrRequestId?._id && (
							<button
								onClick={() => navigate(`/ucr-request/${shipment.ucrRequestId._id}`)}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								عرض طلب UCR
							</button>
						)}
					</div>
				</FormContainer>
			</BackgroundContainer>

			<Footer />
		</div>
	);
};

export default ExportShipmentDetailsPage;
