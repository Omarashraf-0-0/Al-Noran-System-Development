import React from "react";
import filterListIcon from "../assets/images/filter_list.png";
import filterAltIcon from "../assets/images/filter_alt.png";
import searchIcon from "../assets/images/Search.svg";

const SearchFilterSort = ({
	searchTerm,
	onSearchChange,
	searchPlaceholder = "ابحث...",
	// Filter props
	isFilterOpen,
	onToggleFilter,
	filterValue,
	onFilterChange,
	filterOptions = [],
	filterLabel = "تصفية حسب الحالة:",
	onFilterApply,
	// Sort props
	isSortOpen,
	onToggleSort,
	sortValue,
	onSortChange,
	sortOptions = [
		{ value: "newest", label: "الأحدث أولاً" },
		{ value: "oldest", label: "الأقدم أولاً" },
		{ value: "clientAZ", label: "العميل (أ-ي)" },
		{ value: "clientZA", label: "العميل (ي-أ)" },
	],
	onSortApply,
	userType = "client", // 'client' | 'employee' | 'admin'
	isDarkMode = true // Default to dark mode
}) => {
	// Determine theme colors with more detailed palette
	const getTheme = () => {
		if (userType === 'admin') {
			return {
				text: "text-[#D4AF37]",
				textHover: "hover:text-[#B5952F]",
				bg: "bg-[#D4AF37]",
				bgLight: "bg-[#D4AF37]/10",
				border: "border-[#D4AF37]/30",
				focusRing: "focus:ring-[#D4AF37]/50",
				glass: "bg-[#D4AF37]/5 backdrop-blur-md border-[#D4AF37]/20",
				icon: "text-[#D4AF37]"
			};
		}
		if (userType === 'employee') {
			return {
				text: "text-[#1ba3b6]",
				textHover: "hover:text-[#158A9A]",
				bg: "bg-[#1ba3b6]",
				bgLight: "bg-[#1ba3b6]/10",
				border: "border-[#1ba3b6]/30",
				focusRing: "focus:ring-[#1ba3b6]/50",
				glass: "bg-[#1ba3b6]/5 backdrop-blur-md border-[#1ba3b6]/20",
				icon: "text-[#1ba3b6]"
			};
		}
		return {
			text: "text-red-800",
			textHover: "hover:text-red-900",
			bg: "bg-red-800",
			bgLight: "bg-red-50",
			border: "border-red-200",
			focusRing: "focus:ring-red-500/30",
			glass: "bg-white border-gray-200",
			icon: "text-red-800"
		};
	};
	const theme = getTheme();

	return (
		<div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 relative z-30">
			
			{/* Search Bar - Premium Input */}
			<div className="relative w-full md:w-1/2 group">
				<div className="relative">
					<input
						type="text"
						placeholder={searchPlaceholder}
						value={searchTerm}
						onChange={(e) => onSearchChange(e.target.value)}
						className={`w-full py-3.5 px-6 pr-12 rounded-2xl text-right outline-none transition-all duration-300 shadow-sm
							${isDarkMode 
								? "bg-white/5 border border-white/10 text-white placeholder-white/40 focus:bg-white/10 focus:border-white/20 backdrop-blur-md" 
								: "bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:shadow-md focus:border-gray-300"
							}
							focus:ring-2 ${theme.focusRing}
						`}
					/>
					<div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? "text-white/60" : "text-gray-400"}`}>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
					</div>
				</div>
			</div>

			{/* Actions - Filter & Sort */}
			<div className="flex items-center gap-3 w-full md:w-auto">
				<div className="relative flex-1 md:flex-none">
					<button
						onClick={onToggleFilter}
						className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-sm border
							${isFilterOpen
								? `${theme.bg} text-white border-transparent`
								: isDarkMode
									? "bg-white/5 text-white/90 border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md"
									: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
							}
						`}
					>
						<img src={filterAltIcon} alt="Filter" className={`w-5 h-5 object-contain ${isFilterOpen ? "brightness-0 invert" : isDarkMode ? "brightness-0 invert" : ""}`} />
						<span>تصفية</span>
					</button>

					{/* Filter Dropdown */}
					{isFilterOpen && (
						<div className={`absolute top-full left-0 mt-3 w-64 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in-up border
							${isDarkMode ? "bg-[#0f1f26] border-[#1ba3b6]/20 backdrop-blur-xl" : "bg-white border-gray-200"}
						`}>
							<h4 className={`font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
								<span className="text-lg">⚡</span> {filterLabel}
							</h4>
							<div className="space-y-1 bg-transparent">
								{filterOptions.map((option) => (
									<button
										key={option.value}
										onClick={() => {
											onFilterChange(option.value);
											onFilterApply();
										}}
										className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-medium transition-all
											${filterValue === option.value
												? `${theme.bgLight} ${theme.text}`
												: isDarkMode 
													? "text-white/70 hover:bg-white/5 hover:text-white" 
													: "text-gray-600 hover:bg-gray-50"
											}
										`}
									>
										{option.label}
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="relative flex-1 md:flex-none">
					<button
						onClick={onToggleSort}
						className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-sm border
							${isSortOpen
								? `${theme.bg} text-white border-transparent`
								: isDarkMode
									? "bg-white/5 text-white/90 border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md"
									: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
							}
						`}
					>
						<img src={filterListIcon} alt="Sort" className={`w-5 h-5 object-contain ${isSortOpen ? "brightness-0 invert" : isDarkMode ? "brightness-0 invert" : ""}`} />
						<span>ترتيب</span>
					</button>

					{/* Sort Dropdown */}
					{isSortOpen && (
						<div className={`absolute top-full left-0 mt-3 w-64 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in-up border
							${isDarkMode ? "bg-[#0f1f26] border-[#1ba3b6]/20 backdrop-blur-xl" : "bg-white border-gray-200"}
						`}>
							<h4 className={`font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
								<span className="text-lg">⇅</span> ترتيب حسب:
							</h4>
							<div className="space-y-1 bg-transparent">
								{sortOptions.map((option) => (
									<button
										key={option.value}
										onClick={() => {
											onSortChange(option.value);
											onSortApply();
										}}
										className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-medium transition-all
											${sortValue === option.value
												? `${theme.bgLight} ${theme.text}`
												: isDarkMode 
													? "text-white/70 hover:bg-white/5 hover:text-white" 
													: "text-gray-600 hover:bg-gray-50"
											}
										`}
									>
										{option.label}
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SearchFilterSort;
