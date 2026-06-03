import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Cropper from "react-easy-crop";

const ClientProfilePage = () => {
    const navigate = useNavigate();
    const { clientId } = useParams(); // Get clientId from URL if admin is viewing a client
    const [isViewingOtherUser, setIsViewingOtherUser] = useState(false); // Track if admin is viewing another user
    const [user, setUser] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDocs, setLoadingDocs] = useState(true);
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

    useEffect(() => {
        fetchUserProfile();
        fetchDocuments();
    }, [clientId]);

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

            // If clientId exists in URL params, fetch that specific user (admin viewing client)
            // Otherwise, fetch the logged-in user's own profile
            const apiUrl = clientId
                ? `${import.meta.env.VITE_API_URL}/api/users/${clientId}/profile`
                : `${import.meta.env.VITE_API_URL}/api/users/profile`;

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Set flag if admin is viewing another user
            setIsViewingOtherUser(!!clientId);

            // API returns different structure for /api/users/:id/profile vs /api/users/profile
            const userData = clientId ? response.data.client : response.data.user;
            console.log("👤 User profile data:", userData);
            console.log("📸 Profile photo from DB:", userData?.profilePhoto);

            setUser(userData);
            const formDataValues = {
                fullname: userData?.fullname || "",
                username: userData?.username || "",
                phone: userData?.phone || "",
                email: userData?.email || "",
            };
            setFormData(formDataValues);
            setOriginalFormData(formDataValues);
            setHasUnsavedChanges(false);
            // Fetch profile photo if exists
            if (userData?.profilePhoto) {
                const photoKey = userData.profilePhoto;
                console.log("📸 Profile photo key:", photoKey);

                // If it's an S3 key, get presigned URL
                if (photoKey && !photoKey.startsWith("http")) {
                    console.log("🔑 Getting presigned URL for S3 key...");
                    try {
                        const photoResponse = await axios.get(
                            `${import.meta.env.VITE_API_URL
                            }/api/uploads/presigned-url/${encodeURIComponent(photoKey)}`,
                            {
                                headers: { Authorization: `Bearer ${token}` },
                            }
                        );
                        console.log("✅ Got presigned URL:", photoResponse.data.url);
                        setProfilePhoto(photoResponse.data.url);
                    } catch (err) {
                        console.error("❌ Error getting presigned URL:", err);
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

    const documentRequirements = {
        factory: [
            { key: "commercial_register", label: "السجل التجاري" },
            { key: "tax_card", label: "البطاقة الضريبية" },
            { key: "contract", label: "العقد" },
            { key: "industrial_register", label: "السجل الصناعي" },
            { key: "certificate_vat", label: "شهادة القيمة المضافة" },
            { key: "production_supplies", label: "مستلزمات الإنتاج" },
            { key: "power_of_attorney", label: "التوكيل" },
            { key: "personal_id_of_representative", label: "بطاقة ممثل" },
        ],
        commercial: [
            { key: "commercial_register", label: "السجل التجاري" },
            { key: "tax_card", label: "البطاقة الضريبية" },
            { key: "contract", label: "العقد" },
            { key: "certificate_vat", label: "شهادة القيمة المضافة" },
            { key: "import_export_card", label: "بطاقة استيراد/تصدير" },
            { key: "power_of_attorney", label: "التوكيل" },
            { key: "personal_id_of_representative", label: "بطاقة ممثل" },
            { key: "trade_certificates", label: "شهادات تجارية" },
        ],
        personal: [
            { key: "power_of_attorney", label: "التوكيل" },
            { key: "personal_id", label: "البطاقة الشخصية" },
        ],
    };

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/uploads?category=registration`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            console.log("📄 Fetched documents:", response.data.uploads);
            // Filter out profile photos - only include registration documents
            const registrationDocs = (response.data.uploads || []).filter(
                (upload) =>
                    upload.documentType && upload.documentType !== "profilePhoto"
            );
            setDocuments(registrationDocs);
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleViewDocument = async (documentId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/uploads/${documentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log("📄 Document response:", response.data);

            if (response.data.success && response.data.upload?.url) {
                console.log("✅ Opening document URL:", response.data.upload.url);
                window.open(response.data.upload.url, "_blank");
            } else {
                toast.error("فشل في الحصول على رابط الملف");
            }
        } catch (error) {
            console.error("❌ Error fetching document URL:", error);
            toast.error(error.response?.data?.message || "فشل في عرض الملف");
        }
    };

    const handleDownloadDocument = async (documentId, filename) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/uploads/${documentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success && response.data.upload?.url) {
                // Create a temporary link and trigger download
                const link = document.createElement("a");
                link.href = response.data.upload.url;
                link.download = filename || "document";
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("جاري تحميل الملف...");
            } else {
                toast.error("فشل في تحميل الملف");
            }
        } catch (error) {
            console.error("❌ Error downloading document:", error);
            toast.error("فشل في تحميل الملف");
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
            const formData = new FormData();
            formData.append("file", croppedBlob, "profile-photo.jpg");
            formData.append("category", "registration");
            formData.append("documentType", "profilePhoto");
            formData.append(
                "clientType",
                user?.clientDetails?.clientType || "personal"
            );

            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/uploads`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log("📝 Upload response:", response.data);

            if (response.data.upload?.s3Key) {
                const s3Key = response.data.upload.s3Key;

                console.log("💾 Saving S3 key to profile:", s3Key);

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

                // Use presigned URL for immediate display
                const displayUrl =
                    response.data.upload?.url || response.data.upload?.publicUrl;
                setProfilePhoto(displayUrl);
                setUser((prev) => ({ ...prev, profilePhoto: s3Key }));
                toast.success("تم تحميل الصورة بنجاح");
            } else {
                toast.error("فشل الحصول على رابط الصورة");
            }
        } catch (error) {
            console.error("Error uploading photo:", error);
            toast.error("فشل تحميل الصورة. الرجاء المحاولة مرة أخرى");
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

    const handleDeleteAllUploads = async () => {
        if (documents.length === 0) {
            toast.error("لا توجد ملفات لحذفها");
            return;
        }

        if (
            !window.confirm(
                `هل أنت متأكد من حذف جميع الملفات (${documents.length} ملف)؟`
            )
        ) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const deletePromises = documents.map((doc) =>
                axios.delete(`${import.meta.env.VITE_API_URL}/api/uploads/${doc._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            );

            await Promise.all(deletePromises);
            toast.success("تم حذف جميع الملفات بنجاح");
            await fetchDocuments();
        } catch (error) {
            console.error("Error deleting uploads:", error);
            toast.error("فشل حذف بعض الملفات");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
                <Header />
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-700"></div>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case "verified":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                        تم اعتماد الملف
                    </span>
                );
            case "pending":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                        قيد المراجعة
                    </span>
                );
            case "rejected":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        لم يرفع بعد
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        لم يرفع بعد
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="p-8">
                        <div className="flex items-start gap-8">
                            {/* Avatar - Right Side */}
                            <div className="flex flex-col items-center flex-shrink-0">
                                <div className="relative w-56 h-56 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center mb-4 shadow-lg">
                                    {loadingPhoto ? (
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-cyan-600 mb-2"></div>
                                            <p className="text-xs text-cyan-700">جاري التحميل...</p>
                                        </div>
                                    ) : uploadingPhoto ? (
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-cyan-600 mb-2"></div>
                                            <p className="text-xs text-cyan-700">جاري الرفع...</p>
                                        </div>
                                    ) : profilePhoto ? (
                                        <img
                                            src={profilePhoto}
                                            alt="Profile"
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <svg
                                            className="w-20 h-20 text-cyan-700"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    )}
                                </div>{" "}
                                {/* Photo Actions */}
                                <div className="flex flex-col gap-2 w-56">
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        disabled={uploadingPhoto || loadingPhoto}
                                    />

                                    {!loadingPhoto && (
                                        <>
                                            <label
                                                htmlFor="photo-upload"
                                                className="px-4 py-2 text-center text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 border-2"
                                                style={{
                                                    backgroundColor: uploadingPhoto
                                                        ? "#E0E0E0"
                                                        : "#1BA3B6",
                                                    color: "white",
                                                    borderColor: uploadingPhoto ? "#E0E0E0" : "#1BA3B6",
                                                    cursor: uploadingPhoto ? "not-allowed" : "pointer",
                                                }}
                                                onMouseEnter={(e) =>
                                                    !uploadingPhoto &&
                                                    (e.target.style.backgroundColor = "#158A9A")
                                                }
                                                onMouseLeave={(e) =>
                                                    !uploadingPhoto &&
                                                    (e.target.style.backgroundColor = "#1BA3B6")
                                                }
                                            >
                                                {uploadingPhoto
                                                    ? "جاري الرفع..."
                                                    : profilePhoto
                                                        ? "تغيير الصورة"
                                                        : "إضافة صورة"}
                                            </label>

                                            {profilePhoto && (
                                                <button
                                                    onClick={handleDeletePhoto}
                                                    disabled={deletingPhoto || uploadingPhoto}
                                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-white border-2 border-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {deletingPhoto ? "جاري الحذف..." : "حذف الصورة"}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                                <p className="text-gray-700 font-semibold text-lg mt-3 text-center">
                                    {user?.fullname || "اسم العميل"}
                                </p>
                            </div>

                            {/* Profile Fields - Left Side */}
                            <div className="flex-1 max-w-4xl ml-8">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Row 1 */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            اسم العميل
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="fullname"
                                                value={formData.fullname}
                                                onChange={handleInputChange}
                                                readOnly={!isEditing}
                                                className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg text-right ${isEditing ? "bg-white" : "bg-gray-50"
                                                    } text-gray-700`}
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            نوع العميل
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                readOnly={!isEditing}
                                                className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg text-right ${isEditing ? "bg-white" : "bg-gray-50"
                                                    } text-gray-700`}
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            البريد الإلكتروني
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                readOnly={!isEditing}
                                                className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg text-right ${isEditing ? "bg-white" : "bg-gray-50"
                                                    } text-gray-700`}
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                            رقم التليفون
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                readOnly={!isEditing}
                                                className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg text-right ${isEditing ? "bg-white" : "bg-gray-50"
                                                    } text-gray-700`}
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-6">
                                    {!isEditing ? (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="px-6 py-2.5 text-white rounded-lg transition-colors font-semibold text-sm flex items-center gap-2"
                                                style={{ backgroundColor: "#1BA3B6" }}
                                                onMouseEnter={(e) =>
                                                    (e.target.style.backgroundColor = "#158A9A")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.target.style.backgroundColor = "#1BA3B6")
                                                }
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                    />
                                                </svg>
                                                تعديل
                                            </button>
                                            <button
                                                onClick={() => setShowPasswordModal(true)}
                                                className="px-6 py-2.5 text-white rounded-lg transition-colors font-semibold text-sm"
                                                style={{ backgroundColor: "#1BA3B6" }}
                                                onMouseEnter={(e) =>
                                                    (e.target.style.backgroundColor = "#158A9A")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.target.style.backgroundColor = "#1BA3B6")
                                                }
                                            >
                                                تغيير كلمة المرور
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (hasUnsavedChanges) {
                                                        if (
                                                            window.confirm(
                                                                "لديك تغييرات غير محفوظة. هل تريد تجاهلها والإلغاء؟"
                                                            )
                                                        ) {
                                                            setIsEditing(false);
                                                            setFormData(originalFormData);
                                                            setHasUnsavedChanges(false);
                                                        }
                                                    } else {
                                                        setIsEditing(false);
                                                        setFormData(originalFormData);
                                                    }
                                                }}
                                                className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-sm"
                                            >
                                                إلغاء
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={!hasUnsavedChanges}
                                                className={`px-6 py-2.5 text-white rounded-lg transition-all duration-300 font-semibold text-sm flex items-center gap-2 ${hasUnsavedChanges
                                                    ? "shadow-lg shadow-cyan-500/50 ring-2 ring-cyan-400 animate-pulse"
                                                    : "opacity-50 cursor-not-allowed"
                                                    }`}
                                                style={{ backgroundColor: "#1BA3B6" }}
                                                onMouseEnter={(e) =>
                                                    hasUnsavedChanges &&
                                                    (e.target.style.backgroundColor = "#158A9A")
                                                }
                                                onMouseLeave={(e) =>
                                                    hasUnsavedChanges &&
                                                    (e.target.style.backgroundColor = "#1BA3B6")
                                                }
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                                حفظ التغييرات
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">مستنداتي</h2>
                            <button
                                onClick={handleDeleteAllUploads}
                                disabled={documents.length === 0}
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border-2 border-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                حذف جميع الملفات
                            </button>
                        </div>{" "}
                        {loadingDocs ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700 mx-auto"></div>
                                <p className="mt-2 text-gray-600">جاري تحميل المستندات...</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-8">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <p className="mt-2 text-gray-600">لا توجد مستندات محملة بعد</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {(() => {
                                        const clientType =
                                            user?.clientDetails?.clientType || "personal";
                                        const requiredDocs = documentRequirements[clientType] || [];

                                        return requiredDocs.map((docReq) => {
                                            const doc = documents.find(
                                                (d) => d.documentType === docReq.key
                                            );
                                            const hasDocument = !!doc;

                                            return (
                                                <div
                                                    key={docReq.key}
                                                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                                                >
                                                    <div className="p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-left">
                                                                <h3 className="text-base font-semibold text-gray-900 mb-1">
                                                                    {docReq.label}
                                                                </h3>
                                                                <p className="text-sm text-gray-500">
                                                                    {hasDocument
                                                                        ? `بتاريخ ${new Date(
                                                                            doc.uploadedAt
                                                                        ).toLocaleDateString("ar-EG")}`
                                                                        : "لم يتم الرفع بعد"}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                {hasDocument ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDownloadDocument(
                                                                                    doc._id,
                                                                                    doc.filename
                                                                                )
                                                                            }
                                                                            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                                        >
                                                                            تحميل الملف
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleViewDocument(doc._id)
                                                                            }
                                                                            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                                                                            style={{ backgroundColor: "#1BA3B6" }}
                                                                            onMouseEnter={(e) =>
                                                                            (e.target.style.backgroundColor =
                                                                                "#158A9A")
                                                                            }
                                                                            onMouseLeave={(e) =>
                                                                            (e.target.style.backgroundColor =
                                                                                "#1BA3B6")
                                                                            }
                                                                        >
                                                                            عرض الملف
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            disabled
                                                                            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg opacity-50 cursor-not-allowed"
                                                                        >
                                                                            تحميل الملف
                                                                        </button>
                                                                        <button
                                                                            disabled
                                                                            className="px-4 py-2 text-sm font-medium text-white rounded-lg opacity-50 cursor-not-allowed"
                                                                            style={{ backgroundColor: "#1BA3B6" }}
                                                                        >
                                                                            عرض الملف
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div className="h-1 bg-gray-200">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${hasDocument ? "bg-green-500" : "bg-red-500"
                                                                }`}
                                                            style={{ width: hasDocument ? "100%" : "0%" }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                {/* Overall progress bar */}
                                <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-white">
                                    <div className="mb-2 text-center">
                                        <p className="text-sm font-medium text-gray-700">
                                            {(() => {
                                                const clientType =
                                                    user?.clientDetails?.clientType || "personal";
                                                const requiredDocs =
                                                    documentRequirements[clientType] || [];
                                                const uploadedCount = documents.length;
                                                return `تم رفع ${uploadedCount}/${requiredDocs.length} من الملفات المطلوبة`;
                                            })()}
                                        </p>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-red-800 h-full transition-all duration-500 rounded-full"
                                            style={{
                                                width: `${(() => {
                                                    const clientType =
                                                        user?.clientDetails?.clientType || "personal";
                                                    const requiredDocs =
                                                        documentRequirements[clientType] || [];
                                                    const uploadedCount = documents.length;
                                                    return Math.round(
                                                        (uploadedCount / requiredDocs.length) * 100
                                                    );
                                                })()}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Crop Modal */}
            {showCropModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800 text-center">
                                اقتصاص الصورة
                            </h2>
                        </div>

                        {/* Crop Area */}
                        <div className="p-6">
                            <div
                                className="relative bg-gray-100 rounded-lg overflow-hidden"
                                style={{ height: "400px" }}
                            >
                                <Cropper
                                    image={selectedImage}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>

                            {/* Zoom Control */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    التكبير
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-6 py-4 border-t flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowCropModal(false);
                                    setSelectedImage(null);
                                }}
                                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleCropConfirm}
                                disabled={uploadingPhoto}
                                className="px-6 py-2 text-white rounded-lg font-semibold disabled:opacity-50"
                                style={{ backgroundColor: "#1BA3B6" }}
                            >
                                {uploadingPhoto ? "جاري الرفع..." : "حفظ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-right">
                            تغيير كلمة المرور
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    كلمة المرور الحالية
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.currentPassword ? "text" : "password"}
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent text-right bg-white text-gray-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswords((prev) => ({
                                                ...prev,
                                                currentPassword: !prev.currentPassword,
                                            }))
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPasswords.currentPassword ? (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    كلمة المرور الجديدة
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.newPassword ? "text" : "password"}
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent text-right bg-white text-gray-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswords((prev) => ({
                                                ...prev,
                                                newPassword: !prev.newPassword,
                                            }))
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPasswords.newPassword ? (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                    تأكيد كلمة المرور الجديدة
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent text-right bg-white text-gray-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswords((prev) => ({
                                                ...prev,
                                                confirmPassword: !prev.confirmPassword,
                                            }))
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPasswords.confirmPassword ? (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row-reverse gap-4 mt-6">
                            <button
                                onClick={() => {
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
                                }}
                                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleChangePasswordSubmit}
                                className="flex-1 bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition-colors font-semibold"
                            >
                                تغيير كلمة المرور
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientProfilePage;
