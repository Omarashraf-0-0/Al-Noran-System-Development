
import React, { useState } from 'react';
import { FilterIcon, SortIcon, SearchIcon, CopyIcon } from './icons';

const mockShipments = [
  { id: '1', customerName: 'اسم العميل', policyNumber: 'KW-0201', status: 'جاري التوصيل', detailsLink: 'عرض كل التفاصيل', agentName: 'فيديكس' },
  { id: '2', customerName: 'اسم العميل', policyNumber: 'KW-0202', status: 'جاري التوصيل', detailsLink: 'عرض كل التفاصيل', agentName: 'فيديكس' },
  { id: '3', customerName: 'اسم العميل', policyNumber: 'KW-0203', status: 'جاري التوصيل', detailsLink: 'عرض كل التفاصيل', agentName: 'فيديكس' },
  { id: '4', customerName: 'اسم العميل', policyNumber: 'KW-0204', status: 'جاري التوصيل', detailsLink: 'عرض كل التفاصيل', agentName: 'فيديكس' },
  { id: '5', customerName: 'اسم العميل', policyNumber: 'KW-0205', status: 'جاري التوصيل', detailsLink: 'عرض كل التفاصيل', agentName: 'فيديكس' },
  { id: '6', customerName: 'اسم العميل', policyNumber: 'KW-0206', status: 'جاري التوصيل', detailsLink: 'عرض كل التفاصيل', agentName: 'فيديكس' },
];

const ShipmentRow = ({ shipment }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center bg-white p-4 rounded-lg shadow-sm mb-3">
            <div className="text-sm">
                <p className="text-gray-500">اسم العميل</p>
                <p className="font-semibold text-gray-800">{shipment.customerName}</p>
            </div>
            <div className="text-sm">
                <p className="text-gray-500">رقم البوليصة</p>
                <p className="font-semibold text-gray-800">{shipment.policyNumber}</p>
            </div>
            <div className="text-sm">
                <p className="text-gray-500">مندوب الشحن</p>
                <div className="flex items-center">
                    <span className="font-semibold text-gray-800">{shipment.agentName}</span>
                    <button className="mr-2 text-gray-400 hover:text-gray-600"><CopyIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="text-sm col-span-2 md:col-span-1">
                <p className="text-gray-500 mb-1">الحالة</p>
                <span className="bg-cyan-100 text-cyan-800 text-xs font-medium px-3 py-1.5 rounded-full">{shipment.status}</span>
            </div>
            <div className="text-sm text-left col-span-2 md:col-span-1">
                <a href="#" className="text-red-700 hover:text-red-900 font-semibold">{shipment.detailsLink}</a>
            </div>
        </div>
    );
};

function ShipmentsSection() {
    const [shipments] = useState(mockShipments);
    return (
        <section>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-red-800 mb-4 md:mb-0">شحناتي</h2>
                <div className="flex items-center w-full md:w-auto">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="ابحث هنا..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-200" />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center mr-4">
                        <button className="p-2 text-red-800 hover:bg-red-100 rounded-full">
                            <SortIcon className="w-6 h-6" />
                        </button>
                        <button className="p-2 text-red-800 hover:bg-red-100 rounded-full">
                            <FilterIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            <div>
                {shipments.map((shipment) => (
                    <ShipmentRow key={shipment.id} shipment={shipment} />
                ))}
            </div>
        </section>
    );
}

export default ShipmentsSection;
