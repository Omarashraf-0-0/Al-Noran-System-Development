import React from "react";

const EmployeesTable = ({
	employees,
	onViewDetails,
	onToggleStatus,
	onDelete,
	onSuspend,
	getEmployeeTypeLabel,
	emptyMessage = "لا يوجد موظفون",
}) => {
	return (
		<div className="overflow-x-auto px-8">
			<table className="w-full text-center border-collapse bg-white rounded-lg shadow">
				<thead>
					<tr className="border-b bg-gradient-to-r from-red-800 to-red-900 text-white">
						<th className="py-4 px-4">#</th>
						<th className="py-4 px-4">اسم الموظف</th>
						<th className="py-4 px-4">اسم المستخدم</th>
						<th className="py-4 px-4">نوع الموظف</th>
						<th className="py-4 px-4">الحالة</th>
						<th className="py-4 px-4">البريد الإلكتروني</th>
						<th className="py-4 px-4">الهاتف</th>
						<th className="py-4 px-4">الإجراءات</th>
					</tr>
				</thead>

				<tbody>
					{employees.length === 0 ? (
						<tr>
							<td colSpan="8" className="py-8 text-gray-500">
								{emptyMessage}
							</td>
						</tr>
					) : (
						employees.map((emp, index) => (
							<tr
								key={emp.id}
								className="border-b text-gray-700 hover:bg-gray-50"
							>
								<td className="py-4 px-4 font-semibold text-gray-500">
									{index + 1}
								</td>
								<td className="py-4 px-4 font-semibold">{emp.name}</td>
								<td className="py-4 px-4">{emp.username}</td>
								<td className="py-4 px-4">
									<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
										{getEmployeeTypeLabel(emp.employeeType)}
									</span>
								</td>
								<td className="py-4 px-4">
									<div className="flex flex-col gap-1 items-center">
										{/* <span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												emp.status === "نشط"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{emp.status}
										</span> */}
										{emp.suspended && (
											<span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
												موقوف
											</span>
										)}
										{!emp.suspended && (
											<span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
												نشط
											</span>
										)}
									</div>
								</td>
								<td className="py-4 px-4">{emp.email}</td>
								<td className="py-4 px-4">{emp.phone}</td>
								<td className="py-4 px-4">
									<div className="flex gap-2 justify-center flex-wrap">
										{/* TODO: RBAC - Check permission for viewing employee details */}
										<button
											onClick={() => onViewDetails(emp.id)}
											className="bg-[#1BA3B6] text-white px-3 py-1 rounded text-xs font-semibold hover:bg-[#158a9a]"
											title="عرض التفاصيل"
										>
											👁️ عرض
										</button>
										{/* TODO: RBAC - Check permission for toggling employee status */}
										{/* <button
											onClick={() => onToggleStatus(emp.id, emp.status)}
											className={`px-3 py-1 rounded text-xs font-semibold ${
												emp.status === "نشط"
													? "bg-yellow-500 text-white hover:bg-yellow-600"
													: "bg-green-500 text-white hover:bg-green-600"
											}`}
											title={emp.status === "نشط" ? "تعطيل" : "تفعيل"}
										>
											{emp.status === "نشط" ? "تعطيل" : "تفعيل"}
										</button> */}
										{/* TODO: RBAC - Check permission for suspending employees */}
										<button
											onClick={() => onSuspend(emp)}
											className={`px-3 py-1 rounded text-xs font-semibold ${
												emp.suspended
													? "bg-blue-500 text-white hover:bg-blue-600"
													: "bg-orange-500 text-white hover:bg-orange-600"
											}`}
											title={emp.suspended ? "إعادة التفعيل" : "إيقاف عن العمل"}
										>
											{emp.suspended ? "🔓 إعادة تفعيل" : "⛔ إيقاف"}
										</button>
										{/* TODO: RBAC - Check permission for deleting employees */}
										<button
											onClick={() => onDelete(emp.id)}
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

export default EmployeesTable;
