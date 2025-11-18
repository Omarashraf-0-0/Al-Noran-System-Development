import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "react-hot-toast";

import bannerPic from "../assets/images/Untitled design (8) 2.png";
import contract from "../assets/images/contract(1).png";
import flight from "../assets/images/flight.png";
import paid from "../assets/images/paid.png";
import directionsBoat from "../assets/images/directions_boat.png";

const StatCard = ({ value, label, icon }) => (
  <div className="bg-white rounded-lg shadow-md p-4 w-full flex items-center justify-between">
    <div className="flex-shrink-0 ml-4">
      <img src={icon} alt="stat icon" className="w-8 h-8" />
    </div>

    <div className="text-right flex-1">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

StatCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  icon: PropTypes.string,
};

const DashboardStatsWelcome = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const adminName = user?.username || user?.fullname || user?.name || "المدير";

  const [stats, setStats] = useState({
    seaCurrent: 0,
    airCurrent: 0,
    customsCompleted: 0,
    pendingInvoices: 0,
    approvedInvoices: 0,
    revenueEGP: 0,
    revenueUSD: 0,
    totalPayments: 0,
  });

  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/shipments/get-dashboard-stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;
        console.log("Dashboard stats:", data);

        setStats({
          seaCurrent: data.ongoingSeaShipments || 0,
          airCurrent: data.ongoingAirShipments || 0,
          customsCompleted: data.completedShipments || 0,
          pendingInvoices: data.ongoingInvoices || 0,
          approvedInvoices: data.completedInvoices || 0,
          revenueEGP: data.poundRevenue || 0,
          revenueUSD: data.dollarRevenue || 0,
          totalPayments: data.totalPayments || 0,
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to load stats:", err);
        toast.error("فشل تحميل الإحصائيات");
        setLoading(false);
      }
    };

    if (token) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [token]);

  const show = (v) => (loading ? "..." : v);

  const icons = [
    directionsBoat,
    flight,
    contract,
    contract,
    contract,
    paid,
    paid,
    paid,
  ];

  const labels = [
    "عدد الشهادات الجارية البحرية",
    "عدد الشهادات الجارية الجوية",
    "عدد الشهادات المكتملة جمركياً",
    "عدد الفواتير المعلّقة",
    "عدد الفواتير المعتمدة",
    "إجمالي الإيرادات بالجنيه",
    "إجمالي الإيرادات بالدولار",
    "إجمالي المدفوعات",
  ];

  return (
    <section className="flex flex-col items-center py-8 px-4">

      <div className="w-full max-w-6xl mb-4 text-right">
        <h1 className="text-2xl font-bold text-red-800">مرحباً، {adminName}!</h1>
      </div>

      <div className="w-full max-w-6xl bg-[#6B0F1A] rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center items-center mb-6">
          <img
            src={bannerPic}
            alt="Banner"
            className="w-[450px] md:w-[550px] lg:w-[650px] max-h-[400px] rounded-lg object-contain"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {labels.map((label, i) => (
            <StatCard
              key={i}
              label={label}
              value={show(Object.values(stats)[i])}
              icon={icons[i]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardStatsWelcome;
