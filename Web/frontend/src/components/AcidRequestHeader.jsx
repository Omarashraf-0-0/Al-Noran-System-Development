import React from "react";
import AcidStatusBadge from "./AcidStatusBadge";

const AcidRequestHeader = ({ requestData, illustration }) => {
	return (
		<>
			{/* Top illustration */}
			<div className="flex justify-center mb-10">
				<img
					src={illustration}
					alt="ACID Request Illustration"
					className="w-full max-w-lg h-auto"
				/>
			</div>

			{/* Status Badge and ACID Code */}
			<div className="flex justify-between items-center mb-8 flex-wrap gap-4">
				<AcidStatusBadge
					status={requestData.status}
					isLocked={requestData.isLocked}
				/>
				{requestData.acidCode && requestData.acidCode !== "null" && (
					<div className="text-right">
						<p className="text-sm text-gray-500">رقم ACID</p>
						<p className="text-2xl font-bold text-red-800">
							{requestData.acidCode}
						</p>
					</div>
				)}
			</div>

			{/* Request Date */}
			<div className="text-center mb-8">
				<p className="text-gray-500 text-sm">تاريخ الطلب</p>
				<p className="text-gray-700 font-semibold">
					{new Date(
						requestData.requestDate || requestData.createdAt
					).toLocaleDateString("ar-EG", {
						weekday: "long",
						day: "numeric",
						month: "long",
						year: "numeric",
					})}
				</p>
			</div>
		</>
	);
};

export default AcidRequestHeader;
