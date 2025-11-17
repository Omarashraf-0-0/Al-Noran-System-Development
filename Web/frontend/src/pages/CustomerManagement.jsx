import React, { useState, useEffect } from "react";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import bannerPic from "../assets/images/Untitled design (8) 2.png";
import searchIcon from "../assets/images/search.svg";

export default function CustomerUI() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  // --------------------------------------
  // Backend API placeholder (edit later)
  // --------------------------------------
  const fetchCustomers = async () => {
    try {
      // 🚀 Replace this with your actual backend endpoint
      // const res = await fetch("https://your-backend.com/api/customers");
      // const data = await res.json();
      // setCustomers(data);

      // Temporary mock data (remove later)
const mockData = [
  {
    id: 1,
    name: "كريم علي",
    shipmentType: "Air",
    phoneNumber: "0123456789",
  },
  {
    id: 2,
    name: "سما محمود",
    shipmentType: "Sea",
    phoneNumber: "0123987789",

  },
  {
    id: 3,
    name: "ليلى علاء",
    shipmentType: "Air",
    phoneNumber: "0112233445",

  },
];


      setCustomers(mockData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers(); // load customers on page load
  }, []);

  // --------------------------------------
  // FILTER customers by search text
  // --------------------------------------
  const filteredCustomers = customers.filter((cust) =>
    cust.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
      <AdminHeader />

      {/* Welcome Message */}     
      <h1 className="text-4xl font-bold text-[#690000] text-right mb-8 mt-8 px-16">
        مرحباً ، اسم المدير !
      </h1>

      {/* Banner */}
      <div className="flex justify-center mb-10">
        <img
          src={bannerPic}
          alt="admin illustration"
          className="w-[350px] md:w-[450px] lg:w-[550px] object-contain"
        />
      </div>

      {/* Section Title */}
      <h2 className="text-4xl font-bold text-[#690000] text-right my-8 px-16">
        العملاء
      </h2>

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-xl">
          <input
            type="text"
            placeholder="البحث برقم الشحنه / اسم العميل"
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-600 rounded-full py-2 pr-4 pl-10 text-right focus:outline-none focus:ring-2 focus:ring-[#6B0F1A]"
          />

          <img
            src={searchIcon}
            alt="search icon"
            className="absolute left-4 top-2.5 w-5 h-5 opacity-100"
          />
        </div>
      </div>

      {/* Employees Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="text-gray-700 border-b bg-gray-100">
              <th className="py-3">اسم العميل</th>
              <th className="py-3">نوع الشحنه</th>
              <th className="py-3">رقم التيليفون</th>
              <th className="py-3">عرض كل الشهادات</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-6 text-gray-500">
                  لا يوجد عملاء مطابقون لبحثك
                </td>
              </tr>
            ) : (
              filteredCustomers.map((cust) => (
<tr key={cust.id} className="border-b text-gray-700">
  <td className="py-3">{cust.name}</td>
  <td className="py-3">{cust.shipmentType}</td>
  <td className="py-3">{cust.phoneNumber}</td>
  <td className="py-3">
      <button
    onClick={() => console.log("Show customer certificates")}
    className="text-[#1BA3B6] underline cursor-pointer"
  >
    عرض كل الشهادات
  </button>
  </td>
</tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      
<div className="mt-16">
  <Footer />
</div>

    </div>

  );
}
