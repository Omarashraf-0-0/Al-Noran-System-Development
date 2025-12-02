import React from "react";
import quickReorderIcon from "../assets/images/quick_reorder.png";

const ShipmentsTable = ({
	shipments,
	maxItems = 5,
	linkPrefix = "/employee-shipment",
}) => {
	if (shipments.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500 text-lg">لا توجد شحنات</p>
			</div>
		);
	}

	const displayedShipments = maxItems
		? shipments.slice(0, maxItems)
		: shipments;

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-right border-separate border-spacing-y-3">
				<tbody>
					{displayedShipments.map((shipment) => (
						<tr
							key={shipment.id}
							className="bg-gray-100 hover:bg-gray-200 rounded-xl transition text-right"
						>
							<td className="py-3 px-4 align-top">
								<div className="flex flex-col text-sm">
									<span className="text-gray-700 text-base font-semibold">
										{shipment.clientName}
									</span>
									<span className="text-gray-500 text-xs">{shipment.date}</span>
								</div>
							</td>

							<td className="py-3 px-4 align-top">
								<div className="flex flex-col text-sm">
									<span className="font-semibold text-gray-800">
										{shipment.shipmentNo}
									</span>
								</div>
							</td>

							<td className="py-3 px-4 align-top">
								<span
									className="bg-blue-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center justify-center gap-2 w-fit"
									style={{ color: "#690000" }}
								>
									<img
										src={quickReorderIcon}
										alt="status icon"
										className="w-4 h-4"
									/>
									{shipment.status}
								</span>
							</td>

							<td className="py-3 px-4 align-top">
								{/* TODO: RBAC - Check permission for managing shipment */}
								<a href={`${linkPrefix}/${shipment.id}`}>
									<span className="text-blue-600 text-sm font-medium underline cursor-pointer">
										إدارة الشحنة
									</span>
								</a>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default ShipmentsTable;
