# Al-Noran S3 Upload System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                          │
│                    (React Frontend / Mobile App)                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP POST with JWT Token
                             │ multipart/form-data
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER                              │
│                     (Node.js Backend API)                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  uploadS3Routes.js                            │ │
│  │  POST /api/uploads                                           │ │
│  │  GET  /api/uploads?filters                                   │ │
│  │  GET  /api/uploads/:id                                       │ │
│  │  DELETE /api/uploads/:id                                     │ │
│  └────────────────────────┬─────────────────────────────────────┘ │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Multer Middleware (Memory Storage)               │ │
│  │  - Validates file type (PDF, images, docs)                   │ │
│  │  - Checks file size (max 10MB)                               │ │
│  │  - Stores file in memory buffer                              │ │
│  └────────────────────────┬─────────────────────────────────────┘ │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │             uploadS3Controller.js                             │ │
│  │  1. Extract user info from JWT                               │ │
│  │  2. Validate category & required fields                      │ │
│  │  3. Generate S3 key (folder structure)                       │ │
│  │  4. Upload buffer to S3                                      │ │
│  │  5. Save metadata to MongoDB                                 │ │
│  │  6. Generate presigned URL                                   │ │
│  │  7. Return response with URLs                                │ │
│  └────────────┬────────────────────────┬────────────────────────┘ │
│               │                        │                           │
└───────────────┼────────────────────────┼───────────────────────────┘
                │                        │
                │                        │
     ┌──────────▼──────────┐  ┌─────────▼──────────┐
     │    AWS S3 Bucket    │  │  MongoDB Database  │
     │   (me-south-1)      │  │  (Upload Model)    │
     │                     │  │                    │
     │  noran-uploads/     │  │  {                 │
     │  ├─ clients/        │  │    userId,         │
     │  ├─ employees/      │  │    userType,       │
     │  └─ admin/          │  │    category,       │
     │                     │  │    s3Key,          │
     │  [Private ACL]      │  │    url,            │
     │  [Presigned URLs]   │  │    mimetype,       │
     └─────────────────────┘  │    size,           │
                              │    uploadedAt      │
                              │  }                 │
                              └────────────────────┘
```

---

## Upload Flow (Detailed)

```
1. USER INITIATES UPLOAD
   └─> Selects file from device
   └─> Chooses category (registration/acid/shipment/invoice/archive)
   └─> Clicks "Upload" button

2. FRONTEND PROCESSING
   └─> Creates FormData object
   └─> Appends file and metadata
   └─> Adds JWT token to Authorization header
   └─> Sends POST request to /api/uploads

3. BACKEND RECEIVES REQUEST
   └─> Express server receives multipart/form-data
   └─> JWT middleware validates user authentication
   └─> Multer middleware processes file
       ├─> Checks file type (PDF, image, doc, excel)
       ├─> Validates file size (max 10MB)
       └─> Stores in memory buffer (req.file.buffer)

4. CONTROLLER PROCESSING
   └─> uploadS3Controller.uploadFile() executes
       ├─> Extract userId from JWT token
       ├─> Fetch user details from database
       ├─> Validate category and relatedId
       ├─> Determine userType and clientType
       └─> Continue to S3 upload

5. S3 KEY GENERATION
   └─> generateS3Key() creates folder structure
       ├─> Example: clients/{userId}/registration/{timestamp}_{filename}
       ├─> Sanitizes special characters
       ├─> Adds timestamp for uniqueness
       └─> Returns full S3 key path

6. S3 UPLOAD
   └─> uploadToS3() sends file to AWS
       ├─> Creates PutObjectCommand
       ├─> Sets ContentType from mimetype
       ├─> Sets ACL to "private"
       ├─> Sends file buffer to S3
       └─> Returns S3 URL

7. DATABASE SAVE
   └─> Create Upload document
       ├─> userId, userType, clientType
       ├─> category, documentType, relatedId
       ├─> s3Key, url, mimetype, size
       ├─> timestamps and metadata
       └─> Save to MongoDB

8. PRESIGNED URL GENERATION
   └─> getPresignedUrl() creates temporary link
       ├─> Valid for 1 hour (3600 seconds)
       ├─> Allows direct S3 access without making bucket public
       └─> Returns signed URL with query parameters

9. RESPONSE TO CLIENT
   └─> Return JSON response
       ├─> Upload ID and metadata
       ├─> Presigned URL for immediate access
       ├─> Static URL (requires presigning to access)
       └─> Success message

10. CLIENT HANDLES RESPONSE
    └─> Display success message
    └─> Show file preview with presigned URL
    └─> Update UI with upload metadata
    └─> Store upload ID for future reference
```

---

## Folder Structure by User Type

```
FACTORY CLIENT (مصنع)
────────────────────────────────────────────────────
clients/{userId}/
├── registration/
│   ├── commercial_register.pdf       ✅ Required
│   ├── tax_card.pdf                 ✅ Required
│   ├── contract.pdf                 ✅ Required
│   ├── industrial_register.pdf      ✅ Required
│   ├── certificate_vat.pdf          ✅ Required
│   ├── production_supplies.jpg      ✅ Required
│   ├── power_of_attorney.pdf        ✅ Required
│   └── personal_id_of_representative.pdf ✅ Required
├── acid/
│   └── ACID-001/
│       └── proforma_invoice.pdf
├── shipments/
│   └── SHIP-0001/
│       ├── bill_of_lading.pdf
│       └── delivery_permit.pdf
└── archive/
    └── old_contract.pdf


COMMERCIAL CLIENT (تجاري)
────────────────────────────────────────────────────
clients/{userId}/
├── registration/
│   ├── commercial_register.pdf       ✅ Required
│   ├── tax_card.pdf                 ✅ Required
│   ├── contract.pdf                 ✅ Required
│   ├── certificate_vat.pdf          ✅ Required
│   ├── import_export_card.pdf       ✅ Required
│   ├── power_of_attorney.pdf        ✅ Required
│   ├── personal_id_of_representative.pdf ✅ Required
│   └── trade_certificates.pdf       ✅ Required
├── acid/
├── shipments/
└── archive/


PERSONAL CLIENT (فردي)
────────────────────────────────────────────────────
clients/{userId}/
├── registration/
│   ├── power_of_attorney.pdf        ✅ Required
│   ├── personal_id.jpg              ✅ Required
│   └── sample_document.pdf          ✅ Required
├── acid/
├── shipments/
└── archive/


EMPLOYEE
────────────────────────────────────────────────────
employees/{userId}/
├── shipments/
│   └── SHIP-0001/
│       └── delivery_permit.pdf
└── invoices/
    └── INV-2024-001/
        └── invoice.pdf


ADMIN
────────────────────────────────────────────────────
admin/
└── archive/
    ├── monthly_report_october.pdf
    ├── system_backup.pdf
    └── audit_log.pdf
```

---

## Data Flow: Check Required Documents

```
┌─────────────┐
│   Client    │
│  Frontend   │
└──────┬──────┘
       │
       │ GET /api/uploads/check-required/{userId}
       │
       ▼
┌─────────────────────────────────────────────┐
│        uploadS3Controller.js                │
│                                             │
│  1. Find user by userId                     │
│  2. Get clientType (factory/commercial/     │
│     personal)                               │
│  3. Call Upload.getRequiredDocuments()      │
│     → Returns array of required docs        │
│  4. Query uploaded docs from MongoDB        │
│  5. Compare required vs uploaded            │
│  6. Calculate missing documents             │
│  7. Return completion status                │
└──────┬──────────────────────────────────────┘
       │
       │ JSON Response
       │ {
       │   completed: true/false,
       │   missing: [...],
       │   uploaded: [...],
       │   required: [...]
       │ }
       ▼
┌─────────────┐
│   Client    │
│  Display    │
│  Progress   │
│  Bar        │
└─────────────┘

Example Response for Factory Client (2 missing docs):
{
  "success": true,
  "clientType": "factory",
  "completed": false,
  "missing": ["industrial_register", "production_supplies"],
  "uploaded": [
    "commercial_register",
    "tax_card",
    "contract",
    "certificate_vat",
    "power_of_attorney",
    "personal_id_of_representative"
  ],
  "required": [
    "commercial_register",
    "tax_card",
    "contract",
    "industrial_register",
    "certificate_vat",
    "production_supplies",
    "power_of_attorney",
    "personal_id_of_representative"
  ]
}
```

---

## Security Model

```
┌───────────────────────────────────────────────────┐
│              SECURITY LAYERS                       │
└───────────────────────────────────────────────────┘

LAYER 1: Authentication (JWT)
────────────────────────────────────────────────
  ✓ User must be logged in
  ✓ Valid JWT token required
  ✓ Token contains userId and userType
  ✓ Middleware validates token on every request

LAYER 2: Authorization
────────────────────────────────────────────────
  ✓ Users can only access own uploads
  ✓ Admin can access all uploads
  ✓ Employee can access own and related uploads
  ✓ Validation in controller checks ownership

LAYER 3: File Validation
────────────────────────────────────────────────
  ✓ File type whitelist (PDF, images, docs)
  ✓ File size limit (10MB)
  ✓ Mimetype verification
  ✓ Extension sanitization

LAYER 4: S3 Bucket Security
────────────────────────────────────────────────
  ✓ Bucket is PRIVATE (no public access)
  ✓ Files use private ACL
  ✓ IAM user has minimal permissions
  ✓ Bucket policy restricts access

LAYER 5: Presigned URLs
────────────────────────────────────────────────
  ✓ Temporary access (1 hour expiry)
  ✓ Signed with AWS credentials
  ✓ Cannot be forged or modified
  ✓ Generated on-demand

LAYER 6: Data Validation
────────────────────────────────────────────────
  ✓ Category validation (enum)
  ✓ Required field checks
  ✓ relatedId validation for specific categories
  ✓ ClientType validation for registration

LAYER 7: Error Handling
────────────────────────────────────────────────
  ✓ Failed S3 uploads trigger cleanup
  ✓ Database errors rollback operations
  ✓ Detailed error logs (server-side only)
  ✓ Generic error messages to client
```

---

## File Type Support Matrix

```
┌──────────────┬─────────────┬──────────┬────────────┐
│  File Type   │  Extension  │  MIME    │  Max Size  │
├──────────────┼─────────────┼──────────┼────────────┤
│  PDF         │  .pdf       │  ✅      │   10 MB    │
│  JPEG        │  .jpg, .jpeg│  ✅      │   10 MB    │
│  PNG         │  .png       │  ✅      │   10 MB    │
│  GIF         │  .gif       │  ✅      │   10 MB    │
│  WEBP        │  .webp      │  ✅      │   10 MB    │
│  Word        │  .doc, .docx│  ✅      │   10 MB    │
│  Excel       │  .xls, .xlsx│  ✅      │   10 MB    │
│  Other       │  .txt, .zip │  ❌      │   N/A      │
└──────────────┴─────────────┴──────────┴────────────┘
```

---

## Category vs UserType Matrix

```
┌──────────────┬─────────┬──────────┬─────────┐
│   Category   │ Client  │ Employee │  Admin  │
├──────────────┼─────────┼──────────┼─────────┤
│ registration │   ✅    │    ❌    │   ❌    │
│ acid         │   ✅    │    ❌    │   ❌    │
│ shipment     │   ✅    │    ✅    │   ❌    │
│ invoice      │   ❌    │    ✅    │   ❌    │
│ archive      │   ✅    │    ❌    │   ✅    │
└──────────────┴─────────┴──────────┴─────────┘

Notes:
- Registration: Only clients upload during signup
- ACID: Client-specific import/export requests
- Shipment: Both clients and employees upload docs
- Invoice: Only employees generate/upload invoices
- Archive: Clients and admins store old documents
```

---

## MongoDB Schema Visual

```
┌─────────────────────────────────────────────────────┐
│                  Upload Document                    │
├─────────────────────────────────────────────────────┤
│  _id: ObjectId("67890abcdef1234567890abc")         │
│                                                     │
│  ┌─── User Information ───────────────────────┐    │
│  │  userId: ObjectId (ref: User)              │    │
│  │  userType: "client"                        │    │
│  │  clientType: "factory"                     │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  ┌─── File Categorization ────────────────────┐    │
│  │  category: "registration"                  │    │
│  │  documentType: "commercial_register"       │    │
│  │  relatedId: null                           │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  ┌─── File Information ───────────────────────┐    │
│  │  filename: "commercial_register.pdf"       │    │
│  │  originalname: "commercial_register.pdf"   │    │
│  │  s3Key: "clients/68ed.../registration/..." │    │
│  │  url: "https://noran-uploads.s3..."       │    │
│  │  mimetype: "application/pdf"               │    │
│  │  size: 2458624                             │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  ┌─── Metadata ────────────────────────────────┐   │
│  │  uploadedBy: ObjectId                       │   │
│  │  description: "Commercial register..."      │   │
│  │  tags: ["registration", "legal", "required"]│   │
│  │  isActive: true                             │   │
│  │  uploadedAt: ISODate("2024-10-31T10:30:00")│   │
│  │  createdAt: ISODate("2024-10-31T10:30:00") │   │
│  │  updatedAt: ISODate("2024-10-31T10:30:00") │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

Indexes:
  - userId + category (compound)
  - s3Key (unique)
  - userType
  - category
  - relatedId
  - uploadedAt (descending)
```

---

## API Response Structures

### Successful Upload Response
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "upload": {
    "id": "67890abcdef1234567890abc",
    "filename": "commercial_register.pdf",
    "s3Key": "clients/68ed.../registration/1698765432000_commercial_register.pdf",
    "url": "https://noran-uploads.s3.me-south-1.amazonaws.com/.../...",
    "category": "registration",
    "documentType": "commercial_register",
    "size": 2458624,
    "mimetype": "application/pdf",
    "uploadedAt": "2024-10-31T10:30:00.000Z"
  }
}
```

### List Uploads Response
```json
{
  "success": true,
  "count": 3,
  "uploads": [
    {
      "_id": "...",
      "userId": {
        "fullname": "John Doe",
        "email": "john@example.com"
      },
      "category": "registration",
      "filename": "commercial_register.pdf",
      "s3Key": "...",
      "presignedUrl": "https://...?X-Amz-Signature=...",
      "size": 2458624,
      "uploadedAt": "2024-10-31T10:30:00Z"
    },
    ...
  ]
}
```

### Error Response
```json
{
  "message": "File type not allowed. Only PDF, Images, Word, and Excel files are allowed"
}
```

---

This diagram provides a comprehensive visual overview of the entire S3 upload system architecture, data flow, and security model. Use it as a reference when implementing or debugging the system.
