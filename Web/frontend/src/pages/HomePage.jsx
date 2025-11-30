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
const TrackingHero = ({
	onSearch,
	recommendations,
	onSelectShipment,
	loading,
}) => {
	const [trackingNumber, setTrackingNumber] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);

	const handleInputChange = (e) => {
		const value = e.target.value;
		setTrackingNumber(value);
		setShowDropdown(true);
		onSearch(value, false); // false = just recommendations, not full search
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (trackingNumber.trim()) {
			setShowDropdown(false);
			// Trigger full search with modal
			onSearch(trackingNumber, true);
		}
	};

	const handleSelectShipment = (shipment) => {
		setTrackingNumber(shipment.acid || "");
		setShowDropdown(false);
		onSelectShipment(shipment);
	};

	const handleBlur = () => {
		// Delay hiding to allow click on dropdown items
		setTimeout(() => {
			setShowDropdown(false);
		}, 200);
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

					<form onSubmit={handleSubmit} className="space-y-6 relative z-20">
						<div className="relative">
							<input
								type="text"
								value={trackingNumber}
								onChange={handleInputChange}
								onFocus={() => setShowDropdown(true)}
								onBlur={handleBlur}
								placeholder="ابحث عن شحنة بالرقم، الميناء، الدولة..."
								className="w-full px-6 py-4 pr-12 rounded-full text-right text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-white/30 transition-all bg-white"
								autoComplete="off"
							/>
							<button
								type="submit"
								className="absolute left-2 top-1/2 -translate-y-1/2 bg-red-700 text-white p-3 rounded-full hover:bg-red-800 transition-colors"
							>
								<Search size={20} />
							</button>

							{/* Recommendations Dropdown */}
							{showDropdown && (recommendations.length > 0 || loading) && (
								<div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-[100]">
									{loading ? (
										<div className="p-4 text-center text-gray-600">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800 mx-auto"></div>
											<p className="mt-2">جاري البحث...</p>
										</div>
									) : (
										<div className="p-2">
											{recommendations.map((shipment) => (
												<div
													key={shipment._id}
													onClick={() => handleSelectShipment(shipment)}
													className="p-4 hover:bg-red-50 cursor-pointer rounded-lg transition-colors border-b last:border-b-0"
												>
													<div className="flex justify-between items-start">
														<div className="flex-1">
															<div className="font-bold text-gray-800 text-lg">
																{shipment.acid || "N/A"}
															</div>
															<div className="text-sm text-gray-600 mt-1">
																{shipment.port_name || "N/A"} •{" "}
																{shipment.country || "N/A"}
															</div>
															{shipment.bl_number && (
																<div className="text-xs text-gray-500 mt-1">
																	BL: {shipment.bl_number}
																</div>
															)}
														</div>
														<span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
															{shipment.status || "N/A"}
														</span>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}
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
		<div className="container mx-auto px-4 -mt-16 relative z-2" dir="rtl">
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

				// Determine endpoint based on user type
				const userType = user?.type;
				const endpoint =
					userType === "employee"
						? `${import.meta.env.VITE_API_URL}/api/shipments/employee/${userID}`
						: `${import.meta.env.VITE_API_URL}/api/shipments/user/${userID}`;

				console.log(
					"Fetching shipments for user type:",
					userType,
					"from:",
					endpoint
				);

				const response = await axios.get(endpoint, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				console.log("Fetched shipments:", response.data);

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

// Search Results Component
const SearchResults = ({ results, onClose, searchQuery }) => {
	if (!results) return null;

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
				<div className="bg-gradient-to-r from-red-900 to-red-800 p-6 flex justify-between items-center">
					<h2 className="text-white text-2xl font-bold">
						{searchQuery
							? `نتائج البحث عن: "${searchQuery}"`
							: "الشحنات الأخيرة"}
					</h2>
					<button
						onClick={onClose}
						className="text-white hover:bg-white/20 p-2 rounded-full transition"
					>
						<X size={24} />
					</button>
				</div>{" "}
				<div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]" dir="rtl">
					{results.length === 0 ? (
						<div className="text-center py-12">
							<Search size={48} className="mx-auto text-gray-400 mb-4" />
							<p className="text-gray-600 text-lg">لم يتم العثور على نتائج</p>
							<p className="text-gray-500 mt-2">
								جرب البحث برقم شحنة أو دولة أو حالة مختلفة
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{results.map((shipment) => (
								<div
									key={shipment._id}
									className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
								>
									<div className="flex justify-between items-start mb-3">
										<div>
											<h3 className="text-lg font-bold text-gray-800">
												{shipment.acid || "N/A"}
											</h3>
											<p className="text-sm text-gray-600">
												{shipment.user_id?.fullname ||
													shipment.user_id?.username ||
													"Unknown Client"}
											</p>
										</div>
										<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
											{shipment.status}
										</span>
									</div>

									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span className="text-gray-500">الميناء:</span>
											<span className="font-semibold mr-2">
												{shipment.port_name}
											</span>
										</div>
										<div>
											<span className="text-gray-500">الدولة:</span>
											<span className="font-semibold mr-2">
												{shipment.country}
											</span>
										</div>
										<div>
											<span className="text-gray-500">عدد الحاويات:</span>
											<span className="font-semibold mr-2">
												{shipment.num_of_containers}
											</span>
										</div>
										{shipment.policy && (
											<div>
												<span className="text-gray-500">البوليصة:</span>
												<span className="font-semibold mr-2">
													{shipment.policy}
												</span>
											</div>
										)}
									</div>

									<div className="mt-4 flex justify-end">
										<a
											href={`/shipmentstatus/${shipment.acid}`}
											className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition flex items-center gap-2"
										>
											<span>عرض التفاصيل</span>
											<FileText size={16} />
										</a>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// Main Tracking Page
const TrackingPage = () => {
	const [searchResults, setSearchResults] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searching, setSearching] = useState(false);
	const [recommendations, setRecommendations] = useState([]);
	const [loadingRecommendations, setLoadingRecommendations] = useState(false);

	const handleSearch = async (trackingNumber, showModal = false) => {
		const token = localStorage.getItem("token");
		if (!token) {
			return;
		}

		try {
			if (showModal) {
				setSearching(true);
			} else {
				setLoadingRecommendations(true);
			}
			setSearchQuery(trackingNumber);

			const searchParam = trackingNumber.trim()
				? `?query=${encodeURIComponent(trackingNumber)}`
				: "";
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/search${searchParam}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.success) {
				if (showModal) {
					// Show results in modal
					setSearchResults(response.data.shipments);
				} else {
					// Show as recommendations dropdown
					setRecommendations(response.data.shipments);
				}
			}
		} catch (error) {
			console.error("Search error:", error);
			if (showModal) {
				toast.error("حدث خطأ أثناء البحث");
				setSearchResults([]);
			} else {
				setRecommendations([]);
			}
		} finally {
			if (showModal) {
				setSearching(false);
			} else {
				setLoadingRecommendations(false);
			}
		}
	};

	const handleSelectShipment = (shipment) => {
		window.location.href = `/shipmentstatus/${shipment.acid}`;
	};

	const closeSearchResults = () => {
		setSearchResults(null);
		setSearchQuery("");
	};

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />
			<main className="flex-grow">
				<TrackingHero
					onSearch={handleSearch}
					recommendations={recommendations}
					onSelectShipment={handleSelectShipment}
					loading={loadingRecommendations}
				/>
				<QuickActions />
				<CurrentShipments />
			</main>
			<Footer />

			{searching && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
						<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-16 h-16 animate-spin"></div>
						<p className="text-gray-700 font-semibold">جاري البحث...</p>
					</div>
				</div>
			)}

			{searchResults && (
				<SearchResults
					results={searchResults}
					onClose={closeSearchResults}
					searchQuery={searchQuery}
				/>
			)}
		</div>
	);
};

export default TrackingPage;
