import React from 'react';

const FileRow = ({ name, date }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-4 p-4 border-b border-gray-200 last:border-b-0">
      <div className="col-span-2 md:col-span-1">
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
      <div className="text-gray-600 text-center hidden md:block">فاتورة مبدئية</div>
      <div className="text-gray-600 text-center hidden md:block">راجع الملف</div>
      <div className="text-cyan-600 font-semibold hover:underline text-start cursor-pointer">تحميل الملف</div>
    </div>
  );
};

export default FileRow;