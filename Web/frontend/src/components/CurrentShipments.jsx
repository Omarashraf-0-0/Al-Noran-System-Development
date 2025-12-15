import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileText } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const CurrentShipments = () => {
	const [shipments, setShipments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const user = JSON.parse(localStorage.getItem("user"));
	const userID = user?.id;
	const token = localStorage.getItem("token");

	useEffect(() => {
		const fetchShipments = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!userID) {
					setError("User ID not found. Please login again.");
					setLoading(false);
					return;
				}

				// Determine endpoint based on user type
				const userType = user?.type;
				const endpoint =
					userType === "employee"
						? `${import.meta.env.VITE_API_URL}/api/shipments/employee/${userID}`
						: `${import.meta.env.VITE_API_URL}/api/shipments/user/${userID}`;

				const response = await axios.get(endpoint, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				const formattedShipments = (response.data || []).map((shipment) => ({
					id: shipment._id,
					clientName: shipment.employee_name || "Unknown Client",
					shipmentNo: shipment.number46 || shipment.acid || "N/A",
					status: shipment.status || "pending",
					acid: shipment.acid,
					date: new Date(shipment.createdAt).toLocaleDateString("ar-EG", {
						day: "numeric",
						month: "long",
						year: "numeric",
					}),
				}));

				// Limit to 3 shipments for homepage
				setShipments(formattedShipments.slice(0, 3));
			} catch (error) {
				console.error("Error fetching shipments:", error);
				const errorMessage =
					error.response?.data?.message ||
					error.message ||
					"Failed to fetch shipments";
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		if (userID) {
			fetchShipments();
		} else {
			setLoading(false);
		}
	}, [userID, token]);

	return (
		<div className="container mx-auto px-4 py-16" dir="rtl">
			<div className="flex justify-between items-center mb-8">
				<h2 className="text-3xl font-bold text-gray-800">الشحنات الحالية</h2>
				<a
					href="/client-shipments"
					className="text-red-800 hover:text-red-900 font-semibold flex items-center space-x-reverse space-x-2 group"
				>
					<span>رؤية الكل</span>
					<span className="group-hover:translate-x-1 transition-transform">
						←
					</span>
				</a>
			</div>

			{loading ? (
				<div className="flex justify-center items-center py-12 gap-4">
					<LoadingSpinner />
					<span className="text-gray-600 text-lg">جاري تحميل الشحنات...</span>
				</div>
			) : error ? (
				<div className="bg-red-50 border border-red-300 rounded-lg p-6 text-center">
					<p className="text-red-800 font-medium mb-3">❌ {error}</p>
					<a
						href="/login"
						className="inline-block bg-red-800 text-white px-6 py-2 rounded hover:bg-red-700 transition"
					>
						تسجيل الدخول
					</a>
				</div>
			) : shipments.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 rounded-lg">
					<p className="text-gray-500 text-lg mb-4">لا توجد شحنات حالياً</p>
					<a
						href="/acidrequest"
						className="inline-block bg-red-800 text-white px-6 py-2 rounded hover:bg-red-700 transition"
					>
						إضافة شحنة جديدة
					</a>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-right border-separate border-spacing-y-3">
						<tbody>
							{shipments.map((shipment) => (
								<tr
									key={shipment.id}
									className="bg-gray-100 hover:bg-gray-200 rounded-xl transition text-right"
								>
									<td className="py-4 px-6 align-top rounded-r-xl">
										<div className="flex flex-col text-sm">
											<span className="text-gray-700 text-base font-semibold">
												{shipment.clientName}
											</span>
											<span className="text-gray-500 text-xs">
												{shipment.date}
											</span>
										</div>
									</td>

									<td className="py-4 px-6 align-top">
										<div className="flex flex-col text-sm">
											<span className="font-semibold text-gray-800">
												{shipment.shipmentNo}
											</span>
										</div>
									</td>

									<td className="py-4 px-6 align-top">
										<span
											className="bg-blue-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center justify-center gap-2 w-fit"
											style={{ color: "#690000" }}
										>
											<FileText size={16} />
											{shipment.status}
										</span>
									</td>

									<td className="py-4 px-6 align-top rounded-l-xl">
										<a href={`/shipmentstatus/${shipment.acid}`}>
											<span className="text-blue-600 text-sm font-medium underline cursor-pointer hover:text-blue-700">
												عرض كل التفاصيل
											</span>
										</a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};
export default CurrentShipments;
