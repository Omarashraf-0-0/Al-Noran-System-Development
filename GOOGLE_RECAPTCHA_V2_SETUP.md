# Google reCAPTCHA v2 Integration Guide

## Overview
This guide explains how to set up Google reCAPTCHA v2 for your login page to protect against automated attacks and bot abuse.

## Features
- ✅ User-friendly checkbox ("I'm not a robot")
- ✅ Invisible verification for trusted users
- ✅ Image/text challenge when needed
- ✅ Backend verification for additional security
- ✅ Configurable error handling
- ✅ Simple binary success/fail response

## Step 1: Create Google reCAPTCHA Account

### 1.1 Set Up reCAPTCHA Admin Console
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Sign in with your Google account
3. Click the **"+" button** to create a new site
4. Fill in the site details:
   - **Label**: Your application name (e.g., "Al-Noran Login")
   - **reCAPTCHA type**: Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: Add your domain(s) (e.g., alnoran.com, localhost)
5. Accept the reCAPTCHA Terms of Service
6. Click **"Create"**

### 1.2 Get Your Keys
1. After creation, you'll see your **Site Key** and **Secret Key**
2. **Site Key** - Use on frontend
3. **Secret Key** - Use on backend (keep secure!)

## Step 2: Configure Frontend

### 2.1 Install Dependencies
```bash
cd Web/frontend
npm install react-google-recaptcha
```

### 2.2 Set Environment Variables
Create or update `.env` file in `Web/frontend/`:
```env
VITE_GOOGLE_RECAPTCHA_SITE_KEY=your_site_key_here
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Replace `your_site_key_here` with the **Site Key** from Google.

### 2.3 Verify Implementation
The LoginPage component now includes:
- Google reCAPTCHA v2 component import
- Checkbox widget with "I'm not a robot" text
- Automatic token generation on user verification
- Token validation before login submission
- Error handling and token expiration management

**Key Component Structure:**
```jsx
<ReCAPTCHA
  ref={recaptchaRef}
  sitekey={import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY}
  onChange={(token) => {
    setCaptchaToken(token);
  }}
  onExpired={() => {
    setCaptchaToken(null);
    toast.error('انتهت صلاحية التحقق. يرجى المحاولة مرة أخرى');
  }}
  onErrored={() => {
    setCaptchaToken(null);
    toast.error('حدث خطأ في التحقق. يرجى المحاولة مرة أخرى');
  }}
  theme="light"
/>
```

## Step 3: Configure Backend

### 3.1 Set Environment Variables
Update `.env` file in `Web/backend/`:
```env
GOOGLE_RECAPTCHA_SECRET_KEY=your_secret_key_here
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# ... other existing variables
```

Replace `your_secret_key_here` with the **Secret Key** from Google.

### 3.2 Verify Installation
The login controller now:
- Validates the reCAPTCHA token from the frontend
- Verifies it with Google servers
- Rejects login if verification fails
- Logs verification results for monitoring

## Step 4: Testing

### Local Testing
1. Start the backend:
```bash
cd Web/backend
npm start
```

2. Start the frontend (in another terminal):
```bash
cd Web/frontend
npm run dev
```

3. Navigate to the login page
4. You should see the reCAPTCHA checkbox
5. Click the checkbox to complete verification
6. Check backend logs for verification confirmation

### Production Testing
1. Deploy to your domain
2. Verify domain is added to your reCAPTCHA settings
3. Test the checkbox interaction
4. Verify login works after CAPTCHA completion

## Monitoring and Troubleshooting

### Monitor reCAPTCHA Metrics
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Select your site
3. View analytics dashboard:
   - Request volume
   - Success/failure rates
   - Traffic trends

### Common Issues

**Issue: "Invalid site key"**
- Solution: Ensure Site Key is correct in `.env` and domain is added to reCAPTCHA settings

**Issue: "Invalid secret key"**
- Solution: Ensure Secret Key is correct in backend `.env` and kept secure

**Issue: "Verification always fails"**
- Solution: Check that domain is whitelisted in Google reCAPTCHA console

**Issue: "Checkbox not showing"**
- Solution: Verify VITE_GOOGLE_RECAPTCHA_SITE_KEY is set and network request succeeds

### Logs to Check
- Backend logs show verification results: `✅ [reCAPTCHA] Token verified successfully`
- Monitor for verification failures: `❌ [reCAPTCHA] Verification error`

## File Structure

```
Web/
├── frontend/
│   ├── src/
│   │   └── pages/
│   │       └── LoginPage.jsx          (ReCAPTCHA component)
│   ├── .env                           (VITE_GOOGLE_RECAPTCHA_SITE_KEY)
│   └── package.json                   (react-google-recaptcha dependency)
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── authController.js      (Token verification)
│   │   └── services/
│   │       └── captchaService.js      (Google API verification)
│   ├── .env                           (GOOGLE_RECAPTCHA_SECRET_KEY)
│   └── package.json                   (axios dependency for API calls)
```

## Comparison: reCAPTCHA v2 vs v3

| Feature | v2 (Current) | v3 |
|---------|-------------|-----|
| User Interaction | Checkbox or challenge | None (invisible) |
| Detection Type | Binary (pass/fail) | Score-based (0.0-1.0) |
| UX Impact | User clicks checkbox | Completely invisible |
| Accuracy | Very good | Slightly better |
| Cost | Free tier | Free tier |
| Best For | User-interactive forms | Seamless experience |

## Security Best Practices

1. **Keep Secret Key Secure**
   - Never expose in frontend code
   - Never commit to public repositories
   - Use environment variables

2. **Monitor Traffic Regularly**
   - Check Google Admin Console weekly
   - Alert on unusual failure rates
   - Review logs for patterns

3. **Combine with Other Security**
   - Use with rate limiting
   - Implement account lockout after failed attempts
   - Monitor login patterns for anomalies

4. **Log and Alert**
   - Log all failed verification attempts
   - Set alerts for unusual patterns
   - Review logs regularly

## Support and Resources

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/display)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [React Google reCAPTCHA Package](https://www.npmjs.com/package/react-google-recaptcha)
- [reCAPTCHA v2 Integration Guide](https://developers.google.com/recaptcha/docs/v2/overview)

## Version History

- **v1.0** - Google reCAPTCHA v2 implementation (checkbox)
- **Updated from** - Google reCAPTCHA v3 (score-based)
