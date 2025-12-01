import React from "react";

const LoadingSpinner = ({ message = "جاري التحميل..." }) => {
	return (
		<div className="flex justify-center items-center py-20 gap-4">
			<div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
			<span className="text-gray-600 text-lg">{message}</span>
		</div>
	);
};

export default LoadingSpinner;
