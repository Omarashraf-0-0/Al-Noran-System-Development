import React, { useRef, useEffect } from "react";

const OTPInput = ({ length = 6, value = "", onChange }) => {
	const inputRefs = useRef([]);

	useEffect(() => {
		// Focus first input on mount
		if (inputRefs.current[0]) {
			inputRefs.current[0].focus();
		}
	}, []);

	const handleChange = (index, e) => {
		const val = e.target.value;

		// Only allow numbers
		if (!/^\d*$/.test(val)) return;

		// Get current OTP array
		const otpArray = value.split("");
		otpArray[index] = val.slice(-1); // Take only the last character

		// Update the OTP value
		const newOTP = otpArray.join("");
		onChange(newOTP);

		// Move to next input if value is entered
		if (val && index < length - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index, e) => {
		// Move to previous input on backspace if current input is empty
		if (e.key === "Backspace" && !value[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}

		// Move to next input on right arrow
		if (e.key === "ArrowRight" && index < length - 1) {
			inputRefs.current[index + 1]?.focus();
		}

		// Move to previous input on left arrow
		if (e.key === "ArrowLeft" && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text/plain").trim();

		// Only process if pasted data contains only numbers
		if (!/^\d+$/.test(pastedData)) return;

		// Take only the required length
		const otpArray = pastedData.slice(0, length).split("");
		const newOTP = otpArray.join("").padEnd(length, "");
		onChange(newOTP);

		// Focus the next empty input or the last one
		const nextEmptyIndex = otpArray.length < length ? otpArray.length : length - 1;
		inputRefs.current[nextEmptyIndex]?.focus();
	};

	return (
		<div className="flex justify-center gap-2 sm:gap-3 md:gap-4 dir-ltr">
			{Array.from({ length }).map((_, index) => (
				<input
					key={index}
					ref={(el) => (inputRefs.current[index] = el)}
					type="text"
					inputMode="numeric"
					maxLength={1}
					value={value[index] || ""}
					onChange={(e) => handleChange(index, e)}
					onKeyDown={(e) => handleKeyDown(index, e)}
					onPaste={handlePaste}
					className={`
						w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
						text-center text-xl sm:text-2xl md:text-3xl font-bold
						border-2 rounded-lg
						${value[index] ? "border-[#690000] bg-[#690000]/5" : "border-gray-300"}
						focus:border-[#690000] focus:outline-none focus:ring-2 focus:ring-[#690000]/20
						transition-all duration-200
						text-[#690000]
					`}
					aria-label={`رقم OTP ${index + 1}`}
				/>
			))}
		</div>
	);
};

export default OTPInput;
