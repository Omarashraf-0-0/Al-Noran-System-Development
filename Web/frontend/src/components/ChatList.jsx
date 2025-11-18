import React from 'react';

const ChatListItem = ({ user, isSelected, onSelect }) => {
    const itemClasses = `
        flex items-center gap-4 p-4 cursor-pointer transition-colors duration-200 border-b border-gray-200
        ${isSelected ? 'bg-red-600' : 'hover:bg-gray-100'}
    `;

    return (
        <div className={itemClasses} onClick={onSelect}>
            <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full border-2 border-gray-300" />
            <div className="flex-grow">
                <h3 className={`font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{user.name}</h3>
                <p className={`text-sm ${isSelected ? 'text-red-100' : 'text-gray-500'}`}>{user.shipmentNumber}</p>
            </div>
        </div>
    );
};


const ChatList = ({ users, selectedUser, onSelectUser }) => {
  return (
    <div className="h-full flex flex-col">
       <div className="p-4 bg-white border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 text-center">المحادثات</h2>
      </div>
      <div className="flex-grow overflow-y-auto">
        {users.map(user => (
          <ChatListItem
            key={user.id}
            user={user}
            isSelected={selectedUser.id === user.id}
            onSelect={() => onSelectUser(user)}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatList;