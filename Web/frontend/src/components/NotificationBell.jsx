import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const NotificationBell = ({ shipmentId }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Simulate checking for new notifications
    // In a real app, this would connect to Socket.IO or poll an API
    const checkNotifications = () => {
      // Check for new notifications from localStorage or API
      const stored = localStorage.getItem(`notifications_${shipmentId}`);
      if (stored) {
        const notifs = JSON.parse(stored);
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    };

    checkNotifications();
    
    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [shipmentId]);

  const markAsRead = (notifId) => {
    const updated = notifications.map(n => 
      n.id === notifId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(`notifications_${shipmentId}`, JSON.stringify(updated));
    setUnreadCount(updated.filter(n => !n.read).length);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(`notifications_${shipmentId}`);
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-red-800 transition"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">الإشعارات</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-800"
              >
                مسح الكل
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-4 cursor-pointer transition ${
                    notif.read ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{notif.icon || '📢'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.timestamp).toLocaleString('ar-EG')}
                      </p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
