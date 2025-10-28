import React from "react";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import RegisterForm from "../components/RegisterForm";
import { toast } from "react-hot-toast";
import axios from "axios";

const RegisterPage = () => {
	const handleRegister = (formData) => {
		console.log("Register attempt:", formData);
		console.log("API URL:", import.meta.env.VITE_API_URL);

		// Transform formData to match backend schema
		const registrationData = {
			fullname: formData.fullname,
			username: formData.username,
			phone: formData.phone,
			email: formData.email,
			password: formData.password,
			type: "client", // Backend expects 'client' or 'employee'
			clientDetails: {
				clientType: formData.type, // 'personal', 'commercial', or 'factory'
				ssn: formData.ssn || "", // SSN is optional for non-personal accounts
			},
		};

		console.log("Transformed data:", registrationData);

		axios
			.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, registrationData)
			.then((response) => {
				console.log("Registration successful:", response.data);
				toast.success("تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...");
				
				// Save token and user info
				localStorage.setItem("token", response.data.token);
				localStorage.setItem("user", JSON.stringify(response.data.user));
				
				// Redirect to upload documents page after 2 seconds
				setTimeout(() => {
					window.location.href = "/upload-documents";
				}, 2000);
			})
			.catch((error) => {
				console.error("Error during registration:", error);
				const errorMessage = error.response?.data?.message || "فشل في إنشاء الحساب. الرجاء المحاولة مرة أخرى.";
				toast.error(errorMessage);
			});
	};

	return (
		<>
			<Navbar />
			<BackgroundContainer>
				<FormContainer>
					<RegisterForm onSubmit={handleRegister} />
				</FormContainer>
			</BackgroundContainer>
		</>
	);
};

export default RegisterPage;
