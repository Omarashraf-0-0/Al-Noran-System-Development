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
}) => {
	return (
		<div className="flex items-center justify-center mb-8 gap-4 relative">
			{/* Left side — Filter + Sort */}
			<div className="flex items-center gap-3">
				{/* Filter Button */}
				<button
					onClick={onToggleFilter}
					className={`flex items-center gap-2 font-medium transition-colors ${
						isFilterOpen
							? "bg-red-800 text-white px-3 py-1 rounded-md"
							: "text-red-800"
					}`}
				>
					<img
						src={filterAltIcon}
						alt="Filter"
						className="w-5 h-5 object-contain"
					/>
					تصفية
				</button>

				{/* Sort Button */}
				<button
					onClick={onToggleSort}
					className={`flex items-center gap-2 font-medium transition-colors ${
						isSortOpen
							? "bg-red-800 text-white px-3 py-1 rounded-md"
							: "text-red-800"
					}`}
				>
					<img
						src={filterListIcon}
						alt="Sort"
						className="w-5 h-5 object-contain"
					/>
					ترتيب
				</button>
			</div>

			{/* Search Bar */}
			<div className="relative w-1/2">
				<input
					type="text"
					placeholder={searchPlaceholder}
					value={searchTerm}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full bg-white shadow-md rounded-full py-2 px-4 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400 text-black"
				/>
				<img
					src={searchIcon}
					alt="Search"
					className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
				/>
			</div>

			{/* Filter Dropdown */}
			{isFilterOpen && (
				<div className="absolute top-14 left-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
					<h4 className="font-semibold text-red-800 mb-3">{filterLabel}</h4>
					<select
						value={filterValue}
						onChange={(e) => onFilterChange(e.target.value)}
						className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700"
					>
						{filterOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<button
						onClick={onFilterApply}
						className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition"
					>
						تطبيق
					</button>
				</div>
			)}

			{/* Sort Dropdown */}
			{isSortOpen && (
				<div className="absolute top-14 left-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
					<h4 className="font-semibold text-red-800 mb-3">ترتيب حسب:</h4>
					<select
						value={sortValue}
						onChange={(e) => onSortChange(e.target.value)}
						className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700"
					>
						{sortOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<button
						onClick={onSortApply}
						className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition"
					>
						تطبيق
					</button>
				</div>
			)}
		</div>
	);
};

export default SearchFilterSort;
