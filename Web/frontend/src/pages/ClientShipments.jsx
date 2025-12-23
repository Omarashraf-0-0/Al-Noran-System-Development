import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import { toast } from "react-hot-toast";

// Extracted Components
import ShipmentHero from "../components/client-shipments/ShipmentHero";
import ShipmentStats from "../components/client-shipments/ShipmentStats";
import ShipmentFilters from "../components/client-shipments/ShipmentFilters";
import ShipmentCard, { SkeletonCard, EmptyState } from "../components/client-shipments/ShipmentCard";

// Helpers & Translations
import { t } from "../constants/shipmentTranslations";
import { getStatusCategory } from "../utils/shipmentHelpers";

export default function ShipmentsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortOption, setSortOption] = useState("newest");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const rawName = user?.fullname || user?.username || t.labels.client;
  const displayName = rawName.split(' ').slice(0, 2).join(' ');
  const userID = user?.id || user?._id;
  const token = localStorage.getItem("token");

  // Fetch Logic
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        if (!userID) return;

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/shipments/user/${userID}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const formatted = (response.data || []).map((s) => ({
          id: s._id,
          code: s.shipmentCode || s.acid || t.labels.na,
          acid: s.acid,
          bl: s.number46 || s.shipmentNumber || t.labels.na,
          status: s.status || "pending", // Keep internal status raw for logic, map on display
          client: s.employerName || t.labels.client,
          date: new Date(s.createdAt), 
          updatedAt: new Date(s.updatedAt || s.createdAt),
          dateStr: new Date(s.createdAt).toLocaleDateString("ar-EG", {
            day: "numeric", month: "long", year: "numeric"
          }),
          port: s.port_name || t.labels.na,
          type: s.shipmentType || "sea"
        }));

        setShipments(formatted);
      } catch (err) {
        console.error(err);
        toast.error(t.errorGeneric);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, [userID, token]);

  // Filter & Sort Logic
  let filtered = shipments.filter(s => {
    const matchesSearch = s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.bl.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedStatus === "All") return matchesSearch;
    return matchesSearch && getStatusCategory(s.status) === selectedStatus;
  });

  filtered.sort((a, b) => {
    if (sortOption === "newest") return b.date - a.date;
    if (sortOption === "oldest") return a.date - b.date;
    if (sortOption === "last_updated") return b.updatedAt - a.updatedAt;
    if (sortOption === "status") return a.status.localeCompare(b.status);
    return 0;
  });

  // Stats
  const stats = {
    total: shipments.length,
    active: shipments.filter(s => getStatusCategory(s.status) === "Active").length,
    completed: shipments.filter(s => getStatusCategory(s.status) === "Completed").length,
    pending: shipments.filter(s => getStatusCategory(s.status) === "Pending").length,
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#690000] selection:text-white relative" dir="rtl">
      
      {/* 🌍 Global Background (Fixed) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Base Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-[#eef2f6]"></div>

          {/* World Map Watermark */}
          <div className="absolute top-[10%] left-0 w-full h-full opacity-[0.03] bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-no-repeat bg-center bg-contain mix-blend-multiply filter contrast-125"></div>

          {/* Soft Ambient Orbs */}
          <div className="absolute top-[-20%] right-[-10%] w-[900px] h-[900px] bg-[#690000]/5 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#1BA3B6]/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex-grow flex flex-col">
        <Header />

        <div className="w-full max-w-6xl mx-auto px-6 pt-12 pb-20 flex-grow">
          
          {/* 🏆 Central Dashboard Card (Wrapper) */}
          <ShipmentHero displayName={displayName}>

             <ShipmentStats 
                stats={stats} 
                loading={loading} 
                setSelectedStatus={setSelectedStatus} 
             />
          </ShipmentHero>

          {/* 🎛️ Control Bar */}
          <ShipmentFilters 
            selectedStatus={selectedStatus} 
            setSelectedStatus={setSelectedStatus} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            sortOption={sortOption} 
            setSortOption={setSortOption} 
          />

          {/* 📦 List Content */}
          <div>
            {loading ? (
               <div className="grid gap-5">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
               </div>
            ) : filtered.length === 0 ? (
               <EmptyState />
            ) : (
               <div className="grid gap-5">
                   {filtered.map(shipment => (
                       <ShipmentCard key={shipment.id} shipment={shipment} />
                   ))}
               </div>
            )}
          </div>

        </div>
        <Footer />
      </div>
    </div>
  );
}

function Inbox({ className, size }) {
	return (
		<svg 
			xmlns="http://www.w3.org/2000/svg" 
			width={size} 
			height={size} 
			viewBox="0 0 24 24" 
			fill="none" 
			stroke="currentColor" 
			strokeWidth="2" 
			strokeLinecap="round" 
			strokeLinejoin="round" 
			className={className}
		>
			<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
			<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
		</svg>
	);
}
