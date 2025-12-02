import React from "react";
import { Package } from "lucide-react";

/**
 * GoodsInfoForm Component
 * Form fields for goods information (description, customs item, weight)
 */
const GoodsInfoForm = ({ goodsData, onChange }) => {
	return (
		<div className="mb-12">
			<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
				<Package className="w-6 h-6" />
				<span>بيانات البضاعة</span>
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="md:col-span-2">
					<label className="block text-gray-700 font-semibold mb-2">
						وصف البضاعة <span className="text-red-500">*</span>
					</label>
					<textarea
						value={goodsData.description}
						onChange={(e) => onChange("goods.description", e.target.value)}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
						placeholder="أدخل وصف البضاعة"
						rows="3"
						required
					/>
				</div>
				<div>
					<label className="block text-gray-700 font-semibold mb-2">
						البند الجمركي
					</label>
					<input
						type="text"
						value={goodsData.customsItem}
						onChange={(e) => onChange("goods.customsItem", e.target.value)}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
						placeholder="أدخل البند الجمركي"
					/>
				</div>
				<div>
					<label className="block text-gray-700 font-semibold mb-2">
						الوزن المبدئي (كجم) <span className="text-red-500">*</span>
					</label>
					<input
						type="number"
						step="0.01"
						value={goodsData.weight}
						onChange={(e) => onChange("goods.weight", e.target.value)}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
						placeholder="أدخل الوزن"
						required
					/>
				</div>
			</div>
		</div>
	);
};

export default GoodsInfoForm;
