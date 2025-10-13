import React from "react";

/**
 * Checkbox Component - للاستخدام في الفورمات
 */
const Checkbox = ({
	id,
	name,
	checked,
	onChange,
	label,
	required = false,
	className = "",
}) => {
	return (
		<div className={`flex items-start ${className}`}>
			<input
				type="checkbox"
				id={id}
				name={name}
				checked={checked}
				onChange={onChange}
				className="ml-2 mt-1 w-4 h-4 text-[#690000] focus:ring-2 focus:ring-[#690000]/50 rounded cursor-pointer"
				required={required}
			/>
			<label
				htmlFor={id}
				className="text-sm sm:text-base text-right cursor-pointer select-none"
			>
				{label}
			</label>
		</div>
	);
};

export default Checkbox;
