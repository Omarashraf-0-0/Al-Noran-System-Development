# AWS S3 Upload System - Quick Setup Guide

## Step 1: Install Dependencies
```bash
cd Web/backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Step 2: Configure AWS Credentials

### Option A: Get Credentials from AWS Console (Recommended for Production)
1. Login to AWS: https://359671834383.signin.aws.amazon.com/console
2. Username: `noran-backend-user`
3. Password: `cDU4]8+4`
4. Go to IAM → Users → noran-backend-user → Security credentials
5. Create Access Key → Application running outside AWS
6. Copy Access Key ID and Secret Access Key

### Option B: Use Existing Keys (If Already Created)
If you already have access keys, skip AWS Console and proceed to Step 3.

## Step 3: Update .env File
Add these lines to `Web/backend/.env`:
```env
# AWS S3 Configuration
AWS_REGION=me-south-1
AWS_S3_BUCKET_NAME=noran-uploads
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
```

## Step 4: Create S3 Bucket (If Not Exists)
1. Login to AWS Console
2. Go to S3 service
3. Click "Create bucket"
4. Bucket name: `noran-uploads`
5. Region: `Middle East (Bahrain) me-south-1`
6. Block all public access: ✅ CHECKED
7. Create bucket

## Step 5: Set Bucket CORS (For Direct Browser Uploads - Optional)
If you plan to upload directly from browser (not recommended for security):
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT"],
        "AllowedOrigins": ["http://localhost:5173", "http://localhost:3000"],
        "ExposeHeaders": ["ETag"]
    }
]
```

## Step 6: Mount Routes in server.js
```javascript
// Add this line with other route imports
const uploadS3Routes = require('./routes/uploadS3Routes');

// Mount the route
app.use('/api/uploads', uploadS3Routes);
```

## Step 7: Add Authentication Middleware (Important!)
Edit `Web/backend/src/routes/uploadS3Routes.js`:
```javascript
// Add at the top
const { protect } = require("../middleware/auth"); // Your auth middleware

// Apply to all routes
router.use(protect);
```

## Step 8: Test the Setup
1. Start backend server:
```bash
npm run dev
```

2. Test with Postman:
```
POST http://localhost:3500/api/uploads
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: multipart/form-data
Body (form-data):
  file: [select a PDF or image file]
  category: registration
  documentType: commercial_register
```

## Step 9: Verify Upload
Check AWS S3 Console → noran-uploads bucket → You should see your file in the appropriate folder structure.

## Quick Test Script
Create `Web/backend/src/testing/testS3Upload.js`:
```javascript
require('dotenv').config();
const { uploadToS3, generateS3Key } = require('../utils/s3Helpers');
const fs = require('fs');

async function testUpload() {
  try {
    // Read a test file
    const fileBuffer = fs.readFileSync('./test.pdf'); // Create a test.pdf in backend folder
    
    // Generate S3 key
    const s3Key = generateS3Key({
      userId: '68ed5439b5d0fbe15fbdfc19',
      userType: 'client',
      category: 'registration',
      relatedId: null,
      filename: 'test.pdf',
      clientType: 'factory'
    });
    
    console.log('S3 Key:', s3Key);
    
    // Upload to S3
    const result = await uploadToS3({
      fileBuffer,
      s3Key,
      mimetype: 'application/pdf'
    });
    
    console.log('Upload Result:', result);
  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

testUpload();
```

Run test:
```bash
node src/testing/testS3Upload.js
```

## Troubleshooting

### Error: "Missing credentials in config"
- Double check `.env` file has AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- Restart server after updating .env
- Ensure dotenv is loaded: `require('dotenv').config()`

### Error: "Access Denied"
- IAM user needs S3 permissions
- Check bucket name matches exactly
- Verify region is correct (me-south-1)

### Error: "The specified bucket does not exist"
- Create bucket in AWS Console
- Bucket name must be `noran-uploads` (or update in .env)
- Ensure bucket is in me-south-1 region

### Error: "File too large"
- Default max size is 10 MB
- Adjust in `middleware/multerS3.js`: `limits: { fileSize: 20 * 1024 * 1024 }`

## Next Steps
1. Implement authentication middleware on routes
2. Create frontend upload components
3. Test all document types for each client type
4. Implement progress indicators
5. Add file preview functionality
6. Set up S3 lifecycle policies (archive old files)
7. Monitor AWS costs

## Important Security Notes
⚠️ **NEVER commit AWS credentials to Git**
⚠️ **Always use private ACL for S3 objects**
⚠️ **Generate presigned URLs for file access**
⚠️ **Implement rate limiting on upload endpoints**
⚠️ **Validate file types and sizes**
⚠️ **Rotate AWS access keys regularly**

## Files Created
```
src/
├── config/
│   └── s3Config.js                 # S3 client configuration
├── controllers/
│   └── uploadS3Controller.js       # Upload business logic
├── middleware/
│   └── multerS3.js                 # Multer configuration for S3
├── models/
│   └── upload.js                   # Updated Upload schema
├── routes/
│   └── uploadS3Routes.js           # Upload API routes
├── utils/
│   └── s3Helpers.js                # S3 utility functions
└── examples/
    └── uploadExamples.js           # Example documents
```

## Ready to Go!
Your S3 upload system is now ready. Start uploading files and they'll be securely stored in AWS S3 with metadata in MongoDB.

For detailed API documentation, see `UPLOAD_S3_DOCUMENTATION.md`
