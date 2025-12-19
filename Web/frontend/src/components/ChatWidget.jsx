import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ChatInterface from "./ChatInterface";

const ChatWidget = ({ isOpen, onClose, userType }) => {
	const [isMinimized, setIsMinimized] = useState(false);

	useEffect(() => {
		// Prevent body scroll when chat is open
		if (isOpen && !isMinimized) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen, isMinimized]);

	if (!isOpen) return null;

	const widgetContent = (
		<>
			{/* Overlay */}
			{!isMinimized && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
					onClick={onClose}
				/>
			)}

			{/* Chat Container */}
			<div
				className={`fixed z-50 transition-all duration-300 ${
					isMinimized
						? "bottom-4 right-4 w-80 h-16"
						: "inset-4 md:right-4 md:bottom-4 md:top-auto md:left-auto md:w-[600px] md:h-[700px]"
				}`}
			>
				<div className="bg-white rounded-lg shadow-2xl h-full flex flex-col overflow-hidden">
					{/* Header */}
					<div className="bg-gradient-to-r from-red-900 to-red-700 text-white px-4 py-3 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
							<h3 className="font-bold text-lg">
								{userType === "employee" ? "لوحة الدعم" : "الدعم الفني"}
							</h3>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setIsMinimized(!isMinimized)}
								className="p-2 hover:bg-white/10 rounded-full transition"
								title={isMinimized ? "تكبير" : "تصغير"}
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									{isMinimized ? (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
										/>
									) : (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M20 12H4"
										/>
									)}
								</svg>
							</button>
							<button
								onClick={onClose}
								className="p-2 hover:bg-white/10 rounded-full transition"
								title="إغلاق"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>

					{/* Chat Content */}
					{!isMinimized && (
						<div className="flex-1 overflow-hidden">
							<ChatInterface />
						</div>
					)}
				</div>
			</div>
		</>
	);

	return createPortal(widgetContent, document.body);
};

export default ChatWidget;
