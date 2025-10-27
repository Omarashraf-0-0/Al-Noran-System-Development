# Al-Noran S3 Upload System Documentation

## Overview
This document describes the AWS S3-based file upload system for the Al-Noran MERN application. All files are stored in AWS S3 (Middle East region - me-south-1) with metadata stored in MongoDB.

---

## Table of Contents
1. [Setup & Installation](#setup--installation)
2. [AWS S3 Configuration](#aws-s3-configuration)
3. [Database Schema](#database-schema)
4. [S3 Key Naming Convention](#s3-key-naming-convention)
5. [API Endpoints](#api-endpoints)
6. [Required Documents](#required-documents)
7. [Usage Examples](#usage-examples)
8. [Security & Best Practices](#security--best-practices)

---

## Setup & Installation

### 1. Install Required Packages
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Configure Environment Variables
Add the following to your `.env` file:
```env
AWS_REGION=me-south-1
AWS_S3_BUCKET_NAME=noran-uploads
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

### 3. Create S3 Bucket
- Login to AWS Console: https://359671834383.signin.aws.amazon.com/console
- Username: noran-backend-user
- Password: cDU4]8+4
- Create bucket named `noran-uploads` in `me-south-1` region
- Set bucket to **private** (use presigned URLs for access)

### 4. Mount Routes in server.js
```javascript
const uploadS3Routes = require('./routes/uploadS3Routes');
app.use('/api/uploads', uploadS3Routes);
```

---

## AWS S3 Configuration

### IAM User Permissions
The IAM user needs these S3 permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::noran-uploads/*",
        "arn:aws:s3:::noran-uploads"
      ]
    }
  ]
}
```

### S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::noran-uploads/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalAccount": "359671834383"
        }
      }
    }
  ]
}
```

---

## Database Schema

### Upload Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | ObjectId | ✅ | Reference to User |
| `userType` | String | ✅ | client \| employee \| admin |
| `clientType` | String | ❌ | factory \| commercial \| personal |
| `category` | String | ✅ | registration \| acid \| shipment \| invoice \| archive |
| `documentType` | String | ❌ | Type of document (see list below) |
| `relatedId` | String | ❌ | shipmentId \| acidId \| invoiceId |
| `filename` | String | ✅ | Original filename |
| `originalname` | String | ✅ | Original filename |
| `s3Key` | String | ✅ | S3 object key (path) |
| `url` | String | ✅ | S3 URL (static, requires presigning) |
| `mimetype` | String | ✅ | File MIME type |
| `size` | Number | ✅ | File size in bytes |
| `uploadedBy` | ObjectId | ❌ | User who uploaded |
| `description` | String | ❌ | File description |
| `tags` | Array | ❌ | Tags for categorization |
| `isActive` | Boolean | ✅ | Soft delete flag |
| `uploadedAt` | Date | ✅ | Upload timestamp |

### Document Types
```javascript
// Factory documents (مصنع)
"commercial_register"           // السجل التجاري
"tax_card"                      // البطاقة الضريبية
"contract"                      // العقد
"industrial_register"           // السجل الصناعي
"certificate_vat"               // شهادة القيمة المضافة
"production_supplies"           // مستلزمات الإنتاج
"power_of_attorney"             // التوكيل
"personal_id_of_representative" // بطاقة ممثل/مندوب

// Commercial documents (تجاري)
"import_export_card"            // بطاقة استيراد/تصدير
"trade_certificates"            // شهادات تجارية

// Personal documents (فردي)
"personal_id"                   // البطاقة الشخصية
"sample_document"               // مستند داعم

// Shipment documents
"bill_of_lading"
"delivery_permit"
"discharge_docs"
"proforma_invoice"

// Other
"invoice"
"report"
"other"
```

---

## S3 Key Naming Convention

### Format Rules
All S3 keys follow this pattern: `{userType}/{userId}/{category}/{relatedId?}/{timestamp}_{filename}`

### Client Keys
```
clients/{userId}/registration/{timestamp}_{filename}
clients/{userId}/acid/{acidId}/{timestamp}_{filename}
clients/{userId}/shipments/{shipmentId}/{timestamp}_{filename}
clients/{userId}/archive/{timestamp}_{filename}
```

**Examples:**
- `clients/68ed5439b5d0fbe15fbdfc19/registration/1698765432000_commercial_register.pdf`
- `clients/68ed5439b5d0fbe15fbdfc19/acid/ACID-001/1698765555000_proforma_invoice.pdf`
- `clients/68ed5439b5d0fbe15fbdfc19/shipments/SHIP-0001/1698765678000_bill_of_lading.pdf`

### Employee Keys
```
employees/{userId}/shipments/{shipmentId}/{timestamp}_{filename}
employees/{userId}/invoices/{invoiceId}/{timestamp}_{filename}
```

**Examples:**
- `employees/69ed5439b5d0fbe15fbdfc20/invoices/INV-2024-001/1698766666000_invoice.pdf`
- `employees/69ed5439b5d0fbe15fbdfc20/shipments/SHIP-0001/1698767777000_delivery_permit.pdf`

### Admin Keys
```
admin/archive/{timestamp}_{filename}
```

**Example:**
- `admin/archive/1698769999000_monthly_report_october_2024.pdf`

---

## API Endpoints

### 1. Upload Single File
**POST** `/api/uploads`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}
```

**Body (form-data):**
- `file`: File (required)
- `category`: String (required) - registration | acid | shipment | invoice | archive
- `relatedId`: String (optional) - Required for acid, shipment, invoice
- `documentType`: String (optional)
- `description`: String (optional)
- `tags`: String[] or JSON string (optional)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "upload": {
    "id": "67890abcdef1234567890abc",
    "filename": "commercial_register.pdf",
    "s3Key": "clients/68ed.../registration/1698765432000_commercial_register.pdf",
    "url": "https://noran-uploads.s3.me-south-1.amazonaws.com/...",
    "category": "registration",
    "documentType": "commercial_register",
    "size": 2458624,
    "mimetype": "application/pdf",
    "uploadedAt": "2024-10-31T10:30:00Z"
  }
}
```

---

### 2. Upload Multiple Files
**POST** `/api/uploads/multiple`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}
```

**Body (form-data):**
- `files`: File[] (required) - max 10 files
- `category`: String (required)
- `relatedId`: String (optional)
- `description`: String (optional)
- `tags`: String[] or JSON string (optional)

**Response:**
```json
{
  "success": true,
  "message": "3 file(s) uploaded successfully",
  "uploads": [
    {
      "id": "...",
      "filename": "file1.pdf",
      "s3Key": "...",
      "url": "...",
      "size": 123456,
      "mimetype": "application/pdf"
    }
  ],
  "errors": []
}
```

---

### 3. Get Uploads (List with Filters)
**GET** `/api/uploads`

**Query Parameters:**
- `userId`: String (optional)
- `category`: String (optional)
- `relatedId`: String (optional)
- `userType`: String (optional)
- `documentType`: String (optional)

**Response:**
```json
{
  "success": true,
  "count": 5,
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
      "presignedUrl": "https://noran-uploads.s3...?X-Amz-Signature=...",
      "size": 2458624,
      "uploadedAt": "2024-10-31T10:30:00Z"
    }
  ]
}
```

---

### 4. Get Single Upload by ID
**GET** `/api/uploads/:id`

**Response:**
```json
{
  "success": true,
  "upload": {
    "_id": "...",
    "userId": {...},
    "filename": "commercial_register.pdf",
    "s3Key": "...",
    "presignedUrl": "https://...",
    "size": 2458624,
    "uploadedAt": "2024-10-31T10:30:00Z"
  }
}
```

---

### 5. Delete Upload
**DELETE** `/api/uploads/:id`

**Response:**
```json
{
  "success": true,
  "message": "Upload deleted successfully"
}
```

---

### 6. Check Required Documents
**GET** `/api/uploads/check-required/:userId`

**Response:**
```json
{
  "success": true,
  "clientType": "factory",
  "completed": false,
  "missing": ["industrial_register", "production_supplies"],
  "uploaded": ["commercial_register", "tax_card", "contract", "certificate_vat", "power_of_attorney", "personal_id_of_representative"],
  "required": ["commercial_register", "tax_card", "contract", "industrial_register", "certificate_vat", "production_supplies", "power_of_attorney", "personal_id_of_representative"]
}
```

---

## Required Documents

### Factory (مصنع) - 8 Documents
1. `commercial_register` - السجل التجاري
2. `tax_card` - البطاقة الضريبية
3. `contract` - العقد
4. `industrial_register` - السجل الصناعي
5. `certificate_vat` - شهادة القيمة المضافة
6. `production_supplies` - مستلزمات الإنتاج
7. `power_of_attorney` - التوكيل
8. `personal_id_of_representative` - بطاقة ممثل/مندوب

### Commercial (تجاري) - 8 Documents
1. `commercial_register` - السجل التجاري
2. `tax_card` - البطاقة الضريبية
3. `contract` - العقد
4. `certificate_vat` - شهادة القيمة المضافة
5. `import_export_card` - بطاقة استيراد/تصدير
6. `power_of_attorney` - التوكيل
7. `personal_id_of_representative` - بطاقة
8. `trade_certificates` - شهادات تجارية

### Personal (فردي) - 3 Documents
1. `power_of_attorney` - التوكيل
2. `personal_id` - البطاقة الشخصية
3. `sample_document` - مستند داعم

---

## Usage Examples

### Example 1: Client Uploads Commercial Register (Registration)
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('category', 'registration');
formData.append('documentType', 'commercial_register');
formData.append('description', 'Commercial register for factory');
formData.append('tags', JSON.stringify(['registration', 'legal', 'required']));

const response = await axios.post('/api/uploads', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 2: Employee Uploads Invoice
```javascript
const formData = new FormData();
formData.append('file', invoicePDF);
formData.append('category', 'invoice');
formData.append('relatedId', 'INV-2024-001');
formData.append('documentType', 'invoice');

const response = await axios.post('/api/uploads', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 3: Get All Registration Documents for a Client
```javascript
const response = await axios.get('/api/uploads', {
  params: {
    userId: '68ed5439b5d0fbe15fbdfc19',
    category: 'registration'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 4: Check Required Documents Status
```javascript
const response = await axios.get('/api/uploads/check-required/68ed5439b5d0fbe15fbdfc19', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.data.completed) {
  console.log('All required documents uploaded!');
} else {
  console.log('Missing documents:', response.data.missing);
}
```

---

## Security & Best Practices

### 1. File Validation
- **Allowed types:** PDF, Images (JPG, PNG, GIF, WEBP), Word, Excel
- **Max size:** 10 MB per file
- **Validation** happens in both multer middleware and controller

### 2. S3 Access Control
- **Bucket ACL:** Private
- **File ACL:** Private
- **Access method:** Presigned URLs (expires in 1 hour)
- **Never expose** AWS credentials in frontend

### 3. Authentication
- All endpoints require JWT authentication
- User can only access their own uploads (except admin)
- Implement `protect` middleware for route protection

### 4. Presigned URLs
- Generated on-demand for file access
- Default expiration: 3600 seconds (1 hour)
- Use for temporary download/view access
- Do not store presigned URLs (generate fresh ones)

### 5. Soft Delete
- Files are soft-deleted (isActive = false)
- Physical S3 deletion happens on request
- Allows recovery if needed

### 6. File Naming
- Timestamp prefix prevents collisions
- Special characters sanitized
- Preserves original extension

### 7. Error Handling
- Database save failures trigger S3 cleanup
- Batch uploads continue on individual failures
- Detailed error messages returned

### 8. Monitoring
- Log all S3 operations
- Monitor upload sizes and frequencies
- Set up S3 lifecycle policies for old files
- Enable S3 versioning for backup

---

## Integration Checklist

- [ ] Install AWS SDK packages
- [ ] Configure AWS credentials in `.env`
- [ ] Create S3 bucket in me-south-1 region
- [ ] Set bucket policy to private
- [ ] Create IAM user with S3 permissions
- [ ] Mount uploadS3Routes in server.js
- [ ] Add JWT authentication middleware to routes
- [ ] Test upload endpoint with Postman
- [ ] Test file retrieval with presigned URLs
- [ ] Implement frontend upload components
- [ ] Add progress indicators for uploads
- [ ] Handle network errors gracefully
- [ ] Implement retry logic for failed uploads
- [ ] Set up S3 lifecycle policies
- [ ] Configure CORS for S3 bucket (if direct upload needed)
- [ ] Monitor AWS costs and usage

---

## Troubleshooting

### Error: "Access Denied"
- Check AWS credentials in `.env`
- Verify IAM user has S3 permissions
- Confirm bucket name is correct

### Error: "No file uploaded"
- Ensure `Content-Type: multipart/form-data`
- Check file input field name matches ('file' or 'files')
- Verify file size is under 10 MB

### Error: "Invalid category"
- Category must be one of: registration, acid, shipment, invoice, archive
- Check spelling and case sensitivity

### Error: "relatedId required"
- Categories acid, shipment, invoice require relatedId
- Provide shipmentId, acidId, or invoiceId

### Presigned URL Expired
- Generate new presigned URL (default 1 hour expiry)
- Do not cache presigned URLs
- Request fresh URL when needed

---

## Support & Contact
For issues or questions, contact the development team or refer to AWS S3 documentation.

**AWS Console:** https://359671834383.signin.aws.amazon.com/console
**User:** noran-backend-user
