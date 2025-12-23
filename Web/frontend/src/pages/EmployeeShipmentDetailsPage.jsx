import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useTheme } from '../context/ThemeContext';
import { 
    ChevronRight, Package, Truck, Calendar, MapPin, 
    FileText, User, Users, CheckCircle, Clock, AlertCircle,
    Download, Upload, Edit, ArrowLeft
} from 'lucide-react';

const EmployeeShipmentDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchShipmentDetails();
    }, [id]);

    const fetchShipmentDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/shipments/id/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShipment(response.data);
        } catch (err) {
            console.error(err);
            setError("فشل تحميل بيانات الشحنة");
        } finally {
            setLoading(false);
        }
    };

    // Theme Variables
    const theme = {
        bg: isDarkMode ? 'bg-[#050a0d]' : 'bg-gray-50',
        cardBg: isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200',
        text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
        subText: isDarkMode ? 'text-gray-400' : 'text-gray-500', 
        accent: 'text-[#1ba3b6]',
        accentBg: 'bg-[#1ba3b6]',
        divider: isDarkMode ? 'border-gray-700' : 'border-gray-100'
    };

    if (loading) return <div className="min-h-screen pt-20"><LoadingSpinner /></div>;
    if (error) return <div className="min-h-screen pt-20"><ErrorMessage message={error} onRetry={fetchShipmentDetails} /></div>;
    if (!shipment) return null;

    return (
        <div className={`min-h-screen font-sans ${theme.bg}`}>
            <Header />
            
            <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
                
                {/* Breadcrumbs & Back */}
                <div className="flex items-center gap-2 text-sm mb-6 text-gray-500">
                    <button onClick={() => navigate(-1)} className="hover:text-[#1ba3b6] flex items-center gap-1 transition-colors">
                        <ArrowLeft size={14} /> للخلف
                    </button>
                    <ChevronRight size={14} className="rotate-180" />
                    <span>الشحنات</span>
                    <ChevronRight size={14} className="rotate-180" />
                    <span className="font-bold text-[#1ba3b6]">{shipment.tracking_number || 'تفاصيل الشحنة'}</span>
                </div>

                {/* Header Card */}
                <div className={`rounded-3xl p-6 md:p-8 md:flex justify-between items-start mb-8 shadow-lg relative overflow-hidden ${theme.cardBg} border`}>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-[#1ba3b6]/10 text-[#1ba3b6] text-xs font-bold border border-[#1ba3b6]/20">
                                {shipment.shipment_type || 'بحري'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                shipment.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 
                                shipment.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                'bg-blue-100 text-blue-700 border-blue-200'
                            }`}>
                                {shipment.status}
                            </span>
                        </div>
                        <h1 className={`text-3xl font-bold mb-2 ${theme.text}`}>
                            شحنة رقم {shipment.tracking_number}
                        </h1>
                        <p className={`flex items-center gap-2 ${theme.subText}`}>
                            <Calendar size={16} />
                            تاريخ الوصول المتوقع: <span className="text-[#1ba3b6] font-bold">{shipment.arrivalDate ? new Date(shipment.arrivalDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                        </p>
                    </div>

                    {/* Decorative Icon */}
                    <div className="absolute left-0 top-0 h-full w-48 bg-gradient-to-r from-[#1ba3b6]/10 to-transparent pointer-events-none"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Right Column: Main Details */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Shipment Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-6 rounded-2xl border ${theme.cardBg}`}>
                                <h3 className={`font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
                                    <MapPin className="text-[#1ba3b6]" /> مسار الشحنة
                                </h3>
                                <div className="space-y-4 relative">
                                    <div className="flex items-start gap-3">
                                        <div className="flex flex-col items-center">
                                           <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                           <div className="w-0.5 h-10 bg-gray-200"></div>
                                        </div>
                                        <div>
                                            <span className={`text-xs block ${theme.subText}`}>من الدولة</span>
                                            <p className={`font-bold ${theme.text}`}>{shipment.country}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-3 h-3 rounded-full bg-[#1ba3b6]"></div>
                                        <div>
                                            <span className={`text-xs block ${theme.subText}`}>إلى الميناء</span>
                                            <p className={`font-bold ${theme.text}`}>{shipment.port_name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-6 rounded-2xl border ${theme.cardBg}`}>
                                <h3 className={`font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
                                    <Package className="text-[#1ba3b6]" /> تفاصيل الحاوية
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <span className={theme.subText}>عدد الحاويات</span>
                                        <span className={`font-bold ${theme.text}`}>{shipment.num_of_containers}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <span className={theme.subText}>أنواع الحاويات</span>
                                        <span className={`font-bold ${theme.text}`}>{shipment.type_of_containers?.join(', ')}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className={theme.subText}>رقم البوليصة</span>
                                        <span className={`font-bold ${theme.text}`}>{shipment.policy || 'غير متوفر'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className={`p-6 rounded-2xl border ${theme.cardBg}`}>
                             <h3 className={`font-bold mb-6 flex items-center gap-2 text-lg ${theme.text}`}>
                                <FileText className="text-[#1ba3b6]" /> التفاصيل المالية والفاتورة
                            </h3>
                            {/* Make this section richer if data available */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <span className={`block text-xs mb-1 ${theme.subText}`}>قيمة الشحنة</span>
                                    <span className={`text-xl font-bold ${theme.text}`}>$0.00</span>
                                </div>
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <span className={`block text-xs mb-1 ${theme.subText}`}>الجمارك المقدرة</span>
                                    <span className={`text-xl font-bold ${theme.text}`}>EGP 0.00</span>
                                </div>
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <span className={`block text-xs mb-1 ${theme.subText}`}>الضرائب</span>
                                    <span className={`text-xl font-bold ${theme.text}`}>EGP 0.00</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Column: People & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* People */}
                        <div className={`p-6 rounded-2xl border ${theme.cardBg}`}>
                            <h3 className={`font-bold mb-4 ${theme.text}`}>الأطراف المعنية</h3>
                            
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {shipment.user_id?.username?.charAt(0)}
                                </div>
                                <div>
                                    <span className={`text-xs block ${theme.subText}`}>العميل</span>
                                    <p className={`font-bold text-sm ${theme.text}`}>{shipment.user_id?.fullname || shipment.user_id?.username}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                    {shipment.employee_id?.username?.charAt(0) || 'M'}
                                </div>
                                <div>
                                    <span className={`text-xs block ${theme.subText}`}>الموظف المسؤول</span>
                                    <p className={`font-bold text-sm ${theme.text}`}>{shipment.employee_id?.fullname || shipment.employee_id?.username || 'غير معين'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                         <div className={`p-6 rounded-2xl border ${theme.cardBg}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`font-bold ${theme.text}`}>المستندات</h3>
                                <button className="text-xs text-[#1ba3b6] hover:underline flex items-center gap-1">
                                    <Upload size={12} /> رفع
                                </button>
                            </div>
                            <div className="space-y-2">
                                {shipment.uploads && shipment.uploads.length > 0 ? (
                                    shipment.uploads.map((doc, idx) => (
                                        <a href={doc.s3Url} target="_blank" key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText size={16} className="text-gray-400 shrink-0" />
                                                <span className={`text-xs truncate ${theme.text}`}>{doc.originalName || `ملف ${idx+1}`}</span>
                                            </div>
                                            <Download size={14} className="text-[#1ba3b6]" />
                                        </a>
                                    ))
                                ) : (
                                    <p className={`text-xs text-center py-4 ${theme.subText}`}>لا توجد مستندات</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
};

export default EmployeeShipmentDetailsPage;
