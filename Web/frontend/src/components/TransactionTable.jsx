import React from 'react';
import SearchIconImg from '../assets/images/Search.svg'; // <-- make sure this file exists

const mockTransactions = [
  { id: '1', clientName: 'اسم العميل', policyCode: 'AIR-0005', policyNumber: 'رقم البوليصة', lastTransaction: 'اخر معاملة' },
  { id: '2', clientName: 'اسم العميل', policyCode: 'AIR-0005', policyNumber: 'رقم البوليصة', lastTransaction: 'اخر معاملة' },
  { id: '3', clientName: 'اسم العميل', policyCode: 'AIR-0005', policyNumber: 'AIR-0005', lastTransaction: 'اخر معاملة' },
  { id: '4', clientName: 'اسم العميل', policyCode: 'AIR-0005', policyNumber: 'AIR-0005', lastTransaction: 'اخر معاملة' },
  { id: '5', clientName: 'اسم العميل', policyCode: 'AIR-0005', policyNumber: 'AIR-0005', lastTransaction: 'اخر معاملة' },
];

const TransactionTable = () => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-[#942a38] mb-6">سجل المعاملات</h2>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="البحث باسم العميل"
          className="w-full bg-gray-100 border-gray-200 text-gray-700 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {SearchIconImg ? (
            <img src={SearchIconImg} alt="Search" className="h-5 w-5 text-gray-400" />
          ) : (
            <span className="h-5 w-5 text-gray-400">🔍</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right text-gray-500">
          <tbody>
            {mockTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {transaction.clientName}
                </td>
                <td className="px-6 py-4">{transaction.policyCode}</td>
                <td className="px-6 py-4">{transaction.policyNumber}</td>
                <td className="px-6 py-4">{transaction.lastTransaction}</td>
                <td className="px-6 py-4">
                  <a href="#" className="font-medium text-teal-600 hover:underline">
                    عرض كل التفاصيل
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
