import react from "react";
import AdminHeader from "../components/AdminHeader";
import EmployeeAlert from "../components/EmployeeAlert";
import Footer from "../components/Footer";


export default function EmployeeNotifications() {
    return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
     <AdminHeader />
     <EmployeeAlert />
     <Footer />
    </div>

);
}