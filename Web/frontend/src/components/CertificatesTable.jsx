import React from "react";

/**
 * CertificatesTable Component
 * Displays a table of certificate requests with actions
 */
const CertificatesTable = ({
	certificates,
	onViewDetails,
	onDelete,
	getStatusLabel,
	getStatusColor,
}) => {
	return (
		<div className="overflow-x-auto px-4 mb-8">
			<table className="w-full text-center border-collapse bg-white shadow-md rounded-lg">
				<thead>
					<tr className="text-white border-b border-red-900 bg-red-800">
						<th className="py-4 px-4">#</th>
						<th className="py-4 px-4">رقم الطلب</th>
						<th className="py-4 px-4">اسم العميل</th>
						<th className="py-4 px-4">الموظف المسؤول</th>
						<th className="py-4 px-4">الحالة</th>
						<th className="py-4 px-4">تاريخ الطلب</th>
						<th className="py-4 px-4">حالة القفل</th>
						<th className="py-4 px-4">الإجراءات</th>
					</tr>
				</thead>

				<tbody>
					{certificates.length === 0 ? (
						<tr>
							<td colSpan="8" className="py-6 text-gray-500">
								لا يوجد شهادات مطابقة لبحثك
							</td>
						</tr>
					) : (
						certificates.map((cert, index) => (
							<tr
								key={cert.id}
								className="border-b border-red-100 text-gray-800 hover:bg-red-50"
							>
								<td className="py-4 px-4 font-semibold text-red-900">
									{index + 1}
								</td>
								<td className="py-4 px-4 font-mono text-sm">
									{cert.certificateNumber}
								</td>
								<td className="py-4 px-4">{cert.clientName}</td>
								<td className="py-4 px-4">{cert.employeeName}</td>
								<td
									className={`py-4 px-4 font-semibold ${getStatusColor(
										cert.stage
									)}`}
								>
									{getStatusLabel(cert.stage)}
								</td>
								<td className="py-4 px-4">
									{new Date(cert.requestDate).toLocaleDateString("ar-EG")}
								</td>
								<td className="py-4 px-4">
									{cert.isLocked ? (
										<span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
											مقفل
										</span>
									) : (
										<span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
											مفتوح
										</span>
									)}
								</td>
								<td className="py-4 px-4">
									<div className="flex gap-2 justify-center">
										<button
											onClick={() => onViewDetails(cert.id)}
											className="text-blue-600 hover:text-blue-800 underline text-sm"
										>
											عرض التفاصيل
										</button>
										<button
											onClick={() => onDelete(cert.id)}
											className="text-red-600 hover:text-red-800 underline text-sm"
										>
											حذف
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

export default CertificatesTable;
