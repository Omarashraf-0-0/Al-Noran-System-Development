import React from "react";

/**
 * UploadProgress Component
 * Displays overall progress of document uploads
 */
const UploadProgress = ({ completedCount, totalCount }) => {
	const completionPercentage = Math.round((completedCount / totalCount) * 100);

	return (
		<div className="mb-8 p-4 bg-blue-50 rounded-lg">
			<div className="flex justify-between items-center mb-2">
				<span className="text-sm font-medium text-gray-700">
					التقدم الإجمالي
				</span>
				<span className="text-sm font-medium text-blue-600">
					{completedCount} / {totalCount}
				</span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-3">
				<div
					className="bg-blue-600 h-3 rounded-full transition-all duration-300"
					style={{ width: `${completionPercentage}%` }}
				></div>
			</div>
			<p className="text-xs text-gray-600 mt-1">
				{completionPercentage}% مكتمل
			</p>
		</div>
	);
};

export default UploadProgress;
