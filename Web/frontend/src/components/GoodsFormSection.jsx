import React from "react";
import FieldRow from "./FieldRow";
import InputField from "./InputField";
import Spacer from "./Spacer";

const GoodsFormSection = ({ goodsData, onInputChange }) => {
	return (
		<>
			<FieldRow columns={2}>
				<InputField
					id="goods.weight"
					type="number"
					label=" (kg)الوزن المبدئى"
					placeholder="50"
					value={goodsData.weight}
					onChange={onInputChange("goods.weight")}
				/>
				<InputField
					id="goods.customsItem"
					type="text"
					label="البند الجمركي"
					placeholder="ادخل البند الجمركي"
					value={goodsData.customsItem}
					onChange={onInputChange("goods.customsItem")}
					required
				/>
			</FieldRow>

			<Spacer size="sm" />

			<FieldRow columns={1}>
				<InputField
					id="goods.description"
					type="text"
					label="وصف البضاعة"
					placeholder="أدخل وصف البضاعة"
					value={goodsData.description}
					onChange={onInputChange("goods.description")}
					required
				/>
			</FieldRow>
		</>
	);
};

export default GoodsFormSection;
