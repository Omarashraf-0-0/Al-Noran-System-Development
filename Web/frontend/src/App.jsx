import React from "react";
import { Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgetPasswordPage from "./pages/ForgetPasswordPage";
import OTPPage from "./pages/OTPPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { toast } from "react-hot-toast";

const App = () => {
	return (
		<>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/forgetpassword" element={<ForgetPasswordPage />} />
				<Route path="/verify-otp" element={<OTPPage />} />
				<Route path="/resetpassword" element={<ResetPasswordPage />} />
			</Routes>
		</>
	);
};

export default App;
