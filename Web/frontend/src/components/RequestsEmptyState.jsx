import React from "react";
import { FileText } from "lucide-react";

const RequestsEmptyState = ({
	onAddNew,
	message = "لا توجد طلبات",
	buttonText = "إضافة طلب جديد",
}) => {
	return (
		<div className="text-center py-12 bg-gray-50 rounded-lg">
			<FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
			<p className="text-gray-500 text-lg mb-4">{message}</p>
			{onAddNew && (
				<button
					onClick={onAddNew}
					className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-700 transition"
				>
					{buttonText}
				</button>
			)}
		</div>
	);
};

export default RequestsEmptyState;
