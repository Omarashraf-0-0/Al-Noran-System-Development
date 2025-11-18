import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import AvatarImg from '../assets/images/AVATAR.png';

const AVATAR_URL = AvatarImg;

const mockUsers = [
  { id: 1, name: 'اسم العميل', shipmentNumber: 'رقم الشحنة', avatarUrl: AVATAR_URL, isOnline: true },
  { id: 2, name: 'اسم العميل', shipmentNumber: 'رقم الشحنة', avatarUrl: AVATAR_URL, isOnline: false },
  { id: 3, name: 'اسم العميل', shipmentNumber: 'رقم الشحنة', avatarUrl: AVATAR_URL, isOnline: true },
  { id: 4, name: 'اسم العميل', shipmentNumber: 'رقم الشحنة', avatarUrl: AVATAR_URL, isOnline: false },
  { id: 5, name: 'اسم العميل', shipmentNumber: 'رقم الشحنة', avatarUrl: AVATAR_URL, isOnline: true },
];

const mockMessages = {
  1: [
    { id: 1, senderId: 1, text: 'استفسار بخصوص شحنتي رقم SH123456.', timestamp: '10:30 ص' },
    { id: 2, senderId: 0, text: 'أهلاً بك يا سيد محمد، كيف يمكنني مساعدتك؟', timestamp: '10:31 ص' },
  ],
  2: [
    { id: 1, senderId: 2, text: 'مرحباً، لدي سؤال.', timestamp: '11:00 ص' }
  ],
  3: [
    { id: 1, senderId: 3, text: 'السلام عليكم، أود تتبع شحنتي.', timestamp: '11:15 ص' }
  ],
  4: [
    { id: 1, senderId: 4, text: 'هل يمكنني تغيير عنوان التسليم؟', timestamp: '11:30 ص' }
  ],
  5: [
    { id: 1, senderId: 5, text: 'شكراً لكم على الخدمة الممتازة.', timestamp: '11:45 ص' }
  ],
};

const ChatInterface = () => {
  const [selectedUser, setSelectedUser] = useState(mockUsers[0]);
  const [messages, setMessages] = useState(mockMessages[selectedUser.id]);
  const [users] = useState(mockUsers);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMessages(mockMessages[user.id] || []);
  };

  const handleSendMessage = (newMessageText) => {
    if (newMessageText.trim() === '') return;

    const newMessage = {
      id: messages.length + 1,
      senderId: 0, // 0 represents the support agent
      text: newMessageText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  return (
    <div className="flex flex-col md:flex-row h-[75vh] max-h-[800px] bg-white rounded-lg overflow-hidden shadow-lg shadow-gray-300/50 border border-gray-200">
      <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-50 md:border-l md:border-gray-200">
        <ChatList users={users} selectedUser={selectedUser} onSelectUser={handleSelectUser} />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatWindow
          user={selectedUser}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default ChatInterface;