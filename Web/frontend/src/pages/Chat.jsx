import React from "react";
import { useSearchParams } from "react-router-dom";
import ChatInterface from "../components/ChatInterface.jsx";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Chat = () => {
	const [searchParams] = useSearchParams();
	const chatId = searchParams.get("chatId");

	return (
		<div className="flex flex-col min-h-screen bg-gray-50">
			<Header />
			<main className="flex-grow flex items-center justify-center p-4">
				<div className="container mx-auto w-full max-w-7xl">
					<h1 className="text-3xl font-bold text-center text-red-900 mb-6">
						{chatId ? "المحادثة" : "الدعم الفني"}
					</h1>
					<ChatInterface preselectedChatId={chatId} />
				</div>
			</main>
			<Footer />
		</div>
	);
};

export default Chat;
