import React, { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

const TrackingSection = () => {
    const { isDarkMode } = useTheme();
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
		<section id="tracking-section" className={`py-24 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#140a0a]" : "bg-white"}`}>
			{/* Decorative background elements */}
			<div className="absolute top-0 right-0 w-80 h-80 bg-[#690000]/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/3"></div>
			<div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1ba3b6]/5 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/3"></div>
			
			{/* Pattern Background */}
			<div className="absolute inset-0 opacity-[0.02]" style={{
				backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23690000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
			}}></div>

			<div className="container mx-auto px-4 relative z-10">
				<div className="max-w-4xl mx-auto">
					{/* Header */}
					<div className="text-center mb-12">
						<span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${isDarkMode ? "bg-[#1ba3b6]/20 text-[#1ba3b6]" : "bg-[#1ba3b6]/10 text-[#1ba3b6]"}`}>
							تتبع السفن البحرية
						</span>
						<h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-[#690000]"}`}>
							تتبع شحنتك البحرية
						</h2>
						<p className={`text-xl ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
							أدخل اسم السفينة لمعرفة موقعها والوقت المتوقع للوصول للموانئ المصرية
						</p>
					</div>

					{/* Search Form */}
					<form onSubmit={handleTrack} className="relative">
						<div className={`p-3 rounded-2xl shadow-2xl border transition-colors duration-300 ${
                            isDarkMode 
                                ? "bg-[#1a1a1a] border-white/10 hover:border-[#1ba3b6]/30" 
                                : "bg-white border-gray-100 hover:border-[#1ba3b6]/30"
                        }`}>
							<div className="flex flex-col sm:flex-row items-center gap-3">
								{/* Search Icon */}
								<div className={`hidden sm:flex items-center justify-center w-14 h-14 rounded-xl ${isDarkMode ? "bg-[#690000]/20" : "bg-[#690000]/10"}`}>
									<svg className={`w-6 h-6 ${isDarkMode ? "text-red-400" : "text-[#690000]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>
								
								{/* Input */}
								<input
									type="text"
									value={trackingNumber}
									onChange={(e) => setTrackingNumber(e.target.value)}
									placeholder="ادخل اسم السفينة (مثال: EVER GIVEN)"
									className={`
										flex-1 w-full px-6 py-4 
										rounded-xl
										focus:ring-2 focus:ring-[#1ba3b6] focus:outline-none
										text-lg text-right
										placeholder:text-gray-400
										border border-transparent
										transition-all duration-300
                                        ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-gray-50 text-gray-800"}
									`}
									dir="rtl"
								/>
								
								{/* Submit Button */}
								<button
									type="submit"
									disabled={isTracking}
									className="
										w-full sm:w-auto
										bg-[#690000] hover:bg-[#8B0000]
										text-white 
										px-10 py-4 rounded-xl
										font-bold text-lg
										shadow-lg hover:shadow-[#690000]/30
										transition-all duration-300
										disabled:opacity-50 disabled:cursor-not-allowed
										whitespace-nowrap
										transform hover:scale-105
									"
								>
									{isTracking ? (
										<span className="flex items-center justify-center gap-2">
											<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											جاري البحث...
										</span>
									) : (
										<span className="flex items-center justify-center gap-2">
											تتبع السفينة
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
											</svg>
										</span>
									)}
								</button>
							</div>
						</div>
						
						{/* Helper Text */}
						<p className="text-center text-gray-400 text-sm mt-4">
							يمكنك البحث باستخدام اسم السفينة بالإنجليزية
						</p>
					</form>

					{/* Search Results */}
					{trackingResult && (
						<div className={`mt-8 rounded-2xl shadow-lg border overflow-hidden text-right animate-fade-in-up ${
                            isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-100"
                        }`}>
							<div className="bg-gradient-to-r from-[#690000] to-[#8B0000] text-white p-6">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-2xl font-bold">
											{trackingResult.name}
										</h3>
										<span className="text-sm font-normal opacity-80 bg-white/20 px-3 py-1 rounded-full mt-2 inline-block">
											{trackingResult.type}
										</span>
									</div>
									<div className="text-4xl">🚢</div>
								</div>
							</div>

							<div className="p-6">
								{/* Key Stats Grid */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
									<div className={`p-6 rounded-xl border transition-all hover:shadow-md ${
                                        isDarkMode 
                                            ? "bg-red-900/10 border-red-900/20" 
                                            : "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50"
                                    }`}>
										<div className="flex items-center gap-3 mb-2">
											<span className="text-2xl">📍</span>
											<p className="text-gray-500 text-sm">آخر ميناء (Last Port)</p>
										</div>
										<p className={`text-2xl font-bold ${isDarkMode ? "text-red-400" : "text-[#690000]"}`}>
											{trackingResult.lastPort}
										</p>
									</div>
									<div className={`p-6 rounded-xl border transition-all hover:shadow-md ${
                                        isDarkMode 
                                            ? "bg-teal-900/10 border-teal-900/20" 
                                            : "bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200/50"
                                    }`}>
										<div className="flex items-center gap-3 mb-2">
											<span className="text-2xl">⚡</span>
											<p className="text-gray-500 text-sm">السرعة الحالية</p>
										</div>
										<p className="text-2xl font-bold text-[#1ba3b6]">
											{trackingResult.speed} kn
										</p>
									</div>
								</div>

								{/* ETA Table */}
								<div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDarkMode ? "border-white/10" : "border-gray-100"}`}>
									<h4 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
										<span>🇪🇬</span>
										الوقت المتوقع للوصول للموانئ المصرية
									</h4>
									{trackingResult.calculationSource && (
										<span className={`text-xs px-3 py-1.5 rounded-full border ${
                                            isDarkMode ? "text-gray-400 bg-white/5 border-white/10" : "text-gray-400 bg-gray-100"
                                        }`}>
											{trackingResult.calculationSource}
										</span>
									)}
								</div>
								<div className={`overflow-x-auto rounded-xl border ${isDarkMode ? "border-white/5" : "border-gray-100"}`}>
									<table className="w-full text-sm text-right">
										<thead className={isDarkMode ? "bg-white/5 text-gray-300" : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600"}>
											<tr>
												<th className="px-4 py-4 font-bold">الميناء</th>
												<th className="px-4 py-4 font-bold">المسافة (ميل بحري)</th>
												<th className="px-4 py-4 font-bold">الوقت (ساعات)</th>
												<th className="px-4 py-4 font-bold">الوقت (أيام)</th>
											</tr>
										</thead>
										<tbody className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-gray-100"}`}>
											{trackingResult.etaToEgypt.map((port, index) => (
												<tr key={index} className={`transition-colors ${isDarkMode ? "hover:bg-white/5" : "hover:bg-[#1ba3b6]/5"}`}>
													<td className={`px-4 py-4 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
														{port.portName}
													</td>
													<td className="px-4 py-4 text-gray-600">
														{port.distance} nm
													</td>
													<td className="px-4 py-4 text-gray-600">
														{port.etaHours} ساعة
													</td>
													<td className="px-4 py-4 text-[#1ba3b6] font-bold">
														{port.etaDays} يوم
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								<div className={`mt-6 text-xs text-center p-4 rounded-xl ${
                                    isDarkMode ? "bg-white/5 text-gray-500" : "bg-gray-50 text-gray-400"
                                }`}>
									* التقديرات بناءً على الموقع الحالي والسرعة المتوسطة. قد تختلف الأوقات الفعلية.
									<br />
									<a href={trackingResult.url} target="_blank" rel="noopener noreferrer" className="text-[#1ba3b6] hover:text-[#158a9a] underline mt-2 inline-flex items-center gap-1">
										عرض التفاصيل على VesselFinder
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
										</svg>
									</a>
								</div>
							</div>
						</div>
					)}

					{/* Features */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
						{[
							{ icon: "🚢", title: "تتبع السفن", desc: "تتبع السفن البحرية بالاسم" },
							{ icon: "📍", title: "الموقع الحالي", desc: "معرفة آخر ميناء زارته السفينة" },
							{ icon: "⏱️", title: "وقت الوصول", desc: "تقدير الوقت للموانئ المصرية" },
						].map((item, index) => (
							<div key={index} className={`flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 group ${
                                isDarkMode 
                                    ? "bg-[#1a1a1a] border-white/5 hover:border-[#1ba3b6]/30" 
                                    : "bg-white border-gray-100 hover:border-[#1ba3b6]/30 hover:shadow-lg"
                            }`}>
								<span className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
								<div>
									<h4 className={`font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{item.title}</h4>
									<p className="text-sm text-gray-500">{item.desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

export default TrackingSection;
