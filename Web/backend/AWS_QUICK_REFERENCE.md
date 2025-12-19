# 🔐 AWS S3 - Quick Reference Guide

## 🎯 Common AWS S3 Errors and Solutions

### 1. AccessDenied - s3:GetObject

**Error Message:**
```
User is not authorized to perform: s3:GetObject with an explicit deny
```

**Solution:**
- Update IAM policy to allow `s3:GetObject`
- Remove any Deny statements
- See: `FIX_AWS_PERMISSION_ERROR.md`

---

### 2. AccessDenied - s3:PutObject

**Error Message:**
```
User is not authorized to perform: s3:PutObject
```

**Solution:**
- Add `s3:PutObject` permission to IAM policy
- Remove ACL parameter from upload if present

---

### 3. NoSuchBucket

**Error Message:**
```
The specified bucket does not exist
```

**Solution:**
- Create S3 bucket: `noran-uploads`
- Region: `me-south-1` (Middle East - Bahrain)
- Ensure bucket name matches `.env` file

---

### 4. InvalidAccessKeyId

**Error Message:**
```
The AWS Access Key Id you provided does not exist
```

**Solution:**
- Check `.env` file has correct `AWS_ACCESS_KEY_ID`
- Regenerate access keys in AWS Console if needed

---

### 5. SignatureDoesNotMatch

**Error Message:**
```
The request signature we calculated does not match
```

**Solution:**
- Check `AWS_SECRET_ACCESS_KEY` is correct
- No extra spaces in `.env` file
- Regenerate access keys if needed

---

## 📋 Required IAM Permissions

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
        "s3:ListBucket",
        "s3:GetObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::noran-uploads",
        "arn:aws:s3:::noran-uploads/*"
      ]
    }
  ]
}
```

---

## 🔍 Where AWS S3 is Used

| File | Purpose | S3 Actions |
|------|---------|------------|
| `s3Config.js` | S3 client setup | - |
| `s3Helpers.js` | Upload/download/delete | PutObject, GetObject, DeleteObject |
| `uploadS3Controller.js` | API endpoints | All actions |
| `DocumentUploadPage.jsx` | Frontend UI | Calls API |

---

## 🧪 Testing AWS S3 Connection

### Test Script
```bash
cd Web/backend
node test-s3.js
```

### Manual Test via API

**Upload Test:**
```bash
curl -X POST http://localhost:3500/api/uploads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg" \
  -F "category=registration" \
  -F "documentType=commercial_register"
```

**View Test:**
```bash
curl http://localhost:3500/api/uploads/UPLOAD_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 AWS Configuration Files

| File | Purpose |
|------|---------|
| `.env` | AWS credentials |
| `.env.s3.example` | Template |
| `s3Config.js` | S3 client |
| `s3Helpers.js` | S3 operations |

---

## 📊 S3 Bucket Structure

```
noran-uploads/
├── clients/
│   └── {clientId}/
│       ├── registration/
│       ├── acidrequest/
│       ├── acid/{acidId}/
│       ├── shipments/{shipmentId}/
│       ├── invoices/{invoiceId}/
│       └── archive/
├── employees/
│   └── {employeeId}/
└── admin/
```

---

## 🚨 Troubleshooting Checklist

- [ ] AWS credentials set in `.env`
- [ ] S3 bucket `noran-uploads` exists
- [ ] Bucket in correct region (`me-south-1`)
- [ ] IAM user has required permissions
- [ ] No Deny statements in policies
- [ ] No permission boundaries blocking access
- [ ] Backend server restarted after `.env` changes
- [ ] Check backend console logs for errors
- [ ] Check browser console for frontend errors

---

## 🔐 Security Best Practices

1. ✅ **Use IAM User** - Not root account
2. ✅ **Minimum Permissions** - Only what's needed
3. ✅ **Private Bucket** - No public access
4. ✅ **Presigned URLs** - Temporary access
5. ✅ **Environment Variables** - Never commit credentials
6. ✅ **Rotate Keys** - Every 90 days
7. ✅ **Enable MFA** - For AWS Console
8. ✅ **Bucket Versioning** - For backup/recovery

---

## 📚 Useful AWS CLI Commands

```bash
# List buckets
aws s3 ls

# List files in bucket
aws s3 ls s3://noran-uploads/ --recursive

# Copy file to S3
aws s3 cp test.jpg s3://noran-uploads/test/

# Get file from S3
aws s3 cp s3://noran-uploads/test/test.jpg ./downloaded.jpg

# Delete file
aws s3 rm s3://noran-uploads/test/test.jpg

# Sync directory
aws s3 sync ./local-folder s3://noran-uploads/backup/
```

---

## 🔗 Useful Links

- AWS Console: https://359671834383.signin.aws.amazon.com/console
- IAM Users: https://console.aws.amazon.com/iam/home#/users
- S3 Console: https://s3.console.aws.amazon.com/s3/
- AWS Documentation: https://docs.aws.amazon.com/s3/

---

## 📞 Support Contacts

- AWS Support: https://console.aws.amazon.com/support/
- IAM User: `noran-backend-user`
- Account ID: `359671834383`

---

**Last Updated:** December 1, 2025
