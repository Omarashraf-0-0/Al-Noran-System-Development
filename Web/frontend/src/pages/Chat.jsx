
import React from 'react';
import ChatInterface from '../components/ChatInterface.JSX';

const Chat = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-900 p-4">
      <main className="container mx-auto w-full">
        <ChatInterface />
      </main>
    </div>
  );
};

export default Chat;