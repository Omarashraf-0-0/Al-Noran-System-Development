import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import coloredLogo from "../assets/images/coloredLogo.svg";
import whiteLogo from "../assets/images/white logo.svg";
import { useTheme } from "../context/ThemeContext";

const ResetPasswordPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
	const email = location.state?.email || "";

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
		if (!email) {
			toast.error("جلسة غير صالحة. الرجاء المحاولة مرة أخرى.");
			navigate("/forgetpassword", { replace: true });
		}
	}, [email, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (password.length < 6) {
			toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("كلمة المرور وتأكيدها غير متطابقين");
			return;
		}

		setIsLoading(true);

		try {
			await axios.patch(`${import.meta.env.VITE_API_URL}/api/otp/resetPassword`, {
				email,
				newPassword: password,
			});
			toast.success("تم تغيير كلمة المرور بنجاح!");
			setTimeout(() => navigate("/login"), 2000);
		} catch (error) {
			console.error("Error:", error);
			toast.error(error.response?.data?.msg || "حدث خطأ. الرجاء المحاولة مرة أخرى.");
		} finally {
			setIsLoading(false);
		}
	};

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
			<div className={`w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 overflow-hidden relative transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"}`}>
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className={`absolute top-6 left-6 p-2 rounded-full transition-all duration-300 z-50 ${
                        isDarkMode 
                            ? "bg-white/10 text-yellow-400 hover:bg-white/20" 
                            : "bg-gray-100 text-[#690000] hover:bg-gray-200"
                    }`}
                    aria-label="تبديل الوضع الليلي"
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
								src={isDarkMode ? whiteLogo : coloredLogo}
								alt="النوران"
								className="h-28 mx-auto mb-6 hover:scale-110 transition-transform duration-300"
							/>
						</Link>
						<h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-[#690000]"}`}>
							إنشاء كلمة مرور جديدة
						</h1>
						<p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
							أدخل كلمة المرور الجديدة لحسابك
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-5">
						{/* New Password */}
						<div
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.1s forwards' : 'none',
								opacity: 0 
							}}
						>
							<label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
								كلمة المرور الجديدة
							</label>
							<div className="relative group">
								<div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									required
									minLength={6}
									className={`w-full pr-12 pl-12 py-4 border rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] transition-all duration-300 ${
                                        isDarkMode 
                                            ? "bg-[#1a1a1a] border-white/10 text-white focus:bg-[#202020]" 
                                            : "bg-gray-50 border-gray-200 text-gray-800 focus:bg-white"
                                    }`}
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
						<div
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.2s forwards' : 'none',
								opacity: 0 
							}}
						>
							<label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
								تأكيد كلمة المرور
							</label>
							<div className="relative group">
								<div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#690000] transition-colors">
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
									</svg>
								</div>
								<input
									type={showConfirmPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="••••••••"
									required
									className={`w-full pr-12 pl-12 py-4 border rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] transition-all duration-300 ${
                                        isDarkMode 
                                            ? "bg-[#1a1a1a] border-white/10 text-white focus:bg-[#202020]" 
                                            : "bg-gray-50 border-gray-200 text-gray-800 focus:bg-white"
                                    }`}
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
							{/* Password Match Indicator */}
							{confirmPassword && (
								<p className={`text-sm mt-2 flex items-center gap-1 ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}>
									{password === confirmPassword ? (
										<>
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
											كلمة المرور متطابقة
										</>
									) : (
										<>
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
											</svg>
											كلمة المرور غير متطابقة
										</>
									)}
								</p>
							)}
						</div>

						<div
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.3s forwards' : 'none',
								opacity: 0 
							}}
						>
							<button
								type="submit"
								disabled={isLoading || password !== confirmPassword || password.length < 6}
								className="w-full py-4 bg-[#690000] hover:bg-[#8B0000] text-white font-bold rounded-xl shadow-lg hover:shadow-[#690000]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
							>
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
								{isLoading ? (
									<span className="flex items-center justify-center gap-2 relative z-10">
										<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										جاري التحديث...
									</span>
								) : (
									<span className="relative z-10">تحديث كلمة المرور</span>
								)}
							</button>
						</div>
					</form>

					{/* Footer */}
					<p 
						className={`text-center mt-8 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}
						style={{ 
							animation: isVisible ? 'fade-in-up 0.6s ease-out 0.4s forwards' : 'none',
							opacity: 0 
						}}
					>
						<Link
							to="/login"
							className={`font-bold transition-colors hover:underline ${isDarkMode ? "text-red-400 hover:text-red-300" : "text-[#690000] hover:text-[#8B0000]"}`}
						>
							العودة لتسجيل الدخول
						</Link>
					</p>
				</div>
			</div>

			{/* Right Side - Branding */}
			<div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#690000] via-[#5a0000] to-[#4a0000] overflow-hidden items-center justify-center">
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
						خطوة أخيرة!
					</h2>
					<p className="text-white/80 text-lg max-w-sm leading-relaxed mb-8">
						أنشئ كلمة مرور قوية وآمنة لحماية حسابك. تأكد من اختيار كلمة مرور يصعب تخمينها.
					</p>

					{/* Steps */}
					<div className="space-y-4 text-right w-full max-w-xs">
						{[
							{ num: "1", text: "أدخل بريدك الإلكتروني", done: true },
							{ num: "2", text: "استلم رمز التحقق", done: true },
							{ num: "3", text: "أنشئ كلمة مرور جديدة", active: true },
						].map((step, index) => (
							<div key={index} className={`flex items-center gap-4 ${step.active ? "text-white" : step.done ? "text-[#1ba3b6]" : "text-white/50"}`}>
								<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.active ? "bg-[#1ba3b6]" : step.done ? "bg-[#1ba3b6]" : "bg-white/20"}`}>
									{step.done && !step.active ? "✓" : step.num}
								</div>
								<span>{step.text}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ResetPasswordPage;
