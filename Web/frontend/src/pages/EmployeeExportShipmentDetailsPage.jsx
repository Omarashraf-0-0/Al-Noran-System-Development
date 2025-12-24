import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FileViewerModal from '../components/FileViewerModal';
import { useTheme } from '../context/ThemeContext';
import {
  ChevronRight, Package, Truck, Calendar, MapPin,
  FileText, User, Users, CheckCircle, Clock, AlertCircle,
  Download, Upload, Edit, ArrowLeft, Anchor, FileQuestion,
  X, Plus, Trash2, Eye, XCircle, AlertTriangle
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

  // Document Preview State
  const [viewerData, setViewerData] = useState({
    open: false,
    url: null,
    name: null,
    type: null,
    fileId: null
  });
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  // Request Docs State
  const [requestDocsModal, setRequestDocsModal] = useState(false);
  const [docInput, setDocInput] = useState("");
  const [requestedDocsList, setRequestedDocsList] = useState([]);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Direct Upload State
  const [directUploadModal, setDirectUploadModal] = useState(false);
  const [directUploadName, setDirectUploadName] = useState("");
  const [directUploadFile, setDirectUploadFile] = useState(null);
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const [showDirectUploadSuggestions, setShowDirectUploadSuggestions] = useState(false);
  const directFileInputRef = useRef(null);

  // Confirmation Modal State (for document rejection)
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null
  });

  const token = localStorage.getItem('token');

  // Predefined export documents list
  const predefinedDocs = [
    "شهادة المنشأ", "فاتورة تصدير", "قائمة التعبئة", "إعفاء بنكي",
    "تصريح الشحن", "شهادة الجودة", "شهادة الصحة", "شهادة المطابقة",
    "رخصة التصدير", "بوليصة الشحن", "شهادة التفتيش", "بيان جمركي",
    "شهادة الوزن", "شهادة التحليل", "عقد البيع", "نموذج 46"
  ];

  useEffect(() => {
    fetchShipmentDetails();
  }, [shipmentId]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Open Preview Modal - Logic delegated to FileViewerModal component
  const openPreviewModal = async (doc) => {
    console.log('📂 Opening preview for:', doc);
    setViewerData({
      open: true,
      url: doc.url || null,
      name: doc.name || 'مستند',
      type: doc.mimetype || 'application/pdf',
      fileId: doc.fileId || doc._id || null  // Use fileId FIRST (actual S3 file), then _id as fallback
    });
  };

  const closeViewer = () => {
    setViewerData({ open: false, url: null, name: null, type: null, fileId: null });
  };

  // TRIGGER REJECT CONFIRMATION
  const handleRejectDocumentClick = (docId) => {
    setConfirmModal({
      open: true,
      title: "رفض المستند",
      message: "هل أنت متأكد من رفض هذا المستند؟ سيتم إشعار العميل لرفعه مرة أخرى.",
      type: "warning",
      onConfirm: () => executeRejectDocument(docId)
    });
  };

  // EXECUTE REJECT
  const executeRejectDocument = async (docId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/export-shipments/${shipmentId}/required-documents/${docId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("تم رفض المستند بنجاح");
      fetchShipmentDetails();
    } catch (err) {
      console.error(err);
      toast.error("فشل رفض المستند");
    } finally {
      setConfirmModal(prev => ({ ...prev, open: false }));
    }
  };

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

  // --- Request Documents Logic ---
  const handleAddDoc = (docName) => {
    if (!docName.trim()) return;
    if (requestedDocsList.includes(docName)) {
      toast.error("هذا المستند مضاف بالفعل");
      return;
    }
    setRequestedDocsList([...requestedDocsList, docName]);
    setDocInput("");
    setShowSuggestions(false);
  };

  const handleRemoveDoc = (index) => {
    const newList = [...requestedDocsList];
    newList.splice(index, 1);
    setRequestedDocsList(newList);
  };

  const handleSendRequest = async () => {
    if (requestedDocsList.length === 0) return;

    try {
      setSendingRequest(true);
      // Send each document request one by one (export API expects single documentName)
      for (const docName of requestedDocsList) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${shipmentId}/request-document`,
          { documentName: docName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success("تم إرسال طلب المستندات بنجاح");
      setRequestDocsModal(false);
      setRequestedDocsList([]);
      fetchShipmentDetails();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "فشل إرسال الطلب");
    } finally {
      setSendingRequest(false);
    }
  };

  // --- Direct Upload Logic ---
  const uploadFileToServer = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("category", "export_shipment");
    formDataUpload.append("relatedId", shipmentId);
    formDataUpload.append("userType", "employee");

    return axios.post(
      `${import.meta.env.VITE_API_URL}/api/uploads`,
      formDataUpload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
  };

  const handleDirectUploadNameChange = (e) => {
    setDirectUploadName(e.target.value);
    setShowDirectUploadSuggestions(true);
  };

  const handleSelectDirectUploadName = (name) => {
    setDirectUploadName(name);
    setShowDirectUploadSuggestions(false);
  };

  const directUploadFilteredSuggestions = predefinedDocs.filter(doc =>
    doc.toLowerCase().includes(directUploadName.toLowerCase())
  );

  const handleDirectUpload = async () => {
    if (!directUploadName.trim() || !directUploadFile) {
      toast.error("يرجى إدخال اسم المستند واختيار الملف");
      return;
    }

    const toastId = toast.loading("جاري رفع المستند...");
    try {
      setIsDirectUploading(true);

      // 1. Upload to S3
      const uploadResponse = await uploadFileToServer(directUploadFile);
      const fileId = uploadResponse.data.upload.id;

      // 2. Call Add Completed Document Endpoint
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${shipmentId}/completed-document`,
        {
          name: directUploadName,
          fileId: fileId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("تم إضافة المستند بنجاح", { id: toastId });
      setDirectUploadModal(false);
      setDirectUploadName("");
      setDirectUploadFile(null);
      fetchShipmentDetails();

    } catch (err) {
      console.error("Direct upload error:", err);
      console.error("Error response:", err.response?.data);
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "فشل إضافة المستند");
    } finally {
      setIsDirectUploading(false);
    }
  };

  // --- Delete Document Request ---
  const handleDeleteRequest = async (docId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/export-shipments/employee/${shipmentId}/required-documents/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("تم حذف الطلب بنجاح");
      fetchShipmentDetails();
    } catch (err) {
      console.error(err);
      toast.error("فشل حذف الطلب");
    }
  };

  // Filter suggestions for request modal
  const filteredSuggestions = predefinedDocs.filter(doc =>
    doc.toLowerCase().includes(docInput.toLowerCase()) && !requestedDocsList.includes(doc)
  );

  // Theme Variables
  const theme = {
    bg: isDarkMode ? 'bg-[#050a0d]' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    subText: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    accent: 'text-[#1ba3b6]',
    accentBg: 'bg-[#1ba3b6]',
    divider: isDarkMode ? 'border-gray-700' : 'border-gray-100',
    inputBg: isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
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
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${shipment.currentStatus === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
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

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setStatusModal(true)}
                  className="px-6 py-3 rounded-xl bg-[#1ba3b6] text-white font-bold hover:bg-[#158a9b] transition shadow-lg shadow-[#1ba3b6]/20 flex items-center gap-2"
                >
                  <Edit size={18} /> تحديث الحالة
                </button>

                <button
                  onClick={() => setRequestDocsModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02] transition-all flex items-center gap-2 border border-white/10"
                >
                  <FileQuestion size={18} className="animate-pulse" />
                  طلب مستندات جديدة
                </button>

                <button
                  onClick={() => setDirectUploadModal(true)}
                  className="bg-[#1ba3b6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#158a9b] transition-all shadow-lg shadow-[#1ba3b6]/20 flex items-center gap-2"
                >
                  <Upload size={18} />
                  رفع مستند جديد
                </button>
              </div>
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

            {/* Required Documents Section */}
            {shipment.requiredDocuments && shipment.requiredDocuments.length > 0 && (
              <div className={`p-6 rounded-2xl border ${theme.cardBg} shadow-sm`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h3 className={`font-bold text-xl flex items-center gap-2 ${theme.text}`}>
                    <FileQuestion className="text-amber-500" /> متابعة المستندات المطلوبة
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {shipment.requiredDocuments.map((doc) => (
                    <div key={doc._id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme.inputBg}`}>
                      <div className="flex items-center gap-4">
                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${doc.uploaded
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                          }`}>
                          {doc.uploaded ? <CheckCircle size={20} /> : <Clock size={20} />}
                        </div>
                        <div>
                          <p className={`font-bold ${theme.text}`}>{doc.name}</p>
                          <p className={`text-xs ${theme.subText}`}>
                            {doc.uploaded
                              ? `تم الرفع: ${new Date(doc.uploadedAt).toLocaleDateString('ar-EG')}`
                              : `تاريخ الطلب: ${new Date(doc.requestedAt).toLocaleDateString('ar-EG')}`
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.uploaded ? (
                          <>
                            <button
                              onClick={() => openPreviewModal(doc)}
                              className="px-4 py-2 bg-green-600/10 text-green-600 hover:bg-green-600 hover:text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                            >
                              <Eye size={16} /> عرض
                            </button>
                            <button
                              onClick={() => handleRejectDocumentClick(doc._id)}
                              className="p-2 bg-red-600/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                              title="رفض المستند وطلب إعادة الرفع"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        ) : (
                          <span className={`text-xs px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 font-bold`}>
                            في انتظار العميل
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UCR Request Documents */}
            {shipment.ucrRequestId?.uploads && shipment.ucrRequestId.uploads.length > 0 && (
              <div className={`p-6 rounded-2xl border ${theme.cardBg} shadow-sm`}>
                <h3 className={`font-bold text-xl mb-4 flex items-center gap-2 ${theme.text}`}>
                  <FileText className="text-purple-500" /> مستندات طلب UCR
                </h3>

                <div className="space-y-3">
                  {shipment.ucrRequestId.uploads.map((upload, idx) => (
                    <div key={upload._id || idx} className={`p-4 rounded-xl border flex items-center justify-between group ${theme.inputBg} hover:border-purple-500/50 transition-all`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold truncate ${theme.text}`}>{upload.originalname || upload.filename || 'مستند'}</p>
                          <p className={`text-xs truncate ${theme.subText}`}>مرفق من طلب UCR</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openPreviewModal({
                          url: upload.url || upload.presignedUrl,
                          name: upload.originalname || upload.filename || 'مستند UCR',
                          _id: upload._id,
                          mimetype: upload.mimetype || 'application/pdf'
                        })}
                        className="px-3 py-1.5 bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white rounded-lg font-bold text-xs transition-all shrink-0 flex items-center gap-2"
                      >
                        <Eye size={14} /> عرض
                      </button>
                    </div>
                  ))}
                </div>
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

      {/* --- Request Documents Modal --- */}
      {requestDocsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="text-[#1ba3b6]" /> طلب مستندات من العميل
              </h3>
              <button onClick={() => setRequestDocsModal(false)} className="text-gray-400 hover:text-red-500 transition">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">
              أضف المستندات المطلوبة من العميل. سيتم إرسال إشعار له بالمستندات التي يجب رفعها.
            </p>

            <div className="flex gap-2 mb-4" ref={inputRef}>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="اسم المستند المطلوب (مثال: شهادة منشأ)"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1ba3b6] outline-none transition-all ${isDarkMode
                    ? 'bg-black/20 border-white/10 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  value={docInput}
                  onChange={(e) => {
                    setDocInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-xl max-h-48 overflow-y-auto ${isDarkMode ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-200'
                    }`}>
                    {filteredSuggestions.map((doc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddDoc(doc)}
                        className={`w-full px-4 py-2 text-right hover:bg-[#1ba3b6]/10 hover:text-[#1ba3b6] border-b last:border-b-0 transition flex items-center justify-between ${isDarkMode ? 'border-white/5 text-gray-300' : 'border-gray-100 text-gray-700'
                          }`}
                      >
                        {doc}
                        <Plus size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAddDoc(docInput)}
                className="px-4 py-3 bg-[#1ba3b6] text-white rounded-xl font-bold hover:bg-[#158a9b] transition-all flex items-center gap-2 shrink-0"
              >
                <Plus size={18} /> إضافة
              </button>
            </div>

            {/* Selected Documents List */}
            {requestedDocsList.length > 0 && (
              <div className="mb-6 space-y-2">
                <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>المستندات المطلوبة:</p>
                <div className="flex flex-wrap gap-2">
                  {requestedDocsList.map((doc, index) => (
                    <span key={index} className="px-3 py-1.5 rounded-full bg-[#1ba3b6]/10 text-[#1ba3b6] font-bold text-sm flex items-center gap-2 border border-[#1ba3b6]/20">
                      {doc}
                      <button onClick={() => handleRemoveDoc(index)} className="hover:text-red-500 transition">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setRequestDocsModal(false)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all border ${isDarkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
              >
                إلغاء
              </button>
              <button
                onClick={handleSendRequest}
                disabled={requestedDocsList.length === 0 || sendingRequest}
                className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-white shadow-lg ${requestedDocsList.length === 0 || sendingRequest
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-[#1ba3b6] hover:bg-[#158a9b] shadow-[#1ba3b6]/20'
                  }`}
              >
                {sendingRequest && <LoadingSpinner size="sm" color="white" />}
                {sendingRequest ? 'جاري الإرسال...' : 'إرسال الطلب للعميل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Direct Upload Modal --- */}
      {directUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !isDirectUploading && setDirectUploadModal(false)}>
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${theme.cardBg} border ${theme.divider}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold flex items-center gap-2 ${theme.text}`}>
                <Upload className="text-[#1ba3b6]" /> رفع مستند جديد
              </h3>
              {!isDirectUploading && (
                <button onClick={() => setDirectUploadModal(false)} className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors ${theme.subText}`}>
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${theme.text}`}>اسم المستند</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="أدخل اسم المستند (مثلاً: شهادة الفحص)"
                    value={directUploadName}
                    onChange={handleDirectUploadNameChange}
                    onFocus={() => setShowDirectUploadSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDirectUploadSuggestions(false), 200)}
                    className={`w-full p-3 pl-10 rounded-xl border outline-none focus:ring-2 focus:ring-[#1ba3b6] transition-all ${theme.inputBg} ${theme.text}`}
                  />
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />

                  {/* Suggestions Dropdown */}
                  {showDirectUploadSuggestions && directUploadFilteredSuggestions.length > 0 && (
                    <div className={`absolute top-full right-0 w-full mt-1 max-h-48 overflow-y-auto rounded-xl border shadow-xl z-10 ${theme.cardBg} ${theme.divider}`}>
                      {directUploadFilteredSuggestions.map((doc, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectDirectUploadName(doc)}
                          className={`p-3 cursor-pointer transition-colors border-b last:border-0 ${theme.divider} hover:bg-[#1ba3b6]/10 hover:text-[#1ba3b6] relative group flex items-center justify-between`}
                        >
                          <span className={`font-medium ${theme.text} group-hover:text-[#1ba3b6]`}>{doc}</span>
                          <Plus size={14} className="opacity-0 group-hover:opacity-100 text-[#1ba3b6] transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${theme.text}`}>الملف</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-[#1ba3b6] ${directUploadFile ? 'border-[#1ba3b6] bg-[#1ba3b6]/5' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                    }`}
                  onClick={() => directFileInputRef.current.click()}
                >
                  <input
                    type="file"
                    ref={directFileInputRef}
                    className="hidden"
                    onChange={(e) => setDirectUploadFile(e.target.files[0])}
                  />

                  {directUploadFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="text-[#1ba3b6]" size={32} />
                      <p className={`font-bold ${theme.text}`}>{directUploadFile.name}</p>
                      <p className="text-xs text-gray-500">{(directUploadFile.size / 1024).toFixed(1)} KB</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDirectUploadFile(null); }}
                        className="mt-2 text-red-500 text-xs font-bold hover:underline"
                      >
                        إزالة الملف
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Upload size={32} />
                      <p className="font-bold">اضغط لاختيار ملف</p>
                      <p className="text-xs">PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDirectUploadModal(false)}
                  disabled={isDirectUploading}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all border ${isDarkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'}`}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDirectUpload}
                  disabled={isDirectUploading || !directUploadName || !directUploadFile}
                  className="flex-1 py-3 bg-[#1ba3b6] hover:bg-[#158a9b] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#1ba3b6]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDirectUploading ? <LoadingSpinner size="sm" color="white" /> : <Upload size={18} />}
                  {isDirectUploading ? 'جاري الرفع...' : 'رفع المستند'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={viewerData.open}
        onClose={closeViewer}
        fileUrl={viewerData.url}
        fileName={viewerData.name}
        fileType={viewerData.type}
        fileId={viewerData.fileId}
      />

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-full max-w-md shadow-xl ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
            <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${confirmModal.type === 'warning' ? 'text-amber-500' : 'text-red-500'}`}>
              <AlertTriangle size={24} />
              {confirmModal.title}
            </h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                className={`flex-1 py-3 rounded-xl font-bold transition-all border ${isDarkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'}`}
              >
                إلغاء
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${confirmModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeExportShipmentDetailsPage;
