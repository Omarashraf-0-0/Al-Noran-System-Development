import { useEffect, useState } from "react";
import LineChartAirSea from "./LineChartAirSea";

export default function RevenueComparison() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Replace with backend later:
        // const res = await fetch("/api/revenue/air-sea");
        // const data = await res.json();
        // setChartData(data);

        setChartData([
          { label: "Jan", sea: 40000, air: 10000 },
          { label: "Feb", sea: 5000, air: 27000 },
          { label: "Mar", sea: 50000, air: 2000 }
        ]);
      } catch (err) {
        console.error("Failed to load chart data:", err);
      }
    };

    loadData();
  }, []);

  return (
    <div className="p-4 rounded-2xl shadow bg-white w-full">


        {/* Title */}
   <h2 className="text-xl font-semibold mb-2 text-right text-[#690000]">
  مقارنة الإيرادات البحرية والجوية
   </h2>

      {/* Chart */}
      <LineChartAirSea data={chartData} />
    </div>
  );
}
