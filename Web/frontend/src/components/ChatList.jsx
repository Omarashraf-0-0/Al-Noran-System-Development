import React, { useState } from "react";

const ChatListItem = ({ user, isSelected, onSelect, theme, accents }) => {
	const isDark = theme === 'dark';
	const baseClasses = "flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 border-b";
	const themeClasses = isDark
		? `border-white/5 hover:bg-white/5 ${isSelected ? `${accents.bgLight} border-l-4 ${accents.border.replace('border', 'border-l')}` : "border-transparent"}`
		: `border-gray-200 hover:bg-gray-50 ${isSelected ? `${accents.bgLight} border-l-4 border-l-[${accents.primary.replace('bg-', '')}]` : ""}`;

	return (
		<div className={`${baseClasses} ${themeClasses}`} onClick={onSelect}>
			<div className="relative">
				<img
					src={user.avatarUrl}
					alt={user.name}
					className={`w-12 h-12 rounded-full border-2 ${isDark ? "border-white/10" : "border-gray-200 shadow-sm"}`}
				/>
				{user.isOnline && (
					<span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
				)}
			</div>
			
			<div className="flex-grow min-w-0">
				<div className="flex justify-between items-start mb-1">
					<h3 className={`font-bold truncate ${isDark ? "text-gray-200" : "text-gray-900"}`}>
						{user.name}
					</h3>
					{user.lastMessageAt && (
						<span className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-500 font-medium"}`}>
							{new Date(user.lastMessageAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
						</span>
					)}
				</div>
				<p className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-600 font-medium"}`}>
					{user.shipmentNumber}
				</p>
			</div>
		</div>
	);
};

const ChatList = ({ users, selectedUser, onSelectUser, theme, accents }) => {
	// Separate assigned and unassigned chats
	const assignedChats = users.filter(user => user.employeeId);
	const unassignedChats = users.filter(user => !user.employeeId);
	
	const isDark = theme === 'dark';
	
	// State for dropdown toggle
	const [isUnassignedOpen, setIsUnassignedOpen] = useState(false);

	return (
		<div className={`h-full flex flex-col ${isDark ? "text-gray-200" : "text-gray-800"}`}>
			<div className={`p-4 border-b ${isDark ? "border-white/5 bg-white/5" : "bg-gray-50/80 border-gray-300"}`}>
				<h2 className="text-lg font-bold">
					المحادثات
				</h2>
			</div>
			<div className="flex-grow overflow-y-auto custom-scrollbar">
				{users.length === 0 ? (
					<div className={`p-8 text-center ${isDark ? "text-gray-500" : "text-gray-500 font-medium"}`}>
						لا توجد محادثات نشطة
					</div>
				) : (
					<>
						{/* Assigned Chats Section - Always Visible */}
						{assignedChats.length > 0 && (
							<div>
								<div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-600 border-b border-gray-200"}`}>
									محادثاتي ({assignedChats.length})
								</div>
								{assignedChats.map((user) => (
									<ChatListItem
										key={user.id}
										user={user}
										isSelected={selectedUser?.id === user.id}
										onSelect={() => onSelectUser(user)}
										theme={theme}
										accents={accents}
									/>
								))}
							</div>
						)}

						{/* Unassigned Chats Section - Dropdown */}
						{unassignedChats.length > 0 && (
							<div>
								<div 
									className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between
										${isDark ? "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20" : "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"}
										border-b`}
									onClick={() => setIsUnassignedOpen(!isUnassignedOpen)}
								>
									<h3 className={`text-sm font-bold ${isDark ? "text-yellow-500" : "text-yellow-700"}`}>
										في الانتظار ({unassignedChats.length})
									</h3>
									<svg 
										className={`w-4 h-4 transition-transform ${isUnassignedOpen ? 'rotate-180' : ''} ${isDark ? "text-yellow-500" : "text-yellow-700"}`}
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
										theme={theme}
										accents={accents}
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
