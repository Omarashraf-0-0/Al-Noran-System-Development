import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const ForgetPasswordPage = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!email.trim()) {
			toast.error("يرجى إدخال البريد الإلكتروني");
			return;
		}

		setIsLoading(true);

		try {
			await axios.post(`${import.meta.env.VITE_API_URL}/api/otp/forgotPassword`, {
				email: email,
			});
			toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
			navigate("/verify-otp", { state: { email } });
		} catch (error) {
			console.error("Error:", error);
			toast.error("حدث خطأ: تأكد من البريد الإلكتروني");
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
			<div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-white overflow-hidden relative">
				{/* Back to Login Link */}
				<Link 
					to="/login" 
					className="absolute top-6 right-6 flex items-center gap-2 text-gray-500 hover:text-[#690000] transition-colors duration-300 group"
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
								src="/images/coloredLogo.svg"
								alt="النوران"
								className="h-28 mx-auto mb-6 hover:scale-110 transition-transform duration-300"
							/>
						</Link>
						<h1 className="text-3xl font-bold text-[#690000] mb-2">
							نسيت كلمة المرور؟
						</h1>
						<p className="text-gray-500">
							أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-6">
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
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="example@email.com"
									required
									className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#690000]/20 focus:border-[#690000] focus:bg-white transition-all duration-300"
									dir="ltr"
								/>
							</div>
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
										جاري الإرسال...
									</span>
								) : (
									<span className="relative z-10">إرسال رمز التحقق</span>
								)}
							</button>
						</div>
					</form>

					{/* Footer */}
					<p 
						className="text-center text-gray-600 mt-8"
						style={{ 
							animation: isVisible ? 'fade-in-up 0.6s ease-out 0.3s forwards' : 'none',
							opacity: 0 
						}}
					>
						تذكرت كلمة المرور؟{" "}
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
						src="/images/white logo.svg"
						alt="النوران"
						className="h-44 mb-10 drop-shadow-2xl animate-float-slow"
					/>
					<h2 className="text-4xl font-bold text-white mb-4">
						استعادة الحساب
					</h2>
					<p className="text-white/80 text-lg max-w-sm leading-relaxed mb-8">
						لا تقلق! سنساعدك في استعادة الوصول إلى حسابك بخطوات بسيطة وآمنة.
					</p>

					{/* Steps */}
					<div className="space-y-4 text-right w-full max-w-xs">
						{[
							{ num: "1", text: "أدخل بريدك الإلكتروني", active: true },
							{ num: "2", text: "استلم رمز التحقق", active: false },
							{ num: "3", text: "أنشئ كلمة مرور جديدة", active: false },
						].map((step, index) => (
							<div key={index} className={`flex items-center gap-4 ${step.active ? "text-white" : "text-white/50"}`}>
								<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.active ? "bg-[#1ba3b6]" : "bg-white/20"}`}>
									{step.num}
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

export default ForgetPasswordPage;
