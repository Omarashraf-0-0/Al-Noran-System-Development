import React, { useEffect, useState } from "react";
import cancelpreset from "../assets/images/cancel_presentation.png";
import folderCheck from "../assets/images/folder_check.png";
import pdfPic from "../assets/images/picture_as_pdf.png";
import activeNotification from "../assets/images/notifications_active.png";

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Later you replace this with your real API:
        // const res = await fetch("/api/notifications");
        // const data = await res.json();
        // setNotifications(data);

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

  return (
    <div className="w-full px-6 py-10" dir="rtl">
<div className="-full flex flex-row-reverse items-center justify-end gap-3 mb-8 ">
  <h1 className="text-4xl font-bold text-[#6B0F1A]">التنبيهات</h1>

  <img
    src={activeNotification}
    alt="bell"
    className="w-8 h-8 object-contain"
  />
</div>


      <div className="space-y-8">
        {notifications.map((item) => (
          <div key={item.id} className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {item.title}
            </h2>

            {item.category && (
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <img
                  src={item.icon}
                  alt="category icon"
                  className="w-4 h-4 object-contain"
                />
                {item.category}
              </p>
            )}

            <p className="text-gray-400 text-sm mt-1">{item.date}</p>

            {item.actions && (
              <div className="flex gap-4 mt-4">
                <button className="flex items-center gap-2 bg-[#6B0F1A] text-white px-4 py-2 rounded-md">
                  <img
                    src={folderCheck}
                    alt="approve icon"
                    className="w-4 h-4"
                  />
                  اعتماد
                </button>

                <button className="flex items-center gap-2 border border-[#6B0F1A] text-[#6B0F1A] px-4 py-2 rounded-md">
                  <img
                    src={cancelpreset}
                    alt="reject icon"
                    className="w-4 h-4"
                  />
                  رفض
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
