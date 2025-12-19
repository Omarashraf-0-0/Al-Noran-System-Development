import React from "react";
import FieldRow from "./FieldRow";
import InputField from "./InputField";
import Spacer from "./Spacer";

const SupplierFormSection = ({ supplierData, onInputChange }) => {
	return (
		<>
			<FieldRow columns={2}>
				<InputField
					id="supplier.name"
					type="text"
					label="اسم المورد"
					placeholder="ادخل اسم المورد"
					value={supplierData.name}
					onChange={onInputChange("supplier.name")}
				/>
				<InputField
					id="supplier.taxNum"
					type="text"
					label="الرقم الضريبي"
					placeholder="ادخل الرقم الضريبي"
					value={supplierData.taxNum}
					onChange={onInputChange("supplier.taxNum")}
				/>
			</FieldRow>

			<Spacer size="sm" />

			<FieldRow columns={2}>
				<InputField
					id="supplier.country"
					type="text"
					label="الدولة"
					placeholder="ادخل الدولة"
					value={supplierData.country}
					onChange={onInputChange("supplier.country")}
				/>
				<InputField
					id="supplier.email"
					type="email"
					label="البريد الألكترونى"
					placeholder="ادخل البريد الألكترونى"
					value={supplierData.email}
					onChange={onInputChange("supplier.email")}
				/>
			</FieldRow>

			<Spacer size="sm" />

			<FieldRow columns={1}>
				<InputField
					id="supplier.mobileNum"
					type="tel"
					label="رقم الهاتف"
					placeholder="ادخل رقم الهاتف"
					value={supplierData.mobileNum}
					onChange={onInputChange("supplier.mobileNum")}
				/>
			</FieldRow>
		</>
	);
};

export default SupplierFormSection;
