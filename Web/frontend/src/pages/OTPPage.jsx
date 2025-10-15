import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import OTPForm from "../components/OTPForm";
import { toast } from "react-hot-toast";

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
		
		// TODO: Add OTP verification logic here when backend is ready
		// Example:
		// try {
		//     const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
		//         email: formData.email,
		//         otp: formData.otp
		//     });
		//     
		//     if (response.data.success) {
		//         toast.success("تم التحقق بنجاح!");
		//         navigate("/reset-password", { state: { email: formData.email, token: response.data.token } });
		//     }
		// } catch (error) {
		//     toast.error(error.response?.data?.message || "فشل التحقق من الرمز");
		// }

		// For now, just show success message (remove this when implementing backend)
		toast.success("تم التحقق من الرمز بنجاح!");
		
		// Navigate to reset password page
		// When backend is ready, include the token: { email, token: response.data.token }
		navigate("/resetpassword", { state: { email: formData.email, token: "temporary-token" } });
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
