# Google reCAPTCHA v3 Integration - Summary of Changes

## Overview
Google reCAPTCHA v3 has been successfully integrated into your Al-Noran system's login page to protect against bot abuse and automated attacks using invisible, score-based bot detection.

## Files Modified/Created

### Frontend Changes

#### 1. **Web/frontend/package.json** (UPDATED)
- **Change**: Removed `@cloudflare/turnstile`, added `react-google-recaptcha`
- **Purpose**: Library for client-side reCAPTCHA component rendering
- **Command to install**: `npm install`

#### 2. **Web/frontend/src/pages/LoginPage.jsx** (UPDATED)
- **Changes**:
  - Replaced Turnstile import with ReCAPTCHA component import
  - Changed `turnstileRef` to `recaptchaRef`
  - Simplified `useEffect` hook (removed Cloudflare script loading)
  - Updated `handleLogin` to:
    - Validate reCAPTCHA token before sending
    - Send captchaToken with login request
    - Handle reCAPTCHA callbacks (expired, error)
    - Reset CAPTCHA ref on failure
  - Replaced CAPTCHA widget div with ReCAPTCHA component:
    - `onChange` callback for token capture
    - `onExpired` callback for token expiration
    - `onErrored` callback for verification errors
  
- **Key Features**:
  - Automatic token generation (invisible to user)
  - User-friendly error messages in Arabic
  - Token expiration handling
  - Smooth error recovery
  - No visible CAPTCHA widget (score-based detection)

#### 3. **Web/frontend/.env.example** (UPDATED)
- **Change**: Updated from `VITE_CLOUDFLARE_SITE_KEY` to `VITE_GOOGLE_RECAPTCHA_SITE_KEY`
- **Purpose**: Documentation for required environment variable

### Backend Changes

#### 1. **Web/backend/src/services/captchaService.js** (COMPLETELY REWRITTEN)
- **Purpose**: Handle reCAPTCHA token verification with Google API
- **Functions**:
  - `verifyCaptcha(token)`: Sends token to Google for verification
  
- **Updated Features**:
  - Score-based verification (0.0-1.0 scale)
  - Configurable threshold checking against `RECAPTCHA_SCORE_THRESHOLD`
  - Network error handling
  - Timeout protection (10 seconds)
  - Returns score object: `{success, score, action, challenge_ts, hostname}`
  - Detailed logging including score information
  - Graceful fallback if secret key not configured

- **Key Changes**:
  - API endpoint changed to `https://www.google.com/recaptcha/api/siteverify`
  - Return value changed from boolean to object with score data
  - Added threshold comparison logic
  - Updated all error messages and logging

#### 2. **Web/backend/src/controllers/authController.js** (UPDATED)
- **Changes**:
  - Updated CAPTCHA verification to handle new response structure
  - Added score checking and logging
  - Updated from: `const isCaptchaValid = await verifyCaptcha(...)`
  - Updated to: `const captchaResult = await verifyCaptcha(...); if (!captchaResult.success)`
  - Added score logging: `Score: ${captchaResult.score}`
  
- **New Validation Flow**:
  1. Check email & password provided
  2. **UPDATED**: Verify reCAPTCHA token with Google (with score checking)
  3. Check if user exists
  4. Verify password
  5. Check if user/employee is active
  6. Return login response

#### 3. **Web/backend/.env.example** (UPDATED)
- **Changes**: 
  - Updated from `CLOUDFLARE_SECRET_KEY` to `GOOGLE_RECAPTCHA_SECRET_KEY`
  - Added `RECAPTCHA_SCORE_THRESHOLD` (default: 0.5)
- **Purpose**: Documentation for required environment variables

## New Files Created

1. **GOOGLE_RECAPTCHA_SETUP.md**
   - Comprehensive setup and deployment guide
   - Score threshold guidelines and recommendations
   - Monitoring and analytics instructions
   - Comparison with reCAPTCHA v2
   - Security best practices

2. **CAPTCHA_QUICK_REFERENCE.md** (UPDATED)
   - Updated from Cloudflare to Google reCAPTCHA
   - Quick start guide (5 minutes)
   - Score threshold configuration options
   - Monitoring and log interpretation

3. **CLOUDFLARE_CAPTCHA_SETUP.md** (LEGACY)
   - Kept for reference/historical purposes
   - Previous implementation documentation

## Environment Variables Required

### Frontend (.env)
```
VITE_GOOGLE_RECAPTCHA_SITE_KEY=your_site_key_here
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)
```
GOOGLE_RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_SCORE_THRESHOLD=0.5
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## How It Works

### User Flow
1. User visits login page
2. reCAPTCHA v3 runs invisibly in background
3. User enters credentials and clicks Login
4. Frontend collects reCAPTCHA token
5. Frontend sends: email, password, captchaToken
6. Backend verifies token with Google and checks score
7. If score >= threshold, continues normal login
8. If score < threshold, returns error and frontend resets CAPTCHA

### Technical Flow
```
Frontend (Login Page)
    ↓
[ReCAPTCHA Component Loads]
    ↓
[Invisible Bot Detection Running]
    ↓
User Enters Credentials
    ↓
User Clicks Login
    ↓
[Generate reCAPTCHA Token]
    ↓
[Validate Token Exists]
    ↓
POST /api/auth/login + captchaToken
    ↓
Backend Receives Request
    ↓
[Verify Token with Google]
    ↓
Google Returns: success, score (0.0-1.0), action, metadata
    ↓
[Compare Score with Threshold]
    ↓
If score >= threshold: Continue login
If score < threshold: Return error (likely bot)
    ↓
Frontend Resets CAPTCHA on error
```

## Score Thresholds

| Threshold | Use Case | Strictness |
|-----------|----------|-----------|
| 0.0-0.3 | Very strict bot filtering | Very strict |
| 0.3-0.5 | Strict bot filtering | Strict |
| 0.5-0.7 | Balanced (recommended) | **Recommended** |
| 0.7-0.9 | Lenient bot filtering | Lenient |
| 0.9-1.0 | Very lenient | Very lenient |

**For login pages**: 0.5-0.7 is recommended for balanced security and user experience.

## Security Features

✅ **Client-side Validation**: Checks token exists before sending  
✅ **Server-side Verification**: Always verifies with Google  
✅ **Score-based Detection**: Machine learning bot detection (0.0-1.0)  
✅ **Configurable Threshold**: Adjust strictness via environment variable  
✅ **Token Expiration**: Tokens automatically expire after use  
✅ **Rate Limiting**: Google handles rate limiting  
✅ **Error Logging**: All failures logged with scores for monitoring  
✅ **Graceful Degradation**: Works without secret key (logging only)  
✅ **Timeout Protection**: 10-second timeout for verification  
✅ **Invisible Protection**: No disruption to user experience

## Testing

### Quick Test
1. Add keys to `.env` files
2. Run: `npm install` in Web/frontend
3. Start backend and frontend
4. Go to login page
5. You won't see a visible CAPTCHA (it runs invisibly)
6. Check backend logs for scores

### What to Verify
- [ ] No console errors on login page
- [ ] reCAPTCHA component loads (check network tab)
- [ ] Token is generated (check browser dev tools)
- [ ] Backend receives captchaToken in request
- [ ] Backend logs show score and verification
- [ ] Login succeeds for legitimate users
- [ ] Login fails for scores below threshold
- [ ] CAPTCHA resets on error
- [ ] Error messages appear correctly

### Backend Log Examples
```
✅ [reCAPTCHA] Token verified successfully. Score: 0.95, Action: login, Hostname: localhost
⚠️ [reCAPTCHA] Verification failed - Success: true, Score: 0.2, Error codes: []
❌ [reCAPTCHA] Verification error: Network timeout
```

## Next Steps

1. **Get Google Keys**
   - Go to https://www.google.com/recaptcha/admin
   - Create new site with reCAPTCHA v3
   - Copy Site Key and Secret Key

2. **Configure Environment**
   - Add keys to frontend/.env
   - Add keys to backend/.env
   - Set `RECAPTCHA_SCORE_THRESHOLD` (default: 0.5)

3. **Install Dependencies**
   - Run `npm install` in Web/frontend

4. **Test Locally**
   - Test login with various user types
   - Monitor backend logs for scores
   - Verify error handling
   - Check different network conditions

5. **Monitor in Production**
   - Check Google reCAPTCHA Admin Console regularly
   - Monitor bot traffic percentage
   - Adjust threshold if needed
   - Review backend logs weekly

6. **Deploy to Production**
   - Use real Google keys
   - Ensure HTTPS enabled
   - Add production domain to reCAPTCHA settings
   - Setup logging and alerts

## Monitoring

### Backend Logs
- Look for `[reCAPTCHA]` tagged messages
- Monitor score distributions
- Alert on verification failures

### Google Admin Console
- View request volume
- See bot traffic percentage
- Check score distribution over time

### Recommended Actions
- Review scores daily first week
- Check weekly after stabilization
- Alert if bot traffic exceeds 20%
- Adjust threshold quarterly based on data

## Troubleshooting

### Widget Not Running?
1. Check `VITE_GOOGLE_RECAPTCHA_SITE_KEY` is in `.env`
2. Check browser console for errors
3. Verify reCAPTCHA component loads

### Verification Fails?
1. Verify `GOOGLE_RECAPTCHA_SECRET_KEY` is correct
2. Check backend logs for error messages
3. Ensure site/secret keys match in Google Console

### All Users Rejected?
1. Check `RECAPTCHA_SCORE_THRESHOLD` setting (try 0.3)
2. Monitor scores in backend logs
3. Check if domain is whitelisted in Google Console

### Too Many False Positives?
1. Lower `RECAPTCHA_SCORE_THRESHOLD` value
2. Monitor scores in logs to find good threshold
3. Check Google Admin Console for score distribution

### Too Many Bots Getting Through?
1. Raise `RECAPTCHA_SCORE_THRESHOLD` value
2. Consider additional security measures
3. Enable rate limiting on login endpoint

## Support Resources

- **Setup Guide**: See `GOOGLE_RECAPTCHA_SETUP.md`
- **Quick Reference**: See `CAPTCHA_QUICK_REFERENCE.md`
- **Google Docs**: https://developers.google.com/recaptcha/docs/v3
- **Admin Console**: https://www.google.com/recaptcha/admin
- **Backend Logs**: Check console for [reCAPTCHA] messages

## Rollback (If Needed)

If you need to remove reCAPTCHA:

1. Frontend:
   - Remove `react-google-recaptcha` from package.json
   - Revert LoginPage.jsx changes
   - Remove ReCAPTCHA component and token handling

2. Backend:
   - Revert authController.js changes
   - Remove captchaService.js
   - Remove Google keys from .env

3. Re-run tests to ensure login still works

## Comparison: Google reCAPTCHA v3 vs Cloudflare Turnstile

| Feature | reCAPTCHA v3 | Turnstile |
|---------|------------|-----------|
| User Interaction | None (invisible) | Optional (managed) |
| Detection Type | Score-based | Challenge-based |
| Score Range | 0.0-1.0 | N/A |
| Setup Time | 5 minutes | 5 minutes |
| Cost | Free | Free |
| Provider | Google | Cloudflare |
| Integration | react-google-recaptcha | @cloudflare/turnstile |
| Best For | Minimal user friction | Multi-challenge options |

## Notes

- reCAPTCHA is invisible - users won't see a checkbox
- Scores are more reliable than binary pass/fail
- Google aggregates data to improve detection
- Monitor logs regularly for score trends
- Consider combining with rate limiting
- Test error scenarios before production
- Always verify on backend

---

**Status**: ✅ Implementation Complete  
**Last Updated**: December 2024  
**Migration From**: Cloudflare Turnstile  
**Features**: Score-based bot detection, configurable threshold, invisible to users
