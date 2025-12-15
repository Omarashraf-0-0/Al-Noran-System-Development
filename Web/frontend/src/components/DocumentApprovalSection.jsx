
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import DocumentUploadCard from "./DocumentUploadCard";

const DocumentApprovalSection = () => {
	const [pendingDocs, setPendingDocs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedDoc, setSelectedDoc] = useState(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [filterStatus, setFilterStatus] = useState("all"); // all, pending, approved, rejected
	const [filterClientType, setFilterClientType] = useState("all");
	const [selectedClient, setSelectedClient] = useState(null);
	const [viewMode, setViewMode] = useState("grouped"); // grouped, list
	const token = localStorage.getItem("token");

	useEffect(() => {
		fetchPendingDocuments();
	}, []);

	const fetchPendingDocuments = async () => {
		try {
			setLoading(true);
			// Fetch all registration documents (not just pending)
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/upload/users/`,
				{
					params: {
						category: "registration",
						limit: 1000, // Get all registration documents
					},
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success || response.data.uploads) {
				const documents =
					response.data.uploads || response.data.documents || [];
				setPendingDocs(documents);
			}
		} catch (error) {
			console.error("Error fetching documents:", error);
			toast.error("فشل تحميل المستندات");
		} finally {
			setLoading(false);
		}
	};

	const handleApprove = async (docId) => {
		try {
			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/upload/users/${docId}/approve`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			// Update local state
			setPendingDocs((prevDocs) =>
				prevDocs.map((doc) =>
					doc._id === docId
						? { ...doc, approvalStatus: "approved", approvedAt: new Date() }
						: doc
				)
			);

			if (response.data.success) {
				toast.success("تم الموافقة على المستند بنجاح");
			}
		} catch (error) {
			console.error("Error approving document:", error);
			toast.error("فشل الموافقة على المستند");
		}
	};

	const handleRejectClick = (doc) => {
		setSelectedDoc(doc);
		setShowRejectModal(true);
		setRejectionReason("");
	};

	const handleRejectConfirm = async () => {
		if (!rejectionReason.trim()) {
			toast.error("الرجاء إدخال سبب الرفض");
			return;
		}

		try {
			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/upload/users/${
					selectedDoc._id
				}/reject`,
				{ reason: rejectionReason },
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			// Update local state
			setPendingDocs((prevDocs) =>
				prevDocs.map((doc) =>
					doc._id === selectedDoc._id
						? {
								...doc,
								approvalStatus: "rejected",
								rejectionReason,
								approvedAt: new Date(),
						  }
						: doc
				)
			);

			if (response.data.success) {
				toast.success("تم رفض المستند");
			}

			setShowRejectModal(false);
			setSelectedDoc(null);
			setRejectionReason("");
		} catch (error) {
			console.error("Error rejecting document:", error);
			toast.error("فشل رفض المستند");
		}
	};

	const getDocumentTypeLabel = (docType) => {
		const labels = {
			commercial_register: "السجل التجاري",
			tax_card: "البطاقة الضريبية",
			contract: "العقد",
			industrial_register: "السجل الصناعي",
			certificate_vat: "شهادة القيمة المضافة",
			production_supplies: "مستلزمات الإنتاج",
			power_of_attorney: "التوكيل",
			personal_id_of_representative: "بطاقة ممثل",
			import_export_card: "بطاقة استيراد/تصدير",
			trade_certificates: "شهادات تجارية",
			personal_id: "البطاقة الشخصية",
		};
		return labels[docType] || docType;
	};

	const getClientTypeLabel = (clientType) => {
		const labels = {
			factory: "مصنع",
			commercial: "تجاري",
			personal: "فردي",
		};
		return labels[clientType] || clientType;
	};

	const getStatusBadge = (status) => {
		const badges = {
			pending: {
				label: "قيد المراجعة",
				color: "bg-yellow-100 text-yellow-800",
			},
			approved: { label: "تم الموافقة", color: "bg-green-100 text-green-800" },
			rejected: { label: "مرفوض", color: "bg-red-100 text-red-800" },
		};
		return badges[status] || badges.pending;
	};

	// Filter documents
	const filteredDocs = pendingDocs.filter((doc) => {
		if (filterStatus !== "all" && doc.approvalStatus !== filterStatus)
			return false;
		if (filterClientType !== "all" && doc.clientType !== filterClientType)
			return false;
		if (selectedClient && doc.userId?._id !== selectedClient) return false;
		return true;
	});

	// Group documents by client
	const groupedByClient = filteredDocs.reduce((acc, doc) => {
		const userId = doc.userId?._id || "unknown";
		if (!acc[userId]) {
			acc[userId] = {
				user: doc.userId,
				clientType: doc.userId?.clientType,
				documents: [],
			};
		}
		acc[userId].documents.push(doc);
		return acc;
	}, {});

	const clients = Object.values(groupedByClient);

	const stats = {
		total: pendingDocs.length,
		pending: pendingDocs.filter((d) => d.approvalStatus === "pending").length,
		approved: pendingDocs.filter((d) => d.approvalStatus === "approved").length,
		rejected: pendingDocs.filter((d) => d.approvalStatus === "rejected").length,
	};

	return (
		<div className="bg-white rounded-lg shadow p-6">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<h3 className="text-2xl font-bold text-gray-800">
					📋 مراجعة المستندات
				</h3>
			</div>

			{/* Statistics */}
			<div className="grid grid-cols-4 gap-4 mb-6">
				<div className="bg-gray-50 p-4 rounded-lg text-center">
					<div className="text-2xl font-bold text-gray-800">{stats.total}</div>
					<div className="text-sm text-gray-600">إجمالي المستندات</div>
				</div>
				<div className="bg-yellow-50 p-4 rounded-lg text-center">
					<div className="text-2xl font-bold text-yellow-800">
						{stats.pending}
					</div>
					<div className="text-sm text-yellow-600">قيد المراجعة</div>
				</div>
				<div className="bg-green-50 p-4 rounded-lg text-center">
					<div className="text-2xl font-bold text-green-800">
						{stats.approved}
					</div>
					<div className="text-sm text-green-600">تم الموافقة</div>
				</div>
				<div className="bg-red-50 p-4 rounded-lg text-center">
					<div className="text-2xl font-bold text-red-800">
						{stats.rejected}
					</div>
					<div className="text-sm text-red-600">مرفوض</div>
				</div>
			</div>

			{/* Filters */}
			<div className="flex gap-4 mb-6 items-center">
				<div className="flex-1">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						حالة المستند
					</label>
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
						className="w-full border border-gray-300 rounded-lg p-2"
					>
						<option value="all">الكل ({stats.total})</option>
						<option value="pending">قيد المراجعة ({stats.pending})</option>
						<option value="approved">تم الموافقة ({stats.approved})</option>
						<option value="rejected">مرفوض ({stats.rejected})</option>
					</select>
				</div>
				<div className="flex-1">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						نوع العميل
					</label>
					<select
						value={filterClientType}
						onChange={(e) => setFilterClientType(e.target.value)}
						className="w-full border border-gray-300 rounded-lg p-2"
					>
						<option value="all">الكل</option>
						<option value="factory">مصنع</option>
						<option value="commercial">تجاري</option>
						<option value="personal">فردي</option>
					</select>
				</div>
				<div className="flex-1">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						طريقة العرض
					</label>
					<select
						value={viewMode}
						onChange={(e) => setViewMode(e.target.value)}
						className="w-full border border-gray-300 rounded-lg p-2"
					>
						<option value="grouped">مجمعة حسب العميل</option>
						<option value="list">قائمة</option>
					</select>
				</div>
			</div>

			{/* Content */}
			{filteredDocs.length === 0 ? (
				<div className="text-center py-12 text-gray-500">
					<p className="text-lg">📭 لا توجد مستندات</p>
					<p className="text-sm mt-2">لا توجد مستندات مطابقة للفلاتر المحددة</p>
				</div>
			) : viewMode === "grouped" ? (
				<div className="space-y-6">
					{clients.map((client) => (
						<div
							key={client.user?._id || Math.random()}
							className="border border-gray-200 rounded-lg p-4"
						>
							{/* Client Header */}
							<div className="flex justify-between items-center mb-4 pb-3 border-b">
								<div>
									<h4 className="text-lg font-bold text-gray-800">
										{client.user?.fullname ||
											client.user?.username ||
											"غير محدد"}
									</h4>
									<p className="text-sm text-gray-600">{client.user?.email}</p>
									<span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
										{getClientTypeLabel(client.clientType)}
									</span>
								</div>
								<div className="text-right">
									<div className="text-sm text-gray-600">
										{client.documents.length} مستند
									</div>
									<div className="text-xs text-gray-500 mt-1">
										{
											client.documents.filter(
												(d) => d.approvalStatus === "pending"
											).length
										}{" "}
										قيد المراجعة
									</div>
								</div>
							</div>

							{/* Documents Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{client.documents.map((doc) => {
									const badge = getStatusBadge(doc.approvalStatus);
									return (
										<div
											key={doc._id}
											className="border rounded-lg p-4 bg-gray-50"
										>
											<div className="flex justify-between items-start mb-2">
												<span className="text-sm font-semibold text-gray-800">
													{getDocumentTypeLabel(doc.documentType)}
												</span>
												<span
													className={`text-xs px-2 py-1 rounded ${badge.color}`}
												>
													{badge.label}
												</span>
											</div>

											<div className="text-xs text-gray-500 mb-3">
												{new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
											</div>

											{doc.rejectionReason && (
												<div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
													<strong>سبب الرفض:</strong> {doc.rejectionReason}
												</div>
											)}

											<div className="flex gap-2">
													<button
														onClick={async () => {
															try {
																toast.loading("جاري تحميل الملف...");
																const response = await axios.get(
																	`${import.meta.env.VITE_API_URL}/api/upload/users/${doc._id}`,
																	{
																		headers: { Authorization: `Bearer ${token}` },
																	}
																);
																toast.dismiss();
																
																const fileUrl = 
																	response.data?.upload?.presignedUrl || 
																	response.data?.presignedUrl || 
																	doc.url;

																if (fileUrl) {
																	window.open(fileUrl, "_blank");
																} else {
																	toast.error("رابط الملف غير متاح");
																}
															} catch (err) {
																toast.dismiss();
																console.error("Error fetching file URL:", err);
																toast.error("فشل تحميل رابط الملف");
															}
														}}
														className="flex-1 text-center text-xs text-blue-600 hover:text-blue-900 px-2 py-1 border border-blue-600 rounded hover:bg-blue-50"
													>
														👁️ عرض
													</button>
												{doc.approvalStatus === "pending" && (
													<>
														<button
															onClick={() => handleApprove(doc._id)}
															className="flex-1 text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
														>
															✓
														</button>
														<button
															onClick={() => handleRejectClick(doc)}
															className="flex-1 text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
														>
															✗
														</button>
													</>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
									العميل
								</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
									نوع العميل
								</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
									نوع المستند
								</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
									الحالة
								</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
									تاريخ الرفع
								</th>
								<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
									إجراءات
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredDocs.map((doc) => {
								const badge = getStatusBadge(doc.approvalStatus);
								return (
									<tr key={doc._id} className="hover:bg-gray-50">
										<td className="px-4 py-3 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{doc.userId?.fullname || doc.userId?.username || "N/A"}
											</div>
											<div className="text-xs text-gray-500">
												{doc.userId?.email}
											</div>
										</td>
										<td className="px-4 py-3 whitespace-nowrap">
											<span className="text-sm text-gray-700">
												{getClientTypeLabel(doc.clientType)}
											</span>
										</td>
										<td className="px-4 py-3 whitespace-nowrap">
											<span className="text-sm font-medium text-gray-900">
												{getDocumentTypeLabel(doc.documentType)}
											</span>
										</td>
										<td className="px-4 py-3 whitespace-nowrap">
											<span
												className={`text-xs px-2 py-1 rounded ${badge.color}`}
											>
												{badge.label}
											</span>
											{doc.rejectionReason && (
												<div className="text-xs text-red-600 mt-1">
													{doc.rejectionReason}
												</div>
											)}
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
											{new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
										</td>
										<td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
											<div className="flex gap-2">
												<button
													onClick={async () => {
														try {
															toast.loading("جاري تحميل الملف...");
															const response = await axios.get(
																`${import.meta.env.VITE_API_URL}/api/upload/users/${doc._id}`,
																{
																	headers: { Authorization: `Bearer ${token}` },
																}
															);
															toast.dismiss();
															
															const fileUrl = 
																response.data?.upload?.presignedUrl || 
																response.data?.presignedUrl || 
																doc.url;

															if (fileUrl) {
																window.open(fileUrl, "_blank");
															} else {
																toast.error("رابط الملف غير متاح");
															}
														} catch (err) {
															toast.dismiss();
															console.error("Error fetching file URL:", err);
															toast.error("فشل تحميل رابط الملف");
														}
													}}
													className="text-blue-600 hover:text-blue-900 px-2 py-1 border border-blue-600 rounded hover:bg-blue-50 text-xs"
												>
													👁️ عرض
												</button>
												{doc.approvalStatus === "pending" && (
													<>
														<button
															onClick={() => handleApprove(doc._id)}
															className="text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
														>
															✓ موافقة
														</button>
														<button
															onClick={() => handleRejectClick(doc)}
															className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
														>
															✗ رفض
														</button>
													</>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{/* Reject Modal */}
			{showRejectModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-xl font-bold text-gray-900 mb-4">
							رفض المستند
						</h3>
						<p className="text-gray-600 mb-4">الرجاء إدخال سبب رفض المستند:</p>
						<textarea
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[100px]"
							placeholder="اكتب السبب هنا..."
						/>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => {
									setShowRejectModal(false);
									setSelectedDoc(null);
									setRejectionReason("");
								}}
								className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
							>
								إلغاء
							</button>
							<button
								onClick={handleRejectConfirm}
								className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
							>
								تأكيد الرفض
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DocumentApprovalSection;
