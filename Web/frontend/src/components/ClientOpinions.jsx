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
		<section
			className="relative py-16 bg-cover bg-center h-[825px]"
			style={{
				backgroundImage: "url('/src/assets/images/clientOpinion-bg.png')",
			}}
		>
			{/* Overlay */}
			<div className="absolute inset-0"></div>

			{/* Content */}
			<div className="relative z-10 container mx-auto px-4 flex flex-col  justify-between h-full">
				<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-[#690000] mb-12">
					آراء عملائنا
				</h2>

				<div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
					{testimonials.map((testimonial) => (
						<div
							key={testimonial.id}
							className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300"
						>
							{/* person Icon */}
							<div className="flex justify-center mb-4">
								<img
									src="/src/assets/images/account_circle.png"
									alt="Client Icon"
									className="w-16 h-16"
								/>
							</div>
							{/* Client Name */}
							<h3 className="text-xl font-bold text-[#690000] text-center mb-4">
								{testimonial.name}
							</h3>
							{/* Stars */}
							<div className="flex justify-center gap-1 mb-4">
								{[...Array(testimonial.rating)].map((_, index) => (
									<img
										src="/src/assets/images/stars.svg"
										key={index}
										alt="Star"
										className="w-[24px] h-[24px]"
									/>
								))}
							</div>

							{/* Testimonial Text */}
							<p className="text-[#690000] text-center leading-relaxed">
								{testimonial.text}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default ClientOpinions;
