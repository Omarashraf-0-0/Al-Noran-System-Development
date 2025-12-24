import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#690000", "#1893A4", "#D4AF37", "#B8860B", "#1a1600"];

export default function DonutChartCustomers({ data, isDarkMode }) {
  const tooltipStyle = isDarkMode ? { backgroundColor: "#1a1600", borderColor: "#D4AF37", color: "#F3E5AB" } : { backgroundColor: "#fff", borderColor: "#ccc" };

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip 
            contentStyle={tooltipStyle}
            itemStyle={{ color: isDarkMode ? "#F3E5AB" : "#374151" }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            stroke={isDarkMode ? "#1a1600" : "#fff"}
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`slice-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
