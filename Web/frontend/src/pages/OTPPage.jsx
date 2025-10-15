import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import OTPForm from "../components/OTPForm";
import { toast } from "react-hot-toast";
import axios from "axios";

const OTPPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	
	// Get email from location state (passed from ForgetPasswordPage)
	const email = location.state?.email || "";

	// Redirect to forget-password if no email
	React.useEffect(() => {
		if (!email) {
			toast.error("يرجى إدخال البريد الإلكتروني أولاً");
			navigate("/forgetpassword", { replace: true });
		}
	}, [email, navigate]);

	const handleVerifyOTP = (formData) => {
		console.log("OTP verification attempt:", formData);
		console.log("API URL:", import.meta.env.VITE_API_URL);
		
		// Verify OTP with backend
		axios
			.post(`${import.meta.env.VITE_API_URL}/api/otp/verifyOTP`, {
				email: formData.email,
				otp: formData.otp
			})
			.then((response) => {
				console.log("OTP verified successfully:", response.data);
				toast.success("تم التحقق من الرمز بنجاح!");
				// Navigate to reset password page
				navigate("/resetpassword", { state: { email: formData.email } });
			})
			.catch((error) => {
				console.error("Error verifying OTP:", error);
				const errorMsg = "فشل التحقق من الرمز";
				toast.error(errorMsg);
			});
	};

	return (
		<>
			<Navbar />
			<BackgroundContainer>
				<FormContainer>
					<OTPForm onSubmit={handleVerifyOTP} email={email} />
				</FormContainer>
			</BackgroundContainer>
		</>
	);
};

export default OTPPage;
