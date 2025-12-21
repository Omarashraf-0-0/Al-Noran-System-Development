import React from "react";
import { MessageCircle, FileText, Globe, Upload } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const QuickActions = () => {
	const { isDarkMode } = useTheme();

	const actions = [
		{
			id: 1,
			title: "طلب رقم ACID",
			icon: FileText,
			bgColor: isDarkMode ? "bg-red-900/40" : "bg-red-100",
			iconColor: isDarkMode ? "text-red-300" : "text-red-800",
			link: "/acidrequest",
		},
		{
			id: 2,
			title: "طلب رقم UCR",
			icon: Globe,
			bgColor: isDarkMode ? "bg-blue-900/40" : "bg-blue-100",
			iconColor: isDarkMode ? "text-blue-300" : "text-blue-800",
			link: "/ucr-request",
		},
		{
			id: 3,
			title: "رفع المستندات",
			icon: Upload,
			bgColor: isDarkMode ? "bg-amber-900/40" : "bg-amber-100",
			iconColor: isDarkMode ? "text-amber-300" : "text-amber-800",
			link: "/upload-documents",
		},
		{
			id: 4,
			title: "تواصل معنا",
			icon: MessageCircle,
			bgColor: isDarkMode ? "bg-teal-900/40" : "bg-teal-100",
			iconColor: isDarkMode ? "text-teal-300" : "text-teal-800",
			link: "/chat",
		},
	];

	return (
		<div className="container mx-auto px-4 -mt-20 relative z-20 mb-16" dir="rtl">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{actions.map((action) => {
					const Icon = action.icon;
					return (
						<a
							key={action.id}
							href={action.link}
							className={`backdrop-blur-md rounded-2xl shadow-lg border p-6 flex items-center gap-4 group hover:-translate-y-2 transition-all duration-300 ${
								isDarkMode
									? "bg-[#1a1010]/90 border-white/10 shadow-black/40 hover:bg-[#2d1515] hover:border-red-500/30 hover:shadow-red-900/20"
									: "bg-white/90 border-white/50 hover:bg-white hover:shadow-2xl"
							}`}
						>
							<div
								className={`p-3 rounded-xl ${action.bgColor} group-hover:scale-110 transition-transform duration-300`}
							>
								<Icon className={`${action.iconColor} w-6 h-6`} />
							</div>
							<span 
								className={`font-bold text-lg transition-colors ${
									isDarkMode 
										? "text-gray-100 group-hover:text-red-400" 
										: "text-gray-800 group-hover:text-[#690000]"
								}`}
							>
								{action.title}
							</span>
						</a>
					);
				})}
			</div>
		</div>
	);
};

export default QuickActions;
