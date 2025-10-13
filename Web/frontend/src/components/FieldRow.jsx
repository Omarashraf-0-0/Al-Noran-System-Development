import React from "react";

/**
 * FieldRow Component - للـ fields اللي عايز تحطهم جنب بعض
 * استخدم columns prop عشان تحدد عدد الأعمدة في الشاشات الكبيرة
 */
const FieldRow = ({ children, columns = 2, className = "" }) => {
	const columnClasses = {
		1: "grid-cols-1",
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
	};

	return (
		<div className={`grid ${columnClasses[columns]} gap-4 w-full ${className}`}>
			{children}
		</div>
	);
};

export default FieldRow;
