import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import LineChartAirSea from "./LineChartAirSea";

export default function RevenueComparison() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/shipments/revenue-comparison`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Revenue comparison data:", response.data);
        setChartData(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load revenue comparison:", err);
        toast.error("فشل تحميل بيانات الإيرادات");
        // Set default data on error
        setChartData([]);
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="p-4 rounded-2xl shadow bg-white w-full">
      {/* Title */}
      <h2 className="text-xl font-semibold mb-2 text-right text-[#690000]">
        مقارنة الإيرادات البحرية والجوية
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>لا توجد بيانات متاحة</p>
        </div>
      ) : (
        <LineChartAirSea data={chartData} />
      )}
    </div>
  );
}
