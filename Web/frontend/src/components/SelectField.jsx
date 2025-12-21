import React from "react";
import { useTheme } from "../context/ThemeContext";

const SelectField = ({
	id,
	name,
	label,
	value,
	onChange,
	options = [],
	placeholder = "",
	className = "",
	labelClassName = "",
	inputClassName = "",
	required = false,
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
			{label && (
				<label className={`${defaultLabelClass} ${labelClassName}`} htmlFor={id}>
					{label}
					{required && <span className="text-red-500 mr-1">*</span>}
				</label>
			)}
			<select
				className={`${defaultInputClass} ${inputClassName}`}
				id={id}
				name={name || id}
				value={value}
				onChange={onChange}
				required={required}
				dir="rtl"
			>
				{placeholder && (
					<option value="" className={isDarkMode ? "bg-[#1a1010] text-gray-400" : "bg-white text-gray-500"}>
						{placeholder}
					</option>
				)}
				{options.map((option) => (
					<option 
						key={option.value} 
						value={option.value}
						className={isDarkMode ? "bg-[#1a1010] text-white" : "bg-white text-black"}
					>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
};

export default SelectField;
