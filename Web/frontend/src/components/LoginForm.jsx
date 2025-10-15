import React, { useState } from "react";
import InputField from "./InputField";
import Button from "./Button";
import Spacer from "./Spacer";
import { Link } from "react-router";

const LoginForm = ({ onSubmit, onForgotPassword }) => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const handleInputChange = (field) => (e) => {
		setFormData((prev) => ({
			...prev,
			[field]: e.target.value,
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (onSubmit) {
			onSubmit(formData);
		}
	};

	return (
		<div className="w-full">
			<Spacer size="md" />
			<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center text-[#690000]">
				تسجيل الدخول
			</h2>
			<Spacer size="xl" />

			<form onSubmit={handleSubmit} className="w-full">
				<InputField
					id="email"
					type="email"
					label="البريد الألكترونى"
					placeholder="ادخل البريد الألكترونى"
					value={formData.email}
					onChange={handleInputChange("email")}
					required
				/>

				<InputField
					id="password"
					type="password"
					label="كلمة المرور"
					placeholder="ادخل كلمة المرور"
					value={formData.password}
					onChange={handleInputChange("password")}
					className="mb-6"
					required
				/>

				<Spacer size="lg" />

				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-start w-full sm:w-auto">
						<p className="text-sm sm:text-base">
							<Link to="/forgetpassword"
								className="text-[#690000] underline hover:text-[#690000]/70"
							>هل نسيت كلمة المرور؟</Link>
						</p>
					</div>
				</div>

				<Spacer size="sm" />

				<div className="flex items-center justify-center w-full">
					<Button type="submit" size="full">
						تسجيل الدخول
					</Button>
				</div>
			</form>

			<Spacer size="md" />
		</div>
	);
};

export default LoginForm;
