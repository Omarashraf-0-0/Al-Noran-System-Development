import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import coloredLogo from "../assets/images/coloredLogo.svg";
import whiteLogo from "../assets/images/white logo.svg";
import { useTheme } from "../context/ThemeContext";

const OTPPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
	const email = location.state?.email || "";

	const [otp, setOtp] = useState(["", "", "", "", ""]); // 5 digits
	const [isLoading, setIsLoading] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [resendTimer, setResendTimer] = useState(60);
	const inputRefs = useRef([]);

	useEffect(() => {
		setIsVisible(true);
		if (!email) {
			toast.error("يرجى إدخال البريد الإلكتروني أولاً");
			navigate("/forgetpassword", { replace: true });
		}
	}, [email, navigate]);

	// Resend timer countdown
	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [resendTimer]);

	const handleChange = (index, value) => {
		if (value.length > 1) return;

		const newOtp = [...otp];
		newOtp[index] = value;
		setOtp(newOtp);

		// Auto-focus next input
		if (value && index < 4) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index, e) => {
		if (e.key === "Backspace" && !otp[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").slice(0, 5);
		const newOtp = [...otp];
		for (let i = 0; i < pastedData.length; i++) {
			if (/^\d$/.test(pastedData[i])) {
				newOtp[i] = pastedData[i];
			}
		}
		setOtp(newOtp);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const otpString = otp.join("");

		if (otpString.length !== 5) {
			toast.error("يرجى إدخال رمز التحقق كاملاً");
			return;
		}

		setIsLoading(true);

		try {
			await axios.post(`${import.meta.env.VITE_API_URL}/api/otp/verifyOTP`, {
				email,
				otp: otpString,
			});
			toast.success("تم التحقق من الرمز بنجاح!");
			navigate("/resetpassword", { state: { email } });
		} catch (error) {
			console.error("Error:", error);
			toast.error("رمز التحقق غير صحيح");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResend = async () => {
		if (resendTimer > 0) return;

		try {
			await axios.post(`${import.meta.env.VITE_API_URL}/api/otp/forgotPassword`, {
				email,
				otp: otpString,
			});
			toast.success("تم إرسال رمز جديد");
			setResendTimer(60);
			setOtp(["", "", "", "", ""]);
		} catch (error) {
			toast.error("فشل إرسال الرمز");
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
				{/* Back Link */}
				<Link 
					to="/forgetpassword" 
					className={`absolute top-6 right-6 flex items-center gap-2 transition-colors duration-300 group ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-[#690000]"}`}
					style={{ 
						animation: isVisible ? 'fade-in-up 0.6s ease-out forwards' : 'none',
						opacity: 0 
					}}
				>
					<svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
					</svg>
					<span className="font-medium">العودة</span>
				</Link>

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
							أدخل رمز التحقق
						</h1>
						<p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
							تم إرسال رمز مكون من 5 أرقام إلى
						</p>
						<p className="text-[#690000] font-semibold mt-1" dir="ltr">
							{email}
						</p>
					</div>

					{/* OTP Form */}
					<form onSubmit={handleSubmit} className="space-y-6">
						<div 
							className="flex justify-center gap-3 md:gap-4" 
							dir="ltr"
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.1s forwards' : 'none',
								opacity: 0 
							}}
						>
							{otp.map((digit, index) => (
								<input
									key={index}
									ref={(el) => (inputRefs.current[index] = el)}
									type="text"
									inputMode="numeric"
									maxLength={1}
									value={digit}
									onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ""))}
									onKeyDown={(e) => handleKeyDown(index, e)}
									onPaste={handlePaste}
									className={`w-14 h-16 md:w-16 md:h-20 text-center text-3xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] transition-all duration-300 ${
                                        isDarkMode 
                                            ? "bg-[#1a1a1a] border-white/10 text-white focus:bg-[#202020]" 
                                            : "bg-gray-50 border-gray-200 text-gray-800 focus:bg-white"
                                    }`}
								/>
							))}
						</div>

						<div
							style={{ 
								animation: isVisible ? 'fade-in-up 0.6s ease-out 0.2s forwards' : 'none',
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
										جاري التحقق...
									</span>
								) : (
									<span className="relative z-10">تأكيد الرمز</span>
								)}
							</button>
						</div>
					</form>

					{/* Resend */}
					<div 
						className="text-center mt-8"
						style={{ 
							animation: isVisible ? 'fade-in-up 0.6s ease-out 0.3s forwards' : 'none',
							opacity: 0 
						}}
					>
						{resendTimer > 0 ? (
							<p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
								إعادة الإرسال بعد <span className="text-[#690000] font-bold">{resendTimer}</span> ثانية
							</p>
						) : (
							<button
								onClick={handleResend}
								className="text-[#690000] hover:underline font-semibold"
							>
								إعادة إرسال الرمز
							</button>
						)}
					</div>
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
						تحقق من هويتك
					</h2>
					<p className="text-white/80 text-lg max-w-sm leading-relaxed mb-8">
						أدخل الرمز المرسل إلى بريدك الإلكتروني للتأكد من هويتك ومتابعة استعادة الحساب.
					</p>

					{/* Steps */}
					<div className="space-y-4 text-right w-full max-w-xs">
						{[
							{ num: "1", text: "أدخل بريدك الإلكتروني", active: false, done: true },
							{ num: "2", text: "استلم رمز التحقق", active: true },
							{ num: "3", text: "أنشئ كلمة مرور جديدة", active: false },
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

export default OTPPage;
