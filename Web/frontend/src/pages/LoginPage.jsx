import React from "react";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import LoginForm from "../components/LoginForm";

const LoginPage = () => {
	const handleLogin = (formData) => {
		console.log("Login attempt:", formData);
		// Add your login logic here
		// e.g., API call to authenticate user
	};

	const handleForgotPassword = () => {
		console.log("Forgot password clicked");
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
