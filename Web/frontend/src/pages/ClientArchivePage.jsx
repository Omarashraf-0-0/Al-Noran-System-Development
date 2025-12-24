import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";
import { 
    Archive, FileText, Calendar, TrendingUp, Search, Filter, 
    Download, Folder, CreditCard, Ship, CheckCircle, Clock, 
    ChevronRight, ChevronLeft, LayoutGrid, List, File, Eye, ChevronDown,
    SortAsc, Package, AlertCircle, Anchor, ChevronsLeft, ChevronsRight,
    Wallet, DollarSign, History
} from "lucide-react";
import { getStatusCategory } from "../utils/shipmentHelpers";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    LineChart, Line, AreaChart, Area 
} from 'recharts';
import axios from "axios";
import { toast } from "react-hot-toast";

import FileViewerModal from "../components/FileViewerModal";

export default function ClientArchivePage() {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview"); // overview, shipments, financial, documents
    const [loading, setLoading] = useState(true);
    
    // File Viewer State
    const [viewerData, setViewerData] = useState({ open: false, url: null, name: null, type: null });
    
    // Data States
    const [shipments, setShipments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ totalShipments: 0, totalPaid: 0, documentsCount: 0 });

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [yearFilter, setYearFilter] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState(null); // For document drilling

    // Shipments UI State
    const [viewMode, setViewMode] = useState("grid");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [sortOption, setSortOption] = useState("newest");
    const [selectedStatus, setSelectedStatus] = useState("الكل");
    const [currentPage, setCurrentPage] = useState(1);

    // Derived States
    const [documents, setDocuments] = useState([]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const user = JSON.parse(localStorage.getItem("user"));
                const userId = user?.id || user?._id;
                
                if (!token || !userId) return;
                
                const headers = { Authorization: `Bearer ${token}` };
                const apiUrl = import.meta.env.VITE_API_URL;

                // Parallel Fetching
                const [shipRes, invRes, payRes] = await Promise.all([
                    axios.get(`${apiUrl}/api/shipments/user/${userId}`, { headers }).catch(e => ({ data: [] })),
                    axios.get(`${apiUrl}/api/invoice/my-invoices`, { headers }).catch(e => ({ data: { invoices: [] } })),
                    axios.get(`${apiUrl}/api/payments/my-payments`, { headers }).catch(e => ({ data: [] }))
                ]);

                // 1. Process Shipments
                // Endpoint returns array directly based on ClientShipments.jsx
                const allShipments = Array.isArray(shipRes.data) ? shipRes.data : (shipRes.data.shipments || []); 
                const closedShipments = allShipments.filter(s => 
                    ["delivered", "completed", "cancelled", "تمت بنجاح", "مكتملة"].includes(s.status)
                );
                
                // 2. Process Invoices
                const allInvoices = invRes.data.invoices || invRes.data || [];
                const paidInvoices = Array.isArray(allInvoices) ? allInvoices.filter(i => i.status === "تم الدفع") : [];

                // 3. Process Payments
                const allPayments = Array.isArray(payRes.data) ? payRes.data : (payRes.data.payments || []);

                // 4. Aggregate Documents
                const docs = [];
                
                // From Shipments (Required Documents)
                closedShipments.forEach(s => {
                    if (s.requiredDocuments && Array.isArray(s.requiredDocuments)) {
                        s.requiredDocuments.forEach(doc => {
                            if (doc.uploaded && doc.fileId) {
                                docs.push({
                                    id: doc._id || Math.random(),
                                    name: doc.name || "مستند شحنة",
                                    type: "shipment",
                                    url: doc.fileId, // S3 key
                                    date: new Date(doc.uploadedAt || s.updatedAt),
                                    refId: s.shipmentNumber || s.shipmentCode || "---"
                                });
                            }
                        });
                    }
                });

                // From Payments (Receipts)
                allPayments.forEach(p => {
                    if (p.transactions && Array.isArray(p.transactions)) {
                        p.transactions.forEach((tx, idx) => {
                            if (tx.imageUrls) {
                                docs.push({
                                    id: `${p._id}_${idx}`,
                                    name: `إيصال دفع #${idx+1}`,
                                    type: "payment",
                                    url: tx.imageUrls,
                                    date: new Date(p.createdAt),
                                    refId: p.paymentMethod
                                });
                            }
                        });
                    }
                });

                setShipments(closedShipments);
                setInvoices(paidInvoices);
                setPayments(allPayments);
                setDocuments(docs);
                
                setStats({
                    totalShipments: closedShipments.length,
                    totalPaid: paidInvoices.reduce((sum, inv) => sum + (getInvoiceTotalEGP(inv) || 0), 0),
                    documentsCount: docs.length
                });

                setLoading(false);
            } catch (error) {
                console.error("Error fetching archive data", error);
                toast.error("حدث خطأ في استرجاع البيانات");
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getInvoiceTotalEGP = (inv) => {
        let total = 0;
        if(inv.invoiceItems) {
            inv.invoiceItems.forEach((item) => {
                let price = item.itemPrice;
                if (item.currencyType === "USD") {
                    price = price * 50; 
                }
                total += price;
            });
        }
        return total;
    };

    // --- CHART DATA PREPARATION ---
    const chartData = useMemo(() => {
        const data = Array.from({ length: 12 }, (_, i) => ({
             name: new Date(0, i).toLocaleString('ar-EG', { month: 'long' }),
             shipments: 0,
             payments: 0
        }));
        
        shipments.forEach(s => {
            const date = new Date(s.createdAt);
            if (!isNaN(date) && (yearFilter === 'all' || date.getFullYear().toString() === yearFilter)) {
                data[date.getMonth()].shipments += 1;
            }
        });
        
        invoices.forEach(i => {
            const date = new Date(i.createdAt);
            if (!isNaN(date) && (yearFilter === 'all' || date.getFullYear().toString() === yearFilter)) {
                data[date.getMonth()].payments += 1; // Count of paid invoices
            }
        });

        return data;
    }, [shipments, invoices, yearFilter]);

    // --- HELPER: HANDLE DOWNLOAD ---
    // --- HELPER: HANDLE DOWNLOAD ---
    const handleViewDocument = (docUrl, docName = "مستند", docType = null) => {
        if (!docUrl) return;
        setViewerData({
            open: true,
            url: docUrl,
            name: docName,
            type: docType
        });
    };

    // --- TABS COMPONENTS ---

    const OverviewTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#1a1010]/80 border-white/10" : "bg-white border-red-100 shadow-lg"} transition-transform hover:scale-105`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-800"}`}>
                            <Archive size={24} />
                        </div>
                        <div>
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>إجمالي الأرشيف</p>
                            <h3 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-[#690000]"}`}>{stats.totalShipments} شحنة</h3>
                        </div>
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#1a1010]/80 border-white/10" : "bg-white border-red-100 shadow-lg"} transition-transform hover:scale-105`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"}`}>
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>مدفوعات مسجلة</p>
                            <h3 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-[#690000]"}`} dir="ltr">{stats.totalPaid.toLocaleString()} EGP</h3>
                        </div>
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#1a1010]/80 border-white/10" : "bg-white border-red-100 shadow-lg"} transition-transform hover:scale-105`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-700"}`}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>وثائق محفوظة</p>
                            <h3 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-[#690000]"}`}>{stats.documentsCount} وثيقة</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#1a1010]/50 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                        <TrendingUp size={20} className="text-red-500" />
                        تحليل النشاط {yearFilter === 'all' ? 'السنوي' : yearFilter}
                    </h3>
                    <select 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)}
                        className={`px-3 py-1 rounded-lg text-sm ${isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"}`}
                    >
                        <option value="all">كل السنوات</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                    </select>
                </div>
                <div className="h-[300px] w-full min-w-[200px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis dataKey="name" stroke={isDarkMode ? "#666" : "#999"} fontSize={12} tickLine={false} />
                            <YAxis stroke={isDarkMode ? "#666" : "#999"} fontSize={12} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: isDarkMode ? '#1a1010' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                            />
                            <Area type="monotone" dataKey="shipments" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorShipments)" name="عدد الشحنات" />
                            <Area type="monotone" dataKey="payments" stroke="#22c55e" strokeWidth={3} fillOpacity={0} name="الفواتير المدفوعة" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Timeline */}
            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-[#1a1010]/50 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}>
                <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                    <Clock size={20} className="text-red-500" />
                    الخط الزمني (Timeline)
                </h3>
                <div className="relative border-r border-gray-200 dark:border-gray-800 mr-3 space-y-8">
                    {[...shipments, ...invoices, ...payments].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map((item, idx) => (
                        <div key={idx} className="relative mr-6">
                            <span className={`absolute -right-[33px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0a0505] ${
                                item.shipmentNumber ? "bg-red-500" : item.invoiceNumber ? "bg-green-500" : "bg-blue-500"
                            }`}></span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <p className={`text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                                        {item.invoiceNumber ? `سداد فاتورة #${item.invoiceNumber}` : 
                                         item.shipmentNumber ? `اكتمال شحنة ${item.shipmentNumber}` :
                                         `عملية دفع ${item.category || item.paymentMethod}`}
                                    </p>
                                    <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                                        {new Date(item.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <span className={`self-start text-xs font-medium px-2.5 py-0.5 rounded ${
                                    isDarkMode ? "bg-white/5 text-gray-300" : "bg-gray-100 text-gray-600"
                                }`}>
                                    {new Date(item.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute:'2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const DocumentsTab = () => {
        // Calculate dynamic years from data
        const availableYears = useMemo(() => {
            const years = new Set(documents.map(d => d.date.getFullYear().toString()));
            return Array.from(years).sort((a, b) => b - a);
        }, [documents]);

        // Group Documents by Year and Month
        const groupedDocs = useMemo(() => {
            const groups = {};
            documents.forEach(doc => {
                const year = doc.date.getFullYear().toString();
                if (yearFilter !== 'all' && year !== yearFilter) return;
                
                const month = doc.date.getMonth(); // 0-11
                
                if (!groups[year]) groups[year] = {};
                if (!groups[year][month]) groups[year][month] = [];
                
                groups[year][month].push(doc);
            });
            return groups;
        }, [documents, yearFilter]);

        const monthsNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        // Flatten for display if year is selected
        const displayList = [];
        if (yearFilter !== 'all' && groupedDocs[yearFilter]) {
            Object.keys(groupedDocs[yearFilter]).sort((a,b) => b-a).forEach(month => {
                displayList.push({
                    monthIndex: month,
                    name: monthsNames[month],
                    docs: groupedDocs[yearFilter][month]
                });
            });
        }

        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Year Selector */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                     {availableYears.length === 0 ? (
                         <div className="col-span-full text-center py-6 opacity-50">لا توجد ملفات متاحة للأرشفة</div>
                     ) : availableYears.map(year => (
                         <button 
                            key={year}
                            onClick={() => { setYearFilter(year); setSelectedMonth(null); }}
                            className={`p-4 rounded-xl border text-center transition-all ${
                                yearFilter === year 
                                ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/30" 
                                : (isDarkMode ? "bg-[#1a1010]/50 border-white/10 text-gray-400 hover:bg-white/5" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")
                            }`}
                         >
                             <Calendar className="mx-auto mb-2" size={24}/>
                             <span className="font-bold text-lg">{year}</span>
                         </button>
                     ))}
                 </div>

                 {yearFilter === 'all' ? (
                     <div className="text-center py-20 text-gray-500">
                         يرجى اختيار سنة لعرض المجلدات
                     </div>
                 ) : (
                    <div className="space-y-4">
                        {displayList.length === 0 ? (
                            <div className="text-center py-10 opacity-60">لا توجد ملفات لهذه السنة</div>
                        ) : (
                            displayList.map(monthGroup => (
                                <div key={monthGroup.monthIndex} className={`rounded-2xl border overflow-hidden ${isDarkMode ? "bg-[#1a1010]/50 border-white/10" : "bg-white border-gray-100 shadow-sm"}`}>
                                    <div 
                                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                                            selectedMonth === monthGroup.monthIndex ? (isDarkMode ? "bg-white/5" : "bg-gray-50") : ""
                                        }`}
                                        onClick={() => setSelectedMonth(selectedMonth === monthGroup.monthIndex ? null : monthGroup.monthIndex)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Folder size={20} fill="currentColor" fillOpacity={0.2} />
                                            </div>
                                            <div>
                                                <p className={`font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>مستندات {monthGroup.name}</p>
                                                <p className="text-xs text-gray-500">{monthGroup.docs.length} ملف</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedMonth === monthGroup.monthIndex ? <ChevronDown size={20} className="text-gray-400"/> : <ChevronLeft size={20} className="text-gray-400"/>}
                                        </div>
                                    </div>

                                    {/* Expanded Files List */}
                                    {selectedMonth === monthGroup.monthIndex && (
                                        <div className={`p-4 border-t ${isDarkMode ? "border-white/5 bg-black/20" : "border-gray-50 bg-gray-50/50"}`}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {monthGroup.docs.map(doc => (
                                                    <div key={doc.id} className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? "bg-[#1a1010] border-white/10" : "bg-white border-gray-200"}`}>
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className={`p-2 rounded ${doc.type === 'payment' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                                                <FileText size={16} />
                                                            </div>
                                                            <div className="truncate">
                                                                <p className={`text-sm font-medium truncate ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>{doc.name}</p>
                                                                <p className="text-[10px] text-gray-500">{doc.refId} • {doc.date.toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleViewDocument(doc.url, doc.name, doc.type)}
                                                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"}`}
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                 )}
            </div>
        );
    };

    const ShipmentsTab = () => {
        // Local state for this tab's UI to avoid pollution if possible, 
        // BUT since it's defined inside, React will remount it on every parent render.
        // This is a preexisting issue with the code structure.
        // To fix this quickly without a massive refactor, I will assume the parent won't re-render too often 
        // OR (better) I will move these states to the parent component.
        
        // Actually, looking at the code, `ShipmentsTab` IS defined on every render.
        // I will move the state to the top level of `ClientArchivePage`.
        
        // Helper to handle filter toggle
        const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };
        const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };

        // Logic for filtering and sorting
        let filteredShipments = shipments.filter((shipment) => {
            const code = shipment.shipmentNumber || shipment.shipmentCode || "";
            const acid = shipment.acid || "";
            const matchesSearch = 
                code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acid.toLowerCase().includes(searchTerm.toLowerCase());
            
            const category = getStatusCategory(shipment.status);
            const matchesStatus = selectedStatus === "الكل" || category === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        filteredShipments = [...filteredShipments].sort((a, b) => {
            switch (sortOption) {
                case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
                case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
                case "last_updated": return new Date(b.updatedAt) - new Date(a.updatedAt);
                default: return 0;
            }
        });

        // Pagination
        const itemsPerPage = viewMode === "grid" ? 9 : 6;
        const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredShipments.slice(indexOfFirstItem, indexOfLastItem);
        
        const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
        const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

        return (
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* 🔍 Search + Filter + Sort + View Toggle */}
            <div className={`mb-8 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-lg border relative z-20 ${
                isDarkMode ? "bg-[#1a1010]/80 backdrop-blur-xl border-white/10" : "bg-white/80 backdrop-blur-xl border-white/40"
            }`}>
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder="ابحث برقم الشحنة أو ACID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 transition-all ${
                            isDarkMode 
                                ? "bg-black/30 border-white/10 text-white placeholder-gray-500 focus:ring-red-500/50" 
                                : "bg-gray-100 border-transparent text-gray-900 placeholder-gray-400 focus:ring-red-500/30"
                        }`}
                    />
                    <Search className={`absolute right-4 top-3.5 w-5 h-5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                </div>

                {/* Filter & Sort Buttons */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    
                    {/* Filter Button & Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={toggleFilter} 
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                                isFilterOpen ? "bg-red-600 text-white" : (isDarkMode ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-red-50 text-red-800 hover:bg-red-100")
                            }`}
                        >
                            <Filter size={18} />
                            <span className="hidden sm:inline">تصفية</span>
                        </button>
                        {isFilterOpen && (
                            <div className={`absolute top-full left-0 mt-2 w-56 p-3 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10 text-gray-200" : "bg-white border-gray-100 text-gray-700"}`} dir="rtl">
                                <h4 className="font-bold mb-2 text-sm opacity-70">تصفية حسب الحالة</h4>
                                <div className="space-y-1">
                                    {[
                                        { value: "الكل", label: "الكل" },
                                        { value: "Completed", label: "مكتملة" },
                                        { value: "Cancelled", label: "ملغاة" }
                                    ].map((status) => (
                                        <button
                                            key={status.value}
                                            onClick={() => { setSelectedStatus(status.value); setIsFilterOpen(false); }}
                                            className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                                                selectedStatus === status.value 
                                                    ? (isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-800")
                                                    : "hover:bg-gray-500/10"
                                            }`}
                                        >
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sort Button & Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={toggleSort} 
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                                isSortOpen ? "bg-red-600 text-white" : (isDarkMode ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200")
                            }`}
                        >
                            <SortAsc size={18} />
                            <span className="hidden sm:inline">ترتيب</span>
                        </button>
                        {isSortOpen && (
                            <div className={`absolute top-full left-0 mt-2 w-48 p-3 rounded-xl shadow-2xl border z-30 ${isDarkMode ? "bg-[#1e1e1e] border-white/10 text-gray-200" : "bg-white border-gray-100 text-gray-700"}`} dir="rtl">
                                <h4 className="font-bold mb-2 text-sm opacity-70">ترتيب حسب</h4>
                                {[
                                    { v: "newest", l: "الأحدث أولاً" },
                                    { v: "oldest", l: "الأقدم أولاً" },
                                    { v: "last_updated", l: "آخر تحديث" }
                                ].map((opt) => (
                                    <button
                                        key={opt.v}
                                        onClick={() => { setSortOption(opt.v); setIsSortOpen(false); }}
                                        className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                                            sortOption === opt.v
                                                ? (isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-800")
                                                : "hover:bg-gray-500/10"
                                        }`}
                                    >
                                        {opt.l}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View Mode Toggle */}
                    <div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === "grid" ? (isDarkMode ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-700") : (isDarkMode ? "text-gray-500" : "text-gray-400")}`}
                            title="عرض شبكة"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === "list" ? (isDarkMode ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-700") : (isDarkMode ? "text-gray-500" : "text-gray-400")}`}
                            title="عرض قائمة"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {shipments.length === 0 ? (
                <div className="text-center py-20 opacity-50">لا توجد شحنات مؤرشفة</div>
            ) : filteredShipments.length === 0 ? (
                 <div className="text-center py-20 opacity-50">لا توجد نتائج مطابقة للبحث</div>
            ) : (
                <>
                {viewMode === 'grid' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                     {currentItems.map((shipment) => (
                         <Link 
                            to={`/shipmentstatus/${shipment.shipmentCode || shipment.acid || shipment._id}`}
                            key={shipment._id || shipment.id} 
                            className={`block p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all hover:scale-[1.02] hover:shadow-xl group ${isDarkMode ? "bg-[#1a1010]/40 border-white/10 hover:border-red-900/30" : "bg-white border-gray-100 hover:border-red-100"}`}
                         >
                             <div className="flex items-start justify-between">
                                 <div className="flex items-center gap-4">
                                     <div className={`p-3 rounded-full ${isDarkMode ? "bg-white/5" : "bg-gray-100"}`}>
                                         <Ship size={24} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
                                     </div>
                                     <div className="overflow-hidden">
                                         <h4 className={`font-bold truncate ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{shipment.shipmentNumber || shipment.shipmentCode || "شحنة بدون رقم"}</h4>
                                         <p className="text-sm text-gray-500 truncate">ACID: {shipment.acid || "غير متوفر"}</p>
                                     </div>
                                 </div>
                                 {/* Type Badge */}
                                 {shipment.shipmentType && (
                                     <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                         shipment.shipmentType === 'export' || shipment.shipmentType === 'تصدير' 
                                         ? (isDarkMode ? "bg-orange-900/20 text-orange-400 border-orange-900/30" : "bg-orange-50 text-orange-700 border-orange-100")
                                         : (isDarkMode ? "bg-blue-900/20 text-blue-400 border-blue-900/30" : "bg-blue-50 text-blue-700 border-blue-100")
                                     }`}>
                                         {shipment.shipmentType === 'export' || shipment.shipmentType === 'تصدير' ? 'صادر' : 'وارد'}
                                     </span>
                                 )}
                             </div>
                             
                             <div className="mt-2 text-sm text-gray-500 flex justify-between items-center">
                                 <span>{new Date(shipment.createdAt).toLocaleDateString()}</span>
                                 <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {new Date(shipment.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                 </span>
                             </div>

                             <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                                 <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1">
                                     <CheckCircle size={12}/> {shipment.status}
                                 </span>
                                 <div className={`p-2 rounded-lg transition-colors ${isDarkMode ? "group-hover:bg-white/10 text-gray-400" : "group-hover:bg-gray-100 text-gray-600"}`}>
                                     <ChevronLeft size={20} />
                                 </div>
                             </div>
                         </Link>
                     ))}
                     </div>
                ) : (
                    <div className="space-y-3 mb-8">
                        {currentItems.map((shipment) => (
                            <Link 
                                to={`/shipmentstatus/${shipment.shipmentCode || shipment.acid || shipment._id}`}
                                key={shipment._id || shipment.id} 
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:shadow-lg group ${
                                isDarkMode 
                                    ? "bg-[#1a1010]/80 border-white/10 hover:border-red-900/50" 
                                    : "bg-white border-gray-100 hover:border-red-200"
                            }`}>
                                <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-900/30" : "bg-red-50"}`}>
                                    <Ship className={isDarkMode ? "text-red-400" : "text-red-700"} size={24} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className={`font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                            {shipment.shipmentNumber || shipment.shipmentCode || "—"}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"}`}>
                                            {shipment.status}
                                        </span>
                                        {/* Type Badge */}
                                        {shipment.shipmentType && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border mx-1 ${
                                                shipment.shipmentType === 'export' || shipment.shipmentType === 'تصدير' 
                                                ? (isDarkMode ? "bg-orange-900/20 text-orange-400 border-orange-900/30" : "bg-orange-50 text-orange-700 border-orange-100")
                                                : (isDarkMode ? "bg-blue-900/20 text-blue-400 border-blue-900/30" : "bg-blue-50 text-blue-700 border-blue-100")
                                            }`}>
                                                {shipment.shipmentType === 'export' || shipment.shipmentType === 'تصدير' ? 'صادر' : 'وارد'}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                                        ACID: {shipment.acid || "—"} • {new Date(shipment.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className={`shrink-0 transition-transform group-hover:-translate-x-1 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                                    <ChevronLeft size={20} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                 {/* Pagination */}
                 {totalPages > 1 && (
                    <div className={`flex flex-wrap justify-center items-center gap-3 mt-8 p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-white shadow-sm"}`} dir="ltr">
                        <button onClick={prevPage} disabled={currentPage === 1} className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-white/10"}`}>
                            <ChevronLeft size={20} />
                        </button>
                        <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                            صفحة {currentPage} من {totalPages}
                        </span>
                        <button onClick={nextPage} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-white/10"}`}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                 )}
                </>
            )}
         </div>
    ); };

    const FinancialsTab = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            
            {/* 🧾 Paid Invoices Section */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-800"}`}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>أرشيف الفواتير المدفوعة</h3>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>جميع الفواتير التي تم سدادها بنجاح ({invoices.length})</p>
                    </div>
                </div>

                {invoices.length === 0 ? (
                    <div className="text-center py-16 opacity-50 border rounded-2xl border-dashed">
                        <p>لا توجد فواتير مؤرشفة</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invoices.map(inv => {
                            const total = getInvoiceTotalEGP(inv);
                            return (
                                <div key={inv._id} className={`group relative p-5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg ${isDarkMode ? "bg-[#1a1010]/80 border-white/10 hover:border-red-900/50" : "bg-white border-gray-100 hover:border-red-200"}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-gray-50"}`}>
                                            <CheckCircle size={20} className="text-green-500" />
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"}`}>
                                            تم الدفع
                                        </span>
                                    </div>

                                    <h3 className={`font-bold text-lg mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{inv.invoiceNumber}</h3>
                                    <p className="text-gray-500 text-xs mb-4">{new Date(inv.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                                    <div className="space-y-2 mb-4">
                                        {inv.invoiceItems?.slice(0, 2).map((item, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{item.item}</span>
                                                <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>{item.itemPrice} {item.currencyType}</span>
                                            </div>
                                        ))}
                                        {inv.invoiceItems?.length > 2 && (
                                            <p className="text-xs text-gray-500">+ {inv.invoiceItems.length - 2} بنود أخرى</p>
                                        )}
                                    </div>

                                    <div className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? "border-white/10" : "border-gray-100"}`}>
                                        <div>
                                            <p className="text-xs text-gray-500">الإجمالي المدفوع</p>
                                            <p className={`font-bold ${isDarkMode ? "text-green-400" : "text-green-700"}`}>{total.toLocaleString()} ج.م</p>
                                        </div>
                                    </div>
                                </div>
                            ); 
                        })}
                    </div>
                )}
            </div>

            {/* 💰 Payment Receipts Section */}
            <div className={`pt-8 border-t ${isDarkMode ? "border-white/10" : "border-gray-200"}`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}>
                        <History size={24} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>سجل إيصالات الدفع</h3>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>سجل بجميع عمليات التحويل البنكي والإيصالات المرفقة</p>
                    </div>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <p>لا توجد عمليات دفع سابقة</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {payments.map(payment => (
                            <div key={payment._id} className={`p-5 rounded-2xl border transition-all ${isDarkMode ? "bg-[#1a1010]/50 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{new Date(payment.createdAt).toLocaleDateString('ar-EG')}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDarkMode ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                                            {payment.paymentMethod || "تحويل بنكي"}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {payment.transactions?.map((tx, idx) => (
                                        <div key={idx} className="flex gap-3 items-center group cursor-pointer" onClick={() => handleViewDocument(tx.imageUrls, `إيصال دفع #${idx+1}`, 'payment')}>
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0 border border-gray-300 relative">
                                                <img src={tx.imageUrls} onError={(e) => e.target.src='/placeholder.png'} className="w-full h-full object-cover" alt="receipt" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Eye size={16} className="text-white"/>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>إيصال #{idx + 1}</p>
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
    );

    return (
        <div className={`flex flex-col min-h-screen font-sans relative transition-colors duration-300 ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`} dir="rtl">
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {isDarkMode ? (
                    <>
                        <div className="absolute top-[0%] left-[20%] w-[600px] h-[600px] bg-[#690000]/5 rounded-full filter blur-[120px] animate-pulse-glow"></div>
                        <div className="absolute bottom-[0%] right-[0%] w-[500px] h-[500px] bg-[#2b0000]/10 rounded-full filter blur-[100px]"></div>
                    </>
                ) : (
                    <div className="absolute top-0 right-0 w-full h-[400px] bg-gradient-to-b from-red-50/40 to-transparent"></div>
                )}
            </div>

            <Header />

            <main className="flex-grow w-full pt-28 pb-12 px-4 md:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-10">
                        <h1 className={`text-4xl font-bold mb-2 flex items-center gap-3 ${isDarkMode ? "text-white" : "text-red-900"}`}>
                            <Archive className="text-red-500" strokeWidth={3} />
                            الأرشيف المتكامل
                        </h1>
                        <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            سجل الحوافز، الشحنات المكتملة، والمستندات السابقة في مكان واحد.
                        </p>
                    </div>

                    {/* Tabs Navigation */}
                    <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl mb-8 w-fit ${isDarkMode ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200 shadow-sm"}`}>
                        {[
                            { id: 'overview', icon: LayoutGrid, label: 'نظرة عامة' },
                            { id: 'shipments', icon: Ship, label: 'أرشيف الشحنات' },
                            { id: 'financial', icon: CreditCard, label: 'السجل المالي' },
                            { id: 'documents', icon: Folder, label: 'مستودع الملفات' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${
                                    activeTab === tab.id 
                                    ? "bg-red-600 text-white shadow-lg shadow-red-500/20" 
                                    : (isDarkMode ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50")
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Rendering */}
                    <div className="min-h-[400px]">
                        {loading ? (
                             <div className="flex flex-col items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                                <p className="text-gray-500">جاري استرجاع الأرشيف...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && <OverviewTab />}
                                {activeTab === 'documents' && <DocumentsTab />}
                                {activeTab === 'shipments' && <ShipmentsTab />}
                                {activeTab === 'financial' && <FinancialsTab />}
                            </>
                        )}
                    </div>

                </div>
            </main>

            {/* 👓 File Viewer Modal */}
            <FileViewerModal 
                isOpen={viewerData.open} 
                onClose={() => setViewerData(prev => ({ ...prev, open: false }))}
                fileUrl={viewerData.url}
                fileName={viewerData.name}
                fileType={viewerData.type}
            />

            <Footer />
        </div>
    );
}

