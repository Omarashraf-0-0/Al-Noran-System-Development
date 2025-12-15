import React from "react";
import { MessageCircle, Plane, Ship, FileText } from "lucide-react";

const QuickActions = () => {
	const actions = [
		{
			id: 1,
			title: "تواصل معنا",
			icon: MessageCircle,
			bgColor: "bg-cyan-100",
			iconColor: "text-cyan-600",
			link: "/contact",
		},
		{
			id: 2,
			title: "ادراج شهادة جوية",
			icon: Plane,
			bgColor: "bg-red-100",
			iconColor: "text-red-800",
			link: "/air-certificate",
		},
		{
			id: 3,
			title: "ادراج شهادة بحرية",
			icon: Ship,
			bgColor: "bg-cyan-100",
			iconColor: "text-cyan-600",
			link: "/sea-certificate",
		},
		{
			id: 4,
			title: "طلب رقم ACID",
			icon: FileText,
			bgColor: "bg-red-100",
			iconColor: "text-red-800",
			link: "/acidrequest",
		},
	];

	return (
		<div className="container mx-auto px-4 -mt-16 relative z-2" dir="rtl">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{actions.map((action) => {
					const Icon = action.icon;
					return (
						<a
							key={action.id}
							href={action.link}
							className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 p-6 flex items-center space-x-reverse space-x-4 group"
						>
							<div
								className={`${action.bgColor} p-4 rounded-full group-hover:scale-110 transition-transform`}
							>
								<Icon className={`${action.iconColor} w-6 h-6`} />
							</div>
							<span className="text-gray-800 font-semibold text-lg">
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
