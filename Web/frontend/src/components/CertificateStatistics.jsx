import React from "react";

/**
 * CertificateStatistics Component
 * Displays statistics for certificate requests (total, issued, under review, pending)
 */
const CertificateStatistics = ({ certificates }) => {
	const totalRequests = certificates.length;
	const issuedCount = certificates.filter(
		(c) => c.stage === "ACID Issued"
	).length;
	const underReviewCount = certificates.filter(
		(c) => c.stage === "Under Review"
	).length;
	const pendingCount = certificates.filter((c) => c.stage === "Pending").length;

	const stats = [
		{
			value: totalRequests,
			label: "إجمالي الطلبات",
			color: "text-[#690000]",
		},
		{
			value: issuedCount,
			label: "صدرت الشهادة",
			color: "text-green-600",
		},
		{
			value: underReviewCount,
			label: "قيد المراجعة",
			color: "text-yellow-600",
		},
		{
			value: pendingCount,
			label: "قيد الانتظار",
			color: "text-blue-600",
		},
	];

	return (
		<div className="px-16 mb-8">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{stats.map((stat, index) => (
					<div
						key={index}
						className="bg-white rounded-lg shadow p-4 text-center"
					>
						<p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
						<p className="text-sm text-gray-600">{stat.label}</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default CertificateStatistics;
