import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchFilterSort from "../components/SearchFilterSort"; // Reusing the shared component
import LoadingSpinner from "../components/LoadingSpinner"; // Reusing shared spinner
import ErrorMessage from "../components/ErrorMessage"; // Reusing shared error message
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
    Truck, Calendar, MapPin, FileText, User, 
    MoreVertical, Edit, Eye, CheckCircle, XCircle 
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const STATUS_CONFIG = {
	documents_verification: { label: "التحقق من المستندات", color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200", icon: "📄" },
	regulatory_inspection: { label: "فحص الجهات الرقابية", color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-200", icon: "🔍" },
	payment_cleared: { label: "تم السداد", color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-200", icon: "💰" },
	goods_loaded: { label: "تم التحميل", color: "text-cyan-600", bg: "bg-cyan-100", border: "border-cyan-200", icon: "📦" },
	in_transit: { label: "في الطريق", color: "text-indigo-600", bg: "bg-indigo-100", border: "border-indigo-200", icon: "🚢" },
	delivered: { label: "تم التسليم", color: "text-green-600", bg: "bg-green-100", border: "border-green-200", icon: "✅" },
	completed: { label: "مكتمل", color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200", icon: "✨" },
	cancelled: { label: "ملغي", color: "text-red-600", bg: "bg-red-100", border: "border-red-200", icon: "❌" },
};

const STATUS_FLOW = [
	"documents_verification",
	"regulatory_inspection",
	"payment_cleared",
	"goods_loaded",
	"in_transit",
	"delivered",
	"completed",
];

const EmployeeExportShipmentsPage = () => {
	const navigate = useNavigate();
    const { isDarkMode } = useTheme();

	const [searchTerm, setSearchTerm] = useState("");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	
    // Data States
    const [shipments, setShipments] = useState([]);
    const [filteredShipments, setFilteredShipments] = useState([]);

    // Filters
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortOption, setSortOption] = useState("newest");

	// Status Modal State
	const [statusModal, setStatusModal] = useState(false);
	const [selectedShipment, setSelectedShipment] = useState(null);
	const [newStatus, setNewStatus] = useState("");
	const [statusNotes, setStatusNotes] = useState("");
	// processingAction wasn't explicitly in Stashed state block but used in handleStatusUpdate. adding it.
	const [processingAction, setProcessingAction] = useState(false);

	const token = localStorage.getItem("token");

    const statusOptions = [
        { value: "all", label: "الكل" },
        ...Object.entries(STATUS_CONFIG).map(([key, val]) => ({ value: key, label: val.label }))
    ];

	const fetchShipments = useCallback(async () => {
		setLoading(true);
		try {
			if (!token) return;

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/all`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data.success) {
				const formattedShipments = (response.data.shipments || []).map((shipment) => ({
					id: shipment._id,
					rawData: shipment,
					userId: shipment.userId?._id,
					clientName: shipment.userId?.fullname || shipment.userId?.name || "عميل غير معروف",
                    clientEmail: shipment.userId?.email,
                    username: shipment.userId?.username,
					shipmentNo: shipment.shipmentNumber || `شحنة #${shipment._id.slice(-6)}`,
					ucrNumber: shipment.ucrNumber || shipment.ucrRequestId?.ucrNumber || "—",
					destination: shipment.destinationCountry || "—",
					status: shipment.currentStatus || "documents_verification",
					createdAt: shipment.createdAt,
					notes: shipment.notes
				}));
				setShipments(formattedShipments);
			}
		} catch (err) {
			console.error("Error fetching export shipments:", err);
            setError(err.response?.data?.message || "فشل تحميل الشحنات");
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		fetchShipments();
	}, [fetchShipments]);

    // Filtering & Sorting Logic
    useEffect(() => {
        let result = [...shipments];

        // Filter by Status
        if (statusFilter !== "all") {
            result = result.filter(s => s.status === statusFilter);
        }

        // Filter by Search
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            result = result.filter(s => 
                s.shipmentNo.toLowerCase().includes(query) ||
                s.clientName.toLowerCase().includes(query) ||
                s.ucrNumber.toLowerCase().includes(query) ||
                s.destination.toLowerCase().includes(query)
            );
        }

        // Sorting
        result.sort((a, b) => {
            if (sortOption === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortOption === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortOption === "clientAZ") return a.clientName.localeCompare(b.clientName, "ar");
            if (sortOption === "clientZA") return b.clientName.localeCompare(a.clientName, "ar");
            return 0;
        });

        setFilteredShipments(result);
    }, [shipments, statusFilter, searchTerm, sortOption]);


	// Status Update Logic
	const getAvailableStatuses = (currentStatus) => {
		const currentIndex = STATUS_FLOW.indexOf(currentStatus);
		// Allow moving forward or to cancelled
		const available = [];
		if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
			available.push(...STATUS_FLOW.slice(currentIndex + 1));
		}
		if (currentStatus !== "cancelled") available.push("cancelled");
		return available;
	};

	const openStatusModal = (shipment, e) => {
        e.stopPropagation();
		setSelectedShipment(shipment);
        const nextStatus = STATUS_FLOW.indexOf(shipment.status) < STATUS_FLOW.length - 1 
            ? STATUS_FLOW[STATUS_FLOW.indexOf(shipment.status) + 1] 
            : "";
		setNewStatus(nextStatus);
		setStatusNotes("");
		setStatusModal(true);
	};

	const handleStatusUpdate = async () => {
		if (!selectedShipment || !newStatus) return;
		setProcessingAction(true);
		try {
			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${selectedShipment.id}/status`,
				{ status: newStatus, notes: statusNotes },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			toast.success("تم تحديث حالة الشحنة بنجاح");
			setStatusModal(false);
			fetchShipments();
		} catch (err) {
			toast.error("فشل تحديث الحالة");
		} finally {
			setProcessingAction(false);
		}
	};

    // Theme Variables
    const theme = {
        bg: isDarkMode ? "bg-[#050a0d]" : "bg-gray-50",
        cardBg: isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100",
        text: isDarkMode ? "text-gray-100" : "text-gray-900",
        subText: isDarkMode ? "text-gray-400" : "text-gray-500",
        inputBg: isDarkMode ? "bg-black/30 border-white/10" : "bg-white border-gray-300",
    };

	return (
		<div className={`flex flex-col min-h-screen font-sans transition-colors duration-300 ${theme.bg}`}>
            
             {/* Animated Background */}
             <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {isDarkMode ? (
                    <>
                        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#1ba3b6]/10 rounded-full filter blur-[100px] animate-pulse"></div>
                        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#0d5c66]/20 rounded-full filter blur-[120px]"></div>
                    </>
                ) : (
                    <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-cyan-50/50 to-transparent"></div>
                )}
            </div>

			<Header />

			<main className="flex-grow w-full pt-24 pb-12 px-4 md:px-8 relative z-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-[#1ba3b6]"}`}>
                        <span className="text-4xl">🚢</span>
                        الشحنات التصديرية
                        <span className={`text-sm font-normal px-3 py-1 rounded-full ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-cyan-100 text-[#1ba3b6]"}`}>
                            {filteredShipments.length} شحنة
                        </span>
                    </h1>
                </div>

                <SearchFilterSort
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="ابحث برقم الشحنة، العميل، الوجهة..."
                    isFilterOpen={isFilterOpen}
                    onToggleFilter={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                    filterValue={statusFilter}
                    onFilterChange={setStatusFilter}
                    filterOptions={statusOptions}
                    filterLabel="تصفية حسب الحالة"
                    onFilterApply={() => setIsFilterOpen(false)}
                    isSortOpen={isSortOpen}
                    onToggleSort={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                    sortValue={sortOption}
                    onSortChange={setSortOption}
                    onSortApply={() => setIsSortOpen(false)}
                    userType="employee"
                    isDarkMode={isDarkMode}
                />

                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <ErrorMessage message={error} onRetry={fetchShipments} />
                ) : filteredShipments.length === 0 ? (
                    <div className={`text-center py-20 rounded-3xl border border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                            <span className="text-4xl">📦</span>
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${theme.text}`}>لا توجد شحنات</h3>
                        <p className={theme.subText}>لم يتم العثور على شحنات تطابق بحثك</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {filteredShipments.map((shipment) => {
                            const config = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.documents_verification;
                            return (
                                <div 
                                    key={shipment.id}
                                    onClick={() => navigate(`/employee/export-shipment/${shipment.id}`)}
                                    className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between ${theme.cardBg} hover:border-[#1ba3b6]/30`}
                                >
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.color} ${config.border}`}>
                                            {config.icon} {config.label}
                                        </span>
                                        <span className={`text-xs ${theme.subText}`}>{new Date(shipment.createdAt).toLocaleDateString('ar-EG')}</span>
                                    </div>

                                    {/* Card Content */}
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <h3 className={`text-lg font-bold mb-1 ${theme.text} group-hover:text-[#1ba3b6] transition-colors`}>
                                                {shipment.shipmentNo}
                                            </h3>
                                            <div className={`text-sm ${theme.subText} flex items-center gap-1`}>
                                                <FileText size={14} /> UCR: {shipment.ucrNumber}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-white/5">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-white/10' : 'bg-gray-200 text-gray-700'}`}>
												{shipment.username?.charAt(0).toUpperCase()}
											</div>
                                            <div className="overflow-hidden">
                                                <p className={`text-sm font-bold truncate ${theme.text}`}>{shipment.clientName}</p>
                                                <p className={`text-xs truncate ${theme.subText}`}>{shipment.destination}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer actions */}
                                    <div className={`pt-4 border-t flex items-center justify-end gap-2 ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); navigate(`/employee/export-shipment/${shipment.id}`) }}
                                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
											title="عرض التفاصيل"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        
                                        {!["completed", "cancelled"].includes(shipment.status) && (
                                            <button 
                                                onClick={(e) => openStatusModal(shipment, e)}
                                                className="px-4 py-2 rounded-lg bg-[#1ba3b6] text-white font-bold hover:bg-[#158a9b] transition-colors flex items-center gap-2 text-sm"
                                            >
                                                <Edit size={16} /> تحديث الحالة
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
			</main>

             {/* Status Update Modal */}
             {statusModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setStatusModal(false)}>
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl relative ${theme.bg} border ${isDarkMode ? 'border-gray-700' : 'border-white'}`} onClick={e => e.stopPropagation()}>
                        <h3 className={`text-xl font-bold mb-6 ${theme.text}`}>تحديث حالة الشحنة</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${theme.text}`}>الحالة الجديدة</label>
                                <select 
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className={`w-full p-3 rounded-xl border outline-none ${theme.inputBg} ${theme.text}`}
                                >
                                    <option value="">اختر الحالة...</option>
                                    {selectedShipment && getAvailableStatuses(selectedShipment.status).map(status => (
                                        <option key={status} value={status}>{STATUS_CONFIG[status]?.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={`block text-sm font-bold mb-2 ${theme.text}`}>ملاحظات</label>
                                <textarea 
                                    value={statusNotes}
                                    onChange={(e) => setStatusNotes(e.target.value)}
                                    rows={3}
                                    className={`w-full p-3 rounded-xl border outline-none resize-none ${theme.inputBg} ${theme.text}`}
                                    placeholder="أضف ملاحظات اختيارية..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStatusModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={!newStatus || processingAction}
                                    className="flex-1 py-3 rounded-xl font-bold bg-[#1ba3b6] text-white hover:bg-[#158a9b] disabled:opacity-50"
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
};

export default EmployeeExportShipmentsPage;
