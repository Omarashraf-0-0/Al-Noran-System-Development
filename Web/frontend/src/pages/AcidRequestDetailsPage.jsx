import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import mainIllustration from "../assets/images/Untitled design (7) 1.png";
import contractIcon from "../assets/images/contract.png";
import Datafield from "../components/DataField";
import FileRow from "../components/FileRow";
import {
	FileText,
	CheckCircle,
	XCircle,
	Clock,
	Package,
	User,
	Globe,
	Phone,
	Mail,
	Weight,
	ArrowLeft,
} from "lucide-react";

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
								`${import.meta.env.VITE_API_URL}/api/upload/${uploadId}`,
								{
									headers: {
										Authorization: `Bearer ${token}`,
									},
								}
							)
						);

						const uploadResponses = await Promise.all(uploadPromises);
						const formattedFiles = uploadResponses.map((res) => ({
							name: res.data.originalname || "ملف",
							date: new Date(res.data.createdAt).toLocaleDateString("ar-EG", {
								weekday: "long",
								day: "numeric",
								month: "long",
							}),
							url: res.data.url,
						}));
						setFileItems(formattedFiles);
					} catch (uploadError) {
						console.log("Error fetching uploads:", uploadError);
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

	const getStatusBadge = () => {
		if (!requestData) return null;

		const status = requestData.status;
		let bgColor, textColor, icon, text;

		switch (status) {
			case "ACID Issued":
			case "approved":
			case "completed":
				bgColor = "bg-green-100";
				textColor = "text-green-800";
				icon = <CheckCircle className="w-5 h-5" />;
				text = "تم إصدار ACID";
				break;
			case "Rejected":
				bgColor = "bg-red-100";
				textColor = "text-red-800";
				icon = <XCircle className="w-5 h-5" />;
				text = "مرفوض";
				break;
			case "Pending":
			default:
				bgColor = "bg-yellow-100";
				textColor = "text-yellow-800";
				icon = <Clock className="w-5 h-5" />;
				text = "قيد المراجعة";
				break;
		}

		return (
			<div
				className={`${bgColor} ${textColor} px-4 py-2 rounded-full flex items-center gap-2 w-fit font-semibold`}
			>
				{icon}
				<span>{text}</span>
			</div>
		);
	};

	return (
		<div className="bg-gray-50 min-h-screen text-gray-800">
			<Header />

			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{loading ? (
					<div className="flex justify-center items-center py-20 gap-4">
						<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
						<span className="text-gray-600 text-lg">
							جاري تحميل بيانات الطلب...
						</span>
					</div>
				) : error ? (
					<div className="max-w-2xl mx-auto bg-red-50 border border-red-300 rounded-lg p-8 text-center">
						<p className="text-red-800 font-medium mb-4">❌ {error}</p>
						<button
							onClick={() => navigate("/acidrequests")}
							className="inline-block bg-red-800 text-white px-6 py-2 rounded hover:bg-red-700 transition"
						>
							العودة للطلبات
						</button>
					</div>
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
							{/* Top illustration */}
							<div className="flex justify-center mb-10">
								<img
									src={mainIllustration}
									alt="ACID Request Illustration"
									className="w-full max-w-lg h-auto"
								/>
							</div>

							{/* Status Badge and ACID Code */}
							<div className="flex justify-between items-center mb-8 flex-wrap gap-4">
								{getStatusBadge()}
								{requestData.acidCode && requestData.acidCode !== "null" && (
									<div className="text-right">
										<p className="text-sm text-gray-500">رقم ACID</p>
										<p className="text-2xl font-bold text-red-800">
											{requestData.acidCode}
										</p>
									</div>
								)}
							</div>

							{/* Request Date */}
							<div className="text-center mb-8">
								<p className="text-gray-500 text-sm">تاريخ الطلب</p>
								<p className="text-gray-700 font-semibold">
									{new Date(
										requestData.requestDate || requestData.createdAt
									).toLocaleDateString("ar-EG", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</p>
							</div>

							{/* Supplier Information Section */}
							<div className="mb-12">
								<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
									<User className="w-6 h-6" />
									<span>بيانات المورد</span>
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
									<Datafield
										label="اسم المورد"
										placeholder="اسم المورد"
										value={requestData.supplier?.name || "غير متوفر"}
										icon={<User className="w-5 h-5 text-gray-500" />}
										readOnly
									/>
									<Datafield
										label="الرقم الضريبي"
										placeholder="الرقم الضريبي"
										value={requestData.supplier?.taxNum || "غير متوفر"}
										icon={
											<img src={contractIcon} alt="icon" className="w-5 h-5" />
										}
										readOnly
									/>
									<Datafield
										label="الدولة"
										placeholder="الدولة"
										value={requestData.supplier?.country || "غير متوفر"}
										icon={<Globe className="w-5 h-5 text-gray-500" />}
										readOnly
									/>
									<Datafield
										label="البريد الإلكتروني"
										placeholder="البريد الإلكتروني"
										value={requestData.supplier?.email || "غير متوفر"}
										icon={<Mail className="w-5 h-5 text-gray-500" />}
										readOnly
									/>
									<Datafield
										label="رقم الهاتف"
										placeholder="رقم الهاتف"
										value={requestData.supplier?.mobileNum || "غير متوفر"}
										icon={<Phone className="w-5 h-5 text-gray-500" />}
										readOnly
									/>
								</div>
							</div>

							{/* Goods Information Section */}
							<div className="mb-12">
								<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
									<Package className="w-6 h-6" />
									<span>بيانات البضاعة</span>
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
									<Datafield
										label="وصف البضاعة"
										placeholder="وصف البضاعة"
										value={requestData.goods?.description || "غير متوفر"}
										icon={<FileText className="w-5 h-5 text-gray-500" />}
										readOnly
									/>
									<Datafield
										label="البند الجمركي"
										placeholder="البند الجمركي"
										value={requestData.goods?.customsItem || "غير متوفر"}
										icon={
											<img src={contractIcon} alt="icon" className="w-5 h-5" />
										}
										readOnly
									/>
									<Datafield
										label="الوزن المبدئي (كجم)"
										placeholder="الوزن"
										value={
											requestData.goods?.weight
												? `${requestData.goods.weight} كجم`
												: "غير متوفر"
										}
										icon={<Weight className="w-5 h-5 text-gray-500" />}
										readOnly
									/>
								</div>
							</div>

							{/* Uploaded Files Section */}
							<div className="mb-8">
								<h2 className="text-2xl font-bold text-center text-red-900 mb-8 flex items-center justify-center gap-2">
									<FileText className="w-6 h-6" />
									<span>المستندات المرفقة</span>
								</h2>
								{fileItems.length > 0 ? (
									<div className="space-y-4">
										{fileItems.map((item, index) => (
											<FileRow
												key={index}
												name={item.name}
												date={item.date}
												url={item.url}
											/>
										))}
									</div>
								) : (
									<div className="text-center py-8 bg-gray-50 rounded-lg">
										<FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
										<p className="text-gray-500">لا توجد مستندات مرفقة</p>
									</div>
								)}
							</div>

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
