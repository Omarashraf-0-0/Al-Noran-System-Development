import React from "react";

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
}) => {
	const defaultInputClass =
		"shadow border rounded-2xl w-full py-2 px-3 text-sm sm:text-base leading-tight focus:outline-none focus:ring-2 focus:ring-[#690000]/50 focus:shadow-outline bg-white transition-all duration-200";
	const defaultLabelClass =
		"block text-[#690000] text-sm sm:text-base font-bold mb-2 text-right";

	return (
		<div className={`mb-4 w-full ${className}`}>
			<label className={`${defaultLabelClass} ${labelClassName}`} htmlFor={id}>
				{label}
				{required && <span className="text-red-600 mr-1">*</span>}
			</label>
			<input
				className={`${defaultInputClass} ${inputClassName} ${
					type === "password" ? "text-gray-700" : "text-black"
				}`}
				id={id}
				type={type}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				required={required}
				dir="rtl"
			/>
		</div>
	);
};

export default InputField;
