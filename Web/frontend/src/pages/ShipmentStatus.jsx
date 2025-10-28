import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ShipmentStatus = () => {
  const { shipmentId } = useParams();
  
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [shipment, setShipment] = useState(null);
  const [fileItems, setFileItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchShipmentData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!shipmentId) {
          setError("معرف الشحنة غير موجود");
          toast.error("معرف الشحنة غير موجود");
          return;
        }

        console.log("Fetching shipment with acid:", shipmentId);

        // Fetch shipment details
        const shipmentResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/shipments/${shipmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Fetched shipment:", shipmentResponse.data);
        setShipment(shipmentResponse.data);

        // Fetch shipment files/uploads
        try {
          const filesResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/uploads?category=shipment`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log("Fetched files:", filesResponse.data);

          // Filter files for this shipment and format them
          const shipmentFiles = (filesResponse.data || [])
            .filter(file => file.shipmentId === shipmentResponse.data._id)
            .map((file) => ({
              name: file.fileName || file.originalName || "ملف",
              date: new Date(file.createdAt).toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              url: file.presignedUrl || file.url,
              id: file._id,
            }));

          setFileItems(shipmentFiles);

          if (shipmentFiles.length === 0) {
            console.log("No files found for this shipment");
          }
        } catch (fileError) {
          console.log("Note: Could not fetch files:", fileError.message);
          setFileItems([]);
        }

      } catch (error) {
        console.error("Error fetching shipment data:", error);
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            "فشل تحميل بيانات الشحنة";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchShipmentData();
  }, [shipmentId, token]);
    
  return (
    // Full page wrapper
    <div className="bg-gray-50 min-h-screen text-gray-800">
      
      {/*  Header Section */}
      <Header />

      {/*  Main content area */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Centered content card */}
        <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm">
          
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12 gap-4">
              <div className="spinner border-4 border-gray-300 border-t-red-800 rounded-full w-12 h-12 animate-spin"></div>
              <span className="text-gray-600 text-lg">جاري تحميل بيانات الشحنة...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-right">
              <p className="text-red-800 font-medium">❌ حدث خطأ: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-800 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                إعادة محاولة
              </button>
            </div>
          ) : shipment ? (
            <>
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

              {/*  Input fields section - Display real shipment data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-12 mb-12">
                <Datafield 
                  label="اسم العميل" 
                  value={shipment.importerName || shipment.employerName || "غير محدد"}
                  icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} 
                />
                <Datafield 
                  label="رقم الـ ACID" 
                  value={shipment.acid || "غير محدد"}
                  icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} 
                />
                <Datafield 
                  label="الحالة" 
                  value={shipment.status || "قيد الانتظار"}
                  icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} 
                />
                <Datafield 
                  label="وصف الشحنة" 
                  value={shipment.shipmentDescription || "غير محدد"}
                  icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} 
                />
                <Datafield 
                  label="البلد" 
                  value={shipment.country || "غير محدد"}
                  icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} 
                />
                <Datafield 
                  label="رقم البوليصة" 
                  value={shipment.number46 || "غير محدد"}
                  icon={<img src={contractIcon} alt="icon" className="w-5 h-5"  />} 
                />
              </div>

              {/*  Shipment files section */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-center text-red-900 mb-8">ملفات الشحنة</h2>
                {fileItems.length === 0 ? (
                  <p className="text-center text-gray-500">لا توجد ملفات متاحة</p>
                ) : (
                  <div className="space-y-4">
                    {fileItems.map((item, index) => (
                      <FileRow key={index} name={item.name} date={item.date} />
                    ))}
                  </div>
                )}
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
            </>
          ) : null}
        </div>
      </main>

      {/* Upload Modal (opens when upload button is clicked) */}
      <UploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} />

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default ShipmentStatus;
