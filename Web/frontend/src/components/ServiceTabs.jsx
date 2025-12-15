import React from "react";

const ServiceTabs = () => {
	const services = [
		{
			id: "factories",
			label: "للمصانع",
			icon: "🏭",
			desc: "حلول لوجستية متكاملة لخطوط الإنتاج والتوريد",
		},
		{
			id: "merchants",
			label: "للتجار",
			icon: "🏪",
			desc: "تخليص جمركي سريع لضمان توافر بضائعك دائماً",
		},
		{
			id: "individuals",
			label: "للأفراد",
			icon: "👤",
			desc: "خدمات شخصية سهلة وموثوقة لشحناتك الخاصة",
		},
	];

	return (
		<section className="py-16 md:py-24 bg-gray-50">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-5xl font-bold text-[#690000] mb-4">
						خدماتنا
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						نقدم حلولاً مخصصة تناسب احتياجات كل قطاع
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{services.map((service) => (
						<div
							key={service.id}
							className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 overflow-hidden text-center border border-gray-100"
						>
							<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-700 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
							
							<div className="mb-6 relative">
								<div className="w-24 h-24 mx-auto bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-red-50 transition-colors duration-300">
									<span className="text-5xl">{service.icon}</span>
								</div>
							</div>

							<h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-[#690000] transition-colors">
								{service.label}
							</h3>
							<p className="text-gray-600 leading-relaxed">{service.desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default ServiceTabs;
