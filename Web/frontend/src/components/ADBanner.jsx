import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

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
    seaCurrent: 100,
    airCurrent: 100,
    customsCompleted: 100,
    pendingInvoices: 100,
    approvedInvoices: 100,
    revenueEGP: 100,
    revenueUSD: 100,
    totalPayments: 100,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setTimeout(() => setLoading(false), 400);
      } catch (err) {
        console.error("Failed to load stats:", err);
        setLoading(false);
      }
    };

    loadStats();
  }, []);

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
