import React from "react";
import { useTheme } from "../context/ThemeContext";

const ClientOpinions = () => {
    const { isDarkMode } = useTheme();

	const testimonials = [
		{
			id: 1,
			name: "أحمد محمد",
			role: "صاحب مصنع",
			text: "خدمة ممتازة وسريعة، فريق محترف جداً في التعامل. تم تخليص شحنتي في وقت قياسي وبأسعار منافسة. أنصح بالتعامل معهم بشدة.",
			rating: 5,
			avatar: "أ",
		},
		{
			id: 2,
			name: "محمد علي",
			role: "تاجر جملة",
			text: "تعاملت مع الشركة أكثر من مرة وكانت الخدمة دائماً على أعلى مستوى. الاحترافية والسرعة في التنفيذ تجعلهم الخيار الأمثل.",
			rating: 5,
			avatar: "م",
		},
		{
			id: 3,
			name: "سارة أحمد",
			role: "مستوردة",
			text: "شركة موثوقة وأسعار تنافسية، التعامل معهم سهل ومريح. خدمة العملاء متميزة ودائماً متاحين للإجابة على أي استفسار.",
			rating: 5,
			avatar: "س",
		},
	];

	return (
		<section className={`py-24 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gradient-to-b from-white to-gray-50"}`}>
			{/* Decorative Elements */}
			<div className="absolute top-20 left-10 w-20 h-20 bg-[#1ba3b6]/10 rounded-full blur-xl"></div>
			<div className="absolute bottom-20 right-10 w-32 h-32 bg-[#690000]/10 rounded-full blur-xl"></div>
			
			{/* Quote Pattern */}
			<div className="absolute top-10 right-10 text-[200px] text-[#690000]/5 font-serif leading-none select-none">
				&ldquo;
			</div>

			<div className="container mx-auto px-4 relative z-10">
				{/* Header */}
				<div className="text-center mb-16">
					<span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${isDarkMode ? "bg-[#690000]/20 text-red-400" : "bg-[#690000]/10 text-[#690000]"}`}>
						آراء العملاء
					</span>
					<h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-[#690000]"}`}>
						ماذا يقول عملاؤنا؟
					</h2>
					<p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
						نفخر بثقة عملائنا ونسعى دائماً لتقديم الأفضل
					</p>
				</div>

				{/* Testimonials Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
					{testimonials.map((testimonial, index) => (
						<div
							key={testimonial.id}
							className={`group rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border flex flex-col relative transform hover:-translate-y-2 ${
                                isDarkMode ? "bg-[#1a1a1a] border-white/5 hover:border-[#1ba3b6]/30" : "bg-white border-gray-100 hover:border-[#1ba3b6]/30"
                            }`}
							style={{ animationDelay: `${index * 100}ms` }}
						>
							{/* Quote Icon */}
							<div className="absolute top-6 right-6">
								<svg className={`w-10 h-10 ${isDarkMode ? "text-white/10" : "text-[#690000]/10"}`} fill="currentColor" viewBox="0 0 24 24">
									<path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
								</svg>
							</div>

							{/* Rating Stars */}
							<div className="flex gap-1 mb-6">
								{[...Array(testimonial.rating)].map((_, index) => (
									<svg
										key={index}
										className="w-5 h-5 text-[#F59E0B]"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								))}
							</div>

							{/* Testimonial Text */}
							<p className={`mb-8 leading-relaxed text-lg flex-grow ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
								{testimonial.text}
							</p>

							{/* Divider */}
							<div className="w-16 h-1 bg-gradient-to-r from-[#690000] to-[#1ba3b6] rounded-full mb-6"></div>

							{/* Client Info */}
							<div className="flex items-center gap-4">
								<div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#690000] to-[#8B0000] flex items-center justify-center text-white font-bold text-xl shadow-lg">
									{testimonial.avatar}
								</div>
								<div>
									<h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-[#690000]"}`}>
										{testimonial.name}
									</h3>
									<p className="text-gray-500 text-sm">{testimonial.role}</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Trust Indicators */}
				<div className="mt-16 text-center">
					<div className={`inline-flex items-center gap-8 px-8 py-4 rounded-2xl shadow-lg border ${
                        isDarkMode ? "bg-[#1a1a1a] border-white/5" : "bg-white border-gray-100"
                    }`}>
						<div className="flex items-center gap-2">
							<svg className="w-6 h-6 text-[#1ba3b6]" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
							<span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>موثوق من +1000 عميل</span>
						</div>
						<div className={`w-px h-8 ${isDarkMode ? "bg-white/10" : "bg-gray-200"}`}></div>
						<div className="flex items-center gap-2">
							<svg className="w-6 h-6 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
							<span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>تقييم 4.9 من 5</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default ClientOpinions;
