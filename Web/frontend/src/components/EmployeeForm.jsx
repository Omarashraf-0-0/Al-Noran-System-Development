import React, { useState } from 'react';

// Import local images
import EmployeeAvatarImg from '../assets/images/AVATAR.png';
import EditIconImg from '../assets/images/AVATAR.png';
import SaveIconImg from '../assets/images/AVATAR.png';
import TrashIconImg from '../assets/images/AVATAR.png';
import CloseIconImg from '../assets/images/AVATAR.png';

// Icon components
const EditIcon = () => <img src={EditIconImg} alt="Edit" className="h-4 w-4 ml-2" />;
const SaveIcon = () => <img src={SaveIconImg} alt="Save" className="h-4 w-4 ml-2" />;
const TrashIcon = () => <img src={TrashIconImg} alt="Trash" className="h-5 w-5 ml-2" />;
const CloseIcon = () => <img src={CloseIconImg} alt="Close" className="h-4 w-4" />;

// Permissions and statuses
const availablePermissions = [
  'متابعة تسجيل ملفات العملاء',
  'متابعة اصدار الوثائق ذات العلاقة',
  'صلاحية مدير',
  'صلاحية مشرف'
];
const statuses = ['نشط', 'معلق'];

// Display field component
const FormDisplayField = ({ value }) => (
  <div className="w-full bg-gray-100 text-gray-700 p-3 rounded-lg shadow-sm min-h-[46px] flex items-center">
    {value}
  </div>
);

const EmployeeForm = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [employeeData, setEmployeeData] = useState({
    name: 'عبدالله محمد',
    code: 'EMP-007',
    email: 'abdullah.m@example.com',
    status: 'نشط',
  });

  const [selectedPermissions, setSelectedPermissions] = useState([
    'متابعة تسجيل ملفات العملاء',
    'متابعة اصدار الوثائق ذات العلاقة',
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmployeeData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleEdit = () => {
    setIsEditing(prev => !prev);
  };

  const handleAddPermission = (e) => {
    const permission = e.target.value;
    if (permission && !selectedPermissions.includes(permission)) {
      setSelectedPermissions(prev => [...prev, permission]);
    }
    e.target.value = '';
  };

  const handleRemovePermission = (permissionToRemove) => {
    setSelectedPermissions(prev => prev.filter(p => p !== permissionToRemove));
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);
  const confirmDelete = () => {
    console.log('Employee deleted');
    closeDeleteModal();
  };

  return (
    <>
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* Avatar and name */}
        <div className="flex flex-col items-center space-y-3 mb-6">
          <div className="w-32 h-32 rounded-full bg-teal-100 flex items-center justify-center">
            <img
              className="w-full h-full rounded-full object-cover"
              src={EmployeeAvatarImg}
              alt="Employee Avatar"
            />
          </div>
          <h3 className="font-bold text-lg">{employeeData.name}</h3>
          <p className="text-sm text-gray-500">{employeeData.code}</p>
        </div>

        {/* Form */}
        <div className="w-full">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {isEditing ? (
                <>
                  <input type="text" name="name" value={employeeData.name} onChange={handleInputChange} className="w-full bg-white text-gray-800 p-3 rounded-lg border border-gray-300" />
                  <input type="text" name="code" value={employeeData.code} onChange={handleInputChange} className="w-full bg-white text-gray-800 p-3 rounded-lg border border-gray-300" />
                  <input type="email" name="email" value={employeeData.email} onChange={handleInputChange} className="w-full bg-white text-gray-800 p-3 rounded-lg border border-gray-300" />
                  <select name="status" value={employeeData.status} onChange={handleInputChange} className="w-full bg-white text-gray-800 p-3 rounded-lg border border-gray-300">
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <FormDisplayField value={employeeData.name} />
                  <FormDisplayField value={employeeData.code} />
                  <FormDisplayField value={employeeData.email} />
                  <FormDisplayField value={employeeData.status} />
                </>
              )}
            </div>

            {isEditing && (
              <select
                onChange={handleAddPermission}
                defaultValue=""
                className="w-full bg-gray-50 border-2 border-teal-400 p-3 rounded-lg"
              >
                <option value="" disabled>إضافة صلاحيات للموظف</option>
                {availablePermissions
                  .filter(p => !selectedPermissions.includes(p))
                  .map(permission => (
                    <option key={permission} value={permission}>{permission}</option>
                  ))}
              </select>
            )}
          </div>
          {/* Permissions */}
          <div className="mt-6 space-y-4">
            {selectedPermissions.map(permission => (
              <div key={permission} className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center text-sm shadow-sm">
                <span>{permission}</span>
                {isEditing && (
                  <button onClick={() => handleRemovePermission(permission)} className="text-red-500 hover:text-red-700">
                    <CloseIcon />
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Buttons */}
          <div className="mt-8 flex items-center gap-4">
            <button onClick={handleToggleEdit} className="flex items-center px-6 py-2.5 bg-[#1da1a2] text-white font-bold rounded-lg">
              {isEditing ? <SaveIcon /> : <EditIcon />}
              <span>{isEditing ? 'حفظ' : 'تعديل'}</span>
            </button>

            <button onClick={openDeleteModal} className="flex items-center px-6 py-2.5 bg-[#942a38] text-white font-bold rounded-lg">
              <TrashIcon />
              <span>مسح الموظف</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg max-w-sm">
            <h3 className="text-xl font-bold mb-4">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل انت متأكد من انك تريد مسح الموظف؟</p>
            <div className="flex justify-center gap-4">
              <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white rounded-lg">
                نعم, قم بالمسح
              </button>
              <button onClick={closeDeleteModal} className="px-6 py-2 bg-gray-200 rounded-lg">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeForm;
