import React, { useState, useEffect } from "react";
import AdminHeader from "../components/AdminHeader";
import Footer from "../components/Footer";
import bannerPic from "../assets/images/Untitled design (8) 2.png";
import searchIcon from "../assets/images/search.svg";
import AddEmployeePopUp from "../pages/AddEmployeePopUp";

export default function EmployeeManagement() {
	const [employees, setEmployees] = useState([]);
	const [search, setSearch] = useState("");
	const [showPopup, setShowPopup] = useState(false);

	// --------------------------------------
	// Backend API placeholder (edit later)
	// --------------------------------------
	const fetchEmployees = async () => {
		try {
			// 🚀 Replace this with your actual backend endpoint
			// const res = await fetch("https://your-backend.com/api/employees");
			// const data = await res.json();
			// setEmployees(data);

			// Temporary mock data (remove later)
			const mockData = [
				{
					id: 1,
					name: "أميرة علي",
					code: "EMP-001",
					status: "نشط",
					email: "amira@example.com",
				},
				{
					id: 2,
					name: "محمد محمود",
					code: "EMP-002",
					status: "نشط",
					email: "mohamed@example.com",
				},
				{
					id: 3,
					name: "خالد علاء",
					code: "EMP-003",
					status: "غير نشط",
					email: "khaled@example.com",
				},
			];

			setEmployees(mockData);
		} catch (error) {
			console.error("Error fetching employees:", error);
		}
	};

	useEffect(() => {
		fetchEmployees(); // load employees on page load
	}, []);

	// --------------------------------------
	// FILTER employees by search text
	// --------------------------------------
	const filteredEmployees = employees.filter((emp) =>
		emp.name.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 font-sans relative">
			<AdminHeader />

			{/* Welcome Message */}
			<h1 className="text-4xl font-bold text-[#690000] text-right mb-8 mt-8 px-16">
				مرحباً ، اسم المدير !
			</h1>

			{/* Banner */}
			<div className="flex justify-center mb-10">
				<img
					src={bannerPic}
					alt="admin illustration"
					className="w-[350px] md:w-[450px] lg:w-[550px] object-contain"
				/>
			</div>

			{/* Section Title */}
			<h2 className="text-4xl font-bold text-[#690000] text-right my-8 px-16">
				الموظفين
			</h2>

			{/* Search Bar */}
			<div className="flex justify-center mb-8">
				<div className="relative w-full max-w-xl">
					<input
						type="text"
						placeholder="البحث بالكود / اسم الموظف"
						onChange={(e) => setSearch(e.target.value)}
						className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-600 rounded-full py-2 pr-4 pl-10 text-right focus:outline-none focus:ring-2 focus:ring-[#6B0F1A]"
					/>

					<img
						src={searchIcon}
						alt="search icon"
						className="absolute left-4 top-2.5 w-5 h-5 opacity-100"
					/>
				</div>
			</div>

			{/* Employees Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-center border-collapse">
					<thead>
						<tr className="text-gray-700 border-b bg-gray-100">
							<th className="py-3">اسم الموظف</th>
							<th className="py-3">الكود</th>
							<th className="py-3">الحالة</th>
							<th className="py-3">البريد الألكترونى</th>
							<th className="py-3">عرض كل التفاصيل</th>
						</tr>
					</thead>

					<tbody>
						{filteredEmployees.length === 0 ? (
							<tr>
								<td colSpan="5" className="py-6 text-gray-500">
									لا يوجد موظفون مطابقون لبحثك
								</td>
							</tr>
						) : (
							filteredEmployees.map((emp) => (
								<tr key={emp.id} className="border-b text-gray-700">
									<td className="py-3">{emp.name}</td>
									<td className="py-3">{emp.code}</td>
									<td className="py-3">{emp.status}</td>
									<td className="py-3">{emp.email}</td>
									<td className="py-3">
										<button
											onClick={() => console.log("Show employee details")}
											className="text-[#1BA3B6] underline cursor-pointer"
										>
											عرض كل التفاصيل
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Add Employee Button */}
			<div className="flex justify-center mt-10">
				<button
					onClick={() => setShowPopup(true)}
					className="bg-[#1BA3B6] text-white px-6 py-3 rounded-md flex items-center gap-2 hover:opacity-90"
				>
					+ إضافة موظف جديد
				</button>
			</div>
			{showPopup && <AddEmployeePopUp onClose={() => setShowPopup(false)} />}
			<div className="mt-16">
				<Footer />
			</div>
		</div>
	);
}
