import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import AVATAR from "../assets/images/AVATAR.png";
import chatIcon from "../assets/images/support_agent.png";

const MyCustomers = () => {
	const [customers, setCustomers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");
	const [expandedCustomer, setExpandedCustomer] = useState(null);
	const navigate = useNavigate();

	const token = localStorage.getItem("token");
	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3500";

	useEffect(() => {
		fetchCustomers();
	}, []);

	const fetchCustomers = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${apiUrl}/api/chat/my-customers`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			console.log("Customers:", response.data);
			setCustomers(response.data.customers || []);
		} catch (error) {
			console.error("Error fetching customers:", error);
			toast.error("فشل تحميل قائمة العملاء");
		} finally {
			setLoading(false);
		}
	};

	const handleOpenChat = async (customer, shipment) => {
		try {
			console.log("Opening chat for shipment:", shipment._id);
			
			// Get or create chat for this shipment
			const response = await axios.post(
				`${apiUrl}/api/chat`,
				{ shipmentId: shipment._id },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			console.log("Chat response:", response.data);
			
			if (response.data.success && response.data.chat) {
				// Navigate to chat interface with the chat ID
				navigate(`/chat?chatId=${response.data.chat._id}`);
			} else {
				toast.error("فشل في فتح المحادثة");
			}
		} catch (error) {
			console.error("Error opening chat:", error);
			toast.error(error.response?.data?.message || "فشل فتح المحادثة");
		}
	};

	const handleViewShipment = (shipmentId) => {
		navigate(`/employee-shipment/${shipmentId}`);
	};

	// Filter and search customers
	const filteredCustomers = customers.filter((customer) => {
		const matchesSearch = 
			customer.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			customer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

		if (!matchesSearch) return false;

		if (filterStatus === "all") return true;

		return customer.shipments.some((s) => {
			if (filterStatus === "completed") {
				return s.status === "مكتملة" || s.status === "تمت بنجاح";
			}
			if (filterStatus === "inProgress") {
				return s.status !== "مكتملة" && s.status !== "تمت بنجاح";
			}
			return true;
		});
	});

	const getStatusBadgeClass = (status) => {
		if (status === "مكتملة" || status === "تمت بنجاح") {
			return "bg-green-100 text-green-800 border-green-300";
		}
		if (status === "في الطريق") {
			return "bg-blue-100 text-blue-800 border-blue-300";
		}
		if (status === "في انتظار الشحن") {
			return "bg-yellow-100 text-yellow-800 border-yellow-300";
		}
		return "bg-gray-100 text-gray-800 border-gray-300";
	};

	if (loading) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<AdminHeader />
				<div className="container mx-auto px-4 py-12">
					<div className="flex justify-center items-center py-20">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
						<span className="mr-4 text-gray-600">جاري التحميل...</span>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="bg-gray-50 min-h-screen">
			<AdminHeader />

			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="max-w-7xl mx-auto">
					{/* Page Header */}
					<div className="bg-white rounded-xl shadow-sm p-6 mb-6">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
									<span>👥</span>
									<span>عملائي</span>
								</h1>
								<p className="text-gray-600 mt-1">
									إدارة العملاء والشحنات المعينة لك
								</p>
							</div>
							{customers.length > 0 && (
								<div className="text-center bg-red-50 px-6 py-3 rounded-lg border border-red-200">
									<p className="text-2xl font-bold text-red-900">
										{customers.length}
									</p>
									<p className="text-xs text-gray-600">عميل</p>
								</div>
							)}
						</div>

						{/* Search and Filter */}
						<div className="flex flex-col sm:flex-row gap-4 mt-6">
							<div className="flex-1">
								<div className="relative">
									<input
										type="text"
										placeholder="بحث عن عميل (الاسم، البريد، اسم المستخدم)..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
									/>
									<svg
										className="absolute right-3 top-3.5 w-5 h-5 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										/>
									</svg>
								</div>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => setFilterStatus("all")}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										filterStatus === "all"
											? "bg-red-800 text-white"
											: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
									}`}
								>
									الكل
								</button>
								<button
									onClick={() => setFilterStatus("inProgress")}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										filterStatus === "inProgress"
											? "bg-red-800 text-white"
											: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
									}`}
								>
									قيد التنفيذ
								</button>
								<button
									onClick={() => setFilterStatus("completed")}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										filterStatus === "completed"
											? "bg-red-800 text-white"
											: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
									}`}
								>
									مكتملة
								</button>
							</div>
						</div>
					</div>

					{/* Customers List */}
					{filteredCustomers.length === 0 ? (
						<div className="bg-white rounded-xl shadow-sm p-12 text-center">
							<div className="text-6xl mb-4">
								{searchTerm || filterStatus !== "all" ? "🔍" : "📭"}
							</div>
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								{searchTerm || filterStatus !== "all"
									? "لا توجد نتائج"
									: "لا يوجد عملاء حالياً"}
							</h3>
							<p className="text-gray-600">
								{searchTerm || filterStatus !== "all"
									? "جرب تغيير البحث أو الفلتر"
									: "لم يتم تعيين أي شحنات لك بعد. سيظهر العملاء هنا عند تعيين شحنات."}
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4">
							{filteredCustomers.map((customer) => (
								<div
									key={customer._id}
									className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200"
								>
									{/* Customer Header */}
									<div
										className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors"
										onClick={() =>
											setExpandedCustomer(
												expandedCustomer === customer._id ? null : customer._id
											)
										}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-4 flex-1">
												<div className="relative">
													<img
														src={AVATAR}
														alt={customer.fullname}
														className="w-14 h-14 rounded-full border-3 border-white shadow-md"
													/>
													<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
												</div>
												<div className="flex-1">
													<h3 className="text-lg font-bold text-gray-900">
														{customer.fullname || customer.username}
													</h3>
													<p className="text-sm text-gray-600">{customer.email}</p>
												</div>
											</div>
											
											<div className="flex items-center gap-6">
												{/* Stats */}
												<div className="hidden sm:flex items-center gap-6">
													<div className="text-center">
														<p className="text-2xl font-bold text-red-900">
															{customer.shipments.length}
														</p>
														<p className="text-xs text-gray-600">شحنة</p>
													</div>
													<div className="text-center">
														<p className="text-2xl font-bold text-green-600">
															{customer.shipments.filter(
																(s) => s.status === "مكتملة" || s.status === "تمت بنجاح"
															).length}
														</p>
														<p className="text-xs text-gray-600">مكتملة</p>
													</div>
													<div className="text-center">
														<p className="text-2xl font-bold text-blue-600">
															{customer.shipments.filter(
																(s) =>
																	s.status !== "مكتملة" && s.status !== "تمت بنجاح"
															).length}
														</p>
														<p className="text-xs text-gray-600">نشطة</p>
													</div>
												</div>
												
												{/* Expand/Collapse Icon */}
												<svg
													className={`w-6 h-6 text-gray-400 transition-transform ${
														expandedCustomer === customer._id ? "rotate-180" : ""
													}`}
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 9l-7 7-7-7"
													/>
												</svg>
											</div>
										</div>
									</div>

									{/* Shipments List - Expandable */}
									{expandedCustomer === customer._id && (
										<div className="p-4 bg-white border-t border-gray-200">
											<h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
												<span>📦</span>
												<span>الشحنات ({customer.shipments.length})</span>
											</h4>
											<div className="space-y-3">
												{customer.shipments.map((shipment) => (
													<div
														key={shipment._id}
														className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all"
													>
														<div className="flex-1">
															<div className="flex items-center gap-3 mb-2">
																<p className="font-bold text-gray-900">
																	{shipment.acid}
																</p>
																<span
																	className={`text-xs px-3 py-1 rounded-full font-medium border ${getStatusBadgeClass(
																		shipment.status
																	)}`}
																>
																	{shipment.status}
																</span>
															</div>
															<div className="flex items-center gap-4 text-sm text-gray-600">
																<span className="flex items-center gap-1">
																	<span>📍</span>
																	<span>{shipment.country}</span>
																</span>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<button
																onClick={() => handleViewShipment(shipment._id)}
																className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
																title="عرض تفاصيل الشحنة"
															>
																<svg
																	className="w-5 h-5"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
																	/>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
																	/>
																</svg>
																<span className="hidden sm:inline">عرض</span>
															</button>
															<button
																onClick={() => handleOpenChat(customer, shipment)}
																className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
																title="فتح المحادثة"
															>
																<img src={chatIcon} alt="Chat" className="w-5 h-5" />
																<span>محادثة</span>
															</button>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default MyCustomers;
