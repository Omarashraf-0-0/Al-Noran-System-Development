import React, { useState } from 'react';
import { Search, MessageCircle, Plane, Ship, FileText, MapPin, Phone, Facebook, Twitter, Instagram, Globe, Menu, X, User, Bell } from 'lucide-react';

import Footer from '../components/Footer';
import Header from '../components/Header';
// Tracking Hero Component
const TrackingHero = ({ onSearch }) => {
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      onSearch(trackingNumber);
    }
  };

  return (
    <div 
      className="relative h-[450px] flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'linear-gradient(to right, rgba(13, 110, 113, 0.7), rgba(30, 58, 138, 0.7)), url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920")' }}
    >
      <div className="relative z-10 w-full max-w-3xl px-4" dir="rtl">
        <div className="bg-gradient-to-br from-red-900/90 to-red-800/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-white text-3xl md:text-4xl font-bold text-center mb-8">
            تتبع شحنتي
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="ادخل رقم الشحنة"
                className="w-full px-6 py-4 pr-12 rounded-full text-right text-gray-700 text-lg focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              />
              <button type="submit" className="absolute left-2 top-1/2 -translate-y-1/2 bg-red-700 text-white p-3 rounded-full hover:bg-red-800 transition-colors">
                <Search size={20} />
              </button>
            </div>

            <button type="submit" className="w-full max-w-xs mx-auto block bg-white text-red-900 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
              تتبع
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Quick Actions Component
const QuickActions = () => {
  const actions = [
    { id: 1, title: 'تواصل معنا', icon: MessageCircle, bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600', link: '/contact' },
    { id: 2, title: 'ادراج شهادة جوية', icon: Plane, bgColor: 'bg-red-100', iconColor: 'text-red-800', link: '/air-certificate' },
    { id: 3, title: 'ادراج شهادة بحرية', icon: Ship, bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600', link: '/sea-certificate' },
    { id: 4, title: 'طلب رقم ACID', icon: FileText, bgColor: 'bg-red-100', iconColor: 'text-red-800', link: '/acidrequest' }
  ];

  return (
    <div className="container mx-auto px-4 -mt-16 relative z-20" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <a key={action.id} href={action.link} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 p-6 flex items-center space-x-reverse space-x-4 group">
              <div className={`${action.bgColor} p-4 rounded-full group-hover:scale-110 transition-transform`}>
                <Icon className={`${action.iconColor} w-6 h-6`} />
              </div>
              <span className="text-gray-800 font-semibold text-lg">{action.title}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

// Current Shipments Component
const CurrentShipments = () => {
  const shipments = [
    { id: 1, name: 'اسم الشحنة', date: 'تاريخ الجمعة 29 اكتوبر', trackingNumber: 'AIR-0005', billNumber: 'رقم البوليصة' },
    { id: 2, name: 'اسم الشحنة', date: 'تاريخ الجمعة 29 اكتوبر', trackingNumber: 'AIR-0005', billNumber: 'رقم البوليصة' },
    { id: 3, name: 'اسم الشحنة', date: 'تاريخ الجمعة 29 اكتوبر', trackingNumber: 'AIR-0005', billNumber: 'رقم البوليصة' }
  ];

  return (
    <div className="container mx-auto px-4 py-16" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">الشحنات الحالية</h2>
        <a href="/client-shipments" className="text-teal-600 hover:text-teal-700 font-semibold flex items-center space-x-reverse space-x-2 group">
          <span>رؤية الكل</span>
          <span className="group-hover:translate-x-1 transition-transform">←</span>
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">اسم الشحنة</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">رقم البوليصة</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">في انتظار رقم ACID</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment, index) => (
                <tr key={shipment.id} className={`border-b hover:bg-gray-50 transition-colors ${index === shipments.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 mb-1">{shipment.name}</span>
                      <span className="text-sm text-gray-500">{shipment.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-gray-700">{shipment.billNumber}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-gray-800 font-semibold">{shipment.trackingNumber}</span>
                      <button className="bg-cyan-100 hover:bg-cyan-200 text-cyan-700 px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-reverse space-x-2 transition-colors">
                        <FileText size={16} />
                        <span>في انتظار رقم ACID</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main Tracking Page
const TrackingPage = () => {
  const handleSearch = (trackingNumber) => {
    console.log('Searching for:', trackingNumber);
    // Add your search logic here
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <TrackingHero onSearch={handleSearch} />
        <QuickActions />
        <CurrentShipments />
      </main>
      <Footer />
    </div>
  );
};

export default TrackingPage;