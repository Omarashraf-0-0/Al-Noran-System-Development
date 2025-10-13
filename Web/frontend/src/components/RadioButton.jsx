import React from "react";

/**
 * RadioButton Component - للاستخدام في الفورمات
 */
const RadioButton = ({
	id,
	name,
	value,
	checked,
	onChange,
	label,
	required = false,
	className = "",
}) => {
	return (
		<div className={`flex items-center ${className}`}>
			<input
				type="radio"
				id={id}
				name={name}
				value={value}
				checked={checked}
				onChange={onChange}
				className="ml-2 w-4 h-4 text-[#690000] focus:ring-2 focus:ring-[#690000]/50 cursor-pointer"
				required={required}
			/>
			<label
				htmlFor={id}
				className="text-sm sm:text-base text-[#690000] cursor-pointer select-none hover:text-[#690000]/80 transition-colors"
			>
				{label}
			</label>
		</div>
	);
};

export default RadioButton;
