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
		shipmentType: "بحري", // Default to sea shipment
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

				<Spacer size="md" />

				{/* Shipment Type Selection */}
				<div className="mb-6">
					<label className="block text-gray-700 text-sm font-bold mb-3">
						نوع الشحنة <span className="text-red-500">*</span>
					</label>
					<div className="flex gap-4">
						<label className="flex items-center cursor-pointer">
							<input
								type="radio"
								name="shipmentType"
								value="بحري"
								checked={formData.shipmentType === "بحري"}
								onChange={handleInputChange("shipmentType")}
								className="mr-2 w-4 h-4 text-[#1BA3B6] focus:ring-[#1BA3B6]"
							/>
							<span className="text-gray-700 text-base">🚢 بحري</span>
						</label>
						<label className="flex items-center cursor-pointer">
							<input
								type="radio"
								name="shipmentType"
								value="جوي"
								checked={formData.shipmentType === "جوي"}
								onChange={handleInputChange("shipmentType")}
								className="mr-2 w-4 h-4 text-[#1BA3B6] focus:ring-[#1BA3B6]"
							/>
							<span className="text-gray-700 text-base">✈️ جوي</span>
						</label>
					</div>
				</div>

				{/* Goods Information Section */}
				<GoodsFormSection
					goodsData={formData.goods}
					onInputChange={handleInputChange}
				/>

				<Spacer size="md" />

				{/* Supplier Information Section */}
			<div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
				<p className="text-blue-800 font-semibold mb-4 text-sm">
					ℹ️ معلومات المورد (المستورد) - يرجى إدخال بيانات المورد وليس بيانات العميل
				</p>
				<SupplierFormSection
					supplierData={formData.supplier}
					onInputChange={handleInputChange}
				/>
			</div>
			<Spacer size="md" />
			<div className="flex items-center justify-center w-full">
				<Button type="submit" size="full">
					إرسال الطلب
				</Button>
			</div>
			</form>
		</div>
	);
};

export default ACIDRequestForm;
