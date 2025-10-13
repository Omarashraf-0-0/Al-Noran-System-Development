import React from "react";

const Spacer = ({ size = "md" }) => {
	const sizes = {
		xs: "mb-1 sm:mb-2",
		sm: "mb-2 sm:mb-3",
		md: "mb-3 sm:mb-4",
		lg: "mb-4 sm:mb-6 md:mb-8",
		xl: "mb-8 sm:mb-12 md:mb-16",
	};

	return <div className={sizes[size]}></div>;
};

export default Spacer;
