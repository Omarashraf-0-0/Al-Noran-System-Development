
import React, { useState, useRef, useEffect } from 'react';
import SendImg from '../assets/images/send.png'; // <-- Import your image

const MessageBubble = ({ message, isOwnMessage, avatarUrl }) => {
    const bubbleClasses = `
        flex items-end gap-3 max-w-lg
        ${isOwnMessage ? 'self-start flex-row-reverse' : 'self-end'}
    `;

    const textClasses = `
        p-3 rounded-2xl
        ${isOwnMessage ? 'bg-red-600 rounded-br-none text-white' : 'bg-gray-200 text-gray-800 rounded-bl-none'}
    `;

    return (
        <div className={bubbleClasses}>
            {!isOwnMessage && <img src={avatarUrl} alt="User Avatar" className="w-8 h-8 rounded-full"/>}
            <div className={textClasses}>
                <p>{message.text}</p>
                <span className={`text-xs mt-1 block ${isOwnMessage ? 'text-red-100 text-left' : 'text-gray-500 text-right'}`}>{message.timestamp}</span>
            </div>
        </div>
    );
};

const ChatWindow = ({ user, messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center gap-4 p-3 border-b border-gray-200 bg-gray-50">
        <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full" />
        <div>
          <h3 className="font-bold text-lg text-gray-800">{user.name}</h3>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
            <p className="text-sm text-gray-500">{user.isOnline ? 'متصل' : 'غير متصل'}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-white">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isOwnMessage={msg.senderId === 0}
              avatarUrl={user.avatarUrl} 
            />
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة"
            className="flex-1 bg-white text-gray-900 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          />
          <button type="submit" className="p-3 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors disabled:bg-gray-400" disabled={!newMessage.trim()}>
            <img src={SendImg} alt="Send" className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
