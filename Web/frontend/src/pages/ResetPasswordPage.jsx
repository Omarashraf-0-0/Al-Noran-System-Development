import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import ResetPasswordForm from "../components/ResetPasswordForm";

const ResetPasswordPage = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// Check if email and token exist in location.state
	useEffect(() => {
		if (!location.state?.email || !location.state?.token) {
			toast.error("جلسة غير صالحة. الرجاء المحاولة مرة أخرى.");
			navigate("/forgetpassword");
		}
	}, [location.state, navigate]);

	const handleResetPassword = async (data) => {
		try {
			// TODO: Uncomment when backend API is ready
			/*
			const response = await fetch("http://localhost:3500/api/auth/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: data.email,
					token: location.state.token,
					newPassword: data.password,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success("تم تغيير كلمة المرور بنجاح!");
				navigate("/login");
			} else {
				toast.error(result.message || "فشل في تغيير كلمة المرور");
			}
			*/

			// Temporary success message for testing
			console.log("Reset password data:", {
				email: data.email,
				token: location.state?.token,
				password: data.password,
			});
			
			toast.success("تم تغيير كلمة المرور بنجاح!");
			
			// Navigate to login page after successful reset
			setTimeout(() => {
				navigate("/login");
			}, 2000);
			
		} catch (error) {
			console.error("Error resetting password:", error);
			toast.error("حدث خطأ. الرجاء المحاولة مرة أخرى.");
		}
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
