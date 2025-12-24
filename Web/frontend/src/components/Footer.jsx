import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Globe, MapPin, Phone, Mail, ArrowRight, Send } from "lucide-react";

const Footer = () => {
	const currentYear = new Date().getFullYear();

	const quickLinks = [
		{ label: "الرئيسية", path: "/" },
		{ label: "عن النوران", path: "/#about" },
		{ label: "خدماتنا", path: "/#services" },
		{ label: "تتبع الشحنة", path: "/#tracking-section" },
	];

	const services = [
		"تخليص جمركي",
		"شحن بحري",
		"شحن جوي",
		"شهادات ACID & UCR",
	];

	const socialLinks = [
		{
			name: "Facebook",
			url: "https://www.facebook.com/profile.php?id=100054228290472",
			icon: <Facebook className="w-5 h-5" />,
			color: "hover:bg-[#1877F2]",
		},
		// {
		// 	name: "Twitter",
		// 	url: "https://twitter.com",
		// 	icon: <Twitter className="w-5 h-5" />,
		// 	color: "hover:bg-[#1DA1F2]",
		// },
		{
			name: "Instagram",
			url: "https://www.instagram.com/noran.services/",
			icon: <Instagram className="w-5 h-5" />,
			color: "hover:bg-[#E4405F]",
		},
		{
			name: "WhatsApp",
			url: "https://wa.me/201093426908",
			icon: <Phone className="w-5 h-5" />,
			color: "hover:bg-[#25D366]",
		},
	];

	return (
		<footer className="relative bg-gradient-to-t from-black via-[#1a0505] to-[#4a0000] text-white pt-20 pb-10 overflow-hidden" dir="rtl">
			{/* Background Effects */}
			<div className="absolute top-0 left-1/4 w-96 h-96 bg-[#690000]/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
			<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1ba3b6]/10 rounded-full blur-[100px] pointer-events-none"></div>

			<div className="container mx-auto px-6 relative z-10">
				
				{/* Top Section: CTA & Newsletter */}
				{/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16 pb-12 border-b border-white/10">
					<div>
						<h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
							جاهز لبدء شحنتك القادمة؟
						</h2>
						<p className="text-gray-400 text-lg">
							انضم إلى نشرتنا الإخبارية للحصول على آخر تحديثات الجمارك والشحن.
						</p>
					</div>
					<div className="relative">
						<form className="flex item-center">
							<input 
								type="email" 
								placeholder="أدخل بريدك الإلكتروني..." 
								className="w-full bg-white/5 border border-white/10 rounded-r-xl px-6 py-4 focus:outline-none focus:border-[#690000] focus:ring-1 focus:ring-[#690000] transition-all text-white placeholder:text-gray-500 backdrop-blur-sm"
							/>
							<button className="bg-[#690000] hover:bg-[#800000] text-white px-8 py-4 rounded-l-xl font-bold transition-all duration-300 flex items-center gap-2 hover:shadow-[0_0_20px_rgba(105,0,0,0.4)] group">
								<span>اشترك</span>
								<Send className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
							</button>
						</form>
					</div>
				</div> */}

				{/* Main Content */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
					
					{/* Brand Column */}
					<div className="space-y-6">
						<Link to="/" className="block">
							<img
								src="/images/white logo.png"
								alt="Al-Noran"
								className="h-28 opacity-90 hover:opacity-100 transition-opacity"
							/>
						</Link>
						<p className="text-gray-400 leading-relaxed text-sm">
							نقدم حلولاً لوجستية متكاملة بأسلوب عصري. نجمع بين الخبرة العريقة والتكنولوجيا الحديثة لضمان وصول شحناتك بأمان وسرعة.
						</p>
						<div className="flex gap-4 pt-2">
							{socialLinks.map((social) => (
								<a
									key={social.name}
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									className={`w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all duration-300 hover:text-white hover:-translate-y-1 hover:shadow-lg ${social.color}`}
									aria-label={social.name}
								>
									{social.icon}
								</a>
							))}
						</div>
					</div>

					{/* Links Column */}
					<div>
						<h3 className="text-lg font-bold mb-6 text-white inline-block border-b-2 border-[#690000] pb-2">
							روابط سريعة
						</h3>
						<ul className="space-y-4">
							{quickLinks.map((link) => (
								<li key={link.label}>
									<Link
										to={link.path}
										className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group text-sm"
									>
										<span className="w-1.5 h-1.5 rounded-full bg-[#690000] group-hover:bg-[#1ba3b6] transition-colors"></span>
										<span className="group-hover:translate-x-[-5px] transition-transform">{link.label}</span>
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Services Column */}
					<div>
						<h3 className="text-lg font-bold mb-6 text-white inline-block border-b-2 border-[#690000] pb-2">
							خدماتنا
						</h3>
						<ul className="space-y-4">
							{services.map((service) => (
								<li key={service} className="text-gray-400 flex items-center gap-3 text-sm group cursor-default">
									<div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#690000]/20 transition-colors">
										<ArrowRight className="w-4 h-4 text-[#690000] group-hover:rotate-180 transition-transform duration-300" />
									</div>
									<span className="group-hover:text-white transition-colors">{service}</span>
								</li>
							))}
						</ul>
					</div>

					{/* Contact Column */}
					<div>
						<h3 className="text-lg font-bold mb-6 text-white inline-block border-b-2 border-[#690000] pb-2">
							تواصل معنا
						</h3>
						<div className="space-y-6">
							<div className="flex items-start gap-4 group">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#690000] to-[#3d0000] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-[#690000]/40 transition-shadow">
									<MapPin className="w-5 h-5 text-white" />
								</div>
								<div>
									<p className="text-gray-400 text-xs mb-1">المقر الرئيسي</p>
									<p className="text-gray-200 text-sm leading-relaxed group-hover:text-white transition-colors">
										السادس من أكتوبر، مول سيتي ستار، مبنى ج2، الدور الثاني
									</p>
								</div>
							</div>
							
							<div className="flex items-start gap-4 group">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#690000] to-[#3d0000] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-[#690000]/40 transition-shadow">
									<Phone className="w-5 h-5 text-white" />
								</div>
								<div>
									<p className="text-gray-400 text-xs mb-1">اتصل بنا</p>
									<p className="text-gray-200 text-sm font-mono group-hover:text-white transition-colors" dir="ltr">
										+20 10 93426908
									</p>
								</div>
							</div>

							<div className="flex items-start gap-4 group">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#690000] to-[#3d0000] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-[#690000]/40 transition-shadow">
									<Mail className="w-5 h-5 text-white" />
								</div>
								<div>
									<p className="text-gray-400 text-xs mb-1">البريد الإلكتروني</p>
									<p className="text-gray-200 text-sm group-hover:text-white transition-colors">
										info@alnoran.com
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-gray-500 text-sm">
						© {currentYear} <span className="text-[#690000] font-bold">النوران</span>. جميع الحقوق محفوظة
					</p>

					
					<div className="flex items-center gap-6 text-sm">
						<Link to="/terms" className="text-gray-500 hover:text-[#690000] transition-colors">
							الشروط والأحكام
						</Link>
						<span className="w-1 h-1 rounded-full bg-gray-700"></span>
						<Link to="/terms" className="text-gray-500 hover:text-[#690000] transition-colors">
							سياسة الخصوصية
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
