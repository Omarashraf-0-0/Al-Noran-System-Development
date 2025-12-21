import React from "react";
import { User, Globe, Phone, Mail } from "lucide-react";
import Datafield from "./DataField";
import contractIcon from "../assets/images/contract.png";
import { useTheme } from "../context/ThemeContext";

const SupplierInfoSection = ({ supplier }) => {
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
				<span className={`p-2 rounded-xl ${isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-800"}`}>
					<User className="w-6 h-6" />
				</span>
				<span className={`bg-gradient-to-r bg-clip-text text-transparent ${
					isDarkMode ? "from-gray-100 to-gray-400" : "from-gray-900 to-gray-600"
				}`}>
					بيانات المورد
				</span>
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
				<Datafield
					label="اسم المورد"
					value={supplier?.name || "غير متوفر"}
					icon={<User className="w-5 h-5" />}
				/>
				<Datafield
					label="الرقم الضريبي"
					value={supplier?.taxNum || "غير متوفر"}
					icon={<img src={contractIcon} alt="icon" className="w-5 h-5 opacity-50" />}
				/>
				<Datafield
					label="الدولة"
					value={supplier?.country || "غير متوفر"}
					icon={<Globe className="w-5 h-5" />}
				/>
				<Datafield
					label="البريد الإلكتروني"
					value={supplier?.email || "غير متوفر"}
					icon={<Mail className="w-5 h-5" />}
				/>
				<Datafield
					label="رقم الهاتف"
					value={supplier?.mobileNum || "غير متوفر"}
					icon={<Phone className="w-5 h-5" />}
				/>
			</div>
		</div>
	);
};

export default SupplierInfoSection;
