import React, { useState } from "react";
import searchIcon from "../assets/images/Search.svg";
import filterListIcon from "../assets/images/filter_list.png";
import filterAltIcon from "../assets/images/filter_alt.png";

const SearchAndFilters = ({
	searchTerm,
	onSearchChange,
	placeholder = "ابحث...",
}) => {
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);

	const toggleFilter = () => {
		setIsFilterOpen(!isFilterOpen);
		setIsSortOpen(false);
	};

	const toggleSort = () => {
		setIsSortOpen(!isSortOpen);
		setIsFilterOpen(false);
	};

	return (
		<div className="flex items-center justify-center mb-8 gap-4 relative">
			{/* Left side — Filter + Sort */}
			<div className="flex items-center gap-3">
				{/* Filter Button */}
				<button
					onClick={toggleFilter}
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
					onClick={toggleSort}
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
					placeholder={placeholder}
					value={searchTerm}
					onChange={onSearchChange}
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
					<h4 className="font-semibold text-red-800 mb-3">تصفية حسب:</h4>
					<select className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700">
						<option>الحالة</option>
						<option>تمت الموافقة</option>
						<option>قيد المراجعة</option>
						<option>مرفوض</option>
					</select>
					<button className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition">
						تطبيق
					</button>
					{/* TODO: Implement actual filter logic */}
				</div>
			)}

			{/* Sort Dropdown */}
			{isSortOpen && (
				<div className="absolute top-14 left-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 text-right z-20 text-gray-700">
					<h4 className="font-semibold text-red-800 mb-3">ترتيب حسب:</h4>
					<select className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-1 focus:ring-red-600 bg-white text-gray-700">
						<option>الأحدث أولاً</option>
						<option>الأقدم أولاً</option>
						<option>المورد (أ-ي)</option>
					</select>
					<button className="w-full bg-red-800 text-white py-1 rounded-md hover:bg-red-700 transition">
						تطبيق
					</button>
					{/* TODO: Implement actual sort logic */}
				</div>
			)}
		</div>
	);
};

export default SearchAndFilters;
