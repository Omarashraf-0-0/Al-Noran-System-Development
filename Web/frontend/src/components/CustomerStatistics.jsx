import React from "react";

/**
 * CustomerStatistics Component
 * Displays statistics for customers (total customers, active customers)
 */
const CustomerStatistics = ({ customers }) => {
	const totalCustomers = customers.length;
	const activeCustomers = customers.filter((c) => c.status === "نشط").length;

	return (
		<div className="flex justify-end gap-6 px-16 mb-4">
			<div className="text-right">
				<span className="text-gray-600 text-lg">إجمالي العملاء: </span>
				<span className="text-[#690000] font-bold text-xl">
					{totalCustomers}
				</span>
			</div>
			<div className="text-right">
				<span className="text-gray-600 text-lg">العملاء النشطون: </span>
				<span className="text-green-600 font-bold text-xl">
					{activeCustomers}
				</span>
			</div>
		</div>
	);
};

export default CustomerStatistics;
