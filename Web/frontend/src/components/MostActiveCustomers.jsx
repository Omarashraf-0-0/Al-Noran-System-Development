import { useEffect, useState } from "react";
import DonutChartCustomers from "./DonutChartCustomers";

const COLORS = ["#690000", "#1893A4", "#A40000", "#250000"];

export default function MostActiveCustomers() {
  const [customersData, setCustomersData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Replace this with backend later:
        // const res = await fetch("/api/customers/most-active");
        // const data = await res.json();
        // setCustomersData(data);

        setCustomersData([
          { name: "اسم العميل 1", value: 5 },
          { name: "اسم العميل 2", value: 4 },
          { name: "اسم العميل 3", value: 3 },
          { name: "اسم العميل 4", value: 3 }
        ]);
      } catch (err) {
        console.error("Failed to load donut chart data:", err);
      }
    };

    loadData();
  }, []);

  return (
    <div className="p-4 rounded-2xl shadow bg-white w-full">

      {/* Title */}
      <h2 className="text-xl font-semibold mb-3 text-right text-[#690000]">
        أكثر العملاء نشاطاً
      </h2>

      {/* Legend */}
      <div className="flex flex-col gap-2 mb-4">
        {customersData.map((item, index) => (
          <div key={index} className="flex items-center gap-2 justify-end">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></span>
            <span className="text-sm">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Donut Chart */}
      <DonutChartCustomers data={customersData} />
    </div>
  );
}
