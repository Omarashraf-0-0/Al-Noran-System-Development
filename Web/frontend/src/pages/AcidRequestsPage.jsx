import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WelcomeBanner from "./WelcomeBanner";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import SearchAndFilters from "../components/SearchAndFilters";
import RequestsTable from "../components/RequestsTable";
import RequestsEmptyState from "../components/RequestsEmptyState";
import { Clock, CheckCircle, XCircle } from "lucide-react";

const AcidRequestsPage = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [acidRequests, setAcidRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	// TODO: RBAC - Get user role and permissions from context/store
	// Example: const { user, hasPermission } = useAuth();
	// const canCreateRequest = hasPermission('acid:create');
	// const canViewAllRequests = hasPermission('acid:viewAll');
	const user = JSON.parse(localStorage.getItem("user"));
	const token = localStorage.getItem("token");

	useEffect(() => {
		const fetchAcidRequests = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!token) {
					setError("الرجاء تسجيل الدخول");
					toast.error("الرجاء تسجيل الدخول");
					navigate("/login");
					return;
				}

				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/acid`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				console.log("Fetched ACID requests:", response.data);

				const formattedRequests = (response.data || []).map((request) => ({
					id: request._id,
					acidCode: request.acidCode || "قيد المعالجة",
					supplierName: request.supplier?.name || "غير محدد",
					customsItem: request.goods?.customsItem || "غير محدد",
					weight: request.goods?.weight || 0,
					status: request.status || "pending",
					requestDate: new Date(
						request.requestDate || request.createdAt
					).toLocaleDateString("ar-EG", {
						day: "numeric",
						month: "long",
						year: "numeric",
					}),
					createdAt: request.createdAt,
					hasShipment: request.hasShipment || false,
					shipmentId: request.shipmentId?._id || request.shipmentId,
					shipmentCreatedAt: request.shipmentCreatedAt,
				}));

				setAcidRequests(formattedRequests);

				if (formattedRequests.length === 0) {
					toast("لا توجد طلبات ACID");
				}
			} catch (error) {
				console.error("Error fetching ACID requests:", error);
				const errorMessage =
					error.response?.data?.message ||
					error.message ||
					"فشل في تحميل طلبات ACID";
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchAcidRequests();
	}, [token, navigate]);

	const getStatusIcon = (status) => {
		switch (status) {
			case "approved":
			case "completed":
				return <CheckCircle className="w-4 h-4 text-green-600" />;
			case "rejected":
				return <XCircle className="w-4 h-4 text-red-600" />;
			case "pending":
				return <Clock className="w-4 h-4 text-yellow-600" />;
			default:
				return <Clock className="w-4 h-4 text-gray-600" />;
		}
	};
	const getStatusText = (status) => {
		switch (status) {
			case "ACID Issued":
				return "تم إصدار ACID";
			case "Under Review":
				return "قيد المراجعة";
			case "Rejected":
				return "مرفوض";
			case "Pending":
				return "قيد الانتظار";
			default:
				return status || "غير محدد";
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "ACID Issued":
				return "bg-green-100";
			case "Rejected":
				return "bg-red-100";
			case "Under Review":
				return "bg-blue-100";
			case "Pending":
				return "bg-yellow-100";
			default:
				return "bg-gray-100";
		}
	};

	const filteredRequests = acidRequests.filter(
		(request) =>
			request.acidCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
			<Header />
			<WelcomeBanner />

			<section className="flex-grow w-full bg-white py-12 px-8 shadow-inner relative">
				<div className="max-w-6xl mx-auto">
					<h1 className="text-3xl font-bold text-right text-red-800 mb-8">
						طلبات ACID
					</h1>

					{/* Search + Filter + Sort */}
					<SearchAndFilters
						searchTerm={searchTerm}
						onSearchChange={(e) => setSearchTerm(e.target.value)}
						placeholder="ابحث برقم ACID أو اسم المورد"
					/>

					{/* ACID Requests Table - TODO: RBAC filter based on user permissions */}
					{loading ? (
						<LoadingSpinner message="جاري تحميل الطلبات..." />
					) : error ? (
						<ErrorMessage
							error={error}
							onRetry={() => window.location.reload()}
							retryButtonText="إعادة محاولة"
						/>
					) : filteredRequests.length === 0 ? (
						<RequestsEmptyState
							onAddNew={() => navigate("/acidrequest")}
							message="لا توجد طلبات ACID"
							buttonText="إضافة طلب جديد"
						/>
					) : (
						<RequestsTable
							requests={filteredRequests}
							getStatusIcon={getStatusIcon}
							getStatusText={getStatusText}
							getStatusColor={getStatusColor}
						/>
					)}

					{/* Add New Request Button */}
					{/* TODO: RBAC - Only show if user has permission to create ACID requests */}
					{/* Example: {canCreateRequest && !loading && !error && filteredRequests.length > 0 && ( */}
					{!loading && !error && filteredRequests.length > 0 && (
						<div className="flex justify-center mt-8">
							<button
								onClick={() => navigate("/acidrequest")}
								className="bg-red-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
							>
								إضافة طلب ACID جديد
							</button>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
};

export default AcidRequestsPage;
