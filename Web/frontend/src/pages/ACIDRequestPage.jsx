import React from "react";
import Navbar from "../components/Navbar";
import BackgroundContainer from "../components/BackgroundContainer";
import FormContainer from "../components/FormContainer";
import ACIDRequestForm from "../components/ACIDRequestForm";
import { toast } from "react-hot-toast";
import axios from "axios";

const ACIDRequestPage = () => {
	const handleACIDRequest = (formData) => {
		console.log("ACID Request attempt:", formData);
		console.log("API URL:", import.meta.env.VITE_API_URL);
		
	};

	return (
		<>
			<Navbar />
			<BackgroundContainer>
				<FormContainer>
					<ACIDRequestForm onSubmit={handleACIDRequest} />
				</FormContainer>
			</BackgroundContainer>
		</>
	);
};

export default  ACIDRequestPage;
