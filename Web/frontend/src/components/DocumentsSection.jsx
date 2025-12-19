import React from "react";
import { FileText } from "lucide-react";
import FileRow from "./FileRow";

const DocumentsSection = ({ fileItems }) => {
	return (
		<div className="mb-8">
			<h2 className="text-2xl font-bold text-center text-red-900 mb-8 flex items-center justify-center gap-2">
				<FileText className="w-6 h-6" />
				<span>المستندات المرفقة</span>
			</h2>
			{fileItems.length > 0 ? (
				<div className="space-y-4">
					{fileItems.map((item, index) => (
						<FileRow
							key={index}
							name={item.name}
							date={item.date}
							url={item.url}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-8 bg-gray-50 rounded-lg">
					<FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
					<p className="text-gray-500">لا توجد مستندات مرفقة</p>
				</div>
			)}
		</div>
	);
};

export default DocumentsSection;
