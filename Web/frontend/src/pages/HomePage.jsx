import React, { useState, useEffect } from "react";
import {
	Search,
	MessageCircle,
	Plane,
	Ship,
	FileText,
	MapPin,
	Phone,
	Facebook,
	Twitter,
	Instagram,
	Globe,
	Menu,
	X,
	User,
	Bell,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

import Footer from "../components/Footer";
import Header from "../components/Header";
// Tracking Hero Component
const TrackingHero = ({ onSearch }) => {
	const [trackingNumber, setTrackingNumber] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		if (trackingNumber.trim()) {
			onSearch(trackingNumber);
		}
	};

	return (
		<div
			className="relative h-[450px] flex items-center justify-center bg-cover bg-center"
			style={{
				backgroundImage:
					'linear-gradient(to right, rgba(13, 110, 113, 0.7), rgba(30, 58, 138, 0.7)), url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920")',
			}}
		>
			<div className="relative z-10 w-full max-w-3xl px-4" dir="rtl">
				<div className="bg-gradient-to-br from-red-900/90 to-red-800/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl">
					<h1 className="text-white text-3xl md:text-4xl font-bold text-center mb-8">
						تتبع شحنتي
					</h1>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="relative">
							<input
								type="text"
								value={trackingNumber}
								onChange={(e) => setTrackingNumber(e.target.value)}
								placeholder="ادخل رقم الشحنة"
								className="w-full px-6 py-4 pr-12 rounded-full text-right text-gray-700 text-lg focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
							/>
							<button
								type="submit"
								className="absolute left-2 top-1/2 -translate-y-1/2 bg-red-700 text-white p-3 rounded-full hover:bg-red-800 transition-colors"
							>
								<Search size={20} />
							</button>
						</div>

						<button
							type="submit"
							className="w-full max-w-xs mx-auto block bg-white text-red-900 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
						>
							تتبع
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

// Quick Actions Component
const QuickActions = () => {
	const actions = [
		{
			id: 1,
			title: "تواصل معنا",
			icon: MessageCircle,
			bgColor: "bg-cyan-100",
			iconColor: "text-cyan-600",
			link: "/contact",
		},
		{
			id: 2,
			title: "ادراج شهادة جوية",
			icon: Plane,
			bgColor: "bg-red-100",
			iconColor: "text-red-800",
			link: "/air-certificate",
		},
		{
			id: 3,
			title: "ادراج شهادة بحرية",
			icon: Ship,
			bgColor: "bg-cyan-100",
			iconColor: "text-cyan-600",
			link: "/sea-certificate",
		},
		{
			id: 4,
			title: "طلب رقم ACID",
			icon: FileText,
			bgColor: "bg-red-100",
			iconColor: "text-red-800",
			link: "/acidrequest",
		},
	];

	return (
		<div className="container mx-auto px-4 -mt-16 relative z-20" dir="rtl">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{actions.map((action) => {
					const Icon = action.icon;
					return (
						<a
							key={action.id}
							href={action.link}
							className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 p-6 flex items-center space-x-reverse space-x-4 group"
						>
							<div
								className={`${action.bgColor} p-4 rounded-full group-hover:scale-110 transition-transform`}
							>
								<Icon className={`${action.iconColor} w-6 h-6`} />
							</div>
							<span className="text-gray-800 font-semibold text-lg">
								{action.title}
							</span>
						</a>
					);
				})}
			</div>
		</div>
	);
};

// Current Shipments Component
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

				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/shipments/employee/${userID}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				console.log("Fetched shipments:", response.data);

				const formattedShipments = (response.data || []).map((shipment) => ({
					id: shipment._id,
					clientName: shipment.employerName || "Unknown Client",
					shipmentNo: shipment.number46 || shipment.shipmentNumber || "N/A",
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
					<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
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

// Main Tracking Page
const TrackingPage = () => {
	const handleSearch = (trackingNumber) => {
		console.log("Searching for:", trackingNumber);
		// Add your search logic here
	};

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />
			<main className="flex-grow">
				<TrackingHero onSearch={handleSearch} />
				<QuickActions />
				<CurrentShipments />
			</main>
			<Footer />
		</div>
	);
};

export default TrackingPage;
