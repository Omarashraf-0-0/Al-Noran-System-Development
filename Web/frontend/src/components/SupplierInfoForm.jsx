import React from "react";
import { User } from "lucide-react";

/**
 * SupplierInfoForm Component
 * Form fields for supplier information (name, tax number, country, email, phone)
 */
const SupplierInfoForm = ({ supplierData, onChange }) => {
	return (
		<div className="mb-12">
			<h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
				<User className="w-6 h-6" />
				<span>بيانات المورد</span>
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label className="block text-gray-700 font-semibold mb-2">
						اسم المورد <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						value={supplierData.name}
						onChange={(e) => onChange("supplier.name", e.target.value)}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
						placeholder="أدخل اسم المورد"
						required
					/>
				</div>
				<div>
					<label className="block text-gray-700 font-semibold mb-2">
						الرقم الضريبي <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						value={supplierData.taxNum}
						onChange={(e) => onChange("supplier.taxNum", e.target.value)}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
						placeholder="أدخل الرقم الضريبي"
						required
					/>
				</div>
				<div>
					<label className="block text-gray-700 font-semibold mb-2">
						الدولة <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						value={supplierData.country}
						onChange={(e) => onChange("supplier.country", e.target.value)}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
						placeholder="أدخل الدولة"
						required
					/>
				</div>
				<div>
					<label className="block text-gray-700 font-semibold mb-2">
						البريد الإلكتروني
					</label>
					<input
						type="email"
						value={supplierData.email}
						onChange={(e) => onChange("supplier.email", e.target.value)}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
						placeholder="أدخل البريد الإلكتروني"
					/>
				</div>
				<div>
					<label className="block text-gray-700 font-semibold mb-2">
						رقم الهاتف
					</label>
					<input
						type="tel"
						value={supplierData.mobileNum}
						onChange={(e) => onChange("supplier.mobileNum", e.target.value)}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
						placeholder="أدخل رقم الهاتف"
					/>
				</div>
			</div>
		</div>
	);
};

export default SupplierInfoForm;
