import React from "react";
import AuthNavbar from "../components/AuthNavbar";
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
			email: formData.email,
			password: formData.password,
		};

		axios
			.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, loginData)
			.then((response) => {
				console.log("Login successful:", response.data);
				toast.success("تم تسجيل الدخول بنجاح");
				const user = response.data.user;
				localStorage.setItem("user", JSON.stringify(response.data.user));
				localStorage.setItem("token", response.data.token);
				localStorage.setItem(
					"tokenExpiry",
					Date.now() + 30 * 24 * 60 * 60 * 1000
				); // 30 days expiry
				// console.log(localStorage.getItem("token"));
				// we need to wait a bit before redirecting
				setTimeout(() => {
					// Route based on user type
					switch (user.type) {
						case "client":
							window.location.href = "/home";
							break;
						case "employee":
							// Check if employee is System Admin
							if (user.employeeDetails?.employeeType === "System Admin") {
								window.location.href = "/admindashboard";
							} else {
								window.location.href = "/employeedashboard";
							}
							break;
						case "admin":
							window.location.href = "/admindashboard";
							break;
						default:
							window.location.href = "/home";
					}
				}, 2000);
			})
			.catch((error) => {
				console.error("Error during login:", error);

				// Check if it's a suspension or account deactivation error
				if (error.response?.status === 403) {
					const errorMessage =
						error.response?.data?.message || error.response?.data?.error;
					// Show the specific suspension/deactivation message
					toast.error(errorMessage || "تم إيقاف حسابك. تواصل مع الإدارة", {
						duration: 5000,
						style: {
							background: "#FEE2E2",
							color: "#991B1B",
							fontSize: "16px",
							fontWeight: "bold",
						},
					});
				} else if (error.response?.status === 401) {
					toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
				} else {
					const errorMessage =
						error.response?.data?.message || error.response?.data?.error;
					toast.error(
						errorMessage ||
							"فشل تسجيل الدخول. رجاءً تحقق من بياناتك وحاول مرة أخرى."
					);
				}
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
			<AuthNavbar />
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
