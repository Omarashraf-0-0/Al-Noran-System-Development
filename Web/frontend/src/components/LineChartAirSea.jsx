import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function LineChartAirSea({ data, isDarkMode }) {
  const textColor = isDarkMode ? "#F3E5AB" : "#374151";
  const gridColor = isDarkMode ? "#4a3f00" : "#e5e7eb";
  const tooltipStyle = isDarkMode ? { backgroundColor: "#1a1600", borderColor: "#D4AF37", color: "#F3E5AB" } : { backgroundColor: "#fff", borderColor: "#ccc" };

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
          <XAxis 
            dataKey="label" 
            stroke={textColor}
            tick={{ fill: textColor }}
          />
          <YAxis 
            stroke={textColor}
            tick={{ fill: textColor }}
          />
          <Tooltip 
            contentStyle={tooltipStyle}
            itemStyle={{ color: isDarkMode ? "#F3E5AB" : "#374151" }}
          />
          <Legend wrapperStyle={{ color: textColor }} />

          {/* Sea Revenue */}
          <Line
            type="monotone"
            dataKey="sea"
            stroke="#1BA3B6"      
            strokeWidth={3}
            name="الإيرادات البحرية"
            dot={{ fill: "#1BA3B6", r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Air Revenue */}
          <Line
            type="monotone"
            dataKey="air"
            stroke="#690000"      
            strokeWidth={3}
            name="الإيرادات الجوية"
            dot={{ fill: "#690000", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
