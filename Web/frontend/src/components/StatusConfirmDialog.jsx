import React from "react";

/**
 * StatusConfirmDialog - Confirmation dialog for status changes
 *
 * TODO: RBAC - This component should check permissions:
 * - canChangeStatus: Allow confirming status changes
 */
const StatusConfirmDialog = ({
	isOpen,
	selectedStatus,
	availableStatuses,
	getStatusColor,
	onConfirm,
	onCancel,
}) => {
	if (!isOpen) return null;

	const statusLabel = availableStatuses.find(
		(s) => s.value === selectedStatus
	)?.label;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
				<h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
					⚠️ تأكيد تغيير الحالة
				</h3>
				<p className="text-gray-600 text-center mb-6">
					هل أنت متأكد من تغيير حالة الشحنة إلى:
				</p>
				<div className="flex justify-center mb-6">
					<span
						className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${getStatusColor(
							selectedStatus
						)}`}
					>
						{statusLabel}
					</span>
				</div>
				<p className="text-sm text-gray-500 text-center mb-6">
					سيتم إرسال إشعار للعميل بالتحديث
				</p>
				<div className="flex gap-3">
					<button
						onClick={onCancel}
						className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
					>
						إلغاء
					</button>
					<button
						onClick={onConfirm}
						className="flex-1 px-4 py-3 bg-red-800 text-white rounded-lg font-bold hover:bg-red-900 transition"
					>
						تأكيد
					</button>
				</div>
			</div>
		</div>
	);
};

export default StatusConfirmDialog;
