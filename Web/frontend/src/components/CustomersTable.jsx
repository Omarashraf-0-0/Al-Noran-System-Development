import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Eye, Trash2, Ban, Unlock, FileText, ChevronUp, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * CustomersTable Component
 * Displays a table of customers with actions (view, toggle status, delete)
 */
const CustomersTable = ({
	customers,
	search,
	onViewDetails,
	onToggleStatus,
	onDelete,
	onSort,
	sortConfig,
	getClientTypeLabel,
}) => {
	const { isDarkMode } = useTheme();

	// Theme classes
	const theme = {
		tableBg: isDarkMode ? "bg-[#1a1600]/40" : "bg-white",
		headerBg: isDarkMode ? "bg-[#2d2600]/80" : "bg-gradient-to-r from-red-800 to-red-900",
		headerText: isDarkMode ? "text-[#D4AF37]" : "text-white",
		rowText: isDarkMode ? "text-gray-200" : "text-gray-700",
		rowHover: isDarkMode ? "hover:bg-[#D4AF37]/5" : "hover:bg-red-50/30",
		border: isDarkMode ? "border-[#D4AF37]/10" : "border-gray-100",
		emptyText: isDarkMode ? "text-[#D4AF37]/50" : "text-gray-500",
	};

	// Helper to render sort icon
	const SortIcon = ({ column }) => {
		if (sortConfig?.key !== column) return <div className="w-4 h-4 opacity-0" />;
		return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
	};

	// Sortable Header Component
	const SortHeader = ({ label, sortKey, canSort = true }) => (
		<th 
			className={`py-4 px-4 font-bold ${theme.headerText} whitespace-nowrap transition-colors ${canSort ? "cursor-pointer hover:opacity-80 select-none" : ""}`}
			onClick={() => canSort && onSort && onSort(sortKey)}
		>
			<div className="flex items-center justify-center gap-1 group">
				{label}
				{canSort && <SortIcon column={sortKey} />}
			</div>
		</th>
	);

	return (
		<div className={`overflow-x-auto rounded-2xl border ${theme.border} shadow-lg backdrop-blur-sm ${theme.tableBg}`}>
			<table className="w-full text-center border-collapse">
				<thead>
					<tr className={`border-b ${theme.border} ${theme.headerBg}`}>
						<th className={`py-4 px-4 font-bold ${theme.headerText} whitespace-nowrap`}>#</th>
						<SortHeader label="اسم العميل" sortKey="name" />
						<SortHeader label="اسم المستخدم" sortKey="username" />
						<SortHeader label="نوع العميل" sortKey="clientType" />
						<SortHeader label="الحالة" sortKey="status" />
						<SortHeader label="البريد الإلكتروني" sortKey="email" />
						<SortHeader label="الهاتف" sortKey="phone" />
						<th className={`py-4 px-4 font-bold ${theme.headerText} whitespace-nowrap`}>الإجراءات</th>
					</tr>
				</thead>

				<tbody>
					{customers.length === 0 ? (
						<tr>
							<td colSpan="8" className={`py-12 text-center text-lg ${theme.emptyText}`}>
								{search ? "لا يوجد عملاء مطابقون لبحثك" : "لا يوجد عملاء مسجلون"}
							</td>
						</tr>
					) : (
						customers.map((cust, index) => (
							<tr
								key={cust.id}
								className={`border-b ${theme.border} transition-colors duration-200 ${theme.rowHover} ${theme.rowText}`}
							>
								<td className="py-4 px-4 font-medium opacity-70">
									{index + 1}
								</td>
								<td className="py-4 px-4 font-bold">{cust.name}</td>
								<td className="py-4 px-4 opacity-90 font-mono text-sm">{cust.username}</td>
								<td className="py-4 px-4">
									<span className={`px-2 py-1 rounded text-xs font-bold ${
										isDarkMode ? "bg-[#1BA3B6]/20 text-[#1BA3B6]" : "bg-blue-50 text-blue-700 border border-blue-100"
									}`}>
										{getClientTypeLabel(cust.clientType)}
									</span>
								</td>
								<td className="py-4 px-4">
									<div className="flex flex-col gap-1 items-center justify-center">
										{cust.status === "نشط" || cust.active ? (
											<span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
												نشط
											</span>
										) : (
											<span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 border border-red-500/20">
												غير نشط
											</span>
										)}
									</div>
								</td>
								<td className="py-4 px-4 text-sm opacity-80">{cust.email}</td>
								<td className="py-4 px-4 text-sm opacity-80" dir="ltr">{cust.phone}</td>
								<td className="py-4 px-4">
									<div className="flex gap-2 justify-center flex-wrap">
										<button
											onClick={() => onViewDetails(cust.id)}
											className="bg-[#1BA3B6]/10 text-[#1BA3B6] hover:bg-[#1BA3B6] hover:text-white p-2 rounded-lg transition-all shadow-sm group"
											title="عرض التفاصيل"
										>
											<Eye className="w-5 h-5" />
										</button>
										
										<Link
											to={`/client/${cust.id}`}
											className="bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white p-2 rounded-lg transition-all shadow-sm group"
											title="ملف العميل"
										>
											<FileText className="w-5 h-5" />
										</Link>

										<button
											onClick={() => onToggleStatus(cust.id, cust.status)}
											className={`p-2 rounded-lg transition-all shadow-sm group ${
												cust.status === "نشط" || cust.active
													? "bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white"
													: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
											}`}
											title={cust.status === "نشط" ? "تعطيل" : "تفعيل"}
										>
											{cust.status === "نشط" || cust.active ? <Ban className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
										</button>

										<button
											onClick={() => onDelete(cust.id)}
											className="bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all shadow-sm group"
											title="حذف"
										>
											<Trash2 className="w-5 h-5" />
										</button>
									</div>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
};

export default CustomersTable;
