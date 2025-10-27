import React from "react";
import InputField from "./InputField";
import Spacer from "./Spacer";
import Button from "./Button";
import FieldRow from "./FieldRow";
import { Link } from "react-router";

const ACIDRequestForm = ({ onSubmit }) => {
	const [formData, setFormData] = React.useState({
        preliminaryInvoice: "",
        goods: {
            weight: "",
            customsItem: "",
            description: "",
        },
        supplier: {
            name: "",
            taxNum: "",
            country: "",
            email: "",
            mobileNum: "",
        },
        requestDate: "",
        status: "",
        acidCode: "",
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
		
		if (onSubmit) {
			onSubmit(formData);
		}
	};

	return (
		<div className="w-full">
			<Spacer size="md" />
			<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center text-[#690000]">
				فاتورة مبدئية 
			</h2>
			<Spacer size="xl" />

			<form onSubmit={handleSubmit} className="w-full">
				{/* we need upload preliminaryInvoice input field*/}
				<InputField
					id="preliminaryInvoice"
					type="file"
					label="فاتورة مبدئية "
					placeholder="فاتورة مبدئية "
					value={formData.preliminaryInvoice}
					onChange={handleInputChange("preliminaryInvoice")}
					required
				/>

				

				{/* رقم الهاتف ورقم الضريبة - جنب بعض في الشاشات الكبيرة */}
				<FieldRow columns={2}>
                    <InputField
                        id="goods.weight"
                        type="number"
                        label=" (kg)الوزن المبدئى"
                        placeholder="50"
                        value={formData.goods?.weight}
                        onChange={handleInputChange("goods.weight")}
                        required
                    />
			

					<InputField
						id="goods.customsItem"
						type="text"
						label="البند الجمركي"
						placeholder="ادخل البند الجمركي"
						value={formData.goods?.customsItem}
						onChange={handleInputChange("goods.customsItem")}
						required
					/>
				</FieldRow>

				{/* كلمة المرور وتأكيدها - جنب بعض في الشاشات الكبيرة */}
				<FieldRow columns={2}>
                    <InputField
                        id="goods.description"
                        type="text"
                        label="وصف البضاعة"
                        placeholder="أدخل وصف البضاعة"
                        value={formData.goods?.description}
                        onChange={handleInputChange("goods.description")}
                        required
                    />
					<InputField
						id="supplier.name"
						type="text"
                        label="اسم المورد"
                        placeholder="ادخل اسم المورد"
                        value={formData.supplier?.name}
                        onChange={handleInputChange("supplier.name")}
					/>
					
				</FieldRow>

				<Spacer size="sm" />


				{/* نوع الحساب */}  
				<FieldRow columns={2}>
					<InputField
						id="supplier.taxNum"
						type="text"
						label="نوع الحساب"
						placeholder="ادخل نوع الحساب"
						value={formData.supplier?.taxNum}
						onChange={handleInputChange("supplier.taxNum")}
						required
					/>
                    <InputField
                        id="supplier.country"
                        type="text"
                        label="الدولة"
                        placeholder="ادخل الدولة"
                        value={formData.supplier?.country}
                        onChange={handleInputChange("supplier.country")}
                        required
                    />
				</FieldRow>

				<Spacer size="sm" />

                {/* الايميل والموبايل - جنب بعض في الشاشات الكبيرة */}
                <FieldRow columns={2}>
                    <InputField
                        id="supplier.email"
                        type="email"
                        label="البريد الألكترونى"
                        placeholder="ادخل البريد الألكترونى"
                        value={formData.supplier?.email}
                        onChange={handleInputChange("supplier.email")}
                        required
                    />
                    <InputField
                        id="supplier.mobileNum"
                        type="tel"
                        label="رقم الهاتف"
                        placeholder="ادخل رقم الهاتف"
                        value={formData.supplier?.mobileNum}
                        onChange={handleInputChange("supplier.mobileNum")}
                        required
                    />
                </FieldRow>

				<Spacer size="md" />


				<div className="flex items-center justify-center w-full">
					<Button type="submit" size="full">
						إرسال الطلب
					</Button>
				</div>
				<Spacer size="md" />
			</form>

			<Spacer size="md" />
		</div>
	);
};

export default ACIDRequestForm;
