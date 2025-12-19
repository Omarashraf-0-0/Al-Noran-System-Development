import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AcidRequestHeader from "../components/AcidRequestHeader";
import SupplierInfoSection from "../components/SupplierInfoSection";
import GoodsInfoSection from "../components/GoodsInfoSection";
import DocumentsSection from "../components/DocumentsSection";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";
import { FileText, ArrowLeft } from "lucide-react";

const AcidRequestDetailsPage = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const [requestData, setRequestData] = useState(null);
	const [fileItems, setFileItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const token = localStorage.getItem("token");

	useEffect(() => {
		const fetchRequestData = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!requestId) {
					setError("رقم الطلب غير موجود");
					return;
				}

				// Fetch ACID request by ID
				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/acid/${requestId}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				console.log("Fetched ACID request data:", response.data);
				setRequestData(response.data);

				// Fetch related uploads if available
				if (response.data.uploads && response.data.uploads.length > 0) {
					try {
						const uploadPromises = response.data.uploads.map((uploadId) =>
							axios.get(
								`${import.meta.env.VITE_API_URL}/api/uploads/${uploadId}`,
								{
									headers: {
										Authorization: `Bearer ${token}`,
									},
								}
							)
						);

						const uploadResponses = await Promise.all(uploadPromises);
						const formattedFiles = uploadResponses.map((res) => {
							// Handle both nested (res.data.upload) and flat (res.data) response structures
							const upload = res.data.upload || res.data;
							return {
								name: upload.filename || upload.originalname || "ملف",
								date: new Date(
									upload.createdAt || upload.uploadedAt
								).toLocaleDateString("ar-EG", {
									weekday: "long",
									day: "numeric",
									month: "long",
								}),
								// Try presignedUrl first (new structure), then fallback to other URLs
								url: upload.presignedUrl || upload.url || upload.s3Url,
							};
						});
						setFileItems(formattedFiles);
					} catch (uploadError) {
						console.log("Error fetching uploads:", uploadError);
						console.error("Upload error details:", uploadError.response?.data);
					}
				}
			} catch (error) {
				console.error("Error fetching ACID request:", error);
				const errorMessage =
					error.response?.data?.message ||
					error.message ||
					"فشل في تحميل بيانات الطلب";
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		if (requestId && token) {
			fetchRequestData();
		} else {
			setLoading(false);
			setError("الرجاء تسجيل الدخول");
		}
	}, [requestId, token]);

	return (
		<div className="bg-gray-50 min-h-screen text-gray-800">
			<Header />

			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{loading ? (
					<LoadingSpinner message="جاري تحميل بيانات الطلب..." />
				) : error ? (
					<ErrorMessage
						error={error}
						onRetry={() => navigate("/acidrequests")}
						retryButtonText="العودة للطلبات"
					/>
				) : requestData ? (
					<div className="max-w-5xl mx-auto">
						{/* Back Button */}
						<button
							onClick={() => navigate("/acidrequests")}
							className="flex items-center gap-2 text-red-800 hover:text-red-900 font-semibold mb-6 transition"
						>
							<ArrowLeft className="w-5 h-5" />
							<span>العودة للطلبات</span>
						</button>

						<div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm">
							<AcidRequestHeader
								requestData={requestData}
								illustration={mainIllustration}
							/>

							<SupplierInfoSection supplier={requestData.supplier} />

							<GoodsInfoSection goods={requestData.goods} />

							<DocumentsSection fileItems={fileItems} />

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
								<button
									onClick={() => navigate("/acidrequests")}
									className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all transform hover:scale-105"
								>
									<ArrowLeft className="w-5 h-5" />
									<span>العودة للطلبات</span>
								</button>

								{requestData.status === "Pending" && (
									<button
										onClick={() => navigate(`/acidrequest/${requestId}/edit`)}
										className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-900 text-white font-bold rounded-lg shadow-md hover:bg-red-800 transition-all transform hover:scale-105"
									>
										<FileText className="w-5 h-5" />
										<span>تعديل الطلب</span>
									</button>
								)}
							</div>
						</div>
					</div>
				) : null}
			</main>

			<Footer />
		</div>
	);
};

export default AcidRequestDetailsPage;
