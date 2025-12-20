import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
	const currentYear = new Date().getFullYear();

	const quickLinks = [
		{ label: "الرئيسية", path: "/" },
		{ label: "عن النوران", path: "#about" },
		{ label: "خدماتنا", path: "#services" },
		{ label: "تتبع الشحنة", path: "#tracking-section" },
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
			url: "https://facebook.com",
			icon: (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
				</svg>
			),
		},
		{
			name: "Twitter",
			url: "https://twitter.com",
			icon: (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
				</svg>
			),
		},
		{
			name: "Instagram",
			url: "https://instagram.com",
			icon: (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
				</svg>
			),
		},
		{
			name: "WhatsApp",
			url: "https://wa.me/201223382439",
			icon: (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
				</svg>
			),
		},
	];

	return (
		<footer className="bg-[#690000] text-white pt-16 pb-8 relative overflow-hidden">
			{/* Decorative Elements */}
			<div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
			<div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1ba3b6]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

			<div className="container mx-auto px-4 relative z-10">
				{/* Main Footer Content */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
					{/* Company Info */}
					<div className="lg:col-span-1">
						<img
							src="/src/assets/images/white logo.png"
							alt="النوران"
							className="h-24 mb-6"
						/>
						<p className="text-white/80 leading-relaxed mb-6">
							أكثر من 10 سنوات من الخبرة في عالم التصدير والتخليص الجمركي.
							نُحوّل التعقيد إلى انسيابية، والعمليات إلى نجاحات.
						</p>
						{/* Social Links */}
						<div className="flex gap-3">
							{socialLinks.map((social) => (
								<a
									key={social.name}
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#1ba3b6] transition-all duration-300 hover:scale-110"
									aria-label={social.name}
								>
									{social.icon}
								</a>
							))}
						</div>
					</div>

					{/* Quick Links */}
					<div>
						<h3 className="text-lg font-bold mb-6 flex items-center gap-2">
							<span className="w-8 h-1 bg-[#1ba3b6] rounded-full"></span>
							روابط سريعة
						</h3>
						<ul className="space-y-3">
							{quickLinks.map((link) => (
								<li key={link.label}>
									<Link
										to={link.path}
										className="text-white/80 hover:text-[#1ba3b6] transition-colors duration-300 flex items-center gap-2 group"
									>
										<svg className="w-4 h-4 text-[#1ba3b6] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
										</svg>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Services */}
					<div>
						<h3 className="text-lg font-bold mb-6 flex items-center gap-2">
							<span className="w-8 h-1 bg-[#1ba3b6] rounded-full"></span>
							خدماتنا
						</h3>
						<ul className="space-y-3">
							{services.map((service) => (
								<li key={service} className="text-white/80 flex items-center gap-2">
									<svg className="w-4 h-4 text-[#1ba3b6]" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									{service}
								</li>
							))}
						</ul>
					</div>

					{/* Contact Info */}
					<div>
						<h3 className="text-lg font-bold mb-6 flex items-center gap-2">
							<span className="w-8 h-1 bg-[#1ba3b6] rounded-full"></span>
							تواصل معنا
						</h3>
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
									<svg className="w-5 h-5 text-[#1ba3b6]" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
									</svg>
								</div>
								<div>
									<p className="text-white/60 text-sm mb-1">العنوان</p>
									<p className="text-white/90">السادس من أكتوبر - سيتي ستار مول ج2 - الدور الثاني</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
									<svg className="w-5 h-5 text-[#1ba3b6]" fill="currentColor" viewBox="0 0 20 20">
										<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
									</svg>
								</div>
								<div>
									<p className="text-white/60 text-sm mb-1">الهاتف</p>
									<p className="text-white/90" dir="ltr">+20 12 23382439</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
									<svg className="w-5 h-5 text-[#1ba3b6]" fill="currentColor" viewBox="0 0 20 20">
										<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
										<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
									</svg>
								</div>
								<div>
									<p className="text-white/60 text-sm mb-1">البريد الإلكتروني</p>
									<p className="text-white/90">info@alnoran.com</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="pt-8 border-t border-white/10">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<p className="text-white/60 text-sm">
							© {currentYear} النوران. جميع الحقوق محفوظة
						</p>
						<div className="flex items-center gap-6 text-sm text-white/60">
							<Link to="/privacy" className="hover:text-[#1ba3b6] transition-colors">
								سياسة الخصوصية
							</Link>
							<Link to="/terms" className="hover:text-[#1ba3b6] transition-colors">
								الشروط والأحكام
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
