import React, { useState, useEffect } from "react";
import AdminHeader from "../components/AdminHeader";
import ADBanner from "../components/ADBanner";
import RevenueComparison from "../components/RevenueComparison";
import MostActiveCustomers from "../components/MostActiveCustomers";
import Footer from "../components/Footer";


export default function AdminDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
      <AdminHeader />
      <ADBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 mt-8 mb-10">

        <div className="bg-white p-4 rounded-2xl shadow">
          <MostActiveCustomers />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <RevenueComparison />
        </div>
      </div>

     <Footer />
    </div>
  );
}
