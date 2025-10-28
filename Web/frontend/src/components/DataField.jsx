import React from 'react';

const DataField = ({ label, value, icon }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="w-full h-12 ps-4 pe-10 py-2 bg-gray-100 rounded-lg shadow-[10px_10px_8px_#0000000A] flex items-center justify-start">
          <span className="text-gray-500">{value}</span>
        </div>
        <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-gray-500">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DataField;
