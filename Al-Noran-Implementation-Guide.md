# 📦 Al-Noran System: Complete Implementation Guide
## Based on Al-Noran-Update.md Requirements

---

## 🎯 **OVERVIEW: What We're Building**

### **Current System (Already Built):**
✅ **IMPORT System Only**
- ACID Request → ACID Number → Import Shipment (Air/Sea)
- Document upload for registration
- Profile pages for all users
- AWS S3 file storage

### **What We Need to Add:**
🆕 **EXPORT System**
- UCR Request → UCR Number → Export Shipment (Air/Sea)
- Two types of export certifications: **Noran Certified** vs **Client Certified**
- Different workflows and fees for each type
- Support for multiple items per shipment
- Regulatory bodies selection

---

## 📋 **CRITICAL CONCEPTS FROM UPDATE DOCUMENT**

### **1. UCR = Export License (like ACID for imports)**
- UCR is the export license number
- Client requests UCR → Employee extracts UCR from government window → Export shipment created

### **2. Two Certification Types:**

#### **Type 1: Noran Certified (على بطاقة الشركة)**
- **Visual Indicator:** 🟢 Green circle on certificate
- **Company Responsibilities:**
  - Issues final documents (invoice, packing list in Noran's name)
  - Pays export fees (10% of value, minimum 3500 EGP)
  - Handles all paperwork
- **Client Provides:**
  - Bank waiver (التنازل البنكي)
  - Original invoice
  - Packing list
- **Fee Calculation:** `max(value_in_EGP * 0.10, 3500)`
- **Automatic Invoice:** System sends invoice to MAKER INVOICE

#### **Type 2: Client Certified (على بطاقة العميل)**
- **Visual Indicator:** 🟡 Yellow circle on certificate
- **Company Responsibilities:**
  - Only handles customs clearance (الإدراج)
  - No document creation
  - NO automatic 10% fee
- **Client Provides:**
  - Their own final invoice
  - Shipping permit
  - Bill of lading (AWB/B/L)
  - NO bank waiver needed
- **Fee:** Manual service fees only (no 10% export fee)

### **3. Shipping Methods:**
- **Air (جوي):** Uses AWB (Air Waybill)
- **Sea (بحري):** Uses B/L (Bill of Lading) + Container details

### **4. Regulatory Bodies (الجهات الرقابية)**
Must be selectable by employee for each shipment:
- Food Safety Authority (FSA) - Chemical inspection
- Agricultural Quarantine - Agricultural inspection
- Atomic Energy - Radiation inspection
- [Full list at end of document]

---

## 🗂️ **MONGODB SCHEMAS NEEDED**

### **1. Update User Schema**
```javascript
// Add to existing User model
{
  // ... existing fields ...
  
  exportCertificationType: {
    type: String,
    enum: ['noran', 'client'],
    default: 'noran',
    // Toggle in client profile to choose:
    // 'noran' = Export on company card (green circle)
    // 'client' = Export on client card (yellow circle)
  }
}
```

### **2. Create UCR Request Schema (NEW)**
```javascript
const ucrRequestSchema = new mongoose.Schema({
  // Basic Info
  clientId: { type: ObjectId, ref: 'User', required: true },
  requestNumber: { type: String, unique: true, auto-generated },
  
  // UCR Details
  ucrNumber: { type: String, default: null }, // Filled by employee
  
  // Certification Type (from user profile, but can be overridden)
  certificationType: {
    type: String,
    enum: ['noran', 'client'],
    required: true
  },
  
  // Shipping Method
  shippingMethod: {
    type: String,
    enum: ['air', 'sea'],
    required: true
  },
  
  // MANDATORY Client Input (from update doc)
  generalDescription: { type: String, required: true }, // الوصف العام
  totalWeight: { type: Number, required: true }, // وزن الشحنة
  packagesCount: { type: Number, required: true }, // عدد الطرود
  valueInEGP: { type: Number, required: true }, // القيمة بالجنيه المصري
  originalInvoiceNumber: { type: String, required: true }, // رقم الفاتورة الأصلية
  invoiceDate: { type: Date, required: true }, // تاريخ إصدار الفاتورة
  
  // Sea Shipment Additional Fields (only if shippingMethod === 'sea')
  quantity: { type: Number }, // الكمية/الحجم
  weightUnit: {
    type: String,
    enum: ['tons', 'kilograms']
  },
  containersCount: { type: Number }, // عدد الحاويات
  containerWeights: [{ // أوزان الحاويات
    containerNumber: String,
    weight: Number,
    unit: String
  }],
  
  // Multiple Items Support (تعدد البنود)
  items: [{
    description: { type: String, required: true },
    hsCode: String,
    quantity: Number,
    weight: Number,
    value: Number,
    unit: String
  }],
  
  // Uploaded Documents
  documents: [{
    type: { 
      type: String, 
      enum: [
        'bank_waiver', // التنازل البنكي (only for Noran certified)
        'original_invoice', // الفاتورة الأصلية
        'packing_list', // كشف العبوة
        'industrial_record', // السجل الصناعي (auto-pulled for factories)
        'awb', // Air Waybill (for air)
        'bill_of_lading', // B/L (for sea)
        'other'
      ]
    },
    s3Key: String,
    uploadedAt: Date
  }],
  
  // Status
  status: {
    type: String,
    enum: [
      'pending', // في انتظار استخراج UCR
      'ucr_issued', // تم استخراج UCR
      'documents_prepared', // تم تجهيز المستندات (Noran only)
      'awaiting_regulatory_approval', // في انتظار موافقة الجهات الرقابية
      'customs_entry_46', // تم الإدراج ورقم 46
      'ready_to_ship', // جاهز للشحن
      'certificate_of_origin_pending', // في انتظار شهادة المنشأ
      'completed' // مكتمل
    ],
    default: 'pending'
  },
  
  // Regulatory Body (if applicable)
  regulatoryBody: {
    type: String,
    enum: [
      null,
      'goeic', // الهيئة العامة للرقابة على الصادرات والواردات
      'fsa', // هيئة سلامة الغذاء
      'agricultural_quarantine', // الحجر الزراعي
      'veterinary_quarantine', // الحجر البيطري
      'telecom_authority', // جهاز تنظيم الاتصالات
      'atomic_energy', // هيئة الطاقة الذرية
      'drug_authority', // هيئة الدواء المصرية
      'industrial_control', // مصلحة الرقابة الصناعية
      // ... (full list from document)
    ],
    default: null
  },
  
  // Employee Actions
  customsEntryNumber46: { type: String, default: null }, // رقم 46
  certificateOfOrigin: { type: String, default: null }, // S3 key
  certificateOfOriginUploadedAt: { type: Date },
  
  // Fee Calculation (only for Noran certified)
  exportFee: { type: Number, default: 0 }, // Calculated as max(valueInEGP * 0.10, 3500)
  invoiceSentToMaker: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  ucrIssuedAt: { type: Date },
  readyToShipAt: { type: Date }, // For certificate of origin 3-day rule
  completedAt: { type: Date },
  
  // Employee Notes
  employeeNotes: String
});
```

### **3. Create Export Shipment Schema (NEW)**
```javascript
const exportShipmentSchema = new mongoose.Schema({
  // Links
  clientId: { type: ObjectId, ref: 'User', required: true },
  ucrRequestId: { type: ObjectId, ref: 'UCRRequest', required: true },
  ucrNumber: { type: String, required: true },
  
  // Shipment Details
  shipmentNumber: { type: String, unique: true, auto-generated },
  certificationType: { type: String, enum: ['noran', 'client'], required: true },
  shippingMethod: { type: String, enum: ['air', 'sea'], required: true },
  
  // Destination
  destinationCountry: { type: String, required: true },
  destinationPort: { type: String },
  
  // Goods Details
  items: [{
    description: String,
    hsCode: String,
    quantity: Number,
    weight: Number,
    value: Number
  }],
  
  // Documents (Different based on certification type)
  documents: [{
    type: { 
      type: String,
      enum: [
        // Noran Certified Documents (created by employee)
        'noran_invoice', // فاتورة النوران
        'noran_packing_list', // كشف عبوة النوران
        'shipping_permit', // إذن الشحن
        'awb', // Air Waybill
        'bill_of_lading', // B/L
        
        // Client Certified Documents (uploaded by client)
        'client_invoice', // فاتورة العميل
        'client_awb', // Client's AWB
        'client_bill_of_lading', // Client's B/L
        
        // Common Documents
        'certificate_of_origin', // شهادة المنشأ
        'form_46', // نموذج 46
        'other'
      ]
    },
    s3Key: String,
    uploadedAt: Date
  }],
  
  // Status Tracking
  currentStatus: {
    type: String,
    enum: [
      'documents_verification', // التحقق من المستندات
      'regulatory_inspection', // فحص الجهات الرقابية
      'payment_cleared', // تم السداد
      'goods_loaded', // تم التحميل
      'in_transit', // في الطريق
      'delivered', // تم التسليم
      'completed' // مكتمل
    ],
    default: 'documents_verification'
  },
  
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: ObjectId, ref: 'User' },
    notes: String
  }],
  
  // Regulatory
  regulatoryBody: String,
  regulatoryApprovalDate: Date,
  
  // Fees (only for Noran certified)
  exportFee: Number,
  serviceFees: Number,
  totalFees: Number,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  
  // Employee handling
  assignedEmployee: { type: ObjectId, ref: 'User' },
  employeeNotes: String
});
```

### **4. Update Upload Schema**
```javascript
// Add new categories to existing Upload model
{
  category: {
    type: String,
    enum: [
      'registration',
      'acidrequest', 
      'acid',
      'shipment',
      'invoice',
      'archive',
      'ucr_request', // NEW: UCR request documents
      'export_shipment', // NEW: Export shipment documents
      'certificate_of_origin', // NEW: Certificates of origin
      'form_46' // NEW: Form 46 documents
    ],
    required: true
  },
  
  documentType: {
    type: String,
    enum: [
      // ... existing types ...
      'bank_waiver', // NEW: التنازل البنكي
      'noran_invoice', // NEW: فاتورة النوران
      'noran_packing_list', // NEW: كشف عبوة النوران
      'certificate_of_origin', // NEW: شهادة المنشأ
      'form_46', // NEW: نموذج 46
      'bill_of_lading', // NEW: B/L
      'awb', // NEW: Air Waybill
      // ... rest ...
    ]
  },
  
  // Link to UCR or Export Shipment
  ucrRequestId: { type: ObjectId, ref: 'UCRRequest' },
  exportShipmentId: { type: ObjectId, ref: 'ExportShipment' }
}
```

---

## 📱 **PAGES TO BUILD - DETAILED BREAKDOWN**

### **CLIENT PAGES**

---

#### **PAGE 1: UCR Request Page** (`UCRRequestPage.jsx`)

**Route:** `/ucr-request`

**Purpose:** Client creates a new UCR (export license) request

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Header with "طلب رقم UCR"               │
├─────────────────────────────────────────┤
│                                         │
│  Step 1: Choose Shipping Method        │
│    ○ Air (جوي)    ○ Sea (بحري)        │
│                                         │
│  Step 2: Basic Information             │
│    ├─ General Description (required)   │
│    ├─ Total Weight (required)          │
│    ├─ Packages Count (required)        │
│    ├─ Value in EGP (required)          │
│    ├─ Original Invoice Number (req)    │
│    └─ Invoice Date (required)          │
│                                         │
│  [IF SEA SELECTED:]                    │
│    ├─ Quantity (required)              │
│    ├─ Weight Unit: ○ Tons ○ Kilograms │
│    ├─ Containers Count (required)      │
│    └─ Container Weights Table          │
│        Container # | Weight | Unit     │
│        ───────────────────────────────│
│        [+ Add Container]               │
│                                         │
│  Step 3: Multiple Items (تعدد البنود)  │
│    Item 1:                             │
│      ├─ Description                    │
│      ├─ HS Code                        │
│      ├─ Quantity                       │
│      ├─ Weight                         │
│      └─ Value                          │
│    [+ Add Another Item]                │
│                                         │
│  Step 4: Upload Documents              │
│    [Your Certification: 🟢 Noran / 🟡 Client] │
│                                         │
│    IF NORAN CERTIFIED:                 │
│      ├─ Bank Waiver (التنازل البنكي) ✓ │
│      ├─ Original Invoice ✓             │
│      └─ Packing List ✓                 │
│                                         │
│    IF CLIENT CERTIFIED:                │
│      ├─ Your Final Invoice ✓           │
│      ├─ Shipping Permit ✓              │
│      └─ AWB/B/L ✓                      │
│                                         │
│  [Submit UCR Request]                  │
│                                         │
└─────────────────────────────────────────┘
```

**State Management:**
```javascript
const [shippingMethod, setShippingMethod] = useState('air'); // 'air' or 'sea'
const [formData, setFormData] = useState({
  generalDescription: '',
  totalWeight: '',
  packagesCount: '',
  valueInEGP: '',
  originalInvoiceNumber: '',
  invoiceDate: '',
  // Sea-specific fields
  quantity: '',
  weightUnit: 'kilograms',
  containersCount: '',
  containerWeights: []
});
const [items, setItems] = useState([{ description: '', hsCode: '', quantity: '', weight: '', value: '' }]);
const [documents, setDocuments] = useState([]);
const [certificationType, setCertificationType] = useState(user.exportCertificationType); // from user profile
```

**API Endpoint:**
- `POST /api/ucr-requests`
- Body: All form data + documents
- Response: Created UCR request with request number

**Validation:**
- All mandatory fields required
- If sea: containers fields required
- Documents: different requirements based on certification type
- Value in EGP must be positive number

---

#### **PAGE 2: UCR Requests List** (`UCRRequestsPage.jsx`)

**Route:** `/ucr-requests`

**Purpose:** View all client's UCR requests and their status

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ My UCR Requests                         │
├─────────────────────────────────────────┤
│                                         │
│ [+ New UCR Request]    [Search...]     │
│                                         │
│ ┌──────────────────────────────┐      │
│ │ Request #UCR-2025-001        │      │
│ │ 🟢 Noran Certified | Air     │      │
│ │ Status: في انتظار UCR        │      │
│ │ Created: 2025-12-14          │      │
│ │ [View Details]               │      │
│ └──────────────────────────────┘      │
│                                         │
│ ┌──────────────────────────────┐      │
│ │ Request #UCR-2025-002        │      │
│ │ 🟡 Client Certified | Sea    │      │
│ │ Status: جاهز للشحن ✓         │      │
│ │ UCR: EXP-2025-45678          │      │
│ │ [View Details]               │      │
│ └──────────────────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

**Status Display:**
- pending → "في انتظار استخراج UCR"
- ucr_issued → "تم استخراج UCR: [number]"
- documents_prepared → "تم تجهيز المستندات"
- awaiting_regulatory_approval → "في انتظار موافقة الجهات الرقابية"
- customs_entry_46 → "تم الإدراج - رقم 46"
- ready_to_ship → "جاهز للشحن ✓"
- certificate_of_origin_pending → "في انتظار شهادة المنشأ"
- completed → "مكتمل ✓"

**API Endpoint:**
- `GET /api/ucr-requests?clientId=xxx`
- Response: Array of UCR requests

---

#### **PAGE 3: UCR Request Details** (`UCRRequestDetailsPage.jsx`)

**Route:** `/ucr-request/:requestId`

**Purpose:** View detailed information about a specific UCR request

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ ← Back | UCR Request #UCR-2025-001     │
│ 🟢 Noran Certified | Air                │
├─────────────────────────────────────────┤
│                                         │
│ Status Timeline:                        │
│ ✓ Request Submitted - Dec 14, 10:00 AM│
│ ✓ UCR Issued - Dec 14, 2:30 PM        │
│   UCR Number: EXP-2025-45678           │
│ ⏳ Documents Preparation...            │
│ ○ Customs Entry                        │
│ ○ Ready to Ship                        │
│                                         │
│ ────────────────────────────────────  │
│                                         │
│ Request Information:                    │
│  General Description: Electronics      │
│  Total Weight: 500 kg                  │
│  Packages: 10                          │
│  Value: 50,000 EGP                     │
│  Invoice #: INV-2025-123               │
│  Invoice Date: Dec 10, 2025            │
│                                         │
│ Items (3):                             │
│  1. Laptop computers - 20 units        │
│  2. Mobile phones - 50 units           │
│  3. Accessories - 100 units            │
│                                         │
│ Uploaded Documents:                     │
│  ✓ Bank Waiver [View] [Download]      │
│  ✓ Original Invoice [View] [Download] │
│  ✓ Packing List [View] [Download]     │
│                                         │
│ [IF export fee applicable]             │
│ Export Fee: 5,000 EGP                  │
│ (10% of 50,000 EGP)                    │
│                                         │
│ [IF regulatory body]                   │
│ Regulatory Body: FSA                   │
│ Status: Pending approval               │
│                                         │
└─────────────────────────────────────────┘
```

**API Endpoint:**
- `GET /api/ucr-requests/:requestId`
- Response: Full UCR request details

---

#### **PAGE 4: Export Shipments Page** (`ExportShipmentsPage.jsx`)

**Route:** `/export-shipments`

**Purpose:** View all export shipments (after UCR is ready)

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ My Export Shipments                     │
├─────────────────────────────────────────┤
│                                         │
│ [Search...]  Filter: [All Status ▼]   │
│                                         │
│ ┌──────────────────────────────┐      │
│ │ Shipment #EXP-SHIP-001       │      │
│ │ 🟢 Noran | Air | Germany     │      │
│ │ UCR: EXP-2025-45678          │      │
│ │                              │      │
│ │ Progress:                    │      │
│ │ ████████░░░░░░░░ 60%        │      │
│ │                              │      │
│ │ Current: Regulatory Inspection│    │
│ │ Updated: 2 hours ago         │      │
│ │                              │      │
│ │ [Track Shipment]             │      │
│ └──────────────────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

**Status Stages:**
1. 📝 Document Verification
2. 🔍 Regulatory Inspection (if applicable)
3. 💰 Payment Cleared
4. 📦 Goods Loaded
5. 🚢 In Transit
6. ✅ Delivered

**API Endpoint:**
- `GET /api/export-shipments?clientId=xxx`

---

#### **PAGE 5: Export Shipment Tracking** (`ExportShipmentTrackingPage.jsx`)

**Route:** `/export-shipment/:shipmentId`

**Purpose:** Detailed tracking of export shipment status

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Export Shipment Tracking                │
│ #EXP-SHIP-001                           │
├─────────────────────────────────────────┤
│                                         │
│ 🟢 Noran Certified | Air Shipment      │
│ UCR: EXP-2025-45678                     │
│ Destination: Germany, Frankfurt Airport│
│                                         │
│ ════════════════════════════════       │
│                                         │
│ Status Timeline:                        │
│                                         │
│ ✅ Documents Verified                  │
│    Dec 14, 2025 - 3:00 PM              │
│    All documents approved               │
│                                         │
│ 🔄 Regulatory Inspection (Current)     │
│    Dec 14, 2025 - 4:00 PM              │
│    Pending FSA approval                 │
│    Estimated completion: 2 days         │
│                                         │
│ ⏳ Payment Cleared                     │
│    Pending...                           │
│                                         │
│ ⏳ Goods Loaded                        │
│    Pending...                           │
│                                         │
│ ⏳ In Transit                          │
│    Pending...                           │
│                                         │
│ ⏳ Delivered                           │
│    Pending...                           │
│                                         │
│ ════════════════════════════════       │
│                                         │
│ Shipment Details:                       │
│  Items: 3 types of electronics         │
│  Total Weight: 500 kg                  │
│  Value: 50,000 EGP                     │
│  Packages: 10                          │
│                                         │
│ Documents:                              │
│  ✓ Noran Invoice [Download]           │
│  ✓ Noran Packing List [Download]      │
│  ✓ Shipping Permit [Download]         │
│  ✓ AWB [Download]                      │
│  ⏳ Certificate of Origin (Pending)   │
│                                         │
│ Fees:                                   │
│  Export Fee (10%): 5,000 EGP           │
│  Service Fees: 1,500 EGP               │
│  Total: 6,500 EGP                      │
│  Status: Paid ✓                        │
│                                         │
└─────────────────────────────────────────┘
```

**API Endpoint:**
- `GET /api/export-shipments/:shipmentId`
- Response: Full shipment details with status history

---

### **EMPLOYEE PAGES**

---

#### **PAGE 6: UCR Management Page** (`EmployeeUCRManagementPage.jsx`)

**Route:** `/employee/ucr-management`

**Purpose:** Employees view and process UCR requests

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ UCR Request Management                  │
├─────────────────────────────────────────┤
│                                         │
│ Tabs: [Pending] [In Progress] [Completed]│
│                                         │
│ [Search...]  Filter: [All Types ▼]    │
│                                         │
│ ┌──────────────────────────────┐      │
│ │ #UCR-2025-001 | 🟢 Noran | Air│     │
│ │ Client: Ahmed Mohamed         │      │
│ │ Value: 50,000 EGP             │      │
│ │ Submitted: Dec 14, 10:00 AM   │      │
│ │                               │      │
│ │ Status: Pending UCR extraction│     │
│ │                               │      │
│ │ [View Details] [Process]      │      │
│ └──────────────────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

**API Endpoints:**
- `GET /api/employee/ucr-requests?status=pending`
- `GET /api/ucr-requests/:requestId` (detailed view)

---

#### **PAGE 7: UCR Request Processing** (`EmployeeUCRProcessingPage.jsx`)

**Route:** `/employee/ucr-request/:requestId`

**Purpose:** Employee processes a specific UCR request

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Process UCR Request #UCR-2025-001       │
│ 🟢 Noran Certified | Air                │
├─────────────────────────────────────────┤
│                                         │
│ Client Information:                     │
│  Name: Ahmed Mohamed Factory           │
│  Tax ID: 123-456-789                   │
│  Type: Factory (مصنع)                  │
│                                         │
│ Request Details:                        │
│  Description: Electronics              │
│  Weight: 500 kg                        │
│  Packages: 10                          │
│  Value: 50,000 EGP                     │
│  Invoice: INV-2025-123 (Dec 10, 2025) │
│                                         │
│ Items (3):                             │
│  [Table showing all items]             │
│                                         │
│ Client Documents:                       │
│  ✓ Bank Waiver [View]                 │
│  ✓ Original Invoice [View]            │
│  ✓ Packing List [View]                │
│  ✓ Industrial Record (Auto) [View]    │
│                                         │
│ ════════════════════════════════       │
│                                         │
│ CURRENT STATUS: pending                │
│                                         │
│ STEP 1: Extract UCR Number             │
│ ┌────────────────────────────┐        │
│ │ UCR Number: [____________] │        │
│ │ [Extract from Government Window] │  │
│ └────────────────────────────┘        │
│                                         │
│ [IF UCR issued, show STEP 2:]          │
│ STEP 2: Prepare Documents (Noran only)│
│ ┌────────────────────────────┐        │
│ │ Upload Noran Invoice: [Choose]│    │
│ │ Upload Noran Packing: [Choose]│    │
│ │ Upload Shipping Permit: [Choose]│  │
│ │ Upload AWB: [Choose]          │    │
│ │ [Generate & Upload All]       │    │
│ └────────────────────────────┘        │
│                                         │
│ STEP 3: Regulatory Body (Optional)     │
│ ┌────────────────────────────┐        │
│ │ Does this require regulatory│       │
│ │ approval?                   │       │
│ │ ○ No regulatory body needed │       │
│ │ ● Yes, select body:         │       │
│ │   [FSA ▼]                   │       │
│ │ [Set Regulatory Body]       │       │
│ └────────────────────────────┘        │
│                                         │
│ STEP 4: Customs Entry & Form 46        │
│ ┌────────────────────────────┐        │
│ │ Form 46 Number: [________] │        │
│ │ [Submit Form 46]            │        │
│ └────────────────────────────┘        │
│                                         │
│ STEP 5: Mark Ready to Ship             │
│ ┌────────────────────────────┐        │
│ │ [Mark as Ready to Ship]     │        │
│ └────────────────────────────┘        │
│                                         │
│ STEP 6: Certificate of Origin          │
│ (Appears 3 days after ready to ship)   │
│ ┌────────────────────────────┐        │
│ │ Upload Certificate: [Choose]│        │
│ │ [Upload Certificate]        │        │
│ └────────────────────────────┘        │
│                                         │
│ ════════════════════════════════       │
│                                         │
│ [IF Noran Certified:]                  │
│ Fee Calculation:                        │
│  Value: 50,000 EGP                     │
│  Export Fee (10%): 5,000 EGP           │
│  (Minimum: 3,500 EGP)                  │
│  ✓ Invoice sent to MAKER INVOICE      │
│                                         │
│ Employee Notes:                         │
│ ┌────────────────────────────┐        │
│ │ [Text area for notes]       │        │
│ └────────────────────────────┘        │
│                                         │
│ [Save Progress]  [Complete Request]    │
│                                         │
└─────────────────────────────────────────┘
```

**Key Actions:**
1. **Extract UCR:** Employee gets UCR from government window, enters it
2. **Prepare Documents (Noran only):** Employee creates/uploads Noran documents
3. **Set Regulatory Body:** Select if regulatory approval needed
4. **Enter Form 46:** After customs entry
5. **Mark Ready to Ship:** Changes status
6. **Upload Certificate of Origin:** After 3 days in "ready to ship" status

**API Endpoints:**
- `PUT /api/ucr-requests/:requestId/extract-ucr` (body: { ucrNumber })
- `PUT /api/ucr-requests/:requestId/upload-documents` (multipart form)
- `PUT /api/ucr-requests/:requestId/set-regulatory-body` (body: { regulatoryBody })
- `PUT /api/ucr-requests/:requestId/set-form-46` (body: { customsEntryNumber46 })
- `PUT /api/ucr-requests/:requestId/mark-ready-to-ship`
- `PUT /api/ucr-requests/:requestId/upload-certificate-of-origin` (multipart form)

**Workflow Logic:**
```javascript
// Status progression
pending → (extract UCR) → ucr_issued
ucr_issued → (upload docs for Noran) → documents_prepared
documents_prepared → (if regulatory) → awaiting_regulatory_approval
awaiting_regulatory_approval → (approval received) → customs_entry_46
customs_entry_46 → (enter form 46) → ready_to_ship
ready_to_ship → (after 3 days, upload cert) → certificate_of_origin_pending
certificate_of_origin_pending → (cert uploaded) → completed

// For Client Certified, skip documents_prepared step
```

---

#### **PAGE 8: Export Shipment Management** (`EmployeeExportShipmentPage.jsx`)

**Route:** `/employee/export-shipment/:shipmentId`

**Purpose:** Employee updates export shipment status

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Manage Export Shipment #EXP-SHIP-001   │
├─────────────────────────────────────────┤
│                                         │
│ Client: Ahmed Mohamed                   │
│ UCR: EXP-2025-45678                     │
│ Type: 🟢 Noran Certified | Air         │
│ Destination: Germany                    │
│                                         │
│ Current Status: regulatory_inspection  │
│                                         │
│ Status Update:                          │
│ ┌────────────────────────────┐        │
│ │ Select New Status:          │        │
│ │ [Payment Cleared ▼]         │        │
│ │                             │        │
│ │ Add Notes:                  │        │
│ │ [Text area]                 │        │
│ │                             │        │
│ │ [Update Status] [Notify Client]│   │
│ └────────────────────────────┘        │
│                                         │
│ Status History:                         │
│  ✓ Documents Verified - Dec 14, 3 PM  │
│  ✓ Regulatory Inspection - Dec 14, 4 PM│
│    by: Mohamed Ali                      │
│    Note: Sent to FSA                    │
│                                         │
│ Documents:                              │
│  [List of all documents with view/download]│
│                                         │
└─────────────────────────────────────────┘
```

**API Endpoints:**
- `PUT /api/export-shipments/:shipmentId/update-status`
- `GET /api/export-shipments/:shipmentId/history`

---

### **PROFILE PAGE UPDATE**

#### **PAGE 9: Client Profile - Add Export Certification Toggle**

**Location:** Update existing `ClientProfilePage.jsx`

**New Section to Add:**
```
┌─────────────────────────────────────────┐
│ Export Certification Settings           │
├─────────────────────────────────────────┤
│                                         │
│ When exporting, use certificate from:   │
│                                         │
│ ○ Noran Company (الشركة)              │
│   └─ 🟢 Green indicator on certificates│
│   └─ Noran handles all documents       │
│   └─ 10% export fee applies            │
│                                         │
│ ○ My Company (بطاقتي الخاصة)          │
│   └─ 🟡 Yellow indicator on certificates│
│   └─ I provide my own documents        │
│   └─ No automatic 10% fee              │
│                                         │
│ Current Selection: [Noran Company]     │
│                                         │
│ [Save Changes]                          │
│                                         │
└─────────────────────────────────────────┘
```

**Database Update:**
- Add `exportCertificationType` field to User model
- API: `PUT /api/users/profile` (include exportCertificationType)

---

## 🔄 **COMPLETE WORKFLOW SUMMARY**

### **Workflow 1: Noran Certified Air Export**

```
CLIENT:
1. Set profile to "Noran Certified" ✓
2. Create UCR request
   - Select "Air"
   - Fill mandatory fields
   - Upload: Bank waiver, Invoice, Packing list
3. Submit request
4. Wait for UCR number

EMPLOYEE:
5. Review request
6. Extract UCR from government window
7. Enter UCR number in system
8. Create & upload Noran documents:
   - Noran invoice (using client's invoice #)
   - Noran packing list
   - Shipping permit
   - AWB
9. If regulatory body needed:
   - Select regulatory body (e.g., FSA)
   - Status → awaiting_regulatory_approval
   - Wait for approval
10. Get Form 46 number from customs
11. Enter Form 46 in system
12. Mark as "Ready to Ship"
13. System calculates fee: max(50,000 * 0.10, 3500) = 5,000 EGP
14. System automatically sends invoice to MAKER INVOICE
15. After 3 days, upload Certificate of Origin
16. Status → Completed

CLIENT:
17. Receives notifications at each step
18. Can track shipment status
19. Can download all documents
20. Pays fees through system
```

### **Workflow 2: Client Certified Air Export**

```
CLIENT:
1. Set profile to "Client Certified" ✓
2. Create UCR request
   - Select "Air"
   - Fill mandatory fields
   - Upload: Own invoice, Shipping permit, AWB
   - NO bank waiver needed
3. Submit request
4. Wait for UCR number

EMPLOYEE:
5. Review request
6. Extract UCR from government window
7. Enter UCR number in system
8. NO document creation (client provided everything)
9. If regulatory body needed:
   - Select regulatory body
   - Wait for approval
10. Get Form 46 number
11. Enter Form 46 in system
12. Mark as "Ready to Ship"
13. NO automatic 10% fee calculation
14. Employee creates manual service fee invoice
15. After 3 days, upload Certificate of Origin
16. Status → Completed

CLIENT:
17. Receives notifications
18. Tracks shipment
19. Downloads documents
20. Pays only service fees (not 10% export fee)
```

### **Workflow 3: Sea Export (Noran or Client)**

**Same as Air, but:**
- Client must enter additional sea-specific fields:
  - Quantity
  - Weight unit (tons/kilograms)
  - Containers count
  - Container weights table
- Employee uploads B/L instead of AWB
- All other steps identical

---

## 📊 **DATABASE COLLECTIONS SUMMARY**

### **New Collections:**
1. **ucrRequests** - Export license requests
2. **exportShipments** - Export shipment tracking

### **Updated Collections:**
1. **users** - Add `exportCertificationType` field
2. **uploads** - Add new categories and document types

### **Collection Relationships:**
```
User (Client)
  └─ has many → UCRRequests
      └─ has many → ExportShipments
          └─ has many → Upload (documents)
```

---

## 🎨 **VISUAL INDICATORS**

### **Certificate Type Indicators:**
- 🟢 **Green Circle:** Noran Certified (على بطاقة الشركة)
- 🟡 **Yellow Circle:** Client Certified (على بطاقة العميل)

Display these circles:
- On UCR request cards
- On export shipment cards
- At top of certificate documents
- In shipment tracking page

---

## 📋 **REGULATORY BODIES (الجهات الرقابية)**

Complete list for dropdown/selection:

1. **الهيئة العامة للرقابة على الصادرات والواردات** (GOEIC)
2. **الهيئة القومية لسلامة الغذاء** (Food Safety Authority - FSA)
3. **الحجر الزراعي** (Agricultural Quarantine)
4. **الحجر البيطري** (Veterinary Quarantine)
5. **جهاز تنظيم الاتصالات** (Telecom Regulatory Authority)
6. **هيئة الطاقة الذرية المصرية** (Atomic Energy Authority)
7. **هيئة الدواء المصرية** (Egyptian Drug Authority)
8. **مصلحة الرقابة الصناعية** (Industrial Control Authority)
9. **مصلحة دمغ المصوغات والموازين** (Hallmarking & Weights Authority)
10. **جهاز حماية المستهلك** (Consumer Protection Authority)
11. **جهاز حماية المنافسة** (Competition Protection Authority)
12. **جهاز الرقابة على المصنفات الفنية** (Artistic Works Censorship)
13. **جهاز الرقابة على الصحف والمطبوعات** (Press & Publications Censorship)
14. **جهاز شئون البيئة** (Environmental Affairs Agency)
15. **جهاز مكافحة الدعم والإغراق والوقاية** (Anti-Dumping Authority)
16. **جهاز حماية وتنمية البحيرات والثروة السمكية** (Lakes & Fish Protection)
17. **الهيئة العامة للطرق والكباري والنقل البري** (Roads & Bridges Authority)

---

## 🔐 **API ENDPOINTS SUMMARY**

### **UCR Requests:**
- `POST /api/ucr-requests` - Create new UCR request
- `GET /api/ucr-requests` - Get all UCR requests (with filters)
- `GET /api/ucr-requests/:id` - Get specific UCR request
- `PUT /api/ucr-requests/:id/extract-ucr` - Employee: Set UCR number
- `PUT /api/ucr-requests/:id/upload-documents` - Employee: Upload Noran documents
- `PUT /api/ucr-requests/:id/set-regulatory-body` - Employee: Set regulatory body
- `PUT /api/ucr-requests/:id/set-form-46` - Employee: Set form 46 number
- `PUT /api/ucr-requests/:id/mark-ready-to-ship` - Employee: Mark ready
- `PUT /api/ucr-requests/:id/upload-certificate-of-origin` - Employee: Upload cert
- `PUT /api/ucr-requests/:id/complete` - Employee: Mark complete

### **Export Shipments:**
- `POST /api/export-shipments` - Create export shipment (auto from UCR)
- `GET /api/export-shipments` - Get all export shipments (with filters)
- `GET /api/export-shipments/:id` - Get specific shipment
- `PUT /api/export-shipments/:id/update-status` - Employee: Update status
- `GET /api/export-shipments/:id/history` - Get status history
- `PUT /api/export-shipments/:id/upload-document` - Upload document

### **User Profile:**
- `PUT /api/users/profile` - Update profile (include exportCertificationType)

### **Documents:**
- `POST /api/uploads` - Upload document (with ucr or export shipment link)
- `GET /api/uploads/:id` - Get document presigned URL

---

## ⚠️ **IMPORTANT BUSINESS RULES**

1. **Fee Calculation (Noran Certified ONLY):**
   ```javascript
   exportFee = Math.max(valueInEGP * 0.10, 3500)
   // Example: 50,000 EGP → 5,000 EGP fee
   // Example: 20,000 EGP → 3,500 EGP fee (minimum)
   ```

2. **Certificate of Origin Timing:**
   - Only appears after shipment is "ready_to_ship"
   - Must wait 3 days before uploading
   - Calculation: `if (Date.now() - readyToShipAt >= 3 days)`

3. **Document Requirements:**
   - **Noran Certified:** Bank waiver, invoice, packing list
   - **Client Certified:** Own invoice, shipping permit, AWB/B/L

4. **Automatic Industrial Record:**
   - If client type is "factory" (مصنع)
   - System auto-pulls industrial record from registration docs
   - No need for client to re-upload

5. **Sea vs Air Fields:**
   - **Air:** Only basic fields
   - **Sea:** Additional fields (containers, weight unit, etc.)

6. **Status Cannot Skip:**
   - Must follow workflow order
   - Cannot mark "ready to ship" before "form 46"
   - Cannot upload certificate before 3-day waiting period

---

## 📱 **NAVIGATION STRUCTURE UPDATE**

### **Update Header/Sidebar:**

**Current:**
```
- Home (Shipments)
- ACID Request
- Documents
- Profile
```

**New Structure:**
```
┌─ Import (وارد) ─────────────┐
│  - ACID Requests            │
│  - Import Shipments (Air)   │
│  - Import Shipments (Sea)   │
└──────────────────────────────┘

┌─ Export (صادر) ─────────────┐
│  - UCR Requests             │
│  - Export Shipments (Air)   │
│  - Export Shipments (Sea)   │
└──────────────────────────────┘

- Documents
- Profile
- Settings
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Phase 1: Database & Backend**
- [ ] Create UCRRequest schema
- [ ] Create ExportShipment schema
- [ ] Update User schema (add exportCertificationType)
- [ ] Update Upload schema (new categories)
- [ ] Create UCR request API endpoints
- [ ] Create export shipment API endpoints
- [ ] Update user profile API
- [ ] Add fee calculation logic
- [ ] Add certificate of origin timing logic
- [ ] Add regulatory body validation

### **Phase 2: Client Frontend**
- [ ] UCRRequestPage component
- [ ] UCRRequestsPage (list)
- [ ] UCRRequestDetailsPage
- [ ] ExportShipmentsPage
- [ ] ExportShipmentTrackingPage
- [ ] Update ClientProfilePage (add certification toggle)
- [ ] Update navigation (Import/Export sections)
- [ ] Add visual indicators (green/yellow circles)

### **Phase 3: Employee Frontend**
- [ ] EmployeeUCRManagementPage
- [ ] EmployeeUCRProcessingPage
- [ ] EmployeeExportShipmentPage
- [ ] Add regulatory bodies dropdown
- [ ] Add document generation/upload for Noran certified
- [ ] Add form 46 entry
- [ ] Add certificate of origin upload (with 3-day check)

### **Phase 4: Testing & Polish**
- [ ] Test Noran Certified Air flow
- [ ] Test Client Certified Air flow
- [ ] Test Sea shipments (both types)
- [ ] Test fee calculations
- [ ] Test regulatory body flows
- [ ] Test certificate of origin timing
- [ ] Test notifications
- [ ] Test document uploads/downloads
- [ ] Test status progression validation

---

## 🎯 **KEY DIFFERENCES FROM IMPORT SYSTEM**

| Feature | Import (ACID) | Export (UCR) |
|---------|--------------|--------------|
| License Type | ACID Number | UCR Number |
| Certification | N/A | Noran vs Client |
| Fees | Fixed fees | 10% fee (Noran) or None (Client) |
| Documents | Client uploads all | Noran creates some, Client uploads some |
| Regulatory | Standard customs | Multiple regulatory bodies |
| Certificate | Not required | Certificate of Origin required |
| Timing | Immediate | 3-day wait for certificate |
| Visual Indicator | None | Green/Yellow circles |

---

This guide provides the complete, accurate implementation details based on the Al-Noran-Update.md document. Each page, schema, and workflow is detailed with exact requirements.
