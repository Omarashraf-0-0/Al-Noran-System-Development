import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import Footer from '../components/Footer';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

const PaymentsManagementPage = () => {
    const token = localStorage.getItem("token");
    const [usersData, setUsersData] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State for Modals
    const [selectedUserForInvoices, setSelectedUserForInvoices] = useState(null);
    const [userInvoices, setUserInvoices] = useState([]); // Invoices for editing

    const [selectedUserForPayments, setSelectedUserForPayments] = useState(null);
    const [userPayments, setUserPayments] = useState([]); // Payments for review

    const [selectedUserForWallet, setSelectedUserForWallet] = useState(null);
    const [walletAmount, setWalletAmount] = useState('');

    useEffect(() => {
        fetchFinancials();
    }, [token]);

    const fetchFinancials = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/admin/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsersData(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching financials:", error);
            toast.error("Failed to load financial data");
            setLoading(false);
        }
    };

    // --- Invoice View Handlers ---
    const handleOpenInvoices = async (user) => {
        try {
            const allInvoicesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/invoice/getAllInvoices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allInv = allInvoicesRes.data.invoices || [];
            const userInvs = allInv.filter(inv => inv.userId === user.user._id);
            setUserInvoices(userInvs);
            setSelectedUserForInvoices(user);
        } catch (e) {
            console.error("Error fetching invoices details:", e);
            toast.error("Could not fetch invoices details");
        }
    };

    // --- Wallet Handlers ---
    const handleOpenWalletModal = (user) => {
        setSelectedUserForWallet(user);
        setWalletAmount('');
    };

    const handleUpdateWallet = async () => {
        if (!walletAmount) return;
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/payments/users/${selectedUserForWallet.user._id}/wallet`,
                { amount: walletAmount, type: 'add' }, // Assuming 'add' adds to existing. The UI says "Add to Wallet".
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Wallet updated successfully");
            setWalletAmount('');
            setSelectedUserForWallet(null);
            fetchFinancials();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update wallet");
        }
    };

    // --- Payment Review Handlers ---
    const handleOpenPayments = (userData) => {
        setSelectedUserForPayments(userData.user);
        setUserPayments(userData.payments);
    };

    const handleUpdatePaymentStatus = async (paymentId, transactionId, newStatus) => {
        try {
            await axios.patch(
                `${import.meta.env.VITE_API_URL}/api/payments/${paymentId}/transactions/${transactionId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Transaction ${newStatus}`);

            // Update local state
            const updatedPayments = userPayments.map(p => {
                if (p._id === paymentId) {
                    const newTrans = p.transactions.map(t =>
                        t._id === transactionId ? { ...t, status: newStatus } : t
                    );
                    return { ...p, transactions: newTrans };
                }
                return p;
            });
            setUserPayments(updatedPayments);
            fetchFinancials();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans relative" dir="rtl">
            <Toaster />
            <AdminHeader />

            <main className="container mx-auto px-16 py-8">
                <h1 className="text-4xl font-bold text-[#690000] text-right mb-8 mt-4">
                    إدارة المدفوعات
                </h1>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse">
                                <thead className="bg-[#690000] text-white">
                                    <tr>
                                        <th className="py-4 px-4">اسم العميل</th>
                                        <th className="py-4 px-4">رصيد المحفظة</th>
                                        <th className="py-4 px-4">إجمالي المستحق (EGP)</th>
                                        <th className="py-4 px-4">الفواتير</th>
                                        <th className="py-4 px-4">المدفوعات المعلقة</th>
                                        <th className="py-4 px-4">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-100">
                                    {usersData.length > 0 ? usersData.map((data) => (
                                        <tr key={data.user._id} className="hover:bg-red-50 text-gray-800">
                                            <td className="p-4 font-medium">{data.user.name}</td>
                                            <td className="p-4 font-bold text-green-700">
                                                {data.user.wallet?.toLocaleString()} ج.م
                                            </td>
                                            <td className="p-4 font-bold text-lg">
                                                {data.totalDue.toLocaleString()} ج.م
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleOpenInvoices(data)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline"
                                                >
                                                    {data.invoicesCount} فاتورة (عرض)
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleOpenPayments(data)}
                                                    className={`text-sm font-bold ${data.pendingPaymentsCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}
                                                >
                                                    {data.pendingPaymentsCount} معلق (عرض)
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleOpenWalletModal(data)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors mx-1"
                                                >
                                                    إضافة للمحفظة
                                                </button>
                                                <button
                                                    onClick={() => handleOpenPayments(data)}
                                                    className="bg-red-800 text-white px-3 py-1 rounded text-sm hover:bg-red-900 transition-colors mx-1"
                                                >
                                                    المدفوعات
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-500">لا يوجد بيانات لعرضها</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Invoices Modal (Read-Only) */}
            {selectedUserForInvoices && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold">عرض فواتير: {selectedUserForInvoices.user.name}</h2>
                            <button onClick={() => setSelectedUserForInvoices(null)} className="text-gray-500 hover:text-red-500">✕</button>
                        </div>
                        <div className="p-6">
                            {userInvoices.length === 0 ? <p>لا توجد فواتير</p> : userInvoices.map(inv => (
                                <div key={inv._id} className="mb-6 border p-4 rounded-lg bg-gray-50">
                                    <div className="flex justify-between mb-2 font-bold bg-gray-200 p-2 rounded">
                                        <span>رقم الفاتورة: {inv.invoiceNumber}</span>
                                        <span className="text-sm text-gray-600">
                                            {new Date(inv.createdAt).toLocaleDateString()}
                                            <span className={`mr-2 px-2 py-0.5 rounded text-xs ${inv.status === 'تم الدفع' ? 'bg-green-200' : 'bg-yellow-200'}`}>{inv.status}</span>
                                        </span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-gray-500 border-b">
                                                <th className="pb-2">البند</th>
                                                <th className="pb-2">السعر</th>
                                                <th className="pb-2">العملة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inv.invoiceItems.map(item => (
                                                <tr key={item._id} className="border-b last:border-0 border-gray-100">
                                                    <td className="py-2">{item.item}</td>
                                                    <td className="py-2 font-bold">{item.itemPrice}</td>
                                                    <td className="py-2">{item.currencyType}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Wallet Update Modal */}
            {selectedUserForWallet && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">إضافة رصيد للمحفظة</h2>
                            <button onClick={() => setSelectedUserForWallet(null)} className="text-gray-500 hover:text-red-500">✕</button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">إسم العميل</label>
                                <p className="text-gray-900 font-semibold">{selectedUserForWallet.user.name}</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">الرصيد الحالي</label>
                                <p className="text-green-700 font-bold">{selectedUserForWallet.user.wallet?.toLocaleString()} ج.م</p>
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">المبلغ المراد إضافته (EGP)</label>
                                <input
                                    type="number"
                                    value={walletAmount}
                                    onChange={(e) => setWalletAmount(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="أدخل المبلغ..."
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setSelectedUserForWallet(null)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleUpdateWallet}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                    disabled={!walletAmount}
                                >
                                    إضافة رصيد
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payments Modal (Unchanged largely, just ensuring it's still here) */}
            {selectedUserForPayments && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold">مدفوعات العميل: {selectedUserForPayments.name}</h2>
                            <button onClick={() => setSelectedUserForPayments(null)} className="text-gray-500 hover:text-red-500">✕</button>
                        </div>
                        <div className="p-6 grid grid-cols-1 gap-6">
                            {userPayments.length === 0 ? <p>لا توجد مدفوعات</p> : userPayments.map(pay => (
                                <div key={pay._id} className="border rounded-lg overflow-hidden">
                                    <div className="bg-gray-100 p-3 border-b flex justify-between">
                                        <span className="font-bold">تاريخ الدفع: {new Date(pay.createdAt).toLocaleDateString()}</span>
                                        <span className="text-sm bg-white px-2 rounded border">{pay.paymentMethod}</span>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {pay.transactions.map(trans => (
                                            <div key={trans._id} className="border rounded p-2 flex flex-col gap-2">
                                                <a href={trans.imageUrls} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={trans.imageUrls}
                                                        alt="Receipt"
                                                        className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-90"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = '/placeholder-image.png';
                                                        }}
                                                    />
                                                </a>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${trans.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                        trans.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {trans.status === 'PENDING' ? 'قيد المراجعة' :
                                                            trans.status === 'APPROVED' ? 'تمت الموافقة' : 'مرفوض'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleUpdatePaymentStatus(pay._id, trans._id, 'APPROVED')}
                                                        disabled={trans.status === 'APPROVED'}
                                                        className="flex-1 bg-green-600 text-white py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        قبول
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdatePaymentStatus(pay._id, trans._id, 'REJECTED')}
                                                        disabled={trans.status === 'REJECTED'}
                                                        className="flex-1 bg-red-600 text-white py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        رفض
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default PaymentsManagementPage;
