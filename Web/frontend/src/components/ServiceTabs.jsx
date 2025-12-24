import React from "react";
import { useTheme } from "../context/ThemeContext";

const ServiceTabs = () => {
    const { isDarkMode } = useTheme();

	const services = [
		{
			id: "factories",
			label: "للمصانع",
			icon: (
				<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
				</svg>
			),
			desc: "حلول لوجستية متكاملة لخطوط الإنتاج والتوريد",
			details: ["إدارة سلاسل التوريد", "تخليص المواد الخام", "تصدير المنتجات"],
		},
		{
			id: "merchants",
			label: "للتجار",
			icon: (
				<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
				</svg>
			),
			desc: "تخليص جمركي سريع لضمان توافر بضائعك دائماً",
			details: ["استيراد البضائع", "متابعة الشحنات", "أسعار تنافسية"],
		},
		{
			id: "individuals",
			label: "للأفراد",
			icon: (
				<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			),
			desc: "خدمات شخصية سهلة وموثوقة لشحناتك الخاصة",
			details: ["شحنات شخصية", "متابعة سهلة", "دعم فني مستمر"],
		},
	];

	return (
		<section id="services" className={`py-20 md:py-28 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gradient-to-b from-gray-50 to-white"}`}>
			{/* Background Decorations */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-[#690000]/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
			<div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1ba3b6]/5 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2"></div>

			<div className="container mx-auto px-4 relative z-10">
				{/* Section Header */}
				<div className="text-center mb-16">
					<span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${isDarkMode ? "bg-[#690000]/20 text-red-400" : "bg-[#690000]/10 text-[#690000]"}`}>
						خدماتنا المميزة
					</span>
					<h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-[#690000]"}`}>
						حلول مخصصة لكل احتياج
					</h2>
					<p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
						نقدم حلولاً متكاملة تناسب احتياجات كل قطاع بأعلى معايير الجودة
					</p>
				</div>

				{/* Services Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{services.map((service, index) => (
						<div
							key={service.id}
							className={`group relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 p-8 overflow-hidden border ${
                                isDarkMode ? "bg-[#1a1a1a] border-white/5 hover:border-[#1ba3b6]/30" : "bg-white border-gray-100 hover:border-[#1ba3b6]/30"
                            }`}
							style={{ animationDelay: `${index * 100}ms` }}
						>
							{/* Top Gradient Bar */}
							<div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#690000] to-[#1ba3b6] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
							
							{/* Icon Container */}
							<div className="mb-6 relative">
								<div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                                    isDarkMode 
                                        ? "bg-white/5 text-gray-300 group-hover:bg-[#690000] group-hover:text-white" 
                                        : "bg-[#690000]/10 text-[#690000] group-hover:bg-[#690000] group-hover:text-white"
                                }`}>
									{service.icon}
								</div>
							</div>

							{/* Title */}
							<h3 className={`text-2xl font-bold text-center mb-4 transition-colors ${
                                isDarkMode ? "text-white group-hover:text-red-400" : "text-gray-800 group-hover:text-[#690000]"
                            }`}>
								{service.label}
							</h3>

							{/* Description */}
							<p className={`text-center leading-relaxed mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
								{service.desc}
							</p>

							{/* Features List */}
							<ul className="space-y-2">
								{service.details.map((detail, idx) => (
									<li key={idx} className={`flex items-center gap-2 text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
										<svg className="w-4 h-4 text-[#1ba3b6] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
										<span>{detail}</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default ServiceTabs;
