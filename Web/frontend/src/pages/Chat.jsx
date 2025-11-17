
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatInterface from '../components/ChatInterface.jsx';

const Chat = () => {
  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-900 p-4">
        <main className="container mx-auto w-full">
          <ChatInterface />
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Chat;