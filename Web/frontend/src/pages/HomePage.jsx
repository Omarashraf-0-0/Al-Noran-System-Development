import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

import Footer from "../components/Footer";
import Header from "../components/Header";
import TrackingHero from "../components/TrackingHero";
import QuickActions from "../components/QuickActions";
import CurrentShipments from "../components/CurrentShipments";
import SearchResults from "../components/SearchResults";
import LoadingSpinner from "../components/LoadingSpinner";
import { useTheme } from "../context/ThemeContext";

const HomePage = () => {
    const { isDarkMode } = useTheme();
	const [searchResults, setSearchResults] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searching, setSearching] = useState(false);
	const [recommendations, setRecommendations] = useState([]);
	const [loadingRecommendations, setLoadingRecommendations] = useState(false);

	const handleSearch = async (trackingNumber, showModal = false) => {
		const token = localStorage.getItem("token");
		if (!token) {
			return;
		}

		try {
			if (showModal) {
				setSearching(true);
			} else {
				setLoadingRecommendations(true);
			}
			setSearchQuery(trackingNumber);

			const searchParam = trackingNumber.trim()
				? `?query=${encodeURIComponent(trackingNumber)}`
				: "";
			const response = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/shipments/search${searchParam}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (response.data.success) {
				if (showModal) {
					// Show results in modal
					setSearchResults(response.data.shipments);
				} else {
					// Show as recommendations dropdown
					setRecommendations(response.data.shipments);
				}
			}
		} catch (error) {
			console.error("Search error:", error);
			if (showModal) {
				toast.error("حدث خطأ أثناء البحث");
				setSearchResults([]);
			} else {
				setRecommendations([]);
			}
		} finally {
			if (showModal) {
				setSearching(false);
			} else {
				setLoadingRecommendations(false);
			}
		}
	};

	const handleSelectShipment = (shipment) => {
		const identifier = shipment.shipmentCode || shipment.acid || shipment.number46 || shipment._id;
		window.location.href = `/shipmentstatus/${identifier}`;
	};

	const closeSearchResults = () => {
		setSearchResults(null);
		setSearchQuery("");
	};

	return (
		<div className={`min-h-screen flex flex-col transition-colors duration-300 relative overflow-hidden ${isDarkMode ? "bg-[#0a0505]" : "bg-gray-50"}`}>
			<style>{`
				@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
				@keyframes float-reverse { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(20px); } }
				@keyframes float-slow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
				@keyframes pulse-glow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }
				.animate-float { animation: float 6s ease-in-out infinite; }
				.animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
				.animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
				.animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
			`}</style>
			
			{/* Animated Background Elements */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				{isDarkMode ? (
					<>
						<div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#690000]/20 rounded-full filter blur-[120px] animate-pulse-glow"></div>
						<div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#2b0000]/30 rounded-full filter blur-[150px] animate-float-slow"></div>
						<div className="absolute top-[60%] right-[20%] w-[400px] h-[400px] bg-[#4a0a0a]/20 rounded-full filter blur-[100px] animate-float-reverse"></div>
					</>
				) : (
					<>
						<div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#ffcccc]/40 rounded-full filter blur-[120px] animate-pulse-glow"></div>
						<div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#ffe6e6]/50 rounded-full filter blur-[150px] animate-float-slow"></div>
					</>
				)}
			</div>

			<Header />
			
			<main className="flex-grow relative z-10 text-white">
				<TrackingHero
					onSearch={handleSearch}
					recommendations={recommendations}
					onSelectShipment={handleSelectShipment}
					loading={loadingRecommendations}
				/>
				<div className="relative z-20">
					<QuickActions />
					<CurrentShipments />
				</div>
			</main>
			
			<div className="relative z-10">
				<Footer />
			</div>

			{searching && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
					<div className={`rounded-2xl p-8 flex flex-col items-center gap-4 ${isDarkMode ? "bg-[#1a1010] border border-white/10" : "bg-white"}`}>
						<LoadingSpinner />
						<p className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>جاري البحث...</p>
					</div>
				</div>
			)}

			{searchResults && (
				<SearchResults
					results={searchResults}
					onClose={closeSearchResults}
					searchQuery={searchQuery}
				/>
			)}
		</div>
	);
};

export default HomePage;
