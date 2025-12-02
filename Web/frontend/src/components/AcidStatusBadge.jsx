import React from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const AcidStatusBadge = ({ status, isLocked }) => {
	const getStatusConfig = () => {
		switch (status) {
			case "ACID Issued":
			case "approved":
			case "completed":
				return {
					bgColor: "bg-green-100",
					textColor: "text-green-800",
					icon: <CheckCircle className="w-5 h-5" />,
					text: "تم إصدار ACID",
				};
			case "Rejected":
				return {
					bgColor: "bg-red-100",
					textColor: "text-red-800",
					icon: <XCircle className="w-5 h-5" />,
					text: "مرفوض",
				};
			case "Under Review":
				return {
					bgColor: "bg-orange-100",
					textColor: "text-orange-800",
					icon: <Clock className="w-5 h-5" />,
					text: "قيد المراجعة من قبل الموظف",
				};
			case "Pending":
			default:
				return {
					bgColor: "bg-yellow-100",
					textColor: "text-yellow-800",
					icon: <Clock className="w-5 h-5" />,
					text: "في انتظار المراجعة",
				};
		}
	};

	const { bgColor, textColor, icon, text } = getStatusConfig();

	return (
		<div className="flex flex-col gap-2">
			<div
				className={`${bgColor} ${textColor} px-4 py-2 rounded-full flex items-center gap-2 w-fit font-semibold`}
			>
				{icon}
				<span>{text}</span>
			</div>
			{isLocked && (
				<div className="bg-orange-50 border border-orange-300 px-4 py-2 rounded-lg flex items-center gap-2">
					<span className="text-orange-800 font-semibold">🔒</span>
					<span className="text-orange-800 text-sm">
						الطلب قيد المعالجة حالياً من قبل أحد الموظفين ولا يمكن تعديله
					</span>
				</div>
			)}
		</div>
	);
};

export default AcidStatusBadge;
