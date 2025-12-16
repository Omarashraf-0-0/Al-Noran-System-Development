import React from "react";
import { Facebook, Twitter, Instagram, Globe, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
	return (
		<footer className="relative bg-gradient-to-br from-[#690000] to-[#2b0000] text-white pt-20 pb-10 overflow-hidden font-sans" dir="rtl">
			
			{/* 🌍 World Map Watermark */}
			<div className="absolute inset-0 z-0 opacity-[0.05] bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-no-repeat bg-center bg-cover pointer-events-none mix-blend-overlay"></div>
			
			{/* Abstract Glow */}
			<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none"></div>

			<div className="container mx-auto px-6 relative z-10">
				<div className="grid lg:grid-cols-3 gap-12 items-start text-right">
					
					{/* 1. Brand & Description */}
					<div className="flex flex-col items-center lg:items-start space-y-6">
						<img
							src="/src/assets/images/white logo.png"
							alt="النوران"
							className="h-40 w-auto opacity-90 hover:opacity-100 transition-opacity drop-shadow-lg"
						/>
						<p className="text-gray-200 text-base leading-8 max-w-sm text-center lg:text-right font-medium opacity-90">
							أكثر من 10 سنوات من الخبرة في عالم التصدير والتخليص الجمركي.
							نصنع جسوراً من الثقة بين الأسواق العالمية والمحلية، ونحول التعقيد إلى سلاسة لضمان نجاح أعمالكم.
						</p>
					</div>

					{/* 2. Quick Links & Contact */}
					<div className="flex flex-col items-center lg:items-start space-y-6 lg:mr-auto">
						<h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-gray-300">
							تواصل معنا
						</h3>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 w-full max-w-sm hover:bg-white/10 transition-colors">
							<div className="space-y-6">
								<div className="flex items-start gap-4 group">
									<div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#690000] group-hover:text-white transition-all">
										<MapPin className="w-6 h-6 text-red-200 group-hover:text-white" />
									</div>
									<div>
										<h4 className="text-sm font-bold text-gray-400 mb-1.5 uppercase tracking-wider">العنوان</h4>
										<p className="text-base font-medium text-white leading-relaxed">
											السادس من أكتوبر - سيتي ستار مول ج2<br/>الدور الثاني
										</p>
									</div>
								</div>
								
								<div className="h-px bg-white/10 w-full"></div>

								<div className="flex items-center gap-4 group">
									<div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#690000] group-hover:text-white transition-all">
										<Phone className="w-6 h-6 text-red-200 group-hover:text-white" />
									</div>
									<div className="flex-1">
										<h4 className="text-sm font-bold text-gray-400 mb-1.5 uppercase tracking-wider">الهاتف</h4>
										<p className="text-lg font-bold text-white font-mono" dir="ltr">
											+20 12 2338 2439
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* 3. Socials & Newsletter (Optional/Placeholder) */}
					<div className="flex flex-col items-center lg:items-start space-y-6">
						<h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-gray-300">
							تابعنا
						</h3>
						<p className="text-gray-300 text-base">كن على اطلاع دائم بآخر أخبار الشحن والتخليص الجمركي.</p>
						
						<div className="flex gap-4">
							{[
								{ icon: Facebook, href: "https://facebook.com", label: "Facebook" },
								{ icon: Twitter, href: "https://twitter.com", label: "Twitter" },
								{ icon: Instagram, href: "https://instagram.com", label: "Instagram" },
								{ icon: Globe, href: "#", label: "Website" }
							].map((social, idx) => (
								<a
									key={idx}
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-white hover:text-[#690000] hover:-translate-y-1 transition-all duration-300 shadow-lg"
									aria-label={social.label}
								>
									<social.icon className="w-6 h-6" />
								</a>
							))}
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-16 pt-8 border-t border-white/10 text-center flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
					<p>&copy; {new Date().getFullYear()} شركة النوران. جميع الحقوق محفوظة.</p>
					<div className="flex gap-8">
						<a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
						<a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
