import React from "react";
import InputField from "./InputField";
import Spacer from "./Spacer";
import Button from "./Button";
import FieldRow from "./FieldRow";
import { Link } from "react-router";

const ACIDRequestForm = ({ 
	onSubmit,
	selectedFile,
	uploadedInvoice, 
	uploading, 
	progress, 
	onFileSelect, 
	onDeleteUpload, 
	onViewDocument 
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
		if (field.includes('.')) {
			const [parent, child] = field.split('.');
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
			<div 
				className={`border-2 rounded-lg p-4 mb-6 transition-all ${
					selectedFile || uploadedInvoice
						? "border-green-500 bg-green-50"
						: "border-gray-300 bg-white hover:border-blue-400"
				}`}
				dir="rtl"
			>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-3">
						<span className="text-2xl">
							{uploadedInvoice ? "✅" : selectedFile ? "📄" : "📎"}
						</span>
						<div>
							<h3 className="font-semibold text-gray-800">
								فاتورة مبدئية <span className="text-red-500">*</span>
							</h3>
							<span className="text-xs text-gray-500">
								(PDF أو صورة - حد أقصى 10 ميجابايت)
							</span>
						</div>
					</div>

					{selectedFile || uploadedInvoice ? (
						<div className="flex gap-2">
							{uploadedInvoice && (
								<button
									type="button"
									onClick={onViewDocument}
									className="btn btn-sm btn-info text-white"
								>
									👁️ عرض
								</button>
							)}
							<button
								type="button"
								onClick={onDeleteUpload}
								className="btn btn-sm btn-error text-white"
							>
								🗑️ حذف
							</button>
						</div>
					) : (
						<label className="btn btn-sm btn-primary text-white">
							📤 اختر ملف
							<input
								type="file"
								className="hidden"
								accept=".pdf,.jpg,.jpeg,.png"
								onChange={(e) => onFileSelect(e.target.files[0])}
								disabled={uploading}
							/>
						</label>
					)}
				</div>

				{/* Upload Progress Bar */}
				{uploading && (
					<div className="mt-3">
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style={{ width: `${progress}%` }}
							></div>
						</div>
						<p className="text-xs text-gray-600 mt-1 text-center">
							{progress}%
						</p>
					</div>
				)}

				{/* File Info */}
				{selectedFile && !uploadedInvoice && (
					<div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
						<p>📄 {selectedFile.name}</p>
						<p className="text-gray-500">
							الحجم: {(selectedFile.size / 1024 / 1024).toFixed(2)} ميجابايت
						</p>
						<p className="text-blue-600 font-semibold mt-1">
							⏳ سيتم الرفع عند الضغط على "إرسال الطلب"
						</p>
					</div>
				)}
				
				{uploadedInvoice && (
					<div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
						<p>📄 {uploadedInvoice.filename}</p>
						<p className="text-gray-500">
							تم الرفع: {new Date(uploadedInvoice.uploadedAt).toLocaleDateString("ar-EG")}
						</p>
					</div>
				)}
			</div>				{/* رقم الهاتف ورقم الضريبة - جنب بعض في الشاشات الكبيرة */}
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
