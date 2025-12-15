import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Datafield from "../components/DataField";
import contractIcon from "../assets/images/contract.png";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";

// Status configurations - aligned with backend ExportShipment model
const STATUS_CONFIG = {
	documents_verification: {
		label: "التحقق من المستندات",
		color: "bg-blue-100 text-blue-800 border-blue-200",
		icon: "📄",
		step: 1,
	},
	regulatory_inspection: {
		label: "فحص الجهات الرقابية",
		color: "bg-purple-100 text-purple-800 border-purple-200",
		icon: "🔍",
		step: 2,
	},
	payment_cleared: {
		label: "تم السداد",
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		icon: "💳",
		step: 3,
	},
	goods_loaded: {
		label: "تم التحميل",
		color: "bg-cyan-100 text-cyan-800 border-cyan-200",
		icon: "📦",
		step: 4,
	},
	in_transit: {
		label: "في الطريق",
		color: "bg-orange-100 text-orange-800 border-orange-200",
		icon: "🚚",
		step: 5,
	},
	delivered: {
		label: "تم التسليم",
		color: "bg-green-100 text-green-800 border-green-200",
		icon: "✅",
		step: 6,
	},
	completed: {
		label: "مكتمل",
		color: "bg-green-200 text-green-900 border-green-300",
		icon: "✨",
		step: 7,
	},
	cancelled: {
		label: "ملغي",
		color: "bg-red-100 text-red-800 border-red-200",
		icon: "❌",
		step: -1,
	},
};

// Status flow - 7 steps for progress stepper
const STATUS_STEPS = [
	{ key: "documents_verification", label: "التحقق من المستندات" },
	{ key: "regulatory_inspection", label: "فحص الجهات الرقابية" },
	{ key: "payment_cleared", label: "تم السداد" },
	{ key: "goods_loaded", label: "تم التحميل" },
	{ key: "in_transit", label: "في الطريق" },
	{ key: "delivered", label: "تم التسليم" },
	{ key: "completed", label: "مكتمل" },
];

// Export Shipment Stepper Component (matching ShipmentStatus.jsx design)
const ExportStepper = ({ currentStatus }) => {
	const getStepIndex = (status) => {
		const index = STATUS_STEPS.findIndex((s) => s.key === status);
		return index >= 0 ? index : 0;
	};

	const activeStepIndex = getStepIndex(currentStatus);

	// Special case for cancelled
	if (currentStatus === "cancelled") {
		return (
			<div className="w-full py-4">
				<div className="bg-red-50 border-red-200 border rounded-lg p-4 text-center">
					<span className="text-3xl mb-2 block">❌</span>
					<p className="text-red-800 font-bold">تم إلغاء الشحنة</p>
				</div>
			</div>
		);
	}

	// Show 7 steps with scroll on mobile
	return (
		<div className="w-full pb-4">
			<div className="flex items-start justify-between py-6 px-2 overflow-x-auto">
				{STATUS_STEPS.map((step, index) => {
					const isActive = index <= activeStepIndex;
					const isCurrent = index === activeStepIndex;
					const isLastStep = index === STATUS_STEPS.length - 1;

					const circleClass = isActive
						? isCurrent
							? "bg-red-900 ring-4 ring-red-200"
							: "bg-red-900"
						: "bg-gray-300";
					const textClass = isActive
						? "text-red-900 font-bold"
						: "text-gray-400";
					const nextStepIsActive =
						index < STATUS_STEPS.length - 1 && index + 1 <= activeStepIndex;
					const lineClass = nextStepIsActive ? "bg-red-900" : "bg-gray-300";

					return (
						<React.Fragment key={step.key}>
							<div className="flex flex-col items-center text-center flex-shrink-0" style={{ minWidth: "70px" }}>
								<div
									className={`w-10 h-10 rounded-full transition-all duration-500 ${circleClass} relative z-10 flex items-center justify-center`}
								>
									{isActive && (
										<span className="text-white text-lg">
											{isCurrent ? "●" : "✓"}
										</span>
									)}
								</div>
								<p
									className={`mt-3 text-xs ${textClass} px-1 max-w-[80px]`}
									style={{ lineHeight: "1.3" }}
								>
									{step.label}
								</p>
							</div>
							{!isLastStep && (
								<div
									className={`h-1.5 transition-colors duration-500 ${lineClass} self-start flex-shrink-0`}
									style={{
										width: "40px",
										marginTop: "18px",
									}}
								/>
							)}
						</React.Fragment>
					);
				})}
			</div>
		</div>
	);
};

const ExportShipmentDetailsPage = () => {
	const { shipmentId, id } = useParams();
	const actualId = shipmentId || id; // Support both parameter names
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [shipment, setShipment] = useState(null);
	const [userType, setUserType] = useState("client");

	// Check user type
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const user = JSON.parse(storedUser);
			setUserType(user.type || "client");
		}
	}, []);

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
				`${import.meta.env.VITE_API_URL}/api/export-shipments/${actualId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setShipment(response.data.shipment || response.data.data);
			}
		} catch (error) {
			console.error("Error fetching shipment details:", error);
			if (error.response?.status === 404) {
				toast.error("الشحنة غير موجودة");
				navigate(userType === "employee" ? "/employee/export-shipments" : "/export-shipments");
			} else if (error.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else {
				toast.error("فشل في جلب تفاصيل الشحنة");
			}
		} finally {
			setLoading(false);
		}
	}, [actualId, navigate, userType]);

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
			<div className="bg-gray-50 min-h-screen text-gray-800">
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm">
						<div className="flex justify-center items-center py-12 gap-4">
							<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
							<span className="text-gray-600 text-lg">
								جاري تحميل بيانات الشحنة...
							</span>
						</div>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	if (!shipment) {
		return (
			<div className="bg-gray-50 min-h-screen text-gray-800">
				<Header />
				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm text-center">
						<span className="text-6xl mb-4 block">❌</span>
						<p className="text-gray-600 mb-4 text-lg">الشحنة غير موجودة</p>
						<button
							onClick={() =>
								navigate(
									userType === "employee"
										? "/employee/export-shipments"
										: "/export-shipments"
								)
							}
							className="px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-700 transition font-bold"
						>
							العودة للشحنات
						</button>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	const statusConfig = STATUS_CONFIG[shipment.currentStatus] || STATUS_CONFIG.documents_verification;
	const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === shipment.currentStatus);
	const progressPercent = Math.round(((currentStepIndex + 1) / STATUS_STEPS.length) * 100);

	return (
		<div className="bg-gray-50 min-h-screen text-gray-800">
			<Header />

			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm">
					{/* Back Button */}
					<button
						onClick={() =>
							navigate(
								userType === "employee"
									? "/employee/export-shipments"
									: "/export-shipments"
							)
						}
						className="mb-6 text-red-800 hover:text-red-600 flex items-center gap-2 font-medium"
					>
						<span>→</span>
						<span>العودة للشحنات</span>
					</button>

					{/* Header with Status Badge */}
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-4">
							<span className="text-4xl">
								{shipment.shippingMethod === "air" ? "✈️" : "🚢"}
							</span>
							<div>
								<h1 className="text-2xl font-bold text-gray-800">
									شحنة تصديرية - {shipment.shippingMethod === "air" ? "جوي" : "بحري"}
								</h1>
								<p className="text-gray-500 text-sm">
									رقم الشحنة: {shipment.shipmentNumber || `#${shipment._id?.slice(-8)}`}
								</p>
							</div>
						</div>
						<span
							className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${statusConfig.color}`}
						>
							{statusConfig.icon} {statusConfig.label}
						</span>
					</div>

					{/* Top Illustration */}
					<div className="flex justify-center mb-8">
						<img
							src={mainIllustration}
							alt="Export Shipment Illustration"
							className="w-full max-w-md h-auto"
						/>
					</div>

					{/* Progress Stepper */}
					<div className="bg-gray-50 rounded-xl p-6 mb-8">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold text-red-900">📊 حالة الشحنة</h2>
							{currentStepIndex >= 0 && (
								<span className="text-sm font-bold text-red-800 bg-red-100 px-3 py-1 rounded-full">
									{progressPercent}% مكتمل
								</span>
							)}
						</div>
						<ExportStepper currentStatus={shipment.currentStatus} />
					</div>

					{/* Cancel Reason */}
					{shipment.currentStatus === "cancelled" && shipment.notes && (
						<div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
							<p className="font-bold text-red-800 mb-2">❌ سبب الإلغاء:</p>
							<p className="text-red-700">{shipment.notes}</p>
						</div>
					)}

					{/* UCR Number Display (if issued) */}
					{shipment.ucrRequestId?.ucrNumber && (
						<div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 mb-6 text-center">
							<p className="font-bold text-indigo-800 mb-2">📋 رقم UCR</p>
							<p className="text-3xl font-mono text-indigo-900">
								{shipment.ucrRequestId.ucrNumber}
							</p>
						</div>
					)}

					{/* Data Fields Section */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-8 mb-8">
						<Datafield
							label="رقم الشحنة"
							value={shipment.shipmentNumber || "—"}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						<Datafield
							label="نوع الشحن"
							value={shipment.shippingMethod === "air" ? "✈️ جوي" : "🚢 بحري"}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						<Datafield
							label="بلد الوجهة"
							value={shipment.destinationCountry || "غير محدد"}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						<Datafield
							label={shipment.shippingMethod === "air" ? "المطار" : "الميناء"}
							value={shipment.destinationPort || "غير محدد"}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						{shipment.ucrRequestId?.valueInEGP && (
							<Datafield
								label="قيمة البضاعة"
								value={formatCurrency(shipment.ucrRequestId.valueInEGP)}
								icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
							/>
						)}
						{shipment.ucrRequestId?.certificationType && (
							<Datafield
								label="نوع الشهادة"
								value={
									shipment.ucrRequestId.certificationType === "noran"
										? "🟢 شهادة النوران"
										: "🟡 شهادة العميل"
								}
								icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
							/>
						)}
						<Datafield
							label="تاريخ الإنشاء"
							value={formatDate(shipment.createdAt)}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						<Datafield
							label="آخر تحديث"
							value={formatDate(shipment.updatedAt)}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
						{shipment.estimatedShippingDate && (
							<Datafield
								label="تاريخ الشحن المتوقع"
								value={formatDate(shipment.estimatedShippingDate)}
								icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
							/>
						)}
						{shipment.actualShippingDate && (
							<Datafield
								label="تاريخ الشحن الفعلي"
								value={formatDate(shipment.actualShippingDate)}
								icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
							/>
						)}
					</div>

					{/* Certificate of Origin Section */}
					<div className="bg-purple-50 rounded-xl p-6 mb-6">
						<h3 className="font-bold text-purple-800 mb-4">📜 شهادة المنشأ</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="bg-white p-3 rounded-lg border border-purple-200">
								<p className="text-xs text-gray-500">حالة الشهادة</p>
								<p className={`font-bold ${
									shipment.certificateOfOriginStatus === "issued" ? "text-green-600" : 
									shipment.certificateOfOriginStatus === "pending" ? "text-yellow-600" : 
									"text-gray-400"
								}`}>
									{shipment.certificateOfOriginStatus === "issued" ? "✅ صادرة" : 
									 shipment.certificateOfOriginStatus === "pending" ? "⏳ قيد الإصدار" : 
									 "❌ لم يتم التقديم"}
								</p>
							</div>
							{shipment.certificateOfOriginNumber && (
								<div className="bg-white p-3 rounded-lg border border-purple-200">
									<p className="text-xs text-gray-500">رقم الشهادة</p>
									<p className="font-mono font-bold text-purple-800">
										{shipment.certificateOfOriginNumber}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Sea Shipment: Container Info */}
					{shipment.shippingMethod === "sea" && shipment.containerWeights && shipment.containerWeights.length > 0 && (
						<div className="bg-blue-50 rounded-xl p-6 mb-6">
							<h3 className="font-bold text-blue-800 mb-3">
								🚢 أوزان الحاويات ({shipment.containerWeights.length} حاوية)
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
								{shipment.containerWeights.map((container, idx) => (
									<div key={idx} className="bg-white p-3 rounded-lg border border-blue-200">
										<p className="text-xs text-blue-600">
											{container.containerNumber || `حاوية ${idx + 1}`}
										</p>
										<p className="text-xl font-bold text-blue-800">
											{container.weight?.toLocaleString() || container} {container.unit || "كجم"}
										</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Status History */}
					{shipment.statusHistory && shipment.statusHistory.length > 0 && (
						<div className="bg-gray-50 rounded-xl p-6 mb-6">
							<h3 className="font-bold text-gray-800 mb-4">📋 سجل الحالات</h3>
							<div className="relative">
								{/* Timeline Line */}
								<div className="absolute right-4 top-2 bottom-2 w-0.5 bg-gray-200" />

								<div className="space-y-4">
									{shipment.statusHistory
										.slice()
										.reverse()
										.map((history, index) => {
											const historyConfig =
												STATUS_CONFIG[history.status] || STATUS_CONFIG.documents_verification;
											return (
												<div key={index} className="flex gap-4 pr-2">
													{/* Timeline Dot */}
													<div
														className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
															index === 0
																? "bg-red-800 text-white"
																: "bg-gray-100 text-gray-600"
														}`}
													>
														{historyConfig.icon}
													</div>
													<div className="flex-1 bg-white p-3 rounded-lg border">
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

					{/* Shipment Notes */}
					{shipment.notes && (
						<div className="bg-yellow-50 rounded-xl p-6 mb-6">
							<h3 className="font-bold text-yellow-800 mb-3">💬 ملاحظات</h3>
							<p className="text-gray-700">{shipment.notes}</p>
						</div>
					)}

					{/* Documents Section from UCR Request */}
					{shipment.ucrRequestId?.uploads && shipment.ucrRequestId.uploads.length > 0 && (
						<div className="bg-green-50 rounded-xl p-6 mb-6">
							<h3 className="font-bold text-green-800 mb-3">
								📄 المستندات المرفقة ({shipment.ucrRequestId.uploads.length})
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
								{shipment.ucrRequestId.uploads.map((doc, index) => {
									const docLabels = {
										bank_waiver: "إعفاء بنكي",
										export_invoice: "فاتورة التصدير",
										export_packing_list: "قائمة التعبئة",
										shipping_permit: "تصريح الشحن",
										awb: "بوليصة الشحن الجوي",
										bl: "بوليصة الشحن البحري",
									};
									return (
										<div
											key={index}
											className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
										>
											<div className="flex items-center gap-2">
												<span className="text-green-600 text-xl">📄</span>
												<div>
													<p className="font-medium text-sm">
														{docLabels[doc.documentType] || doc.documentType}
													</p>
													<p className="text-xs text-gray-500 truncate max-w-[120px]" title={doc.originalname || doc.filename}>
														{doc.originalname || doc.filename || "مستند"}
													</p>
												</div>
											</div>
											{doc.url && (
												<a
													href={doc.url}
													target="_blank"
													rel="noopener noreferrer"
													className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition flex items-center gap-1"
												>
													👁️ عرض
												</a>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-6 border-t-2">
						{/* Back to list */}
						<button
							onClick={() =>
								navigate(
									userType === "employee"
										? "/employee/export-shipments"
										: "/export-shipments"
								)
							}
							className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
						>
							← العودة للشحنات
						</button>

						{/* View UCR Request */}
						{shipment.ucrRequestId?._id && (
							<button
								onClick={() => navigate(
									userType === "employee" 
										? `/employee/ucr-request/${shipment.ucrRequestId._id}`
										: `/ucr-request/${shipment.ucrRequestId._id}`
								)}
								className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
							>
								<span>📄</span>
								<span>عرض طلب UCR</span>
							</button>
						)}

						{/* Completed message */}
						{shipment.currentStatus === "completed" && (
							<span className="w-full sm:w-auto px-6 py-3 bg-green-100 text-green-800 font-bold rounded-lg flex items-center justify-center gap-2">
								<span>✨</span>
								<span>تم إكمال الشحنة بنجاح!</span>
							</span>
						)}
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default ExportShipmentDetailsPage;
