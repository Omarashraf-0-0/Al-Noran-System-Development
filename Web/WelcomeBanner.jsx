
import React from 'react';
import { PackageIcon, TruckIcon, CheckCircleIcon } from './icons';

const StatCard = ({ icon, value, label }) => (
  <div className="bg-white rounded-lg shadow-md p-4 flex-1 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
    <div className="text-red-800">
      {icon}
    </div>
  </div>
);

const WelcomeBanner = () => {
  return (
    <section className="mb-8">
      <h1 className="text-2xl font-bold text-red-800 mb-4">!مرحباً, الأسم</h1>
      <div className="bg-[#6B0F1A] rounded-xl shadow-lg p-6">
        <div className="flex justify-center items-center mb-6">
          <img src="https://i.imgur.com/gA3Q05F.png" alt="Logistics Illustration" className="max-h-48" />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <StatCard icon={<CheckCircleIcon className="w-8 h-8"/>} value="120" label="عدد الشحنات المكتملة" />
          <StatCard icon={<TruckIcon className="w-8 h-8"/>} value="100" label="عدد الشحنات قيد التوصيل" />
          <StatCard icon={<PackageIcon className="w-8 h-8"/>} value="130" label="عدد الشحنات في المخزن" />
        </div>
      </div>
    </section>
  );
};

export default WelcomeBanner;
