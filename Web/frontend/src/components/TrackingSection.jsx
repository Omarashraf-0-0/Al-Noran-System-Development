import React, { useState } from "react";
import { toast } from "react-hot-toast";

const TrackingSection = () => {
	const [trackingNumber, setTrackingNumber] = useState("");
	const [isTracking, setIsTracking] = useState(false);

	const handleTrack = async (e) => {
		e.preventDefault();

		if (!trackingNumber.trim()) {
			toast.error("يرجى إدخال رقم الشحنة");
			return;
		}

		setIsTracking(true);

		try {
			// TODO: Implement actual tracking API call
			// const response = await axios.get(`/api/shipments/track/${trackingNumber}`);

			// Simulate API call
			setTimeout(() => {
				toast.success("جاري البحث عن الشحنة...");
				setIsTracking(false);
			}, 1000);
		} catch (error) {
			toast.error("فشل تتبع الشحنة");
			setIsTracking(false);
		}
	};

	return (
		<section id="tracking-section" className="py-20 bg-white relative overflow-hidden">
			{/* Decorative background element */}
			<div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
			<div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

			<div className="container mx-auto px-4 relative z-10">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl md:text-5xl font-bold text-[#690000] mb-4">
						تتبع شحنتك
					</h2>
					<p className="text-xl text-gray-500 mb-10">
						لمعرفة حالة شحنتك الحالية، يرجى إدخال رقم الشحنة بالأسفل
					</p>

					<form onSubmit={handleTrack} className="relative">
						<div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 rounded-2xl shadow-xl border border-gray-100">
							<input
								type="text"
								value={trackingNumber}
								onChange={(e) => setTrackingNumber(e.target.value)}
								placeholder="ادخل رقم الشحنة (مثال: SEA-1234)"
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
										<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										جاري البحث...
									</span>
								) : "تتبع الشحنة"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</section>
	);
};

export default TrackingSection;
