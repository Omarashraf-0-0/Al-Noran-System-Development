import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const RegisterPage = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [formData, setFormData] = useState({
		fullname: "",
		email: "",
		phone: "",
		username: "",
		password: "",
		confirmPassword: "",
		type: "",
		ssn: "",
		terms: false,
	});

	useEffect(() => {
		setIsVisible(true);
	}, []);

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
		if (formData.password !== formData.confirmPassword) {
			toast.error("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
			return;
		}

		if (formData.type === "personal" && (!formData.ssn || formData.ssn.length !== 14)) {
			toast.error("رجاءً أدخل رقم بطاقة قومية صحيح (14 رقم)");
			return;
		}

		if (!formData.terms) {
			toast.error("يجب الموافقة على الشروط والأحكام");
			return;
		}

		setIsLoading(true);

		try {
			const registrationData = {
				fullname: formData.fullname,
				username: formData.username,
				phone: formData.phone,
				email: formData.email,
				password: formData.password,
				type: "client",
				clientDetails: {
					clientType: formData.type,
					ssn: formData.ssn || "",
				},
			};

			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/auth/signup`,
				registrationData
			);

			toast.success("تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...");
			localStorage.setItem("token", response.data.token);
			localStorage.setItem("user", JSON.stringify(response.data.user));

			setTimeout(() => {
				navigate("/upload-documents");
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
			<div className="w-full lg:w-1/2 flex flex-col justify-start items-center py-8 px-8 lg:px-16 bg-white overflow-y-auto relative min-h-screen">
				{/* Back to Home Link */}
				<Link 
					to="/" 
					className="absolute top-6 right-6 flex items-center gap-2 text-gray-500 hover:text-[#690000] transition-colors duration-300 group z-10"
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
								src="/src/assets/images/coloredLogo.svg"
								alt="النوران"
								className="h-20 mx-auto mb-4 hover:scale-110 transition-transform duration-300"
							/>
						</Link>
						<h1 className="text-3xl font-bold text-[#690000] mb-2">
							إنشاء حساب جديد
						</h1>
						<p className="text-gray-500">
							انضم إلينا وابدأ رحلتك مع نوران
						</p>
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
							<label className="block text-sm font-semibold text-gray-700 mb-2">
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
									className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300"
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
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								البريد الإلكتروني <span className="text-red-500">*</span>
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
									className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300"
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
								<label className="block text-sm font-semibold text-gray-700 mb-2">
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
										className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300"
										dir="ltr"
									/>
								</div>
							</div>

							{/* Username */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
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
										className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300"
									/>
								</div>
							</div>
						</div>

						{/* Password Row */}
						<div 
							className="grid grid-cols-1 sm:grid-cols-2 gap-4"
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.25s forwards' : 'none',
								opacity: 0 
							}}
						>
							{/* Password */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
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
										required
										className="w-full pr-12 pl-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300"
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
								<label className="block text-sm font-semibold text-gray-700 mb-2">
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
										className="w-full pr-12 pl-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300"
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

						{/* Account Type */}
						<div 
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.3s forwards' : 'none',
								opacity: 0 
							}}
						>
							<label className="block text-sm font-semibold text-gray-700 mb-3">
								نوع الحساب <span className="text-red-500">*</span>
							</label>
							<div className="grid grid-cols-3 gap-3">
								{accountTypes.map((type) => (
									<label
										key={type.id}
										className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
											formData.type === type.id
												? "border-[#690000] bg-[#690000]/5 shadow-md"
												: "border-gray-200 hover:border-[#690000]/30 hover:bg-gray-50"
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
										<span className={`text-sm font-medium ${formData.type === type.id ? "text-[#690000]" : "text-gray-600"}`}>
											{type.label}
										</span>
									</label>
								))}
							</div>
						</div>

						{/* SSN - Only for personal accounts */}
						{formData.type === "personal" && (
							<div 
								style={{ 
									animation: 'fade-in-up 0.4s ease-out forwards'
								}}
							>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
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
										className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300 tracking-wider"
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
								className="mt-1 w-5 h-5 text-[#690000] rounded border-gray-300 focus:ring-[#690000] cursor-pointer"
							/>
							<label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
								أوافق على{" "}
								<a href="/terms" target="_blank" className="text-[#690000] hover:underline font-medium">
									الشروط والأحكام
								</a>{" "}
								و{" "}
								<a href="/privacy" target="_blank" className="text-[#690000] hover:underline font-medium">
									سياسة الخصوصية
								</a>
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
						className="text-center text-gray-600 mt-6 pb-8"
						style={{ 
							animation: isVisible ? 'fade-in-up 0.6s ease-out 0.45s forwards' : 'none',
							opacity: 0 
						}}
					>
						لديك حساب بالفعل؟{" "}
						<Link
							to="/login"
							className="text-[#690000] hover:text-[#8B0000] font-bold transition-colors hover:underline"
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
						src="/src/assets/images/white logo.svg"
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
