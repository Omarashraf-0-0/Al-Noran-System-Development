import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WelcomeBanner from "./WelcomeBanner";
import searchIcon from "../assets/images/Search.svg";
import filterListIcon from "../assets/images/filter_list.png";
import filterAltIcon from "../assets/images/filter_alt.png";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

const AcidRequestsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [acidRequests, setAcidRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAcidRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          setError("الرجاء تسجيل الدخول");
          toast.error("الرجاء تسجيل الدخول");
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/acid`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Fetched ACID requests:", response.data);

        const formattedRequests = (response.data || []).map((request) => ({
          id: request._id,
          acidCode: request.acidCode || "قيد المعالجة",
          supplierName: request.supplier?.name || "غير محدد",
          customsItem: request.goods?.customsItem || "غير محدد",
          weight: request.goods?.weight || 0,
          status: request.status || "pending",
          requestDate: new Date(request.requestDate || request.createdAt).toLocaleDateString("ar-EG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          createdAt: request.createdAt,
        }));

        setAcidRequests(formattedRequests);

        if (formattedRequests.length === 0) {
          toast("لا توجد طلبات ACID");
        }
      } catch (error) {
        console.error("Error fetching ACID requests:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "فشل في تحميل طلبات ACID";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAcidRequests();
  }, [token, navigate]);

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
    setIsSortOpen(false);
  };

  const toggleSort = () => {
    setIsSortOpen(!isSortOpen);
    setIsFilterOpen(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "تمت الموافقة";
      case "completed":
        return "مكتمل";
      case "rejected":
        return "مرفوض";
      case "pending":
        return "قيد المراجعة";
      default:
        return "غير محدد";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "completed":
        return "bg-green-100";
      case "rejected":
        return "bg-red-100";
      case "pending":
        return "bg-yellow-100";
      default:
        return "bg-gray-100";
    }
  };

  const filteredRequests = acidRequests.filter((request) =>
    request.acidCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
      <Header />
      <WelcomeBanner />

      <section className="flex-grow w-full bg-white py-12 px-8 shadow-inner relative">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-right text-red-800 mb-8">
            طلبات ACID
          </h1>

          {/* Search + Filter + Sort */}
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
                placeholder="ابحث برقم ACID أو اسم المورد"
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

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute top-14 left-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
                <h4 className="font-semibold text-red-800 mb-3">
                  تصفية حسب:
                </h4>
                <select className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700">
                  <option>الحالة</option>
                  <option>تمت الموافقة</option>
                  <option>قيد المراجعة</option>
                  <option>مرفوض</option>
                </select>
                <button className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition">
                  تطبيق
                </button>
              </div>
            )}

            {/* Sort Dropdown */}
            {isSortOpen && (
              <div className="absolute top-14 left-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
                <h4 className="font-semibold text-red-800 mb-3">
                  ترتيب حسب:
                </h4>
                <select className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700">
                  <option>الأحدث أولاً</option>
                  <option>الأقدم أولاً</option>
                  <option>المورد (أ-ي)</option>
                </select>
                <button className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition">
                  تطبيق
                </button>
              </div>
            )}
          </div>

          {/* ACID Requests Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12 gap-4">
              <div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
              <span className="text-gray-600 text-lg">جاري تحميل الطلبات...</span>
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
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-4">لا توجد طلبات ACID</p>
              <button
                onClick={() => navigate("/acidrequest")}
                className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-700 transition"
              >
                إضافة طلب جديد
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-separate border-spacing-y-3">
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="bg-gray-100 hover:bg-gray-200 rounded-xl transition text-right"
                    >
                      <td className="py-4 px-6 align-top rounded-r-xl">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-700 text-base font-semibold">
                            {request.supplierName}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {request.requestDate}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-500 text-xs mb-1">
                            رقم ACID
                          </span>
                          <span className="font-semibold text-gray-800">
                            {request.acidCode}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-500 text-xs mb-1">
                            البند الجمركي
                          </span>
                          <span className="text-gray-700">
                            {request.customsItem}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-500 text-xs mb-1">
                            الوزن
                          </span>
                          <span className="text-gray-700">
                            {request.weight} كجم
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <span
                          className={`${getStatusColor(request.status)} text-xs font-semibold px-3 py-1 rounded-full flex items-center justify-center gap-2 w-fit`}
                          style={{ color: "#690000" }}
                        >
                          {getStatusIcon(request.status)}
                          {getStatusText(request.status)}
                        </span>
                      </td>

                      <td className="py-4 px-6 align-top rounded-l-xl">
                        <button
                          onClick={() => navigate(`/acidrequest/${request.id}`)}
                          className="text-blue-600 text-sm font-medium underline cursor-pointer hover:text-blue-700"
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add New Request Button */}
          {!loading && !error && filteredRequests.length > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate("/acidrequest")}
                className="bg-red-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
              >
                إضافة طلب ACID جديد
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AcidRequestsPage;
