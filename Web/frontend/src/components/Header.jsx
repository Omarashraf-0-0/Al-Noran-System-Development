
import React from 'react';
import { LogoIcon, BellIcon, UserIcon, MenuIcon } from './icons';

const Header = () => {
  const primaryColor = '#690000'; 

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <LogoIcon className="h-8 w-auto" color={primaryColor} />
            </div>
            <nav className="hidden md:block">
              <div className="mr-10 flex items-baseline space-x-4 space-x-reverse">
                <a href="#" className="text-gray-700 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium">الدعم</a>
                <a href="#" className="text-gray-700 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium">تتبع شحنة</a>
                <a href="#" className="text-red-800 font-bold px-3 py-2 rounded-md text-sm">شحناتي</a>
              </div>
            </nav>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button className="p-1 rounded-full text-gray-400 hover:text-red-800 focus:outline-none">
                <BellIcon className="h-6 w-6" />
              </button>
              <div className="ml-3 relative">
                <button className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none">
                  <UserIcon className="h-8 w-8 rounded-full text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          <div className="-ml-2 flex md:hidden">
            <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-red-800 focus:outline-none">
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
