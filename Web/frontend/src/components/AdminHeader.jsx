import React, { useState, useEffect, useRef } from 'react';
import account_circle from '../assets/images/account_circle.png';
import notifications_unread from '../assets/images/notifications_unread.png';
import coloredLogo from '../assets/images/coloredLogo.png';
import dehaze from '../assets/images/dehaze.png';
import cancelpreset from '../assets/images/cancel_presentation.png';
import folderCheck from '../assets/images/folder_check.png';
import pdfPic from '../assets/images/picture_as_pdf.png';

const Header = () => {
  const primaryColor = '#690000';
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // TODO: Replace with real API call
        setNotifications([
          {
            id: 1,
            title: "تم رفع مستند من العميل : ياسمين",
            category: "فاتورة مبدائية",
            date: "تاريخ الجمعة 29 أكتوبر",
            actions: true,
            icon: pdfPic,
          },
          {
            id: 2,
            title: "الموظف : اسم أعتمد مستند لشحنة رقم : AIR-005",
            category: "فاتورة مبدائية",
            date: "تاريخ الجمعة 29 أكتوبر",
            actions: false,
            icon: pdfPic,
          },
          {
            id: 3,
            title: "تم تسجيل عميل جديد اسمه نوع العميل",
            category: "",
            date: "تاريخ الجمعة 29 أكتوبر",
            actions: false,
            icon: pdfPic,
          },
        ]);
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    };

    loadNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); 

  return (
    <header className="bg-white shadow-sm">
      <div className="w-full px-6">
      
        <div className="flex items-center justify-between h-16 w-full">
          
          <div className="flex items-center gap-6">
            <button className="p-1 rounded-md hover:opacity-80 focus:outline-none">
              <img
                src={dehaze}
                alt="Menu"
                className="h-7 w-7 object-contain"
              />
            </button>
            <img 
              src={coloredLogo} 
              alt="Logo" 
              className="h-8 w-auto object-contain" 
            />

            <nav className="hidden md:flex items-center">
              <div className="flex items-baseline space-x-4 space-x-reverse">
                <a
                  href="#"
                  className="text-red-800 font-bold px-3 py-2 rounded-md text-sm"
                >
                  لوحة التحكم
                </a>
                <a
                  href="#"
                  className="text-red-800 font-bold px-3 py-2 rounded-md text-sm"
                >
                  إدارة الموظفين
                </a>
                <a
                  href="#"
                  className="text-red-800 font-bold px-3 py-2 rounded-md text-sm"
                >
                  إدارة العملاء
                </a>
                 <a
                  href="#"
                  className="text-red-800 font-bold px-3 py-2 rounded-md text-sm"
                >
                  الماليات
                </a>

              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1 rounded-full hover:opacity-80 focus:outline-none relative"
              >
                <img
                  src={notifications_unread}
                  alt="Notifications"
                  className="h-8 w-8 object-contain"
                />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50" dir="rtl">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 text-right">
                      التنبيهات
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <p>لا توجد تنبيهات جديدة</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div key={item.id} className="p-4 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-800 mb-2 text-right">
                            {item.title}
                          </h3>

                          {item.category && (
                            <p className="text-gray-500 text-xs flex items-center gap-2 justify-end">
                              <span>{item.category}</span>
                              <img
                                src={item.icon}
                                alt="category icon"
                                className="w-4 h-4 object-contain"
                              />
                            </p>
                          )}

                          <p className="text-gray-400 text-xs mt-1 text-right">{item.date}</p>

                          {item.actions && (
                            <div className="flex gap-2 mt-3 justify-end">
                              <button className="flex items-center gap-1 bg-[#6B0F1A] text-white px-3 py-1.5 rounded-md text-xs">
                                <img
                                  src={folderCheck}
                                  alt="approve icon"
                                  className="w-3 h-3"
                                />
                                <span>اعتماد</span>
                              </button>

                              <button className="flex items-center gap-1 border border-[#6B0F1A] text-[#6B0F1A] px-3 py-1.5 rounded-md text-xs">
                                <img
                                  src={cancelpreset}
                                  alt="reject icon"
                                  className="w-3 h-3"
                                />
                                <span>رفض</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
