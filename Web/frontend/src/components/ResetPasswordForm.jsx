import React, { useState } from "react";
import InputField from "./InputField";
import Spacer from "./Spacer";
import Button from "./Button";
import { Link } from "react-router-dom";

const ResetPasswordForm = ({ onSubmit, email }) => {
	const [formData, setFormData] = useState({
		password: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleInputChange = (field) => (e) => {
		setFormData((prev) => ({
			...prev,
			[field]: e.target.value,
		}));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: "",
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		// Password validation
		if (!formData.password) {
			newErrors.password = "كلمة المرور مطلوبة";
		} else if (formData.password.length < 6) {
			newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
		}

		// Confirm password validation
		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "كلمات المرور غير متطابقة";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (validateForm()) {
			if (onSubmit) {
				onSubmit({
					email,
					password: formData.password,
				});
			}
		}
	};

	return (
		<div className="w-full">
			<Spacer size="md" />
			<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center text-[#690000]">
				إعادة تعيين كلمة المرور
			</h2>
			<p className="text-sm sm:text-base text-gray-600 text-center mb-6">
				أدخل كلمة المرور الجديدة
			</p>
			<Spacer size="lg" />

			<form onSubmit={handleSubmit} className="w-full">
				{/* Password Field */}
				<div className="relative">
					<InputField
						id="password"
						type={showPassword ? "text" : "password"}
						label="كلمة المرور الجديدة"
						placeholder="أدخل كلمة المرور الجديدة"
						value={formData.password}
						onChange={handleInputChange("password")}
						required
					/>
					<button
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						className="absolute left-3 top-[42px] text-gray-600 hover:text-[#690000] transition-colors"
						tabIndex="-1"
					>
						{showPassword ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-5 h-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
								/>
							</svg>
						) : (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-5 h-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						)}
					</button>
				</div>
				{errors.password && (
					<p className="text-red-600 text-sm text-right mt-1 mb-2">
						{errors.password}
					</p>
				)}

				<Spacer size="sm" />

				{/* Confirm Password Field */}
				<div className="relative">
					<InputField
						id="confirmPassword"
						type={showConfirmPassword ? "text" : "password"}
						label="تأكيد كلمة المرور"
						placeholder="أعد إدخال كلمة المرور"
						value={formData.confirmPassword}
						onChange={handleInputChange("confirmPassword")}
						required
					/>
					<button
						type="button"
						onClick={() => setShowConfirmPassword(!showConfirmPassword)}
						className="absolute left-3 top-[42px] text-gray-600 hover:text-[#690000] transition-colors"
						tabIndex="-1"
					>
						{showConfirmPassword ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-5 h-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
								/>
							</svg>
						) : (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-5 h-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						)}
					</button>
				</div>
				{errors.confirmPassword && (
					<p className="text-red-600 text-sm text-right mt-1 mb-2">
						{errors.confirmPassword}
					</p>
				)}

				<Spacer size="lg" />

				<div className="flex items-center justify-center w-full">
					<Button type="submit" size="full">
						تأكيد
					</Button>
				</div>
			</form>

			<Spacer size="md" />

			<div className="text-center">
				<Link
					to="/login"
					className="text-sm sm:text-base text-[#690000] hover:underline"
				>
					العودة لتسجيل الدخول
				</Link>
			</div>
		</div>
	);
};

export default ResetPasswordForm;
