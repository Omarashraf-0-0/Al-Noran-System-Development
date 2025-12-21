import React from "react";
import { FileText } from "lucide-react";
import FileRow from "./FileRow";
import { useTheme } from "../context/ThemeContext";

const DocumentsSection = ({ fileItems, onViewFile }) => {
	const { isDarkMode } = useTheme();

	return (
		<div
			className={`rounded-3xl p-6 sm:p-8 mb-8 border backdrop-blur-sm transition-all duration-300 ${
				isDarkMode
					? "bg-white/5 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
					: "bg-white/60 border-white/40 shadow-xl shadow-red-900/5"
			}`}
		>
			<h2 className="text-2xl font-bold mb-8 flex items-center gap-3 border-b border-gray-200/50 pb-4">
				<span className={`p-2 rounded-xl ${isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-800"}`}>
					<FileText className="w-6 h-6" />
				</span>
				<span className={`bg-gradient-to-r bg-clip-text text-transparent ${
					isDarkMode ? "from-gray-100 to-gray-400" : "from-gray-900 to-gray-600"
				}`}>
					المستندات المرفقة
				</span>
			</h2>

			{fileItems.length > 0 ? (
				<div className="space-y-4">
					{fileItems.map((item, index) => (
						<FileRow
							key={index}
							name={item.name}
							date={item.date}
							url={item.url}
							id={item.id}
							onView={() => onViewFile && onViewFile(item)}
						/>
					))}
				</div>
			) : (
				<div className={`text-center py-12 rounded-2xl flex flex-col items-center gap-4 ${
					isDarkMode ? "bg-white/5 border border-white/5" : "bg-gray-50 border border-gray-100"
				}`}>
					<div className={`p-4 rounded-full ${isDarkMode ? "bg-white/5" : "bg-white"}`}>
						<FileText className={`w-8 h-8 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
					</div>
					<p className={isDarkMode ? "text-gray-500" : "text-gray-500"}>لا توجد مستندات مرفقة</p>
				</div>
			)}
		</div>
	);
};

export default DocumentsSection;
