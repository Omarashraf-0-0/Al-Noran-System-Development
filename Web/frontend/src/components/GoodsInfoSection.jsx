import React from "react";
import { Package, FileText, Weight } from "lucide-react";
import Datafield from "./DataField";
import contractIcon from "../assets/images/contract.png";
import { useTheme } from "../context/ThemeContext";

const GoodsInfoSection = ({ goods }) => {
	const { isDarkMode } = useTheme();

	return (
		<div
			className={`rounded-3xl p-6 sm:p-8 mb-8 border backdrop-blur-sm transition-all duration-300 ${
				isDarkMode
					? "bg-white/5 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
					: "bg-white/60 border-white/40 shadow-xl shadow-red-900/5"
			}`}
		>
			<h2 className="text-2xl font-bold mb-8 flex items-center gap-3 border-b border-gray-200/50 pb-4">
				<span className={`p-2 rounded-xl ${isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-800"}`}>
					<Package className="w-6 h-6" />
				</span>
				<span className={`bg-gradient-to-r bg-clip-text text-transparent ${
					isDarkMode ? "from-gray-100 to-gray-400" : "from-gray-900 to-gray-600"
				}`}>
					بيانات البضاعة
				</span>
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
				<Datafield
					label="وصف البضاعة"
					value={goods?.description || "غير متوفر"}
					icon={<FileText className="w-5 h-5" />}
				/>
				<Datafield
					label="البند الجمركي"
					value={goods?.customsItem || "غير متوفر"}
					icon={<img src={contractIcon} alt="icon" className="w-5 h-5 opacity-50" />}
				/>
				<Datafield
					label="الوزن المبدئي (كجم)"
					value={goods?.weight ? `${goods.weight} كجم` : "غير متوفر"}
					icon={<Weight className="w-5 h-5" />}
				/>
			</div>
		</div>
	);
};

export default GoodsInfoSection;
