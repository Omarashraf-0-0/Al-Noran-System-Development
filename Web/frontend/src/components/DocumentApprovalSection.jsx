
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
	const [clientSearch, setClientSearch] = useState(""); // Dynamic client name search
	const [viewMode, setViewMode] = useState("grouped"); // grouped, list
	const token = localStorage.getItem("token");

	// Allowed document types from DocumentUploadPage.jsx
	const allowedDocumentTypes = [
		"commercial_register",
		"tax_card",
		"contract",
		"industrial_register",
		"certificate_vat",
		"production_supplies",
		"power_of_attorney",
		"personal_id_of_representative",
		"import_export_card",
		"trade_certificates",
		"personal_id",
	];

	useEffect(() => {
		fetchPendingDocuments();
	}, []);

	const fetchPendingDocuments = async () => {
		try {
			setLoading(true);

			// Fetch all uploads AND all users in parallel
			const [uploadsResponse, usersResponse] = await Promise.all([
				axios.get(
					`${import.meta.env.VITE_API_URL}/api/upload/users/`,
					{
						params: {
							category: "client_registration_docs",
							limit: 1000,
						},
						headers: { Authorization: `Bearer ${token}` },
					}
				),
				axios.get(
					`${import.meta.env.VITE_API_URL}/api/users`,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				)
			]);

			// Build a map of all users by their ID
			const allUsers = usersResponse.data || [];
			const usersMap = {};
			allUsers.forEach(user => {
				if (user._id) {
					usersMap[user._id] = user;
				}
			});

			console.log("👥 Loaded", Object.keys(usersMap).length, "users from database");

			if (uploadsResponse.data.success || uploadsResponse.data.uploads) {
				const documents =
					uploadsResponse.data.uploads || uploadsResponse.data.documents || [];

				console.log("📄 Fetched", documents.length, "uploads");

				// Filter to only include allowed document types
				const filteredDocuments = documents.filter(
					(doc) => allowedDocumentTypes.includes(doc.documentType)
				);

				console.log("📄 Filtered to", filteredDocuments.length, "documents");

				// Extract userId from document (handle various formats)
				const getUserId = (doc) => {
					if (typeof doc.userId === 'string') return doc.userId;
					if (doc.userId?._id) return doc.userId._id;
					if (doc.user?._id) return doc.user._id;
					if (typeof doc.user === 'string') return doc.user;
					return null;
				};

				// Match each upload with its full user data from the users map
				const documentsWithUserData = filteredDocuments.map(doc => {
					const docUserId = getUserId(doc);
					const fullUserData = usersMap[docUserId];

					return {
						...doc,
						userId: fullUserData ? {
							_id: docUserId,
							fullname: fullUserData.fullname,
							username: fullUserData.username,
							email: fullUserData.email,
							phone: fullUserData.phone,
							clientDetails: fullUserData.clientDetails,
						} : doc.userId,
					};
				});

				// Log how many documents got matched with users
				const matchedCount = documentsWithUserData.filter(d => d.userId?.fullname).length;
				console.log(`✅ Matched ${matchedCount} of ${documentsWithUserData.length} documents with user data`);

				setPendingDocs(documentsWithUserData);
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
				`${import.meta.env.VITE_API_URL}/api/upload/users/${selectedDoc._id
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
		// Client name search filter
		if (clientSearch.trim()) {
			const searchLower = clientSearch.toLowerCase().trim();
			const clientName = (doc.userId?.fullname || doc.userId?.username || "").toLowerCase();
			const clientPhone = (doc.userId?.phone || "").toLowerCase();
			if (!clientName.includes(searchLower) && !clientPhone.includes(searchLower)) {
				return false;
			}
		}
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
			<div className="flex flex-wrap gap-4 mb-6 items-end">
				{/* View Mode - First (Right in RTL) */}
				<div className="min-w-[150px]">
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
				{/* Document Status */}
				<div className="min-w-[180px]">
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
				{/* Client Type */}
				<div className="min-w-[150px]">
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
				{/* Client Search - Last (Left in RTL) */}
				<div className="flex-1 min-w-[250px] relative">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						🔍 البحث عن عميل
					</label>
					<div className="relative">
						<input
							type="text"
							value={clientSearch}
							onChange={(e) => setClientSearch(e.target.value)}
							placeholder="ابحث بالاسم أو رقم الهاتف..."
							className="w-full border border-gray-300 rounded-lg p-2 pr-10 focus:ring-2 focus:ring-[#690000] focus:border-[#690000]"
						/>
						{clientSearch && (
							<button
								onClick={() => setClientSearch("")}
								className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								✕
							</button>
						)}
					</div>
					{/* Helper text positioned absolutely to not affect layout */}
					{clientSearch && (
						<p className="absolute text-xs text-gray-500 mt-1">
							عرض {clients.length} عميل مطابق
						</p>
					)}
				</div>
			</div>

			{/* Content */}
			{filteredDocs.length === 0 ? (
				<div className="text-center py-12 text-gray-500">
					<p className="text-lg">📭 لا توجد مستندات</p>
					<p className="text-sm mt-2">لا توجد مستندات مطابقة للفلاتر المحددة</p>
				</div>
			) : viewMode === "grouped" ? (
				<div
					className="overflow-y-auto"
					style={{ maxHeight: '900px', scrollbarWidth: 'thin' }}
				>
					<div className="space-y-8">
						{clients.map((client) => {
							const pendingCount = client.documents.filter(
								(d) => d.approvalStatus === "pending"
							).length;
							const approvedCount = client.documents.filter(
								(d) => d.approvalStatus === "approved"
							).length;
							const rejectedCount = client.documents.filter(
								(d) => d.approvalStatus === "rejected"
							).length;

							return (
								<div
									key={client.user?._id || Math.random()}
									className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
								>
									{/* Client Label Section - Name & Phone */}
									<div className="bg-[#690000] px-6 py-5">
										{/* Main Label: Client Name & Phone */}
										<div className="mb-3">
											<h4 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
												<span className="bg-white/20 p-2 rounded-full">👤</span>
												{client.user?.fullname || client.user?.username || "عميل غير معرف"}
											</h4>
											<div className="text-lg text-white/90 font-medium flex items-center gap-2">
												<span>📞</span>
												<span dir="ltr">{client.user?.phone || "لا يوجد رقم هاتف"}</span>
											</div>
										</div>

										{/* Secondary Info */}
										<div className="flex flex-wrap items-center gap-3 text-sm">
											<span className="flex items-center gap-1 text-white/80">
												✉️ {client.user?.email || "لا يوجد بريد"}
											</span>
											<span className="px-3 py-1 bg-white/20 text-white rounded-full">
												{getClientTypeLabel(client.clientType || client.user?.clientDetails?.clientType)}
											</span>
											<span className="px-3 py-1 bg-white/30 text-white rounded-full font-bold">
												{client.documents.length} مستند
											</span>
										</div>

										{/* Document Status Summary */}
										<div className="flex gap-3 mt-4">
											{pendingCount > 0 && (
												<span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-medium">
													⏳ {pendingCount} قيد المراجعة
												</span>
											)}
											{approvedCount > 0 && (
												<span className="px-3 py-1 bg-green-400 text-green-900 rounded-full text-sm font-medium">
													✅ {approvedCount} موافق عليها
												</span>
											)}
											{rejectedCount > 0 && (
												<span className="px-3 py-1 bg-red-400 text-red-900 rounded-full text-sm font-medium">
													❌ {rejectedCount} مرفوض
												</span>
											)}
										</div>
									</div>

									{/* Horizontally Scrollable Documents */}
									<div className="p-4">
										<div
											className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
											style={{ scrollbarWidth: 'thin' }}
										>
											{client.documents.map((doc) => {
												const badge = getStatusBadge(doc.approvalStatus);
												return (
													<div
														key={doc._id}
														className="flex-shrink-0 w-72 border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
													>
														{/* Document Type & Status */}
														<div className="flex justify-between items-start mb-3">
															<span className="text-sm font-bold text-gray-800">
																{getDocumentTypeLabel(doc.documentType)}
															</span>
															<span
																className={`text-xs px-3 py-1 rounded-full font-medium ${badge.color}`}
															>
																{badge.label}
															</span>
														</div>

														{/* Upload Date */}
														<div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
															📅 {new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
														</div>

														{/* Rejection Reason if exists */}
														{doc.rejectionReason && (
															<div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
																<strong>سبب الرفض:</strong> {doc.rejectionReason}
															</div>
														)}

														{/* Action Buttons */}
														<div className="flex gap-2 mt-auto">
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
																className="flex-1 text-center text-xs text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-2 border border-blue-600 rounded-lg transition-colors font-medium"
															>
																👁️ عرض
															</button>
															{doc.approvalStatus === "pending" && (
																<>
																	<button
																		onClick={() => handleApprove(doc._id)}
																		className="flex-1 text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors font-medium"
																	>
																		✓ موافقة
																	</button>
																	<button
																		onClick={() => handleRejectClick(doc)}
																		className="flex-1 text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg transition-colors font-medium"
																	>
																		✗ رفض
																	</button>
																</>
															)}
														</div>
													</div>
												);
											})}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			) : (
				<div className="border border-gray-200 rounded-lg overflow-hidden">
					{/* Scrollable table container - max 15 rows visible (approx 720px) */}
					<div
						className="overflow-y-auto overflow-x-auto"
						style={{ maxHeight: '480px', scrollbarWidth: 'thin' }}
					>
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50 sticky top-0 z-10">
								<tr>
									<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">
										العميل
									</th>
									<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">
										نوع العميل
									</th>
									<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">
										نوع المستند
									</th>
									<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">
										الحالة
									</th>
									<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">
										تاريخ الرفع
									</th>
									<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-gray-50">
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
				</div>
			)
			}

			{/* Reject Modal */}
			{
				showRejectModal && (
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
				)
			}
		</div >
	);
};

export default DocumentApprovalSection;

