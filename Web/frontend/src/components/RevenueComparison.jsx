import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import LineChartAirSea from "./LineChartAirSea";
import { useTheme } from "../context/ThemeContext";

export default function RevenueComparison() {
  const { isDarkMode } = useTheme();
	const [chartData, setChartData] = useState([]);
	const [loading, setLoading] = useState(true);
	const token = localStorage.getItem("token");

  // Theme classes
  const theme = {
    textPrimary: isDarkMode ? "text-[#F3E5AB]" : "text-gray-900",
    textSecondary: isDarkMode ? "text-[#D4AF37]/60" : "text-gray-500",
    accentText: "text-[#D4AF37]",
    cardBg: isDarkMode ? "bg-transparent" : "bg-transparent",
  };

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/shipments/revenue-comparison`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				setChartData(response.data || []);
				setLoading(false);
			} catch (err) {
				console.error("Failed to load revenue comparison:", err);
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
		<div className={`p-4 w-full h-full ${theme.cardBg}`}>
			{/* Title */}
			<h2 className={`text-xl font-bold mb-4 text-right ${theme.accentText}`}>
				مقارنة الإيرادات البحرية والجوية
			</h2>

			{loading ? (
				<div className="flex justify-center items-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent"></div>
				</div>
			) : chartData.length === 0 ? (
				<div className={`text-center py-8 ${theme.textSecondary}`}>
					<p>لا توجد بيانات متاحة</p>
				</div>
			) : (
				<LineChartAirSea data={chartData} isDarkMode={isDarkMode} />
			)}
		</div>
	);
}
