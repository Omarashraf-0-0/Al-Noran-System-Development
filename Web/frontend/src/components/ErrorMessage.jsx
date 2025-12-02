import React from "react";

const ErrorMessage = ({
	error,
	onRetry,
	retryButtonText = "إعادة المحاولة",
}) => {
	return (
		<div className="max-w-2xl mx-auto bg-red-50 border border-red-300 rounded-lg p-8 text-center">
			<p className="text-red-800 font-medium mb-4">❌ {error}</p>
			{onRetry && (
				<button
					onClick={onRetry}
					className="inline-block bg-red-800 text-white px-6 py-2 rounded hover:bg-red-700 transition"
				>
					{retryButtonText}
				</button>
			)}
		</div>
	);
};

export default ErrorMessage;
