# ✅ S3 Upload System - Setup Checklist

Use this checklist to ensure everything is properly set up. Check off each item as you complete it.

---

## Phase 1: Installation & Configuration

### 1.1 Install Dependencies
- [ ] Navigate to backend folder: `cd Web/backend`
- [ ] Run: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- [ ] Verify installation: Check `package.json` for AWS packages
- [ ] No errors during installation

### 1.2 AWS Console Access
- [ ] Open: https://359671834383.signin.aws.amazon.com/console
- [ ] Login with username: `noran-backend-user`
- [ ] Login with password: `cDU4]8+4`
- [ ] Successfully logged in

### 1.3 Get AWS Credentials
- [ ] Navigate to: IAM → Users → noran-backend-user
- [ ] Click: Security credentials tab
- [ ] Click: Create access key
- [ ] Select: Application running outside AWS
- [ ] Copy Access Key ID
- [ ] Copy Secret Access Key
- [ ] **IMPORTANT:** Save both keys securely (can't retrieve secret later)

### 1.4 Update Environment Variables
- [ ] Open: `Web/backend/.env`
- [ ] Replace `AWS_ACCESS_KEY_ID=your_access_key_id_here` with actual key
- [ ] Replace `AWS_SECRET_ACCESS_KEY=your_secret_access_key_here` with actual secret
- [ ] Verify `AWS_REGION=me-south-1` is set
- [ ] Verify `AWS_S3_BUCKET_NAME=noran-uploads` is set
- [ ] Save file
- [ ] Restart backend server

---

## Phase 2: AWS S3 Setup

### 2.1 Create S3 Bucket
- [ ] In AWS Console, navigate to S3 service
- [ ] Click "Create bucket"
- [ ] Bucket name: `noran-uploads` (exact match)
- [ ] Region: `Middle East (Bahrain) me-south-1`
- [ ] **Block all public access:** ✅ CHECKED (all 4 boxes)
- [ ] Bucket Versioning: Disabled (or Enabled for backup)
- [ ] Encryption: Server-side encryption (default)
- [ ] Click "Create bucket"
- [ ] Bucket created successfully

### 2.2 Verify Bucket Settings
- [ ] Open bucket: noran-uploads
- [ ] Check "Permissions" tab
- [ ] "Block public access" shows: "On"
- [ ] No public bucket policy
- [ ] Bucket is private

### 2.3 Test Bucket Access (Optional)
- [ ] In bucket, click "Upload"
- [ ] Upload a test file manually
- [ ] File uploaded successfully
- [ ] Delete test file
- [ ] Bucket is working

---

## Phase 3: Code Integration

### 3.1 Verify Files Exist
- [ ] `src/config/s3Config.js` exists
- [ ] `src/controllers/uploadS3Controller.js` exists
- [ ] `src/middleware/multerS3.js` exists
- [ ] `src/models/upload.js` updated with S3 fields
- [ ] `src/routes/uploadS3Routes.js` exists
- [ ] `src/utils/s3Helpers.js` exists
- [ ] `src/server.js` has `/api/uploads` route mounted

### 3.2 Check Server.js
- [ ] Open: `src/server.js`
- [ ] Line exists: `app.use("/api/uploads", require("./routes/uploadS3Routes"));`
- [ ] Route is before 404 handler
- [ ] No syntax errors

### 3.3 Review Upload Model
- [ ] Open: `src/models/upload.js`
- [ ] Has field: `userId` (ObjectId)
- [ ] Has field: `userType` (String: client|employee|admin)
- [ ] Has field: `category` (String: registration|acid|shipment|invoice|archive)
- [ ] Has field: `s3Key` (String)
- [ ] Has field: `url` (String)
- [ ] Has method: `getRequiredDocuments()`
- [ ] Has method: `checkRequiredUploads()`

---

## Phase 4: Testing

### 4.1 Start Server
- [ ] Navigate to: `Web/backend`
- [ ] Run: `npm run dev`
- [ ] Server starts without errors
- [ ] No AWS credential errors
- [ ] MongoDB connected
- [ ] Server listening on port 3500 (or configured port)

### 4.2 Test with Postman - Upload File
- [ ] Open Postman
- [ ] Create new request: POST
- [ ] URL: `http://localhost:3500/api/uploads`
- [ ] Add Header: `Authorization: Bearer YOUR_JWT_TOKEN`
- [ ] Body type: form-data
- [ ] Add field: `file` (type: File) - select a PDF or image
- [ ] Add field: `category` (type: Text) - value: `registration`
- [ ] Add field: `documentType` (type: Text) - value: `commercial_register`
- [ ] Send request
- [ ] Response status: 201 Created
- [ ] Response has: `success: true`
- [ ] Response has: `upload` object with `s3Key` and `url`

### 4.3 Verify Upload in S3
- [ ] Go to AWS Console → S3 → noran-uploads
- [ ] Navigate to folder structure (clients/{userId}/registration/)
- [ ] File exists with timestamp prefix
- [ ] File size matches uploaded file
- [ ] Can download file from S3 console

### 4.4 Test Presigned URL
- [ ] Copy `url` from Postman response
- [ ] Paste in browser address bar
- [ ] File downloads or opens
- [ ] Presigned URL works

### 4.5 Test Get Uploads
- [ ] Postman: GET `http://localhost:3500/api/uploads`
- [ ] Add Header: `Authorization: Bearer YOUR_JWT_TOKEN`
- [ ] Send request
- [ ] Response has: `uploads` array
- [ ] Each upload has: `presignedUrl`
- [ ] List shows uploaded files

### 4.6 Test Check Required Documents
- [ ] Postman: GET `http://localhost:3500/api/uploads/check-required/{userId}`
- [ ] Replace `{userId}` with actual user ID
- [ ] Add Header: `Authorization: Bearer YOUR_JWT_TOKEN`
- [ ] Send request
- [ ] Response has: `clientType`, `completed`, `missing`, `uploaded`, `required`
- [ ] Data is accurate

### 4.7 Test Delete Upload
- [ ] Copy an upload `id` from previous test
- [ ] Postman: DELETE `http://localhost:3500/api/uploads/{id}`
- [ ] Add Header: `Authorization: Bearer YOUR_JWT_TOKEN`
- [ ] Send request
- [ ] Response: `success: true`
- [ ] File marked inactive in database
- [ ] File deleted from S3 (check console)

---

## Phase 5: Security & Authentication

### 5.1 Add JWT Middleware (Recommended)
- [ ] Have JWT authentication middleware ready
- [ ] Open: `src/routes/uploadS3Routes.js`
- [ ] Add at top: `const { protect } = require("../middleware/auth");`
- [ ] Add before routes: `router.use(protect);`
- [ ] Test that unauthenticated requests fail
- [ ] Test that authenticated requests succeed

### 5.2 Test Authorization
- [ ] User can only see their own uploads
- [ ] User cannot delete other users' uploads
- [ ] Admin can access all uploads (if role implemented)
- [ ] Unauthorized access returns 403/401

---

## Phase 6: Frontend Integration

### 6.1 Create Upload Component
- [ ] Create file upload input in React
- [ ] Handle file selection
- [ ] Create FormData object
- [ ] Send POST request to `/api/uploads`
- [ ] Include JWT token in headers
- [ ] Handle success response
- [ ] Display uploaded file info
- [ ] Handle errors gracefully

### 6.2 Display Uploaded Files
- [ ] Fetch uploads from `/api/uploads`
- [ ] Display list of files
- [ ] Show file names, sizes, upload dates
- [ ] Use presigned URLs for download links
- [ ] Add delete functionality

### 6.3 Required Documents Progress
- [ ] Fetch required docs status
- [ ] Display progress bar
- [ ] Show missing documents
- [ ] Highlight completed uploads
- [ ] Update in real-time after upload

---

## Phase 7: Production Readiness

### 7.1 Security Audit
- [ ] AWS credentials not in Git repository
- [ ] `.env` file in `.gitignore`
- [ ] S3 bucket is private
- [ ] Presigned URLs have reasonable expiry (1 hour)
- [ ] File size limits appropriate (10 MB)
- [ ] File type validation working
- [ ] JWT authentication on all routes

### 7.2 Error Handling
- [ ] Invalid file type shows clear error
- [ ] File too large shows clear error
- [ ] Missing required fields handled
- [ ] Network errors caught and logged
- [ ] S3 upload failures cleanup properly
- [ ] Database errors rollback operations

### 7.3 Monitoring & Logging
- [ ] Server logs S3 upload attempts
- [ ] Errors logged with details
- [ ] Success uploads logged
- [ ] AWS costs being monitored
- [ ] Set up AWS billing alerts

### 7.4 Documentation
- [ ] Team aware of new upload system
- [ ] API documentation shared
- [ ] Frontend developers know endpoints
- [ ] AWS access documented
- [ ] Troubleshooting guide available

---

## Phase 8: Optimization (Optional)

### 8.1 S3 Lifecycle Policies
- [ ] Set up archiving for old files
- [ ] Transition to S3 Glacier after 90 days
- [ ] Delete very old files after 1 year
- [ ] Cost savings implemented

### 8.2 Performance
- [ ] File upload progress indicators
- [ ] Parallel uploads for multiple files
- [ ] Retry logic for failed uploads
- [ ] Compress images before upload
- [ ] Optimize file sizes

### 8.3 Features
- [ ] File preview before upload
- [ ] Drag-and-drop upload
- [ ] Multiple file selection
- [ ] Upload queue management
- [ ] Notification on completion

---

## Verification Checklist

### ✅ System is Working When:
- [ ] Files upload without errors
- [ ] Files appear in S3 bucket
- [ ] Database records created
- [ ] Presigned URLs work
- [ ] List endpoint returns uploads
- [ ] Delete removes files
- [ ] Required docs check accurate
- [ ] No server errors in logs
- [ ] Frontend can upload files
- [ ] Users see their uploads

### ⚠️ Common Issues Fixed:
- [ ] AWS credentials error → Updated .env
- [ ] Bucket not found → Created bucket
- [ ] Access denied → Fixed IAM permissions
- [ ] File too large → Adjusted limits
- [ ] Invalid category → Used correct enum
- [ ] Presigned URL expired → Generate fresh

---

## Final Sign-Off

### Before Going to Production:
- [ ] All tests passed
- [ ] No errors in logs
- [ ] AWS costs acceptable
- [ ] Security audit complete
- [ ] Documentation updated
- [ ] Team trained
- [ ] Backup strategy in place
- [ ] Monitoring set up

### Production Deployment:
- [ ] Environment variables set
- [ ] AWS credentials secure
- [ ] S3 bucket created in production account
- [ ] Database migrated
- [ ] Frontend deployed
- [ ] DNS configured
- [ ] SSL certificates
- [ ] Final testing complete

---

## 🎉 Congratulations!

If all items are checked, your S3 upload system is fully operational and ready for production use!

**System Status:** [ ] Development [ ] Testing [ ] Production

**Deployed By:** ________________
**Date:** ________________
**Version:** 1.0.0

---

**Quick Reference:** See QUICK_REFERENCE.md
**Full Docs:** See UPLOAD_S3_DOCUMENTATION.md
**Troubleshooting:** See UPLOAD_S3_DOCUMENTATION.md > Troubleshooting section
