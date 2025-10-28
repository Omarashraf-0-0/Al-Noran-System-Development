import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import ACIDRequestForm from "../components/ACIDRequestForm";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ACIDRequestPage = () => {
	const navigate = useNavigate();
	const [selectedFile, setSelectedFile] = useState(null);
	const [uploadedInvoice, setUploadedInvoice] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		// Check if user is logged in
		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("يجب تسجيل الدخول أولاً");
			navigate("/login");
			return;
		}
	}, [navigate]);

	const handleFileSelect = (file) => {
		if (!file) return;

		// Validate file type
		const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("نوع الملف غير مدعوم. الرجاء رفع PDF أو صورة فقط");
			return;
		}

		// Validate file size (10MB)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت");
			return;
		}

		// Store the file for later upload
		setSelectedFile(file);
		toast.success(`تم اختيار الملف: ${file.name}`);
	};

	const uploadFileToServer = async (file) => {
		const formDataUpload = new FormData();
		formDataUpload.append("file", file);
		formDataUpload.append("category", "acidrequest");
		formDataUpload.append("userType", "client");
		formDataUpload.append("documentType", "proforma_invoice");

		const token = localStorage.getItem("token");
		const response = await axios.post(
			`${import.meta.env.VITE_API_URL}/api/uploads`,
			formDataUpload,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "multipart/form-data",
				},
				onUploadProgress: (progressEvent) => {
					const percentCompleted = Math.round(
						(progressEvent.loaded * 100) / progressEvent.total
					);
					setProgress(percentCompleted);
				},
			}
		);

		return response;
	};

	const handleDeleteUpload = () => {
		setSelectedFile(null);
		setUploadedInvoice(null);
		toast.success("تم حذف الملف");
	};

	const handleViewDocument = async () => {
		try {
			const token = localStorage.getItem("token");
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/uploads/${uploadedInvoice.id}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success && response.data.upload.url) {
				window.open(response.data.upload.url, "_blank");
			} else {
				toast.error("فشل في الحصول على رابط الملف");
			}
		} catch (error) {
			console.error("Error fetching document URL:", error);
			toast.error(error.response?.data?.message || "فشل في عرض الملف");
		}
	};

	const handleACIDRequest = async (formData) => {
		console.log("ACID Request attempt:", formData);
		console.log("API URL:", import.meta.env.VITE_API_URL);

		// Check if file is selected
		if (!selectedFile && !uploadedInvoice) {
			toast.error("يجب اختيار الفاتورة المبدئية أولاً");
			return;
		}

		try {
			// Upload file first if not already uploaded
			if (selectedFile && !uploadedInvoice) {
				setUploading(true);
				setProgress(0);
				toast.loading("جاري رفع الفاتورة المبدئية...");

				try {
					const response = await uploadFileToServer(selectedFile);

					if (response.data.success) {
						const uploadedFile = {
							id: response.data.upload.id,
							filename: response.data.upload.filename,
							url: response.data.upload.url,
							uploadedAt: response.data.upload.uploadedAt,
						};
						setUploadedInvoice(uploadedFile);
						toast.dismiss();
						toast.success(`تم رفع الفاتورة المبدئية بنجاح`);

						// Continue with ACID request
						await submitACIDRequest(formData, uploadedFile.id);
					}
				} catch (error) {
					console.error("Upload error:", error);
					toast.dismiss();
					toast.error(
						error.response?.data?.message || "فشل رفع الملف. حاول مرة أخرى"
					);
					return;
				} finally {
					setUploading(false);
				}
			} else {
				// File already uploaded, just submit the request
				await submitACIDRequest(formData, uploadedInvoice.id);
			}
		} catch (error) {
			console.error("Submit error:", error);
			toast.error(error.response?.data?.message || "فشل في إرسال الطلب");
		}
	};

	const submitACIDRequest = async (formData, uploadId) => {
		const token = localStorage.getItem("token");

		const requestData = {
			supplier: formData.supplier,
			goods: formData.goods,
			uploads: [uploadId],
		};

		console.log("Sending request data:", requestData);

		const response = await axios.post(
			`${import.meta.env.VITE_API_URL}/api/acid`,
			requestData,
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);

		if (response.data.success || response.status === 201) {
			toast.success("تم إرسال طلب الـ ACID بنجاح! ✅");
			setTimeout(() => {
				navigate("/home");
			}, 2000);
		}
	};

	return (
		<>
			<Navbar />
			<BackgroundContainer>
				<FormContainer>
				<ACIDRequestForm 
					onSubmit={handleACIDRequest}
					selectedFile={selectedFile}
					uploadedInvoice={uploadedInvoice}
					uploading={uploading}
					progress={progress}
					onFileSelect={handleFileSelect}
					onDeleteUpload={handleDeleteUpload}
					onViewDocument={handleViewDocument}
				/>
				</FormContainer>
			</BackgroundContainer>
		</>
	);
};

export default ACIDRequestPage;
