import React from "react";

const FormContainer = ({ children, className = "" }) => {
	return (
		<div className="flex items-center justify-center min-h-screen w-full px-4 pb-12 pt-28">
			<div
				className={`bg-white/90 backdrop-blur-xl p-6 sm:p-10 md:p-14 lg:p-20 rounded-3xl shadow-2xl border border-white/40 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl ${className}`}
			>
				{children}
			</div>
		</div>
	);
};

export default FormContainer;
