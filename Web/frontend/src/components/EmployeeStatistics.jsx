import React from "react";

const EmployeeStatistics = ({ employees }) => {
	const totalEmployees = employees.length;
	const activeEmployees = employees.filter((e) => e.status === "نشط").length;

	return (
		<div className="flex justify-between items-center px-16 mb-6">
			<div className="text-right">
				<h2 className="text-4xl font-bold text-[#690000]">الموظفين</h2>
				<p className="text-gray-600 mt-2">
					إجمالي الموظفين: {totalEmployees} | نشط: {activeEmployees}
				</p>
			</div>
		</div>
	);
};

export default EmployeeStatistics;
