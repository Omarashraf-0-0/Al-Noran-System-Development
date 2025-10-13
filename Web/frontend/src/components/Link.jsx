import React from "react";

const Link = ({
	href = "#",
	children,
	className = "",
	color = "primary",
	underline = true,
	onClick,
}) => {
	const colors = {
		primary: "text-[#690000] hover:text-[#690000]/70",
		secondary: "text-gray-600 hover:text-gray-800",
		white: "text-white hover:text-gray-200",
	};

	const underlineClass = underline ? "underline" : "";

	return (
		<a
			href={href}
			className={`${colors[color]} ${underlineClass} cursor-pointer transition-colors duration-200 ${className}`}
			onClick={onClick}
		>
			{children}
		</a>
	);
};

export default Link;
