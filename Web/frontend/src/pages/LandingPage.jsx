import React from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ServiceTabs from "../components/ServiceTabs";
import TrackingSection from "../components/TrackingSection";
import ClientOpinions from "../components/ClientOpinions";
import Footer from "../components/Footer";

import { useTheme } from "../context/ThemeContext";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const LandingPage = () => {
	const { isDarkMode } = useTheme();
	const location = useLocation();

	useEffect(() => {
		if (location.hash) {
			const element = document.getElementById(location.hash.substring(1));
			if (element) {
				setTimeout(() => {
					element.scrollIntoView({ behavior: "smooth" });
				}, 100);
			}
		}
	}, [location]);

	const handleSearchClick = () => {
		// Scroll to tracking section
		const trackingSection = document.getElementById("tracking-section");
		if (trackingSection) {
			trackingSection.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"}`} dir="rtl">
			<Navbar
				showAuth={true}
				showSearch={true}
				onSearchClick={handleSearchClick}
			/>

			<HeroSection />

			<ServiceTabs />

			<TrackingSection />

			<ClientOpinions />

			<Footer />
		</div>
	);
};

export default LandingPage;
