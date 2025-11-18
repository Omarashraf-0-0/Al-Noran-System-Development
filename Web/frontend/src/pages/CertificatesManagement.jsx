import React, { useState, useEffect } from "react";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import bannerPic from "../assets/images/Untitled design (8) 2.png"; 
import searchIcon from "../assets/images/search.svg";

export default function CertificatesUI() {
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState("");

  // --------------------------------------
  // Fetch Certificates (using mock data)
  // --------------------------------------
  const fetchCertificates = async () => {
    try {
      const mockCertificates = [
        {
          id: 1,
          certificateNumber: "CERT-2024-001",
          employeeName: "أميرة علي",
          stage: "قيد المراجعة",
          type: "بحري",
        },
        {
          id: 2,
          certificateNumber: "CERT-2024-002",
          employeeName: "محمد محمود",
          stage: "مكتمل",
          type: "جوي",
        },
        {
          id: 3,
          certificateNumber: "CERT-2024-003",
          employeeName: "خالد علاء",
          stage: "قيد التجهيز",
          type: "بحري",
        },
        {
          id: 4,
          certificateNumber: "CERT-2024-004",
          employeeName: "جهاد إبراهيم",
          stage: "مرفوض",
          type: "جوي",
        },
      ];

      setCertificates(mockCertificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  // --------------------------------------
  // FILTER certificates
  // --------------------------------------
  const filteredCertificates = certificates.filter((cert) =>
    cert.certificateNumber.toLowerCase().includes(search.toLowerCase()) ||
    cert.employeeName.toLowerCase().includes(search.toLowerCase())
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
        الشهادات
      </h2>

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-xl">
          <input
            type="text"
            placeholder="البحث بالكود / اسم الموظف"
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

      {/* Certificates Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="text-gray-700 border-b bg-gray-100">
              <th className="py-3">رقم الشهادة</th>
              <th className="py-3">الموظف المسؤول</th>
              <th className="py-3">المرحلة</th>
              <th className="py-3">النوع</th>
              <th className="py-3">عرض كل التفاصيل</th>
            </tr>
          </thead>

          <tbody>
            {filteredCertificates.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-gray-500">
                  لا يوجد شهادات مطابقة لبحثك
                </td>
              </tr>
            ) : (
              filteredCertificates.map((cert) => (
                <tr key={cert.id} className="border-b text-gray-700">
                  <td className="py-3">{cert.certificateNumber}</td>
                  <td className="py-3">{cert.employeeName}</td>
                  <td className="py-3">{cert.stage}</td>
                  <td className="py-3">{cert.type}</td>
                  <td className="py-3">
                    <button
                      onClick={() =>
                        console.log("Show certificate details:", cert.id)
                      }
                      className="text-[#1BA3B6] underline cursor-pointer"
                    >
                      عرض كل التفاصيل
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
