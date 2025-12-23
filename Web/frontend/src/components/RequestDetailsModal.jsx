import React, { useState } from 'react';
import { X, FileText, Download, User, Globe, Box, Calendar, Phone, Mail, Building, Package, Eye, Loader2 } from 'lucide-react';
import FileViewerModal from './FileViewerModal';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const RequestDetailsModal = ({ show, onClose, title, data, type = 'acid', children }) => {
    const [viewerData, setViewerData] = useState({ open: false, url: null, name: null, type: null, fileId: null });
    const [loadingDoc, setLoadingDoc] = useState(null);

    if (!show || !data) return null;

    const isDarkMode = document.documentElement.classList.contains('dark');

    const theme = {
        bg: isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200',
        text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
        subText: isDarkMode ? 'text-gray-400' : 'text-gray-500', 
        label: isDarkMode ? 'text-gray-300' : 'text-gray-700',
        input: isDarkMode ? 'bg-black/30 border-gray-600' : 'bg-gray-50 border-gray-200',
        divider: isDarkMode ? 'border-gray-700' : 'border-gray-100',
        cardBg: isDarkMode ? 'bg-white/5' : 'bg-gray-50'
    };

    // Fetch fresh presigned URL before viewing (like DocumentUploadPage does)
    const handleViewDocument = async (file) => {
        const uploadId = file._id || file.id;
        if (!uploadId) {
            // Fallback: try using the existing URL
            setViewerData({
                open: true,
                url: file.s3Url || file.url || file.presignedUrl,
                name: file.originalName || 'مستند',
                type: file.mimeType || file.fileType || (file.originalName?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                fileId: null
            });
            return;
        }

        setLoadingDoc(uploadId);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/uploads/${uploadId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.upload?.permissionError) {
                toast.error("لا يمكن عرض الملف حالياً بسبب قيود AWS. يرجى الاتصال بالمسؤول.");
                setLoadingDoc(null);
                return;
            }

            if (response.data.success && response.data.upload?.url) {
                setViewerData({
                    open: true,
                    url: response.data.upload.url,
                    name: response.data.upload.filename || file.originalName || "المستند",
                    type: response.data.upload.mimetype || (response.data.upload.filename?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                    fileId: uploadId
                });
            } else {
                toast.error("فشل في الحصول على رابط الملف");
            }
        } catch (error) {
            console.error("Error fetching document URL:", error);
            toast.error("فشل في عرض الملف");
        }
        setLoadingDoc(null);
    };

    const closeViewer = () => {
        setViewerData({ open: false, url: null, name: null, type: null, fileId: null });
    };

    // Get document type label in Arabic
    const getDocumentTypeLabel = (docType) => {
        const labels = {
            'proforma_invoice': 'الفاتورة المبدئية',
            'commercial_invoice': 'الفاتورة التجارية',
            'packing_list': 'قائمة التعبئة',
            'bill_of_lading': 'بوليصة الشحن',
            'certificate_of_origin': 'شهادة المنشأ',
            'other': 'مستند آخر'
        };
        return labels[docType] || docType || 'مستند';
    };

    // Get date - try multiple field names
    const getRequestDate = () => {
        const dateValue = data.requestDate || data.createdAt;
        if (!dateValue) return 'غير متوفر';
        return new Date(dateValue).toLocaleString("ar-EG", {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${theme.bg} border transition-all`} onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${theme.bg} ${theme.divider}`}>
                        <h2 className={`text-xl font-bold ${theme.text} flex items-center gap-2`}>
                            <FileText className="text-[#1ba3b6]" />
                            {title}
                        </h2>
                        <button onClick={onClose} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${theme.text}`}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-8">
                        
                        {/* Summary Section */}
                        {type === 'acid' && (
                            <section className={`p-4 rounded-xl border ${theme.divider} ${theme.cardBg}`}>
                                <h3 className="text-[#1ba3b6] font-bold mb-4">ملخص الطلب</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className={`block text-xs font-bold mb-1 ${theme.subText}`}>العميل</span>
                                        <span className={`font-bold ${theme.text}`}>{data.userId?.fullname || data.userId?.username || 'غير معروف'}</span>
                                    </div>
                                    <div>
                                        <span className={`block text-xs font-bold mb-1 ${theme.subText}`}>المورد</span>
                                        <span className={`font-bold ${theme.text}`}>{data.supplier?.name || 'غير محدد'}</span>
                                    </div>
                                    <div>
                                        <span className={`block text-xs font-bold mb-1 ${theme.subText}`}>وصف البضاعة</span>
                                        <span className={`font-bold ${theme.text}`}>{data.goods?.description || 'غير محدد'}</span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Client Info Section */}
                        <section>
                            <h3 className="text-[#1ba3b6] font-bold mb-4 flex items-center gap-2">
                                <User size={18} />
                                👤 بيانات العميل
                            </h3>
                            <div className={`p-4 rounded-xl border ${theme.divider}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <span className={theme.subText}>اسم المستخدم:</span>
                                        <span className={`font-medium ${theme.text}`}>{data.userId?.username || 'غير متوفر'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <span className={theme.subText}>البريد الإلكتروني:</span>
                                        <span className={`font-medium ${theme.text}`}>{data.userId?.email || 'غير متوفر'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <span className={theme.subText}>رقم الهاتف:</span>
                                        <span className={`font-medium ${theme.text} dir-ltr`}>{data.userId?.phone || data.userId?.phoneNumber || 'غير متوفر'}</span>
                                    </div>
                                    {(data.userId?.companyName || data.userId?.company) && (
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>الشركة:</span>
                                            <span className={`font-medium ${theme.text}`}>{data.userId?.companyName || data.userId?.company}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Supplier Info Section */}
                        {type === 'acid' && data.supplier && (
                            <section>
                                <h3 className="text-[#1ba3b6] font-bold mb-4 flex items-center gap-2">
                                    <Building size={18} />
                                    🏭 بيانات المورد
                                </h3>
                                <div className={`p-4 rounded-xl border ${theme.divider}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>الاسم:</span>
                                            <span className={`font-medium ${theme.text}`}>{data.supplier.name || 'غير متوفر'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>الرقم الضريبي:</span>
                                            <span className={`font-medium ${theme.text}`}>{data.supplier.taxNum || data.supplier.taxNumber || 'غير متوفر'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>الدولة:</span>
                                            <span className={`font-medium ${theme.text}`}>{data.supplier.country || 'غير متوفر'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>البريد الإلكتروني:</span>
                                            <span className={`font-medium ${theme.text}`}>{data.supplier.email || 'غير متوفر'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>رقم الجوال:</span>
                                            <span className={`font-medium ${theme.text} dir-ltr`}>{data.supplier.mobileNum || data.supplier.phone || data.supplier.mobile || 'غير متوفر'}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Goods Info Section */}
                        {type === 'acid' && data.goods && (
                            <section>
                                <h3 className="text-[#1ba3b6] font-bold mb-4 flex items-center gap-2">
                                    <Package size={18} />
                                    📦 بيانات البضاعة
                                </h3>
                                <div className={`p-4 rounded-xl border ${theme.divider}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>الوصف:</span>
                                            <span className={`font-medium ${theme.text}`}>{data.goods.description || 'غير متوفر'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>بند جمركي:</span>
                                            <span className={`font-medium ${theme.text}`}>{data.goods.customsItem || data.goods.hsCode || 'غير متوفر'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>الوزن:</span>
                                            <span className={`font-medium ${theme.text}`}>{data.goods.weight ? `${data.goods.weight} كجم` : 'غير متوفر'}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Request Info Section */}
                        <section>
                            <h3 className="text-[#1ba3b6] font-bold mb-4 flex items-center gap-2">
                                <Calendar size={18} />
                                📅 بيانات الطلب
                            </h3>
                            <div className={`p-4 rounded-xl border ${theme.divider}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <span className={theme.subText}>تاريخ الطلب:</span>
                                        <span className={`font-medium ${theme.text}`}>{getRequestDate()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <span className={theme.subText}>المرفقات:</span>
                                        <span className={`font-medium ${theme.text}`}>{data.uploads?.length || 0} مستند(ات)</span>
                                    </div>
                                    {data.acidCode && (
                                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                            <span className={theme.subText}>كود ACID:</span>
                                            <span className={`font-mono font-bold text-[#1ba3b6]`}>{data.acidCode}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Attached Documents Section */}
                        <section>
                            <h3 className="text-[#1ba3b6] font-bold mb-4 flex items-center gap-2">
                                <Download size={18} />
                                📄 المستندات المرفقة
                            </h3>
                            {data.uploads && data.uploads.length > 0 ? (
                                <div className="space-y-3">
                                    {data.uploads.map((file, index) => {
                                        const fileId = file._id || file.id;
                                        const isLoading = loadingDoc === fileId;
                                        return (
                                            <div 
                                                key={fileId || index}
                                                className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:border-[#1ba3b6]/30 ${theme.divider} ${theme.cardBg}`}
                                            >
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className="w-12 h-12 rounded-xl bg-[#1ba3b6]/10 flex items-center justify-center text-[#1ba3b6]">
                                                        <FileText size={24} />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className={`text-xs font-bold mb-0.5 text-[#1ba3b6]`}>
                                                            {getDocumentTypeLabel(file.documentType || file.category)}
                                                        </p>
                                                        <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                            {file.originalName || `مستند ${index + 1}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleViewDocument(file)}
                                                    disabled={isLoading}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1ba3b6]/10 text-[#1ba3b6] hover:bg-[#1ba3b6]/20 transition-colors text-sm font-bold disabled:opacity-50"
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <Loader2 size={16} className="animate-spin" />
                                                            جاري التحميل...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye size={16} />
                                                            عرض
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`p-8 text-center rounded-xl border border-dashed ${theme.divider} ${theme.subText}`}>
                                    لا توجد مرفقات
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Footer Actions */}
                    <div className={`sticky bottom-0 flex flex-wrap items-center justify-end gap-3 p-6 border-t ${theme.bg} ${theme.divider}`}>
                        <button 
                            onClick={onClose}
                            className={`px-5 py-2.5 rounded-xl font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10`}
                        >
                            إغلاق
                        </button>
                        {children}
                    </div>
                </div>
            </div>

            {/* File Viewer Modal */}
            <FileViewerModal
                isOpen={viewerData.open}
                onClose={closeViewer}
                fileUrl={viewerData.url}
                fileName={viewerData.name}
                fileType={viewerData.type}
                fileId={viewerData.fileId}
            />
        </>
    );
};

export default RequestDetailsModal;
