import React, { useState, useEffect } from "react";
import OTPInput from "./OTPInput";
import Spacer from "./Spacer";
import Button from "./Button";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const OTPForm = ({ onSubmit, email }) => {
	const [otp, setOtp] = useState("");
	const [isResending, setIsResending] = useState(false);
	const [attempts, setAttempts] = useState(0);
	const [resendCount, setResendCount] = useState(0);
	const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
	const [isExpired, setIsExpired] = useState(false);

	const MAX_ATTEMPTS = 5;
	const MAX_RESENDS = 3;
	const OTP_VALIDITY = 300; // 5 minutes

	// Timer countdown
	useEffect(() => {
		if (timeRemaining <= 0) {
			setIsExpired(true);
			toast.error("انتهت صلاحية الرمز. يرجى إعادة الإرسال.");
			return;
		}

		const timer = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev <= 1) {
					setIsExpired(true);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [timeRemaining]);

	// Format time as MM:SS
	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		// Check if OTP is expired
		if (isExpired) {
			toast.error("انتهت صلاحية الرمز. يرجى إعادة الإرسال.");
			return;
		}

		// Check if maximum attempts reached
		if (attempts >= MAX_ATTEMPTS) {
			toast.error("لقد تجاوزت الحد الأقصى للمحاولات. يرجى إعادة إرسال الرمز.");
			return;
		}

		// Validate OTP is complete
		if (otp.length !== 5) {
			toast.error("يرجى إدخال الرمز المكون من 5 أرقام");
			return;
		}

		// Increment attempts
		setAttempts((prev) => prev + 1);

		if (onSubmit) {
			onSubmit({ otp, email });
		}
	};

	const handleResendOTP = async () => {
		// Check if maximum resends reached
		if (resendCount >= MAX_RESENDS) {
			toast.error("لقد تجاوزت الحد الأقصى لإعادة الإرسال (3 مرات)");
			return;
		}

		setIsResending(true);

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/otp/forgotPassword`,
				{ email }
			);

			toast.success("تم إعادة إرسال الرمز بنجاح");

			// Reset state
			setOtp("");
			setAttempts(0);
			setTimeRemaining(OTP_VALIDITY);
			setIsExpired(false);
			setResendCount((prev) => prev + 1);
		} catch (error) {
			console.error("Error resending OTP:", error);
			toast.error("فشل إعادة إرسال الرمز");
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="w-full">
			<Spacer size="md" />
			<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center text-[#690000]">
				التحقق من الرمز
			</h2>
			<p className="text-sm sm:text-base text-gray-600 text-center mb-2">
				أدخل الرمز المكون من 5 أرقام المرسل إلى
			</p>
			{email && (
				<p className="text-sm sm:text-base text-[#690000] font-medium text-center mb-6">
					{email}
				</p>
			)}

			{/* Timer and Status Info */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<svg
							className="w-5 h-5 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span className="text-sm font-medium text-blue-800">
							الوقت المتبقي: {formatTime(timeRemaining)}
						</span>
					</div>
					{isExpired && (
						<span className="text-xs font-bold text-red-600">
							منتهية الصلاحية
						</span>
					)}
				</div>
				<div className="text-xs text-gray-600 space-y-1 text-right">
					<p>• رمز التحقق صالح لمدة 5 دقائق فقط</p>
					<p>
						• لديك {MAX_ATTEMPTS - attempts} محاولة متبقية من أصل {MAX_ATTEMPTS}
					</p>
					<p>
						• يمكنك إعادة إرسال الرمز {MAX_RESENDS - resendCount} مرات من أصل{" "}
						{MAX_RESENDS}
					</p>
				</div>
			</div>

			<Spacer size="lg" />

			<form onSubmit={handleSubmit} className="w-full">
				<OTPInput
					length={5}
					value={otp}
					onChange={setOtp}
					disabled={isExpired || attempts >= MAX_ATTEMPTS}
				/>

				<Spacer size="lg" />

				{attempts >= MAX_ATTEMPTS && !isExpired && (
					<div className="text-center mb-4">
						<p className="text-sm text-red-600 font-medium">
							لقد تجاوزت الحد الأقصى للمحاولات. يرجى إعادة إرسال الرمز.
						</p>
					</div>
				)}

				<div className="flex items-center justify-center w-full">
					<Button
						type="submit"
						size="full"
						disabled={otp.length !== 5 || isExpired || attempts >= MAX_ATTEMPTS}
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
					disabled={isResending || resendCount >= MAX_RESENDS}
					className="text-sm sm:text-base text-[#690000] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isResending
						? "جاري الإرسال..."
						: `إعادة إرسال الرمز (${MAX_RESENDS - resendCount} متبقية)`}
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
