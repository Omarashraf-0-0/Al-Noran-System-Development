import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import { 
	Search, Filter, FileText, CheckCircle, 
	Clock, XCircle, AlertTriangle, Eye, Trash2,
	RefreshCw, Inbox, Upload, Download,
	Truck, Anchor, Edit, MapPin, Box
} from "lucide-react";
import ShipmentDetailsModal from "../components/ShipmentDetailsModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNavigate } from "react-router-dom";

export default function ShipmentsManagement() {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	const [activeTab, setActiveTab] = useState("import"); // 'import' (Clearance) or 'export' (Freight)
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState([]);
	const [filteredData, setFilteredData] = useState([]);
	
	// Filter State
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Modals
	const [selectedShipmentId, setSelectedShipmentId] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [shipmentToDelete, setShipmentToDelete] = useState(null);

	// Status Update Modal
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [selectedForStatus, setSelectedForStatus] = useState(null);
	const [newStatus, setNewStatus] = useState("");
	const [statusNotes, setStatusNotes] = useState("");
	const [processingAction, setProcessingAction] = useState(false);

	const user = JSON.parse(localStorage.getItem("user"));
	const token = localStorage.getItem("token");

	// Theme Classes
	const theme = {
		pageBg: isDarkMode ? "bg-[#1a1600]" : "bg-[#FFFDF5]",
		cardBg: isDarkMode ? "bg-[#2d2600]/60 border-[#D4AF37]/20" : "bg-white border-gray-100",
		headerText: isDarkMode ? "text-[#D4AF37]" : "text-[#690000]",
		textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-gray-800",
		textSecondary: isDarkMode ? "text-[#D4AF37]/60" : "text-gray-500",
		inputBg: isDarkMode ? "bg-[#2d2600] border-[#D4AF37]/30 text-white" : "bg-white border-gray-300 text-gray-900",
		tabActive: isDarkMode ? "bg-[#D4AF37] text-black" : "bg-[#690000] text-white",
		tabInactive: isDarkMode ? "bg-white/5 text-[#D4AF37] hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
		modalBg: isDarkMode ? "bg-[#2d2600] border-[#D4AF37]/30 shadow-2xl shadow-black/50" : "bg-white shadow-xl",
	};

	// Export Status Flow (Freight) - Internal Keys
	const EXPORT_STATUS_KEYS = [
		"documents_verification", "regulatory_inspection", "payment_cleared",
		"goods_loaded", "in_transit", "delivered", "completed", "cancelled"
	];

	// Export Status Labels (Arabic)
	const EXPORT_STATUS_LABELS = {
		"documents_verification": "مراجعة المستندات",
		"regulatory_inspection": "فحص الجهات الرقابية",
		"payment_cleared": "تم السداد",
		"goods_loaded": "تم التحميل",
		"in_transit": "في الطريق",
		"delivered": "تم الوصول",
		"completed": "مكتملة",
		"cancelled": "ملغية"
	};

	// Import Status Flow (Clearance) - Arabic Values (Backend stores these strings directly usually)
	const IMPORT_STATUS_FLOW = [
		"في انتظار الشحن", 
		"في الطريق", 
		"تم وصول البضاعة", 
		"في انتظار وصول الإذن", 
		"تم وصول الإذن", 
		"التخليص الجمركي", 
		"جارى ادراج الشحنة واستكمال الاجراءات", 
		"جاري الكشف والتثمين", 
		"مكتملة", 
		"تمت بنجاح"
	];

	useEffect(() => {
		fetchData();
	}, [activeTab]);

	useEffect(() => {
		filterData();
	}, [data, search, statusFilter]);

	const fetchData = async () => {
		setLoading(true);
		try {
			if (!token) return;
			let formattedData = [];

			if (activeTab === "import") {
				// Import (Clearance) Shipments
				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/shipments/getAll`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				
				const rawData = Array.isArray(response.data) ? response.data : response.data.data || [];
				
				formattedData = rawData.map(item => ({
					id: item._id,
					type: "import",
					number: item.acid || "N/A",
					clientName: item.user_id?.username || item.user_id?.fullname || "غير معروف",
					status: item.status,
					port: item.port_name || "-",
					country: item.country || "-",
					date: item.createdAt,
					details: item
				}));

			} else {
				// Export (Freight) Shipments
				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/all`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				const rawData = response.data.shipments || [];

				formattedData = rawData.map(item => ({
					id: item._id,
					type: "export",
					number: item.shipmentNumber || item.ucrNumber || "N/A",
					clientName: item.userId?.username || item.userId?.fullname || "غير معروف",
					status: item.currentStatus || "documents_verification",
					port: item.destinationCountry || "-",
					country: "مصر",
					date: item.createdAt,
					details: item
				}));
			}

			setData(formattedData);
		} catch (error) {
			console.error("Fetch error:", error);
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	const filterData = () => {
		let result = [...data];

		if (search.trim()) {
			const query = search.toLowerCase();
			result = result.filter(item => 
				item.number?.toLowerCase().includes(query) ||
				item.clientName?.toLowerCase().includes(query) ||
				item.port?.toLowerCase().includes(query)
			);
		}

		if (statusFilter !== "all") {
			result = result.filter(item => item.status === statusFilter);
		}

		result.sort((a, b) => new Date(b.date) - new Date(a.date));
		setFilteredData(result);
	};

	// --- Handlers ---

	const handleDelete = async () => {
		if (!shipmentToDelete) return;

		const endpoint = activeTab === "import"
			? `${import.meta.env.VITE_API_URL}/api/shipments/${shipmentToDelete}`
			: `${import.meta.env.VITE_API_URL}/api/export-shipments/${shipmentToDelete}`;

		try {
			await axios.delete(endpoint, {
				headers: { Authorization: `Bearer ${token}` }
			});
			toast.success("تم الحذف بنجاح");
			fetchData();
			setShowDeleteDialog(false);
		} catch (error) {
			toast.error(error.response?.data?.message || "فشل الحذف");
		}
	};

	const openStatusModal = (item, e) => {
		e?.stopPropagation();
		setSelectedForStatus(item);
		setNewStatus(item.status);
		setStatusNotes("");
		setShowStatusModal(true);
	};

	const handleStatusUpdate = async () => {
		if (!selectedForStatus || !newStatus) return;
		setProcessingAction(true);

		try {
			if (activeTab === "import") {
				// Import Update
				await axios.put(
					`${import.meta.env.VITE_API_URL}/api/shipments/id/${selectedForStatus.id}`,
					{ status: newStatus }, 
					{ headers: { Authorization: `Bearer ${token}` } }
				);
			} else {
				// Export Update
				await axios.patch(
					`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${selectedForStatus.id}/status`,
					{ status: newStatus, notes: statusNotes },
					{ headers: { Authorization: `Bearer ${token}` } }
				);
			}

			toast.success("تم تحديث الحالة بنجاح");
			setShowStatusModal(false);
			fetchData();
		} catch (error) {
			console.error("Status update error:", error);
			toast.error("فشل تحديث الحالة");
		} finally {
			setProcessingAction(false);
		}
	};

	const getStatusBadge = (status) => {
		// Define Mapping
		const styles = {
			// Export Keys
			"documents_verification": { bg: "bg-blue-100 text-blue-700", icon: FileText, label: EXPORT_STATUS_LABELS["documents_verification"] },
			"regulatory_inspection": { bg: "bg-purple-100 text-purple-700", icon: Search, label: EXPORT_STATUS_LABELS["regulatory_inspection"] },
			"payment_cleared": { bg: "bg-yellow-100 text-yellow-700", icon: CheckCircle, label: EXPORT_STATUS_LABELS["payment_cleared"] },
			"goods_loaded": { bg: "bg-cyan-100 text-cyan-700", icon: Box, label: EXPORT_STATUS_LABELS["goods_loaded"] },
			"in_transit": { bg: "bg-indigo-100 text-indigo-700", icon: Truck, label: EXPORT_STATUS_LABELS["in_transit"] },
			"delivered": { bg: "bg-green-100 text-green-700", icon: MapPin, label: EXPORT_STATUS_LABELS["delivered"] },
			"completed": { bg: "bg-emerald-100 text-emerald-700", icon: CheckCircle, label: EXPORT_STATUS_LABELS["completed"] },
			"cancelled": { bg: "bg-red-100 text-red-700", icon: XCircle, label: EXPORT_STATUS_LABELS["cancelled"] },

			// Import Strings (Arabic) - mapped to styles
			"في انتظار الشحن": { bg: "bg-gray-100 text-gray-700", icon: Clock },
			"في الطريق": { bg: "bg-indigo-100 text-indigo-700", icon: Truck },
			"تم وصول البضاعة": { bg: "bg-yellow-100 text-yellow-700", icon: MapPin },
			"في انتظار وصول الإذن": { bg: "bg-purple-100 text-purple-700", icon: Clock },
			"تم وصول الإذن": { bg: "bg-teal-100 text-teal-700", icon: FileText },
			"التخليص الجمركي": { bg: "bg-blue-100 text-blue-700", icon: FileText },
			"جارى ادراج الشحنة واستكمال الاجراءات": { bg: "bg-amber-100 text-amber-700", icon: RefreshCw },
			"جاري الكشف والتثمين": { bg: "bg-pink-100 text-pink-700", icon: Search },
			"اخر": { bg: "bg-gray-100 text-gray-600", icon: AlertTriangle },
			"مكتملة": { bg: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
			"تمت بنجاح": { bg: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
		};

		// Fallback
		let config = styles[status] || { bg: "bg-gray-100 text-gray-600", icon: AlertTriangle, label: status };
		
		const Icon = config.icon;

		return (
			<span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg}`}>
				<Icon className="w-3.5 h-3.5" />
				{config.label || status}
			</span>
		);
	};
	
	const stats = {
		total: data.length,
		active: data.filter(d => !["completed", "cancelled", "تمت بنجاح", "مكتملة"].includes(d.status)).length,
		completed: data.filter(d => ["completed", "تمت بنجاح", "مكتملة"].includes(d.status)).length
	};

	return (
		<div className={`min-h-screen ${theme.pageBg} transition-colors duration-300 font-sans pt-28 pb-12`}>
			<Header />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				
				{/* Welcome Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
					<div>
						<h1 className={`text-3xl font-bold ${theme.headerText} mb-2`}>
							إدارة الشحنات 🚢
						</h1>
						<p className={`${theme.textSecondary}`}>إدارة عمليات التخليص (الوارد) والشحن (الصادر)</p>
					</div>
					
					{/* Actions */}
					<div className="flex gap-3">
						<button 
							onClick={fetchData}
							className={`p-2 rounded-xl transition-all active:scale-95 ${isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
						>
							<RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
						</button>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center justify-between`}>
						<div>
							<p className={`text-sm ${theme.textSecondary}`}>إجمالي الشحنات</p>
							<p className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.total}</p>
						</div>
						<div className={`p-3 rounded-xl ${isDarkMode ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-blue-50 text-blue-600"}`}>
							<Truck className="w-6 h-6" />
						</div>
					</div>
					<div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center justify-between`}>
						<div>
							<p className={`text-sm ${theme.textSecondary}`}>شحنات نشطة</p>
							<p className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.active}</p>
						</div>
						<div className={`p-3 rounded-xl ${isDarkMode ? "bg-yellow-500/10 text-yellow-500" : "bg-yellow-50 text-yellow-600"}`}>
							<Clock className="w-6 h-6" />
						</div>
					</div>
					<div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center justify-between`}>
						<div>
							<p className={`text-sm ${theme.textSecondary}`}>مكتملة</p>
							<p className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.completed}</p>
						</div>
						<div className={`p-3 rounded-xl ${isDarkMode ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-600"}`}>
							<CheckCircle className="w-6 h-6" />
						</div>
					</div>
				</div>

				{/* Tabs & Filters */}
				<div className={`bg-transparent rounded-3xl overflow-hidden mb-6`}>
					{/* Tabs */}
					<div className="flex p-1 gap-2 mb-6 bg-gray-100/50 dark:bg-white/5 rounded-2xl w-fit">
						<button
							onClick={() => setActiveTab("import")}
							className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "import" ? theme.tabActive : theme.tabInactive}`}
						>
							<Download className="w-4 h-4" />
							وارد (تخليص)
						</button>
						<button
							onClick={() => setActiveTab("export")}
							className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "export" ? theme.tabActive : theme.tabInactive}`}
						>
							<Upload className="w-4 h-4" />
							صادر (شحن)
						</button>
					</div>

					{/* Filters */}
					<div className="flex flex-col md:flex-row gap-4 mb-6">
						<div className="flex-1 relative">
							<Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textSecondary}`} />
							<input 
								type="text" 
								placeholder={activeTab === "import" ? "بحث برقم ACID، العميل..." : "بحث برقم الشحنة، العميل، الوجهة..."}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className={`w-full rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${theme.inputBg}`}
							/>
						</div>
						<div className="w-full md:w-48 relative">
							<Filter className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textSecondary}`} />
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className={`w-full rounded-xl pr-10 pl-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${theme.inputBg}`}
							>
								<option value="all">كل الحالات</option>
								{activeTab === 'import' ? (
									<>
										<option value="في انتظار الشحن">في انتظار الشحن</option>
										<option value="في الطريق">في الطريق</option>
										<option value="تم وصول البضاعة">تم وصول البضاعة</option>
										<option value="تمت بنجاح">مكتملة</option>
									</>
								) : (
									<>
										<option value="documents_verification">مراجعة المستندات</option>
										<option value="in_transit">في الطريق</option>
										<option value="delivered">تم الوصول</option>
										<option value="completed">مكتملة</option>
									</>
								)}
							</select>
						</div>
					</div>
				</div>

				{/* Table */}
				<div className={`rounded-xl border overflow-hidden backdrop-blur-sm ${theme.cardBg}`}>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className={`${isDarkMode ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-gray-50 text-gray-700"} border-b ${isDarkMode ? "border-white/5" : "border-gray-100"}`}>
								<tr>
									<th className="px-6 py-4 text-right font-bold">رقم الشحنة</th>
									<th className="px-6 py-4 text-right font-bold">العميل</th>
									<th className="px-6 py-4 text-right font-bold">
										{activeTab === "import" ? "الميناء" : "الوجهة"}
									</th>
									<th className="px-6 py-4 text-right font-bold">الحالة</th>
									<th className="px-6 py-4 text-right font-bold">التاريخ</th>
									<th className="px-6 py-4 text-center font-bold">الإجراءات</th>
								</tr>
							</thead>
							<tbody className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-gray-100"}`}>
								{loading ? (
									<tr>
										<td colSpan="6" className="py-8 text-center">
											<div className="flex justify-center items-center gap-2">
												<div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" />
												<div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce delay-100" />
												<div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce delay-200" />
											</div>
										</td>
									</tr>
								) : filteredData.length === 0 ? (
									<tr>
										<td colSpan="6" className={`py-12 text-center ${theme.textSecondary}`}>
											<Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
											لا توجد شحنات للعرض
										</td>
									</tr>
								) : (
									filteredData.map((item) => (
										<tr key={item.id} className={`transition-colors ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
											<td className={`px-6 py-4 font-mono font-medium ${theme.textPrimary}`}>
												{item.number}
											</td>
											<td className={`px-6 py-4 ${theme.textPrimary}`}>
												{item.clientName}
											</td>
											<td className={`px-6 py-4 ${theme.textSecondary}`}>
												{item.port}
											</td>
											<td className="px-6 py-4">
												{getStatusBadge(item.status)}
											</td>
											<td className={`px-6 py-4 ${theme.textSecondary} dir-ltr text-right`}>
												{new Date(item.date).toLocaleDateString("ar-EG")}
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center justify-center gap-2">
													{/* Actions */}
													<button 
														onClick={() => {
															if (item.type === 'import') {
																setSelectedShipmentId(item.id);
																setShowDetailsModal(true);
															} else {
																// For Export, navigate to existing details page but maybe admin version?
																// AdminShipmentManagement.jsx seems to be for Import (legacy name).
																// EmployeeExportShipmentDetailsPage is good.
																// Or better, just generic view if possible.
																// Let's use the employee details page route for now as it has everything.
																navigate(`/admin/export-shipment/${item.id}`); // Need a route?
																// Actually just use Employee details route, admin permissions usually cover it
																navigate(`/employee/export-shipment/${item.id}`); 
															}
														}}
														className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
														title="عرض التفاصيل"
													>
														<Eye className="w-4 h-4" />
													</button>
													
													{/* Admin Status Edit */}
													<button 
														onClick={(e) => openStatusModal(item, e)}
														className={`p-2 rounded-lg transition-colors bg-orange-100 text-orange-600 hover:bg-orange-200`}
														title="تعديل الحالة"
													>
														<Edit className="w-4 h-4" />
													</button>

													<button 
														onClick={() => {
															setShipmentToDelete(item.id);
															setShowDeleteDialog(true);
														}}
														className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-50 text-red-600"}`}
														title="حذف"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Import Details Modal (Reusable) */}
			{showDetailsModal && selectedShipmentId && (
				<ShipmentDetailsModal
					shipmentId={selectedShipmentId}
					onClose={() => {
						setShowDetailsModal(false);
						setSelectedShipmentId(null);
					}}
					onUpdate={fetchData}
				/>
			)}

			{/* Delete Dialog */}
			<ConfirmDialog
				isOpen={showDeleteDialog}
				onConfirm={handleDelete}
				onCancel={() => {
					setShowDeleteDialog(false);
					setShipmentToDelete(null);
				}}
				title="تأكيد الحذف"
				message="هل أنت متأكد من حذف هذه الشحنة؟ هذا الإجراء لا يمكن التراجع عنه."
				confirmText="حذف نهائي"
				cancelText="إلغاء"
				confirmColor="red"
			/>

			{/* Status Update Modal */}
			{showStatusModal && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowStatusModal(false)}>
					<div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl relative ${theme.modalBg}`} onClick={e => e.stopPropagation()}>
						<h3 className={`text-xl font-bold mb-6 ${theme.textPrimary}`}>تحديث حالة الشحنة</h3>
						
						<div className="space-y-4">
							<div>
								<label className={`block text-sm font-bold mb-2 ${theme.textPrimary}`}>الحالة الجديدة</label>
								<select 
									value={newStatus}
									onChange={(e) => setNewStatus(e.target.value)}
									className={`w-full p-3 rounded-xl border outline-none ${theme.inputBg}`}
								>
									<option value="">اختر الحالة...</option>
									{activeTab === 'export' ? (
										EXPORT_STATUS_KEYS.map(status => (
											<option key={status} value={status}>{EXPORT_STATUS_LABELS[status]}</option>
										))
									) : (
										IMPORT_STATUS_FLOW.map(status => (
											<option key={status} value={status}>{status}</option>
										))
									)}
								</select>
							</div>

							<div>
								<label className={`block text-sm font-bold mb-2 ${theme.textPrimary}`}>ملاحظات</label>
								<textarea 
									value={statusNotes}
									onChange={(e) => setStatusNotes(e.target.value)}
									rows={3}
									className={`w-full p-3 rounded-xl border outline-none resize-none ${theme.inputBg}`}
									placeholder="أضف ملاحظات اختيارية..."
								/>
							</div>

							<div className="flex gap-3 pt-4">
								<button
									onClick={() => setShowStatusModal(false)}
									className={`flex-1 py-3 rounded-xl font-bold ${isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}
								>
									إلغاء
								</button>
								<button
									onClick={handleStatusUpdate}
									disabled={!newStatus || processingAction}
									className="flex-1 py-3 rounded-xl font-bold bg-[#D4AF37] text-black hover:bg-[#b5952f] disabled:opacity-50"
								>
									{processingAction ? "جاري التحديث..." : "حفظ التغييرات"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
