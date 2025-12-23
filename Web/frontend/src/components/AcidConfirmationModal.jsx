import React, { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { X, FileText, Download, User, Globe, Box, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

const AcidConfirmationModal = ({
	show,
	confirmData,
	acidCodeInput,
	onClose,
	onConfirm,
	onAcidCodeChange,
}) => {
	if (!show || !confirmData) return null;

  const isDarkMode = document.documentElement.classList.contains('dark');

  const theme = {
      bg: isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200',
      text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
      subText: isDarkMode ? 'text-gray-400' : 'text-gray-500', 
      label: isDarkMode ? 'text-gray-300' : 'text-gray-700',
      input: isDarkMode ? 'bg-black/30 border-gray-600 focus:border-[#1ba3b6] text-white' : 'bg-gray-50 border-gray-200 focus:border-[#1ba3b6] text-gray-900',
      divider: isDarkMode ? 'border-gray-700' : 'border-gray-100',
      warningBg: isDarkMode ? 'bg-amber-900/20 text-amber-500 border-amber-900/30' : 'bg-amber-50 text-amber-700 border-amber-100'
  };

	const handleViewDocument = (url) => {
		if (url) window.open(url, "_blank");
		else toast.error("رابط المستند غير متوفر");
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
			<div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${theme.bg} border transition-all`} onClick={e => e.stopPropagation()}>
				
        {/* Header */}
				<div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${theme.bg} ${theme.divider}`}>
					<div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle size={20} />
             </div>
             <div>
                <h2 className={`text-xl font-bold ${theme.text}`}>تأكيد إصدار رقم ACID</h2>
                <p className={`text-xs ${theme.subText}`}>يرجى مراجعة البيانات بعناية قبل الإصدار</p>
             </div>
          </div>
					<button onClick={onClose} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${theme.text}`}>
						<X size={20} />
					</button>
				</div>

				<div className="p-6 space-y-8">
          
          {/* Warning Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${theme.warningBg}`}>
             <AlertTriangle size={20} className="shrink-0 mt-0.5" />
             <p className="text-sm font-medium leading-relaxed">
               يرجى مراجعة البيانات التالية بعناية قبل إصدار رقم ACID. لا يمكن التراجع عن هذا الإجراء بعد التأكيد.
             </p>
          </div>

					{/* Summary Section */}
          <section>
             <h3 className="text-[#1ba3b6] font-bold mb-4 flex items-center gap-2">
                <FileText size={18} />
                ملخص الطلب
             </h3>
             <div className={`p-4 rounded-xl border ${theme.divider} bg-opacity-50 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div>
                      <span className={`block text-xs font-bold mb-1 ${theme.subText}`}>العميل</span>
                      <p className={`text-sm font-bold ${theme.text}`}>{confirmData.userId?.fullname || confirmData.userId?.username}</p>
                   </div>
                   <div>
                      <span className={`block text-xs font-bold mb-1 ${theme.subText}`}>المورد</span>
                      <p className={`text-sm font-bold ${theme.text}`}>{confirmData.supplier?.name}</p>
                   </div>
                   <div>
                      <span className={`block text-xs font-bold mb-1 ${theme.subText}`}>البضاعة</span>
                      <p className={`text-sm font-bold ${theme.text}`}>{confirmData.goods?.description}</p>
                   </div>
                </div>
             </div>
          </section>

          {/* Details Grid */}
          <section>
             <h3 className="text-[#1ba3b6] font-bold mb-4 flex items-center gap-2">
                <Box size={18} />
                تفاصيل الطلب الكاملة
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                
                {/* Client Info */}
                <div className={`p-4 rounded-xl border ${theme.divider}`}>
                   <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}>
                      <User size={16} className="text-[#1ba3b6]" /> بيانات العميل
                   </h4>
                   <div className="space-y-3">
                      <div className="flex justify-between">
                         <span className={theme.subText}>اسم المستخدم:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.userId?.username}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className={theme.subText}>البريد الإلكتروني:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.userId?.email}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className={theme.subText}>رقم الهاتف:</span>
                         <span className={`font-medium ${theme.text} dir-ltr`}>{confirmData.userId?.phone}</span>
                      </div>
                      {confirmData.userId?.companyName && (
                        <div className="flex justify-between">
                           <span className={theme.subText}>الشركة:</span>
                           <span className={`font-medium ${theme.text}`}>{confirmData.userId.companyName}</span>
                        </div>
                      )}
                   </div>
                </div>

                {/* Supplier Info */}
                <div className={`p-4 rounded-xl border ${theme.divider}`}>
                   <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}>
                      <Globe size={16} className="text-[#1ba3b6]" /> بيانات المورد
                   </h4>
                   <div className="space-y-3">
                      <div className="flex justify-between">
                         <span className={theme.subText}>الاسم:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.supplier?.name}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className={theme.subText}>الدولة:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.supplier?.country}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className={theme.subText}>الرقم الضريبي:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.supplier?.taxNum}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className={theme.subText}>البريد:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.supplier?.email}</span>
                      </div>
                   </div>
                </div>

                {/* Goods Info */}
                <div className={`p-4 rounded-xl border ${theme.divider}`}>
                   <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}>
                      <Box size={16} className="text-[#1ba3b6]" /> بيانات البضاعة
                   </h4>
                   <div className="space-y-3">
                      <div className="flex justify-between">
                         <span className={theme.subText}>الوصف:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.goods?.description}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className={theme.subText}>بند جمركي:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.goods?.customsItem}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className={theme.subText}>الوزن:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.goods?.weight} كجم</span>
                      </div>
                   </div>
                </div>

                {/* Date & Files Info */}
                <div className={`p-4 rounded-xl border ${theme.divider}`}>
                   <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}>
                      <Calendar size={16} className="text-[#1ba3b6]" /> التاريخ والمرفقات
                   </h4>
                   <div className="space-y-3">
                      <div className="flex justify-between">
                         <span className={theme.subText}>تاريخ الطلب:</span>
                         <span className={`font-medium ${theme.text}`}>{new Date(confirmData.createdAt).toLocaleDateString("ar-EG")}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className={theme.subText}>عدد المرفقات:</span>
                         <span className={`font-medium ${theme.text}`}>{confirmData.uploads?.length || 0} مستند</span>
                      </div>
                      {/* Interactive File List */}
                      {confirmData.uploads?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                           {confirmData.uploads.map((file, idx) => (
                              <button 
                                key={idx}
                                onClick={() => handleViewDocument(file.s3Url || file.url)}
                                className="flex items-center gap-2 text-xs text-[#1ba3b6] hover:underline w-full py-1"
                              >
                                <Download size={12} />
                                <span className="truncate max-w-[200px]">{file.originalName || `مستند ${idx+1}`}</span>
                                <span className="bg-gray-100 dark:bg-white/10 px-1.5 rounded text-[10px] text-gray-500">عرض</span>
                              </button>
                           ))}
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </section>

          {/* ACID Input Section */}
          <div className={`p-6 rounded-2xl border-2 ${isDarkMode ? 'border-[#1ba3b6]/30 bg-[#1ba3b6]/5' : 'border-[#1ba3b6]/20 bg-[#1ba3b6]/5'}`}>
             <label htmlFor="acidCode" className={`block text-base font-bold mb-2 ${theme.text}`}>
                أدخل رقم ACID تم إصداره <span className="text-red-500">*</span>
             </label>
             <div className="flex gap-3">
                <input
                   id="acidCode"
                   type="text"
                   value={acidCodeInput}
                   onChange={(e) => onAcidCodeChange(e.target.value)}
                   placeholder="أدخل الرقم هنا (مثال: 2025-123456789)"
                   className={`flex-1 px-4 py-3 rounded-xl border-2 outline-none transition-all font-mono text-lg ${theme.input}`}
                   dir="ltr"
                   autoFocus
                />
             </div>
             <p className={`mt-2 text-xs ${theme.subText}`}>تأكد من مطابقة الرقم للمستند الرسمي الصادر من نافذة.</p>
          </div>

				</div>

				{/* Footer Actions */}
				<div className={`sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 p-6 border-t ${theme.bg} ${theme.divider}`}>
					<button 
						onClick={onClose}
						className={`px-6 py-3 rounded-xl font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10`}
					>
						إلغاء
					</button>
					<button
            onClick={onConfirm}
            disabled={!acidCodeInput.trim()}
            className={`px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl
              ${!acidCodeInput.trim() ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-[#1ba3b6] hover:bg-[#158a9b] hover:-translate-y-0.5'}
            `}
          >
            <CheckCircle size={20} />
            تأكيد وإصدار ACID
          </button>
				</div>
			</div>
		</div>
	);
};

export default AcidConfirmationModal;
