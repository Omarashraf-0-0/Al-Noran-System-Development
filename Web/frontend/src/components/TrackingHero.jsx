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
		onSearch(value, false);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (trackingNumber.trim()) {
			setShowDropdown(false);
			onSearch(trackingNumber, true);
		}
	};

	const handleSelectShipment = (shipment) => {
		setTrackingNumber(shipment.acid || "");
		setShowDropdown(false);
		onSelectShipment(shipment);
	};

	const handleBlur = () => {
		setTimeout(() => {
			setShowDropdown(false);
		}, 200);
	};

	return (
		<div className="relative h-[500px] flex items-center justify-center -mt-16 pt-16">
			{/* Background with Overlay */}
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
				style={{
					backgroundImage:
						'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920")',
				}}
			>
				<div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
			</div>

			<div className="relative z-30 w-full max-w-4xl px-4" dir="rtl">
				<div className="text-center mb-10">
					<h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-md">
						مرحباً بك في <span className="text-[#3BA5A8]">النوران</span>
					</h1>
					<p className="text-xl text-gray-200 font-light">
						تتبع شحناتك وأدر عملياتك بسهولة وسرعة
					</p>
				</div>

				<div className="bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full shadow-2xl max-w-3xl mx-auto flex items-center">
					<form onSubmit={handleSubmit} className="flex-1 flex items-center relative z-20">
						<div className="pl-4 pr-6">
							<Search className="text-white/80" size={24} />
						</div>
						
						<div className="flex-1 relative">
							<input
								type="text"
								value={trackingNumber}
								onChange={handleInputChange}
								onFocus={() => setShowDropdown(true)}
								onBlur={handleBlur}
								placeholder="ابحث عن شحنة (كود الشحنة، ACID، الميناء...)"
								className="w-full bg-transparent border-none text-white text-lg placeholder:text-gray-300 focus:ring-0 px-0 py-3"
								autoComplete="off"
							/>

							{/* Suggestions Dropdown */}
							{showDropdown && (recommendations.length > 0 || loading) && (
								<div className="absolute top-full right-0 mt-4 w-full bg-white rounded-2xl shadow-2xl max-h-80 overflow-y-auto z-[100] border border-gray-100 divide-y divide-gray-50 text-right">
									{loading ? (
										<div className="p-4 text-center text-gray-500">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#690000] mx-auto mb-2"></div>
											جاري البحث...
										</div>
									) : (
										recommendations.map((shipment) => (
											<div
												key={shipment._id}
												onClick={() => handleSelectShipment(shipment)}
												className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
											>
												<div className="flex justify-between items-center mb-1">
													<span className="font-bold text-[#690000]">{shipment.shipmentCode || shipment.acid || "N/A"}</span>
													<span className={`text-xs px-2 py-1 rounded-full ${
														shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
														shipment.status === 'approved' ? 'bg-green-100 text-green-800' :
														'bg-gray-100 text-gray-800'
													}`}>
														{shipment.status || "N/A"}
													</span>
												</div>
												<div className="text-sm text-gray-500">
													{shipment.port_name} • {shipment.country}
												</div>
											</div>
										))
									)}
								</div>
							)}
						</div>
						
						<button
							type="submit"
							className="bg-[#690000] hover:bg-[#8B0000] text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg m-1"
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
