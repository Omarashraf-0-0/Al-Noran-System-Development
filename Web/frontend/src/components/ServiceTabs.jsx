import React from "react";

const ServiceTabs = () => {
	const services = [
		{ id: "factories", label: "مصانع", icon: "🏭" },
		{ id: "merchants", label: "تجار", icon: "🏪" },
		{ id: "individuals", label: "أفراد", icon: "👤" },
	];

	return (
		<div className="bg-[#3BA5A8]">
			<div className="container mx-auto">
				<div className="grid grid-cols-3 gap-0">
					{services.map((service) => (
						<div
							key={service.id}
							className="py-6 px-4 text-white text-xl md:text-2xl font-bold"
						>
							<div className="flex flex-col items-center gap-4">
								<span className="text-9xl md:text-9xl leading-none flex items-center justify-center">
									{service.icon}
								</span>
								<span>{service.label}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ServiceTabs;
