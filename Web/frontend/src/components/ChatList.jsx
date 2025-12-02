import React, { useState } from "react";

const ChatListItem = ({ user, isSelected, onSelect }) => {
	const itemClasses = `
        flex items-center gap-4 p-4 cursor-pointer transition-colors duration-200 border-b border-gray-200
        ${isSelected ? "bg-red-600" : "hover:bg-gray-100"}
    `;

	return (
		<div className={itemClasses} onClick={onSelect}>
			<img
				src={user.avatarUrl}
				alt={user.name}
				className="w-12 h-12 rounded-full border-2 border-gray-300"
			/>
			<div className="flex-grow">
				<h3
					className={`font-bold ${isSelected ? "text-white" : "text-gray-800"}`}
				>
					{user.name}
				</h3>
				<p
					className={`text-sm ${isSelected ? "text-red-100" : "text-gray-500"}`}
				>
					{user.shipmentNumber}
				</p>
			</div>
		</div>
	);
};

const ChatList = ({ users, selectedUser, onSelectUser }) => {
	// Separate assigned and unassigned chats
	const assignedChats = users.filter(user => user.employeeId);
	const unassignedChats = users.filter(user => !user.employeeId);
	
	// State for dropdown toggle
	const [isUnassignedOpen, setIsUnassignedOpen] = useState(false);

	return (
		<div className="h-full flex flex-col">
			<div className="p-4 bg-white border-b border-gray-200">
				<h2 className="text-xl font-bold text-gray-800 text-center">
					المحادثات
				</h2>
			</div>
			<div className="flex-grow overflow-y-auto">
				{users.length === 0 ? (
					<div className="p-4 text-center text-gray-500">لا توجد محادثات</div>
				) : (
					<>
						{/* Assigned Chats Section - Always Visible */}
						{assignedChats.length > 0 && (
							<div>
								<div className="px-4 py-2 bg-gray-100 border-b border-gray-300">
									<h3 className="text-sm font-semibold text-gray-700">
										محادثاتي ({assignedChats.length})
									</h3>
								</div>
								{assignedChats.map((user) => (
									<ChatListItem
										key={user.id}
										user={user}
										isSelected={selectedUser?.id === user.id}
										onSelect={() => onSelectUser(user)}
									/>
								))}
							</div>
						)}

						{/* Unassigned Chats Section - Dropdown */}
						{unassignedChats.length > 0 && (
							<div>
								<div 
									className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors flex items-center justify-between"
									onClick={() => setIsUnassignedOpen(!isUnassignedOpen)}
								>
									<h3 className="text-sm font-semibold text-yellow-800">
										في الانتظار ({unassignedChats.length})
									</h3>
									<svg 
										className={`w-5 h-5 text-yellow-800 transition-transform ${isUnassignedOpen ? 'rotate-180' : ''}`}
										fill="none" 
										stroke="currentColor" 
										viewBox="0 0 24 24"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</div>
								{isUnassignedOpen && unassignedChats.map((user) => (
									<ChatListItem
										key={user.id}
										user={user}
										isSelected={selectedUser?.id === user.id}
										onSelect={() => onSelectUser(user)}
									/>
								))}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default ChatList;
