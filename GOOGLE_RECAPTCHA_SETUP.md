# Google reCAPTCHA v3 Integration Guide

## Overview
This guide explains how to set up Google reCAPTCHA v3 for your login page to protect against automated attacks and bot abuse.

## Features
- ✅ Invisible CAPTCHA - no user interaction required
- ✅ Score-based bot detection (0.0-1.0 scale)
- ✅ Backend verification for additional security
- ✅ Configurable confidence threshold
- ✅ Better user experience than traditional CAPTCHAs
- ✅ Free tier available

## Step 1: Create Google reCAPTCHA Account

### 1.1 Set Up reCAPTCHA Admin Console
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Sign in with your Google account
3. Click the **"+" button** to create a new site
4. Fill in the site details:
   - **Label**: Your application name (e.g., "Al-Noran Login")
   - **reCAPTCHA type**: Select **reCAPTCHA v3**
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
- Google reCAPTCHA component import
- Automatic token generation on user interaction
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
/>
```

## Step 3: Configure Backend

### 3.1 Set Environment Variables
Update `.env` file in `Web/backend/`:
```env
GOOGLE_RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_SCORE_THRESHOLD=0.5
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# ... other existing variables
```

Replace:
- `your_secret_key_here` with the **Secret Key** from Google
- `0.5` with your preferred confidence threshold

### 3.2 Score Threshold Guidelines
- **0.0-0.3**: Very likely a bot (most strict)
- **0.3-0.5**: Probably a bot
- **0.5-0.7**: Default range (recommended for login)
- **0.7-0.9**: Probably human
- **0.9-1.0**: Very likely human (least strict)

**Recommendation for Login:** 0.5-0.7 for balanced security and user experience

### 3.3 Verify Installation
The login controller now:
- Validates the reCAPTCHA token from the frontend
- Verifies it with Google servers
- Checks the score against your threshold
- Rejects login if verification fails
- Logs score information for monitoring

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
4. Enter credentials and verify reCAPTCHA token is generated
5. Check browser console for token details

### Production Testing
1. Deploy to your domain
2. Verify domain is added to your reCAPTCHA settings
3. Monitor scores in Google reCAPTCHA Admin Console
4. Adjust threshold if needed based on false positives/negatives

## Monitoring and Troubleshooting

### Monitor reCAPTCHA Metrics
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Select your site
3. View analytics dashboard:
   - Request volume
   - Bot traffic percentage
   - Score distribution

### Common Issues

**Issue: "Invalid site key"**
- Solution: Ensure Site Key is correct in `.env` and domain is added to reCAPTCHA settings

**Issue: "Invalid secret key"**
- Solution: Ensure Secret Key is correct in backend `.env` and kept secure

**Issue: "Too many false positives"**
- Solution: Lower your `RECAPTCHA_SCORE_THRESHOLD` value

**Issue: "Too many bots getting through"**
- Solution: Raise your `RECAPTCHA_SCORE_THRESHOLD` value and monitor logs

### Logs to Check
- Backend logs show reCAPTCHA scores: `✅ [reCAPTCHA] Token verified successfully. Score: 0.9, Action: login`
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
│   ├── .env                           (GOOGLE_RECAPTCHA_SECRET_KEY, RECAPTCHA_SCORE_THRESHOLD)
│   └── package.json                   (axios dependency for API calls)
```

## Comparison: reCAPTCHA v3 vs v2

| Feature | v3 (Current) | v2 |
|---------|-------------|-----|
| User Interaction | None (invisible) | Checkbox or Image challenge |
| UX Impact | Minimal | Can be frustrating |
| Bot Detection | Score-based | Binary (pass/fail) |
| Accuracy | Higher with machine learning | Good but less sophisticated |
| Cost | Free tier generous | Free tier |
| Best For | Login forms | Sensitive forms |

## Security Best Practices

1. **Keep Secret Key Secure**
   - Never expose in frontend code
   - Never commit to public repositories
   - Use environment variables

2. **Monitor Scores Regularly**
   - Check Google Admin Console weekly
   - Alert on significant bot traffic changes
   - Adjust threshold as needed

3. **Combine with Other Security**
   - Use with rate limiting
   - Implement account lockout after failed attempts
   - Monitor login patterns for anomalies

4. **Log and Alert**
   - Log all failed verification attempts
   - Set alerts for unusual patterns
   - Review logs regularly

## Support and Resources

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [React Google reCAPTCHA Package](https://www.npmjs.com/package/react-google-recaptcha)
- [reCAPTCHA Security Best Practices](https://developers.google.com/recaptcha/docs/invisible)

## Version History

- **v1.0** - Initial Google reCAPTCHA v3 implementation
- **Updated from** - Cloudflare Turnstile CAPTCHA system
