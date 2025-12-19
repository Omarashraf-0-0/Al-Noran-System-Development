import React, { useState } from "react";
import Datafield from "./DataField";
import contractIcon from "../assets/images/contract.png";
import { Pencil, Check, X } from "lucide-react";

/**
 * ShipmentDetailsGrid - Displays shipment details in a grid layout
 *
 * TODO: RBAC - This component should check permissions:
 * - canViewShipmentDetails: Allow viewing shipment details
 * - canEditNumber46: Allow editing the number46 field
 */
const ShipmentDetailsGrid = ({
	shipment,
	availableStatuses,
	isEmployee = false,
	onNumber46Update,
}) => {
	const [isEditingNumber46, setIsEditingNumber46] = useState(false);
	const [number46Value, setNumber46Value] = useState(shipment.number46 || "");

	const statusLabel =
		availableStatuses.find((s) => s.value === shipment.status)?.label ||
		shipment.status;

	const handleSaveNumber46 = () => {
		if (onNumber46Update) {
			onNumber46Update(number46Value);
		}
		setIsEditingNumber46(false);
	};

	const handleCancelEdit = () => {
		setNumber46Value(shipment.number46 || "");
		setIsEditingNumber46(false);
	};

	const fields = [
		{
			label: "اسم العميل",
			value: shipment.user_id?.fullname || shipment.user_id?.username || "غير محدد",
		},
		{
			label: "اسم المورد",
			value: shipment.importerName || "غير محدد",
		},
		{
			label: "رقم الـ ACID",
			value: shipment.acid || "غير محدد",
		},
		{
			label: "نوع الشحنة",
			value: shipment.shipment_type === "جوي" ? "✈️ جوي" : "🚢 بحري",
		},
		{
			label: "الحالة",
			value: statusLabel,
		},
		{
			label: "وصف الشحنة",
			value: shipment.shipmentDescription || "غير محدد",
		},
		{
			label: "البلد",
			value: shipment.country || "غير محدد",
		},
		{
			label: "ميناء الوصول",
			value: shipment.port_name || "غير محدد",
		},
		{
			label: "عدد الحاويات",
			value: shipment.num_of_containers || "غير محدد",
		},
		{
			label: "أنواع الحاويات",
			value: shipment.type_of_containers?.join(", ") || "غير محدد",
		},
		{
			label: "رقم 46",
			value: shipment.number46 || "غير محدد",
			editable: isEmployee && shipment.status === "جارى ادراج الشحنة واستكمال الاجراءات",
			fieldKey: "number46",
		},
		{
			label: "البوليصة",
			value: shipment.policy || "غير محدد",
		},
		{
			label: "تاريخ الوصول المتوقع",
			value: shipment.arrivalDate
				? new Date(shipment.arrivalDate).toLocaleDateString("ar-EG")
				: "غير محدد",
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-12 mb-12">
			{fields.map((field, index) => (
				<div key={index}>
					{field.editable && field.fieldKey === "number46" ? (
						<div className="flex flex-col gap-2">
							<div className="flex items-center gap-2 text-gray-500 text-sm">
								<img src={contractIcon} alt="icon" className="w-5 h-5" />
								<span>{field.label}</span>
							</div>
							{isEditingNumber46 ? (
								<div className="flex items-center gap-2">
									<input
										type="text"
										value={number46Value}
										onChange={(e) => setNumber46Value(e.target.value)}
										className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-red-500"
										placeholder="أدخل رقم 46"
										dir="rtl"
									/>
									<button
										onClick={handleSaveNumber46}
										className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
										title="حفظ"
									>
										<Check size={18} />
									</button>
									<button
										onClick={handleCancelEdit}
										className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
										title="إلغاء"
									>
										<X size={18} />
									</button>
								</div>
							) : (
								<div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
									<button
										onClick={() => setIsEditingNumber46(true)}
										className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
										title="تعديل رقم 46"
									>
										<Pencil size={16} />
									</button>
									<span className="text-gray-800 font-medium">
										{field.value}
									</span>
								</div>
							)}
						</div>
					) : (
						<Datafield
							label={field.label}
							value={field.value}
							icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
						/>
					)}
				</div>
			))}
		</div>
	);
};

export default ShipmentDetailsGrid;
