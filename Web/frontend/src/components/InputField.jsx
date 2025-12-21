import React from "react";
import { useTheme } from "../context/ThemeContext";

const InputField = ({
	id,
	type = "text",
	label,
	placeholder,
	value,
	onChange,
	className = "",
	labelClassName = "",
	inputClassName = "",
	required = false,
	min,
	max,
	step,
	pattern,
	title,
}) => {
	const { isDarkMode } = useTheme();

	const defaultInputClass = `
		shadow border rounded-2xl w-full py-3 px-4 text-sm sm:text-base leading-tight focus:outline-none focus:ring-2 transition-all duration-200
		${isDarkMode 
			? "bg-[#0a0505] border-white/10 text-white focus:ring-red-500/50 focus:border-red-500 placeholder-gray-600 shadow-none" 
			: "bg-white border-gray-200 text-black focus:ring-[#690000]/50 focus:shadow-outline placeholder-gray-400"}
	`;

	const defaultLabelClass = `
		block text-sm sm:text-base font-bold mb-2 text-right
		${isDarkMode ? "text-gray-300" : "text-[#690000]"}
	`;

	return (
		<div className={`mb-4 w-full ${className}`}>
			<label className={`${defaultLabelClass} ${labelClassName}`} htmlFor={id}>
				{label}
				{required && <span className="text-red-500 mr-1">*</span>}
			</label>
			<input
				className={`${defaultInputClass} ${inputClassName}`}
				id={id}
				type={type}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				required={required}
				min={min}
				max={max}
				step={step}
				pattern={pattern}
				title={title}
				dir="rtl"
			/>
		</div>
	);
};

export default InputField;
