import React, { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";

const TrackingSection = () => {
	const [trackingNumber, setTrackingNumber] = useState("");
	const [isTracking, setIsTracking] = useState(false);
	const [trackingResult, setTrackingResult] = useState(null);

	const handleTrack = async (e) => {
		e.preventDefault();

		if (!trackingNumber.trim()) {
			toast.error("يرجى إدخال اسم السفينة");
			return;
		}

		setIsTracking(true);
		setTrackingResult(null);

		try {
			// Using the new vessel tracking API
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/vessel/track?name=${trackingNumber}`
			);
			setTrackingResult(response.data);
			toast.success("تم العثور على السفينة!");
		} catch (error) {
			console.error("Tracking error:", error);
			if (error.response?.status === 404) {
				toast.error("لم يتم العثور على سفينة بهذا الاسم");
			} else {
				toast.error("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى");
			}
		} finally {
			setIsTracking(false);
		}
	};

	return (
		<section
			id="tracking-section"
			className="py-20 bg-white relative overflow-hidden"
		>
			{/* Decorative background element */}
			<div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
			<div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

			<div className="container mx-auto px-4 relative z-10">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl md:text-5xl font-bold text-[#690000] mb-4">
						تتبع شحنتك البحرية
					</h2>
					<p className="text-xl text-gray-500 mb-10">
						لمعرفة موقع السفينة والميناء الأخير، أدخل اسم السفينة
					</p>

					<form onSubmit={handleTrack} className="relative mb-8">
						<div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 rounded-2xl shadow-xl border border-gray-100">
							<input
								type="text"
								value={trackingNumber}
								onChange={(e) => setTrackingNumber(e.target.value)}
								placeholder="ادخل اسم السفينة (مثال: EVER GIVEN)"
								className="
									flex-1 w-full px-6 py-4 
									rounded-xl
									focus:ring-2 focus:ring-[#3BA5A8] focus:outline-none
									text-lg text-right
									placeholder:text-gray-400
									text-gray-800
									bg-gray-50
									border border-transparent
									transition-all
								"
								dir="rtl"
							/>
							<button
								type="submit"
								disabled={isTracking}
								className="
									w-full sm:w-auto
									bg-gradient-to-r from-[#6B1212] to-[#8B1414] 
									text-white 
									px-10 py-4 rounded-xl
									font-bold text-lg
									hover:shadow-lg hover:to-[#6B1212]
									transition-all duration-300
									disabled:opacity-50 disabled:cursor-not-allowed
									whitespace-nowrap
								"
							>
								{isTracking ? (
									<span className="flex items-center gap-2">
										<svg
											className="animate-spin h-5 w-5 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										جاري البحث...
									</span>
								) : (
									"تتبع السفينة"
								)}
							</button>
						</div>
					</form>

					{/* Search Results */}
					{trackingResult && (
						<div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden text-right animate-fade-in-up">
							<div className="bg-[#690000] text-white p-4">
								<h3 className="text-2xl font-bold">
									{trackingResult.name} <span className="text-sm font-normal opacity-80">({trackingResult.type})</span>
								</h3>
							</div>

							<div className="p-6">
								{/* Key Stats Grid */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
									<div className="bg-red-50 p-6 rounded-xl border border-red-100">
										<p className="text-gray-500 text-sm mb-1">آخر ميناء (Last Port)</p>
										<p className="text-2xl font-bold text-[#690000]">
											{trackingResult.lastPort}
										</p>
									</div>
									<div className="bg-teal-50 p-6 rounded-xl border border-teal-100">
										<p className="text-gray-500 text-sm mb-1">السرعة الحالية</p>
										<p className="text-2xl font-bold text-[#3BA5A8]">
											{trackingResult.speed} kn
										</p>
									</div>
								</div>

								{/* ETA Table */}
								<div className="flex justify-between items-center mb-4 border-b pb-2">
									<h4 className="text-lg font-bold text-gray-800">
										الوقت المتوقع للوصول للموانئ المصرية
									</h4>
									{trackingResult.calculationSource && (
										<span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border">
											{trackingResult.calculationSource}
										</span>
									)}
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-sm text-right">
										<thead className="bg-gray-50 text-gray-600">
											<tr>
												<th className="px-4 py-3 rounded-r-lg">الميناء</th>
												<th className="px-4 py-3">المسافة (ميل بحري)</th>
												<th className="px-4 py-3">الوقت المتوقع (ساعات)</th>
												<th className="px-4 py-3 rounded-l-lg">الوقت المتوقع (أيام)</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-100">
											{trackingResult.etaToEgypt.map((port, index) => (
												<tr key={index} className="hover:bg-gray-50 transition-colors">
													<td className="px-4 py-3 font-medium text-gray-800">
														{port.portName}
													</td>
													<td className="px-4 py-3 text-gray-600">
														{port.distance} nm
													</td>
													<td className="px-4 py-3 text-gray-600">
														{port.etaHours} ساعة
													</td>
													<td className="px-4 py-3 text-[#3BA5A8] font-bold">
														{port.etaDays} يوم
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								<div className="mt-6 text-xs text-center text-gray-400">
									* التقديرات بناءً على الموقع الحالي والسرعة المتوسطة. قد تختلف الأوقات الفعلية.
									<br />
									<a href={trackingResult.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 underline mt-1 inline-block">
										عرض التفاصيل على VesselFinder
									</a>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default TrackingSection;
