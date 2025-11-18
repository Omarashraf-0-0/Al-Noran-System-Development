import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import DonutChartCustomers from "./DonutChartCustomers";

const COLORS = ["#690000", "#1893A4", "#A40000", "#250000"];

export default function MostActiveCustomers() {
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/shipments/most-active-clients`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Most active clients:", response.data);
        
        // Backend returns { result: [...] }
        const clientsArray = response.data.result || response.data || [];
        
        // Transform the data to match the chart format
        const formattedData = clientsArray.map((client) => ({
          name: client.name || client.clientName || client.importerName || "غير محدد",
          value: client.count || client.shipmentCount || 0,
        }));

        setCustomersData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load most active clients:", err);
        toast.error("فشل تحميل بيانات العملاء");
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
      <h2 className="text-xl font-semibold mb-3 text-right text-[#690000]">
        أكثر العملاء نشاطاً
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      ) : customersData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>لا توجد بيانات متاحة</p>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-col gap-2 mb-4">
            {customersData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 justify-end">
                <span className="text-sm font-semibold text-gray-700">({item.value})</span>
                <span className="text-sm">{item.name}</span>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
              </div>
            ))}
          </div>

          {/* Donut Chart */}
          <DonutChartCustomers data={customersData} />
        </>
      )}
    </div>
  );
}
