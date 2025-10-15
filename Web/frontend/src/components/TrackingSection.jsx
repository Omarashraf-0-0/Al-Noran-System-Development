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
		<section id="tracking-section" className="py-16 bg-white">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-[#690000] mb-8">
					تتبع شحنتي
				</h2>

				<form onSubmit={handleTrack} className="max-w-3xl mx-auto">
					<div className="flex flex-col sm:flex-row items-stretch">
						<input
							type="text"
							value={trackingNumber}
							onChange={(e) => setTrackingNumber(e.target.value)}
							placeholder="ادخل رقم الشحنة"
							className="
								flex-1 px-6 py-4 
								 rounded-r-lg
								focus:border-[#3BA5A8] focus:outline-none
								text-lg text-right
								placeholder:text-[#690000]
                                bg-white
                                shadow-md
							"
							dir="rtl"
						/>
						<button
							type="submit"
							disabled={isTracking}
							className="
								bg-[#6B1212] text-white 
								px-12 py-4 rounded-2xl 
								font-bold text-lg
								hover:bg-[#8B1414] 
								transition-colors
								disabled:opacity-50 disabled:cursor-not-allowed
								whitespace-nowrap
							"
						>
							{isTracking ? "جاري التتبع..." : "تتبع"}
						</button>
					</div>
				</form>
			</div>
		</section>
	);
};

export default TrackingSection;
