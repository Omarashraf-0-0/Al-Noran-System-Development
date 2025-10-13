import React from "react";
import InputField from "./InputField";
import Spacer from "./Spacer";
import Button from "./Button";
import FieldRow from "./FieldRow";
import { Link } from "react-router";

const RegisterForm = ({ onSubmit }) => {
	const [formData, setFormData] = React.useState({
		fullName: "",
		email: "",
		phoneNumber: "",
		userName: "",
		password: "",
		confirmPassword: "",
		accountType: "",
		ssn: "",
		terms: false,
	});

	const handleInputChange = (field) => (e) => {
		setFormData((prev) => ({
			...prev,
			[field]: e.target.value,
		}));
	};

	const handleCheckboxChange = (field) => (e) => {
		setFormData((prev) => ({
			...prev,
			[field]: e.target.checked,
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		// التحقق من كلمة المرور
		if (formData.password !== formData.confirmPassword) {
			alert("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
			return;
		}

		// التحقق من رقم البطاقة القومية للحسابات الشخصية
		if (formData.accountType === "personal") {
			if (!formData.ssn || formData.ssn.length !== 14) {
				alert("رجاءً أدخل رقم بطاقة قومية صحيح (14 رقم)");
				return;
			}
		}

		// التحقق من الموافقة على الشروط والأحكام
		if (!formData.terms) {
			alert("يجب الموافقة على الشروط والأحكام");
			return;
		}

		if (onSubmit) {
			onSubmit(formData);
		}
	};

	return (
		<div className="w-full">
			<Spacer size="md" />
			<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center text-[#690000]">
				إنشاء حساب
			</h2>
			<Spacer size="xl" />

			<form onSubmit={handleSubmit} className="w-full">
				{/* الاسم والإيميل - كل واحد في سطر لوحده */}
				<InputField
					id="fullName"
					type="text"
					label="الاسم الكامل"
					placeholder="ادخل الاسم الكامل"
					value={formData.fullName}
					onChange={handleInputChange("fullName")}
					required
				/>

				<InputField
					id="email"
					type="email"
					label="البريد الألكترونى"
					placeholder="ادخل البريد الألكترونى"
					value={formData.email}
					onChange={handleInputChange("email")}
					required
				/>

				{/* رقم الهاتف ورقم الضريبة - جنب بعض في الشاشات الكبيرة */}
				<FieldRow columns={2}>
					<InputField
						id="phoneNumber"
						type="tel"
						label="رقم الهاتف"
						placeholder="ادخل رقم الهاتف"
						value={formData.phoneNumber}
						onChange={handleInputChange("phoneNumber")}
						required
					/>

					<InputField
						id="userName"
						type="text"
						label="اسم المستخدم"
						placeholder="ادخل اسم المستخدم"
						value={formData.userName}
						onChange={handleInputChange("userName")}
						required
					/>
				</FieldRow>

				{/* كلمة المرور وتأكيدها - جنب بعض في الشاشات الكبيرة */}
				<FieldRow columns={2}>
					<InputField
						id="password"
						type="password"
						label="كلمة المرور"
						placeholder="ادخل كلمة المرور"
						value={formData.password}
						onChange={handleInputChange("password")}
						required
					/>

					<InputField
						id="confirmPassword"
						type="password"
						label="تأكيد كلمة المرور"
						placeholder="أعد إدخال كلمة المرور"
						value={formData.confirmPassword}
						onChange={handleInputChange("confirmPassword")}
						required
					/>
				</FieldRow>

				<Spacer size="sm" />

				{/* نوع الحساب */}
				<div className="mb-4">
					<label className="block text-[#690000] text-sm sm:text-base font-bold mb-3 text-right">
						نوع الحساب <span className="text-red-600 mr-1">*</span>
					</label>
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex items-center">
							<input
								type="radio"
								id="personal"
								name="accountType"
								value="personal"
								checked={formData.accountType === "personal"}
								onChange={handleInputChange("accountType")}
								className="ml-2 w-4 h-4 text-[#690000] focus:ring-[#690000]"
								required
							/>
							<label
								htmlFor="personal"
								className="text-sm sm:text-base text-[#690000] cursor-pointer"
							>
								شخصي
							</label>
						</div>

						<div className="flex items-center">
							<input
								type="radio"
								id="commercial"
								name="accountType"
								value="commercial"
								checked={formData.accountType === "commercial"}
								onChange={handleInputChange("accountType")}
								className="ml-2 w-4 h-4 text-[#690000] focus:ring-[#690000]"
								required
							/>
							<label
								htmlFor="commercial"
								className="text-sm sm:text-base text-[#690000] cursor-pointer"
							>
								تجاري
							</label>
						</div>

						<div className="flex items-center">
							<input
								type="radio"
								id="factory"
								name="accountType"
								value="factory"
								checked={formData.accountType === "factory"}
								onChange={handleInputChange("accountType")}
								className="ml-2 w-4 h-4 text-[#690000] focus:ring-[#690000]"
								required
							/>
							<label
								htmlFor="factory"
								className="text-sm sm:text-base text-[#690000] cursor-pointer"
							>
								مصنع
							</label>
						</div>
					</div>
				</div>

				{/* رقم البطاقة القومية - يظهر فقط للحسابات الشخصية */}
				{formData.accountType === "personal" && (
					<>
						<Spacer size="sm" />
						<InputField
							id="ssn"
							type="text"
							label="رقم البطاقة القومية"
							placeholder="ادخل رقم البطاقة القومية (14 رقم)"
							value={formData.ssn}
							onChange={handleInputChange("ssn")}
							required
							inputClassName="tracking-wider"
						/>
					</>
				)}

				<Spacer size="md" />
				{/* الموافقة على الشروط والأحكام */}
				<div className="flex items-start mb-4">
					<input
						type="checkbox"
						id="terms"
						name="terms"
						checked={formData.terms}
						onChange={handleCheckboxChange("terms")}
						className="ml-2 mt-1 w-4 h-4 text-[#690000] focus:ring-[#690000] rounded"
						required
					/>
					<label
						htmlFor="terms"
						className="text-sm sm:text-base text-right cursor-pointer"
					>
						<span className="text-[#690000]">أوافق على</span>{" "}
						<a
							href="/terms"
							className="text-[#690000] underline hover:text-[#690000]/70"
							target="_blank"
							rel="noopener noreferrer"
						>
							الشروط والأحكام
						</a>
					</label>
				</div>

				<Spacer size="sm" />

				<div className="flex items-center justify-center w-full">
					<Button type="submit" size="full">
						إنشاء حساب
					</Button>
				</div>
				<Spacer size="lg" />

				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-start w-full sm:w-auto">
						<p className="text-sm sm:text-base">
							<Link
								to="/login"
								className="text-[#690000] underline hover:text-[#690000]/70"
							>
								لديك حساب بالفعل؟ تسجيل الدخول
							</Link>
						</p>
					</div>
				</div>
			</form>

			<Spacer size="md" />
		</div>
	);
};

export default RegisterForm;
