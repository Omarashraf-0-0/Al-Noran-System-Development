# 🔧 Fix AWS S3 Permission Error - s3:GetObject Denied

## ❌ Current Problem

You're getting this error when trying to view documents:

```xml
<Error>
<Code>AccessDenied</Code>
<Message>User: arn:aws:iam::359671834383:user/noran-backend-user is not authorized to perform: s3:GetObject on resource: "arn:aws:s3:::noran-uploads/clients/..." with an explicit deny in an identity-based policy</Message>
</Error>
```

**Root Cause**: The IAM policy for `noran-backend-user` has an **EXPLICIT DENY** that blocks `s3:GetObject` permission.

---

## ✅ Solution: Update IAM Policy

### Step 1: Login to AWS Console

1. Go to: https://359671834383.signin.aws.amazon.com/console
2. **Username**: `noran-backend-user`
3. **Password**: `cDU4]8+4`

### Step 2: Navigate to IAM

1. In AWS Console search bar, type **IAM**
2. Click on **IAM** service
3. In left sidebar, click **Users**
4. Find and click on **noran-backend-user**

### Step 3: Check Current Policies

1. Click on **Permissions** tab
2. Look for any policies attached to this user
3. Check for:
   - Inline policies
   - Managed policies
   - Permission boundaries

### Step 4: Remove Deny Statements

Look for any policy that contains:

```json
{
  "Effect": "Deny",
  "Action": [
    "s3:GetObject",
    "s3:*"
  ],
  "Resource": "*"
}
```

**Remove or modify** any `Deny` statements that block S3 access.

### Step 5: Add Correct IAM Policy

Click **Add permissions** → **Attach policies directly** → **Create policy**

Use this JSON policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "NoranUploadsFullAccess",
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

**Policy Name**: `NoranUploadsFullAccess`

### Step 6: Verify No Permission Boundaries

1. In the user details page, check **Permissions boundary**
2. If there's a boundary set, click it and verify it doesn't have `Deny` statements
3. If needed, remove the permission boundary or update it

---

## 🔍 Alternative: Check S3 Bucket Policy

Sometimes the bucket itself has policies that deny access.

### Navigate to S3 Bucket

1. Go to **S3** in AWS Console
2. Click on bucket **noran-uploads**
3. Go to **Permissions** tab
4. Check **Bucket policy**

### Ensure Bucket Policy Doesn't Block Access

If there's a policy like this, **REMOVE IT**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::noran-uploads/*"
      ]
    }
  ]
}
```

### Recommended Bucket Policy (Optional)

For better security, you can use this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowBackendUserAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::359671834383:user/noran-backend-user"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::noran-uploads/*"
    },
    {
      "Sid": "AllowListBucket",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::359671834383:user/noran-backend-user"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::noran-uploads"
    }
  ]
}
```

---

## 🧪 Test After Changes

### Option 1: Test via AWS CLI (if installed)

```bash
# Configure AWS CLI with credentials
aws configure

# Test GetObject permission
aws s3api get-object \
  --bucket noran-uploads \
  --key clients/68ed645cbf8890e1308cd518/registration/1763344558600_1.jpg \
  --region me-south-1 \
  test-download.jpg
```

### Option 2: Use Backend Test Script

```bash
cd Web/backend
node test-s3.js
```

### Option 3: Test in Application

1. Restart the backend server
2. Go to http://localhost:5173/upload-documents
3. Try clicking "View Documentation" again
4. Check browser console and backend logs

---

## 📋 Checklist

- [ ] Login to AWS Console
- [ ] Navigate to IAM → Users → noran-backend-user
- [ ] Check for policies with `Deny` statements
- [ ] Remove or modify `Deny` statements
- [ ] Add the correct policy with `Allow` for s3:GetObject
- [ ] Check S3 bucket policy for any `Deny` statements
- [ ] Remove permission boundaries if they block access
- [ ] Test the fix

---

## 🔧 Quick Fix (If You Can't Access AWS Console)

If you don't have AWS Console access, you need to:

1. **Contact AWS Account Administrator** to:
   - Update IAM policy for `noran-backend-user`
   - Add `s3:GetObject` permission
   - Remove any `Deny` statements

2. **Alternative**: Create new IAM user with correct permissions:
   - Login to AWS Console with admin account
   - Create new IAM user: `noran-backend-user-v2`
   - Attach the policy from Step 5 above
   - Generate new access keys
   - Update `.env` file with new credentials

---

## ⚠️ Common Mistakes to Avoid

1. **Don't use wildcards in Deny statements** - They block everything
2. **Explicit Deny always wins** - Even if you have Allow, Deny takes precedence
3. **Check both IAM policy AND bucket policy** - Both can block access
4. **Permission boundaries** - They can limit what Allow policies can do

---

## 📞 Need Help?

If you're still having issues:

1. Check backend console logs for detailed error messages
2. Verify AWS credentials in `.env` are correct
3. Ensure S3 bucket `noran-uploads` exists in `me-south-1` region
4. Contact AWS support or your AWS administrator

---

## ✅ Expected Result After Fix

When you click "View Documentation", you should:
- See a presigned URL generated successfully in backend logs
- The document opens in a new tab
- No XML error messages

Backend log should show:
```
🔗 Generating presigned URL for: clients/68ed645cbf8890e1308cd518/registration/1763344558600_1.jpg
✅ Presigned URL generated successfully
```
