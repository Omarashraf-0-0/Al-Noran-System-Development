import React from "react";

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
	const defaultInputClass =
		"shadow border rounded-2xl w-full py-2 px-3 text-sm sm:text-base leading-tight focus:outline-none focus:ring-2 focus:ring-[#690000]/50 focus:shadow-outline bg-white transition-all duration-200 text-black";
	const defaultLabelClass =
		"block text-[#690000] text-sm sm:text-base font-bold mb-2 text-right";

	return (
		<div className={`mb-4 w-full ${className}`}>
			{label && (
				<label className={`${defaultLabelClass} ${labelClassName}`} htmlFor={id}>
					{label}
					{required && <span className="text-red-600 mr-1">*</span>}
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
				{placeholder && <option value="">{placeholder}</option>}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
};

export default SelectField;
