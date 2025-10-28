import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WelcomeBanner from "./WelcomeBanner";
import quickReorderIcon from "../assets/images/quick_reorder.png";
import filterListIcon from "../assets/images/filter_list.png"; 
import filterAltIcon from "../assets/images/filter_alt.png"; 
import searchIcon from "../assets/images/Search.svg"; 
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ShipmentsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const user = JSON.parse(localStorage.getItem("user"));
  const userID = user?.id;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userID) {
          setError("User ID not found. Please login again.");
          toast.error("User ID not found. Please login again.");
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/shipments/employee/${userID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Fetched shipments:", response.data);

        const formattedShipments = (response.data || []).map((shipment) => ({
          id: shipment._id,
          clientName: shipment.employerName || "Unknown Client",
          shipmentNo: shipment.number46 || shipment.shipmentNumber || "N/A",
          status: shipment.status || "pending",
          date: new Date(shipment.createdAt).toLocaleDateString("ar-EG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        }));

        setShipments(formattedShipments);
        
        if (formattedShipments.length === 0) {
          toast("لا توجد شحنات");
        }
      } catch (error) {
        console.error("Error fetching shipments:", error);
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            "Failed to fetch shipments";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [userID, token]);

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
    setIsSortOpen(false);
  };
  const toggleSort = () => {
    setIsSortOpen(!isSortOpen);
    setIsFilterOpen(false);
  };

  const filteredShipments = shipments.filter((shipment) =>
    shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
      <Header />
      <WelcomeBanner />

      <section className="flex-grow w-full bg-white py-12 px-8 shadow-inner relative">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-right text-red-800 mb-8">
            شحناتي
          </h1>

          {/* 🔍 Search + Filter + Sort */}
          <div className="flex items-center justify-center mb-8 gap-4 relative">
            {/* Left side — Filter + Sort */}
            <div className="flex items-center gap-3">
              {/* Filter Button */}
              <button
                onClick={toggleFilter}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  isFilterOpen
                    ? "bg-red-800 text-white px-3 py-1 rounded-md"
                    : "text-red-800"
                }`}
              >
                <img
                  src={filterAltIcon}
                  alt="Filter"
                  className="w-5 h-5 object-contain"
                />
                تصفية
              </button>

              {/* Sort Button */}
              <button
                onClick={toggleSort}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  isSortOpen
                    ? "bg-red-800 text-white px-3 py-1 rounded-md"
                    : "text-red-800"
                }`}
              >
                <img
                  src={filterListIcon}
                  alt="Sort"
                  className="w-5 h-5 object-contain"
                />
                ترتيب
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-1/2">
              <input
                type="text"
                placeholder="ابحث برقم الشحنة"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white shadow-md rounded-full py-2 px-4 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400 text-black"
              />
              <img
                src={searchIcon}
                alt="Search"
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              />
            </div>

            {/* 🧩 Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute top-14 left-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
                <h4 className="font-semibold text-red-800 mb-3">
                  تصفية حسب:
                </h4>
                <select className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700">
                  <option>الحالة</option>
                  <option>اسم العميل</option>
                  <option>نوع الشحنة</option>
                </select>
                <button className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition">
                  تطبيق
                </button>
              </div>
            )}

            {/* 🧩 Sort Dropdown */}
            {isSortOpen && (
              <div className="absolute top-14 left-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
                <h4 className="font-semibold text-red-800 mb-3">
                  ترتيب حسب:
                </h4>
                <select className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700">
                  <option>الأحدث أولاً</option>
                  <option>الأقدم أولاً</option>
                  <option>العميل (أ-ي)</option>
                </select>
                <button className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition">
                  تطبيق
                </button>
              </div>
            )}
          </div>

          {/* 📦 Shipments Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12 gap-4">
              <div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
              <span className="text-gray-600 text-lg">جاري تحميل الشحنات...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-right">
              <p className="text-red-800 font-medium mb-3">❌ حدث خطأ: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                إعادة محاولة
              </button>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">لا توجد شحنات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-separate border-spacing-y-3">
                <tbody>
                  {filteredShipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="bg-gray-100 hover:bg-gray-200 rounded-xl transition text-right"
                    >
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-700 text-base font-semibold">
                            {shipment.clientName}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {shipment.date}
                          </span>
                        </div>
                      </td>

                      {/* <td className="py-3 px-4 align-top">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-700 text-base font-semibold mb-1">
                            رقم البوليصة
                          </span>
                        </div>
                      </td> */}

                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-col text-sm">
                          <span className="font-semibold text-gray-800">
                            {shipment.shipmentNo}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <span
                          className="bg-blue-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center justify-center gap-2 w-fit"
                          style={{ color: "#690000" }}
                        >
                          <img
                            src={quickReorderIcon}
                            alt="status icon"
                            className="w-4 h-4"
                          />
                          {shipment.status}
                        </span>
                      </td>
                    
                      <td className="py-3 px-4 align-top">
                        <a href={`/shipmentstatus/${shipment.acid}`}>
                          <span className="text-blue-600 text-sm font-medium underline cursor-pointer">
                            عرض كل التفاصيل
                          </span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
