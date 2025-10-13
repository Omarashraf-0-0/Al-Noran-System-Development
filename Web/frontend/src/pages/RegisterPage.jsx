import React from "react";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import RegisterForm from "../components/RegisterForm";

const RegisterPage = () => {
	const handleRegister = (formData) => {
		console.log("Register attempt:", formData);
		// Add your registration logic here
		// e.g., API call to register user
		// Example: registerUser(formData).then(response => { ... })
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
