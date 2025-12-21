# Quick Reference: Google reCAPTCHA v2 Setup

## 🚀 Quick Start (5 minutes)

### 1. Get Your Keys
- Go to: https://www.google.com/recaptcha/admin
- Click "+" to create new site
- Select reCAPTCHA v2 (checkbox type)
- Copy Site Key and Secret Key

### 2. Frontend Setup
```bash
cd Web/frontend
npm install react-google-recaptcha
```

Add to `.env`:
```
VITE_GOOGLE_RECAPTCHA_SITE_KEY=your_site_key
VITE_API_URL=http://localhost:3000
```

### 3. Backend Setup
Add to `.env`:
```
GOOGLE_RECAPTCHA_SECRET_KEY=your_secret_key
```

### 4. Test
```bash
# Terminal 1 - Backend
cd Web/backend && npm start

# Terminal 2 - Frontend
cd Web/frontend && npm run dev
```

Visit login page, click the checkbox, and login!

---

## 📋 Implementation Details

### Frontend Changes
- ✅ `LoginPage.jsx`: ReCAPTCHA v2 checkbox component added
- ✅ `package.json`: react-google-recaptcha added
- ✅ Login handler: Now sends captchaToken

### Backend Changes
- ✅ `authController.js`: CAPTCHA verification added
- ✅ `captchaService.js`: Google API verification service
- ✅ Login endpoint: Now requires captchaToken (success/fail only)

---

## 🧪 Testing with Real Keys

For development, use real Google keys:
- reCAPTCHA v2 runs with your actual keys
- Check backend logs for verification results

---

## ⚙️ Configuration Options

### Theme
```javascript
// In LoginPage.jsx

theme="light"   // Light theme (default)
// or
theme="dark"    // Dark theme for dark backgrounds
```

### Error Handling
```javascript
// CAPTCHA succeeds -> User can login
// Token expires -> CAPTCHA resets, user clicks again
// Network error -> Logged, doesn't block login
```

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Checkbox not showing | Check `VITE_GOOGLE_RECAPTCHA_SITE_KEY` in .env |
| Verification fails | Verify `GOOGLE_RECAPTCHA_SECRET_KEY` is correct |
| Domain issues | Add domain to reCAPTCHA console |
| Challenge appearing | This is normal - Google decided more verification needed |

---

## 📊 Monitoring

Check backend logs:
```
✅ [Captcha] Token verified successfully
❌ [Captcha] Verification failed - Error codes: [...]
⚠️ [Captcha] Verification error: ...
```

---

## 🔒 Production Checklist

- [ ] Use real Cloudflare keys (not test keys)
- [ ] Enable HTTPS
- [ ] Configure correct domain in Cloudflare
- [ ] Monitor login failures
- [ ] Test error messages
- [ ] Set up logging/alerts
- [ ] Document CAPTCHA setup for team

---

## 📚 Docs & Links

- [Cloudflare Turnstile API](https://developers.cloudflare.com/turnstile/get-started/)
- [Test Credentials](https://developers.cloudflare.com/turnstile/reference/test-tokens/)
- [Code: LoginPage.jsx](../Web/frontend/src/pages/LoginPage.jsx)
- [Code: captchaService.js](../Web/backend/src/services/captchaService.js)

---

## 💡 Pro Tips

1. **Managed challenges** are better for user experience
2. **Always verify on backend** - never trust frontend validation alone
3. **Log CAPTCHA failures** for security analysis
4. **Test different scenarios** - network errors, expired tokens, etc.
5. **Monitor false positives** - legitimate users getting blocked

---

For detailed setup guide, see: `CLOUDFLARE_CAPTCHA_SETUP.md`
