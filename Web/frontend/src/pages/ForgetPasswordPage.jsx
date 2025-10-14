import React from "react";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import ForgetPasswordForm from "../components/ForgetPasswordForm";
import { toast } from "react-hot-toast";
import axios from "axios";


const ForgetPasswordPage = () => {
    const handleForgotPassword = (formData) => {
        console.log("Forgot password attempt:", formData);
        console.log("API URL:", import.meta.env.VITE_API_URL);
        // Add your forgot password logic here
        // e.g., send a password reset email
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
