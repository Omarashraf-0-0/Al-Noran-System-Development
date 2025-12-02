import React from "react";

/**
 * StatusControlSection - Displays current status and controls for changing shipment status
 *
 * TODO: RBAC - This component should check permissions:
 * - canChangeStatus: Allow changing shipment status
 * - canRequestDocuments: Allow requesting documents from client
 */
const StatusControlSection = ({
	currentStatus,
	availableStatuses,
	showDropdown,
	onToggleDropdown,
	onStatusChange,
	onRequestDocuments,
	getStatusColor,
}) => {
	const currentStatusLabel =
		availableStatuses.find((s) => s.value === currentStatus)?.label ||
		currentStatus;

	return (
		<div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 mb-8">
			<h3 className="text-xl font-bold text-red-900 mb-4 text-center">
				🔄 إدارة حالة الشحنة
			</h3>

			<div className="flex flex-col md:flex-row items-center justify-center gap-4">
				{/* Current Status Display */}
				<div className="text-center">
					<p className="text-sm text-gray-600 mb-2">الحالة الحالية:</p>
					<span
						className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(
							currentStatus
						)}`}
					>
						{currentStatusLabel}
					</span>
				</div>

				{/* Change Status Dropdown */}
				<div className="relative">
					<button
						onClick={onToggleDropdown}
						className="bg-red-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-900 transition-all shadow-md flex items-center gap-2"
					>
						<span>تغيير الحالة</span>
						<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
								clipRule="evenodd"
							/>
						</svg>
					</button>

					{/* Dropdown Menu */}
					{showDropdown && (
						<div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
							<div className="p-2">
								{availableStatuses.map((status) => (
									<button
										key={status.value}
										onClick={() => onStatusChange(status.value)}
										className={`w-full text-right px-4 py-3 rounded-md mb-1 transition-colors ${
											status.value === currentStatus
												? "bg-red-50 text-red-800 font-bold"
												: "hover:bg-gray-50 text-gray-700"
										}`}
									>
										<span
											className={`inline-block px-3 py-1 rounded-full text-sm ${status.color} mb-1`}
										>
											{status.label}
										</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Request Documents Button */}
				{/* TODO: RBAC - Only show if hasPermission('shipment:requestDocuments') */}
				<button
					onClick={onRequestDocuments}
					className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md flex items-center gap-2"
				>
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
							clipRule="evenodd"
						/>
					</svg>
					<span>طلب مستندات</span>
				</button>
			</div>
		</div>
	);
};

export default StatusControlSection;
