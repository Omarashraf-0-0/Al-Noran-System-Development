import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
    Calendar, CheckCircle, Clock, FileText, MapPin, 
    ArrowRight, Box, Anchor, DollarSign, FileCheck,
    Download, Eye, Shield, Truck, Package, User, AlertCircle
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";
import FileViewerModal from "../components/FileViewerModal";

const ShipmentHistory = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [shipment, setShipment] = useState(null);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewerData, setViewerData] = useState({ open: false, url: null, name: null, type: null });

    const token = localStorage.getItem("token");

    // Theme Colors
    const theme = {
        bg: isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-50",
        cardBg: isDarkMode ? "bg-[#141419]/80 backdrop-blur-md border-white/5" : "bg-white border-gray-100",
        text: isDarkMode ? "text-white" : "text-gray-900",
        subText: isDarkMode ? "text-gray-400" : "text-gray-500",
        accent: "text-[#D4AF37]", // Gold
        primary: "bg-[#1ba3b6]", // Teal
        primaryText: "text-[#1ba3b6]",
        divider: isDarkMode ? "border-white/10" : "border-gray-100",
    };

    useEffect(() => {
        if (!token) {
            toast.error("يجب تسجيل الدخول أولاً");
            navigate("/login");
            return;
        }
        fetchShipmentData();
    }, [shipmentId, token]);

    const fetchShipmentData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch Shipment Details
            const shipmentRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShipment(shipmentRes.data);

            // 2. Fetch History Logs (Real Data)
            try {
                const historyRes = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}/history`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                // If logs allow, merge or use them. If empty (legacy shipment), fallback to heuristic?
                // For now, let's prefer real logs if they exist, but maybe show a "Legacy" note if empty?
                // Actually, let's mix them if we want, or just show logs.
                // The user asked for "everything that happens".
                
                if (historyRes.data && historyRes.data.length > 0) {
                     setHistoryLogs(historyRes.data);
                } else {
                     // Fallback for old shipments before this feature
                     const legacyEvents = generateLegacyTimeline(shipmentRes.data);
                     setHistoryLogs(legacyEvents);
                }

            } catch (historyErr) {
                console.warn("History API not ready yet or failed:", historyErr);
                // Fallback
                setHistoryLogs(generateLegacyTimeline(shipmentRes.data));
            }

            // 3. Fetch extra uploads
            try {
                const uploadsRes = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/uploads?category=shipment&relatedId=${shipmentRes.data._id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setUploads(uploadsRes.data?.uploads || []);
            } catch (err) {
                console.log("No extra uploads found");
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("فشل تحميل بيانات الشحنة");
        } finally {
            setLoading(false);
        }
    };

    // Fallback generator for old shipments
    const generateLegacyTimeline = (data) => {
        const events = [];
        if (data.createdAt) {
            events.push({
                action: "CREATED",
                publicDescription: "تم إنشاء الشحنة",
                createdAt: data.createdAt,
                 performedBy: data.user_id // approximations
            });
        }
        if (data.status) {
             events.push({
                action: "STATUS_UPDATE",
                publicDescription: `الحالة الحالية: ${data.status}`,
                createdAt: data.updatedAt,
                isLatest: true
            });
        }
        return events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const handlePreview = async (fileIdOrUrl, name, type) => {
        // If it looks like a MongoID, fetch fresh presigned URL from API
        const isMongoId = fileIdOrUrl && /^[0-9a-fA-F]{24}$/.test(fileIdOrUrl);
        
        if (isMongoId) {
            const toastId = toast.loading("جاري جلب المستند...");
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/uploads/${fileIdOrUrl}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (response.data?.url || response.data?.upload?.url || response.data?.presignedUrl) {
                    const freshUrl = response.data.url || response.data.upload?.url || response.data.presignedUrl;
                    const fileName = response.data.upload?.filename || name;
                    const fileType = response.data.upload?.mimetype || type;
                    toast.success("تم جلب المستند", { id: toastId });
                    
                    setViewerData({
                        open: true,
                        url: freshUrl,
                        name: fileName,
                        type: fileType || (fileName?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                        fileId: fileIdOrUrl // ✅ Pass fileId for proxy download fallback
                    });
                } else {
                    toast.error("فشل العثور على رابط المستند", { id: toastId });
                }
            } catch (err) {
                console.error("Error fetching document:", err);
                toast.error("فشل تحميل المستند", { id: toastId });
            }
        } else if (fileIdOrUrl) {
            // If it's already a URL, use it directly (for extra uploads that already have presigned URLs)
            setViewerData({
                open: true,
                url: fileIdOrUrl,
                name: name,
                type: type || (name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
            });
        } else {
            toast.error("رابط الملف غير متوفر");
        }
    };

    const getIconForAction = (action) => {
        switch (action) {
            case "CREATED": return <Box size={20} />;
            case "STATUS_UPDATE": return <Truck size={20} />;
            case "ASSIGNMENT": return <User size={20} />;
            case "DOC_REQUEST": return <FileText size={20} />;
            case "DOC_UPLOAD": return <FileCheck size={20} />;
            case "INFO_UPDATE": return <CheckCircle size={20} />;
            default: return <Clock size={20} />;
        }
    };

    const getColorForAction = (action) => {
        switch (action) {
            case "CREATED": return "blue";
            case "STATUS_UPDATE": return "teal";
            case "ASSIGNMENT": return "purple";
            case "DOC_REQUEST": return "amber";
            case "DOC_UPLOAD": return "green";
            default: return "gray";
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1ba3b6]"></div>
            </div>
        );
    }

    if (!shipment) return null;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme.bg}`} dir="rtl">
            <Header />

            <main className="pt-28 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <button 
                            onClick={() => navigate(-1)}
                            className={`mb-4 flex items-center gap-2 text-sm font-bold transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            <ArrowRight size={18} /> العودة للشحنات
                        </button>
                        <h1 className={`text-3xl md:text-4xl font-extrabold flex items-center gap-3 ${theme.text}`}>
                            سجل حركات الشحنة
                            <span className="text-lg font-normal px-3 py-1 rounded-full bg-[#1ba3b6]/10 text-[#1ba3b6] border border-[#1ba3b6]/20">
                                {shipment.acid || `#${shipment._id.slice(-6)}`}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Timeline */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className={`rounded-3xl p-8 border shadow-lg ${theme.cardBg} ${theme.divider}`}>
                            <h2 className={`text-xl font-bold mb-8 flex items-center gap-2 ${theme.text}`}>
                                <Clock className="text-[#D4AF37]" /> سجل العمليات
                            </h2>

                            {historyLogs.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <AlertCircle className="mx-auto mb-2" size={32}/>
                                    <p>لا توجد سجلات بعد</p>
                                </div>
                            ) : (
                                <div className="relative border-r-2 border-[#1ba3b6]/20 mr-4 space-y-8">
                                    {historyLogs.map((log, index) => {
                                        const color = getColorForAction(log.action);
                                        const performerName = log.performedBy?.fullname || log.performedBy?.username || "النظام";
                                        
                                        return (
                                            <div key={index} className="relative pr-8 group">
                                                {/* Dot/Icon */}
                                                <div className={`absolute -right-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-300 group-hover:scale-125
                                                    ${index === 0 ? 'bg-[#1ba3b6] border-[#1ba3b6] shadow-[0_0_15px_#1ba3b6]' : 'bg-[#0a0a0a] border-gray-500'}
                                                `}></div>

                                                {/* Card */}
                                                <div className={`p-5 rounded-2xl border transition-all duration-300 hover:bg-[#1ba3b6]/5 ${theme.cardBg} ${theme.divider}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`p-2 rounded-lg 
                                                                ${color === 'green' ? 'bg-green-500/10 text-green-500' :
                                                                  color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                                                                  color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                                                                  color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
                                                                  'bg-[#1ba3b6]/10 text-[#1ba3b6]'
                                                                }`}>
                                                                {getIconForAction(log.action)}
                                                            </span>
                                                            <div>
                                                                <h3 className={`font-bold text-lg ${theme.text}`}>
                                                                    {log.publicDescription || log.description}
                                                                </h3>
                                                                {log.performedBy && (
                                                                     <p className="text-xs opacity-50 mt-1">قام بها: {performerName}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-mono opacity-60 dir-ltr text-left whitespace-nowrap">
                                                            {new Date(log.createdAt).toLocaleDateString("ar-EG")} <br/>
                                                            {new Date(log.createdAt).toLocaleTimeString("ar-EG", {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Details & Documents */}
                    <div className="space-y-6">
                        
                         {/* Shipment Info Card */}
                         <div className={`rounded-3xl p-6 border shadow-lg ${theme.cardBg} ${theme.divider}`}>
                            <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${theme.text}`}>
                                <FileText className="text-[#1ba3b6]" /> بيانات الشحنة
                            </h3>
                            
                            <div className="space-y-4">
                                <InfoRow label="الميناء" value={shipment.port_name} icon={<Anchor size={16}/>} theme={theme} />
                                <InfoRow label="الدولة" value={shipment.country} icon={<MapPin size={16}/>} theme={theme} />
                                <InfoRow label="عدد الحاويات" value={shipment.num_of_containers} icon={<Box size={16}/>} theme={theme} />
                                <InfoRow label="البوليصة" value={shipment.number46 || "غير محدد"} icon={<FileCheck size={16}/>} theme={theme} />
                                
                                <div className={`h-px w-full my-4 ${theme.divider}`}></div>
                                
                                <InfoRow label="رسوم التخليص" value={`${shipment.clearance_fees || 0} ج.م`} icon={<DollarSign size={16}/>} theme={theme} />
                                <InfoRow label="مصروفات" value={`${shipment.expenses_and_tips || 0} ج.م`} icon={<DollarSign size={16}/>} theme={theme} />
                            </div>
                        </div>

                         {/* Documents Card */}
                        {(shipment.requiredDocuments?.some(d => d.uploaded) || uploads.length > 0) && (
                            <div className={`rounded-3xl p-6 border shadow-lg ${theme.cardBg} ${theme.divider}`}>
                                <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${theme.text}`}>
                                    <Download className="text-green-500" /> الملفات المتاحة
                                </h3>

                                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                    {/* Required Docs */}
                                    {shipment.requiredDocuments?.filter(d => d.uploaded).map((doc, idx) => (
                                        <DocItem 
                                            key={`req-${idx}`}
                                            name={doc.name}
                                            date={doc.uploadedAt}
                                            onClick={() => handlePreview(doc.fileId, doc.name)}
                                            theme={theme}
                                        />
                                    ))}
                                    
                                    {/* Extra Uploads */}
                                    {uploads.map((up, idx) => (
                                        <DocItem 
                                            key={`up-${idx}`}
                                            name={up.originalname}
                                            date={up.uploadedAt}
                                            isNew
                                            onClick={() => handlePreview(up.presignedUrl || up.url, up.originalname, up.mimetype)}
                                            theme={theme}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            <FileViewerModal 
                isOpen={viewerData.open}
                onClose={() => setViewerData({...viewerData, open: false})}
                fileUrl={viewerData.url}
                fileName={viewerData.name}
                fileType={viewerData.type}
            />
        </div>
    );
};

// Helper Components
const InfoRow = ({ label, value, icon, theme }) => (
    <div className="flex justify-between items-center group">
        <span className={`text-sm flex items-center gap-2 ${theme.subText}`}>
            <span className="opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span> {label}
        </span>
        <span className={`font-bold ${theme.text}`}>{value || "-"}</span>
    </div>
);

const DocItem = ({ name, date, onClick, isNew, theme }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all hover:translate-x-1 ${theme.divider} hover:border-[#1ba3b6]/30 group text-right`}
    >
        <div className="flex items-center gap-3 overflow-hidden">
            <div className={`p-2 rounded-lg ${isNew ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                <FileText size={16} />
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${theme.text} group-hover:text-[#1ba3b6]`}>{name}</p>
                <p className="text-[10px] opacity-60">{new Date(date).toLocaleDateString("ar-EG")}</p>
            </div>
        </div>
        <Eye size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${theme.subText}`} />
    </button>
);

export default ShipmentHistory;
