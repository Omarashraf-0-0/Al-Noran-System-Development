/**
 * EXAMPLE UPLOAD DOCUMENTS FOR AL-NORAN SYSTEM
 * 
 * These are example MongoDB documents showing different upload scenarios
 */

// ========================================
// EXAMPLE 1: Client Registration (Factory) - Commercial Register
// ========================================
const factoryClientRegistrationExample = {
	_id: "67890abcdef1234567890abc",
	userId: "68ed5439b5d0fbe15fbdfc19", // Reference to User collection
	userType: "client",
	clientType: "factory", // مصنع
	category: "registration",
	documentType: "commercial_register", // السجل التجاري
	relatedId: null,
	filename: "commercial_register.pdf",
	originalname: "commercial_register.pdf",
	s3Key: "clients/68ed5439b5d0fbe15fbdfc19/registration/1698765432000_commercial_register.pdf",
	url: "https://noran-uploads.s3.me-south-1.amazonaws.com/clients/68ed5439b5d0fbe15fbdfc19/registration/1698765432000_commercial_register.pdf",
	mimetype: "application/pdf",
	size: 2458624, // ~2.4 MB
	uploadedBy: "68ed5439b5d0fbe15fbdfc19",
	description: "Commercial register for factory client",
	tags: ["registration", "legal", "required"],
	isActive: true,
	uploadedAt: new Date("2024-10-31T10:30:00Z"),
	createdAt: new Date("2024-10-31T10:30:00Z"),
	updatedAt: new Date("2024-10-31T10:30:00Z"),
};

// ========================================
// EXAMPLE 2: Client Shipment Document - Bill of Lading
// ========================================
const clientShipmentExample = {
	_id: "77890abcdef1234567890bcd",
	userId: "68ed5439b5d0fbe15fbdfc19",
	userType: "client",
	clientType: "commercial", // تجاري
	category: "shipment",
	documentType: "bill_of_lading",
	relatedId: "SHIP-0001", // Shipment ID
	filename: "bill_of_lading_SHIP0001.pdf",
	originalname: "bill_of_lading_SHIP0001.pdf",
	s3Key: "clients/68ed5439b5d0fbe15fbdfc19/shipments/SHIP-0001/1698765555000_bill_of_lading_SHIP0001.pdf",
	url: "https://noran-uploads.s3.me-south-1.amazonaws.com/clients/68ed5439b5d0fbe15fbdfc19/shipments/SHIP-0001/1698765555000_bill_of_lading_SHIP0001.pdf",
	mimetype: "application/pdf",
	size: 1234567, // ~1.2 MB
	uploadedBy: "68ed5439b5d0fbe15fbdfc19",
	description: "Bill of lading for shipment SHIP-0001",
	tags: ["shipment", "bill_of_lading", "SHIP-0001"],
	isActive: true,
	uploadedAt: new Date("2024-11-01T14:20:00Z"),
	createdAt: new Date("2024-11-01T14:20:00Z"),
	updatedAt: new Date("2024-11-01T14:20:00Z"),
};

// ========================================
// EXAMPLE 3: Employee Invoice Document
// ========================================
const employeeInvoiceExample = {
	_id: "87890abcdef1234567890cde",
	userId: "69ed5439b5d0fbe15fbdfc20", // Employee user ID
	userType: "employee",
	clientType: null, // Not applicable for employees
	category: "invoice",
	documentType: "invoice",
	relatedId: "INV-2024-001", // Invoice ID
	filename: "invoice_INV2024001.pdf",
	originalname: "invoice_INV2024001.pdf",
	s3Key: "employees/69ed5439b5d0fbe15fbdfc20/invoices/INV-2024-001/1698766666000_invoice_INV2024001.pdf",
	url: "https://noran-uploads.s3.me-south-1.amazonaws.com/employees/69ed5439b5d0fbe15fbdfc20/invoices/INV-2024-001/1698766666000_invoice_INV2024001.pdf",
	mimetype: "application/pdf",
	size: 987654, // ~987 KB
	uploadedBy: "69ed5439b5d0fbe15fbdfc20",
	description: "Invoice generated for client transaction",
	tags: ["invoice", "financial", "INV-2024-001"],
	isActive: true,
	uploadedAt: new Date("2024-11-02T09:15:00Z"),
	createdAt: new Date("2024-11-02T09:15:00Z"),
	updatedAt: new Date("2024-11-02T09:15:00Z"),
};

// ========================================
// EXAMPLE 4: Client ACID Document - Proforma Invoice
// ========================================
const clientAcidExample = {
	_id: "97890abcdef1234567890def",
	userId: "68ed5439b5d0fbe15fbdfc19",
	userType: "client",
	clientType: "factory",
	category: "acid",
	documentType: "proforma_invoice",
	relatedId: "ACID-001", // ACID Request ID
	filename: "proforma_invoice_ACID001.pdf",
	originalname: "proforma_invoice_ACID001.pdf",
	s3Key: "clients/68ed5439b5d0fbe15fbdfc19/acid/ACID-001/1698767777000_proforma_invoice_ACID001.pdf",
	url: "https://noran-uploads.s3.me-south-1.amazonaws.com/clients/68ed5439b5d0fbe15fbdfc19/acid/ACID-001/1698767777000_proforma_invoice_ACID001.pdf",
	mimetype: "application/pdf",
	size: 1567890, // ~1.5 MB
	uploadedBy: "68ed5439b5d0fbe15fbdfc19",
	description: "Proforma invoice for ACID request ACID-001",
	tags: ["acid", "proforma", "ACID-001"],
	isActive: true,
	uploadedAt: new Date("2024-11-03T11:45:00Z"),
	createdAt: new Date("2024-11-03T11:45:00Z"),
	updatedAt: new Date("2024-11-03T11:45:00Z"),
};

// ========================================
// EXAMPLE 5: Personal Client Registration - Personal ID
// ========================================
const personalClientRegistrationExample = {
	_id: "a7890abcdef1234567890ef0",
	userId: "70ed5439b5d0fbe15fbdfc21",
	userType: "client",
	clientType: "personal", // فردي
	category: "registration",
	documentType: "personal_id", // البطاقة الشخصية
	relatedId: null,
	filename: "personal_id_front.jpg",
	originalname: "personal_id_front.jpg",
	s3Key: "clients/70ed5439b5d0fbe15fbdfc21/registration/1698768888000_personal_id_front.jpg",
	url: "https://noran-uploads.s3.me-south-1.amazonaws.com/clients/70ed5439b5d0fbe15fbdfc21/registration/1698768888000_personal_id_front.jpg",
	mimetype: "image/jpeg",
	size: 345678, // ~346 KB
	uploadedBy: "70ed5439b5d0fbe15fbdfc21",
	description: "Personal ID card - front side",
	tags: ["registration", "personal_id", "identity"],
	isActive: true,
	uploadedAt: new Date("2024-11-04T13:30:00Z"),
	createdAt: new Date("2024-11-04T13:30:00Z"),
	updatedAt: new Date("2024-11-04T13:30:00Z"),
};

// ========================================
// EXAMPLE 6: Admin Archive Document
// ========================================
const adminArchiveExample = {
	_id: "b7890abcdef1234567890f01",
	userId: "71ed5439b5d0fbe15fbdfc22", // Admin user ID
	userType: "admin",
	clientType: null,
	category: "archive",
	documentType: "report",
	relatedId: null,
	filename: "monthly_report_october_2024.pdf",
	originalname: "monthly_report_october_2024.pdf",
	s3Key: "admin/archive/1698769999000_monthly_report_october_2024.pdf",
	url: "https://noran-uploads.s3.me-south-1.amazonaws.com/admin/archive/1698769999000_monthly_report_october_2024.pdf",
	mimetype: "application/pdf",
	size: 5678901, // ~5.4 MB
	uploadedBy: "71ed5439b5d0fbe15fbdfc22",
	description: "Monthly performance report for October 2024",
	tags: ["archive", "report", "monthly", "2024"],
	isActive: true,
	uploadedAt: new Date("2024-11-05T16:00:00Z"),
	createdAt: new Date("2024-11-05T16:00:00Z"),
	updatedAt: new Date("2024-11-05T16:00:00Z"),
};

// ========================================
// EXPORT ALL EXAMPLES
// ========================================
module.exports = {
	factoryClientRegistrationExample,
	clientShipmentExample,
	employeeInvoiceExample,
	clientAcidExample,
	personalClientRegistrationExample,
	adminArchiveExample,
};

/**
 * S3 KEY NAMING RULES SUMMARY:
 * 
 * Clients:
 * - Registration: clients/{userId}/registration/{timestamp}_{filename}
 * - ACID: clients/{userId}/acid/{acidId}/{timestamp}_{filename}
 * - Shipment: clients/{userId}/shipments/{shipmentId}/{timestamp}_{filename}
 * - Archive: clients/{userId}/archive/{timestamp}_{filename}
 * 
 * Employees:
 * - Shipment: employees/{userId}/shipments/{shipmentId}/{timestamp}_{filename}
 * - Invoice: employees/{userId}/invoices/{invoiceId}/{timestamp}_{filename}
 * 
 * Admin:
 * - Archive: admin/archive/{timestamp}_{filename}
 */

/**
 * REQUIRED DOCUMENTS BY CLIENT TYPE:
 * 
 * Factory (مصنع) - 8 documents:
 * 1. commercial_register (السجل التجاري)
 * 2. tax_card (البطاقة الضريبية)
 * 3. contract (العقد)
 * 4. industrial_register (السجل الصناعي)
 * 5. certificate_vat (شهادة القيمة المضافة)
 * 6. production_supplies (مستلزمات الإنتاج)
 * 7. power_of_attorney (التوكيل)
 * 8. personal_id_of_representative (بطاقة ممثل/مندوب)
 * 
 * Commercial (تجاري) - 8 documents:
 * 1. commercial_register (السجل التجاري)
 * 2. tax_card (البطاقة الضريبية)
 * 3. contract (العقد)
 * 4. certificate_vat (شهادة القيمة المضافة)
 * 5. import_export_card (بطاقة استيراد/تصدير)
 * 6. power_of_attorney (التوكيل)
 * 7. personal_id_of_representative (بطاقة)
 * 8. trade_certificates (شهادات تجارية)
 * 
 * Personal (فردي) - 3 documents:
 * 1. power_of_attorney (التوكيل)
 * 2. personal_id (البطاقة الشخصية)
 * 3. sample_document (مستند داعم)
 */
