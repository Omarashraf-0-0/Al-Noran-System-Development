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
import { FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import FileViewerModal from "../components/FileViewerModal";

const AcidRequestDetailsPage = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	const [requestData, setRequestData] = useState(null);
	const [fileItems, setFileItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [viewerData, setViewerData] = useState({ open: false, url: null, name: null, type: null });

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
								id: upload._id,
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
								type: upload.mimetype || upload.fileType, // Store type
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

	const handleViewFile = (file) => {
		setViewerData({
			open: true,
			url: file.url,
			name: file.name,
			type: file.type || (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
			fileId: file.id
		});
	};

	return (
		<div className={`min-h-screen flex flex-col transition-colors duration-300 relative overflow-hidden ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`}>
			{/* Animated Background Elements */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				{isDarkMode ? (
					<>
						<div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#690000]/20 rounded-full filter blur-[100px] animate-pulse-glow"></div>
						<div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#2b0000]/30 rounded-full filter blur-[120px] animate-float-slow"></div>
					</>
				) : (
					<>
						<div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[#ffcccc]/40 rounded-full filter blur-[100px] animate-pulse-glow"></div>
						<div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#ffe6e6]/60 rounded-full filter blur-[120px] animate-float-slow"></div>
					</>
				)}
			</div>

			<Header />

			<main className="flex-grow relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 sm:pt-28">
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
							className={`flex items-center gap-2 font-semibold mb-6 transition-colors ${
								isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-800 hover:text-red-900"
							}`}
						>
							<ArrowRight className="w-5 h-5" />
							<span>العودة للطلبات</span>
						</button>

						<div className={`p-6 sm:p-10 rounded-3xl shadow-2xl border backdrop-blur-xl transition-all duration-300 ${
							isDarkMode 
								? "bg-[#1a1010]/80 border-white/10 text-gray-200" 
								: "bg-white/90 border-white/40 text-gray-800"
						}`}>
							<AcidRequestHeader
								requestData={requestData}
								illustration={mainIllustration}
							/>

							<div className="mt-8 space-y-8">
								<SupplierInfoSection supplier={requestData.supplier} />
								<GoodsInfoSection goods={requestData.goods} />
								<DocumentsSection 
									fileItems={fileItems} 
									onViewFile={handleViewFile}
								/>
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12 pt-8 border-t border-gray-200/20">
								<button
									onClick={() => navigate("/acidrequests")}
									className={`flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
										isDarkMode
											? "bg-gray-800 hover:bg-gray-700 text-gray-200"
											: "bg-gray-100 hover:bg-gray-200 text-gray-700"
									}`}
								>
									<ArrowRight className="w-5 h-5" />
									<span>العودة للطلبات</span>
								</button>

								{requestData.status === "Pending" && (
									<button
										onClick={() => navigate(`/acidrequest/${requestId}/edit`)}
										className={`flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
											isDarkMode
												? "bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 shadow-red-900/40"
												: "bg-gradient-to-r from-[#690000] to-[#8B0000] hover:from-[#8B0000] hover:to-[#A00000] shadow-red-900/20"
										}`}
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
			
			<FileViewerModal
				isOpen={viewerData.open}
				onClose={() => setViewerData(prev => ({ ...prev, open: false }))}
				fileUrl={viewerData.url}
				fileName={viewerData.name}
				fileType={viewerData.type}
				fileId={viewerData.fileId}
			/>
		</div>
	);
};

export default AcidRequestDetailsPage;
