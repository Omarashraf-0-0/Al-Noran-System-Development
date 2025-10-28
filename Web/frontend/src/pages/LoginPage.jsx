import React from "react";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import LoginForm from "../components/LoginForm";
import { toast } from "react-hot-toast";
import axios from "axios";

const LoginPage = () => {
	const handleLogin = (formData) => {
		console.log("Login attempt:", formData);
		console.log("API URL:", import.meta.env.VITE_API_URL);

		const loginData = {
			identifier: formData.email, // Backend expects 'identifier' field
			password: formData.password,
		};

		axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, loginData)
			.then((response) => {
				console.log("Login successful:", response.data);
				toast.success("تم تسجيل الدخول بنجاح");
				localStorage.setItem("user", JSON.stringify(response.data.user));
				localStorage.setItem("token", response.data.token);
				// we need to wait to abit before redirecting
				setTimeout(() => {
					// TODO: Change to /dashboard when dashboard is ready
					window.location.href = "/upload-documents";
				}, 2000);
			})
			.catch((error) => {
				console.error("Error during login:", error);
				toast.error("فشل تسجيل الدخول. رجاءً تحقق من بياناتك وحاول مرة أخرى.");
			});
		// show the message of the success or failure using
		// redirect me to the home page
	};

	const handleForgotPassword = () => {
		// console.log("Forgot password clicked");
		// Add your forgot password logic here
		// e.g., navigate to forgot password page or show modal
	};

	return (
		<>
			<Navbar />
			<BackgroundContainer>
				<FormContainer>
					<LoginForm
						onSubmit={handleLogin}
						onForgotPassword={handleForgotPassword}
					/>
				</FormContainer>
			</BackgroundContainer>
		</>
	);
};

export default LoginPage;
