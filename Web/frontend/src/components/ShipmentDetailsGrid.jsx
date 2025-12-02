import React from "react";
import Datafield from "./DataField";
import contractIcon from "../assets/images/contract.png";

/**
 * ShipmentDetailsGrid - Displays shipment details in a grid layout
 *
 * TODO: RBAC - This component should check permissions:
 * - canViewShipmentDetails: Allow viewing shipment details
 */
const ShipmentDetailsGrid = ({ shipment, availableStatuses }) => {
	const statusLabel =
		availableStatuses.find((s) => s.value === shipment.status)?.label ||
		shipment.status;

	const fields = [
		{
			label: "اسم العميل",
			value: shipment.importerName || shipment.employerName || "غير محدد",
		},
		{
			label: "رقم الـ ACID",
			value: shipment.acid || "غير محدد",
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
			label: "رقم البوليصة",
			value: shipment.number46 || "غير محدد",
		},
		{
			label: "عدد الحاويات",
			value: shipment.num_of_containers || "غير محدد",
		},
		{
			label: "ميناء الوصول",
			value: shipment.port_name || "غير محدد",
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-12 mb-12">
			{fields.map((field, index) => (
				<Datafield
					key={index}
					label={field.label}
					value={field.value}
					icon={<img src={contractIcon} alt="icon" className="w-5 h-5" />}
				/>
			))}
		</div>
	);
};

export default ShipmentDetailsGrid;
