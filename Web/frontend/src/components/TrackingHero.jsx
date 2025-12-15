import React, { useState } from "react";
import { Search } from "lucide-react";

const TrackingHero = ({
	onSearch,
	recommendations,
	onSelectShipment,
	loading,
}) => {
	const [trackingNumber, setTrackingNumber] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);

	const handleInputChange = (e) => {
		const value = e.target.value;
		setTrackingNumber(value);
		setShowDropdown(true);
		onSearch(value, false); // false = just recommendations, not full search
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (trackingNumber.trim()) {
			setShowDropdown(false);
			// Trigger full search with modal
			onSearch(trackingNumber, true);
		}
	};

	const handleSelectShipment = (shipment) => {
		setTrackingNumber(shipment.acid || "");
		setShowDropdown(false);
		onSelectShipment(shipment);
	};

	const handleBlur = () => {
		// Delay hiding to allow click on dropdown items
		setTimeout(() => {
			setShowDropdown(false);
		}, 200);
	};

	return (
		<div
			className="relative h-[450px] flex items-center justify-center bg-cover bg-center"
			style={{
				backgroundImage:
					'linear-gradient(to right, rgba(13, 110, 113, 0.7), rgba(30, 58, 138, 0.7)), url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920")',
			}}
		>
			<div className="relative z-10 w-full max-w-3xl px-4" dir="rtl">
				<div className="bg-gradient-to-br from-red-900/90 to-red-800/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl">
					<h1 className="text-white text-3xl md:text-4xl font-bold text-center mb-8">
						تتبع شحنتي
					</h1>

					<form onSubmit={handleSubmit} className="space-y-6 relative z-20">
						<div className="relative">
							<input
								type="text"
								value={trackingNumber}
								onChange={handleInputChange}
								onFocus={() => setShowDropdown(true)}
								onBlur={handleBlur}
								placeholder="ابحث عن شحنة بالرقم، الميناء، الدولة..."
								className="w-full px-6 py-4 pr-12 rounded-full text-right text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-white/30 transition-all bg-white"
								autoComplete="off"
							/>
							<button
								type="submit"
								className="absolute left-2 top-1/2 -translate-y-1/2 bg-red-700 text-white p-3 rounded-full hover:bg-red-800 transition-colors"
							>
								<Search size={20} />
							</button>

							{/* Recommendations Dropdown */}
							{showDropdown && (recommendations.length > 0 || loading) && (
								<div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-[100]">
									{loading ? (
										<div className="p-4 text-center text-gray-600">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800 mx-auto"></div>
											<p className="mt-2">جاري البحث...</p>
										</div>
									) : (
										<div className="p-2">
											{recommendations.map((shipment) => (
												<div
													key={shipment._id}
													onClick={() => handleSelectShipment(shipment)}
													className="p-4 hover:bg-red-50 cursor-pointer rounded-lg transition-colors border-b last:border-b-0"
												>
													<div className="flex justify-between items-start">
														<div className="flex-1">
															<div className="font-bold text-gray-800 text-lg">
																{shipment.acid || "N/A"}
															</div>
															<div className="text-sm text-gray-600 mt-1">
																{shipment.port_name || "N/A"} •{" "}
																{shipment.country || "N/A"}
															</div>
															{shipment.bl_number && (
																<div className="text-xs text-gray-500 mt-1">
																	BL: {shipment.bl_number}
																</div>
															)}
														</div>
														<span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
															{shipment.status || "N/A"}
														</span>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
						<button
							type="submit"
							className="w-full max-w-xs mx-auto block bg-white text-red-900 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
						>
							تتبع
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default TrackingHero;
