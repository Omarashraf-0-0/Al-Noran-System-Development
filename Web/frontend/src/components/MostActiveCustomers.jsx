import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import DonutChartCustomers from "./DonutChartCustomers";
import { useTheme } from "../context/ThemeContext";

const COLORS = ["#690000", "#1893A4", "#D4AF37", "#B8860B", "#1a1600"];

export default function MostActiveCustomers() {
  const { isDarkMode } = useTheme();
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // Theme classes - Gold/Black
  const theme = {
    textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-gray-900",
    textSecondary: isDarkMode ? "text-[#D4AF37]/60" : "text-gray-500",
    accentText: "text-[#D4AF37]",
    cardBg: isDarkMode ? "bg-transparent" : "bg-transparent", // Background handled by parent
  };

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

        const clientsArray = response.data.result || response.data || [];
        
        const formattedData = clientsArray.map((client) => ({
          id: client._id,
          name: client.name || client.clientName || client.importerName || "غير محدد",
          value: client.count || client.shipmentCount || 0,
        }));

        setCustomersData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load most active clients:", err);
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
    <div className={`p-4 w-full h-full ${theme.cardBg}`}>

      {/* Title */}
      <h2 className={`text-xl font-bold mb-4 text-right ${theme.accentText}`}>
        أكثر العملاء نشاطاً
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent"></div>
        </div>
      ) : customersData.length === 0 ? (
        <div className={`text-center py-8 ${theme.textSecondary}`}>
          <p>لا توجد بيانات متاحة</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
           {/* Chart */}
           <div className="flex-1 w-full flex justify-center">
            <DonutChartCustomers data={customersData} isDarkMode={isDarkMode} />
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3 min-w-[150px]">
            {customersData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 justify-end">
                <span className={`text-sm font-bold ${theme.textPrimary}`}>({item.value})</span>
                {item.id ? (
                  <a 
                    href={`/client/${item.id}`}
                    className={`text-sm hover:text-[#D4AF37] transition-colors cursor-pointer ${theme.textSecondary}`}
                  >
                    {item.name}
                  </a>
                ) : (
                  <span className={`text-sm ${theme.textSecondary}`}>{item.name}</span>
                )}
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
