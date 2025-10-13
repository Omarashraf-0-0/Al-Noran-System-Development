import React from "react";

const Button = ({
	children,
	onClick,
	type = "button",
	variant = "primary",
	size = "md",
	className = "",
	disabled = false,
}) => {
	const baseClasses =
		"font-medium rounded-3xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#690000]/50 transition-all duration-200 active:scale-95";

	const variants = {
		primary:
			"bg-[#690000] hover:bg-[#690000]/80 text-white shadow-md hover:shadow-lg",
		secondary:
			"bg-gray-500 hover:bg-gray-600 text-white shadow-md hover:shadow-lg",
		outline:
			"border-2 border-[#690000] text-[#690000] hover:bg-[#690000] hover:text-white",
	};

	const sizes = {
		sm: "py-1 px-3 text-xs sm:text-sm",
		md: "py-2 px-4 text-sm sm:text-base",
		lg: "py-3 px-6 text-base sm:text-lg",
		full: "py-2 sm:py-3 px-4 w-full text-sm sm:text-base",
	};

	return (
		<button
			className={`${baseClasses} ${variants[variant]} ${
				sizes[size]
			} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
			type={type}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
};

export default Button;
