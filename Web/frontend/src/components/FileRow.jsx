import React from 'react';

// Map document types to Arabic labels
const documentTypeLabels = {
  'commercial_register': 'السجل التجاري',
  'tax_card': 'البطاقة الضريبية',
  'contract': 'العقد',
  'industrial_register': 'السجل الصناعي',
  'certificate_vat': 'شهادة القيمة المضافة',
  'production_supplies': 'مستلزمات الإنتاج',
  'power_of_attorney': 'التوكيل',
  'personal_id_of_representative': 'بطاقة ممثل/مندوب',
  'import_export_card': 'بطاقة استيراد/تصدير',
  'trade_certificates': 'شهادات تجارية',
  'personal_id': 'البطاقة الشخصية',
  'sample_document': 'مستند داعم',
  'bill_of_lading': 'بوليصة الشحن',
  'delivery_permit': 'تصريح التسليم',
  'discharge_docs': 'مستندات التفريغ',
  'proforma_invoice': 'فاتورة مبدئية',
  'invoice': 'فاتورة',
  'report': 'تقرير',
  'other': 'مستند آخر',
};

const FileRow = ({ name, date, documentType = null, description = null }) => {
  // Get the display label for document type
  const getDocumentTypeLabel = () => {
    if (description) return description;
    if (documentType && documentTypeLabels[documentType]) {
      return documentTypeLabels[documentType];
    }
    return 'مستند';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-4 p-4 border-b border-gray-200 last:border-b-0">
      <div className="col-span-2 md:col-span-1">
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
      <div className="text-gray-600 text-center hidden md:block">{getDocumentTypeLabel()}</div>
      <div className="text-gray-600 text-center hidden md:block">راجع الملف</div>
      <div className="text-cyan-600 font-semibold hover:underline text-start cursor-pointer">تحميل الملف</div>
    </div>
  );
};

export default FileRow;