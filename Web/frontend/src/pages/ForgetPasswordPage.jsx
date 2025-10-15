import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import ForgetPasswordForm from "../components/ForgetPasswordForm";
import { toast } from "react-hot-toast";
import axios from "axios";


const ForgetPasswordPage = () => {
    const navigate = useNavigate();
    
    const handleForgotPassword = (formData) => {
        console.log("Forgot password attempt:", formData);
        console.log("API URL:", import.meta.env.VITE_API_URL);
        
        // TODO: Add your forgot password API call here when backend is ready
        // Example:
        // try {
        //     const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        //         email: formData.email
        //     });
        //     
        //     if (response.data.success) {
        //         toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
        //         navigate("/verify-otp", { state: { email: formData.email } });
        //     }
        // } catch (error) {
        //     toast.error(error.response?.data?.message || "فشل في إرسال رمز التحقق");
        // }

        // For now, navigate directly to OTP page (remove this when implementing backend)
        toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
        navigate("/verify-otp", { state: { email: formData.email } });
    };

	return (
		<>
			<Navbar />
			<BackgroundContainer>
				<FormContainer>
					<ForgetPasswordForm onSubmit={handleForgotPassword} />
				</FormContainer>
			</BackgroundContainer>
		</>
	);
};

export default ForgetPasswordPage;
