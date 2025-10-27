# 📋 S3 Upload System - Quick Reference Card

## 🚀 Installation
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 🔑 Environment Variables (.env)
```env
AWS_REGION=me-south-1
AWS_S3_BUCKET_NAME=noran-uploads
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
```

## 🌐 API Endpoints

### Upload Single File
```http
POST /api/uploads
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- file: File
- category: registration|acid|shipment|invoice|archive
- relatedId: String (optional)
- documentType: String (optional)
- description: String (optional)
- tags: Array (optional)
```

### Upload Multiple Files
```http
POST /api/uploads/multiple
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- files: File[] (max 10)
- category: String
- relatedId: String (optional)
```

### Get Uploads
```http
GET /api/uploads?userId={id}&category={cat}&relatedId={id}
Authorization: Bearer {token}
```

### Get Single Upload
```http
GET /api/uploads/{uploadId}
Authorization: Bearer {token}
```

### Delete Upload
```http
DELETE /api/uploads/{uploadId}
Authorization: Bearer {token}
```

### Check Required Documents
```http
GET /api/uploads/check-required/{userId}
Authorization: Bearer {token}
```

## 📂 S3 Key Structure

```
Clients:
  clients/{userId}/registration/{timestamp}_{filename}
  clients/{userId}/acid/{acidId}/{timestamp}_{filename}
  clients/{userId}/shipments/{shipmentId}/{timestamp}_{filename}
  clients/{userId}/archive/{timestamp}_{filename}

Employees:
  employees/{userId}/shipments/{shipmentId}/{timestamp}_{filename}
  employees/{userId}/invoices/{invoiceId}/{timestamp}_{filename}

Admin:
  admin/archive/{timestamp}_{filename}
```

## 📄 Document Types by Client

### Factory (مصنع) - 8 docs
- commercial_register, tax_card, contract
- industrial_register, certificate_vat
- production_supplies, power_of_attorney
- personal_id_of_representative

### Commercial (تجاري) - 8 docs
- commercial_register, tax_card, contract
- certificate_vat, import_export_card
- power_of_attorney, personal_id_of_representative
- trade_certificates

### Personal (فردي) - 3 docs
- power_of_attorney
- personal_id
- sample_document

## ✅ Allowed File Types
- PDF, JPG, PNG, GIF, WEBP
- Word (DOC, DOCX)
- Excel (XLS, XLSX)
- Max size: 10 MB

## 🔐 Security
- ✅ Private S3 bucket
- ✅ Presigned URLs (1 hour expiry)
- ✅ JWT authentication required
- ✅ File validation (type + size)
- ✅ Soft delete capability

## 🧪 Postman Test
```
POST http://localhost:3500/api/uploads
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
Body (form-data):
  file: [select PDF or image]
  category: registration
  documentType: commercial_register
```

## 🔧 Troubleshooting

| Error | Solution |
|-------|----------|
| Missing credentials | Check .env file, restart server |
| Access Denied | Verify IAM permissions |
| Bucket not found | Create bucket in AWS Console |
| File too large | Max 10 MB per file |
| Invalid category | Must be: registration, acid, shipment, invoice, archive |

## 📱 Frontend Example
```javascript
// Upload file
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('category', 'registration');
formData.append('documentType', 'commercial_register');

const response = await axios.post('/api/uploads', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`
  }
});

console.log('Presigned URL:', response.data.upload.url);
```

## 🌍 AWS Console
- URL: https://359671834383.signin.aws.amazon.com/console
- User: noran-backend-user
- Password: cDU4]8+4

## 📚 Full Documentation
- **UPLOAD_S3_DOCUMENTATION.md** - Complete API docs
- **SETUP_S3_GUIDE.md** - Setup instructions
- **src/examples/uploadExamples.js** - Example documents

## ⚡ Quick Start Checklist
- [ ] Install AWS SDK packages
- [ ] Add AWS credentials to .env
- [ ] Create S3 bucket (noran-uploads)
- [ ] Set bucket to private
- [ ] Add auth middleware to routes
- [ ] Test upload with Postman
- [ ] Verify file in S3 Console
- [ ] Implement frontend upload

---
**Need Help?** Check UPLOAD_S3_DOCUMENTATION.md for detailed guides!
