import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { X, FileText, User, Globe, Box, Calendar, CheckCircle, Ship, MapPin, Anchor, ClipboardList } from 'lucide-react';

const CreateShipmentModal = ({
	show,
	data, // Contains ACID request details (acidCode, client, supplier, goods)
	onClose,
	onConfirm, // Function to handle shipment creation
}) => {
	if (!show || !data) return null;

	const [formData, setFormData] = useState({
		portName: "",
		country: "",
		containerCount: 1,
		containerTypes: ["20ft"],
		arrivalDate: "",
		billOfLading: "",
	});

	React.useEffect(() => {
		if (data && show) {
			setFormData(prev => ({
				...prev,
				country: data.supplier?.country || "",
				portName: "",
				containerCount: 1,
				containerTypes: ["20ft"],
				arrivalDate: "",
				billOfLading: ""
			}));
		}
	}, [data, show]);

	const isDarkMode = document.documentElement.classList.contains('dark');

	const theme = {
		bg: isDarkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200',
		text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
		subText: isDarkMode ? 'text-gray-400' : 'text-gray-500', 
		label: isDarkMode ? 'text-gray-300' : 'text-gray-700',
		input: isDarkMode ? 'bg-black/30 border-gray-600 focus:border-[#1ba3b6] text-white' : 'bg-gray-50 border-gray-200 focus:border-[#1ba3b6] text-gray-900',
		divider: isDarkMode ? 'border-gray-700' : 'border-gray-100',
		warningBg: isDarkMode ? 'bg-amber-900/20 text-amber-500 border-amber-900/30' : 'bg-amber-50 text-amber-700 border-amber-100'
	};

	const handleInputChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleContainerCountChange = (newCount) => {
		const count = Math.max(1, parseInt(newCount) || 1);
		setFormData(prev => {
			const currentTypes = [...prev.containerTypes];
			if (count > currentTypes.length) {
				// Add new containers
				for (let i = currentTypes.length; i < count; i++) {
					currentTypes.push("20ft");
				}
			} else if (count < currentTypes.length) {
				// Remove containers
				currentTypes.splice(count);
			}
			return {
				...prev,
				containerCount: count,
				containerTypes: currentTypes
			};
		});
	};

	const handleContainerTypeChange = (index, value) => {
		setFormData(prev => {
			const newTypes = [...prev.containerTypes];
			newTypes[index] = value;
			return {
				...prev,
				containerTypes: newTypes
			};
		});
	};

	const handleSubmit = () => {
		if (!formData.portName || !formData.country || formData.containerCount <= 0 || !formData.arrivalDate) {
			toast.error("يرجى ملء جميع الحقول المطلوبة");
			return;
		}
		// Pass the correct data structure back
		onConfirm({
			...formData,
			containerType: formData.containerTypes[0], // Fallback/First one if needed by older logic, but mainly we use the array
			containerTypes: formData.containerTypes
		});
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
			<div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${theme.bg} border transition-all`} onClick={e => e.stopPropagation()}>
				
				{/* Header */}
				<div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${theme.bg} ${theme.divider}`}>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-[#1ba3b6]/10 flex items-center justify-center text-[#1ba3b6]">
							<Ship size={24} />
						</div>
						<div>
							<h2 className={`text-xl font-bold ${theme.text}`}>إنشاء شحنة</h2>
							<p className={`text-xs ${theme.subText}`}>أدخل تفاصيل الشحنة الجديدة المرتبطة برقم ACID</p>
						</div>
					</div>
					<button onClick={onClose} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${theme.text}`}>
						<X size={20} />
					</button>
				</div>

				<div className="p-6 space-y-8">
					
					{/* Summary Section */}
					<section>
						<h3 className="text-[#1ba3b6] font-bold mb-4 flex items-center gap-2">
							<FileText size={18} />
							تفاصيل طلب ACID
						</h3>
						<div className={`p-4 rounded-xl border ${theme.divider} bg-opacity-50 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-2 pb-4 border-b border-dashed border-gray-300 dark:border-gray-600">
									<span className={`text-sm font-bold ${theme.text}`}>كود ACID:</span>
									<span className="font-mono text-lg text-[#1ba3b6] font-bold tracking-wider">{data.acidNumber || "12345678912"}</span>
								</div>
								
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div>
										<span className={`block text-xs font-bold mb-1 ${theme.subText}`}>العميل</span>
										<p className={`text-sm font-bold ${theme.text}`}>{data.userId?.fullname || data.userId?.username || "ialy24405"}</p>
									</div>
									<div>
										<span className={`block text-xs font-bold mb-1 ${theme.subText}`}>المورد</span>
										<p className={`text-sm font-bold ${theme.text}`}>{data.supplier?.name || "شركة التصدير الدولية"}</p>
									</div>
									<div>
										<span className={`block text-xs font-bold mb-1 ${theme.subText}`}>البضائع</span>
										<p className={`text-sm font-bold ${theme.text}`}>{data.goods?.description || "أجهزة كمبيوتر محمولة"}</p>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Shipment Details Form */}
					<section>
						<h3 className="text-[#1ba3b6] font-bold mb-4 flex items-center gap-2">
							<Anchor size={18} />
							بيانات الشحنة
						</h3>
						
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Port Name */}
							<div>
								<label className={`block text-sm font-bold mb-2 ${theme.label}`}>
									اسم الميناء <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<div className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
										<Anchor size={18} />
									</div>
									<select
										value={formData.portName}
										onChange={(e) => handleInputChange("portName", e.target.value)}
										className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none transition-all appearance-none ${theme.input} hover:border-[#1ba3b6]`}
									>
										<option value="">اختر الميناء</option>
										<optgroup label="موانئ البحر المتوسط">
											<option value="الإسكندرية">ميناء الإسكندرية</option>
											<option value="الدخيلة">ميناء الدخيلة</option>
											<option value="دمياط">ميناء دمياط</option>
											<option value="بورسعيد">ميناء بورسعيد (غرب/شرق)</option>
											<option value="العريش">ميناء العريش</option>
											<option value="أبو قير">ميناء أبو قير</option>
										</optgroup>
										<optgroup label="موانئ البحر الأحمر">
											<option value="السخنة">ميناء السخنة</option>
											<option value="السويس">ميناء السويس (بور توفيق)</option>
											<option value="الأدبية">ميناء الأدبية</option>
											<option value="سفاجا">ميناء سفاجا</option>
											<option value="نويبع">ميناء نويبع</option>
											<option value="شرم الشيخ">ميناء شرم الشيخ</option>
											<option value="الغردقة">ميناء الغردقة</option>
										</optgroup>
										<optgroup label="موانئ جافة">
											<option value="6 أكتوبر">ميناء 6 أكتوبر الجاف</option>
											<option value="العاشر من رمضان">ميناء العاشر من رمضان الجاف</option>
										</optgroup>
									</select>
									{/* Custom Arrow because appearance-none hides it */}
									<div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<polyline points="6 9 12 15 18 9"></polyline>
										</svg>
									</div>
								</div>
							</div>

							{/* Country */}
							<div>
								<label className={`block text-sm font-bold mb-2 ${theme.label}`}>
									الدولة <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<div className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
										<Globe size={18} />
									</div>
									<input
										type="text"
										value={formData.country}
										onChange={(e) => handleInputChange("country", e.target.value)}
										placeholder="الدولة"
										className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none transition-all ${theme.input} hover:border-[#1ba3b6]`}
									/>
								</div>
							</div>

							{/* Container Count */}
							<div>
								<label className={`block text-sm font-bold mb-2 ${theme.label}`}>
									عدد الحاويات <span className="text-red-500">*</span>
								</label>
								<div className="flex items-center">
									<button 
										onClick={() => handleContainerCountChange(formData.containerCount - 1)}
										className={`w-12 h-12 flex items-center justify-center rounded-r-xl border-y border-r ${theme.divider} ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} transition-colors ${theme.text}`}
									>
										-
									</button>
									<input
										type="number"
										value={formData.containerCount}
										onChange={(e) => handleContainerCountChange(e.target.value)}
										className={`w-full text-center py-3 border-y ${theme.divider} ${isDarkMode ? 'bg-black/20' : 'bg-white'} ${theme.text} outline-none h-12`}
									/>
									<button 
										onClick={() => handleContainerCountChange(formData.containerCount + 1)}
										className={`w-12 h-12 flex items-center justify-center rounded-l-xl border-y border-l ${theme.divider} ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} transition-colors ${theme.text}`}
									>
										+
									</button>
								</div>
							</div>

							{/* Container Types */}
							<div>
								<label className={`block text-sm font-bold mb-2 ${theme.label}`}>
									أنواع الحاويات <span className="text-red-500">*</span>
								</label>
								<div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
									{formData.containerTypes.map((type, index) => (
										<div key={index} className="flex items-center gap-3">
											<span className={`text-xs font-bold whitespace-nowrap w-16 ${theme.subText}`}>
												حاوية {index + 1}
											</span>
											<div className="relative flex-1">
												<div className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
													<Box size={18} />
												</div>
												<select
													value={type}
													onChange={(e) => handleContainerTypeChange(index, e.target.value)}
													className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none transition-all appearance-none ${theme.input} hover:border-[#1ba3b6] ${isDarkMode ? 'dark:bg-[#1e1e1e]' : ''}`}
												>
													<option value="20ft">20 قدم</option>
													<option value="40ft">40 قدم</option>
													<option value="40hc">40 قدم عالي (High Cube)</option>
													<option value="lcl">جزء من حاوية (LCL)</option>
												</select>
												<div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
													<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
														<polyline points="6 9 12 15 18 9"></polyline>
													</svg>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Expected Arrival Date */}
							<div>
								<label className={`block text-sm font-bold mb-2 ${theme.label}`}>
									تاريخ الوصول المتوقع <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<div className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
										<Calendar size={18} />
									</div>
									<input
										type="date"
										value={formData.arrivalDate}
										onChange={(e) => handleInputChange("arrivalDate", e.target.value)}
										className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none transition-all ${theme.input} hover:border-[#1ba3b6]`}
									/>
								</div>
							</div>

							{/* Bill of Lading (Optional) */}
							<div>
								<label className={`block text-sm font-bold mb-2 ${theme.label}`}>
									البوليصة (اختياري)
								</label>
								<div className="relative">
									<div className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
										<ClipboardList size={18} />
									</div>
									<input
										type="text"
										value={formData.billOfLading}
										onChange={(e) => handleInputChange("billOfLading", e.target.value)}
										placeholder="أدخل تفاصيل البوليصة"
										className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none transition-all ${theme.input} hover:border-[#1ba3b6]`}
									/>
								</div>
							</div>
						</div>
					</section>

				</div>

				{/* Footer Actions */}
				<div className={`sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 p-6 border-t ${theme.bg} ${theme.divider}`}>
					<button 
						onClick={onClose}
						className={`px-6 py-3 rounded-xl font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10`}
					>
						إلغاء
					</button>
					<button
						onClick={handleSubmit}
						className={`px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl bg-[#1ba3b6] hover:bg-[#158a9b] hover:-translate-y-0.5`}
					>
						<CheckCircle size={20} />
						إنشاء الشحنة
					</button>
				</div>
			</div>
		</div>
	);
};

export default CreateShipmentModal;
