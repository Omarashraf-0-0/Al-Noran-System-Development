import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';         
import Stepper from '../components/Stepper';       
import FileRow from '../components/FileRow';       
import UploadModal from '../components/UploadModal'; 
import Footer from '../components/Footer';
import NotificationBell from '../components/NotificationBell';
import supportAgent from '../assets/images/support_agent.png';
import documentText from '../assets/images/document-text.png';
import mainIllustration from '../assets/images/Untitled design (7) 1.png';
import contractIcon from '../assets/images/contract.png';
import Datafield from '../components/DataField';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Helper function to add notifications
const addNotification = (shipmentId, notification) => {
  const stored = localStorage.getItem(`notifications_${shipmentId}`);
  const notifications = stored ? JSON.parse(stored) : [];
  
  const newNotif = {
    id: Date.now(),
    ...notification,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  notifications.unshift(newNotif);
  localStorage.setItem(`notifications_${shipmentId}`, JSON.stringify(notifications));
  
  // Show toast
  toast(notification.message, { icon: notification.icon || '📢', duration: 5000 });
};

const ShipmentStatus = () => {
  const { shipmentId } = useParams();
  
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [shipment, setShipment] = useState(null);
  const [fileItems, setFileItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [showRequiredDocsModal, setShowRequiredDocsModal] = useState(false);

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

        // Fetch required documents
        try {
          const requiredDocsResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipmentResponse.data._id}/required-documents`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          const docs = requiredDocsResponse.data?.data?.requiredDocuments || [];
          setRequiredDocuments(docs);
          
          // Show modal if there are pending required documents
          const pendingDocs = docs.filter(doc => !doc.uploaded);
          if (pendingDocs.length > 0) {
            toast('لديك مستندات مطلوبة يجب رفعها', { icon: '📄', duration: 5000 });
          }
        } catch (reqDocsError) {
          console.log("Note: Could not fetch required documents:", reqDocsError.message);
          setRequiredDocuments([]);
        }

        // Fetch shipment files/uploads
        try {
          const filesResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/uploads?category=shipment&relatedId=${shipmentResponse.data._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log("Fetched files:", filesResponse.data);

          // API returns { success, count, uploads: [...] }
          const uploads = filesResponse.data?.uploads || filesResponse.data || [];
          
          const shipmentFiles = uploads.map((file) => ({
            name: file.filename || file.originalname || "ملف",
            date: new Date(file.uploadedAt || file.createdAt).toLocaleDateString("ar-EG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            url: file.presignedUrl || file.url,
            id: file._id,
            documentType: file.documentType,
            description: file.description,
          }));

          console.log("Formatted shipment files:", shipmentFiles);
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

    // Poll for updates every 30 seconds
    const pollInterval = setInterval(() => {
      fetchShipmentData();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [shipmentId, token]);

  // Watch for status changes
  useEffect(() => {
    if (shipment && shipment.status) {
      const lastStatus = localStorage.getItem(`lastStatus_${shipmentId}`);
      
      if (lastStatus && lastStatus !== shipment.status) {
        // Status changed!
        addNotification(shipmentId, {
          icon: '🚚',
          title: 'تحديث حالة الشحنة',
          message: `تم تغيير حالة شحنتك إلى: ${shipment.status}`,
        });
      }
      
      localStorage.setItem(`lastStatus_${shipmentId}`, shipment.status);
    }
  }, [shipment?.status, shipmentId]);

  // Watch for new required documents
  useEffect(() => {
    if (requiredDocuments.length > 0) {
      const lastCount = parseInt(localStorage.getItem(`lastReqDocsCount_${shipmentId}`) || '0');
      
      if (requiredDocuments.length > lastCount) {
        const newDocs = requiredDocuments.slice(0, requiredDocuments.length - lastCount);
        newDocs.forEach(doc => {
          if (!doc.uploaded) {
            addNotification(shipmentId, {
              icon: '📄',
              title: 'مستند جديد مطلوب',
              message: `يرجى رفع: ${doc.name}`,
            });
          }
        });
      }
      
      localStorage.setItem(`lastReqDocsCount_${shipmentId}`, requiredDocuments.length.toString());
    }
  }, [requiredDocuments.length, shipmentId]);
    
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
              {/* Notification Bell */}
              <div className="flex justify-end mb-4">
                <NotificationBell shipmentId={shipment._id} />
              </div>

              {/*  Top illustration */}
              <div className="flex justify-center mb-10">
                <img 
                  src={mainIllustration} 
                  alt="Shipment Illustration" 
                  className="w-full max-w-lg h-auto" 
                />
              </div>

              {/*  Stepper: shipment status progress */}
              <Stepper currentStatus={shipment.status} />

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

              {/* Required Documents Section */}
              {requiredDocuments.length > 0 && (
                <div className="mt-12 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2">
                      <span>📋</span>
                      <span>مستندات مطلوبة</span>
                    </h2>
                    {requiredDocuments.filter(doc => !doc.uploaded).length > 0 && (
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {requiredDocuments.filter(doc => !doc.uploaded).length} قيد الانتظار
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {requiredDocuments.map((doc, index) => {
                      // Debug logging
                      console.log(`Document "${doc.name}":`, {
                        uploaded: doc.uploaded,
                        fileId: doc.fileId,
                        showViewButton: doc.uploaded && doc.fileId
                      });
                      
                      return (
                      <div 
                        key={doc._id || index}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          doc.uploaded 
                            ? 'bg-green-50 border-green-300' 
                            : 'bg-white border-orange-300 hover:border-orange-400'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {doc.uploaded ? (
                            <span className="text-2xl">✅</span>
                          ) : (
                            <span className="text-2xl animate-pulse">⏳</span>
                          )}
                          <div>
                            <p className="font-bold text-gray-800">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              {doc.uploaded 
                                ? `تم الرفع: ${new Date(doc.uploadedAt).toLocaleDateString('ar-EG')}`
                                : `مطلوب منذ: ${new Date(doc.requestedAt).toLocaleDateString('ar-EG')}`
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {doc.uploaded && doc.fileId ? (
                            <button
                              onClick={async () => {
                                try {
                                  toast.loading('جاري تحميل الملف...');
                                  const fileResponse = await axios.get(
                                    `${import.meta.env.VITE_API_URL}/api/uploads/${doc.fileId}`,
                                    {
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                    }
                                  );
                                  toast.dismiss();
                                  const fileUrl = fileResponse.data?.upload?.presignedUrl || fileResponse.data?.presignedUrl;
                                  if (fileUrl) {
                                    window.open(fileUrl, '_blank');
                                  } else {
                                    toast.error('لم يتم العثور على رابط الملف');
                                  }
                                } catch (error) {
                                  toast.dismiss();
                                  toast.error('فشل تحميل الملف');
                                  console.error('File fetch error:', error);
                                }
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-1"
                            >
                              <span>عرض</span>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setShowRequiredDocsModal(true);
                              }}
                              className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition"
                            >
                              رفع الآن
                            </button>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>

                  {requiredDocuments.filter(doc => !doc.uploaded).length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <p className="text-sm text-yellow-800 text-center">
                        ⚠️ يرجى رفع المستندات المطلوبة لتجنب أي تأخير في معالجة شحنتك
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/*  Shipment files section */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-center text-red-900 mb-8">📁 ملفات الشحنة</h2>
                {fileItems.length === 0 ? (
                  <p className="text-center text-gray-500">لا توجد ملفات متاحة</p>
                ) : (
                  <div className="space-y-4">
                    {fileItems.map((item, index) => (
                      <FileRow 
                        key={index} 
                        name={item.name} 
                        date={item.date} 
                        documentType={item.documentType}
                        description={item.description}
                      />
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

      {/* Required Documents Upload Modal */}
      {showRequiredDocsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📤 رفع المستندات المطلوبة</h3>
              <button
                onClick={() => setShowRequiredDocsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {requiredDocuments.filter(doc => !doc.uploaded).map((doc, index) => (
                <div key={doc._id || index} className="border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-800">{doc.name}</h4>
                    <span className="text-xs text-gray-500">
                      مطلوب منذ {new Date(doc.requestedAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id={`file-${doc._id}`}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        try {
                          toast.loading('جاري رفع المستند...');
                          
                          // Step 1: Upload file to S3
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('category', 'shipment');
                          formData.append('relatedId', shipment._id);
                          formData.append('documentType', 'other'); // Use 'other' as document type
                          formData.append('description', `Required document: ${doc.name}`);

                          const uploadResponse = await axios.post(
                            `${import.meta.env.VITE_API_URL}/api/uploads`,
                            formData,
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data',
                              },
                            }
                          );

                          const uploadedFileId = uploadResponse.data?.upload?._id || uploadResponse.data?._id;

                          // Step 2: Mark document as uploaded in shipment
                          await axios.patch(
                            `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipment._id}/required-documents/${doc._id}`,
                            { fileId: uploadedFileId },
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );

                          toast.dismiss();
                          toast.success('تم رفع المستند بنجاح');
                          
                          // Refresh required documents from backend to get updated data
                          const updatedReqDocsResponse = await axios.get(
                            `${import.meta.env.VITE_API_URL}/api/shipments/id/${shipment._id}/required-documents`,
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );
                          
                          const updatedDocs = updatedReqDocsResponse.data?.data?.requiredDocuments || [];
                          setRequiredDocuments(updatedDocs);
                          console.log('Updated required documents:', updatedDocs);

                          // Refresh files list
                          const filesResponse = await axios.get(
                            `${import.meta.env.VITE_API_URL}/api/uploads?category=shipment&relatedId=${shipment._id}`,
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );

                          const uploads = filesResponse.data?.uploads || filesResponse.data || [];
                          const shipmentFiles = uploads.map((file) => ({
                            name: file.filename || file.originalname || "ملف",
                            date: new Date(file.uploadedAt || file.createdAt).toLocaleDateString("ar-EG", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }),
                            url: file.presignedUrl || file.url,
                            id: file._id,
                            documentType: file.documentType,
                            description: file.description,
                          }));

                          setFileItems(shipmentFiles);
                          
                          // Close the modal after successful upload
                          setShowRequiredDocsModal(false);

                        } catch (error) {
                          toast.dismiss();
                          toast.error('فشل رفع المستند: ' + (error.response?.data?.message || error.message));
                          console.error('Upload error:', error);
                        }
                      }}
                    />
                    <label
                      htmlFor={`file-${doc._id}`}
                      className="flex-1 cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition text-center"
                    >
                      اختر ملف
                    </label>
                  </div>
                </div>
              ))}

              {requiredDocuments.filter(doc => !doc.uploaded).length === 0 && (
                <div className="text-center py-8">
                  <span className="text-6xl">✅</span>
                  <p className="text-gray-600 mt-4">تم رفع جميع المستندات المطلوبة</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRequiredDocsModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default ShipmentStatus;
