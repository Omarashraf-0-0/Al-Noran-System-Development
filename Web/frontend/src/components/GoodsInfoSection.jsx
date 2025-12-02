import React from "react";
import { Package, FileText, Weight } from "lucide-react";
import Datafield from "./DataField";
import contractIcon from "../assets/images/contract.png";

const GoodsInfoSection = ({ goods }) => {
	return (
		<div className="mb-12">
			<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
				<Package className="w-6 h-6" />
				<span>بيانات البضاعة</span>
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
				<Datafield
					label="وصف البضاعة"
					placeholder="وصف البضاعة"
					value={goods?.description || "غير متوفر"}
					icon={<FileText className="w-5 h-5 text-gray-500" />}
					readOnly
				/>
				<Datafield
					label="البند الجمركي"
					placeholder="البند الجمركي"
					value={goods?.customsItem || "غير متوفر"}
					icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
					readOnly
				/>
				<Datafield
					label="الوزن المبدئي (كجم)"
					placeholder="الوزن"
					value={goods?.weight ? `${goods.weight} كجم` : "غير متوفر"}
					icon={<Weight className="w-5 h-5 text-gray-500" />}
					readOnly
				/>
			</div>
		</div>
	);
};

export default GoodsInfoSection;
