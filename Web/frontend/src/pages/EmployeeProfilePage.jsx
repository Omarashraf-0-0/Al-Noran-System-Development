import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";

const EmployeeProfilePage = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		fullname: "",
		username: "",
		phone: "",
		email: "",
	});
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [showPasswords, setShowPasswords] = useState({
		currentPassword: false,
		newPassword: false,
		confirmPassword: false,
	});
	const [profilePhoto, setProfilePhoto] = useState(null);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [loadingPhoto, setLoadingPhoto] = useState(true);
	const [deletingPhoto, setDeletingPhoto] = useState(false);
	const [showCropModal, setShowCropModal] = useState(false);
	const [selectedImage, setSelectedImage] = useState(null);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [originalFormData, setOriginalFormData] = useState({
		fullname: "",
		username: "",
		phone: "",
		email: "",
	});
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

	// const handleDeletePhoto = () => {
	// 	if (!profilePhoto) return;
	// 	setShowDeleteConfirmModal(true);
	// };

	// Use Global Theme Context
	const { isDarkMode, toggleTheme } = useTheme();

	// Theme classes - PREMIUM TURQUOISE EMPLOYEE DESIGN
	const theme = {
		pageBg: isDarkMode 
			? "bg-[#050f14]" // Very dark cyan/black tint
			: "bg-[#F0FEFF]", // Cool minty white
		headerBg: isDarkMode
			? "bg-gradient-to-r from-[#1ba3b6] to-[#0e5c66]" // Dark Turquoise Gradient
			: "bg-gradient-to-r from-[#22d3eb] to-[#1ba3b6]", // Bright Turquoise Gradient
		card: isDarkMode 
			? "bg-[#0a1a1f] border-[#163a42]" 
			: "bg-white border-cyan-50 shadow-sm",
		textPrimary: isDarkMode ? "text-cyan-50" : "text-gray-900",
		textSecondary: isDarkMode ? "text-cyan-200/60" : "text-gray-500",
		input: isDarkMode 
			? "bg-[#102a30] border-[#1b434d] text-cyan-50 focus:border-cyan-500" 
			: "bg-cyan-50/50 border-cyan-200/50 text-gray-900 focus:border-cyan-500",
		buttonPrimary: "bg-gradient-to-r from-[#1ba3b6] to-[#158A9A] text-white hover:shadow-lg hover:shadow-cyan-500/30",
		buttonSecondary: isDarkMode 
			? "bg-[#102a30] text-cyan-200 hover:bg-[#163a42]" 
			: "bg-white text-cyan-700 hover:bg-cyan-50 border border-cyan-200",
		iconBg: isDarkMode ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-600",
		modalOverlay: isDarkMode ? "bg-black/80" : "bg-black/50",
	};

	useEffect(() => {
		fetchUserProfile();
	}, []);

	// Block navigation if there are unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e) => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [hasUnsavedChanges]);

	const fetchUserProfile = async () => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				navigate("/login");
				return;
			}

			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/users/profile`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			console.log("👤 User profile data:", response.data.user);
			console.log("📸 Profile photo from DB:", response.data.user.profilePhoto);

			setUser(response.data.user);
			const userData = {
				fullname: response.data.user.fullname || "",
				username: response.data.user.username || "",
				phone: response.data.user.phone || "",
				email: response.data.user.email || "",
			};
			setFormData(userData);
			setOriginalFormData(userData);
			setHasUnsavedChanges(false);

			if (response.data.user.profilePhoto) {
				const photoKey = response.data.user.profilePhoto;
				console.log("📸 Profile photo key:", photoKey);

				// If it's an S3 key, get presigned URL
				if (photoKey && !photoKey.startsWith("http")) {
					console.log("🔑 Getting presigned URL for S3 key...");
					try {
						const photoResponse = await axios.get(
							`${
								import.meta.env.VITE_API_URL
							}/api/uploads/presigned-url/${encodeURIComponent(photoKey)}`,
							{
								headers: { Authorization: `Bearer ${token}` },
							}
						);
						console.log("✅ Got presigned URL:", photoResponse.data.url);
						setProfilePhoto(photoResponse.data.url);
					} catch {
						setProfilePhoto(null);
					}
				} else {
					console.log("🌐 Using direct URL");
					setProfilePhoto(photoKey);
				}
			} else {
				console.log("❌ No profile photo in user data");
			}
			setLoadingPhoto(false);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching profile:", error);
			toast.error("فشل تحميل البيانات");
			if (error.response?.status === 401) {
				navigate("/login");
			}
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		const newFormData = {
			...formData,
			[name]: value,
		};
		setFormData(newFormData);

		// Check if form has changed from original
		const hasChanges = Object.keys(newFormData).some(
			(key) => newFormData[key] !== originalFormData[key]
		);
		setHasUnsavedChanges(hasChanges);
	};

	const handlePasswordChange = (e) => {
		const { name, value } = e.target;
		setPasswordData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSave = async () => {
		if (
			!formData.fullname ||
			!formData.username ||
			!formData.phone ||
			!formData.email
		) {
			toast.error("جميع الحقول مطلوبة");
			return;
		}

		try {
			const token = localStorage.getItem("token");
			const response = await axios.put(
				`${import.meta.env.VITE_API_URL}/api/users/profile`,
				formData,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("تم تحديث البيانات بنجاح");
				setIsEditing(false);
				setOriginalFormData(formData);
				setHasUnsavedChanges(false);
				fetchUserProfile();
			}
		} catch (error) {
			console.error("Error updating profile:", error);
			if (error.response?.data?.message) {
				toast.error(error.response.data.message);
			} else {
				toast.error("فشل تحديث البيانات");
			}
		}
	};

	const handleChangePasswordSubmit = async () => {
		if (
			!passwordData.currentPassword ||
			!passwordData.newPassword ||
			!passwordData.confirmPassword
		) {
			toast.error("جميع حقول كلمة المرور مطلوبة");
			return;
		}

		if (passwordData.newPassword.length < 6) {
			toast.error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
			return;
		}

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error("كلمات المرور غير متطابقة");
			return;
		}

		try {
			const token = localStorage.getItem("token");
			const response = await axios.put(
				`${import.meta.env.VITE_API_URL}/api/users/change-password`,
				{
					currentPassword: passwordData.currentPassword,
					newPassword: passwordData.newPassword,
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.data.success) {
				toast.success("تم تغيير كلمة المرور بنجاح");
				setShowPasswordModal(false);
				setPasswordData({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
				setShowPasswords({
					currentPassword: false,
					newPassword: false,
					confirmPassword: false,
				});
			}
		} catch (error) {
			console.error("Error changing password:", error);
			if (error.response?.data?.message) {
				toast.error(error.response.data.message);
			} else {
				toast.error("فشل تغيير كلمة المرور");
			}
		}
	};

	const handlePhotoUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("نوع الملف غير مدعوم. الرجاء رفع صورة فقط");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error("حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت");
			return;
		}

		// Show crop modal
		const reader = new FileReader();
		reader.onload = (e) => {
			setSelectedImage(e.target.result);
			setCrop({ x: 0, y: 0 });
			setZoom(1);
			setShowCropModal(true);
		};
		reader.readAsDataURL(file);
	};

	const onCropComplete = (croppedArea, croppedAreaPixels) => {
		setCroppedAreaPixels(croppedAreaPixels);
	};

	const createImage = (url) =>
		new Promise((resolve, reject) => {
			const image = new Image();
			image.addEventListener("load", () => resolve(image));
			image.addEventListener("error", (error) => reject(error));
			image.src = url;
		});

	const getCroppedImg = async (imageSrc, pixelCrop) => {
		const image = await createImage(imageSrc);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		const size = 500;
		canvas.width = size;
		canvas.height = size;

		ctx.drawImage(
			image,
			pixelCrop.x,
			pixelCrop.y,
			pixelCrop.width,
			pixelCrop.height,
			0,
			0,
			size,
			size
		);

		return new Promise((resolve) => {
			canvas.toBlob(
				(blob) => {
					resolve(blob);
				},
				"image/jpeg",
				0.95
			);
		});
	};

	const handleCropConfirm = async () => {
		if (!selectedImage || !croppedAreaPixels) return;
		
		setUploadingPhoto(true);
		setShowCropModal(false);

		try {
			const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
			const formDataUpload = new FormData();
			formDataUpload.append("file", croppedBlob, "profile-photo.jpg");
			formDataUpload.append("category", "registration");
			formDataUpload.append("documentType", "profilePhoto");
			
			const token = localStorage.getItem("token");
			
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/uploads`,
				formDataUpload,
				{ headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
			);

			const photoIdentifier = response.data.upload?.s3Key || response.data.file?.url || response.data.file?.filename || response.data.upload?.url;
			
			if (photoIdentifier) {
				await axios.put(
					`${import.meta.env.VITE_API_URL}/api/users/profile`,
					{
						profilePhoto: s3Key,
						fullname: user.fullname,
						username: user.username,
						phone: user.phone,
						email: user.email,
					},
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				const displayUrl = response.data.upload?.url || response.data.file?.url || (photoIdentifier.startsWith("http") ? photoIdentifier : null);
				
				if (displayUrl) {
					setProfilePhoto(displayUrl.startsWith("/uploads") ? `${import.meta.env.VITE_API_URL}${displayUrl}` : displayUrl);
				} else {
					fetchUserProfile();
				}
				toast.success("تم تحميل الصورة بنجاح");
			} else {
				toast.error("فشل الحصول على رابط الصورة");
			}
		} catch (error) {
			console.error("Photo upload error:", error);
			toast.error(error.response?.data?.message || "فشل تحميل الصورة");
		} finally {
			setUploadingPhoto(false);
		}
	};

	const handleDeletePhoto = async () => {
		if (!profilePhoto) return;

		if (!window.confirm("هل أنت متأكد من حذف الصورة الشخصية؟")) {
			return;
		}

		setDeletingPhoto(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(
				`${import.meta.env.VITE_API_URL}/api/users/profile`,
				{
					profilePhoto: null,
					fullname: user.fullname,
					username: user.username,
					phone: user.phone,
					email: user.email,
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			setProfilePhoto(null);
			setUser((prev) => ({ ...prev, profilePhoto: null }));
			toast.success("تم حذف الصورة بنجاح");
		} catch (error) {
			console.error("Error deleting photo:", error);
			toast.error("فشل حذف الصورة");
		} finally {
			setDeletingPhoto(false);
		}
	};

	const getEmployeeType = () => {
		const type = user?.employeeDetails?.employeeType || "موظف";
		return { label: type, icon: "👔", color: "bg-[#1ba3b6]" };
	};

	if (loading) {
		return (
			<div className={`min-h-screen ${theme.pageBg} flex items-center justify-center`}>
				<div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1ba3b6] border-t-transparent"></div>
			</div>
		);
	}

	return (
		<div className={`min-h-screen ${theme.pageBg} relative overflow-hidden transition-colors duration-300 font-sans`} dir="rtl">
			<style>{`
				@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
				@keyframes float-reverse { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(20px); } }
				@keyframes float-slow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
				@keyframes pulse-glow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }
				.animate-float { animation: float 6s ease-in-out infinite; }
				.animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
				.animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
				.animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
			`}</style>

			{/* Animated Backgrounds */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				{isDarkMode ? (
					<>
						<div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-[#1ba3b6]/10 rounded-full filter blur-[150px] animate-pulse-glow"></div>
						<div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#158A9A]/10 rounded-full filter blur-[180px] animate-float-slow"></div>
						<div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-[#22d3eb]/10 rounded-full filter blur-[120px] animate-float-reverse"></div>
						<div className="absolute top-[10%] right-[10%] w-20 h-20 border-2 border-[#1ba3b6]/20 rounded-xl animate-float rotate-45"></div>
						<div className="absolute bottom-[20%] left-[8%] w-16 h-16 border-2 border-[#158A9A]/20 rounded-full animate-float-reverse"></div>
					</>
				) : (
					<>
						<div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-[#1ba3b6]/5 rounded-full filter blur-[150px] animate-pulse-glow"></div>
						<div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#22d3eb]/10 rounded-full filter blur-[180px] animate-float-slow"></div>
						<div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-[#1ba3b6]/5 rounded-full filter blur-[120px] animate-float-reverse"></div>
						<div className="absolute top-[10%] right-[10%] w-20 h-20 border-2 border-[#1ba3b6]/20 rounded-xl animate-float rotate-45"></div>
						<div className="absolute bottom-[20%] left-[8%] w-16 h-16 border-2 border-[#158A9A]/20 rounded-full animate-float-reverse"></div>
					</>
				)}
			</div>

			<Header />

			{/* Main Content Wrapper */}
			<main className="relative pt-28 pb-12 px-4 md:px-6 max-w-7xl mx-auto space-y-8">
				
				{/* 1. Profile Header Section */}
				<div className={`relative overflow-hidden rounded-3xl ${theme.card} border transition-all duration-300`}>
					{/* Decorative Cover Background */}
					<div className={`h-32 md:h-48 w-full ${theme.headerBg} relative`}>
						<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
						<div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
						<div className="absolute top-10 right-10 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
					</div>

					<div className="px-6 md:px-10 pb-8">
						<div className="flex flex-col md:flex-row gap-6 mt-[-3rem] md:mt-[-4rem] items-center md:items-end">
							
							{/* Profile Avatar */}
							<div className="relative group">
								<div className={`w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 ${theme.card} shadow-2xl`}>
									<div className="w-full h-full rounded-full overflow-hidden relative bg-gray-100">
										{loadingPhoto || uploadingPhoto ? (
											<div className="w-full h-full flex items-center justify-center bg-gray-100">
												<div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1ba3b6] border-t-transparent"></div>
											</div>
										) : profilePhoto ? (
											<img src={profilePhoto} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
										) : (
											<div className={`w-full h-full flex items-center justify-center ${theme.headerBg} text-white`}>
												<span className="text-4xl">👤</span>
											</div>
										)}
										
										{/* Hover Overlay */}
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
											<label htmlFor="photo-upload" className="cursor-pointer p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm text-white transition-all">
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
											</label>
											{profilePhoto && (
												<button onClick={handleDeletePhoto} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-all">
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
												</button>
											)}
										</div>
									</div>
								</div>
								<input id="photo-upload" type="file" accept="image/jpeg,image/jpg,image/png" onChange={handlePhotoUpload} className="hidden" />
							</div>

							{/* User Info Text */}
							<div className="flex-1 text-center md:text-right mb-2">
								<h1 className={`text-3xl font-bold ${theme.textPrimary} mb-1 flex items-center justify-center md:justify-start gap-3`}>
									{user?.fullname}
									<span className={`px-3 py-1 text-sm rounded-full ${getEmployeeType().color} text-white shadow-sm flex items-center gap-1`}>
										{getEmployeeType().icon} {getEmployeeType().label}
									</span>
								</h1>
								<div className={`flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm ${theme.textSecondary}`}>
									<span className="flex items-center gap-1">@ {user?.username}</span>
									<span className="hidden md:inline">•</span>
									<span className="flex items-center gap-1">{user?.email}</span>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex items-center gap-3">
								<button 
									onClick={toggleTheme}
									className={`p-3 rounded-full transition-all ${isDarkMode ? "bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
								>
									{isDarkMode ? "☀️" : "🌙"}
								</button>
								{isEditing ? (
									<>
										<button onClick={handleSave} className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${theme.buttonPrimary}`}>
											حفظ
										</button>
										<button onClick={() => { setIsEditing(false); setFormData(originalFormData); }} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${theme.buttonSecondary}`}>
											إلغاء
										</button>
									</>
								) : (
									<button onClick={() => setIsEditing(true)} className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 ${theme.buttonPrimary}`}>
										تعديل البيانات
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* 2. Employee Quick Stats */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{[
						{ label: "أعمالي", value: "لوحة التحكم", icon: "📊", color: "text-blue-500", link: "/employeedashboard" },
						{ label: "المهام", value: "عرض", icon: "📝", color: "text-[#690000]", link: "#" },
						{ label: "الشحنات", value: "إدارة", icon: "📦", color: "text-[#1ba3b6]", link: "/employee-shipments" },
						{ label: "الجدول", value: "الوقت", icon: "📅", color: "text-amber-500", link: "#" },
					].map((stat, idx) => (
						<Link key={idx} to={stat.link} className={`p-5 rounded-2xl ${theme.card} border hover:-translate-y-1 transition-transform duration-300 group`}>
							<div className="flex justify-between items-start">
								<div>
									<p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>{stat.label}</p>
									<p className={`text-xl font-bold ${theme.textPrimary}`}>{stat.value}</p>
								</div>
								<div className={`p-3 rounded-xl bg-gray-50/5 group-hover:bg-white/10 transition-colors shadow-sm ${stat.color} text-xl border border-current opacity-80`}>
									{stat.icon}
								</div>
							</div>
						</Link>
					))}
				</div>

				<div className="grid lg:grid-cols-3 gap-8">
					{/* 3. Personal Info Form */}
					<div className={`lg:col-span-2 rounded-3xl ${theme.card} border p-6 md:p-8`}>
						<div className="flex items-center gap-3 mb-8">
							<div className={`p-2.5 rounded-xl ${theme.iconBg}`}>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
							</div>
							<h2 className={`text-xl font-bold ${theme.textPrimary}`}>البيانات الشخصية</h2>
						</div>

						<div className="grid md:grid-cols-2 gap-6">
							<div>
								<label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>الاسم الكامل</label>
								<input 
									type="text" 
									name="fullname" 
									value={formData.fullname} 
									onChange={handleInputChange} 
									disabled={!isEditing}
									className={`w-full p-3.5 rounded-xl border transition-all outline-none ${theme.input} disabled:opacity-60`}
								/>
							</div>
							<div>
								<label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>البريد الإلكتروني</label>
								<input 
									type="email" 
									name="email" 
									value={formData.email} 
									onChange={handleInputChange} 
									disabled={!isEditing}
									className={`w-full p-3.5 rounded-xl border transition-all outline-none ${theme.input} disabled:opacity-60`}
								/>
							</div>
							<div>
								<label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>رقم الهاتف</label>
								<input 
									type="text" 
									name="phone" 
									value={formData.phone} 
									onChange={handleInputChange} 
									disabled={!isEditing}
									className={`w-full p-3.5 rounded-xl border transition-all outline-none ${theme.input} disabled:opacity-60`}
								/>
							</div>
							<div>
								<label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>اسم المستخدم</label>
								<input 
									type="text" 
									name="username" 
									value={formData.username} 
									onChange={handleInputChange} 
									disabled={!isEditing}
									className={`w-full p-3.5 rounded-xl border transition-all outline-none ${theme.input} disabled:opacity-60`}
								/>
							</div>
						</div>
					</div>

					{/* 4. Security & System Status */}
					<div className="space-y-6">
						{/* Account Security Card */}
						<div className={`rounded-3xl ${theme.card} border p-6`}>
							<h3 className={`text-lg font-bold ${theme.textPrimary} mb-4`}>الأمان والصلاحيات</h3>
							<div className="space-y-4">
								<div className={`p-4 rounded-xl flex items-center justify-between ${isDarkMode ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-cyan-50 border border-cyan-200"}`}>
									<div className="flex items-center gap-3">
										<div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? "bg-cyan-500/20 text-cyan-500" : "bg-cyan-100 text-cyan-600"}`}>
											🔑
										</div>
										<div>
											<p className={`font-bold text-sm ${theme.textPrimary}`}>حساب موظف</p>
											<p className={`text-xs ${theme.textSecondary}`}>صلاحيات محددة حسب الدور</p>
										</div>
									</div>
								</div>

								<button 
									onClick={() => setShowPasswordModal(true)}
									className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${theme.buttonSecondary}`}
								>
									<span>🔒</span> تغيير كلمة المرور
								</button>
							</div>
						</div>

						{/* Quick Links Card */}
						<div className={`rounded-3xl ${theme.card} border p-6`}>
							<h3 className={`text-lg font-bold ${theme.textPrimary} mb-4`}>روابط سريعة</h3>
							<div className="grid grid-cols-2 gap-3">
								<Link to="/employeedashboard" className={`p-3 rounded-xl text-center text-sm font-bold transition-all ${isDarkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-gray-50 hover:bg-gray-100 text-gray-700"}`}>
									لوحة التحكم
								</Link>
								<Link to="/" className={`p-3 rounded-xl text-center text-sm font-bold transition-all ${isDarkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-gray-50 hover:bg-gray-100 text-gray-700"}`}>
									الرئيسية
								</Link>
							</div>
						</div>
					</div>
				</div>
			</main>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirmModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
					<div className={`${theme.card} rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border p-6 text-center`}>
						<div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
							<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
						</div>
						<h3 className={`text-xl font-bold ${theme.textPrimary} mb-2`}>حذف الصورة؟</h3>
						<p className={`${theme.textSecondary} mb-6`}>لا يمكن التراجع عن هذا الإجراء، هل أنت متأكد؟</p>
						<div className="flex gap-3">
							<button onClick={() => setShowDeleteConfirmModal(false)} className={`flex-1 py-3 rounded-xl font-bold ${theme.buttonSecondary}`}>إلغاء</button>
							<button onClick={confirmDeletePhoto} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30">حذف</button>
						</div>
					</div>
				</div>
			)}
			
			{/* Crop Modal */}
			{showCropModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
					<div className={`bg-[#0a1a1f] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-white/10`}>
						<div className="p-4 border-b border-white/10 flex justify-between items-center">
							<h3 className="text-lg font-bold text-white">تعديل الصورة</h3>
							<button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-white">✕</button>
						</div>
						<div className="relative h-80 w-full bg-black">
							<Cropper image={selectedImage} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
						</div>
						<div className="p-4 flex gap-3 justify-end bg-[#0a1a1f]">
							<button onClick={() => setShowCropModal(false)} className="px-5 py-2 text-gray-300 hover:text-white font-medium">إلغاء</button>
							<button onClick={handleCropConfirm} className="px-6 py-2 bg-[#1ba3b6] text-white rounded-xl font-bold hover:bg-[#158A9A]">حفظ</button>
						</div>
					</div>
				</div>
			)}

			{/* Password Change Modal */}
			{showPasswordModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div className={`${theme.card} rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border`}>
						<div className={`p-6 ${theme.headerBg} relative overflow-hidden`}>
							<div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
							<h3 className="text-xl font-bold text-white relative z-10 flex items-center gap-2">
								<span>🔒</span> تغيير كلمة المرور
							</h3>
						</div>
						<div className="p-6 space-y-4">
							{["currentPassword", "newPassword", "confirmPassword"].map((field, idx) => (
								<div key={idx}>
									<label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
										{field === "currentPassword" ? "كلمة المرور الحالية" : field === "newPassword" ? "كلمة المرور الجديدة" : "تأكيد كلمة المرور"}
									</label>
									<div className="relative">
										<input 
											type={showPasswords[field] ? "text" : "password"} 
											name={field} 
											value={passwordData[field]} 
											onChange={handlePasswordChange} 
											className={`w-full p-3 pl-10 rounded-xl border transition-all outline-none ${theme.input}`}
										/>
										<button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))} className="absolute left-3 top-3.5 text-gray-400 hover:text-[#1ba3b6]">
											{showPasswords[field] ? "👁️" : "👁️‍🗨️"}
										</button>
									</div>
								</div>
							))}
							<div className="flex gap-3 pt-2">
								<button onClick={() => setShowPasswordModal(false)} className={`flex-1 py-3 rounded-xl font-bold ${theme.buttonSecondary}`}>إلغاء</button>
								<button onClick={handleChangePasswordSubmit} className={`flex-1 py-3 rounded-xl font-bold ${theme.buttonPrimary}`}>حفظ</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default EmployeeProfilePage;
