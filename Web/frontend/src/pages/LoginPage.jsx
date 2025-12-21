import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import ReCAPTCHA from "react-google-recaptcha";

const LoginPage = () => {
	const navigate = useNavigate();
	const recaptchaRef = useRef(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [captchaToken, setCaptchaToken] = useState(null);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	// Trigger entrance animations on mount
	useEffect(() => {
		setIsVisible(true);
	}, []);

	const handleInputChange = (field) => (e) => {
		setFormData((prev) => ({
			...prev,
			[field]: e.target.value,
		}));
	};

	// Google Login Handler
	const googleLogin = useGoogleLogin({
		onSuccess: async (tokenResponse) => {
			setIsGoogleLoading(true);
			try {
				// Get user info from Google
				const userInfoResponse = await axios.get(
					"https://www.googleapis.com/oauth2/v3/userinfo",
					{
						headers: {
							Authorization: `Bearer ${tokenResponse.access_token}`,
						},
					}
				);

				const { email, name, sub: googleId, picture } = userInfoResponse.data;

				// Send to backend
				const response = await axios.post(
					`${import.meta.env.VITE_API_URL}/api/auth/google`,
					{
						email,
						displayName: name,
						googleId,
						accessToken: tokenResponse.access_token,
					}
				);

				if (response.data.success) {
					if (response.data.isNewUser) {
						// New user - redirect to register with prefilled data
						toast.success("مرحباً! يرجى إكمال بيانات التسجيل");
						navigate("/register", {
							state: {
								googleData: {
									email,
									fullname: name,
									googleId,
									profilePhoto: picture,
								},
							},
						});
					} else {
						// Existing user - login directly
						toast.success("تم تسجيل الدخول بنجاح");
						const user = response.data.user;
						localStorage.setItem("user", JSON.stringify(user));
						localStorage.setItem("token", response.data.token);
						localStorage.setItem("tokenExpiry", Date.now() + 30 * 24 * 60 * 60 * 1000);

						setTimeout(() => {
							switch (user.type) {
								case "client":
									navigate("/home");
									break;
								case "employee":
									if (user.employeeDetails?.employeeType === "System Admin") {
										navigate("/admindashboard");
									} else {
										navigate("/employeedashboard");
									}
									break;
								case "admin":
									navigate("/admindashboard");
									break;
								default:
									navigate("/home");
							}
						}, 1000);
					}
				}
			} catch (error) {
				console.error("Google login error:", error);
				if (error.response?.status === 403) {
					toast.error(error.response?.data?.message || "تم إيقاف حسابك. تواصل مع الإدارة");
				} else {
					toast.error("فشل تسجيل الدخول بجوجل. حاول مرة أخرى");
				}
			} finally {
				setIsGoogleLoading(false);
			}
		},
		onError: (error) => {
			console.error("Google OAuth error:", error);
			toast.error("فشل الاتصال بجوجل. حاول مرة أخرى");
			setIsGoogleLoading(false);
		},
	});

	const handleLogin = async (e) => {
		e.preventDefault();

		// Validate CAPTCHA
		if (!captchaToken) {
			toast.error('يرجى التحقق من أنك لست روبوت');
			return;
		}

		setIsLoading(true);

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/auth/login`,
				{
					...formData,
					captchaToken, // Send CAPTCHA token to backend
				}
			);

			toast.success("تم تسجيل الدخول بنجاح");
			const user = response.data.user;
			localStorage.setItem("user", JSON.stringify(response.data.user));
			localStorage.setItem("token", response.data.token);
			localStorage.setItem("tokenExpiry", Date.now() + 30 * 24 * 60 * 60 * 1000);

			setTimeout(() => {
				switch (user.type) {
					case "client":
						navigate("/home");
						break;
					case "employee":
						if (user.employeeDetails?.employeeType === "System Admin") {
							navigate("/admindashboard");
						} else {
							navigate("/employeedashboard");
						}
						break;
					case "admin":
						navigate("/admindashboard");
						break;
					default:
						navigate("/home");
				}
			}, 1500);
		} catch (error) {
			console.error("Error during login:", error);
			if (error.response?.status === 403) {
				toast.error(error.response?.data?.message || "تم إيقاف حسابك. تواصل مع الإدارة", {
					duration: 5000,
				});
			} else if (error.response?.status === 401) {
				toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
			} else if (error.response?.status === 400 && error.response?.data?.message?.includes('CAPTCHA')) {
				toast.error("التحقق الأمني فشل. يرجى المحاولة مرة أخرى");
				// Reset CAPTCHA on failure
				if (recaptchaRef.current) {
					recaptchaRef.current.reset();
					setCaptchaToken(null);
				}
			} else {
				toast.error(error.response?.data?.message || "فشل تسجيل الدخول");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex" dir="rtl">
			{/* Custom Styles for Animations */}
			<style>{`
				@keyframes float {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-15px); }
				}
				@keyframes float-reverse {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(15px); }
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
				@keyframes scale-in {
					from { opacity: 0; transform: scale(0.9); }
					to { opacity: 1; transform: scale(1); }
				}
				.animate-float { animation: float 6s ease-in-out infinite; }
				.animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
				.animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
				.animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
				.animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
				.animate-fade-in-right { animation: fade-in-right 0.8s ease-out forwards; }
				.animate-scale-in { animation: scale-in 0.6s ease-out forwards; }
			`}</style>

			{/* Left Side - Form */}
			<div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-white overflow-hidden relative">
				{/* Back to Home Link */}
				<Link 
					to="/" 
					className="absolute top-6 right-6 flex items-center gap-2 text-gray-500 hover:text-[#690000] transition-colors duration-300 group"
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

				<div className={`w-full max-w-md transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
					{/* Logo */}
					<div 
						className="text-center mb-8"
						style={{ 
							animation: isVisible ? 'fade-in-up 0.6s ease-out forwards' : 'none',
							opacity: 0 
						}}
					>
						<Link to="/">
							<img
								src="/src/assets/images/coloredLogo.svg"
								alt="النوران"
								className="h-28 mx-auto mb-6 hover:scale-110 transition-transform duration-300"
							/>
						</Link>
						<h1 className="text-3xl font-bold text-[#690000] mb-2">
							مرحباً بك مجدداً
						</h1>
						<p className="text-gray-500">
							سجل دخولك للوصول إلى حسابك
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleLogin} className="space-y-6">
						{/* Email Field */}
						<div 
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.1s forwards' : 'none',
								opacity: 0 
							}}
						>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								البريد الإلكتروني
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
									className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300"
									dir="ltr"
								/>
							</div>
						</div>

						{/* Password Field */}
						<div 
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.2s forwards' : 'none',
								opacity: 0 
							}}
						>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								كلمة المرور
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
									className="w-full pr-12 pl-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300"
									dir="ltr"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#690000] transition-colors duration-300"
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

						{/* Forgot Password */}
						<div 
							className="flex justify-start"
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.3s forwards' : 'none',
								opacity: 0 
							}}
						>
							<Link
								to="/forgetpassword"
								className="text-sm text-[#690000] hover:text-[#8B0000] font-medium transition-colors hover:underline"
							>
								نسيت كلمة المرور؟
							</Link>
						</div>

						{/* Google reCAPTCHA v2 */}
						<div 
							className="flex justify-center"
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.35s forwards' : 'none',
								opacity: 0 
							}}
						>
							<ReCAPTCHA
								ref={recaptchaRef}
								sitekey={import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY || 'YOUR_SITE_KEY'}
								onChange={(token) => {
									setCaptchaToken(token);
								}}
								onExpired={() => {
									setCaptchaToken(null);
									toast.error('انتهت صلاحية التحقق. يرجى المحاولة مرة أخرى');
								}}
								onErrored={() => {
									setCaptchaToken(null);
									toast.error('حدث خطأ في التحقق. يرجى المحاولة مرة أخرى');
								}}
								theme="light"
							/>
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
								{/* Shimmer Effect */}
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
								
								{isLoading ? (
									<span className="flex items-center justify-center gap-2 relative z-10">
										<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										جاري تسجيل الدخول...
									</span>
								) : (
									<span className="relative z-10">تسجيل الدخول</span>
								)}
							</button>
						</div>
					</form>

					{/* Divider */}
					<div 
						className="relative my-8"
						style={{ 
							animation: isVisible ? 'fade-in-up 0.6s ease-out 0.5s forwards' : 'none',
							opacity: 0 
						}}
					>
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-200"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-4 bg-white text-gray-500">أو</span>
						</div>
					</div>

					{/* Social Login Buttons */}
					<div 
						className="space-y-3"
						style={{ 
							animation: isVisible ? 'fade-in-up 0.6s ease-out 0.6s forwards' : 'none',
							opacity: 0 
						}}
					>
						<button
							type="button"
							onClick={() => googleLogin()}
							disabled={isGoogleLoading}
							className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#690000]/30 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isGoogleLoading ? (
								<>
									<svg className="animate-spin h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									<span className="text-gray-700 font-medium">جاري الاتصال بجوجل...</span>
								</>
							) : (
								<>
									<img src="/src/assets/images/googleIcon.png" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" onError={(e) => {
										e.target.onerror = null;
										e.target.src = "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";
									}} />
									<span className="text-gray-700 font-medium">المتابعة مع Google</span>
								</>
							)}
						</button>
					</div>

					{/* Register Link */}
					<p 
						className="text-center text-gray-600 mt-8"
						style={{ 
							animation: isVisible ? 'fade-in-up 0.6s ease-out 0.7s forwards' : 'none',
							opacity: 0 
						}}
					>
						ليس لديك حساب؟{" "}
						<Link
							to="/register"
							className="text-[#690000] hover:text-[#8B0000] font-bold transition-colors hover:underline"
						>
							إنشاء حساب جديد
						</Link>
					</p>
				</div>
			</div>

			{/* Right Side - Image/Branding */}
			<div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#690000] via-[#5a0000] to-[#4a0000] overflow-hidden items-center justify-center">
				{/* Animated Floating Elements */}
				<div className="absolute top-1/4 left-1/4 w-40 h-40 bg-[#1ba3b6] rounded-full filter blur-[100px] animate-pulse-glow"></div>
				<div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white rounded-full filter blur-[120px] opacity-10 animate-float-slow"></div>
				<div className="absolute top-1/2 right-1/3 w-32 h-32 bg-[#1ba3b6] rounded-full filter blur-[80px] animate-float-reverse opacity-30"></div>
				
				{/* Additional floating shapes */}
				<div className="absolute top-[15%] right-[20%] w-4 h-4 bg-white/30 rounded-full animate-float"></div>
				<div className="absolute top-[25%] left-[15%] w-3 h-3 bg-[#1ba3b6]/50 rounded-full animate-float-reverse"></div>
				<div className="absolute bottom-[30%] left-[25%] w-5 h-5 bg-white/20 rounded-full animate-float-slow"></div>
				<div className="absolute bottom-[20%] right-[30%] w-2 h-2 bg-[#1ba3b6]/40 rounded-full animate-float"></div>

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
						نوران سمارت
					</h2>
					<p className="text-white/80 text-lg max-w-sm leading-relaxed mb-10">
						نظامك المتكامل لإدارة الشحنات والتخليص الجمركي. سهولة في الإدارة وسرعة في الإنجاز.
					</p>

					{/* Stats */}
					<div className="flex gap-8">
						<div className="text-center group cursor-default">
							<div className="text-3xl font-bold text-[#1ba3b6] group-hover:scale-110 transition-transform">+10</div>
							<div className="text-white/60 text-sm">سنوات خبرة</div>
						</div>
						<div className="w-px bg-white/20"></div>
						<div className="text-center group cursor-default">
							<div className="text-3xl font-bold text-[#1ba3b6] group-hover:scale-110 transition-transform">+1000</div>
							<div className="text-white/60 text-sm">عميل سعيد</div>
						</div>
						<div className="w-px bg-white/20"></div>
						<div className="text-center group cursor-default">
							<div className="text-3xl font-bold text-[#1ba3b6] group-hover:scale-110 transition-transform">24/7</div>
							<div className="text-white/60 text-sm">دعم فني</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
