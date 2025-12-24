import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { 
	FileText, CheckCircle, XCircle, Clock, Search, Filter, Eye, 
	Download, ChevronDown, User, Phone, Mail, FileCheck, X,
	ChevronLeft, ChevronRight
} from "lucide-react";
import FileViewerModal from "./FileViewerModal";

const DocumentApprovalSection = () => {
	const { isDarkMode } = useTheme();
	const [pendingDocs, setPendingDocs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedDoc, setSelectedDoc] = useState(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [showRejectModal, setShowRejectModal] = useState(false);
	
	// File Viewer State
	const [viewerData, setViewerData] = useState({
		isOpen: false,
		url: "",
		type: "",
		name: "",
		fileId: ""
	});
	
	// Filters
	const [filterStatus, setFilterStatus] = useState("pending");
	const [filterClientType, setFilterClientType] = useState("all");
	const [clientSearch, setClientSearch] = useState("");
	const [viewMode, setViewMode] = useState("grouped"); // grouped, list

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(5); // 5 clients per page in grouped, or 10 docs in list

	const token = localStorage.getItem("token");

	// Allowed document types
	const allowedDocumentTypes = [
		"commercial_register", "tax_card", "contract", "industrial_register",
		"certificate_vat", "production_supplies", "power_of_attorney",
		"personal_id_of_representative", "import_export_card", "trade_certificates",
		"personal_id", "passport",
	];

	// Theme classes
	const theme = {
		cardBg: isDarkMode ? "bg-[#1a1600]/40 border-[#D4AF37]/20" : "bg-white border-gray-100",
		headerText: isDarkMode ? "text-[#D4AF37]" : "text-[#690000]",
		textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-gray-800",
		textSecondary: isDarkMode ? "text-[#D4AF37]/60" : "text-gray-500",
		subCardBg: isDarkMode ? "bg-[#2d2600]/60" : "bg-gray-50",
		inputBg: isDarkMode ? "bg-[#2d2600] border-[#D4AF37]/30 text-white" : "bg-white border-gray-300 text-gray-900",
		badgePending: isDarkMode ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-yellow-50 text-yellow-700 border-yellow-200",
		badgeApproved: isDarkMode ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200",
		badgeRejected: isDarkMode ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-red-50 text-red-700 border-red-200",
		actionBtnApprove: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
		actionBtnReject: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20",
		actionBtnView: isDarkMode ? "bg-[#1BA3B6]/10 text-[#1BA3B6] hover:bg-[#1BA3B6]/20 border-[#1BA3B6]/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
		paginationBtn: isDarkMode ? "bg-[#2d2600] text-[#D4AF37] hover:bg-[#D4AF37]/20 disabled:opacity-30" : "bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30",
		paginationActive: isDarkMode ? "bg-[#D4AF37] text-[#1a1600]" : "bg-[#690000] text-white",
	};

	useEffect(() => {
		fetchPendingDocuments();
	}, []);

	// Reset page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [filterStatus, filterClientType, clientSearch, viewMode]);

	const fetchPendingDocuments = async () => {
		try {
			setLoading(true);
			const [uploadsResponse, usersResponse] = await Promise.all([
				axios.get(`${import.meta.env.VITE_API_URL}/api/upload/users/`, {
					params: { category: "client_registration_docs", limit: 1000 },
					headers: { Authorization: `Bearer ${token}` },
				}),
				axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
					headers: { Authorization: `Bearer ${token}` },
				})
			]);

			const allUsers = usersResponse.data || [];
			const usersMap = {};
			allUsers.forEach(user => { if (user._id) usersMap[user._id] = user; });

			if (uploadsResponse.data.success || uploadsResponse.data.uploads) {
				const documents = uploadsResponse.data.uploads || uploadsResponse.data.documents || [];
				const filteredDocuments = documents.filter(doc => allowedDocumentTypes.includes(doc.documentType));

				const documentsWithUserData = filteredDocuments.map(doc => {
					const getUserId = (d) => {
						if (typeof d.userId === 'string') return d.userId;
						if (d.userId?._id) return d.userId._id;
						if (d.user?._id) return d.user._id;
						if (typeof d.user === 'string') return d.user;
						return null;
					};
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
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			setPendingDocs((prevDocs) => prevDocs.map((doc) => doc._id === docId ? { ...doc, approvalStatus: "approved", approvedAt: new Date() } : doc));
			if (response.data.success) toast.success("تم الموافقة على المستند بنجاح");
		} catch (error) {
			toast.error("فشل الموافقة على المستند");
		}
	};

	const handleRejectClick = (doc) => {
		setSelectedDoc(doc);
		setShowRejectModal(true);
		setRejectionReason("");
	};

	const handleRejectConfirm = async () => {
		if (!rejectionReason.trim()) { toast.error("الرجاء إدخال سبب الرفض"); return; }
		try {
			const response = await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/upload/users/${selectedDoc._id}/reject`,
				{ reason: rejectionReason },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			setPendingDocs((prevDocs) => prevDocs.map((doc) => doc._id === selectedDoc._id ? { ...doc, approvalStatus: "rejected", rejectionReason, approvedAt: new Date() } : doc));
			if (response.data.success) toast.success("تم رفض المستند");
			setShowRejectModal(false);
			setSelectedDoc(null);
			setRejectionReason("");
		} catch (error) {
			toast.error("فشل رفض المستند");
		}
	};

	const openFileViewer = (doc) => {
		const getFileUrl = async () => {
			try {
				toast.loading("جاري تحميل الملف...");
				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/upload/users/${doc._id}`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				toast.dismiss();

				const fileUrl = response.data?.upload?.presignedUrl || response.data?.presignedUrl || doc.url;
				if (fileUrl) {
					setViewerData({
						isOpen: true,
						url: fileUrl,
						type: doc.contentType || "application/pdf",
						name: getDocumentTypeLabel(doc.documentType),
						fileId: doc._id
					});
				} else {
					toast.error("رابط الملف غير متاح");
				}
			} catch (err) {
				toast.dismiss();
				console.error("Error fetching file URL:", err);
				toast.error("فشل تحميل رابط الملف");
			}
		};
		getFileUrl();
	};

	// Helper Functions
	const getDocumentTypeLabel = (docType) => {
		const labels = {
			commercial_register: "السجل التجاري", tax_card: "البطاقة الضريبية", contract: "العقد",
			industrial_register: "السجل الصناعي", certificate_vat: "شهادة القيمة المضافة", production_supplies: "مستلزمات الإنتاج",
			power_of_attorney: "التوكيل", personal_id_of_representative: "بطاقة ممثل", import_export_card: "بطاقة استيراد/تصدير",
			trade_certificates: "شهادات تجارية", personal_id: "البطاقة الشخصية", passport: "جواز السفر",
		};
		return labels[docType] || docType;
	};

	const getClientTypeLabel = (clientType) => {
		const labels = { factory: "مصنع", commercial: "تجاري", personal: "فردي" };
		return labels[clientType] || clientType;
	};

	const getStatusBadge = (status) => {
		const badges = {
			pending: { label: "قيد المراجعة", className: theme.badgePending, icon: Clock },
			approved: { label: "تم الموافقة", className: theme.badgeApproved, icon: CheckCircle },
			rejected: { label: "مرفوض", className: theme.badgeRejected, icon: XCircle },
		};
		return badges[status] || badges.pending;
	};

	// Filter Logic
	const filteredDocs = pendingDocs.filter((doc) => {
		if (filterStatus !== "all" && doc.approvalStatus !== filterStatus) return false;
		if (filterClientType !== "all" && doc.clientType !== filterClientType) return false;
		if (clientSearch.trim()) {
			const searchLower = clientSearch.toLowerCase().trim();
			const clientName = (doc.userId?.fullname || doc.userId?.username || "").toLowerCase();
			const clientPhone = (doc.userId?.phone || "").toLowerCase();
			if (!clientName.includes(searchLower) && !clientPhone.includes(searchLower)) return false;
		}
		return true;
	});

	// Pagination Logic
	let paginatedData = [];
	let totalPages = 1;

	// View Data Preparation
	const groupedByClient = filteredDocs.reduce((acc, doc) => {
		const userId = doc.userId?._id || "unknown";
		if (!acc[userId]) acc[userId] = { user: doc.userId, clientType: doc.userId?.clientType, documents: [] };
		acc[userId].documents.push(doc);
		return acc;
	}, {});
	const clients = Object.values(groupedByClient);

	if (viewMode === "grouped") {
		totalPages = Math.ceil(clients.length / itemsPerPage);
		paginatedData = clients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
	} else {
		totalPages = Math.ceil(filteredDocs.length / (itemsPerPage * 2)); // Show more items in list view
		paginatedData = filteredDocs.slice((currentPage - 1) * (itemsPerPage * 2), currentPage * (itemsPerPage * 2));
	}

	const stats = {
		total: pendingDocs.length,
		pending: pendingDocs.filter((d) => d.approvalStatus === "pending").length,
		approved: pendingDocs.filter((d) => d.approvalStatus === "approved").length,
		rejected: pendingDocs.filter((d) => d.approvalStatus === "rejected").length,
	};

	if (loading) return <div className={`w-full h-40 flex items-center justify-center ${theme.textSecondary}`}>جاري تحميل المستندات...</div>;

	return (
		<div className={`rounded-3xl border shadow-lg backdrop-blur-sm p-6 mb-10 transition-colors duration-300 ${theme.cardBg}`}>
			{/* Header & Stats ... (Same as before) */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
				<div>
					<h3 className={`text-2xl font-bold ${theme.headerText} flex items-center gap-2`}>
						<FileCheck className="w-8 h-8" />
						مركز الموافقة على المستندات
					</h3>
					<p className={`text-sm mt-1 ${theme.textSecondary}`}>مراجعة واعتماد مستندات العملاء الجدد</p>
				</div>
				<div className="flex flex-wrap gap-2 text-sm">
					<div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${isDarkMode ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
						<Clock className="w-4 h-4" />
						<span className="font-bold">{stats.pending}</span> قيد المراجعة
					</div>
					<div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${isDarkMode ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
						<CheckCircle className="w-4 h-4" />
						<span className="font-bold">{stats.approved}</span> مقبولة
					</div>
					<div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${isDarkMode ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-red-50 text-red-700 border border-red-200"}`}>
						<XCircle className="w-4 h-4" />
						<span className="font-bold">{stats.rejected}</span> مرفوضة
					</div>
				</div>
			</div>

			{/* Filters Toolbar */}
			<div className="flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
				{/* Status Filter */}
				<div className="flex-1 min-w-[150px]">
					<div className="relative">
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className={`w-full rounded-xl pl-4 pr-10 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${theme.inputBg}`}
						>
							<option value="all">كل الحالات</option>
							<option value="pending">قيد المراجعة فقط</option>
							<option value="approved">تم الموافقة</option>
							<option value="rejected">مرفوض</option>
						</select>
						<Filter className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme.textSecondary}`} />
					</div>
				</div>

				{/* Client Search */}
				<div className="flex-[2] min-w-[200px]">
					<div className="relative">
						<input
							type="text"
							value={clientSearch}
							onChange={(e) => setClientSearch(e.target.value)}
							placeholder="بحث باسم العميل أو الهاتف..."
							className={`w-full rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-right ${theme.inputBg}`}
						/>
						<Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textSecondary}`} />
						{clientSearch && (
							<button onClick={() => setClientSearch("")} className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textSecondary} hover:text-red-500`}>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>

				{/* View Toggle */}
				<div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
					<button 
						onClick={() => setViewMode("grouped")}
						className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "grouped" ? "bg-[#D4AF37] text-white" : `${theme.subCardBg} ${theme.textSecondary}`}`}
					>
						مجمعة
					</button>
					<button 
						onClick={() => setViewMode("list")}
						className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "list" ? "bg-[#D4AF37] text-white" : `${theme.subCardBg} ${theme.textSecondary}`}`}
					>
						قائمة
					</button>
				</div>
			</div>

			{/* Content Area */}
			{filteredDocs.length === 0 ? (
				<div className={`text-center py-16 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 ${theme.subCardBg}`}>
					<FileText className={`w-12 h-12 mx-auto mb-3 opacity-30 ${theme.textPrimary}`} />
					<p className={`text-lg font-medium ${theme.textSecondary}`}>لا توجد مستندات</p>
					<p className={`text-sm opacity-60 ${theme.textSecondary}`}>لا توجد مستندات مطابقة للفلاتر الحالية</p>
				</div>
			) : (
				<>
					{/* Grouped View */}
					{viewMode === "grouped" ? (
						<div className="space-y-6">
							{paginatedData.map((client) => {
								const clientPending = client.documents.filter(d => d.approvalStatus === "pending").length;
								
								return (
									<div key={client.user?._id || Math.random()} className={`rounded-2xl border overflow-hidden ${isDarkMode ? "border-[#D4AF37]/20" : "border-gray-200"} ${theme.subCardBg}`}>
										{/* Client Header */}
										<div className={`px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDarkMode ? "bg-[#D4AF37]/10" : "bg-gray-100"}`}>
											<div className="flex items-center gap-4">
												<div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm ${isDarkMode ? "bg-[#D4AF37] text-black" : "bg-white text-gray-700"}`}>
													👤
												</div>
												<div>
													<h4 className={`font-bold text-lg ${theme.textPrimary}`}>
														{client.user?.fullname || client.user?.username || "عميل غير معرف"}
													</h4>
													<div className={`flex items-center gap-3 text-sm ${theme.textSecondary}`}>
														<span className="flex items-center gap-1"><Phone className="w-3 h-3" dir="ltr"/> {client.user?.phone || "N/A"}</span>
														<span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.user?.email || "N/A"}</span>
													</div>
												</div>
											</div>
											<div className="flex gap-3">
												<span className={`px-3 py-1 text-xs font-bold rounded-full ${isDarkMode ? "bg-white/10 text-white" : "bg-white text-gray-600 border"}`}>
													{getClientTypeLabel(client.clientType || client.user?.clientDetails?.clientType)}
												</span>
												{clientPending > 0 && (
													<span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-500 text-white shadow-sm animate-pulse">
														{clientPending} مستند جديد
													</span>
												)}
											</div>
										</div>

										{/* Documents Grid */}
										<div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{client.documents.map((doc) => {
												const BadgeIcon = getStatusBadge(doc.approvalStatus).icon;
												return (
													<div key={doc._id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all hover:shadow-md ${isDarkMode ? "bg-[#1a1600]/80 border-[#D4AF37]/10" : "bg-white border-gray-100"}`}>
														<div className="flex justify-between items-start">
															<div className="flex items-center gap-2">
																<FileText className={`w-5 h-5 ${theme.headerText}`} />
																<span className={`font-bold text-sm ${theme.textPrimary}`}>
																	{getDocumentTypeLabel(doc.documentType)}
																</span>
															</div>
															<div className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${getStatusBadge(doc.approvalStatus).className}`}>
																<BadgeIcon className="w-3 h-3" />
																{getStatusBadge(doc.approvalStatus).label}
															</div>
														</div>

														<div className={`text-xs ${theme.textSecondary}`}>
															📅 {new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
														</div>

														{doc.rejectionReason && (
															<div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
																<strong>السبب:</strong> {doc.rejectionReason}
															</div>
														)}

														<div className="mt-auto flex gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
															<button
																onClick={() => openFileViewer(doc)}
																className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${theme.actionBtnView}`}
															>
																<Eye className="w-3 h-3" /> عرض
															</button>
															
															{doc.approvalStatus === "pending" && (
																<>
																	<button
																		onClick={() => handleApprove(doc._id)}
																		className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 ${theme.actionBtnApprove}`}
																	>
																		<CheckCircle className="w-3 h-3" /> قبول
																	</button>
																	<button
																		onClick={() => handleRejectClick(doc)}
																		className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 ${theme.actionBtnReject}`}
																	>
																		<XCircle className="w-3 h-3" /> رفض
																	</button>
																</>
															)}
														</div>
													</div>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						// List View
						<div className={`rounded-xl border overflow-hidden ${isDarkMode ? "border-[#D4AF37]/20" : "border-gray-200"}`}>
							<div className="overflow-x-auto">
								<table className="w-full text-sm text-right">
									<thead className={`${isDarkMode ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-gray-50 text-gray-700"}`}>
										<tr>
											<th className="px-4 py-3 font-bold">العميل</th>
											<th className="px-4 py-3 font-bold">نوع المستند</th>
											<th className="px-4 py-3 font-bold">الحالة</th>
											<th className="px-4 py-3 font-bold">التاريخ</th>
											<th className="px-4 py-3 font-bold">الإجراءات</th>
										</tr>
									</thead>
									<tbody className={`divide-y ${isDarkMode ? "divide-[#D4AF37]/10" : "divide-gray-100"}`}>
										{paginatedData.map((doc) => {
											const BadgeIcon = getStatusBadge(doc.approvalStatus).icon;
											return (
												<tr key={doc._id} className={`${isDarkMode ? "hover:bg-[#D4AF37]/5" : "hover:bg-gray-50"}`}>
													<td className={`px-4 py-3 font-medium ${theme.textPrimary}`}>
														{doc.userId?.fullname || doc.userId?.username || "N/A"}
													</td>
													<td className={`px-4 py-3 ${theme.textSecondary}`}>
														{getDocumentTypeLabel(doc.documentType)}
													</td>
													<td className="px-4 py-3">
														<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadge(doc.approvalStatus).className}`}>
															<BadgeIcon className="w-3 h-3" />
															{getStatusBadge(doc.approvalStatus).label}
														</span>
													</td>
													<td className={`px-4 py-3 ${theme.textSecondary}`}>
														{new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
													</td>
													<td className="px-4 py-3">
														<button onClick={() => openFileViewer(doc)} className="text-blue-500 hover:underline text-xs ml-3 font-bold">عرض</button>
														{doc.approvalStatus === "pending" && (
															<>
																<button onClick={() => handleApprove(doc._id)} className="text-emerald-500 hover:underline text-xs ml-3 font-bold">موافقة</button>
																<button onClick={() => handleRejectClick(doc)} className="text-red-500 hover:underline text-xs font-bold">رفض</button>
															</>
														)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Pagination Controls */}
					{totalPages > 1 && (
						<div className="flex justify-center items-center gap-4 mt-6" dir="ltr">
							<button
								onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className={`p-2 rounded-lg transition-all ${theme.paginationBtn}`}
							>
								<ChevronLeft className="w-5 h-5" />
							</button>
							
							<div className="flex gap-2">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<button
										key={page}
										onClick={() => setCurrentPage(page)}
										className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
											currentPage === page ? theme.paginationActive : theme.paginationBtn
										}`}
									>
										{page}
									</button>
								))}
							</div>

							<button
								onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
								disabled={currentPage === totalPages}
								className={`p-2 rounded-lg transition-all ${theme.paginationBtn}`}
							>
								<ChevronRight className="w-5 h-5" />
							</button>
						</div>
					)}
				</>
			)}

			{/* File Viewer Modal */}
			<FileViewerModal 
				viewerData={viewerData} 
				onClose={() => setViewerData(prev => ({ ...prev, isOpen: false }))} 
			/>

			{/* Reject Modal */}
			{showRejectModal && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
					<div className={`border shadow-2xl rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95 ${theme.cardBg} ${isDarkMode ? "bg-[#1a1600]" : "bg-white"}`}>
						<h3 className={`text-xl font-bold mb-4 ${theme.headerText}`}>رفض المستند</h3>
						<p className={`mb-4 ${theme.textSecondary}`}>الرجاء إدخال سبب رفض المستند ليتم إرساله للعميل:</p>
						<textarea
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							className={`w-full rounded-xl p-3 mb-4 min-h-[100px] focus:ring-2 focus:ring-red-500/50 outline-none ${theme.inputBg}`}
							placeholder="اكتب سبب الرفض هنا..."
						/>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => { setShowRejectModal(false); setSelectedDoc(null); setRejectionReason(""); }}
								className={`px-4 py-2 rounded-lg font-bold transition-colors ${isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
							>
								إلغاء
							</button>
							<button
								onClick={handleRejectConfirm}
								className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/30 font-bold"
							>
								تأكيد الرفض ⛔
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DocumentApprovalSection;
