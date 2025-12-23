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
    Download, Upload, Edit, ArrowLeft, Anchor
} from 'lucide-react';

const STATUS_STEPS = [
	{ key: "documents_verification", label: "التحقق من المستندات" },
	{ key: "regulatory_inspection", label: "فحص الجهات الرقابية" },
	{ key: "payment_cleared", label: "تم السداد" },
	{ key: "goods_loaded", label: "تم التحميل" },
	{ key: "in_transit", label: "في الطريق" },
	{ key: "delivered", label: "تم التسليم" },
	{ key: "completed", label: "مكتمل" },
];

const EmployeeExportShipmentDetailsPage = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusModal, setStatusModal] = useState(false);
	  const [newStatus, setNewStatus] = useState("");
	  const [statusNotes, setStatusNotes] = useState("");
    const [processingAction, setProcessingAction] = useState(false);


    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchShipmentDetails();
    }, [shipmentId]);

    const fetchShipmentDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/export-shipments/${shipmentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShipment(response.data.shipment || response.data.data);
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

    const handleStatusUpdate = async () => {
      if (!newStatus) return;
      setProcessingAction(true);
      try {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${shipmentId}/status`,
          { status: newStatus, notes: statusNotes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("تم تحديث الحالة بنجاح");
        setStatusModal(false);
        fetchShipmentDetails();
      } catch (error) {
         toast.error("فشل تحديث الحالة");
      } finally {
        setProcessingAction(false);
      }
    };

    const getCurrentStepIndex = () => {
        if (!shipment) return 0;
        return STATUS_STEPS.findIndex(s => s.key === shipment.currentStatus);
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
                    <span>الشحنات التصديرية</span>
                    <ChevronRight size={14} className="rotate-180" />
                    <span className="font-bold text-[#1ba3b6]">{shipment.shipmentNumber || 'تفاصيل الشحنة'}</span>
                </div>

                {/* Header Card */}
                <div className={`rounded-3xl p-6 md:p-8 md:flex justify-between items-start mb-8 shadow-lg relative overflow-hidden ${theme.cardBg} border`}>
                    <div className="relative z-10 w-full">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-[#1ba3b6]/10 text-[#1ba3b6] text-xs font-bold border border-[#1ba3b6]/20">
                                {shipment.shippingMethod === 'air' ? 'جوي ✈️' : 'بحري 🚢'}
                            </span>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                shipment.currentStatus === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : 
                                shipment.currentStatus === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-blue-100 text-blue-700 border-blue-200'
                            }`}>
                                {STATUS_STEPS.find(s => s.key === shipment.currentStatus)?.label || shipment.currentStatus}
                            </span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div>
                              <h1 className={`text-3xl font-bold mb-2 ${theme.text}`}>
                                  شحنة رقم {shipment.shipmentNumber || `#${shipment._id.slice(-6)}`}
                              </h1>
                              <p className={`flex items-center gap-2 ${theme.subText}`}>
                                  <Calendar size={16} />
                                  تاريخ الإنشاء: <span className="text-[#1ba3b6] font-bold">{new Date(shipment.createdAt).toLocaleDateString('ar-EG')}</span>
                              </p>
                           </div>
                           
                           <button 
                             onClick={() => setStatusModal(true)}
                             className="px-6 py-3 rounded-xl bg-[#1ba3b6] text-white font-bold hover:bg-[#158a9b] transition shadow-lg shadow-[#1ba3b6]/20 flex items-center gap-2"
                           >
                             <Edit size={18} /> تحديث الحالة
                           </button>
                        </div>
                    </div>

                    {/* Decorative Icon */}
                    <div className="absolute left-0 top-0 h-full w-64 bg-gradient-to-r from-[#1ba3b6]/10 to-transparent pointer-events-none"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Right Column: Main Details */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Stepper */}
                        <div className={`p-6 rounded-2xl border ${theme.cardBg} overflow-hidden`}>
                           <h3 className={`font-bold mb-6 flex items-center gap-2 ${theme.text}`}>
                                <Truck className="text-[#1ba3b6]" /> تتبع الشحنة
                           </h3>
                           <div className="relative flex justify-between items-center pb-8 overflow-x-auto">
                              <div className="absolute top-[18px] left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -z-0"></div>
                              {STATUS_STEPS.map((step, idx) => {
                                 const isCompleted = idx <= getCurrentStepIndex();
                                 const isCurrent = idx === getCurrentStepIndex();
                                 return (
                                   <div key={idx} className="flex flex-col items-center relative z-10 min-w-[80px]">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300
                                        ${isCompleted ? 'bg-[#1ba3b6] border-[#1ba3b6] text-white' : 'bg-gray-200 dark:bg-gray-700 border-transparent text-gray-400'}
                                      `}>
                                        {isCompleted ? <CheckCircle size={16} /> : <span className="text-xs">{idx + 1}</span>}
                                      </div>
                                      <span className={`text-[10px] font-bold mt-2 text-center max-w-[80px] ${isCurrent ? 'text-[#1ba3b6]' : theme.subText}`}>
                                        {step.label}
                                      </span>
                                   </div>
                                 );
                              })}
                           </div>
                        </div>

                        {/* Shipment Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-6 rounded-2xl border ${theme.cardBg}`}>
                                <h3 className={`font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
                                    <MapPin className="text-[#1ba3b6]" /> الوجهة
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                           <MapPin size={20} />
                                        </div>
                                        <div>
                                            <span className={`text-xs block ${theme.subText}`}>إلى الدولة</span>
                                            <p className={`font-bold text-lg ${theme.text}`}>{shipment.destinationCountry}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                                           <Anchor size={20} />
                                        </div>
                                        <div>
                                            <span className={`text-xs block ${theme.subText}`}>الميناء / المطار</span>
                                            <p className={`font-bold ${theme.text}`}>{shipment.destinationPort || 'غير محدد'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-6 rounded-2xl border ${theme.cardBg}`}>
                                <h3 className={`font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
                                    <FileText className="text-[#1ba3b6]" /> بيانات UCR
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <span className={theme.subText}>رقم UCR</span>
                                        <span className={`font-bold text-[#1ba3b6] font-mono`}>{shipment.ucrRequestId?.ucrNumber || '—'}</span>
                                    </div>
                                     <div className="flex justify-between py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <span className={theme.subText}>قيمة البضاعة</span>
                                        <span className={`font-bold ${theme.text}`}>
                                           {shipment.ucrRequestId?.valueInEGP ? `${shipment.ucrRequestId.valueInEGP.toLocaleString()} EGP` : '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className={theme.subText}>نوع الشهادة</span>
                                        <span className={`font-bold ${theme.text}`}>
                                          {shipment.ucrRequestId?.certificationType === 'noran' ? 'شهادة النوران' : 'شهادة العميل'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {shipment.notes && (
                           <div className={`p-6 rounded-2xl border ${theme.cardBg} border-l-4 border-l-amber-500`}>
                               <h3 className={`font-bold mb-2 ${theme.text} flex items-center gap-2`}>
                                 <AlertCircle size={18} className="text-amber-500" /> ملاحظات
                               </h3>
                               <p className={theme.subText}>{shipment.notes}</p>
                           </div>
                        )}
                    </div>

                    {/* Left Column: People & Docs */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Client Info */}
                        <div className={`p-6 rounded-2xl border ${theme.cardBg}`}>
                            <h3 className={`font-bold mb-4 ${theme.text}`}>بيانات العميل</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {shipment.userId?.username?.charAt(0) || 'C'}
                                </div>
                                <div>
                                    <p className={`font-bold ${theme.text}`}>{shipment.userId?.fullname || shipment.userId?.username}</p>
                                    <p className={`text-xs ${theme.subText}`}>{shipment.userId?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                         <div className={`p-6 rounded-2xl border ${theme.cardBg}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`font-bold ${theme.text}`}>المستندات المطلوبة</h3>
                            </div>
                            <div className="space-y-2">
                                {/* Only allow download for now, complex management in separate modal if needed */}
                                {shipment.requiredDocuments && shipment.requiredDocuments.length > 0 ? (
                                    shipment.requiredDocuments.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                                            <div className="flex items-center gap-2">
                                                {doc.uploaded ? <CheckCircle size={16} className="text-green-500" /> : <Clock size={16} className="text-amber-500" />}
                                                <span className={`text-xs font-medium ${theme.text}`}>{doc.name}</span>
                                            </div>
                                            {doc.uploaded && (
                                              <button 
                                                onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/uploads/${doc.fileId}`, '_blank')}
                                                className="text-[#1ba3b6] hover:bg-[#1ba3b6]/10 p-1.5 rounded-full"
                                              >
                                                <Download size={14} />
                                              </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className={`text-xs text-center py-4 ${theme.subText}`}>لا توجد مستندات مطلوبة حالياً</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            {/* Status Modal */}
            {statusModal && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                onClick={() => setStatusModal(false)}
              >
                <div 
                  className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${theme.cardBg}`}
                  onClick={e => e.stopPropagation()}
                >
                  <h3 className={`text-xl font-bold mb-6 ${theme.text}`}>تحديث حالة الشحنة</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${theme.text}`}>الحالة الجديدة</label>
                      <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className={`w-full p-3 rounded-xl border outline-none ${theme.bg} ${theme.text} ${theme.divider}`}
                      >
                        <option value="">اختر الحالة...</option>
                        {STATUS_STEPS.map(step => (
                          <option key={step.key} value={step.key}>{step.label}</option>
                        ))}
                        <option value="cancelled">ملغي ❌</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-bold mb-2 ${theme.text}`}>ملاحظات</label>
                      <textarea 
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        rows={3}
                        className={`w-full p-3 rounded-xl border outline-none ${theme.bg} ${theme.text} ${theme.divider} resize-none`}
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

export default EmployeeExportShipmentDetailsPage;
