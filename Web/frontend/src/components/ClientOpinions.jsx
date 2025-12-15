import React from "react";

const ClientOpinions = () => {
	const testimonials = [
		{
			id: 1,
			name: "اسم العميل",
			text: "خدمة ممتازة وسريعة، فريق محترف جداً في التعامل. تم تخليص شحنتي في وقت قياسي وبأسعار منافسة. أنصح بالتعامل معهم بشدة.",
			rating: 5,
		},
		{
			id: 2,
			name: "اسم العميل",
			text: "تعاملت مع الشركة أكثر من مرة وكانت الخدمة دائماً على أعلى مستوى. الاحترافية والسرعة في التنفيذ تجعلهم الخيار الأمثل.",
			rating: 5,
		},
		{
			id: 3,
			name: "اسم العميل",
			text: "شركة موثوقة وأسعار تنافسية، التعامل معهم سهل ومريح. خدمة العملاء متميزة ودائماً متاحين للإجابة على أي استفسار.",
			rating: 5,
		},
	];

	return (
		<section className="py-20 bg-gray-50 relative overflow-hidden">
			{/* Decorative Elements */}
			<div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
				<div
					className="absolute inset-0 bg-repeat opacity-20"
					style={{
						backgroundImage: "url('/src/assets/images/clientOpinion-bg.png')",
						backgroundSize: "200px",
					}}
				></div>
			</div>

			<div className="container mx-auto px-4 relative z-10">
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-5xl font-bold text-[#690000] mb-4">
						آراء عملائنا
					</h2>
					<p className="text-xl text-gray-600">
						نفخر بثقة عملائنا ونسعى دائماً لتقديم الأفضل
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
					{testimonials.map((testimonial) => (
						<div
							key={testimonial.id}
							className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center relative"
						>
							{/* Quote Icon */}
							<div className="absolute top-4 right-6 text-6xl text-red-100 font-serif leading-none">
								&quot;
							</div>

							{/* Client Image */}
							<div className="w-20 h-20 mb-6 rounded-full bg-gray-100 p-1 border-2 border-red-50">
								<img
									src="/src/assets/images/account_circle.png"
									alt="Client"
									className="w-full h-full object-cover rounded-full opacity-80"
								/>
							</div>

							{/* Rating */}
							<div className="flex gap-1 mb-4">
								{[...Array(testimonial.rating)].map((_, index) => (
									<img
										src="/src/assets/images/stars.svg"
										key={index}
										alt="Star"
										className="w-5 h-5"
									/>
								))}
							</div>

							{/* Text */}
							<p className="text-gray-600 mb-6 italic leading-relaxed text-lg">
								{testimonial.text}
							</p>

							{/* Divider */}
							<div className="w-12 h-1 bg-red-100 rounded-full mb-4"></div>

							{/* Name */}
							<h3 className="text-xl font-bold text-[#690000]">
								{testimonial.name}
							</h3>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default ClientOpinions;
