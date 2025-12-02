import React from "react";
import { User, Globe, Phone, Mail } from "lucide-react";
import Datafield from "./DataField";
import contractIcon from "../assets/images/contract.png";

const SupplierInfoSection = ({ supplier }) => {
	return (
		<div className="mb-12">
			<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
				<User className="w-6 h-6" />
				<span>بيانات المورد</span>
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
				<Datafield
					label="اسم المورد"
					placeholder="اسم المورد"
					value={supplier?.name || "غير متوفر"}
					icon={<User className="w-5 h-5 text-gray-500" />}
					readOnly
				/>
				<Datafield
					label="الرقم الضريبي"
					placeholder="الرقم الضريبي"
					value={supplier?.taxNum || "غير متوفر"}
					icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
					readOnly
				/>
				<Datafield
					label="الدولة"
					placeholder="الدولة"
					value={supplier?.country || "غير متوفر"}
					icon={<Globe className="w-5 h-5 text-gray-500" />}
					readOnly
				/>
				<Datafield
					label="البريد الإلكتروني"
					placeholder="البريد الإلكتروني"
					value={supplier?.email || "غير متوفر"}
					icon={<Mail className="w-5 h-5 text-gray-500" />}
					readOnly
				/>
				<Datafield
					label="رقم الهاتف"
					placeholder="رقم الهاتف"
					value={supplier?.mobileNum || "غير متوفر"}
					icon={<Phone className="w-5 h-5 text-gray-500" />}
					readOnly
				/>
			</div>
		</div>
	);
};

export default SupplierInfoSection;
