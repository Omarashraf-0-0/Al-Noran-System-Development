import React from "react";

const ConfirmDialog = ({
	isOpen,
	onConfirm,
	onCancel,
	title,
	message,
	confirmText = "تأكيد",
	cancelText = "إلغاء",
	confirmColor = "red",
}) => {
	if (!isOpen) return null;

	// Map color names to Tailwind classes
	const colorClasses = {
		red: "bg-red-800 hover:bg-red-900 text-white",
		green: "bg-green-600 hover:bg-green-700 text-white",
		blue: "bg-blue-600 hover:bg-blue-700 text-white",
		yellow: "bg-yellow-600 hover:bg-yellow-700 text-white",
		orange: "bg-orange-600 hover:bg-orange-700 text-white",
	};

	const buttonClasses = colorClasses[confirmColor] || colorClasses.red;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
				<h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
					{title}
				</h3>
				<p className="text-gray-600 text-center mb-6">{message}</p>

				<div className="flex gap-3 justify-center">
					<button
						onClick={onCancel}
						className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition"
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						className={`px-6 py-2 rounded-lg font-medium transition ${buttonClasses}`}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmDialog;
