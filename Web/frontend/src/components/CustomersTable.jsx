import React from "react";

/**
 * CustomersTable Component
 * Displays a table of customers with actions (view, toggle status, delete)
 */
const CustomersTable = ({
	customers,
	search,
	onViewDetails,
	onToggleStatus,
	onDelete,
	getClientTypeLabel,
}) => {
	return (
		<div className="overflow-x-auto px-8">
			<table className="w-full text-center border-collapse bg-white rounded-lg shadow">
				<thead>
					<tr className="border-b bg-gradient-to-r from-red-800 to-red-900 text-white">
						<th className="py-4 px-4">#</th>
						<th className="py-4 px-4">اسم العميل</th>
						<th className="py-4 px-4">اسم المستخدم</th>
						<th className="py-4 px-4">نوع العميل</th>
						<th className="py-4 px-4">الحالة</th>
						<th className="py-4 px-4">البريد الإلكتروني</th>
						<th className="py-4 px-4">الهاتف</th>
						<th className="py-4 px-4">الإجراءات</th>
					</tr>
				</thead>

				<tbody>
					{customers.length === 0 ? (
						<tr>
							<td colSpan="8" className="py-8 text-gray-500">
								{search ? "لا يوجد عملاء مطابقون لبحثك" : "لا يوجد عملاء"}
							</td>
						</tr>
					) : (
						customers.map((cust, index) => (
							<tr
								key={cust.id}
								className="border-b text-gray-700 hover:bg-gray-50"
							>
								<td className="py-4 px-4 font-semibold text-gray-500">
									{index + 1}
								</td>
								<td className="py-4 px-4 font-semibold">{cust.name}</td>
								<td className="py-4 px-4">{cust.username}</td>
								<td className="py-4 px-4">
									<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
										{getClientTypeLabel(cust.clientType)}
									</span>
								</td>
								<td className="py-4 px-4">
									<span
										className={`px-3 py-1 rounded-full text-xs font-semibold ${
											cust.status === "نشط"
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{cust.status}
									</span>
								</td>
								<td className="py-4 px-4">{cust.email}</td>
								<td className="py-4 px-4">{cust.phone}</td>
								<td className="py-4 px-4">
									<div className="flex gap-2 justify-center flex-wrap">
										<button
											onClick={() => onViewDetails(cust.id)}
											className="bg-[#1BA3B6] text-white px-3 py-1 rounded text-xs font-semibold hover:bg-[#158a9a]"
											title="عرض التفاصيل"
										>
											👁️ عرض
										</button>
										<button
											onClick={() => onToggleStatus(cust.id, cust.status)}
											className={`px-3 py-1 rounded text-xs font-semibold ${
												cust.status === "نشط"
													? "bg-yellow-500 text-white hover:bg-yellow-600"
													: "bg-green-500 text-white hover:bg-green-600"
											}`}
											title={cust.status === "نشط" ? "تعطيل" : "تفعيل"}
										>
											{cust.status === "نشط" ? "تعطيل" : "تفعيل"}
										</button>
										<button
											onClick={() => onDelete(cust.id)}
											className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700"
											title="حذف"
										>
											🗑️ حذف
										</button>
									</div>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
};

export default CustomersTable;
