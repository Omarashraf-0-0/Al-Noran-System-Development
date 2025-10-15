import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import ResetPasswordForm from "../components/ResetPasswordForm";

const ResetPasswordPage = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// Check if email exists in location.state
	useEffect(() => {
		if (!location.state?.email) {
			toast.error("جلسة غير صالحة. الرجاء المحاولة مرة أخرى.");
			navigate("/forgetpassword");
		}
	}, [location.state, navigate]);

	const handleResetPassword = (data) => {
		console.log("Reset password attempt:", data);
		console.log("API URL:", import.meta.env.VITE_API_URL);
		
		// Reset password with backend
		axios
			.patch(`${import.meta.env.VITE_API_URL}/api/otp/resetPassword`, {
				email: data.email,
				newPassword: data.password,
			})
			.then((response) => {
				console.log("Password reset successfully:", response.data);
				toast.success("تم تغيير كلمة المرور بنجاح!");
				// Navigate to login page after successful reset
				setTimeout(() => {
					navigate("/login");
				}, 2000);
			})
			.catch((error) => {
				console.error("Error resetting password:", error);
				const errorMsg = error.response?.data?.msg || "حدث خطأ. الرجاء المحاولة مرة أخرى.";
				toast.error(errorMsg);
			});
	};

	return (
		<>
			<Navbar />
			<BackgroundContainer>
				<FormContainer>
					<ResetPasswordForm
						onSubmit={handleResetPassword}
						email={location.state?.email}
					/>
				</FormContainer>
			</BackgroundContainer>
		</>
	);
};

export default ResetPasswordPage;
