import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Cropper from "react-easy-crop";

const AdminProfilePage = () => {
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
	const [isVisible, setIsVisible] = useState(false);
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

	const handleDeletePhoto = () => {
		if (!profilePhoto) return;
		setShowDeleteConfirmModal(true);
	};

	const confirmDeletePhoto = async () => {
		setDeletingPhoto(true);
		setShowDeleteConfirmModal(false);
		try {
			const token = localStorage.getItem("token");
			await axios.put(
				`${import.meta.env.VITE_API_URL}/api/users/profile`,
				{ profilePhoto: "", fullname: user.fullname, username: user.username, phone: user.phone, email: user.email },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setProfilePhoto(null);
			setUser((prev) => ({ ...prev, profilePhoto: null }));
			toast.success("تم حذف الصورة بنجاح");
		} catch {
			toast.error("فشل حذف الصورة");
		} finally {
			setDeletingPhoto(false);
		}
	};
// ... (rest of code)

// Inside return JSX, add the modal:

	// Theme State with localStorage persistence (Admin uses Gold/Dark Gold accent)
	const [isDarkMode, setIsDarkMode] = useState(() => {
		const savedTheme = localStorage.getItem("adminProfileTheme");
		return savedTheme ? savedTheme === "dark" : false; // Default to light for admin
	});

	useEffect(() => {
		localStorage.setItem("adminProfileTheme", isDarkMode ? "dark" : "light");
	}, [isDarkMode]);

	const toggleTheme = () => setIsDarkMode(!isDarkMode);

	// Theme classes - GOLD THEME
	const theme = {
		pageBg: isDarkMode 
			? "bg-gradient-to-br from-[#1a1600] via-[#2d2600] to-[#1a1600]" 
			: "bg-gradient-to-br from-[#FFFDF5] via-[#FFF9E6] to-[#FFFDF5]",
		card: isDarkMode 
			? "bg-white/10 backdrop-blur-md border-white/10" 
			: "bg-white shadow-xl border-[#D4AF37]/20",
		cardHover: isDarkMode 
			? "hover:bg-white/15 hover:border-[#D4AF37]/50" 
			: "hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/40",
		textPrimary: isDarkMode ? "text-white" : "text-gray-900",
		textSecondary: isDarkMode ? "text-white/70" : "text-gray-600",
		textMuted: isDarkMode ? "text-white/50" : "text-gray-400",
		input: isDarkMode 
			? "bg-white/5 border-white/10 text-white placeholder-white/30" 
			: "bg-[#D4AF37]/5 border-[#D4AF37]/20 text-gray-900 placeholder-gray-400",
		inputFocus: isDarkMode 
			? "focus:border-[#D4AF37] focus:ring-[#D4AF37]/20" 
			: "focus:border-[#D4AF37] focus:ring-[#D4AF37]/10",
		headerGradient: "bg-gradient-to-r from-[#996515] via-[#D4AF37] to-[#F3E5AB]",
		blob1: isDarkMode ? "bg-[#D4AF37]/20" : "bg-[#D4AF37]/10",
		blob2: isDarkMode ? "bg-[#690000]/15" : "bg-[#690000]/10",
		modalBg: isDarkMode ? "bg-black/80" : "bg-white",
		modalOverlay: isDarkMode ? "bg-black/60" : "bg-black/40",
	};

	useEffect(() => {
		fetchUserProfile();
		setIsVisible(true);
	}, []);

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
				{ headers: { Authorization: `Bearer ${token}` } }
			);

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
				const photo = response.data.user.profilePhoto;
				if (photo.startsWith("http") || photo.startsWith("/uploads")) {
					setProfilePhoto(photo.startsWith("/uploads") ? `${import.meta.env.VITE_API_URL}${photo}` : photo);
				} else {
					try {
						const photoResponse = await axios.get(
							`${import.meta.env.VITE_API_URL}/api/uploads/presigned-url/${encodeURIComponent(photo)}`,
							{ headers: { Authorization: `Bearer ${token}` } }
						);
						setProfilePhoto(photoResponse.data.url);
					} catch {
						setProfilePhoto(null);
					}
				}
			}
			setLoadingPhoto(false);
			setLoading(false);
		} catch (error) {
			toast.error("فشل تحميل البيانات");
			if (error.response?.status === 401) navigate("/login");
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		const newFormData = { ...formData, [name]: value };
		setFormData(newFormData);
		setHasUnsavedChanges(Object.keys(newFormData).some((key) => newFormData[key] !== originalFormData[key]));
	};

	const handlePasswordChange = (e) => {
		const { name, value } = e.target;
		setPasswordData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSave = async () => {
		if (!formData.fullname || !formData.username || !formData.phone || !formData.email) {
			toast.error("جميع الحقول مطلوبة");
			return;
		}
		try {
			const token = localStorage.getItem("token");
			const response = await axios.put(
				`${import.meta.env.VITE_API_URL}/api/users/profile`,
				formData,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			if (response.data.success) {
				toast.success("تم تحديث البيانات بنجاح");
				setIsEditing(false);
				setOriginalFormData(formData);
				setHasUnsavedChanges(false);
				fetchUserProfile();
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "فشل تحديث البيانات");
		}
	};

	const handleChangePasswordSubmit = async () => {
		if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
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
				{ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			if (response.data.success) {
				toast.success("تم تغيير كلمة المرور بنجاح");
				setShowPasswordModal(false);
				setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
				setShowPasswords({ currentPassword: false, newPassword: false, confirmPassword: false });
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "فشل تغيير كلمة المرور");
		}
	};

	const handlePhotoUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("نوع الملف غير مدعوم");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("حجم الملف كبير جداً");
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			setSelectedImage(e.target.result);
			setCrop({ x: 0, y: 0 });
			setZoom(1);
			setShowCropModal(true);
		};
		reader.readAsDataURL(file);
	};

	const onCropComplete = (croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels);

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
		ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size);
		return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95));
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
			
			// 1. Upload the file
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/uploads`,
				formDataUpload,
				{ headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
			);

			// 2. Identify the identifier (S3 key or URL)
			const photoIdentifier = response.data.upload?.s3Key || response.data.file?.url || response.data.file?.filename || response.data.upload?.url;
			
			if (photoIdentifier) {
				// 3. Update user profile with the identifier
				await axios.put(
					`${import.meta.env.VITE_API_URL}/api/users/profile`,
					{ profilePhoto: photoIdentifier, fullname: user.fullname, username: user.username, phone: user.phone, email: user.email },
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				// 4. Update local state for immediate feedback
				// If we have a direct URL (presigned or local), use it. Otherwise rely on fetchUserProfile logic.
				const displayUrl = response.data.upload?.url || response.data.file?.url || (photoIdentifier.startsWith("http") ? photoIdentifier : null);
				
				if (displayUrl) {
					setProfilePhoto(displayUrl.startsWith("/uploads") ? `${import.meta.env.VITE_API_URL}${displayUrl}` : displayUrl);
				} else {
					// Fallback: fetch profile again to get the fresh presigned URL
					fetchUserProfile();
				}
				
				toast.success("تم تحميل الصورة بنجاح");
			} else {
				throw new Error("No photo identifier returned");
			}
		} catch (error) {
			console.error("Photo upload error:", error);
			toast.error("فشل تحميل الصورة");
		} finally {
			setUploadingPhoto(false);
		}
	};



	const getAdminType = () => {
		const userType = user?.type;
		const employeeType = user?.employeeDetails?.employeeType;
		if (userType === "admin" || employeeType === "System Admin") {
			return { label: "مدير النظام", icon: "👑", color: "bg-[#D4AF37]" }; // Gold for Admin
		}
		return { label: "مسؤول", icon: "🛡️", color: "bg-[#B5952F]" }; // Dark Gold for others
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent mx-auto mb-4"></div>
					<p className="text-gray-600">جاري تحميل البيانات...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`min-h-screen ${theme.pageBg} relative overflow-hidden transition-colors duration-300`} dir="rtl">
			<style>{`
				@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
				@keyframes float-reverse { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(20px); } }
				@keyframes float-slow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
				@keyframes pulse-glow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }
				@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
				.animate-float { animation: float 6s ease-in-out infinite; }
				.animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
				.animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
				.animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
				.animate-spin-slow { animation: spin-slow 20s linear infinite; }
			`}</style>

			{/* Animated Backgrounds */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				{isDarkMode ? (
					<>
						<div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-[#D4AF37]/20 rounded-full filter blur-[150px] animate-pulse-glow"></div>
						<div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#B5952F]/20 rounded-full filter blur-[180px] animate-float-slow"></div>
						<div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-[#8A7120]/20 rounded-full filter blur-[120px] animate-float-reverse"></div>
						<div className="absolute top-[10%] right-[10%] w-20 h-20 border-2 border-[#D4AF37]/20 rounded-xl animate-float rotate-45"></div>
						<div className="absolute bottom-[20%] left-[8%] w-16 h-16 border-2 border-[#B5952F]/20 rounded-full animate-float-reverse"></div>
					</>
				) : (
					<>
						<div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-[#D4AF37]/20 rounded-full filter blur-[150px] animate-pulse-glow"></div>
						<div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#F3E5AB]/40 rounded-full filter blur-[180px] animate-float-slow"></div>
						<div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-[#D4AF37]/10 rounded-full filter blur-[120px] animate-float-reverse"></div>
						<div className="absolute top-[10%] right-[10%] w-20 h-20 border-2 border-[#D4AF37]/30 rounded-xl animate-float rotate-45"></div>
						<div className="absolute bottom-[20%] left-[8%] w-16 h-16 border-2 border-[#B5952F]/30 rounded-full animate-float-reverse"></div>
					</>
				)}
			</div>

			<Header />

			<main className="w-full max-w-[98%] mx-auto p-4 md:p-6 relative z-10 space-y-6">
				
				{/* Row 1: Profile Header Card */}
				<div className={`${theme.headerGradient} rounded-2xl p-6 relative overflow-hidden shadow-2xl border border-white/10`}>
					<div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
					<div className="absolute bottom-0 right-0 w-32 h-32 bg-[#F3E5AB]/10 rounded-full translate-x-1/4 translate-y-1/4"></div>
					
					<div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
						{/* Profile Photo */}
						<div className="relative group">
							<div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur p-1 shadow-2xl border border-white/20">
								<div className="w-full h-full rounded-full bg-black/20 flex items-center justify-center overflow-hidden">
									{loadingPhoto || uploadingPhoto ? (
										<div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent"></div>
									) : profilePhoto ? (
										<img src={profilePhoto} alt="Profile" className="w-full h-full object-cover rounded-full" />
									) : (
										<span className="text-4xl">{getAdminType().icon}</span>
									)}
								</div>
							</div>
							<label htmlFor="photo-upload" className="absolute bottom-1 right-1 bg-[#D4AF37] hover:bg-[#B5952F] w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-white transition-transform hover:scale-110">
								<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</label>
							<input id="photo-upload" type="file" accept="image/jpeg,image/jpg,image/png" onChange={handlePhotoUpload} className="hidden" />
						</div>

						{/* User Info */}
						<div className="text-center md:text-right flex-1">
							<h1 className="text-3xl font-bold text-white mb-2">{user?.fullname || "المسؤول"}</h1>
							<div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
								<p className="text-white/70 text-sm">@{user?.username}</p>
								<span className="text-white/20">|</span>
								<p className="text-white/70 text-sm" dir="ltr">{user?.email}</p>
							</div>
							<div className="flex flex-wrap justify-center md:justify-start gap-2">
								<span className={`${getAdminType().color} text-white text-xs px-3 py-1 rounded-full font-bold shadow bg-opacity-80`}>
									{getAdminType().icon} {getAdminType().label}
								</span>
							</div>
						</div>

						{/* Theme Toggle */}
						<button 
							onClick={toggleTheme} 
							className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all hover:scale-105 flex items-center gap-2"
						>
							{isDarkMode ? (
								<svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
								</svg>
							) : (
								<svg className="w-5 h-5 text-white bg-white/20 rounded-full" fill="currentColor" viewBox="0 0 24 24">
									<path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
								</svg>
							)}
						</button>
					</div>
				</div>

				{/* Row 2: Stats / Navigation Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<Link to="/admindashboard" className={`${theme.card} rounded-xl p-5 border ${theme.cardHover} transition-all group flex items-center justify-between`}>
						<div>
							<p className={`${theme.textMuted} text-xs mb-1`}>النظام</p>
							<p className={`text-lg font-bold ${theme.textPrimary}`}>لوحة التحكم</p>
						</div>
						<div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-2xl text-blue-500 border border-blue-500/20">📊</div>
					</Link>
					<Link to="/employeemanagement" className={`${theme.card} rounded-xl p-5 border ${theme.cardHover} transition-all group flex items-center justify-between`}>
						<div>
							<p className={`${theme.textMuted} text-xs mb-1`}>الفريق</p>
							<p className={`text-lg font-bold ${theme.textPrimary}`}>الموظفين</p>
						</div>
						<div className="w-12 h-12 bg-[#1ba3b6]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-2xl text-[#1ba3b6] border border-[#1ba3b6]/20">👥</div>
					</Link>
					<Link to="/customermanagement" className={`${theme.card} rounded-xl p-5 border ${theme.cardHover} transition-all group flex items-center justify-between`}>
						<div>
							<p className={`${theme.textMuted} text-xs mb-1`}>المستخدمين</p>
							<p className={`text-lg font-bold ${theme.textPrimary}`}>العملاء</p>
						</div>
						<div className="w-12 h-12 bg-[#690000]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-2xl text-[#690000] border border-[#690000]/20">🏢</div>
					</Link>
					<Link to="/shipmentsmanagement" className={`${theme.card} rounded-xl p-5 border ${theme.cardHover} transition-all group flex items-center justify-between`}>
						<div>
							<p className={`${theme.textMuted} text-xs mb-1`}>العمليات</p>
							<p className={`text-lg font-bold ${theme.textPrimary}`}>الشحنات</p>
						</div>
						<div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-2xl text-amber-500 border border-amber-500/20">📦</div>
					</Link>
				</div>

				{/* Row 3: Personal Information + Quick Actions */}
				<div className="grid lg:grid-cols-2 gap-6">
					
					{/* Personal Information */}
					<div className={`${theme.card} rounded-2xl border p-6 h-full flex flex-col`}>
						<div className="flex items-center justify-between mb-6">
							<h3 className={`text-lg font-bold ${theme.textPrimary} flex items-center gap-2`}>
								<span className="w-8 h-8 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20">👤</span>
								البيانات الشخصية
							</h3>
						</div>
						
						<div className="space-y-4 flex-1">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>الاسم الكامل</label>
									<input
										type="text"
										name="fullname"
										value={formData.fullname}
										onChange={handleInputChange}
										disabled={!isEditing}
										className={`w-full p-3 rounded-xl border ${theme.input} ${theme.inputFocus} transition-all`}
									/>
								</div>
								<div>
									<label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>اسم المستخدم</label>
									<input
										type="text"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										disabled={!isEditing}
										className={`w-full p-3 rounded-xl border ${theme.input} ${theme.inputFocus} transition-all`}
									/>
								</div>
								<div>
									<label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>رقم الهاتف</label>
									<input
										type="text"
										name="phone"
										value={formData.phone}
										onChange={handleInputChange}
										disabled={!isEditing}
										className={`w-full p-3 rounded-xl border ${theme.input} ${theme.inputFocus} transition-all`}
									/>
								</div>
								<div>
									<label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>البريد الإلكتروني</label>
									<input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										disabled={!isEditing}
										className={`w-full p-3 rounded-xl border ${theme.input} ${theme.inputFocus} transition-all`}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Quick Actions */}
					<div className="space-y-6">
						{/* Action Buttons */}
						<div className={`${theme.card} rounded-2xl border p-6`}>
							<h3 className={`text-lg font-bold ${theme.textPrimary} mb-6 flex items-center gap-2`}>
								<span className="w-8 h-8 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20">⚡</span>
								إجراءات سريعة
							</h3>
							<div className="flex flex-col gap-3">
								{isEditing ? (
									<div className="flex gap-3">
										<button
											onClick={handleSave}
											className="flex-1 bg-[#D4AF37] hover:bg-[#B5952F] text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-[#D4AF37]/30 active:scale-95"
										>
											حفظ التغييرات
										</button>
										<button
											onClick={() => {
												setIsEditing(false);
												setFormData(originalFormData);
												setHasUnsavedChanges(false);
											}}
											className={`flex-1 ${isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"} py-3 px-4 rounded-xl font-bold transition-all active:scale-95`}
										>
											إلغاء
										</button>
									</div>
								) : (
									<button
										onClick={() => setIsEditing(true)}
										className={`w-full py-3 px-4 rounded-xl font-bold transition-all border ${
											isDarkMode 
												? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/20" 
												: "bg-yellow-50 text-[#B5952F] border-yellow-200 hover:bg-yellow-100"
										} active:scale-95 flex items-center justify-center gap-2`}
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
										</svg>
										تعديل البيانات
									</button>
								)}

								<button
									onClick={() => setShowPasswordModal(true)}
									className={`w-full py-3 px-4 rounded-xl font-bold transition-all border ${
										isDarkMode 
											? "bg-white/5 text-white/80 border-white/10 hover:bg-white/10" 
											: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
									} active:scale-95 flex items-center justify-center gap-2`}
								>
									<svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
									تغيير كلمة المرور
								</button>
								
								{profilePhoto && (
									<button
										onClick={handleDeletePhoto}
										disabled={deletingPhoto}
										className="w-full py-3 px-4 rounded-xl font-bold transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-95 flex items-center justify-center gap-2"
									>
										{deletingPhoto ? (
											<div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
										) : (
											<>
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
												حذف الصورة الشخصية
											</>
										)}
									</button>
								)}
							</div>
						</div>
						
						{/* Security Status Card */}
						<div className={`${theme.card} rounded-2xl border p-6`}>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-xl border border-green-500/20">
									🛡️
								</div>
								<div>
									<h4 className={`font-bold ${theme.textPrimary}`}>حالة الحساب آمنة</h4>
									<p className={`text-sm ${theme.textMuted}`}>تم تفعيل المصادقة الثنائية</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirmModal && (
				<div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.modalOverlay} backdrop-blur-sm`}>
					<div className={`${theme.modalBg} rounded-2xl max-w-sm w-full shadow-2xl border border-white/10 overflow-hidden transform transition-all scale-100`}>
						<div className="p-6 text-center space-y-4">
							<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
								<svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</div>
							<h3 className={`text-xl font-bold ${theme.textPrimary}`}>حذف الصورة الشخصية</h3>
							<p className={`${theme.textSecondary}`}>هل أنت متأكد من رغبتك في حذف الصورة الشخصية؟ لا يمكن التراجع عن هذا الإجراء.</p>
							
							<div className="flex gap-3 pt-4">
								<button
									onClick={() => setShowDeleteConfirmModal(false)}
									className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
								>
									إلغاء
								</button>
								<button
									onClick={confirmDeletePhoto}
									className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/30"
								>
									حذف
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
			
			{/* Crop Modal */}
			{showCropModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
					<div className={`${theme.modalBg} rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-white/10`}>
						<div className="p-4 border-b border-white/10 flex justify-between items-center">
							<h3 className={`text-lg font-bold ${theme.textPrimary}`}>قص الصورة</h3>
							<button onClick={() => setShowCropModal(false)} className={`text-gray-400 hover:text-white`}>
								✕
							</button>
						</div>
						<div className="relative h-80 w-full bg-black">
							<Cropper
								image={selectedImage}
								crop={crop}
								zoom={zoom}
								aspect={1}
								onCropChange={setCrop}
								onZoomChange={setZoom}
								onCropComplete={onCropComplete}
							/>
						</div>
						<div className="p-4 flex gap-3 justify-end bg-black/20">
							<button onClick={() => setShowCropModal(false)} className="px-4 py-2 text-white/70 hover:text-white transition-colors">
								إلغاء
							</button>
							<button onClick={handleCropConfirm} className="px-6 py-2 bg-[#D4AF37] hover:bg-[#B5952F] text-white rounded-lg font-bold transition-colors">
								قص وحفظ
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Password Change Modal */}
			{showPasswordModal && (
				<div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.modalOverlay} backdrop-blur-sm`}>
					<div className={`${theme.modalBg} rounded-2xl max-w-md w-full shadow-2xl border border-white/10 overflow-hidden transform transition-all scale-100`}>
						<div className={`p-6 ${theme.headerGradient} relative overflow-hidden`}>
							<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
							<h3 className="text-xl font-bold text-white relative z-10 flex items-center gap-2">
								<span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">🔒</span>
								تغيير كلمة المرور
							</h3>
						</div>
						
						<div className="p-6 space-y-4">
							<div>
								<label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>كلمة المرور الحالية</label>
								<div className="relative">
									<input
										type={showPasswords.currentPassword ? "text" : "password"}
										name="currentPassword"
										value={passwordData.currentPassword}
										onChange={handlePasswordChange}
										className={`w-full p-3 pl-10 rounded-xl border ${theme.input} ${theme.inputFocus} transition-all`}
									/>
									<button
										type="button"
										onClick={() => setShowPasswords(prev => ({ ...prev, currentPassword: !prev.currentPassword }))}
										className="absolute left-3 top-3 text-gray-400 hover:text-[#D4AF37]"
									>
										{showPasswords.currentPassword ? "👁️" : "👁️‍🗨️"}
									</button>
								</div>
							</div>
							
							<div>
								<label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>كلمة المرور الجديدة</label>
								<div className="relative">
									<input
										type={showPasswords.newPassword ? "text" : "password"}
										name="newPassword"
										value={passwordData.newPassword}
										onChange={handlePasswordChange}
										className={`w-full p-3 pl-10 rounded-xl border ${theme.input} ${theme.inputFocus} transition-all`}
									/>
									<button
										type="button"
										onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))}
										className="absolute left-3 top-3 text-gray-400 hover:text-[#D4AF37]"
									>
										{showPasswords.newPassword ? "👁️" : "👁️‍🗨️"}
									</button>
								</div>
							</div>
							
							<div>
								<label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>تأكيد كلمة المرور</label>
								<div className="relative">
									<input
										type={showPasswords.confirmPassword ? "text" : "password"}
										name="confirmPassword"
										value={passwordData.confirmPassword}
										onChange={handlePasswordChange}
										className={`w-full p-3 pl-10 rounded-xl border ${theme.input} ${theme.inputFocus} transition-all`}
									/>
									<button
										type="button"
										onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
										className="absolute left-3 top-3 text-gray-400 hover:text-[#D4AF37]"
									>
										{showPasswords.confirmPassword ? "👁️" : "👁️‍🗨️"}
									</button>
								</div>
							</div>

							<div className="flex gap-3 pt-4">
								<button
									onClick={() => setShowPasswordModal(false)}
									className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
								>
									إلغاء
								</button>
								<button
									onClick={handleChangePasswordSubmit}
									className="flex-1 bg-[#D4AF37] hover:bg-[#B5952F] text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-[#D4AF37]/30"
								>
									حفظ
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminProfilePage;
