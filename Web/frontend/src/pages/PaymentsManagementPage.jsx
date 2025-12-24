import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { 
	Wallet, CreditCard, FileText, CheckCircle, 
	XCircle, AlertTriangle, Search, Filter, 
	ArrowUpRight, ArrowDownLeft, RefreshCw,
	Banknote, Inbox
} from 'lucide-react';

export default function PaymentsManagementPage() {
	const { isDarkMode } = useTheme();
	const token = localStorage.getItem("token");
	const [loading, setLoading] = useState(true);
	const [usersData, setUsersData] = useState([]);
	const [filteredData, setFilteredData] = useState([]);
	const [search, setSearch] = useState("");
	
	// Stats
	const [stats, setStats] = useState({
		totalWallet: 0,
		totalDue: 0,
		pendingPayments: 0
	});

	// Modals
	const [modals, setModals] = useState({
		viewInvoices: null, // user object
		viewPayments: null, // user object
		updateWallet: null, // user object
	});

	// Data for modals
	const [userInvoices, setUserInvoices] = useState([]);
	const [userPayments, setUserPayments] = useState([]);
	const [walletForm, setWalletForm] = useState({ amount: '', notes: '' });
	const [processingMap, setProcessingMap] = useState({}); // track processing per item id

	// Theme Config
	const theme = {
		pageBg: isDarkMode ? "bg-[#1a1600]" : "bg-[#FFFDF5]",
		cardBg: isDarkMode ? "bg-[#2d2600]/60 border-[#D4AF37]/20" : "bg-white border-gray-100",
		headerText: isDarkMode ? "text-[#D4AF37]" : "text-[#690000]",
		textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-gray-800",
		textSecondary: isDarkMode ? "text-[#D4AF37]/60" : "text-gray-500",
		inputBg: isDarkMode ? "bg-[#2d2600] border-[#D4AF37]/30 text-white" : "bg-white border-gray-300 text-gray-900",
		modalBg: isDarkMode ? "bg-[#2d2600] border-[#D4AF37]/30 shadow-2xl shadow-black/50" : "bg-white shadow-xl",
		accentBtn: "bg-[#D4AF37] text-black hover:bg-[#b5952f]",
	};

	useEffect(() => {
		fetchData();
	}, [token]);

	useEffect(() => {
		filterData();
	}, [search, usersData]);

	const fetchData = async () => {
		try {
			setLoading(true);
			const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/admin/summary`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			
			const data = res.data;
			setUsersData(data);
			
			// Calculate Stats
			const totalWallet = data.reduce((acc, curr) => acc + (curr.user.wallet || 0), 0);
			const totalDue = data.reduce((acc, curr) => acc + (curr.totalDue || 0), 0);
			const pendingPayments = data.reduce((acc, curr) => acc + (curr.pendingPaymentsCount || 0), 0);
			
			setStats({ totalWallet, totalDue, pendingPayments });

		} catch (error) {
			console.error("Error fetching financials:", error);
			// toast.error("فشل تحميل البيانات المالية");
		} finally {
			setLoading(false);
		}
	};

	const filterData = () => {
		if (!search.trim()) {
			setFilteredData(usersData);
			return;
		}
		const query = search.toLowerCase();
		const result = usersData.filter(item => 
			item.user.name?.toLowerCase().includes(query) ||
			item.user.email?.toLowerCase().includes(query)
		);
		setFilteredData(result);
	};

	// --- Handlers ---

	const handleOpenInvoices = async (user) => {
		setModals(prev => ({ ...prev, viewInvoices: user }));
		try {
			// Fetch invoices fresh or filter from big list if needed. 
			// Assuming '/invoice/getAllInvoices' returns all, might be heavy. 
			// Check if we can fetch per user. If not, stick to getAll logic.
			const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/invoice/getAllInvoices`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const allInv = res.data.invoices || [];
			const userInvs = allInv.filter(inv => inv.userId === user.user._id);
			setUserInvoices(userInvs);
		} catch (error) {
			toast.error("فشل تحميل الفواتير");
		}
	};

	const handleOpenPayments = (userData) => {
		setModals(prev => ({ ...prev, viewPayments: userData }));
		setUserPayments(userData.payments || []);
	};

	const handleWalletUpdate = async () => {
		const user = modals.updateWallet;
		if (!user || !walletForm.amount) return;
		
		try {
			await axios.put(
				`${import.meta.env.VITE_API_URL}/api/payments/users/${user.user._id}/wallet`,
				{ amount: walletForm.amount, type: 'add' },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			toast.success("تم تحديث المحفظة بنجاح");
			setModals(prev => ({ ...prev, updateWallet: null }));
			setWalletForm({ amount: '', notes: '' });
			fetchData();
		} catch (error) {
			toast.error("فشل تحديث المحفظة");
		}
	};

	const handlePaymentStatus = async (paymentId, transactionId, status) => {
		const key = `${paymentId}-${transactionId}`;
		setProcessingMap(prev => ({ ...prev, [key]: true }));
		
		try {
			await axios.patch(
				`${import.meta.env.VITE_API_URL}/api/payments/${paymentId}/transactions/${transactionId}`,
				{ status },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			toast.success(`تم ${status === 'APPROVED' ? 'الموافقة على' : 'رفض'} المعاملة`);
			
			// Update local state immediately
			setUserPayments(prev => prev.map(p => {
				if (p._id === paymentId) {
					return {
						...p,
						transactions: p.transactions.map(t => 
							t._id === transactionId ? { ...t, status } : t
						)
					};
				}
				return p;
			}));
			fetchData(); // Refresh global stats
		} catch (error) {
			toast.error("فشل تحديث الحالة");
		} finally {
			setProcessingMap(prev => ({ ...prev, [key]: false }));
		}
	};

	return (
		<div className={`min-h-screen ${theme.pageBg} transition-colors duration-300 font-sans pt-28 pb-12`}>
			<Toaster position="top-center" />
			<Header />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				
				{/* Welcome Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
					<div>
						<h1 className={`text-3xl font-bold ${theme.headerText} mb-2`}>
							الإدارة المالية 💰
						</h1>
						<p className={`${theme.textSecondary}`}>متابعة محافظ العملاء، الفواتير، والمدفوعات المعلقة</p>
					</div>
					<button 
						onClick={fetchData}
						className={`p-2 rounded-xl transition-all active:scale-95 ${isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
					>
						<RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
					</button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center justify-between`}>
						<div>
							<p className={`text-sm ${theme.textSecondary}`}>إجمالي رصيد المحافظ</p>
							<p className="text-2xl font-bold text-emerald-500">{stats.totalWallet.toLocaleString()} ج.م</p>
						</div>
						<div className={`p-3 rounded-xl bg-emerald-500/10 text-emerald-500`}>
							<Wallet className="w-6 h-6" />
						</div>
					</div>
					<div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center justify-between`}>
						<div>
							<p className={`text-sm ${theme.textSecondary}`}>إجمالي المستحقات</p>
							<p className="text-2xl font-bold text-red-500">{stats.totalDue.toLocaleString()} ج.م</p>
						</div>
						<div className={`p-3 rounded-xl bg-red-500/10 text-red-500`}>
							<ArrowDownLeft className="w-6 h-6" />
						</div>
					</div>
					<div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center justify-between`}>
						<div>
							<p className={`text-sm ${theme.textSecondary}`}>مدفوعات معلقة</p>
							<p className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.pendingPayments}</p>
						</div>
						<div className={`p-3 rounded-xl bg-orange-500/10 text-orange-500`}>
							<AlertTriangle className="w-6 h-6" />
						</div>
					</div>
				</div>

				{/* Search & Content */}
				<div className={`rounded-xl border overflow-hidden backdrop-blur-sm ${theme.cardBg}`}>
					{/* Toolbar */}
					<div className={`p-4 border-b ${isDarkMode ? "border-white/5" : "border-gray-100"} flex flex-col md:flex-row gap-4`}>
						<div className="relative flex-1">
							<Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textSecondary}`} />
							<input 
								type="text" 
								placeholder="بحث باسم العميل..." 
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className={`w-full rounded-xl pr-10 pl-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${theme.inputBg}`}
							/>
						</div>
					</div>

					{/* Table */}
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className={`${isDarkMode ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-gray-50 text-gray-700"} border-b ${isDarkMode ? "border-white/5" : "border-gray-100"}`}>
								<tr>
									<th className="px-6 py-4 text-right font-bold">العميل</th>
									<th className="px-6 py-4 text-right font-bold">المحفظة</th>
									<th className="px-6 py-4 text-right font-bold">المستحق</th>
									<th className="px-6 py-4 text-center font-bold">الفواتير</th>
									<th className="px-6 py-4 text-center font-bold">الإجراءات</th>
								</tr>
							</thead>
							<tbody className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-gray-100"}`}>
								{loading ? (
									<tr><td colSpan="5" className="py-8 text-center text-gray-500">جاري التحميل...</td></tr>
								) : filteredData.length === 0 ? (
									<tr>
										<td colSpan="5" className={`py-12 text-center ${theme.textSecondary}`}>
											<Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
											لا توجد بيانات للعرض
										</td>
									</tr>
								) : (
									filteredData.map((data) => (
										<tr key={data.user._id} className={`transition-colors ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
											<td className={`px-6 py-4 font-bold ${theme.textPrimary}`}>
												{data.user.name}
											</td>
											<td className="px-6 py-4">
												<span className="font-mono text-emerald-500 font-bold">{data.user.wallet?.toLocaleString()}</span>
											</td>
											<td className="px-6 py-4">
												<span className={`font-mono font-bold ${data.totalDue > 0 ? "text-red-500" : "text-gray-400"}`}>
													{data.totalDue?.toLocaleString()}
												</span>
											</td>
											<td className="px-6 py-4 text-center">
												<button 
													onClick={() => handleOpenInvoices(data)}
													className={`text-xs px-2 py-1 rounded-lg border ${isDarkMode ? "border-white/20 text-gray-300 hover:bg-white/10" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
												>
													{data.invoicesCount} فاتورة
												</button>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center justify-center gap-2">
													<button
														onClick={() => setModals({ ...modals, updateWallet: data })}
														className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
														title="إضافة رصيد"
													>
														<ArrowUpRight className="w-4 h-4" />
													</button>
													<button
														onClick={() => handleOpenPayments(data)}
														className={`p-2 rounded-lg relative ${data.pendingPaymentsCount > 0 ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" : "bg-gray-500/10 text-gray-500"}`}
														title="مراجعة المدفوعات"
													>
														<Banknote className="w-4 h-4" />
														{data.pendingPaymentsCount > 0 && (
															<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
														)}
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* ================= MODALS ================= */}
			
			{/* 1. Wallet Modal */}
			{modals.updateWallet && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModals({ ...modals, updateWallet: null })}>
					<div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl ${theme.modalBg}`} onClick={e => e.stopPropagation()}>
						<h3 className={`text-xl font-bold mb-4 ${theme.textPrimary}`}>إضافة رصيد: {modals.updateWallet.user.name}</h3>
						
						<div className="space-y-4">
							<div>
								<label className={`block text-sm mb-1 ${theme.textSecondary}`}>المبلغ (ج.م)</label>
								<input 
									type="number"
									value={walletForm.amount}
									onChange={e => setWalletForm({ ...walletForm, amount: e.target.value })}
									className={`w-full p-3 rounded-xl outline-none border focus:ring-2 focus:ring-[#D4AF37] ${theme.inputBg}`}
									placeholder="0.00"
									autoFocus
								/>
							</div>
							<div className="flex gap-3 pt-2">
								<button 
									onClick={() => setModals({ ...modals, updateWallet: null })}
									className={`flex-1 py-2 rounded-xl font-bold ${isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"}`}
								>
									إلغاء
								</button>
								<button 
									onClick={handleWalletUpdate}
									disabled={!walletForm.amount}
									className={`flex-1 py-2 rounded-xl font-bold ${theme.accentBtn} disabled:opacity-50`}
								>
									تأكيد
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* 2. Invoices Modal */}
			{modals.viewInvoices && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModals({ ...modals, viewInvoices: null })}>
					<div className={`w-full max-w-3xl p-6 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col ${theme.modalBg}`} onClick={e => e.stopPropagation()}>
						<div className="flex justify-between items-center mb-6">
							<h3 className={`text-xl font-bold ${theme.textPrimary}`}>فواتير: {modals.viewInvoices.user.name}</h3>
							<button onClick={() => setModals({ ...modals, viewInvoices: null })} className="text-gray-500 hover:text-red-500"><XCircle className="w-6 h-6" /></button>
						</div>
						
						<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
							{userInvoices.length === 0 ? (
								<div className={`text-center py-10 ${theme.textSecondary}`}>لا توجد فواتير</div>
							) : (
								<div className="space-y-3">
									{userInvoices.map(inv => (
										<div key={inv._id} className={`p-4 rounded-xl border ${isDarkMode ? "border-white/10 bg-white/5" : "border-gray-100 bg-gray-50"}`}>
											<div className="flex justify-between items-start mb-2">
												<div>
													<p className={`font-bold ${theme.textPrimary}`}>#{inv.invoiceNumber}</p>
													<p className={`text-xs ${theme.textSecondary}`}>{new Date(inv.createdAt).toLocaleDateString("ar-EG")}</p>
												</div>
												<span className={`px-2 py-1 rounded text-xs font-bold ${inv.status.includes('دفع') ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
													{inv.status}
												</span>
											</div>
											<div className={`text-sm ${theme.textPrimary}`}>
												{inv.invoiceItems.map((item, idx) => (
													<div key={idx} className="flex justify-between py-1 border-t border-dashed border-gray-200/20 first:border-0">
														<span>{item.item}</span>
														<span className="font-mono">{item.itemPrice} {item.currencyType}</span>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* 3. Payments Review Modal */}
			{modals.viewPayments && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModals({ ...modals, viewPayments: null })}>
					<div className={`w-full max-w-4xl p-6 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col ${theme.modalBg}`} onClick={e => e.stopPropagation()}>
						<div className="flex justify-between items-center mb-6">
							<h3 className={`text-xl font-bold ${theme.textPrimary}`}>مدفوعات: {modals.viewPayments.user.name}</h3>
							<button onClick={() => setModals({ ...modals, viewPayments: null })} className="text-gray-500 hover:text-red-500"><XCircle className="w-6 h-6" /></button>
						</div>

						<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar space-y-6">
							{userPayments.length === 0 ? (
								<div className={`text-center py-10 ${theme.textSecondary}`}>لا توجد مدفوعات</div>
							) : (
								userPayments.map(pay => (
									<div key={pay._id} className={`rounded-xl overflow-hidden border ${isDarkMode ? "border-white/10" : "border-gray-200"}`}>
										<div className={`p-3 border-b flex justify-between items-center ${isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"}`}>
											<span className={`text-sm font-bold ${theme.textPrimary}`}>
												{new Date(pay.createdAt).toLocaleDateString("ar-EG")}
											</span>
											<span className={`text-xs px-2 py-1 rounded bg-white/10 border border-white/10 ${theme.textPrimary}`}>
												{pay.paymentMethod}
											</span>
										</div>
										<div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
											{pay.transactions.map(trans => (
												<div key={trans._id} className={`relative group border rounded-lg p-2 flex flex-col gap-2 ${isDarkMode ? "border-white/10 bg-black/20" : "border-gray-100 bg-white"}`}>
													<div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-100 relative">
														<a href={trans.imageUrls} target="_blank" rel="noopener noreferrer" className="block h-full">
															<img 
																src={trans.imageUrls} 
																alt="إيصال" 
																className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
																onError={(e) => { e.target.src = "https://placehold.co/400?text=No+Image"; }}
															/>
														</a>
														<div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold shadow-sm ${
															trans.status === 'APPROVED' ? 'bg-green-500 text-white' :
															trans.status === 'REJECTED' ? 'bg-red-500 text-white' :
															'bg-yellow-500 text-white'
														}`}>
															{trans.status === 'PENDING' ? 'قيد المراجعة' :
															 trans.status === 'APPROVED' ? 'مقبول' : 'مرفوض'}
														</div>
													</div>
													
													{/* Actions */}
													{trans.status === 'PENDING' && (
														<div className="flex gap-2 mt-auto pt-2">
															<button
																onClick={() => handlePaymentStatus(pay._id, trans._id, 'APPROVED')}
																disabled={processingMap[`${pay._id}-${trans._id}`]}
																className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
															>
																{processingMap[`${pay._id}-${trans._id}`] ? "..." : "قبول"}
															</button>
															<button
																onClick={() => handlePaymentStatus(pay._id, trans._id, 'REJECTED')}
																disabled={processingMap[`${pay._id}-${trans._id}`]}
																className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
															>
																{processingMap[`${pay._id}-${trans._id}`] ? "..." : "رفض"}
															</button>
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			)}

		</div>
	);
}
