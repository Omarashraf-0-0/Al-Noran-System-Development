import React, { useState } from "react";
import userPic from "../assets/images/AVATAR.png"; 
import DropDown from "../assets/images/arrow_drop_down.png"; 
import Prod from "../assets/images/productivity.png"; 
import close from "../assets/images/close(1).png";

export default function AddEmployeePopUp({ onClose }) {

  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const permissionsList = [
    "صلاحية إصدار فواتير بدون مراجعة",
    "صلاحية تعديل بيانات العملاء",
    "صلاحيه أرشفه الشهادات أو حذفها",
    "صلاحيه الوصول إلى تقارير الإيرادات",
  ];

  // Add permission
  const handleAddPermission = (e) => {
    const value = e.target.value;
    if (value && !selectedPermissions.includes(value)) {
      setSelectedPermissions([...selectedPermissions, value]);
    }
  };

  // Remove permission
  const removePermission = (permission) => {
    setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-5xl p-10 relative">

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 left-4">
          <img src={close} alt="close icon" className="w-6 h-6 cursor-pointer"/>
        </button>

        <div className="flex gap-10">
          
          {/* ---------------- RIGHT EMPLOYEE CARD ---------------- */}
          <div className="w-[320px] flex flex-col items-center text-center">
            <div className="w-52 h-52 bg-[#FFFFFF] rounded-full flex justify-center items-center overflow-hidden">
              <img 
                src={userPic} 
                alt="employee" 
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="mt-6 text-xl font-semibold">اسم الموظف</h3>
            <p className="text-gray-500">الكود</p>
          </div>

          {/* ---------------- LEFT FORM SECTION ---------------- */}
          <div className="flex-1">

            {/* Row 1 */}
            <div className="flex gap-5 mb-6">
              <input 
                type="text" 
                placeholder="اسم الموظف"
                className="w-1/2 bg-white border rounded-2xl py-3 px-4 text-right shadow-xl
                focus:border-[#690000] focus:outline-none focus:ring-0"
              />
              
              <input 
                type="text" 
                placeholder="المسمى الوظيفي"
                className="w-1/2 bg-white border rounded-2xl py-3 px-4 text-right shadow-xl
                focus:border-[#690000] focus:outline-none focus:ring-0"
              />
            </div>

            {/* Row 2 */}
            <div className="flex gap-5 mb-6">
              <input 
                type="email" 
                placeholder="البريد الإلكتروني"
                className="w-1/2 bg-white border rounded-2xl py-3 px-4 text-right shadow-xl
                focus:border-[#690000] focus:outline-none focus:ring-0"
              />
              
              <input 
                type="password" 
                placeholder="كلمة المرور"
                className="w-1/2 bg-white border rounded-2xl py-3 px-4 text-right shadow-xl
                focus:border-[#690000] focus:outline-none focus:ring-0"
              />
            </div>

            {/* Dropdown */}
            <div className="relative mb-4">
              <select
                onChange={handleAddPermission}
                className="w-full bg-white border rounded-2xl py-3 px-4 text-right shadow-xl appearance-none
                focus:border-[#690000] focus:outline-none focus:ring-0"
              >
                <option value="">اختر صلاحية</option>
                {permissionsList.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>

              {/* Dropdown icon */}
              <img
                src={DropDown}
                alt="dropdown"
                className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>

            {/* Selected permissions as tags */}
            <div className="flex flex-wrap gap-4 mb-6">
              {selectedPermissions.map((perm, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-red-200 text-red-900 px-4 py-2 rounded-xl"
                >
                  <span>{perm}</span>
                  <button onClick={() => removePermission(perm)}>
                    <img src={close} className="w-4 h-4 cursor-pointer" />
                  </button>
                </div>
              ))}
            </div>

            {/* Confirm Button */}
            <div className="flex justify-between items-center mt-8">
              <button className="bg-[#1BA3B6] text-white px-8 py-2 rounded-lg flex items-center gap-2">
                تأكيد
                <img src={Prod} alt="confirm icon" className="w-5 h-5 object-contain"/>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
