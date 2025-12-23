import React from "react";
import { Facebook, Twitter, Instagram, Globe, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
	return (
		<footer className="relative bg-gradient-to-br from-[#1a0505] to-[#2b0000] text-white pt-24 pb-10 overflow-hidden font-sans border-t border-[#690000]/30" dir="rtl">
			
			{/* Accent Stripe - Matching Header & Hero */}
			<div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#690000] via-[#8B0000] to-[#1BA3B6]"></div>

			{/* 🌍 World Map Watermark & Effects */}
			<div className="absolute inset-0 z-0 opacity-[0.03] bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-no-repeat bg-center bg-cover pointer-events-none mix-blend-overlay"></div>
			<div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#690000]/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
			<div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#1BA3B6]/5 rounded-full blur-[100px] pointer-events-none"></div>

			<div className="container mx-auto px-6 relative z-10">
				<div className="grid lg:grid-cols-4 gap-12 items-start text-right">
					
					{/* 1. Brand & About */}
					<div className="lg:col-span-1 flex flex-col space-y-6">
						<div className="relative inline-block">
							<div className="absolute inset-0 bg-[#690000] blur-xl opacity-20 rounded-full"></div>
							<img
								src="/src/assets/images/white logo.png"
								alt="النوران"
								className="h-32 w-auto relative z-10 transition-transform hover:scale-105 duration-300"
							/>
						</div>
						<p className="text-gray-400 text-sm leading-7 font-medium">
							شريكك الاستراتيجي في حلول الشحن والتخليص الجمركي. نقدم حلولاً مبتكرة تربط أعمالك بالعالم بأعلى معايير الجودة والسرعة.
						</p>
					</div>

					{/* 2. Quick Links */}
					<div className="lg:col-span-1 flex flex-col space-y-6">
						<h3 className="text-xl font-bold text-white flex items-center gap-2">
							<span className="w-1.5 h-6 bg-[#1BA3B6] rounded-full"></span>
							روابط سريعة
						</h3>
						<ul className="space-y-3">
							{[
								{ label: "الرئيسية", href: "/" },
								{ label: "عن النوران", href: "#" },
								{ label: "خدماتنا", href: "#" },
								{ label: "تتبع الشحنات", href: "#" },
								{ label: "سياسة الخصوصية", href: "#" }
							].map((item, idx) => (
								<li key={idx}>
									<a href={item.href} className="text-gray-400 hover:text-[#1BA3B6] hover:pr-2 transition-all duration-300 flex items-center gap-2 text-sm font-medium">
										<span className="w-1 h-1 bg-gray-600 rounded-full"></span>
										{item.label}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* 3. Contact Info */}
					<div className="lg:col-span-2 flex flex-col space-y-6">
						<h3 className="text-xl font-bold text-white flex items-center gap-2">
							<span className="w-1.5 h-6 bg-[#690000] rounded-full"></span>
							تواصل معنا
						</h3>
						<div className="grid md:grid-cols-2 gap-6">
							{/* Address Card */}
							<div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-[#690000]/30 transition-all duration-300 group">
								<div className="flex items-start gap-4">
									<div className="w-10 h-10 rounded-xl bg-[#690000]/20 flex items-center justify-center text-[#690000] group-hover:bg-[#690000] group-hover:text-white transition-all duration-300 shrink-0">
										<MapPin className="w-5 h-5" />
									</div>
									<div>
										<h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">المقر الرئيسي</h4>
										<p className="text-sm font-medium text-gray-200 leading-relaxed">
											السادس من أكتوبر<br/>سيتي ستار مول ج2 - الدور الثاني
										</p>
									</div>
								</div>
							</div>

							{/* Phone & Email Card */}
							<div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-[#1BA3B6]/30 transition-all duration-300 group">
								<div className="space-y-4">
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 rounded-xl bg-[#1BA3B6]/20 flex items-center justify-center text-[#1BA3B6] group-hover:bg-[#1BA3B6] group-hover:text-white transition-all duration-300 shrink-0">
											<Phone className="w-5 h-5" />
										</div>
										<div>
											<h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">الهاتف</h4>
											<p className="text-base font-bold text-white font-mono" dir="ltr">+20 12 2338 2439</p>
										</div>
									</div>
									<div className="h-px bg-white/10 w-full"></div>
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-[#1a0505] transition-all duration-300 shrink-0">
											<Mail className="w-5 h-5" />
										</div>
										<div>
											<h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">البريد الإلكتروني</h4>
											<p className="text-sm font-medium text-gray-200 font-sans">info@al-noran.com</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
					<p className="text-gray-500 text-sm font-medium">
						&copy; {new Date().getFullYear()} <span className="text-white font-bold">مجموعة النوران</span>. جميع الحقوق محفوظة.
					</p>
					
					{/* Social Links */}
					<div className="flex items-center gap-3">
						{[
							{ icon: Facebook, href: "#" },
							{ icon: Twitter, href: "#" },
							{ icon: Instagram, href: "#" },
							{ icon: Globe, href: "#" }
						].map((social, idx) => (
							<a
								key={idx}
								href={social.href}
								className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#690000] hover:text-white hover:border-[#690000] hover:-translate-y-1 transition-all duration-300"
							>
								<social.icon className="w-5 h-5" />
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
