import React from 'react';
import account_circle from '../assets/images/account_circle.png';
import notifications_unread from '../assets/images/notifications_unread.png';
import coloredLogo from '../assets/images/coloredLogo.png';
import dehaze from '../assets/images/dehaze.png'; 

const Header = () => {
  const primaryColor = '#690000'; 

  return (
    <header className="bg-white shadow-sm">
      <div className="w-full px-6">
        {/* 🔹 Flex container with items pushed to edges */}
        <div className="flex items-center justify-between h-16 w-full">
          
          {/* ====================== */}
          {/* 🔸 Left Section (Logo + Menu + Nav Links) */}
          {/* ====================== */}
          <div className="flex items-center gap-6">
            {/*  Menu Icon */}
            <button className="p-1 rounded-md hover:opacity-80 focus:outline-none">
              <img
                src={dehaze}
                alt="Menu"
                className="h-7 w-7 object-contain"
              />
            </button>

            {/*  Logo */}
            <img 
              src={coloredLogo} 
              alt="Logo" 
              className="h-8 w-auto object-contain" 
            />

            {/* 🔹 Navigation Links */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-baseline space-x-4 space-x-reverse">
                <a
                  href="#"
                  className="text-gray-700 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  الدعم
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  تتبع شحنة
                </a>
                <a
                  href="#"
                  className="text-red-800 font-bold px-3 py-2 rounded-md text-sm"
                >
                  شحناتي
                </a>
              </div>
            </nav>
          </div>

          {/* ====================== */}
          {/* 🔸 Right Section (Notification & Profile) */}
          {/* ====================== */}
          <div className="flex items-center gap-4">
            {/* Notification Icon */}
            <button className="p-1 rounded-full hover:opacity-80 focus:outline-none">
              <img
                src={notifications_unread}
                alt="Notifications"
                className="h-8 w-8 object-contain"
              />
            </button>

            {/* 👤 User Profile Icon */}
            <button className="rounded-full flex items-center text-sm focus:outline-none">
              <img
                src={account_circle}
                alt="User Account"
                className="h-8 w-8 rounded-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
