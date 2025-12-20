import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AVATAR from "../assets/images/AVATAR.png";
import chatIcon from "../assets/images/support_agent.png";

const MyCustomers = () => {
	const [customers, setCustomers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedCustomer, setExpandedCustomer] = useState(null);
	const navigate = useNavigate();

	const token = localStorage.getItem("token");

	useEffect(() => {
		fetchCustomers();
	}, []);

	const fetchCustomers = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/chat/my-customers`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			console.log("Customers:", response.data);
			setCustomers(response.data.customers);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching customers:", error);
			toast.error("فشل تحميل قائمة العملاء");
			setLoading(false);
		}
	};

	const handleOpenChat = async (customer, item) => {
		try {
			// Get or create chat for this shipment/UCR
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/chat`,
				{ shipmentId: item._id },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			console.log("Chat created/retrieved:", response.data);
			
			// Navigate to chat interface with the chat ID
			navigate(`/chat?chatId=${response.data.chat._id}`);
		} catch (error) {
			console.error("Error opening chat:", error);
			toast.error(error.response?.data?.message || "فشل فتح المحادثة");
		}
	};

	const toggleCustomer = (customerId) => {
		setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
	};

	// Filter customers based on search query
	const filteredCustomers = customers.filter((customer) => {
		const searchLower = searchQuery.toLowerCase();
		return (
			customer.fullname?.toLowerCase().includes(searchLower) ||
			customer.username?.toLowerCase().includes(searchLower) ||
			customer.email?.toLowerCase().includes(searchLower)
		);
	});

	// Calculate total items (ACIDs + UCRs) for a customer
	const getTotalItems = (customer) => {
		return (customer.shipments?.length || 0) + (customer.ucrRequests?.length || 0);
	};

	if (loading) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<Header />
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
			<Header />

			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="max-w-6xl mx-auto">
					{/* Page Header */}
					<div className="bg-white rounded-xl shadow-lg p-6 mb-8">
						<h1 className="text-3xl font-bold text-red-900 text-center mb-2">
							👥 عملائي
						</h1>
						<p className="text-gray-600 text-center mb-4">
							قائمة بجميع العملاء الذين لديهم شحنات أو طلبات UCR مُعينة لك
						</p>

						{/* Search Bar */}
						<div className="max-w-md mx-auto mt-6">
							<div className="relative">
								<input
									type="text"
									placeholder="🔍 البحث عن عميل..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-900 transition"
								/>
								{searchQuery && (
									<button
										onClick={() => setSearchQuery("")}
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
									>
										✕
									</button>
								)}
							</div>
						</div>

						{filteredCustomers.length > 0 && (
							<p className="text-center mt-4 text-sm text-gray-500">
								إجمالي العملاء:{" "}
								<span className="font-bold text-red-900">{filteredCustomers.length}</span>
							</p>
						)}
					</div>

					{/* Customers List */}
					{filteredCustomers.length === 0 ? (
						<div className="bg-white rounded-xl shadow-lg p-12 text-center">
							<div className="text-6xl mb-4">
								{searchQuery ? "🔍" : "📭"}
							</div>
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								{searchQuery ? "لا توجد نتائج" : "لا يوجد عملاء حالياً"}
							</h3>
							<p className="text-gray-600">
								{searchQuery
									? "حاول البحث بكلمات مختلفة"
									: "لم يتم تعيين أي شحنات أو طلبات UCR لك بعد."}
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4">
							{filteredCustomers.map((customer) => {
								const isExpanded = expandedCustomer === customer._id;
								const totalItems = getTotalItems(customer);
								const acidCount = customer.shipments?.length || 0;
								const ucrCount = customer.ucrRequests?.length || 0;

								return (
									<div
										key={customer._id}
										className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
									>
										{/* Customer Header - Clickable */}
										<button
											onClick={() => toggleCustomer(customer._id)}
											className="w-full bg-gradient-to-r from-red-900 to-red-700 p-4 text-left hover:from-red-800 hover:to-red-600 transition-all"
										>
											<div className="flex items-center gap-4">
												<img
													src={AVATAR}
													alt={customer.fullname}
													className="w-16 h-16 rounded-full border-4 border-white"
												/>
												<div className="flex-1 text-white">
													<h3 className="text-xl font-bold">
														{customer.fullname || customer.username}
													</h3>
													<p className="text-sm text-red-100">{customer.email}</p>
												</div>
												<div className="text-right text-white">
													<p className="text-sm text-red-100">إجمالي الطلبات</p>
													<p className="text-2xl font-bold">{totalItems}</p>
													<p className="text-xs text-red-100">
														{acidCount} ACID | {ucrCount} UCR
													</p>
												</div>
												<div className="text-white text-2xl">
													{isExpanded ? "▼" : "◀"}
												</div>
											</div>
										</button>

										{/* Expandable Content */}
										{isExpanded && (
											<div className="p-4">
												{/* ACID Shipments Section */}
												{acidCount > 0 && (
													<div className="mb-6">
														<h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
															<span>📦</span>
															<span>الشحنات (ACID)</span>
															<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
																{acidCount}
															</span>
														</h4>
														<div className="space-y-2">
															{customer.shipments.map((shipment) => (
																<div
																	key={shipment._id}
																	className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
																>
																	<div className="flex-1">
																		<p className="font-bold text-gray-800">
																			ACID: {shipment.acid}
																		</p>
																		<div className="flex items-center gap-3 mt-1">
																			<span className="text-sm text-gray-600">
																				📍 {shipment.country}
																			</span>
																			<span
																				className={`text-xs px-2 py-1 rounded-full ${
																					shipment.status === "مكتملة" || 
																					shipment.status === "تمت بنجاح"
																						? "bg-green-100 text-green-800"
																						: shipment.status === "في الطريق"
																						? "bg-blue-100 text-blue-800"
																						: "bg-yellow-100 text-yellow-800"
																				}`}
																			>
																				{shipment.status}
																			</span>
																		</div>
																	</div>
																	<button
																		onClick={() => handleOpenChat(customer, shipment)}
																		className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
																	>
																		<img src={chatIcon} alt="Chat" className="w-5 h-5" />
																		<span>فتح المحادثة</span>
																	</button>
																</div>
															))}
														</div>
													</div>
												)}

												{/* UCR Requests Section */}
												{ucrCount > 0 && (
													<div>
														<h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
															<span>✈️</span>
															<span>طلبات التصدير (UCR)</span>
															<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
																{ucrCount}
															</span>
														</h4>
														<div className="space-y-2">
															{customer.ucrRequests.map((ucr) => (
																<div
																	key={ucr._id}
																	className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition"
																>
																	<div className="flex-1">
																		<p className="font-bold text-gray-800">
																			{ucr.ucrNumber ? `UCR: ${ucr.ucrNumber}` : `طلب: ${ucr.requestNumber}`}
																		</p>
																		<div className="flex items-center gap-3 mt-1">
																			<span className="text-sm text-gray-600">
																				📍 {ucr.country}
																			</span>
																			<span
																				className={`text-xs px-2 py-1 rounded-full ${
																					ucr.status === "completed"
																						? "bg-green-100 text-green-800"
																						: ucr.status === "approved" || ucr.status === "ready_to_ship"
																						? "bg-blue-100 text-blue-800"
																						: "bg-yellow-100 text-yellow-800"
																				}`}
																			>
																				{ucr.status === "completed" && "مكتمل"}
																				{ucr.status === "approved" && "معتمد"}
																				{ucr.status === "pending" && "قيد المراجعة"}
																				{ucr.status === "ready_to_ship" && "جاهز للشحن"}
																				{!["completed", "approved", "pending", "ready_to_ship"].includes(ucr.status) && ucr.status}
																			</span>
																		</div>
																	</div>
																	<button
																		onClick={() => handleOpenChat(customer, ucr)}
																		className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
																	>
																		<img src={chatIcon} alt="Chat" className="w-5 h-5" />
																		<span>فتح المحادثة</span>
																	</button>
																</div>
															))}
														</div>
													</div>
												)}

												{/* Customer Stats */}
												<div className="bg-gray-50 p-4 border-t border-gray-200 mt-4 rounded-lg">
													<div className="grid grid-cols-3 gap-4 text-center">
														<div>
															<p className="text-2xl font-bold text-green-900">
																{[...(customer.shipments || []), ...(customer.ucrRequests || [])].filter(
																	(item) =>
																		item.status === "مكتملة" ||
																		item.status === "تمت بنجاح" ||
																		item.status === "completed"
																).length}
															</p>
															<p className="text-xs text-gray-600">مكتملة</p>
														</div>
														<div>
															<p className="text-2xl font-bold text-blue-900">
																{[...(customer.shipments || []), ...(customer.ucrRequests || [])].filter(
																	(item) =>
																		item.status === "في الطريق" ||
																		item.status === "approved" ||
																		item.status === "ready_to_ship"
																).length}
															</p>
															<p className="text-xs text-gray-600">في التنفيذ</p>
														</div>
														<div>
															<p className="text-2xl font-bold text-yellow-900">
																{[...(customer.shipments || []), ...(customer.ucrRequests || [])].filter(
																	(item) =>
																		item.status !== "مكتملة" &&
																		item.status !== "تمت بنجاح" &&
																		item.status !== "completed" &&
																		item.status !== "في الطريق" &&
																		item.status !== "approved" &&
																		item.status !== "ready_to_ship"
																).length}
															</p>
															<p className="text-xs text-gray-600">قيد المعالجة</p>
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default MyCustomers;
