import React from "react";
import { Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgetPasswordPage from "./pages/ForgetPasswordPage";
import OTPPage from "./pages/OTPPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { toast } from "react-hot-toast";
import LandingPage from "./pages/LandingPage";
import NotFound404 from "./pages/NotFound404";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import WelcomeBanner from "./pages/WelcomeBanner";
import ShipmentStatus from "./pages/ShipmentStatus";

const App = () => {
	return (
		<>
			<Routes>
				<Route path="/" element={<LandingPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/forgetpassword" element={<ForgetPasswordPage />} />
				<Route path="/verify-otp" element={<OTPPage />} />
				<Route path="/resetpassword" element={<ResetPasswordPage />} />
				<Route path="/home" element={<HomePage />} />
				<Route path="/employeedashboard" element={<EmployeeDashboard />} />
				<Route path="/shipmentstatus" element={<ShipmentStatus />} />
				<Route path="/welcomebanner" element={<WelcomeBanner />} />
				
				<Route path="*" element={<NotFound404 />} />
			</Routes>
		</>
	);
};

export default App;
