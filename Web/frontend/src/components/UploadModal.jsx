import React, { useState, useCallback, useEffect } from 'react';
import backupIcon from '../assets/images/backup.png'; 
import closeIcon from "../assets/images/close.png";


// UploadModal component handles uploading files via drag & drop or manual selection
const UploadModal = ({ isOpen, onClose }) => {
  // ------------------ STATE ------------------
  const [files, setFiles] = useState([]); // Stores selected files
  const [isDragging, setIsDragging] = useState(false); // Tracks drag state

  // ------------------ FILE SELECTION ------------------
  const handleFileChange = (event) => {
    if (event.target.files) {
      setFiles(prev => [...prev, ...Array.from(event.target.files)]);
    }
  };

  // ------------------ DRAG & DROP HANDLERS ------------------
  const onDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer?.files?.length > 0) {
      setFiles(prev => [...prev, ...Array.from(event.dataTransfer.files)]);
      event.dataTransfer.clearData();
    }
  }, []);

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  // ------------------ FILE MANAGEMENT ------------------
  const removeFile = (fileName) => {
    setFiles(files.filter(file => file.name !== fileName));
  };

  // ------------------ UPLOAD HANDLER ------------------
  const handleUpload = () => {
    console.log('Uploading files:', files);
    setFiles([]);
    onClose();
  };

  // ------------------ KEYBOARD SHORTCUTS ------------------
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ------------------ MODAL UI ------------------
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      {/* Modal container */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8 relative"
        onClick={e => e.stopPropagation()}
      >

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full p-1"
          aria-label="إغلاق"
        >
          <img src={closeIcon} alt="close" className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 id="upload-modal-title" className="text-2xl font-bold text-center text-red-900 mb-6">
          رفع المستندات
        </h2>

        {/* File drop area */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-10 text-center cursor-pointer hover:border-red-700 transition-colors ${
            isDragging ? 'border-red-700 bg-red-50' : ''
          }`}
        >
          <input
            type="file"
            multiple
            className="hidden"
            id="file-upload"
            onChange={handleFileChange}
          />

          <label htmlFor="file-upload" className="cursor-pointer w-full flex flex-col items-center">
            <img src={backupIcon} alt="upload" className="w-12 h-12 mb-4 opacity-60" />
            <p className="text-gray-700 font-semibold">اسحب وأفلت الملفات هنا</p>
            <p className="text-sm text-gray-500 my-1">أو</p>
            <p className="font-bold text-red-800 hover:underline">انقر لاختيار الملفات</p>
          </label>
        </div>

        {/* File preview list */}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 text-start mb-2">الملفات المحددة:</h3>
            <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-gray-50">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={backupIcon} alt="file" className="w-5 h-5 opacity-70 flex-shrink-0" />
                    <span className="text-sm text-gray-800 truncate" title={file.name}>{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(file.name)}
                    className="text-red-600 hover:text-red-800 flex-shrink-0 ms-2"
                    aria-label={`إزالة ملف ${file.name}`}
                  >
                    <img src={backupIcon} alt="remove" className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            إلغاء
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0}
            className="px-6 py-2.5 bg-red-900 text-white font-bold rounded-lg hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            رفع
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
