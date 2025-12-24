import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";
import { 
    Search, Filter, SortAsc, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
    CreditCard, Wallet, LayoutGrid, List, FileText, CheckCircle, XCircle, AlertCircle, 
    Upload, Receipt, DollarSign, History
} from "lucide-react";

const ClientPaymentsPage = () => {
    const { isDarkMode } = useTheme();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalDue, setTotalDue] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [myPayments, setMyPayments] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);

    // Search, Filter, Sort, View, Pagination State
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("الكل");
    const [sortOption, setSortOption] = useState("newest");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpToPage, setJumpToPage] = useState("");
    const itemsPerPage = viewMode === "grid" ? 6 : 8;

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Refs
    const filterBtnRef = useRef(null);
    const sortBtnRef = useRef(null);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    // Close dropdowns
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterBtnRef.current && !filterBtnRef.current.contains(e.target)) setIsFilterOpen(false);
            if (sortBtnRef.current && !sortBtnRef.current.contains(e.target)) setIsSortOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchWallet = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setWalletBalance(res.data.user.wallet || 0);
            }
        } catch (error) {
            console.error("Error fetching wallet:", error);
        }
    }, [token]);

    const calculateTotal = (invoicesData) => {
        let total = 0;
        invoicesData.forEach((inv) => {
            if (inv.status !== "تم الدفع") {
                const invTotal = getInvoiceTotalEGP(inv);
                total += invTotal;
            }
        });
        setTotalDue(total);
    };

    const fetchInvoices = useCallback(async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/invoice/my-invoices`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            let invoicesData = response.data.invoices || response.data || [];
            if (!Array.isArray(invoicesData)) invoicesData = [];

            // Filter logic
            const filteredInvoices = invoicesData.filter(inv =>
                inv.status !== "في انتظار الموافقة" && inv.status !== "مرفوض"
            );

            setInvoices(filteredInvoices);
            calculateTotal(filteredInvoices);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching invoices:", error);
            setLoading(false);
            toast.error("فشل في جلب الفواتير");
        }
    }, [token]);

    const fetchMyPayments = useCallback(async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/payments/my-payments`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMyPayments(response.data || []);
        } catch (error) {
            console.error("Error fetching payments:", error);
        }
    }, [token]);

    useEffect(() => {
        fetchInvoices();
        fetchMyPayments();
        fetchWallet();
    }, [fetchInvoices, fetchMyPayments, fetchWallet]);

    const getInvoiceTotalEGP = (inv) => {
        let total = 0;
        inv.invoiceItems.forEach((item) => {
            let price = item.itemPrice;
            if (item.currencyType === "USD") {
                price = price * 50; // Hardcoded exchange rate per existing logic
            }
            total += price;
        });
        return total;
    };

    const handlePayInvoice = async (invoiceId, invoiceTotal) => {
        if (walletBalance < invoiceTotal) {
            toast.error("رصيد المحفظة غير كافٍ");
            return;
        }
        if(!confirm("هل أنت متأكد من دفع هذه الفاتورة؟ سيتم خصم المبلغ من محفظتك.")) return;

        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/invoice/${invoiceId}/pay`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("تم دفع الفاتورة بنجاح");
            fetchWallet();
            fetchInvoices();
        } catch (error) {
            console.error("Payment Error:", error);
            toast.error(error.response?.data?.message || "فشل الدفع");
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        const urls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
    };

    const handleUploadPayment = async () => {
        if (selectedFiles.length === 0) {
            toast.error("يرجى اختيار صور الإيصال");
            return;
        }
        setUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append("category", "payment");
            selectedFiles.forEach(file => uploadFormData.append("files", file));

            const uploadRes = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/uploads/multiple`,
                uploadFormData,
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            const filePaths = uploadRes.data.uploads.map(f => f.s3Key);
            const paymentData = {
                userId: user.id || user._id, 
                paymentMethod: "BANK_TRANSFER",
                transactions: filePaths.map(path => ({ imageUrls: path, status: "PENDING" }))
            };

            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/payments`,
                paymentData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("تم إرسال إيصال الدفع بنجاح");
            setShowUploadModal(false);
            setSelectedFiles([]);
            setPreviewUrls([]);
            fetchMyPayments();
        } catch (error) {
            console.error("Payment upload error:", error);
            toast.error("حدث خطأ أثناء رفع الإيصال");
        } finally {
            setUploading(false);
        }
    };

    // Filter & Sort Logic
    const getStatusText = (status) => status === 'مقبولة' ? 'فى انتظار الدفع' : status;

    let filteredInvoices = invoices.filter((inv) => {
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "الكل" || getStatusText(inv.status) === statusFilter;
        return matchesSearch && matchesStatus;
    });

    filteredInvoices = [...filteredInvoices].sort((a, b) => {
        if (sortOption === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortOption === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortOption === "amount_high") return getInvoiceTotalEGP(b) - getInvoiceTotalEGP(a);
        if (sortOption === "amount_low") return getInvoiceTotalEGP(a) - getInvoiceTotalEGP(b);
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    const handleJumpToPage = (e) => {
        e.preventDefault();
        const pageNum = parseInt(jumpToPage);
        if (pageNum >= 1 && pageNum <= totalPages) {
            setCurrentPage(pageNum);
            setJumpToPage("");
        } else {
            toast.error(`الرجاء إدخال رقم صفحة بين 1 و ${totalPages}`);
        }
    };

    // Reset page on filter change
    useEffect(() => setCurrentPage(1), [searchTerm, statusFilter, sortOption, viewMode]);

    return (
        <div className={`flex flex-col min-h-screen font-sans relative transition-colors duration-300 ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`} dir="rtl">
            
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {isDarkMode ? (
                    <>
                        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#690000]/10 rounded-full filter blur-[100px] animate-pulse-glow"></div>
                        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#2b0000]/20 rounded-full filter blur-[120px] animate-float-slow"></div>
                    </>
                ) : (
                    <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-red-50/50 to-transparent"></div>
                )}
            </div>

            <Header />

            <main className="flex-grow w-full pt-28 pb-12 px-4 md:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-gray-100" : "text-red-900"}`}>
                            <CreditCard className={isDarkMode ? "text-red-500" : "text-red-800"} size={32} />
                            إدارة المدفوعات
                        </h1>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {/* Summary Card */}
                        <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.01] ${isDarkMode ? "bg-[#1a1010]/80 border-white/10" : "bg-white border-red-100 shadow-lg"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-full ${isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-800"}`}>
                                    <DollarSign size={24} />
                                </div>
                                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>إجمالي المديونية</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className={`text-4xl font-bold ${isDarkMode ? "text-white" : "text-[#690000]"}`}>
                                    {totalDue.toLocaleString()}
                                </span>
                                <span className={`text-lg font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>ج.م</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">محسوب بسعر صرف 50 ج.م للدولار</p>
                        </div>

                        {/* Wallet Card */}
                        <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.01] ${isDarkMode ? "bg-[#1a1010]/80 border-green-900/30" : "bg-white border-green-100 shadow-lg"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-full ${isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"}`}>
                                    <Wallet size={24} />
                                </div>
                                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>رصيد المحفظة</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="flex items-end gap-2">
                                    <span className={`text-4xl font-bold ${isDarkMode ? "text-white" : "text-green-700"}`}>
                                        {walletBalance.toLocaleString()}
                                    </span>
                                    <span className={`text-lg font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>ج.م</span>
                                </div>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="bg-[#690000] hover:bg-red-800 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all flex items-center gap-2"
                                >
                                    <Upload size={18} />
                                    شحن المحفظة
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Operations Bar */}
                    <div className={`mb-8 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-lg border relative z-20 ${
                        isDarkMode ? "bg-[#1a1010]/80 backdrop-blur-xl border-white/10" : "bg-white/80 backdrop-blur-xl border-white/40"
                    }`}>
                        <div className="relative flex-1 w-full">
                            <input
                                type="text"
                                placeholder="ابحث برقم الفاتورة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 transition-all ${
                                    isDarkMode ? "bg-black/30 border-white/10 text-white placeholder-gray-500 focus:ring-red-500/50" : "bg-gray-100 border-transparent text-gray-900 placeholder-gray-400 focus:ring-red-500/30"
                                }`}
                            />
                            <Search className={`absolute left-4 top-3.5 w-5 h-5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative" ref={filterBtnRef}>
                                <button onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${isFilterOpen || statusFilter !== 'الكل' ? "bg-red-600 text-white" : (isDarkMode ? "bg-white/10 text-gray-300" : "bg-red-50 text-red-800")}`}>
                                    <Filter size={18} />
                                    <span>{statusFilter === 'الكل' ? 'تصفية' : statusFilter}</span>
                                </button>
                                {isFilterOpen && (
                                    <div className={`absolute top-full left-0 mt-2 w-48 p-2 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10" : "bg-white border-gray-100"}`}>
                                        {['الكل', 'فى انتظار الدفع', 'تم الدفع'].map(status => (
                                            <button key={status} onClick={() => { setStatusFilter(status); setIsFilterOpen(false); }} className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${statusFilter === status ? (isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-800") : (isDarkMode ? "hover:bg-white/5 text-gray-300" : "hover:bg-gray-50 text-gray-700")}`}>{status}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={sortBtnRef}>
                                <button onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${isSortOpen ? "bg-red-600 text-white" : (isDarkMode ? "bg-white/10 text-gray-300" : "bg-white border border-gray-200 text-gray-700")}`}>
                                    <SortAsc size={18} />
                                    <span>ترتيب</span>
                                </button>
                                {isSortOpen && (
                                    <div className={`absolute top-full left-0 mt-2 w-48 p-2 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10" : "bg-white border-gray-100"}`}>
                                        {[
                                            {v: 'newest', l: 'الأحدث'}, {v: 'oldest', l: 'الأقدم'},
                                            {v: 'amount_high', l: 'الأعلى قيمة'}, {v: 'amount_low', l: 'الأقل قيمة'}
                                        ].map(opt => (
                                            <button key={opt.v} onClick={() => { setSortOption(opt.v); setIsSortOpen(false); }} className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${sortOption === opt.v ? (isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-800") : (isDarkMode ? "hover:bg-white/5 text-gray-300" : "hover:bg-gray-50 text-gray-700")}`}>{opt.l}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                                <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-lg ${viewMode === "grid" ? (isDarkMode ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-700") : (isDarkMode ? "text-gray-500" : "text-gray-400")}`}><LayoutGrid size={18} /></button>
                                <button onClick={() => setViewMode("list")} className={`p-2.5 rounded-lg ${viewMode === "list" ? (isDarkMode ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-700") : (isDarkMode ? "text-gray-500" : "text-gray-400")}`}><List size={18} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Invoices List */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-xl font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>الفواتير المستحقة</h2>
                        </div>
                        
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>جاري تحميل الفواتير...</p>
                            </div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className={`text-center py-16 rounded-3xl border border-dashed ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                                <FileText className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} size={48} />
                                <h3 className={`text-lg font-bold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>لا توجد فواتير</h3>
                                <p className="text-gray-500 text-sm">لا توجد فواتير مطابقة لعملية البحث</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                                {currentItems.map(inv => {
                                    const total = getInvoiceTotalEGP(inv);
                                    const statusText = getStatusText(inv.status);
                                    
                                    return (
                                        <div key={inv._id} className={`group relative p-5 rounded-2xl border transition-all hover:shadow-lg ${isDarkMode ? "bg-[#1a1010]/80 border-white/10 hover:border-red-900/50" : "bg-white border-gray-100 hover:border-red-200"}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                                                    <FileText size={20} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    statusText === 'تم الدفع' ? (isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700") :
                                                    (isDarkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-700")
                                                }`}>
                                                    {statusText}
                                                </span>
                                            </div>

                                            <h3 className={`font-bold text-lg mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{inv.invoiceNumber}</h3>
                                            <p className="text-gray-500 text-xs mb-4">{new Date(inv.createdAt).toLocaleDateString('ar-EG')}</p>

                                            <div className="space-y-2 mb-4">
                                                {inv.invoiceItems.slice(0, 2).map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{item.item}</span>
                                                        <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>{item.itemPrice} {item.currencyType}</span>
                                                    </div>
                                                ))}
                                                {inv.invoiceItems.length > 2 && (
                                                    <p className="text-xs text-gray-500">+ {inv.invoiceItems.length - 2} بنود أخرى</p>
                                                )}
                                            </div>

                                            <div className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? "border-white/10" : "border-gray-100"}`}>
                                                <div>
                                                    <p className="text-xs text-gray-500">الإجمالي</p>
                                                    <p className={`font-bold ${isDarkMode ? "text-red-400" : "text-[#690000]"}`}>{total.toLocaleString()} ج.م</p>
                                                </div>
                                                {statusText !== 'تم الدفع' && (
                                                    <button 
                                                        onClick={() => handlePayInvoice(inv._id, total)}
                                                        disabled={walletBalance < total}
                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                                            walletBalance >= total 
                                                                ? (isDarkMode ? "bg-green-600 hover:bg-green-500 text-white" : "bg-green-600 hover:bg-green-700 text-white") 
                                                                : "bg-gray-300 cursor-not-allowed text-gray-500"
                                                        }`}
                                                    >
                                                        {walletBalance < total ? "رصيد غير كافٍ" : "دفع الآن"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ); 
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={`flex flex-wrap justify-center items-center gap-3 mt-8 p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-white shadow-sm"}`} dir="ltr">
                                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") : (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")}`}><ChevronsLeft size={20} /></button>
                                <button onClick={prevPage} disabled={currentPage === 1} className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") : (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")}`}><ChevronLeft size={20} /></button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum = currentPage;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;
                                        return (
                                            <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === pageNum ? "bg-red-600 text-white" : (isDarkMode ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700")}`}>{pageNum}</button>
                                        );
                                    })}
                                </div>
                                <button onClick={nextPage} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") : (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")}`}><ChevronRight size={20} /></button>
                                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? (isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed") : (isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700")}`}><ChevronsRight size={20} /></button>
                                <div className={`w-px h-8 mx-2 ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`}></div>
                                <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
                                    <input type="number" min="1" max={totalPages} value={jumpToPage} onChange={(e) => setJumpToPage(e.target.value)} placeholder="#" className={`w-14 px-2 py-2 rounded-lg text-center text-sm focus:outline-none focus:ring-2 ${isDarkMode ? "bg-white/10 text-white placeholder-gray-500 focus:ring-red-500/50" : "bg-gray-100 text-gray-900 placeholder-gray-400 focus:ring-red-500/30"}`} />
                                    <button type="submit" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? "bg-red-900/50 text-red-400 hover:bg-red-900" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>go</button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Payments History */}
                    <div className="mt-8 border-t border-gray-200/20 pt-8">
                        <div className="flex items-center gap-3 mb-6">
                            <History className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
                            <h3 className={`text-xl font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>سجل عمليات الشحن والدفع</h3>
                        </div>
                        {myPayments.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">لا توجد عمليات سابقة</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myPayments.map(payment => (
                                    <div key={payment._id} className={`p-4 rounded-xl border transition-all ${isDarkMode ? "bg-[#1a1010]/50 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{new Date(payment.createdAt).toLocaleDateString('ar-EG')}</span>
                                            <span className={`text-xs px-2 py-1 rounded bg-gray-100 text-gray-600`}>{payment.paymentMethod}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {payment.transactions?.map((tx, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                                        <img src={tx.imageUrls} onError={(e) => e.target.src='/placeholder.png'} className="w-full h-full object-cover" alt="receipt" />
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>إيصال #{idx + 1}</p>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                            tx.status === 'APPROVED' ? "bg-green-100 text-green-700" : 
                                                            tx.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                                        }`}>
                                                            {tx.status === 'PENDING' ? 'قيد المراجعة' : tx.status === 'APPROVED' ? 'مقبول' : 'مرفوض'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all ${isDarkMode ? "bg-[#1e1e1e] border border-white/10" : "bg-white"}`}>
                        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? "border-white/10" : "border-gray-100"}`}>
                            <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>رفع إيصال سداد</h3>
                            <button onClick={() => setShowUploadModal(false)} className={`transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-600"}`}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <label className={`block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                isDarkMode 
                                    ? "border-white/10 hover:border-red-500/50 hover:bg-white/5" 
                                    : "border-gray-300 hover:border-red-400 hover:bg-gray-50"
                            }`}>
                                <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                                <Upload className={`mx-auto mb-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} size={40} />
                                <p className={`font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>اضغط لاختيار الصور</p>
                                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>JPG, PNG (Max 5MB)</p>
                            </label>

                            {previewUrls.length > 0 && (
                                <div className="mt-6 grid grid-cols-4 gap-3">
                                    {previewUrls.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                            <img src={url} alt="preview" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={`p-6 border-t flex justify-end gap-3 ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-50 bg-gray-50"}`}>
                            <button onClick={() => setShowUploadModal(false)} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${isDarkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-200"}`}>
                                إغاء
                            </button>
                            <button 
                                onClick={handleUploadPayment} 
                                disabled={uploading}
                                className="bg-[#690000] hover:bg-red-800 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-red-900/20 disabled:opacity-70 disabled:cursor-wait flex items-center gap-2"
                            >
                                {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} />}
                                {uploading ? 'جاري الرفع...' : 'تأكيد العملية'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ClientPaymentsPage;
