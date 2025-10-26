import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WelcomeBanner from "./WelcomeBanner";
import quickReorderIcon from "../assets/images/quick_reorder.png";
import filterListIcon from "../assets/images/filter_list.png"; 
import filterAltIcon from "../assets/images/filter_alt.png"; 
import searchIcon from "../assets/images/Search.svg"; 

const shipments = [
  {
    id: 1,
    clientName: "اسم العميل",
    shipmentNo: "AIR-0005",
    status: "في انتظار رقم ACID",
    date: "بتاريخ 29 اكتوبر",
  },
  {
    id: 2,
    clientName: "اسم العميل",
    shipmentNo: "AIR-0006",
    status: "في انتظار رقم ACID",
    date: "بتاريخ 14 اكتوبر",
  },
  {
    id: 3,
    clientName: "اسم العميل",
    shipmentNo: "AIR-0007",
    status: "في انتظار رقم ACID",
    date: "بتاريخ 5 أكتوبر",
  },
  {
    id: 4,
    clientName: "اسم العميل",
    shipmentNo: "AIR-0008",
    status: "في انتظار رقم ACID",
    date: "بتاريخ 4 أكتوبر",
  },
  {
    id: 5,
    clientName: "اسم العميل",
    shipmentNo: "AIR-0009",
    status: "في انتظار رقم ACID",
    date: "بتاريخ 1 أكتوبر",
  },
];

export default function ShipmentsList() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredShipments = shipments.filter((shipment) =>
    shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <Header />

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Main Section  */}
      <section className="flex-grow w-full bg-white py-12 px-8 shadow-inner">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-right text-red-800 mb-8">
            شحناتي
          </h1>

{/* 🔍 Search + Filter + Sort */}
<div className="flex items-center justify-center mb-8 gap-4">
  {/* Left side — Filter + Sort */}
  <div className="flex items-center gap-3">
    <button className="flex items-center gap-2 text-red-800 font-medium">
      <img
        src={filterAltIcon}
        alt="Filter"
        className="w-5 h-5 object-contain"
      />
    </button>

    <button className="flex items-center gap-2 text-red-800 font-medium">
      <img
        src={filterListIcon}
        alt="Sort"
        className="w-5 h-5 object-contain"
      />
    </button>
  </div>

  {/* Search Bar (centered) */}
  <div className="relative w-1/2">
    <input
      type="text"
      placeholder="ابحث برقم الشحنة"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full bg-white shadow-md rounded-full py-2 px-4 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
    />
    <img
      src={searchIcon}
      alt="Search"
      className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
    />
  </div>
</div>




          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-separate border-spacing-y-3">
              <tbody>
                {filteredShipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    className="bg-gray-100 hover:bg-gray-200 rounded-xl transition text-right"
                  >
                    {/* Client Name */}
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

                    {/* Policy Number */}
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-col text-sm">
                        <span className="text-gray-700 text-base font-semibold mb-1">
                          رقم البوليصة
                        </span>
                      </div>
                    </td>

                    {/* Shipment ID */}
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-col text-sm">
                        <span className="font-semibold text-gray-800">
                          {shipment.shipmentNo}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
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

                    {/* Details Link */}
                    <td className="py-3 px-4 align-top">
                      <span className="text-blue-600 text-sm font-medium underline cursor-pointer">
                        عرض كل التفاصيل
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
