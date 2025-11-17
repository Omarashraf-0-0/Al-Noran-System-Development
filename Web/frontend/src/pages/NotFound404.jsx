import React from "react";
import { useNavigate } from "react-router-dom";
import notFoundImage from "../assets/images/404NotFound.svg";
import Header from "../components/Header";

const NotFound404 = () => {
	const navigate = useNavigate();

	const handleGoHome = () => {
		// Check if user is logged in
		const token = localStorage.getItem("token");
		const user = JSON.parse(localStorage.getItem("user") || "{}");

		if (token && user.type === "employee") {
			navigate("/employeedashboard");
		} else if (token && user.type === "client") {
			navigate("/home");
		} else {
			navigate("/");
		}
	};

	const handleGoBack = () => {
		navigate(-1);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<Header />

			<div
				className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]"
				dir="rtl"
			>
				{/* 404 Image */}
				<div className="w-full max-w-2xl mb-8">
					<img
						src={notFoundImage}
						alt="404 - الصفحة غير موجودة"
						className="w-full h-auto"
					/>
				</div>

				{/* Error Message */}
				<div className="text-center space-y-4 mb-8">
					<h1 className="text-4xl md:text-5xl font-bold text-gray-800">
						عذراً، الصفحة غير موجودة!
					</h1>
					<p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
						الصفحة التي تبحث عنها قد تكون تم نقلها أو حذفها أو أن الرابط غير
						صحيح.
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
					<button
						onClick={handleGoHome}
						className="flex-1 bg-gradient-to-r from-red-800 to-red-900 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-red-900 hover:to-red-950 transition-all transform hover:scale-105 shadow-lg"
					>
						🏠 العودة للصفحة الرئيسية
					</button>

					<button
						onClick={handleGoBack}
						className="flex-1 bg-white text-red-800 border-2 border-red-800 px-8 py-3 rounded-lg font-bold text-lg hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg"
					>
						↩️ رجوع
					</button>
				</div>

				{/* Helper Links */}
				<div className="mt-12 text-center">
					<p className="text-gray-600 mb-4">أو يمكنك زيارة:</p>
					<div className="flex flex-wrap gap-4 justify-center">
						<a
							href="/home"
							className="text-red-800 hover:text-red-900 font-medium hover:underline"
						>
							الصفحة الرئيسية
						</a>
						<span className="text-gray-400">|</span>
						<a
							href="/acidrequest"
							className="text-red-800 hover:text-red-900 font-medium hover:underline"
						>
							طلب رقم ACID
						</a>
						<span className="text-gray-400">|</span>
						<a
							href="/contact"
							className="text-red-800 hover:text-red-900 font-medium hover:underline"
						>
							تواصل معنا
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NotFound404;
