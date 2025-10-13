import React from "react";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import RegisterForm from "../components/RegisterForm";
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
			.post(`${import.meta.env.VITE_API_URL}/users`, registrationData)
			.then((response) => {
				console.log("Registration successful:", response.data);
			})
			.catch((error) => {
				console.error("Error during registration:", error);
			});
		// show the message of the success or failure using
		// redirect me to the login page
		window.location.href = "/login";
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
