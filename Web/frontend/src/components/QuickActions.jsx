import React from "react";
import { MessageCircle, FileText, Globe, Upload } from "lucide-react";

const QuickActions = () => {
	const actions = [
		{
			id: 1,
			title: "طلب رقم ACID",
			icon: FileText,
			bgColor: "bg-red-100",
			iconColor: "text-red-800",
			link: "/acidrequest",
		},
		{
			id: 2,
			title: "طلب رقم UCR",
			icon: Globe,
			bgColor: "bg-blue-100",
			iconColor: "text-blue-800",
			link: "/ucr-request",
		},
		{
			id: 3,
			title: "رفع المستندات",
			icon: Upload,
			bgColor: "bg-amber-100",
			iconColor: "text-amber-800",
			link: "/upload-documents",
		},
		{
			id: 4,
			title: "تواصل معنا",
			icon: MessageCircle,
			bgColor: "bg-teal-100",
			iconColor: "text-teal-800",
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
							className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-6 flex items-center gap-4 group hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:bg-white"
						>
							<div
								className={`p-3 rounded-xl ${action.bgColor} group-hover:scale-110 transition-transform duration-300`}
							>
								<Icon className={`${action.iconColor} w-6 h-6`} />
							</div>
							<span className="text-gray-800 font-bold text-lg group-hover:text-[#690000] transition-colors">
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
