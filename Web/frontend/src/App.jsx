import React from "react";
import { Routes, Route } from "react-router";
import TrackingPage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgetPasswordPage from "./pages/ForgetPasswordPage";
import OTPPage from "./pages/OTPPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LandingPage from "./pages/LandingPage";
import ACIDRequestPage from "./pages/ACIDRequestPage";
import DocumentUploadPage from "./pages/DocumentUploadPage";
import NotFound404 from "./pages/NotFound404";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ShipmentStatus from "./pages/ShipmentStatus";
import ClientShipments from "./pages/ClientShipments";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeNotifications from "./pages/EmployeeNotifications";
import EmployeeManagement from "./pages/EmployeeManagement";
const App = () => {
	return (
		<div>
			<Routes>
				<Route path="/" element={<LandingPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/forgetpassword" element={<ForgetPasswordPage />} />
				<Route path="/verify-otp" element={<OTPPage />} />
				<Route path="/resetpassword" element={<ResetPasswordPage />} />
				<Route path="/home" element={<TrackingPage />} />
				<Route path="/acidrequest" element={<ACIDRequestPage />} />
				<Route path="/upload-documents" element={<DocumentUploadPage />} />
				<Route path="/employeedashboard" element={<EmployeeDashboard />} />
				<Route path="/shipmentstatus/:shipmentId" element={<ShipmentStatus />} />
				<Route path="/client-shipments" element={<ClientShipments />} />
				<Route path="/admindashboard" element={<AdminDashboard />} />
				<Route path="/EmployeeNotifications" element={<EmployeeNotifications />} />
				<Route path="/employeemanagement" element={<EmployeeManagement />} />
				<Route path="*" element={<NotFound404 />} />
			</Routes>
		</div>
	);
};

export default App;
