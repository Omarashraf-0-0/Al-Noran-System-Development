import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import bannerImage from "../assets/images/Untitled design (7) 1.png";
import contractImage from "../assets/images/contract.png";
import groupImage from "../assets/images/Group 275.png";
import axios from "axios";
import { toast } from "react-hot-toast";

const StatCard = ({ value, label }) => (
	<div className="bg-white rounded-lg shadow-md p-4 flex-1 flex items-center justify-between">
		{/* Icon on the right */}
		<div className="flex-shrink-0 ml-4">
			<img
				src={contractImage}
				alt="Status Icon"
				className="w-8 h-8 object-contain"
			/>
		</div>

		{/* Text on the left */}
		<div className="text-right flex-1">
			<p className="text-sm text-gray-500">{label}</p>
			<p className="text-lg font-bold text-gray-800">{value}</p>
		</div>
	</div>
);

StatCard.propTypes = {
	value: PropTypes.string,
	label: PropTypes.string,
};

const WelcomeBanner = () => {
	const user = JSON.parse(localStorage.getItem("user"));
	const userName = user?.username || user?.fullname || user?.name || "الزائر";
	const userID = user?.id || user?._id;
	const userType = user?.type || user?.userType || user?.role; // Check multiple properties for user type
	const token = localStorage.getItem("token");

	const [stats, setStats] = useState({
		completed: 0,
		inProgress: 0,
		total: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				if (!userID) {
					console.error("User ID not found");
					setLoading(false);
					return;
				}

				// Determine endpoint based on user type
				const isEmployee = userType === "employee" || userType === "admin";
				const endpoint = isEmployee
					? `${
							import.meta.env.VITE_API_URL
					  }/api/shipments/employee/${userID}/stats`
					: `${
							import.meta.env.VITE_API_URL
					  }/api/shipments/user/${userID}/stats`;

				console.log("User type:", userType);
				console.log("Is employee:", isEmployee);
				console.log("Fetching stats from:", endpoint);

				const response = await axios.get(endpoint, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.data.success) {
					setStats(response.data.stats);
				}
			} catch (error) {
				console.error("Error fetching shipment stats:", error);
				toast.error("فشل في تحميل إحصائيات الشحنات");
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, [userID, userType, token]);

	return (
		<section className="flex flex-col items-center py-8 px-4">
			{/* 🟥 Greeting Above the Card */}
			<div className="w-full max-w-4xl mb-4 text-right">
				<h1 className="text-2xl font-bold text-red-800">مرحباً, {userName}!</h1>
			</div>

			{/* 🟫 Card Section */}
			<div className="w-full max-w-4xl bg-[#6B0F1A] rounded-xl shadow-lg p-8 text-center">
				<div className="flex justify-center items-center mb-6">
					<img
						src={bannerImage}
						alt="Logistics Illustration"
						className="w-[450px] md:w-[550px] lg:w-[650px] max-h-[400px] rounded-lg object-contain"
					/>
				</div>

				<div className="flex flex-col md:flex-row gap-4">
					{/* Cards  have icons on the right */}
					<StatCard
						value={loading ? "..." : stats.completed.toString()}
						label="عدد الشحنات المكتملة"
					/>
					<StatCard
						value={loading ? "..." : stats.inProgress.toString()}
						label="عدد الشحنات قيد التوصيل"
					/>
				</div>
			</div>
		</section>
	);
};

export default WelcomeBanner;
