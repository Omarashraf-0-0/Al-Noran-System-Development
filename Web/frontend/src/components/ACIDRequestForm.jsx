import React from "react";
import Spacer from "./Spacer";
import Button from "./Button";
import FileUploadCard from "./FileUploadCard";
import GoodsFormSection from "./GoodsFormSection";
import SupplierFormSection from "./SupplierFormSection";
import { Link } from "react-router";

const ACIDRequestForm = ({
	onSubmit,
	selectedFile,
	uploadedInvoice,
	uploading,
	progress,
	onFileSelect,
	onDeleteUpload,
	onViewDocument,
}) => {
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
		const value = e.target.value;

		// Handle nested properties (e.g., "goods.weight" or "supplier.name")
		if (field.includes(".")) {
			const [parent, child] = field.split(".");
			setFormData((prev) => ({
				...prev,
				[parent]: {
					...prev[parent],
					[child]: value,
				},
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[field]: value,
			}));
		}
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
				{/* Proforma Invoice Upload Card */}
				<FileUploadCard
					selectedFile={selectedFile}
					uploadedFile={uploadedInvoice}
					uploading={uploading}
					progress={progress}
					onFileSelect={onFileSelect}
					onDeleteUpload={onDeleteUpload}
					onViewDocument={onViewDocument}
					label="فاتورة مبدئية"
					required={true}
				/>

				{/* Goods Information Section */}
				<GoodsFormSection
					goodsData={formData.goods}
					onInputChange={handleInputChange}
				/>

				<Spacer size="md" />

				{/* Supplier Information Section */}
				<SupplierFormSection
					supplierData={formData.supplier}
					onInputChange={handleInputChange}
				/>

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
