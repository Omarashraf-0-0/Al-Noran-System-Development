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
        
        // Send email to backend to generate and send OTP
        axios
            .post(`${import.meta.env.VITE_API_URL}/api/otp/forgotPassword`, {
                email: formData.email
            })
            .then((response) => {
                console.log("تم إرسال رمز التحقق إلى بريدك الإلكتروني", response.data);
                toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
                navigate("/verify-otp", { state: { email: formData.email } });
            })
            .catch((error) => {
                console.error("حدث خطأ أثناء إرسال رمز التحقق:", error);
                console.error("ستجابة خطأ:", error.response);
                
                // Show specific error message
                let errorMsg2 = " حدث خطأ: تأكد من البريد الإلكتروني";
				let errorMsg;
                if (error.response?.data?.msg) {
                    errorMsg = error.response.data.msg;
                } else if (error.response?.data?.error) {
                    errorMsg = error.response.data.error;
                } else if (error.message) {
                    errorMsg = error.message;
                }
                toast.error(errorMsg2);
            });
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
