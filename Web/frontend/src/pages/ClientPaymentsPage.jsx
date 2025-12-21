import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ClientPaymentsPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalDue, setTotalDue] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [myPayments, setMyPayments] = useState([]);

    const [walletBalance, setWalletBalance] = useState(0);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    // Fetch Invoices, Payments, and Wallet
    useEffect(() => {
        fetchInvoices();
        fetchMyPayments();
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
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
    };

    const fetchInvoices = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/invoice/my-invoices`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            let invoicesData = response.data.invoices || response.data || [];
            if (!Array.isArray(invoicesData)) invoicesData = [];
            console.log("Fetched Invoices:", invoicesData);

            // ===========================================
            // FILTERING LOGIC / منطق تصفية الفواتير
            // ===========================================
            // بناءً على طلب العميل، نقوم بتصفية الفواتير لعرض الفواتير المطلوبة فقط.
            // نقوم باستبعاد الفواتير التي حالتها "في انتظار الموافقة" لأنها لم تعتمد بعد.
            // نقوم أيضاً باستبعاد الفواتير "المرفوضة" لأنها لا تتطلب دافعاً.
            //
            // We filter out invoices that are "Pending Approval" or "Rejected".
            // - "Pending Approval" (في انتظار الموافقة): Not ready for payment yet.
            // - "Rejected" (مرفوض): Should not be displayed to the user.
            // ===========================================
            const filteredInvoices = invoicesData.filter(inv =>
                inv.status !== "في انتظار الموافقة" && inv.status !== "مرفوض"
            );

            setInvoices(filteredInvoices);
            calculateTotal(filteredInvoices);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching invoices:", error);
            setLoading(false);
        }
    };

    const fetchMyPayments = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/payments/my-payments`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMyPayments(response.data || []);
        } catch (error) {
            console.error("Error fetching payments:", error);
        }
    };

    const calculateTotal = (invoicesData) => {
        let total = 0;
        invoicesData.forEach((inv) => {
            if (inv.status !== "تم الدفع") { // Only count unpaid debt
                inv.invoiceItems.forEach((item) => {
                    let price = item.itemPrice;
                    if (item.currencyType === "USD") {
                        price = price * 50;
                    }
                    total += price;
                });
            }
        });
        setTotalDue(total);
    };

    // ... handleFileSelect and handleUploadPayment ...

    const handlePayInvoice = async (invoiceId, invoiceTotal) => {
        if (walletBalance < invoiceTotal) {
            toast.error("رصيد المحفظة غير كافٍ");
            return;
        }

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/invoice/${invoiceId}/pay`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("تم دفع الفاتورة بنجاح");

            // Update state
            fetchWallet();
            fetchInvoices(); // Will recalculate total due
        } catch (error) {
            console.error("Payment Error:", error);
            toast.error(error.response?.data?.message || "فشل الدفع");
        }
    };

    const getInvoiceTotalEGP = (inv) => {
        let total = 0;
        inv.invoiceItems.forEach((item) => {
            let price = item.itemPrice;
            if (item.currencyType === "USD") {
                price = price * 50;
            }
            total += price;
        });
        return total;
    };

    /**
     * =======================================================
     *  HELPER FUNCTION: GET STATUS TEXT / دالة جلب نص الحالة
     * =======================================================
     * This function determines what text to display to the user based on the database status.
     * The goal is to show user-friendly messages that urge action.
     * 
     * هذه الدالة تحدد النص الذي سيتم عرضه للمستخدم بناءً على حالة الفاتورة في قاعدة البيانات.
     * الهدف هو عرض رسائل سهلة للمستخدم تحثه على اتخاذ إجراء.
     */
    const getStatusText = (status) => {
        // ------------------------------------------------------------------
        // Case 1: The invoice is "Approved" in the database.
        // الحالة 1: الفاتورة "تمت الموافقة عليها" في قاعدة البيانات.
        // ------------------------------------------------------------------
        // Although the admin approved it, the client still needs to pay.
        // Therefore, we MUST display "Waiting for Payment" instead of "Approved".
        // على الرغم من موافقة المسؤول، إلا أن العميل لا يزال بحاجة للدفع.
        // لذلك، يجب أن نعرض "فى انتظار الدفع" بدلاً من "تمت الموافقة".
        if (status === 'مقبولة') {
            return 'فى انتظار الدفع';
        }

        // ------------------------------------------------------------------
        // Case 2: Other Statuses (e.g., "Paid").
        // الحالة 2: الحالات الأخرى (مثل "تم الدفع").
        // ------------------------------------------------------------------
        // Display the status exactly as it is in the database.
        // عرض الحالة كما هي مسجلة في قاعدة البيانات.
        return status;
    };

    // ... Return JSX ...
    // Note: I will inject the handleFileSelect and handleUploadPayment back in the rewrite or assume they persist if not replacing them.
    // Since I'm using replace_file_content with range, I need to be careful.
    // Inspecting the original file, lines 93-163 contain the upload logic.
    // I will REPLACE lines 17-91 with the new fetching, state, and wallet logic.
    // AND I will REPLACE lines 197-242 (Table) to include the Pay button and Wallet Card.

    // Let's split this into updates. 
    // This tool call only updates the logic part.


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
            // 1. Upload Images
            const uploadedUrls = [];
            const formData = new FormData();

            // Upload multiple files via S3 endpoint
            const uploadFormData = new FormData();
            uploadFormData.append("category", "payment");
            selectedFiles.forEach(file => {
                uploadFormData.append("files", file);
            });

            const uploadRes = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/uploads/multiple`,
                uploadFormData,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            // S3 controller returns { success: true, uploads: [...] }
            // where uploads is array of objects { url, s3Key, ... }
            // IMPORTANT: Save s3Key (not presigned URL) so backend can generate fresh URLs
            const filePaths = uploadRes.data.uploads.map(f => f.s3Key);

            // 2. Create Payment Record
            // Model expects transactions: [{ imageUrls: "...", status: "PENDING" }]
            const paymentData = {
                userId: user._id, // or from token
                paymentMethod: "BANK_TRANSFER",
                transactions: filePaths.map(path => ({
                    imageUrls: path, // Store S3 key for generating fresh presigned URLs
                    status: "PENDING"
                }))
            };

            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/payments`, // Assumed endpoint
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

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans" dir="rtl">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-[#690000] mb-8 mt-4">إدارة المدفوعات</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Summary Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#690000]">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">إجمالي المديونية</h2>
                        <p className="text-sm text-gray-500 mb-4">يتم احتساب الدولار بسعر 50 جنيه مصري</p>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-4xl font-bold text-[#690000]">
                                    {totalDue.toLocaleString()}
                                </span>
                                <span className="text-xl text-gray-600 mr-2">ج.م</span>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-600">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">رصيد المحفظة</h2>
                        <p className="text-sm text-gray-500 mb-4"> الرصيد المتاح للدفع</p>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-4xl font-bold text-green-600">
                                    {walletBalance.toLocaleString()}
                                </span>
                                <span className="text-xl text-gray-600 mr-2">ج.م</span>
                            </div>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="bg-[#690000] hover:bg-red-800 text-white px-6 py-2 rounded-full font-bold shadow-md transition-transform transform hover:scale-105 flex items-center gap-2 text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                شحن المحفظة
                            </button>
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800">تفاصيل الفواتير</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 text-sm uppercase leading-normal">
                                    <th className="py-3 px-6">رقم الفاتورة</th>
                                    <th className="py-3 px-6">تفاصيل البنود</th>
                                    <th className="py-3 px-6">الإجمالي (EGP)</th>
                                    <th className="py-3 px-6">الحالة</th>
                                    <th className="py-3 px-6">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-sm font-light">
                                {loading && <tr><td colSpan="5" className="text-center py-4">جاري التحميل...</td></tr>}
                                {!loading && invoices.length === 0 && (
                                    <tr><td colSpan="5" className="text-center py-4">لا توجد فواتير حالياً</td></tr>
                                )}
                                {invoices.map((inv) => {
                                    const totalEGP = getInvoiceTotalEGP(inv);
                                    return (
                                        <tr key={inv._id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-3 px-6 font-medium whitespace-nowrap align-top">
                                                {inv.invoiceNumber}
                                                <div className="text-xs text-gray-400 mt-1">{new Date(inv.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="py-3 px-6 align-top">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {inv.invoiceItems.map((item, idx) => (
                                                        <li key={idx} className="text-xs">
                                                            <span className="font-semibold">{item.item}</span>: {item.itemPrice} {item.currencyType}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="py-3 px-6 font-bold text-[#690000] align-top">
                                                {totalEGP.toLocaleString()} ج.م
                                            </td>
                                            <td className="py-3 px-6 align-top">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'تم الدفع' ? 'bg-green-100 text-green-800' :
                                                    inv.status === 'مرفوض' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {/* 
                                                        Display the formatted status text using our helper function.
                                                        استخدام الدالة المساعدة لعرض نص الحالة المنسق.
                                                     */}
                                                    {getStatusText(inv.status)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 align-top">
                                                {inv.status !== 'تم الدفع' && (
                                                    <button
                                                        onClick={() => handlePayInvoice(inv._id, totalEGP)}
                                                        className="bg-green-600 text-white px-4 py-1.5 rounded shadow hover:bg-green-700 text-xs font-bold transition-colors disabled:opacity-50"
                                                        disabled={walletBalance < totalEGP}
                                                        title={walletBalance < totalEGP ? "رصيد المحفظة غير كافٍ" : "دفع الفاتورة"}
                                                    >
                                                        تخليص
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payments History */}
                <div className="mt-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">سجل المدفوعات</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myPayments.map(payment => (
                            <div key={payment._id} className="bg-white rounded-xl shadow-md p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-sm text-gray-500">
                                        {new Date(payment.createdAt).toLocaleDateString('ar-EG')}
                                    </span>
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                                        {payment.paymentMethod}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {payment.transactions?.map((tx, idx) => (
                                        <div key={idx} className="flex items-center gap-3 border rounded-lg p-2">
                                            <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                                {/* Backend now returns presigned S3 URLs */}
                                                <img
                                                    src={tx.imageUrls}
                                                    alt="receipt"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/placeholder-image.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-sm font-semibold text-gray-700">إيصال #{idx + 1}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    tx.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {tx.status === 'PENDING' ? 'قيد المراجعة' :
                                                        tx.status === 'APPROVED' ? 'تمت الموافقة' : 'مرفوض'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {myPayments.length === 0 && (
                            <p className="text-gray-500 col-span-full text-center">لا يوجد عمليات دفع سابقة</p>
                        )}
                    </div>
                </div>

            </main>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">رفع إيصال سداد</h3>
                            <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="font-medium text-gray-600">اضغط هنا لاختيار الصور أو اسحبها هنا</p>
                                    <p className="text-xs text-gray-400">PNG, JPG حتى 5 ميجابايت</p>
                                </div>
                            </div>

                            {previewUrls.length > 0 && (
                                <div className="mt-4 grid grid-cols-4 gap-2">
                                    {previewUrls.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                            <img src={url} alt="preview" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleUploadPayment}
                                disabled={uploading}
                                className={`px-6 py-2 bg-[#690000] text-white rounded-lg font-bold shadow hover:bg-red-800 transition-all ${uploading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {uploading ? 'جاري الرفع...' : 'تأكيد الدفع'}
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
