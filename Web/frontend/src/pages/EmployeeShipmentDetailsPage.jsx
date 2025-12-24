import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useTheme } from '../context/ThemeContext';
import FileViewerModal from '../components/FileViewerModal';
import {
    ChevronRight, Package, Truck, Calendar, MapPin,
    FileText, User, Users, CheckCircle, Clock, AlertCircle,
    Download, Upload, Edit, ArrowLeft, MessageCircle, History,
    Anchor, Plane, FileQuestion, X, Plus, Trash2, Eye, XCircle, AlertTriangle
} from 'lucide-react';

const EmployeeShipmentDetailsPage = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Document Preview State (New)
    const [viewerData, setViewerData] = useState({
        open: false,
        url: null,
        name: null,
        type: null,
        fileId: null
    });

    // Request Docs State
    const [requestDocsModal, setRequestDocsModal] = useState(false);
    const [docInput, setDocInput] = useState("");
    const [requestedDocsList, setRequestedDocsList] = useState([]);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);

    // Document Upload State
    const [uploadingDocId, setUploadingDocId] = useState(null);
    const fileInputRef = useRef(null);

    // Direct Upload State (Employee)
    const [directUploadModal, setDirectUploadModal] = useState(false);
    const [directUploadName, setDirectUploadName] = useState("");
    const [directUploadFile, setDirectUploadFile] = useState(null);
    const [isDirectUploading, setIsDirectUploading] = useState(false);
    const [showDirectUploadSuggestions, setShowDirectUploadSuggestions] = useState(false);
    const directFileInputRef = useRef(null);

    // ✅ Open Preview Modal - Logic delegated to FileViewerModal component
    const openPreviewModal = (doc) => {
        const fileId = doc.fileId || doc._id || doc.id;
        const fileUrl = doc.url || doc.s3Url || doc.fileUrl;
        const fileName = doc.name || doc.originalName || doc.filename || "مستند";
        const fileType = doc.mimeType || doc.mimetype || doc.type;

        // Pass everything to the modal
        setViewerData({
            open: true,
            url: fileUrl,
            name: fileName,
            type: fileType,
            fileId: fileId,
            s3Key: doc.s3Key // Pass s3Key if available directly
        });
    };

    const closeViewer = () => {
        setViewerData({ open: false, url: null, name: null, type: null, fileId: null });
    };

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        title: "",
        message: "",
        type: "danger", // 'danger' | 'warning'
        onConfirm: null
    });

    const token = localStorage.getItem('token');

    // Predefined documents list
    const predefinedDocs = [
        "صورة البطاقة", "صورة السجل التجاري", "صورة البطاقة الضريبية", "شهادة المنشأ",
        "بوليصة الشحن", "صورة الفاتورة", "صورة العقد", "كشف العبوة", "إذن الإفراج",
        "صورة التوكيل", "شهادة الجودة", "شهادة المطابقة", "صورة بطاقة الاستيراد",
        "صورة رخصة الاستيراد", "صورة الموافقة الجمركية", "الفاتورة التجارية",
        "شهادة الصحة", "شهادة التأمين", "إذن الاستيراد", "تصريح الجمارك"
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

    const fetchShipmentDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("📦 Shipment Data:", response.data);
            if (response.data.proformaInvoice) {
                console.log("📄 Proforma Invoice Found:", response.data.proformaInvoice);
            } else {
                console.log("⚠️ No Proforma Invoice in response");
                if (response.data.acid_request_id) {
                    console.log("🔗 Linked ACID Request:", response.data.acid_request_id);
                }
            }
            setShipment(response.data);
        } catch (err) {
            console.error(err);
            setError("فشل تحميل بيانات الشحنة");
        } finally {
            setLoading(false);
        }
    };

    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const handleStatusSelect = async (newStatus) => {
        try {
            setUpdatingStatus(true);
            setIsStatusOpen(false); // Close dropdown immediately

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setShipment(prev => ({ ...prev, status: newStatus }));
            toast.success("تم تحديث حالة الشحنة بنجاح");
        } catch (err) {
            console.error(err);
            toast.error("فشل تحديث الحالة");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleOpenChat = async () => {
        if (!shipment?.user_id?._id) {
            toast.error("بيانات العميل غير متوفرة");
            return;
        }

        try {
            const toastId = toast.loading("جاري فتح المحادثة...");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/chat`,
                { shipmentId: shipmentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success && response.data.chat) {
                toast.success("تم فتح المحادثة", { id: toastId });
                navigate(`/chat?chatId=${response.data.chat._id}`);
            } else {
                toast.error("فشل في فتح المحادثة", { id: toastId });
            }
        } catch (err) {
            console.error("Error creating chat:", err);
            toast.error("حدث خطأ أثناء فتح المحادثة");
        }
    };

    const handleViewHistory = () => {
        navigate(`/shipment-history/${shipmentId}`);
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
            // API expects { documents: ["Doc 1", "Doc 2"] }
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}/required-documents`,
                { documents: requestedDocsList },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("تم إرسال طلب المستندات بنجاح");
            setRequestDocsModal(false);
            setRequestedDocsList([]);
            fetchShipmentDetails(); // Refresh to see the new required docs
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "فشل إرسال الطلب");
        } finally {
            setSendingRequest(false);
        }
    };

    // --- Upload Required Document Logic ---
    const uploadFileToServer = async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("category", "shipment"); // Using 'shipment' to pass backend validation
        formDataUpload.append("relatedId", shipmentId);
        formDataUpload.append("userType", "employee"); // Acting as employee

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

    const handleEmployeeUploadClick = (docId) => {
        setUploadingDocId(docId);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !uploadingDocId) return;

        try {
            const toastId = toast.loading("جاري رفع الملف...");

            // 1. Upload to S3
            const uploadResponse = await uploadFileToServer(file);
            const { _id } = uploadResponse.data.upload;

            // 2. Identify Type: Required Doc OR General Upload
            if (uploadingDocId === 'general') {
                toast.success("تم إضافة المستند بنجاح", { id: toastId });
                setUploadingDocId(null);
                fetchShipmentDetails();
            } else {
                // It is a Required Document
                await axios.patch(
                    `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}/required-documents/${uploadingDocId}`,
                    { fileId: _id },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("تم رفع المستند بنجاح", { id: toastId });
                setUploadingDocId(null);
                fetchShipmentDetails();
            }

        } catch (err) {
            console.error(err);
            toast.error("فشل رفع المستند. تأكد من نوع الملف وحجمه.");
            setUploadingDocId(null);
        }
    };

    // --- Document Controls: Delete Request & Reject Upload ---

    // TRIGGER DELETE CONFIRMATION
    const handleDeleteRequestClick = (docId) => {
        setConfirmModal({
            open: true,
            title: "حذف طلب المستند",
            message: "هل أنت متأكد من حذف هذا الطلب؟ سيتم إزالته من قائمة المستندات المطلوبة نهائياً.",
            type: "danger",
            onConfirm: () => executeDeleteRequest(docId)
        });
    };

    // EXECUTE DELETE
    const executeDeleteRequest = async (docId) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}/required-documents/${docId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("تم حذف الطلب بنجاح");
            fetchShipmentDetails();
        } catch (err) {
            console.error(err);
            toast.error("فشل حذف الطلب");
        } finally {
            setConfirmModal(prev => ({ ...prev, open: false }));
        }
    };

    // --- Direct Upload Logic (New) ---
    const handleDirectUploadNameChange = (e) => {
        setDirectUploadName(e.target.value);
        setShowDirectUploadSuggestions(true);
    };

    const handleSelectDirectUploadName = (name) => {
        setDirectUploadName(name);
        setShowDirectUploadSuggestions(false);
    };

    // Filter suggestions for Direct Upload
    const directUploadFilteredSuggestions = predefinedDocs.filter(doc =>
        doc.toLowerCase().includes(directUploadName.toLowerCase())
    );

    const handleDirectUpload = async () => {
        if (!directUploadName.trim() || !directUploadFile) {
            toast.error("يرجى إدخال اسم المستند واختيار الملف");
            return;
        }

        let toastId;
        try {
            setIsDirectUploading(true);
            toastId = toast.loading("جاري رفع المستند...");

            // 1. Upload to S3
            const uploadResponse = await uploadFileToServer(directUploadFile);
            const fileId = uploadResponse.data.upload.id;

            // 2. Call Add Completed Document Endpoint
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}/completed-document`,
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
            if (toastId) toast.dismiss(toastId);
            toast.error(err.response?.data?.message || "فشل إضافة المستند");
        } finally {
            setIsDirectUploading(false);
        }
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
                `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentId}/required-documents/${docId}/reject`,
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

    // Filter suggestions
    const filteredSuggestions = predefinedDocs.filter(doc =>
        doc.toLowerCase().includes(docInput.toLowerCase()) && !requestedDocsList.includes(doc)
    );

    // Theme Variables
    const theme = {
        bg: isDarkMode ? 'bg-[#050a0d]' : 'bg-gray-50',
        cardBg: isDarkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200',
        text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
        subText: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        accent: 'text-[#1ba3b6]',
        accentBg: 'bg-[#1ba3b6]',
        divider: isDarkMode ? 'border-white/10' : 'border-gray-100',
        inputBg: isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
    };

    // Status Steps Configuration
    const statusSteps = [
        { label: "في انتظار الشحن", key: "في انتظار الشحن" },
        { label: "في الطريق", key: "في الطريق" },
        { label: "تم وصول البضاعة", key: "تم وصول البضاعة" },
        { label: "في انتظار وصول الإذن", key: "في انتظار وصول الإذن" },
        { label: "تم وصول الإذن", key: "تم وصول الإذن" },
        { label: "التخليص الجمركي", key: "التخليص الجمركي" },
        { label: "جارى ادراج الشحنة واستكمال الاجراءات", key: "جارى ادراج الشحنة واستكمال الاجراءات" },
        { label: "جاري الكشف والتثمين", key: "جاري الكشف والتثمين" },
        { label: "مكتملة", key: "مكتملة" },
        { label: "تمت بنجاح", key: "تمت بنجاح" }
    ];

    const getCurrentStatusIndex = (status) => {
        const index = statusSteps.findIndex(s => s.label === status || s.key === status);
        return index !== -1 ? index : 0;
    };

    const currentStatusIndex = shipment ? getCurrentStatusIndex(shipment.status) : 0;

    if (loading) return <div className="min-h-screen pt-20"><LoadingSpinner /></div>;
    if (error) return <div className="min-h-screen pt-20"><ErrorMessage message={error} onRetry={fetchShipmentDetails} /></div>;
    if (!shipment) return null;

    return (
        <div className={`min-h-screen font-sans ${theme.bg}`}>
            <Header />

            <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm mb-2 text-gray-500">
                            <button onClick={() => navigate(-1)} className="hover:text-[#1ba3b6] flex items-center gap-1 transition-colors">
                                <ArrowLeft size={16} /> للخلف
                            </button>
                            <ChevronRight size={14} className="rotate-180" />
                            <span>الشحنات</span>
                            <ChevronRight size={14} className="rotate-180" />
                            <span className="font-bold text-[#1ba3b6]">{shipment.shipmentCode || shipment.tracking_number || 'تفاصيل الشحنة'}</span>
                        </div>
                        <h1 className={`text-3xl font-bold flex items-center gap-3 ${theme.text}`}>
                            شحنة {shipment.shipmentCode || shipment.tracking_number}
                            <span className={`px-3 py-1 rounded-full text-sm font-normal border ${shipment.shipment_type === 'air' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-cyan-100 text-cyan-700 border-cyan-200'
                                }`}>
                                {shipment.shipment_type === 'air' ? '✈️ جوي' : '🚢 بحري'}
                            </span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsStatusOpen(!isStatusOpen)}
                                disabled={updatingStatus}
                                className="bg-[#1ba3b6] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#158a9b] transition-all shadow-lg shadow-[#1ba3b6]/20 flex items-center gap-2 disabled:opacity-70"
                            >
                                {updatingStatus ? <LoadingSpinner size="sm" color="white" /> : <Edit size={18} />}
                                {updatingStatus ? 'جاري التحديث...' : 'تغيير الحالة'}
                            </button>

                            {/* Status Dropdown */}
                            {isStatusOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)}></div>
                                    <div className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-xl border z-20 overflow-hidden max-h-80 overflow-y-auto ${theme.cardBg}`}>
                                        {statusSteps.map((status) => (
                                            <button
                                                key={status.key}
                                                onClick={() => handleStatusSelect(status.key)}
                                                className={`w-full text-right px-4 py-3 text-sm font-medium transition-colors hover:bg-[#1ba3b6]/10 hover:text-[#1ba3b6] flex items-center justify-between border-b last:border-0 ${theme.divider} ${theme.text}
                                                    ${shipment.status === status.key ? 'bg-[#1ba3b6]/5 text-[#1ba3b6]' : ''}
                                                `}
                                            >
                                                {status.label}
                                                {shipment.status === status.key && <CheckCircle size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setRequestDocsModal(true)}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02] transition-all flex items-center gap-2 border border-white/10"
                        >
                            <FileQuestion size={20} className="animate-pulse" />
                            طلب مستندات جديدة
                        </button>

                        <button
                            onClick={() => setDirectUploadModal(true)}
                            className="bg-[#1ba3b6] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#158a9b] transition-all shadow-lg shadow-[#1ba3b6]/20 flex items-center gap-2"
                        >
                            <Upload size={18} />
                            رفع مستند جديد
                        </button>
                    </div>
                </div>

                {/* Status Timeline - Scrollable on mobile */}
                <div className={`w-full overflow-x-auto pb-4 mb-8 custom-scrollbar rounded-2xl border ${theme.cardBg} p-6`}>
                    <div className="min-w-[800px] flex items-start justify-between relative px-4">
                        {statusSteps.map((step, index) => {
                            const isCompleted = index <= currentStatusIndex;
                            const isCurrent = index === currentStatusIndex;

                            return (
                                <div key={index} className="flex flex-col items-center text-center relative z-10 group" style={{ width: `${100 / statusSteps.length}%` }}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-4 
                                        ${isCompleted ? 'bg-[#1ba3b6] border-[#1ba3b6] text-white scale-110' : `bg-gray-200 dark:bg-gray-700 ${theme.bg} text-gray-400 scale-90`}
                                        ${isCurrent ? 'ring-4 ring-[#1ba3b6]/20' : ''}
                                    `}>
                                        {isCompleted && <CheckCircle size={14} />}
                                    </div>
                                    <p className={`mt-3 text-xs font-bold px-1 transition-colors duration-300 ${isCompleted ? theme.accent : theme.subText}`}>
                                        {step.label}
                                    </p>

                                    {/* Connecting Line */}
                                    {index < statusSteps.length - 1 && (
                                        <div className={`absolute top-4 right-[50%] w-full h-1 -z-10 transition-colors duration-500 
                                            ${index < currentStatusIndex ? 'bg-[#1ba3b6]' : 'bg-gray-200 dark:bg-gray-700'}
                                        `} style={{ width: '100%' }}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Right Column: Details Grid */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Main Info Grid */}
                        <div className={`p-6 md:p-8 rounded-3xl border ${theme.cardBg} shadow-sm`}>
                            <h3 className={`font-bold text-xl mb-6 flex items-center gap-2 ${theme.text}`}>
                                <Package className="text-[#1ba3b6]" />
                                تفاصيل الشحنة
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Field Component */}
                                <DataField label="اسم العميل" value={shipment.user_id?.fullname || shipment.user_id?.username} icon={<User size={18} />} theme={theme} />
                                <DataField label="اسم المورد" value={shipment.importerName || "غير محدد"} icon={<Users size={18} />} theme={theme} />
                                <DataField label="رقم الـ ACID" value={shipment.acid || "غير متوفر"} icon={<FileText size={18} />} theme={theme} />
                                <DataField label="نوع الشحنة" value={shipment.shipment_type === 'air' ? '✈️ جوي' : '🚢 بحري'} theme={theme} />
                                <DataField label="الحالة" value={shipment.status} isStatus theme={theme} />
                                <DataField label="وصف الشحنة" value={shipment.shipmentDescription || shipment.description || "لا يوجد وصف"} theme={theme} />
                                <DataField label="البلد" value={shipment.country} icon={<MapPin size={18} />} theme={theme} />
                                <DataField label="ميناء الوصول" value={shipment.port_name || "غير محدد"} icon={<Anchor size={18} />} theme={theme} />
                                <DataField label="عدد الحاويات" value={shipment.num_of_containers || "0"} theme={theme} />
                                <DataField label="أنواع الحاويات" value={shipment.type_of_containers?.join(', ') || "غير محدد"} theme={theme} />
                                <DataField label="البوليصة" value={shipment.policy || "غير متوفر"} icon={<FileText size={18} />} theme={theme} />
                                <DataField label="تاريخ الوصول المتوقع" value={shipment.arrivalDate ? new Date(shipment.arrivalDate).toLocaleDateString("ar-EG") : "غير محدد"} icon={<Calendar size={18} />} theme={theme} />
                            </div>
                        </div>

                        {/* Required Documents Section (New) */}
                        {shipment.requiredDocuments && shipment.requiredDocuments.length > 0 && (
                            <div className={`p-6 rounded-3xl border ${theme.cardBg} shadow-sm`}>
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
                                                    <>
                                                        <button
                                                            onClick={() => handleEmployeeUploadClick(doc._id)}
                                                            className="px-4 py-2 bg-[#1ba3b6] text-white hover:bg-[#158a9b] rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#1ba3b6]/20"
                                                        >
                                                            <Upload size={16} /> رفع
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRequestClick(doc._id)}
                                                            className="p-2 bg-red-600/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                            title="حذف هذا الطلب"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}



                        {/* ACID Request Documents (Proforma Invoice) */}
                        {shipment.proformaInvoice && (
                            <div className={`p-6 rounded-3xl border ${theme.cardBg} shadow-sm`}>
                                <h3 className={`font-bold text-xl mb-4 flex items-center gap-2 ${theme.text}`}>
                                    <FileText className="text-purple-500" /> مستندات طلب ACID
                                </h3>

                                <div className={`p-4 rounded-xl border flex items-center justify-between group ${theme.inputBg} hover:border-purple-500/50 transition-all`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`font-bold truncate ${theme.text}`}>الفاتورة المبدئية (Proforma Invoice)</p>
                                            <p className={`text-xs truncate ${theme.subText}`}>مرفق من طلب ACID</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openPreviewModal({
                                            url: shipment.proformaInvoice.url,
                                            name: "الفاتورة المبدئية",
                                            _id: shipment.proformaInvoice._id, // Pass _id so it maps to fileId for proxy, or null if we want direct
                                            mimetype: shipment.proformaInvoice.mimetype || 'application/pdf'
                                        })}
                                        className="px-3 py-1.5 bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white rounded-lg font-bold text-xs transition-all shrink-0 flex items-center gap-2"
                                    >
                                        <Eye size={14} /> عرض
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Left Column: Actions & Contact */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Quick Actions Card */}
                        <div className={`p-6 rounded-3xl border ${theme.cardBg} shadow-sm sticky top-24`}>
                            <h3 className={`font-bold text-lg mb-6 ${theme.text}`}>إجراءات سريعة</h3>

                            <div className="space-y-4">
                                <button
                                    onClick={handleOpenChat}
                                    className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                                >
                                    <MessageCircle size={20} />
                                    تواصل مع العميل
                                </button>

                                <button
                                    onClick={handleViewHistory}
                                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                                >
                                    <History size={20} />
                                    سجل حركات الشحنة
                                </button>
                            </div>

                            {/* Client Info Mini Card */}
                            <div className={`mt-8 pt-8 border-t ${theme.divider}`}>
                                <h4 className={`text-sm font-bold mb-4 ${theme.subText} uppercase tracking-wider`}>معلومات العميل</h4>
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                        {shipment.user_id?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={`font-bold ${theme.text}`}>{shipment.user_id?.fullname || shipment.user_id?.username}</p>
                                        <p className={`text-xs ${theme.subText}`}>{shipment.user_id?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

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
                                    onClick={() => handleAddDoc(docInput)}
                                    className="px-6 py-2 bg-[#1ba3b6] text-white rounded-xl font-bold hover:bg-[#158a9b] transition-all shadow-lg shadow-[#1ba3b6]/20"
                                >
                                    إضافة
                                </button>
                            </div>

                            <div className="space-y-2 mb-8">
                                {requestedDocsList.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {requestedDocsList.map((doc, idx) => (
                                            <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                <span className="font-bold text-sm">{doc}</span>
                                                <button
                                                    onClick={() => handleRemoveDoc(idx)}
                                                    className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-full transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`text-center py-8 rounded-xl border-2 border-dashed ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        <p className="text-gray-500">لم يتم إضافة مستندات بعد</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRequestDocsModal(false)}
                                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${isDarkMode
                                        ? 'bg-white/10 hover:bg-white/20 text-gray-300'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                        }`}
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleSendRequest}
                                    disabled={requestedDocsList.length === 0 || sendingRequest}
                                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${requestedDocsList.length === 0 || sendingRequest
                                        ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                        : 'bg-[#1ba3b6] hover:bg-[#158a9b] text-white shadow-[#1ba3b6]/20'
                                        }`}
                                >
                                    {sendingRequest && <LoadingSpinner size="sm" color="white" />}
                                    {sendingRequest ? 'جاري الإرسال...' : 'إرسال الطلب للعميل'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}



                {/* --- Confirmation Modal --- */}
                {confirmModal.open && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className={`rounded-3xl shadow-2xl max-w-md w-full p-6 text-center transform transition-all scale-100 ${isDarkMode ? 'bg-[#1e1e1e] border border-white/10' : 'bg-white'}`}>

                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${confirmModal.type === 'danger'
                                ? 'bg-red-100 text-red-500 dark:bg-red-900/30'
                                : 'bg-amber-100 text-amber-500 dark:bg-amber-900/30'
                                }`}>
                                {confirmModal.type === 'danger' ? <Trash2 size={36} /> : <AlertTriangle size={36} />}
                            </div>

                            <h3 className={`text-2xl font-bold mb-3 ${theme.text}`}>{confirmModal.title}</h3>
                            <p className={`text-base mb-8 ${theme.subText}`}>{confirmModal.message}</p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                                    className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${isDarkMode
                                        ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] ${confirmModal.type === 'danger'
                                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                                        : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                                        }`}
                                >
                                    تأكيد
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
                    viewerData={viewerData}
                    onClose={closeViewer}
                />

            </main>
        </div>
    );
};

// Helper Component for Data Fields
const DataField = ({ label, value, icon, isStatus, theme }) => (
    <div className="group">
        <label className={`block text-xs font-bold tracking-wider uppercase mb-2 mr-1 transition-colors duration-300 ${theme.subText} group-hover:text-[#1ba3b6]`}>
            {label}
        </label>
        <div className={`relative w-full min-h-[3.5rem] px-4 py-3 rounded-xl border transition-all duration-300 flex items-center justify-start ${theme.inputBg} group-hover:border-[#1ba3b6]/50`}>
            {isStatus ? (
                <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-[#1ba3b6]/10 text-[#1ba3b6]">
                    {value}
                </span>
            ) : (
                <span className={`font-medium text-sm sm:text-base break-words w-[calc(100%-2rem)] ${theme.text}`}>
                    {value}
                </span>
            )}

            {icon && (
                <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none transition-colors duration-300 text-gray-400 group-hover:text-[#1ba3b6]">
                    {icon}
                </div>
            )}
        </div>
    </div>
);

export default EmployeeShipmentDetailsPage;
