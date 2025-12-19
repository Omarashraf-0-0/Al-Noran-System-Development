import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const RequestsTable = ({
	requests,
	getStatusIcon,
	getStatusText,
	getStatusColor,
}) => {
	const navigate = useNavigate();

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-right border-separate border-spacing-y-3">
				<thead>
					<tr className="bg-red-800 text-white">
						<th className="py-3 px-4 text-right rounded-tr-lg">المورد / التاريخ</th>
						<th className="py-3 px-4 text-right">رقم ACID</th>
						<th className="py-3 px-4 text-right">البند الجمركي</th>
						<th className="py-3 px-4 text-right">الوزن</th>
						<th className="py-3 px-4 text-right">الحالة</th>
						<th className="py-3 px-4 text-right rounded-tl-lg">الإجراءات</th>
					</tr>
				</thead>
				<tbody>
					{requests.map((request) => (
						<tr
							key={request.id}
							className="bg-gray-100 hover:bg-gray-200 rounded-xl transition text-right"
						>
							<td className="py-4 px-6 align-top rounded-r-xl">
								<div className="flex flex-col text-sm">
									<span className="text-gray-700 text-base font-semibold">
										{request.supplierName}
									</span>
									<span className="text-gray-500 text-xs">
										{request.requestDate}
									</span>
								</div>
							</td>

							<td className="py-4 px-6 align-top">
								<div className="flex flex-col text-sm">
									<span className="text-gray-500 text-xs mb-1">رقم ACID</span>
									<span className="font-semibold text-gray-800">
										{request.acidCode}
									</span>
								</div>
							</td>

							<td className="py-4 px-6 align-top">
								<div className="flex flex-col text-sm">
									<span className="text-gray-500 text-xs mb-1">
										البند الجمركي
									</span>
									<span className="text-gray-700">{request.customsItem}</span>
								</div>
							</td>

							<td className="py-4 px-6 align-top">
								<div className="flex flex-col text-sm">
									<span className="text-gray-500 text-xs mb-1">الوزن</span>
									<span className="text-gray-700">{request.weight} كجم</span>
								</div>
							</td>

							<td className="py-4 px-6 align-top">
								<span
									className={`${getStatusColor(
										request.status
									)} text-xs font-semibold px-3 py-1 rounded-full flex items-center justify-center gap-2 w-fit`}
									style={{ color: "#690000" }}
								>
									{getStatusIcon(request.status)}
									{getStatusText(request.status)}
								</span>
							</td>

							<td className="py-4 px-6 align-top rounded-l-xl">
								<div className="flex flex-col gap-2">
									{request.hasShipment ? (
										<>
											<div className="flex items-center gap-2 text-green-600 text-sm font-semibold mb-1">
												<CheckCircle className="w-4 h-4" />
												تم إنشاء الشحنة
											</div>
											<button
												onClick={() =>
													navigate(`/shipmentstatus/${request.acidCode}`)
												}
												className="bg-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-green-700 transition font-medium"
											>
												عرض الشحنة
											</button>
										</>
									) : (
										<button
											onClick={() => navigate(`/acidrequest/${request.id}`)}
											className="text-blue-600 text-sm font-medium underline cursor-pointer hover:text-blue-700"
										>
											عرض التفاصيل
										</button>
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default RequestsTable;
