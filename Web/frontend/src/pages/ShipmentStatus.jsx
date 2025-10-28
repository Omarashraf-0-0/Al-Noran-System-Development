import React, { useState } from 'react';
import Header from '../components/Header';         
import Stepper from '../components/Stepper';       
import FileRow from '../components/FileRow';       
import UploadModal from '../components/UploadModal'; 
import Footer from '../components/Footer';
import supportAgent from '../assets/images/support_agent.png';
import documentText from '../assets/images/document-text.png';
import mainIllustration from '../assets/images/Untitled design (7) 1.png';
import contractIcon from '../assets/images/contract.png';
import Datafield from '../components/DataField';

const App = () => {
  // State for controlling the upload modal visibility
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);

  // Example file list
  const fileItems = [
    { name: 'اسم الملف', date: 'تاريخ الجمعة 29 أكتوبر' },
    { name: 'اسم الملف', date: 'تاريخ الجمعة 25 أكتوبر' },
    { name: 'اسم الملف', date: 'تاريخ الجمعة 14 أكتوبر' },
  ];

  return (
    // Full page wrapper
    <div className="bg-gray-50 min-h-screen text-gray-800">
      
      {/*  Header Section */}
      <Header />

      {/*  Main content area */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Centered content card */}
        <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm">
          
          {/*  Top illustration */}
          <div className="flex justify-center mb-10">
             <img 
              src={mainIllustration} 
              alt="Shipment Illustration" 
              className="w-full max-w-lg h-auto" 
            />
          </div>

          {/*  Stepper: shipment status progress */}
          <Stepper />

          {/*  Input fields section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-12 mb-12">
            <Datafield label="اسم العميل" placeholder="اسم العميل" icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} />
            <Datafield label="رقم الـ ACID" placeholder="رقم الـ ACID" icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} />
            <Datafield label="الرقم الضريبى" placeholder="الرقم الضريبى" icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} />
            <Datafield label="وصف الشحنة" placeholder="وصف الشاحنة" icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} />
            <Datafield label="بند جمركى" placeholder="بند جمركى" icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} />
            <Datafield label="اسم المورد" placeholder="اسم المورد" icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} />
          </div>

          {/*  Shipment files section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center text-red-900 mb-8">ملفات الشحنة</h2>
            <div className="space-y-4">
              {fileItems.map((item, index) => (
                <FileRow key={index} name={item.name} date={item.date} />
              ))}
            </div>
          </div>
          
          {/*  Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
            {/* Contact employee button */}
            <button 
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-900 text-white font-bold rounded-lg shadow-md hover:bg-red-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700">
              <img src={supportAgent} alt="Support Agent" className="w-6 h-6" />
              <span>تواصل مع الموظف</span>
            </button>

            {/* Upload documents button */}
            <button 
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-900 text-white font-bold rounded-lg shadow-md hover:bg-red-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700">
              <img src={documentText} alt="Upload Document" className="w-6 h-6" />
              <span>رفع مستندات أخرى</span>
            </button>
          </div>
        </div>
      </main>

      {/* Upload Modal (opens when upload button is clicked) */}
      <UploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} />

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default App;
