import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import SupportDashboard from "./pages/SupportDashboard";
import AcidRequestsPage from "./pages/AcidRequestsPage";
import AcidRequestDetailsPage from "./pages/AcidRequestDetailsPage";
import EditAcidRequestPage from "./pages/EditAcidRequestPage";
import EmployeeAcidRequestsPage from "./pages/EmployeeAcidRequestsPage";
import EmployeeShipments from "./pages/EmployeeShipments";
import ShipmentsManagement from "./pages/ShipmentsManagement";
import ShipmentHistory from "./pages/ShipmentHistory";
import MyCustomers from "./pages/MyCustomers";
import ShipmentChatPage from "./pages/ShipmentChatPage";
import ClientProfilePage from "./pages/ClientProfilePage";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import AdminProfilePage from "./pages/AdminProfilePage";

// Admin Route Protection Component
const AdminRoute = ({ children }) => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type;
	const employeeType = user?.employeeDetails?.employeeType;

	// Check if user is System Admin or admin type
	const isAdmin =
		userType === "admin" ||
		(userType === "employee" && employeeType === "System Admin");

	if (!isAdmin) {
		// Redirect non-admins to home or login
		if (!userType) {
			return <Navigate to="/login" replace />;
		}
		return <Navigate to="/home" replace />;
	}

	return children;
};

// Employee Route Protection Component (allows employees and admins)
const EmployeeRoute = ({ children }) => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type;

	// Check if user is employee or admin
	const isEmployee = userType === "employee" || userType === "admin";

	if (!isEmployee) {
		// Redirect non-employees to home or login
		if (!userType) {
			return <Navigate to="/login" replace />;
		}
		return <Navigate to="/home" replace />;
	}

	return children;
};

// Client Route Protection Component (only clients can access)
const ClientRoute = ({ children }) => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type;

	// Check if user is a client
	const isClient = userType === "client";

	if (!isClient) {
		// Redirect non-clients to appropriate page
		if (!userType) {
			return <Navigate to="/login" replace />;
		}
		// Redirect employees/admins to their dashboard
		if (userType === "employee") {
			const employeeType = user?.employeeDetails?.employeeType;
			if (employeeType === "System Admin") {
				return <Navigate to="/admindashboard" replace />;
			}
			return <Navigate to="/employeedashboard" replace />;
		}
		if (userType === "admin") {
			return <Navigate to="/admindashboard" replace />;
		}
		return <Navigate to="/login" replace />;
	}

	return children;
};

// Auth Route Protection Component (any logged-in user can access)
const AuthRoute = ({ children }) => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type;

	if (!userType) {
		return <Navigate to="/login" replace />;
	}

	return children;
};

// Smart Profile Route Component
const ProfileRoute = () => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const userType = user?.type;
	const employeeType = user?.employeeDetails?.employeeType;

	if (userType === "client") {
		return <ClientProfilePage />;
	} else if (userType === "employee") {
		// System Admin gets AdminProfilePage, other employees get EmployeeProfilePage
		if (employeeType === "System Admin") {
			return <AdminProfilePage />;
		}
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
				<Route
					path="/home"
					element={
						<ClientRoute>
							<TrackingPage />
						</ClientRoute>
					}
				/>
				<Route
					path="/profile"
					element={
						<AuthRoute>
							<ProfileRoute />
						</AuthRoute>
					}
				/>
				<Route
					path="/acidrequest"
					element={
						<ClientRoute>
							<ACIDRequestPage />
						</ClientRoute>
					}
				/>
				<Route
					path="/acidrequests"
					element={
						<ClientRoute>
							<AcidRequestsPage />
						</ClientRoute>
					}
				/>
				<Route
					path="/acidrequest/:requestId"
					element={
						<ClientRoute>
							<AcidRequestDetailsPage />
						</ClientRoute>
					}
				/>
				<Route
					path="/acidrequest/:requestId/edit"
					element={
						<ClientRoute>
							<EditAcidRequestPage />
						</ClientRoute>
					}
				/>
				<Route
					path="/upload-documents"
					element={
						<ClientRoute>
							<DocumentUploadPage />
						</ClientRoute>
					}
				/>
				<Route
					path="/employeedashboard"
					element={
						<EmployeeRoute>
							<EmployeeDashboard />
						</EmployeeRoute>
					}
				/>
				<Route
					path="/shipmentstatus/:shipmentId"
					element={
						<ClientRoute>
							<ShipmentStatus />
						</ClientRoute>
					}
				/>
				<Route
					path="/employee-shipment/:shipmentId"
					element={
						<EmployeeRoute>
							<EmployeeShipmentManagement />
						</EmployeeRoute>
					}
				/>
				<Route
					path="/client-shipments"
					element={
						<ClientRoute>
							<ClientShipments />
						</ClientRoute>
					}
				/>
				<Route
					path="/admindashboard"
					element={
						<AdminRoute>
							<AdminDashboard />
						</AdminRoute>
					}
				/>
				<Route
					path="/EmployeeNotifications"
					element={
						<EmployeeRoute>
							<EmployeeNotifications />
						</EmployeeRoute>
					}
				/>
				<Route
					path="/employeemanagement"
					element={
						<AdminRoute>
							<EmployeeManagement />
						</AdminRoute>
					}
				/>
				<Route
					path="/customermanagement"
					element={
						<AdminRoute>
							<CustomerManagement />
						</AdminRoute>
					}
				/>
				<Route
					path="/certificatesmanagement"
					element={
						<AdminRoute>
							<CertificatesManagement />
						</AdminRoute>
					}
				/>
				<Route
					path="/shipmentsmanagement"
					element={
						<AdminRoute>
							<ShipmentsManagement />
						</AdminRoute>
					}
				/>
				<Route
					path="/chat"
					element={
						<AuthRoute>
							<Chat />
						</AuthRoute>
					}
				/>
				<Route
					path="/support-dashboard"
					element={
						<EmployeeRoute>
							<SupportDashboard />
						</EmployeeRoute>
					}
				/>
				<Route
					path="/my-customers"
					element={
						<EmployeeRoute>
							<MyCustomers />
						</EmployeeRoute>
					}
				/>
				<Route
					path="/shipment-chat/:shipmentId"
					element={
						<ClientRoute>
							<ShipmentChatPage />
						</ClientRoute>
					}
				/>
				<Route
					path="/employee/acid-requests"
					element={
						<EmployeeRoute>
							<EmployeeAcidRequestsPage />
						</EmployeeRoute>
					}
				/>
				<Route
					path="/employee-shipments"
					element={
						<EmployeeRoute>
							<EmployeeShipments />
						</EmployeeRoute>
					}
				/>
				<Route
					path="/shipment-history/:shipmentId"
					element={
						<EmployeeRoute>
							<ShipmentHistory />
						</EmployeeRoute>
					}
				/>
				<Route
					path="/admin-shipment/:shipmentId"
					element={
						<AdminRoute>
							<AdminShipmentManagement />
						</AdminRoute>
					}
				/>
				{/* NEW */}
				{/* <Route path="/welcomebanner" element={<WelcomeBanner />} /> */}
				<Route path="*" element={<NotFound404 />} />
			</Routes>
		</div>
	);
};

export default App;
