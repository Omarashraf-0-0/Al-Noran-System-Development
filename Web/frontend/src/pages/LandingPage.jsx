import React from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ServiceTabs from "../components/ServiceTabs";
import TrackingSection from "../components/TrackingSection";
import ClientOpinions from "../components/ClientOpinions";
import Footer from "../components/Footer";

const LandingPage = () => {
	const handleSearchClick = () => {
		// Scroll to tracking section
		const trackingSection = document.getElementById("tracking-section");
		if (trackingSection) {
			trackingSection.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<div className="min-h-screen" dir="rtl">
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
