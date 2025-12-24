import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { isValidPassportNumber, isValidEgyptianNationalId, isValidPhoneNumber, isValidPassword } from "../utils/validationUtils";
import { useTheme } from "../context/ThemeContext";
import coloredLogo from "../assets/images/coloredLogo.svg";
import whiteLogo from "../assets/images/white logo.svg";

const RegisterPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode, toggleTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isGoogleSignup, setIsGoogleSignup] = useState(false);
    const [googleData, setGoogleData] = useState(null);
    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        phone: "",
        username: "",
        password: "",
        confirmPassword: "",
        type: "",
        nationality: "",
        ssn: "",
        passportNumber: "",
        terms: false,
    });

    useEffect(() => {
        setIsVisible(true);

        // Check if coming from Google login with prefilled data
        if (location.state?.googleData) {
            const gData = location.state.googleData;
            setGoogleData(gData);
            setIsGoogleSignup(true);
            setFormData(prev => ({
                ...prev,
                fullname: gData.fullname || "",
                email: gData.email || "",
                // Generate a username from email
                username: gData.email ? gData.email.split("@")[0] : "",
            }));
            toast.success("تم جلب بياناتك من جوجل. أكمل باقي البيانات", { duration: 4000 });
        }
    }, [location.state]);

    const handleInputChange = (field) => (e) => {
        setFormData((prev) => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    const handleCheckboxChange = (field) => (e) => {
        setFormData((prev) => ({
            ...prev,
            [field]: e.target.checked,
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Validations
        if (!isGoogleSignup && formData.password !== formData.confirmPassword) {
            toast.error("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
            return;
        }

        if (!isGoogleSignup) {
            const passwordValidation = isValidPassword(formData.password);
            if (!passwordValidation.isValid) {
                toast.error(passwordValidation.error);
                return;
            }
        }

        if (formData.type === "personal") {
            if (!formData.nationality) {
                toast.error("رجاءً اختر الجنسية");
                return;
            }

            if (formData.nationality === "egyptian") {
                const idValidation = isValidEgyptianNationalId(formData.ssn);
                if (!idValidation.isValid) {
                    toast.error(idValidation.error);
                    return;
                }
            } else if (formData.nationality === "nonEgyptian") {
                const passportValidation = isValidPassportNumber(formData.passportNumber);
                if (!passportValidation.isValid) {
                    toast.error(passportValidation.error);
                    return;
                }
            }
        }

        if (!formData.terms) {
            toast.error("يجب الموافقة على الشروط والأحكام");
            return;
        }

        const phoneValidation = isValidPhoneNumber(formData.phone);
        if (!phoneValidation.isValid) {
            toast.error(phoneValidation.error);
            return;
        }

        if (!formData.type) {
            toast.error("رجاءً اختر نوع الحساب");
            return;
        }

        setIsLoading(true);

        try {
            const registrationData = {
                fullname: formData.fullname,
                username: formData.username,
                phone: formData.phone,
                email: formData.email,
                password: isGoogleSignup ? `Google_${googleData.googleId}_${Date.now()}` : formData.password,
                type: "client",
                clientDetails: {
                    clientType: formData.type,
                    nationality: formData.nationality || "",
                    ssn: formData.nationality === "egyptian" ? formData.ssn : "",
                    passportNumber: formData.nationality === "nonEgyptian" ? formData.passportNumber : "",
                },
            };

            // Add googleId if coming from Google signup
            if (isGoogleSignup && googleData?.googleId) {
                registrationData.googleId = googleData.googleId;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/signup`,
                registrationData
            );

            toast.success("تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...");
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            setTimeout(() => {
                window.location.href = "/upload-documents"; // Changed to match previous logic or use navigate
            }, 2000);
        } catch (error) {
            console.error("Error during registration:", error);
            toast.error(error.response?.data?.message || "فشل في إنشاء الحساب");
        } finally {
            setIsLoading(false);
        }
    };

    const accountTypes = [
        { id: "personal", label: "شخصي", icon: "👤" },
        { id: "commercial", label: "تجاري", icon: "🏪" },
        { id: "factory", label: "مصنع", icon: "🏭" },
    ];

    const inputClasses = `w-full pr-12 pl-4 py-3.5 border rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] transition-all duration-300 ${isDarkMode
        ? "bg-[#1a1a1a] border-white/10 text-white focus:bg-[#202020]"
        : "bg-gray-50 border-gray-200 text-gray-800 focus:bg-white"
        }`;

    const labelClasses = `block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`;

    return (
        <div className="min-h-screen flex" dir="rtl">
            {/* Custom Styles */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.1); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in-right {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
                .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
            `}</style>

            {/* Left Side - Form */}
            <div className={`w-full lg:w-1/2 flex flex-col justify-start items-center py-8 px-8 lg:px-16 overflow-y-auto relative min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"}`}>
                {/* Back to Home Link */}
                <Link
                    to="/"
                    className={`absolute top-6 right-6 flex items-center gap-2 transition-colors duration-300 group z-10 ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-[#690000]"}`}
                    style={{
                        animation: isVisible ? 'fade-in-up 0.6s ease-out forwards' : 'none',
                        opacity: 0
                    }}
                >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-medium">الرئيسية</span>
                </Link>

                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className={`absolute top-6 left-6 p-2 rounded-full transition-all duration-300 z-50 ${isDarkMode
                        ? "bg-white/10 text-yellow-400 hover:bg-white/20"
                        : "bg-gray-100 text-[#690000] hover:bg-gray-200"
                        }`}
                >
                    {isDarkMode ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>

                <div className={`w-full max-w-lg mt-12 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Logo & Header */}
                    <div
                        className="text-center mb-6"
                        style={{
                            animation: isVisible ? 'fade-in-up 0.6s ease-out forwards' : 'none',
                            opacity: 0
                        }}
                    >
                        <Link to="/">
                            <img
                                src={isDarkMode ? whiteLogo : coloredLogo}
                                alt="النوران"
                                className="h-20 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
                            />
                        </Link>
                        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-[#690000]"}`}>
                            {isGoogleSignup ? "إكمال التسجيل" : "إنشاء حساب جديد"}
                        </h1>
                        <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                            {isGoogleSignup ? "أكمل بياناتك للمتابعة مع حساب جوجل" : "انضم إلينا وابدأ رحلتك مع نوران"}
                        </p>
                        {isGoogleSignup && (
                            <div className={`mt-3 flex items-center justify-center gap-2 py-2 px-4 rounded-lg ${isDarkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm font-medium">متصل بحساب جوجل</span>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Full Name */}
                        <div
                            style={{
                                animation: isVisible ? 'fade-in-up 0.6s ease-out 0.1s forwards' : 'none',
                                opacity: 0
                            }}
                        >
                            <label className={labelClasses}>
                                الاسم الكامل <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={formData.fullname}
                                    onChange={handleInputChange("fullname")}
                                    placeholder="ادخل الاسم الكامل"
                                    required
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div
                            style={{
                                animation: isVisible ? 'fade-in-up 0.6s ease-out 0.15s forwards' : 'none',
                                opacity: 0
                            }}
                        >
                            <label className={labelClasses}>
                                البريد الإلكتروني <span className="text-red-500">*</span>
                                {isGoogleSignup && <span className="text-green-600 text-xs mr-2">(من جوجل)</span>}
                            </label>
                            <div className="relative group">
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange("email")}
                                    placeholder="example@email.com"
                                    required
                                    readOnly={isGoogleSignup}
                                    className={`${inputClasses} ${isGoogleSignup ? (isDarkMode ? 'bg-[#202020] cursor-not-allowed' : 'bg-gray-100 cursor-not-allowed') : ''}`}
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Phone & Username Row */}
                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                            style={{
                                animation: isVisible ? 'fade-in-up 0.6s ease-out 0.2s forwards' : 'none',
                                opacity: 0
                            }}
                        >
                            {/* Phone */}
                            <div>
                                <label className={labelClasses}>
                                    رقم الهاتف <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange("phone")}
                                        placeholder="01xxxxxxxxx"
                                        required
                                        className={inputClasses}
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div>
                                <label className={labelClasses}>
                                    اسم المستخدم <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={handleInputChange("username")}
                                        placeholder="ادخل اسم المستخدم"
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password Row - Only show if not Google signup */}
                        {!isGoogleSignup && (
                            <div
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                style={{
                                    animation: isVisible ? 'fade-in-up 0.6s ease-out 0.25s forwards' : 'none',
                                    opacity: 0
                                }}
                            >
                                {/* Password */}
                                <div>
                                    <label className={labelClasses}>
                                        كلمة المرور <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleInputChange("password")}
                                            placeholder="••••••••"
                                            required={!isGoogleSignup}
                                            className={`${inputClasses} pl-12`}
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#690000] transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className={labelClasses}>
                                        تأكيد كلمة المرور <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange("confirmPassword")}
                                            placeholder="••••••••"
                                            required
                                            className={`${inputClasses} pl-12`}
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#690000] transition-colors"
                                        >
                                            {showConfirmPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Type */}
                        <div
                            style={{
                                animation: isVisible ? 'fade-in-up 0.6s ease-out 0.3s forwards' : 'none',
                                opacity: 0
                            }}
                        >
                            <label className={`${labelClasses} mb-3`}>
                                نوع الحساب <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {accountTypes.map((type) => (
                                    <label
                                        key={type.id} // Added key here (was missing in previous user snippet but React needs it)
                                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${formData.type === type.id
                                            ? (isDarkMode ? "border-red-500 bg-red-500/20 shadow-md text-red-400" : "border-[#690000] bg-[#690000]/5 shadow-md text-[#690000]")
                                            : (isDarkMode ? "border-white/10 hover:border-red-500/30 hover:bg-white/5 text-gray-400" : "border-gray-200 hover:border-[#690000]/30 hover:bg-gray-50 text-gray-600")
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type.id}
                                            checked={formData.type === type.id}
                                            onChange={handleInputChange("type")}
                                            className="hidden"
                                            required
                                        />
                                        <span className="text-2xl">{type.icon}</span>
                                        <span className={`text-sm font-medium ${formData.type === type.id ? (isDarkMode ? "text-red-400" : "text-[#690000]") : "text-gray-600 dark:text-gray-400"}`}>
                                            {type.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Nationality - Only for personal accounts */}
                        {formData.type === "personal" && (
                            <div
                                style={{
                                    animation: 'fade-in-up 0.4s ease-out forwards'
                                }}
                            >
                                <label className={`${labelClasses} mb-3`}>
                                    الجنسية <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label
                                        className={`flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${formData.nationality === "egyptian"
                                            ? (isDarkMode ? "border-red-500 bg-red-500/20 shadow-md text-red-400" : "border-[#690000] bg-[#690000]/5 shadow-md text-[#690000]")
                                            : (isDarkMode ? "border-white/10 hover:border-red-500/30 hover:bg-white/5 text-gray-400" : "border-gray-200 hover:border-[#690000]/30 hover:bg-gray-50 text-gray-600")
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="nationality"
                                            value="egyptian"
                                            checked={formData.nationality === "egyptian"}
                                            onChange={handleInputChange("nationality")}
                                            className="hidden"
                                            required
                                        />
                                        <span className="text-xl">🇪🇬</span>
                                        <span className={`text-sm font-medium`}>
                                            مصري
                                        </span>
                                    </label>
                                    <label
                                        className={`flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${formData.nationality === "nonEgyptian"
                                            ? (isDarkMode ? "border-red-500 bg-red-500/20 shadow-md text-red-400" : "border-[#690000] bg-[#690000]/5 shadow-md text-[#690000]")
                                            : (isDarkMode ? "border-white/10 hover:border-red-500/30 hover:bg-white/5 text-gray-400" : "border-gray-200 hover:border-[#690000]/30 hover:bg-gray-50 text-gray-600")
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="nationality"
                                            value="nonEgyptian"
                                            checked={formData.nationality === "nonEgyptian"}
                                            onChange={handleInputChange("nationality")}
                                            className="hidden"
                                            required
                                        />
                                        {/* <span className="text-xl">🌍</span> */}
                                        <span className={`text-sm font-medium`}>
                                            غير مصري
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* SSN - Only for Egyptian personal accounts */}
                        {formData.type === "personal" && formData.nationality === "egyptian" && (
                            <div
                                style={{
                                    animation: 'fade-in-up 0.4s ease-out forwards'
                                }}
                            >
                                <label className={labelClasses}>
                                    رقم البطاقة القومية <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.ssn}
                                        onChange={handleInputChange("ssn")}
                                        placeholder="ادخل رقم البطاقة القومية (14 رقم)"
                                        required
                                        maxLength={14}
                                        className={`${inputClasses} tracking-wider`}
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Passport Number - Only for Non-Egyptian personal accounts */}
                        {formData.type === "personal" && formData.nationality === "nonEgyptian" && (
                            <div
                                style={{
                                    animation: 'fade-in-up 0.4s ease-out forwards'
                                }}
                            >
                                <label className={labelClasses}>
                                    رقم الباسبور <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.passportNumber}
                                        onChange={handleInputChange("passportNumber")}
                                        placeholder="ادخل رقم الباسبور (6-9 أحرف وأرقام)"
                                        required
                                        maxLength={9}
                                        className={`${inputClasses} tracking-wider uppercase`}
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Terms Checkbox */}
                        <div
                            className="flex items-start gap-3"
                            style={{
                                animation: isVisible ? 'fade-in-up 0.6s ease-out 0.35s forwards' : 'none',
                                opacity: 0
                            }}
                        >
                            <input
                                type="checkbox"
                                id="terms"
                                checked={formData.terms}
                                onChange={handleCheckboxChange("terms")}
                                required
                                className={`mt-1 w-5 h-5 rounded border-gray-300 focus:ring-[#690000] cursor-pointer ${isDarkMode ? "bg-[#1a1a1a] border-white/10 text-red-500" : "text-[#690000]"}`}
                            />
                            <label htmlFor="terms" className={`text-sm cursor-pointer ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                أقر أنا المفوض عن الشركة بصحة البيانات المذكورة وأوافق على <a href="/terms" target="_blank" className={`hover:underline font-medium ${isDarkMode ? "text-red-400" : "text-[#690000]"}`}>شروط شركة النوران</a>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div
                            style={{
                                animation: isVisible ? 'fade-in-up 0.6s ease-out 0.4s forwards' : 'none',
                                opacity: 0
                            }}
                        >
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-[#690000] hover:bg-[#8B0000] text-white font-bold rounded-xl shadow-lg hover:shadow-[#690000]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2 relative z-10">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        جاري إنشاء الحساب...
                                    </span>
                                ) : (
                                    <span className="relative z-10">إنشاء حساب</span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Login Link */}
                    <p
                        className={`text-center mt-6 pb-8 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}
                        style={{
                            animation: isVisible ? 'fade-in-up 0.6s ease-out 0.45s forwards' : 'none',
                            opacity: 0
                        }}
                    >
                        لديك حساب بالفعل؟{" "}
                        <Link
                            to="/login"
                            className={`font-bold transition-colors hover:underline ${isDarkMode ? "text-red-400 hover:text-red-300" : "text-[#690000] hover:text-[#8B0000]"}`}
                        >
                            تسجيل الدخول
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#690000] via-[#5a0000] to-[#4a0000] overflow-hidden items-center justify-center sticky top-0 h-screen">
                {/* Floating Elements */}
                <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-[#1ba3b6] rounded-full filter blur-[100px] animate-pulse-glow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white rounded-full filter blur-[120px] opacity-10 animate-float-slow"></div>
                <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-[#1ba3b6] rounded-full filter blur-[80px] opacity-30"></div>

                {/* Small floating shapes */}
                <div className="absolute top-[15%] right-[20%] w-4 h-4 bg-white/30 rounded-full animate-float"></div>
                <div className="absolute top-[25%] left-[15%] w-3 h-3 bg-[#1ba3b6]/50 rounded-full"></div>
                <div className="absolute bottom-[30%] left-[25%] w-5 h-5 bg-white/20 rounded-full animate-float-slow"></div>

                {/* Content */}
                <div
                    className="relative z-10 flex flex-col justify-center items-center text-center px-12"
                    style={{
                        animation: isVisible ? 'fade-in-right 0.8s ease-out 0.3s forwards' : 'none',
                        opacity: 0
                    }}
                >
                    <img
                        src={whiteLogo}
                        alt="النوران"
                        className="h-44 mb-10 drop-shadow-2xl animate-float-slow"
                    />
                    <h2 className="text-4xl font-bold text-white mb-4">
                        انضم إلى نوران
                    </h2>
                    <p className="text-white/80 text-lg max-w-sm leading-relaxed mb-10">
                        ابدأ رحلتك معنا واستفد من خدماتنا المتميزة في التخليص الجمركي والشحن.
                    </p>

                    {/* Features */}
                    <div className="space-y-4 text-right">
                        {[
                            "تتبع شحناتك لحظة بلحظة",
                            "إدارة جميع مستنداتك بسهولة",
                            "دعم فني على مدار الساعة",
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 text-white/80">
                                <svg className="w-5 h-5 text-[#1ba3b6] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
