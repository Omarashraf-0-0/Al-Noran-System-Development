import React from "react";

const FormContainer = ({ children, className = "" }) => {
	return (
		<div className="flex items-center justify-center min-h-screen w-full px-4 py-8">
			<div
				className={`bg-white/30 backdrop-blur-sm p-4 sm:p-8 md:p-12 lg:p-16 rounded shadow-md w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl transparent-box ${className}`}
			>
				{children}
			</div>
		</div>
	);
};

export default FormContainer;
