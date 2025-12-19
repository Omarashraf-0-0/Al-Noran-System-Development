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
	const [selectedCustomer, setSelectedCustomer] = useState(null);
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

	const handleOpenChat = async (customer, shipment) => {
		try {
			// Get or create chat for this shipment
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/chat`,
				{ shipmentId: shipment._id },
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
						<p className="text-gray-600 text-center">
							قائمة بجميع العملاء الذين لديهم شحنات مُعينة لك
						</p>
						{customers.length > 0 && (
							<p className="text-center mt-2 text-sm text-gray-500">
								إجمالي العملاء: <span className="font-bold text-red-900">{customers.length}</span>
							</p>
						)}
					</div>

					{/* Customers List */}
					{customers.length === 0 ? (
						<div className="bg-white rounded-xl shadow-lg p-12 text-center">
							<div className="text-6xl mb-4">📭</div>
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								لا يوجد عملاء حالياً
							</h3>
							<p className="text-gray-600">
								لم يتم تعيين أي شحنات لك بعد. سيظهر العملاء هنا عند تعيين شحنات.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6">
							{customers.map((customer) => (
								<div
									key={customer._id}
									className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
								>
									{/* Customer Header */}
									<div className="bg-gradient-to-r from-red-900 to-red-700 p-4">
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
												<p className="text-sm text-red-100">عدد الشحنات</p>
												<p className="text-2xl font-bold">
													{customer.shipments.length}
												</p>
											</div>
										</div>
									</div>

									{/* Shipments List */}
									<div className="p-4">
										<h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
											<span>📦</span>
											<span>الشحنات المُعينة</span>
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
																	shipment.status === "مكتملة" || shipment.status === "تمت بنجاح"
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

									{/* Customer Stats */}
									<div className="bg-gray-50 p-4 border-t border-gray-200">
										<div className="grid grid-cols-3 gap-4 text-center">
											<div>
												<p className="text-2xl font-bold text-red-900">
													{customer.shipments.filter((s) => s.status === "مكتملة" || s.status === "تمت بنجاح").length}
												</p>
												<p className="text-xs text-gray-600">مكتملة</p>
											</div>
											<div>
												<p className="text-2xl font-bold text-blue-900">
													{customer.shipments.filter((s) => s.status === "في الطريق").length}
												</p>
												<p className="text-xs text-gray-600">في الطريق</p>
											</div>
											<div>
												<p className="text-2xl font-bold text-yellow-900">
													{
														customer.shipments.filter(
															(s) => s.status !== "مكتملة" && s.status !== "تمت بنجاح" && s.status !== "في الطريق"
														).length
													}
												</p>
												<p className="text-xs text-gray-600">قيد المعالجة</p>
											</div>
										</div>
									</div>
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
