import React, { useState } from "react";
import { Search, Filter } from "lucide-react";

const shipments = [
  {
    id: 1,
    clientName: "اسم العميل",
    shipmentNo: "AIR-0005",
    status: "في انتظار رقم ACID",
    date: "منذ 29 يوم",
  },
  {
    id: 2,
    clientName: "اسم العميل",
    shipmentNo: "AIR-0005",
    status: "في انتظار رقم ACID",
    date: "منذ 29 يوم",
  },
  {
    id: 3,
    clientName: "اسم العميل",
    shipmentNo: "AIR-0005",
    status: "في انتظار رقم ACID",
    date: "منذ 29 يوم",
  },
  // Add more as needed
];

export default function ShipmentsList() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredShipments = shipments.filter((shipment) =>
    shipment.shipmentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-right text-red-800 mb-6">شحناتي</h1>

        {/* Search & Filter */}
        <div className="flex flex-row-reverse items-center justify-between mb-6">
          <div className="flex items-center space-x-2 space-x-reverse">
            <button className="flex items-center gap-1 text-red-800 font-medium">
              <Filter className="w-5 h-5" />
              <span>فلتر</span>
            </button>
          </div>

          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="ابحث برقم الشحنة"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-full py-2 px-4 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-separate border-spacing-y-3">
            <thead>
              <tr className="text-gray-600 text-sm">
                <th>اسم العميل</th>
                <th>رقم البوليصة</th>
                <th>الحالة</th>
                <th>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => (
                <tr
                  key={shipment.id}
                  className="bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col text-sm">
                      <span>{shipment.clientName}</span>
                      <span className="text-gray-500 text-xs">
                        {shipment.date}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{shipment.shipmentNo}</td>
                  <td className="py-3 px-4">
                    <span className="bg-cyan-100 text-cyan-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {shipment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-blue-700 font-medium hover:underline cursor-pointer">
                    عرض كل التفاصيل
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


