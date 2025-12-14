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
	pending: {
		label: "قيد المراجعة",
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		icon: "⏳",
		step: 1,
	},
	under_review: {
		label: "قيد التدقيق",
		color: "bg-blue-100 text-blue-800 border-blue-200",
		icon: "🔍",
		step: 2,
	},
	approved: {
		label: "معتمد",
		color: "bg-green-100 text-green-800 border-green-200",
		icon: "✅",
		step: 3,
	},
	rejected: {
		label: "مرفوض",
		color: "bg-red-100 text-red-800 border-red-200",
		icon: "❌",
		step: -1,
	},
	needs_revision: {
		label: "يحتاج تعديل",
		color: "bg-orange-100 text-orange-800 border-orange-200",
		icon: "⚠️",
		step: 0,
	},
};

// Document type labels
const DOCUMENT_LABELS = {
	bank_waiver: "التنازل البنكي",
	export_invoice: "الفاتورة الأصلية",
	export_packing_list: "كشف العبوة",
	shipping_permit: "إذن الشحن",
	awb: "بوليصة الشحن الجوي (AWB)",
	bl: "بوليصة الشحن البحري (B/L)",
};

const UCRRequestDetailsPage = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [request, setRequest] = useState(null);
	const [userType, setUserType] = useState("client");

	// Check user type on mount
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const user = JSON.parse(storedUser);
			setUserType(user.type || "client");
		}
	}, []);

	// Fetch request details
	const fetchRequestDetails = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				toast.error("يجب تسجيل الدخول أولاً");
				navigate("/login");
				return;
			}

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/ucr/${requestId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				setRequest(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching UCR request details:", error);
			if (error.response?.status === 404) {
				toast.error("الطلب غير موجود");
				// Navigate based on current path (we don't have userType set yet)
				const isEmployee = window.location.pathname.includes("/employee/");
				navigate(isEmployee ? "/employee/ucr-requests" : "/ucr-requests");
			} else if (error.response?.status === 401) {
				toast.error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
				navigate("/login");
			} else {
				toast.error("فشل في جلب تفاصيل الطلب");
			}
		} finally {
			setLoading(false);
		}
	}, [requestId, navigate]);

	useEffect(() => {
		fetchRequestDetails();
	}, [fetchRequestDetails]);

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

	// Handle delete
	const handleDelete = async () => {
		if (!window.confirm("هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.")) {
			return;
		}

		try {
			const token = localStorage.getItem("token");
			const response = await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/ucr/${requestId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("تم حذف الطلب بنجاح");
				navigate(userType === "employee" ? "/employee/ucr-requests" : "/ucr-requests");
			}
		} catch (error) {
			console.error("Error deleting request:", error);
			toast.error(error.response?.data?.message || "فشل في حذف الطلب");
		}
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

	if (!request) {
		return (
			<div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
				<Header />
				<div className="flex-1 flex flex-col justify-center items-center">
					<span className="text-5xl mb-4">❌</span>
					<p className="text-gray-600 mb-4">الطلب غير موجود</p>
					<button
						onClick={() => navigate(userType === "employee" ? "/employee/ucr-requests" : "/ucr-requests")}
						className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
					>
						العودة للطلبات
					</button>
				</div>
				<Footer />
			</div>
		);
	}

	const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;

	return (
		<div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
			<Header />

			<BackgroundContainer>
				<FormContainer
					title={
						<div className="flex items-center gap-3">
							<span className="text-2xl">
								{request.shippingMethod === "air" ? "✈️" : "🚢"}
							</span>
							<span>تفاصيل طلب UCR</span>
						</div>
					}
				>
					{/* Back Button */}
					<button
						onClick={() => navigate(userType === "employee" ? "/employee/ucr-requests" : "/ucr-requests")}
						className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
					>
						<span>→</span>
						<span>العودة للطلبات</span>
					</button>

					{/* Status Progress */}
					<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="text-3xl">{statusConfig.icon}</span>
								<div>
									<h3 className="font-bold text-lg">{statusConfig.label}</h3>
									<p className="text-sm text-gray-500">
										آخر تحديث: {formatDate(request.updatedAt)}
									</p>
								</div>
							</div>
							<span
								className={`px-4 py-2 rounded-full text-sm font-medium border ${statusConfig.color}`}
							>
								{statusConfig.label}
							</span>
						</div>

						{/* Progress Steps */}
						{request.status !== "rejected" && (
							<div className="mt-6">
								<div className="flex items-center justify-between">
									{["pending", "under_review", "approved"].map((step, index) => {
										const stepConfig = STATUS_CONFIG[step];
										const currentStep = statusConfig.step;
										const isCompleted = stepConfig.step < currentStep;
										const isCurrent = stepConfig.step === currentStep;

										return (
											<React.Fragment key={step}>
												<div className="flex flex-col items-center">
													<div
														className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
															isCompleted
																? "bg-green-500 border-green-500 text-white"
																: isCurrent
																? "bg-red-700 border-red-700 text-white"
																: "bg-white border-gray-300 text-gray-400"
														}`}
													>
														{isCompleted ? "✓" : index + 1}
													</div>
													<span className="text-xs mt-1 text-gray-600">
														{stepConfig.label}
													</span>
												</div>
												{index < 2 && (
													<div
														className={`flex-1 h-1 mx-2 rounded ${
															isCompleted ? "bg-green-500" : "bg-gray-200"
														}`}
													/>
												)}
											</React.Fragment>
										);
									})}
								</div>
							</div>
						)}

						{/* Rejection Reason */}
						{request.status === "rejected" && request.rejectionReason && (
							<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-sm font-medium text-red-800">سبب الرفض:</p>
								<p className="text-sm text-red-700 mt-1">{request.rejectionReason}</p>
							</div>
						)}

						{/* Revision Notes */}
						{request.status === "needs_revision" && request.revisionNotes && (
							<div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
								<p className="text-sm font-medium text-orange-800">ملاحظات التعديل:</p>
								<p className="text-sm text-orange-700 mt-1">{request.revisionNotes}</p>
							</div>
						)}
					</div>

					{/* Request Details Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						{/* Basic Info */}
						<div className="bg-white p-4 rounded-lg border border-gray-200">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-red-700 rounded-full"></span>
								معلومات أساسية
							</h4>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-gray-600">رقم UCR:</span>
									<span className="font-medium">
										{request.ucrNumber || `#${request._id.slice(-8)}`}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">نوع الشهادة:</span>
									<span
										className={`px-2 py-0.5 rounded text-sm ${
											request.certificationType === "noran"
												? "bg-green-100 text-green-800"
												: "bg-yellow-100 text-yellow-800"
										}`}
									>
										{request.certificationType === "noran"
											? "شهادة النوران"
											: "شهادة العميل"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">طريقة الشحن:</span>
									<span className="font-medium">
										{request.shippingMethod === "air" ? "✈️ جوي" : "🚢 بحري"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">تاريخ الإنشاء:</span>
									<span className="font-medium">{formatDate(request.createdAt)}</span>
								</div>
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
									<span className="font-medium">{request.destinationCountry}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">الميناء/المطار:</span>
									<span className="font-medium">
										{request.destinationPort || "غير محدد"}
									</span>
								</div>
							</div>
						</div>

						{/* Goods Info */}
						<div className="bg-white p-4 rounded-lg border border-gray-200">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-green-700 rounded-full"></span>
								بيانات البضاعة
							</h4>
							<div className="space-y-3">
								<div>
									<span className="text-gray-600 block mb-1">الوصف:</span>
									<p className="font-medium text-sm bg-gray-50 p-2 rounded">
										{request.generalDescription}
									</p>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">الوزن الإجمالي:</span>
									<span className="font-medium">{request.totalWeight} كجم</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">عدد الطرود:</span>
									<span className="font-medium">{request.packagesCount}</span>
								</div>
								{request.shippingMethod === "sea" && request.containersCount && (
									<div className="flex justify-between">
										<span className="text-gray-600">عدد الحاويات:</span>
										<span className="font-medium">{request.containersCount}</span>
									</div>
								)}
							</div>
						</div>

						{/* Invoice & Fees Info */}
						<div className="bg-white p-4 rounded-lg border border-gray-200">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-yellow-700 rounded-full"></span>
								بيانات الفاتورة والرسوم
							</h4>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-gray-600">رقم الفاتورة:</span>
									<span className="font-medium">{request.originalInvoiceNumber}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">تاريخ الفاتورة:</span>
									<span className="font-medium">
										{formatDate(request.invoiceDate)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">القيمة:</span>
									<span className="font-medium text-lg">
										{formatCurrency(request.valueInEGP)}
									</span>
								</div>
								{request.certificationType === "noran" && (
									<div className="flex justify-between border-t pt-2 mt-2">
										<span className="text-gray-600">رسوم التصدير (10%):</span>
										<span className="font-bold text-red-700 text-lg">
											{formatCurrency(request.fees?.exportFee)}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Items List */}
					{request.items && request.items.length > 0 && (
						<div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-purple-700 rounded-full"></span>
								تفاصيل البنود ({request.items.length})
							</h4>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="bg-gray-50">
											<th className="p-2 text-right">الوصف</th>
											<th className="p-2 text-right">البند الجمركي</th>
											<th className="p-2 text-right">الكمية</th>
											<th className="p-2 text-right">الوزن</th>
											<th className="p-2 text-right">القيمة</th>
										</tr>
									</thead>
									<tbody>
										{request.items.map((item, index) => (
											<tr key={index} className="border-t">
												<td className="p-2">{item.description || "—"}</td>
												<td className="p-2 font-mono">{item.hsCode || "—"}</td>
												<td className="p-2">
													{item.quantity} {item.unit}
												</td>
												<td className="p-2">{item.weight || "—"}</td>
												<td className="p-2">{formatCurrency(item.value)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Container Weights (Sea Only) */}
					{request.shippingMethod === "sea" &&
						request.containerWeights &&
						request.containerWeights.length > 0 && (
							<div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
								<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
									<span className="w-2 h-2 bg-blue-700 rounded-full"></span>
									أوزان الحاويات ({request.containerWeights.length})
								</h4>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
									{request.containerWeights.map((container, index) => (
										<div
											key={index}
											className="bg-gray-50 p-3 rounded-lg border"
										>
											<p className="text-xs text-gray-500">حاوية {index + 1}</p>
											<p className="font-medium">{container.containerNumber}</p>
											<p className="text-sm text-gray-600">
												{container.weight}{" "}
												{container.unit === "tons" ? "طن" : "كجم"}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

					{/* Documents */}
					{request.uploads && request.uploads.length > 0 && (
						<div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
							<h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-indigo-700 rounded-full"></span>
								المستندات المرفقة ({request.uploads.length})
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{request.uploads.map((doc, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
									>
										<div className="flex items-center gap-2">
											<span className="text-green-600">📄</span>
											<div>
												<p className="font-medium text-sm">
													{DOCUMENT_LABELS[doc.documentType] || doc.documentType}
												</p>
												<p className="text-xs text-gray-500">
													{doc.originalFileName || "مستند"}
												</p>
											</div>
										</div>
										{doc.fileUrl && (
											<a
												href={doc.fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:text-blue-800 text-sm"
											>
												عرض ↗
											</a>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Client Notes */}
					{request.clientNotes && (
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
							<h4 className="font-bold text-gray-800 mb-2">ملاحظات العميل</h4>
							<p className="text-gray-700">{request.clientNotes}</p>
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end gap-3 border-t pt-4">
						<button
							onClick={() => navigate(userType === "employee" ? "/employee/ucr-requests" : "/ucr-requests")}
							className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
						>
							العودة للطلبات
						</button>
						{request.status === "pending" && userType === "client" && (
							<>
								<button
									onClick={() => navigate(`/ucr-request/${requestId}/edit`)}
									className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
								>
									تعديل الطلب
								</button>
								<button
									onClick={handleDelete}
									className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
								>
									حذف الطلب
								</button>
							</>
						)}
						{request.status === "approved" && (
							<button
								onClick={() => navigate("/export-shipments")}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
							>
								<span>📦</span>
								<span>متابعة الشحنة</span>
							</button>
						)}
					</div>
				</FormContainer>
			</BackgroundContainer>

			<Footer />
		</div>
	);
};

export default UCRRequestDetailsPage;
