import React from "react";
import { Routes, Route } from "react-router-dom";
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
import CustomerManagement from "./pages/CustomerManagement";
import EmployeeShipmentManagement from "./pages/EmployeeShipmentManagement";
import CertificatesManagement from "./pages/CertificatesManagement";
import AdminShipmentManagement from "./pages/AdminShipmentManagement";
import Chat from "./pages/Chat";
import AcidRequestsPage from "./pages/AcidRequestsPage";
import AcidRequestDetailsPage from "./pages/AcidRequestDetailsPage";
import EditAcidRequestPage from "./pages/EditAcidRequestPage";
import EmployeeAcidRequestsPage from "./pages/EmployeeAcidRequestsPage";
import EmployeeShipments from "./pages/EmployeeShipments";
import ShipmentsManagement from "./pages/ShipmentsManagement";
import ShipmentHistory from "./pages/ShipmentHistory";
import ClientProfilePage from "./pages/ClientProfilePage";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import AdminProfilePage from "./pages/AdminProfilePage";

// Smart Profile Route Component
const ProfileRoute = () => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type;

	if (userType === "client") {
		return <ClientProfilePage />;
	} else if (userType === "employee") {
		return <EmployeeProfilePage />;
	} else if (userType === "admin") {
		return <AdminProfilePage />;
	}
	// Default to employee profile if type not found
	return <EmployeeProfilePage />;
};

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
				<Route path="/profile" element={<ProfileRoute />} />
				<Route path="/acidrequest" element={<ACIDRequestPage />} />
				<Route path="/acidrequests" element={<AcidRequestsPage />} />
				<Route
					path="/acidrequest/:requestId"
					element={<AcidRequestDetailsPage />}
				/>
				<Route
					path="/acidrequest/:requestId/edit"
					element={<EditAcidRequestPage />}
				/>
				<Route path="/acidrequests" element={<AcidRequestsPage />} />
				<Route
					path="/acidrequest/:requestId"
					element={<AcidRequestDetailsPage />}
				/>
				<Route path="/upload-documents" element={<DocumentUploadPage />} />
				<Route path="/employeedashboard" element={<EmployeeDashboard />} />
				<Route
					path="/shipmentstatus/:shipmentId"
					element={<ShipmentStatus />}
				/>
				<Route
					path="/employee-shipment/:shipmentId"
					element={<EmployeeShipmentManagement />}
				/>
				<Route
					path="/admin-shipment/:shipmentId"
					element={<AdminShipmentManagement />}
				/>
				<Route path="/client-shipments" element={<ClientShipments />} />
				<Route path="/admindashboard" element={<AdminDashboard />} />
				<Route
					path="/EmployeeNotifications"
					element={<EmployeeNotifications />}
				/>
				<Route path="/employeemanagement" element={<EmployeeManagement />} />
				<Route path="/customermanagement" element={<CustomerManagement />} />
				<Route
					path="/certificatesmanagement"
					element={<CertificatesManagement />}
				/>
				<Route path="/shipmentsmanagement" element={<ShipmentsManagement />} />
				<Route path="*" element={<NotFound404 />} />
				<Route path="/chat" element={<Chat />} />
				<Route
					path="/employee/acid-requests"
					element={<EmployeeAcidRequestsPage />}
				/>
				<Route path="/employee-shipments" element={<EmployeeShipments />} />
				<Route
					path="/shipment-history/:shipmentId"
					element={<ShipmentHistory />}
				/>
				{/* NEW */}
				{/* <Route path="/welcomebanner" element={<WelcomeBanner />} /> */}
			</Routes>
		</div>
	);
};

export default App;
