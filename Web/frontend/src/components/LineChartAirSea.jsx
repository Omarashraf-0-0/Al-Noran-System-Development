import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function LineChartAirSea({ data }) {
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />

          {/* Sea Revenue */}
          <Line
            type="monotone"
            dataKey="sea"
            stroke="#1BA3B6"      
            strokeWidth={3}
            name="الإيرادات البحرية"
            dot={true}
          />

          {/* Air Revenue */}
          <Line
            type="monotone"
            dataKey="air"
            stroke="#690000"      
            strokeWidth={3}
            name="الإيرادات الجوية"
            dot={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
