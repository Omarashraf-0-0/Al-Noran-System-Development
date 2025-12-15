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

const HomePage = () => {
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
		window.location.href = `/shipmentstatus/${shipment.acid}`;
	};

	const closeSearchResults = () => {
		setSearchResults(null);
		setSearchQuery("");
	};

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />
			<main className="flex-grow">
				<TrackingHero
					onSearch={handleSearch}
					recommendations={recommendations}
					onSelectShipment={handleSelectShipment}
					loading={loadingRecommendations}
				/>
				<QuickActions />
				<CurrentShipments />
			</main>
			<Footer />

			{searching && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
						<LoadingSpinner />
						<p className="text-gray-700 font-semibold">جاري البحث...</p>
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
