import React, { useState, useEffect, useRef } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import AvatarImg from '../assets/images/AVATAR.png';
import { io } from 'socket.io-client';

const AVATAR_URL = AvatarImg;

const ChatInterface = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const socketRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3500';

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/users`);
        if (response.ok) {
          const data = await response.json();
          const formattedUsers = (data.users || data || []).map((user) => ({
            id: user._id || user.id,
            name: user.fullName || user.name || 'Unknown User',
            shipmentNumber: user._id || 'N/A',
            avatarUrl: AVATAR_URL,
            isOnline: user.isOnline || false,
          }));
          setUsers(formattedUsers);
          if (formattedUsers.length > 0) {
            setSelectedUser(formattedUsers[0]);
            setMessages([]);
          }
        } else {
          console.warn('Failed to fetch users:', response.status);
          setUsers([]);
        }
      } catch (err) {
        console.warn('Error fetching users:', err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [BACKEND_URL]);

  useEffect(() => {
    // initialize socket once
    if (!socketRef.current) {
      try {
        socketRef.current = io(BACKEND_URL, { transports: ['websocket'], withCredentials: true });

        socketRef.current.on('connect', () => {
          console.log('Socket connected', socketRef.current.id);
        });

        // listen for incoming messages and append to current conversation
        socketRef.current.on('chatMessage', (msg) => {
          setMessages((prev) => {
            // if message includes shipment/room info we could filter, for now append
            return [...prev, msg];
          });
        });
      } catch (err) {
        console.warn('Socket.IO client failed to initialize', err);
      }
    }

    return () => {
      // keep connection live across mounts; if you want to disconnect on unmount, uncomment next line
      // socketRef.current?.disconnect();
    };
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMessages([]); // Clear messages; you can fetch them from backend if needed
    // join a room on server for this shipment or user id
    try {
      const room = user.shipmentNumber || user.id;
      if (socketRef.current && room) {
        socketRef.current.emit('joinShipmentRoom', room);
        console.log('Joined room', room);
      }
    } catch (err) {
      console.warn('Failed to join room', err);
    }
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

    // emit via socket to backend so other clients/agents can receive it
    try {
      const room = selectedUser?.shipmentNumber || selectedUser?.id;
      if (socketRef.current) {
        socketRef.current.emit('chatMessage', { room, message: newMessage });
      }
    } catch (err) {
      console.warn('Failed to emit chatMessage', err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[75vh] max-h-[800px] bg-white rounded-lg overflow-hidden shadow-lg shadow-gray-300/50 border border-gray-200">
      <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-50 md:border-l md:border-gray-200">
        {loadingUsers ? (
          <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-center text-gray-500">لا توجد مستخدمين</div>
        ) : (
          <ChatList users={users} selectedUser={selectedUser} onSelectUser={handleSelectUser} />
        )}
      </div>
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <ChatWindow
            user={selectedUser}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            اختر مستخدماً لبدء المحادثة
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
