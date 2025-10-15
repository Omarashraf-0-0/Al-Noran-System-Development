import React from "react";

const HeroSection = () => {
	return (
		<section className="relative min-h-[715px] flex items-center justify-center  bg-white">
			{/* Overlay */}
			<div
				className="absolute inset-0 bg-cover bg-center"
				style={{
					backgroundImage: "url('/src/assets/images/hero-bg.png')",
				}}
			></div>

			{/* Content */}
			<div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
				{/* Logo */}
				<div className="h-[518px] w-[518px] mx-auto">
					<img
						src="/src/assets/images/coloredLogo.svg"
						alt="النوران"
						className=" mx-auto"
					/>
				</div>

				{/* Main Heading */}
				<h1 className="text-[32px] font-bold mb-2 leading-tight text-[#690000]">
					أكثر من 10 سنوات من الخبرة في عالم التصدير والتخليص الجمركي
				</h1>

				{/* Subheading */}
				<p className="text-xl md:text-2xl text-[#1BA3B6] text-semibold leading-relaxed">
					خبرة تمتد لعقد من الزمن في إنهاء الإجراءات بدقة، وبناء جسور الثقة بين
					الأسواق العالمية والمحلية — نُحوّل التعقيد إلى انسيابية، والعمليات إلى
					نجاحات متكررة.
				</p>
			</div>
		</section>
	);
};

export default HeroSection;
