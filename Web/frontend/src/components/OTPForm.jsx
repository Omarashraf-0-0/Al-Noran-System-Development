import React, { useState } from "react";
import OTPInput from "./OTPInput";
import Spacer from "./Spacer";
import Button from "./Button";
import { Link } from "react-router-dom";

const OTPForm = ({ onSubmit, email }) => {
	const [otp, setOtp] = useState("");
	const [isResending, setIsResending] = useState(false);

	const handleSubmit = (e) => {
		e.preventDefault();
		
		// Validate OTP is complete
		if (otp.length !== 6) {
			// You can add toast notification here
			return;
		}

		if (onSubmit) {
			onSubmit({ otp, email });
		}
	};

	const handleResendOTP = async () => {
		setIsResending(true);
		// Add resend OTP logic here when backend is ready
		// Example: await axios.post('/api/auth/resend-otp', { email });
		
		setTimeout(() => {
			setIsResending(false);
			// Show success toast
		}, 1000);
	};

	return (
		<div className="w-full">
			<Spacer size="md" />
			<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center text-[#690000]">
				التحقق من الرمز
			</h2>
			<p className="text-sm sm:text-base text-gray-600 text-center mb-2">
				أدخل الرمز المكون من 6 أرقام المرسل إلى
			</p>
			{email && (
				<p className="text-sm sm:text-base text-[#690000] font-medium text-center mb-6">
					{email}
				</p>
			)}
			<Spacer size="lg" />
			
			<form onSubmit={handleSubmit} className="w-full">
				<OTPInput
					length={6}
					value={otp}
					onChange={setOtp}
				/>
				
				<Spacer size="lg" />
				
				<div className="flex items-center justify-center w-full">
					<Button 
						type="submit" 
						size="full"
						disabled={otp.length !== 6}
					>
						تأكيد
					</Button>
				</div>
			</form>
			
			<Spacer size="md" />
			
			<div className="text-center">
				<p className="text-sm sm:text-base text-gray-600 mb-2">
					لم تستلم الرمز؟
				</p>
				<button
					type="button"
					onClick={handleResendOTP}
					disabled={isResending}
					className="text-sm sm:text-base text-[#690000] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isResending ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
				</button>
			</div>
			
			<Spacer size="sm" />
			
			<div className="text-center">
				<Link 
					to="/forgetpassword" 
					className="text-sm sm:text-base text-[#690000] hover:underline"
				>
					العودة للخلف
				</Link>
			</div>
		</div>
	);
};

export default OTPForm;
