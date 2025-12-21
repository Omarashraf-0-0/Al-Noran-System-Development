# Cloudflare CAPTCHA Architecture & Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            LoginPage (React Component)                    │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │  1. Load Turnstile Script on Mount                       │ │
│  │     <script src="challenges.cloudflare.com/turnstile...">│ │
│  │                                                           │ │
│  │  2. Render CAPTCHA Widget                                │ │
│  │     <div ref={turnstileRef} class="cf-turnstile" />      │ │
│  │                                                           │ │
│  │  3. On CAPTCHA Complete                                  │ │
│  │     callback: (token) => setCaptchaToken(token)         │ │
│  │                                                           │ │
│  │  4. On Login Click                                       │ │
│  │     - Validate token exists                              │ │
│  │     - Send POST /api/auth/login with captchaToken       │ │
│  │                                                           │ │
│  │  5. Handle Response                                      │ │
│  │     - Success: Redirect to dashboard                     │ │
│  │     - Failure: Show error, reset CAPTCHA                 │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API SERVER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           authController.login() Handler                  │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │  1. Extract: email, password, captchaToken              │ │
│  │     from request body                                    │ │
│  │                                                           │ │
│  │  2. Validate Input                                       │ │
│  │     if (!email || !password) → Error                     │ │
│  │                                                           │ │
│  │  3. Validate CAPTCHA Token                               │ │
│  │     ┌──────────────────────────────────────────┐         │ │
│  │     │ captchaService.verifyCaptcha(token)      │         │ │
│  │     └──────────────────────────────────────────┘         │ │
│  │                          ↓                               │ │
│  │     if (!isCaptchaValid) → Error 400                      │ │
│  │                                                           │ │
│  │  4. User Authentication                                  │ │
│  │     - Check user exists                                  │ │
│  │     - Verify password                                    │ │
│  │     - Check user active                                  │ │
│  │                                                           │ │
│  │  5. Generate JWT Token                                   │ │
│  │     token = user.getSignedJwtToken()                     │ │
│  │                                                           │ │
│  │  6. Return Response                                      │ │
│  │     { success, token, user }                             │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         captchaService.verifyCaptcha()                    │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │  1. Check token exists                                   │ │
│  │  2. Get CLOUDFLARE_SECRET_KEY from env                   │ │
│  │  3. POST to Cloudflare API                               │ │
│  │     https://challenges.cloudflare.com/                   │ │
│  │     turnstile/v0/siteverify                              │ │
│  │     { secret, response: token }                          │ │
│  │  4. Parse response                                       │ │
│  │  5. Return success boolean                               │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE SERVERS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Validate CAPTCHA token                                      │
│  • Check token expiration                                      │
│  • Verify device/IP reputation                                 │
│  • Return: { success: true/false, error_codes: [...] }        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### Successful Login Flow

```
USER → CAPTCHA WIDGET → TOKEN CALLBACK → FORM SUBMISSION
  ↓         ↓              ↓                  ↓
Browser  Cloudflare    React State      POST Request
         JavaScript
                                           ↓
                    ┌─────────────────────┴─────────────────────┐
                    ↓                                           ↓
              BACKEND VALIDATION                        CLOUDFLARE
                    ↓                                      VERIFY
            User Authentication ◄─────────────────────────┘
                    ↓
              JWT Generated
                    ↓
            Response with Token
                    ↓
              REDIRECT to Dashboard
```

### Failed Login Flow

```
USER → CAPTCHA WIDGET → (Fails or incomplete)
  ↓         ↓
Browser  No Token
                                            ↓
                                    Form Submission
                                     (Blocked)
                                            ↓
                                      Error Toast
                                    "Complete CAPTCHA"
                                            ↓
                                      Reset & Retry
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────┐
│     React LoginPage Component           │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ State Management                │  │
│  │ • formData (email, password)   │  │
│  │ • captchaToken                 │  │
│  │ • isLoading                    │  │
│  │ • showPassword                 │  │
│  │ • isVisible                    │  │
│  │ • turnstileRef (DOM ref)       │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Hooks                            │  │
│  │ • useEffect (init Turnstile)    │  │
│  │ • useRef (CAPTCHA container)    │  │
│  │ • useNavigate (routing)         │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Handlers                         │  │
│  │ • handleInputChange              │  │
│  │ • handleLogin (with CAPTCHA)     │  │
│  │ • googleLogin                    │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ UI Components                    │  │
│  │ • Email Input                    │  │
│  │ • Password Input                 │  │
│  │ • Forgot Password Link           │  │
│  │ ★ CAPTCHA Widget (NEW)          │  │
│  │ • Submit Button                  │  │
│  │ • Google Login Button            │  │
│  └─────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
              ↓
       Turnstile Widget
              ↓
       (Cloudflare Service)
```

## Data Flow Sequence

```
1. PAGE LOAD
   └─→ useEffect triggered
       └─→ Load Turnstile script
           └─→ Script ready
               └─→ window.turnstile available
                   └─→ Render widget in ref

2. USER INTERACTION
   └─→ User sees CAPTCHA challenge
       └─→ User completes challenge
           └─→ Cloudflare validates
               └─→ Token callback fires
                   └─→ setCaptchaToken(token)
                       └─→ React state updated

3. FORM SUBMISSION
   └─→ User clicks "Login"
       └─→ handleLogin triggered
           └─→ Validate token exists
               │
               ├─ No token → Error toast, stop
               │
               └─ Token exists
                   └─→ POST /api/auth/login
                       ├─ email
                       ├─ password
                       └─ captchaToken
                           ↓
                       BACKEND RECEIVES
                           ↓
                       captchaService.verifyCaptcha()
                           ↓
                       POST to Cloudflare
                           ↓
                       Cloudflare response
                           ├─ Valid → Continue login
                           └─ Invalid → Return error
                               ↓
                           Frontend receives error
                               ↓
                           Reset CAPTCHA widget
                               ↓
                           Show error toast
```

## Error Handling Flow

```
ERRORS CAN OCCUR AT MULTIPLE POINTS:

1. CAPTCHA NOT COMPLETED
   └─→ User clicks login without CAPTCHA
       └─→ Frontend check: if (!captchaToken)
           └─→ Toast: "Complete CAPTCHA"

2. CAPTCHA VERIFICATION FAILS
   └─→ Token sent to server
       └─→ verifyCaptcha() returns false
           └─→ Backend returns 400
               └─→ Frontend receives error
                   └─→ Reset CAPTCHA widget
                       └─→ Toast: "Verification failed"

3. NETWORK ERROR
   └─→ Cloudflare unreachable
       └─→ captchaService catches error
           └─→ Logged to console
               └─→ Can allow or block login
                   (configurable behavior)

4. TOKEN EXPIRED
   └─→ User delays > token lifetime
       └─→ Cloudflare rejects token
           └─→ Backend returns error
               └─→ Frontend resets CAPTCHA

5. INVALID CREDENTIALS
   └─→ Email/password incorrect
       └─→ Same as before
           └─→ CAPTCHA already verified
               └─→ Just show auth error
```

## Environment Configuration

```
DEVELOPMENT SETUP
┌─────────────────────────────────────────┐
│ Frontend (.env)                         │
├─────────────────────────────────────────┤
│ VITE_CLOUDFLARE_SITE_KEY=1x000000...  │
│ VITE_API_URL=http://localhost:3000     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ Backend (.env)                          │
├─────────────────────────────────────────┤
│ CLOUDFLARE_SECRET_KEY=1x000000000000... │
│ PORT=3000                               │
│ MONGODB_URI=...                         │
└─────────────────────────────────────────┘

PRODUCTION SETUP
┌─────────────────────────────────────────┐
│ Frontend (.env)                         │
├─────────────────────────────────────────┤
│ VITE_CLOUDFLARE_SITE_KEY=xxxxxxxx...   │
│ VITE_API_URL=https://api.alnoran.com   │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ Backend (.env)                          │
├─────────────────────────────────────────┤
│ CLOUDFLARE_SECRET_KEY=xxxxxxxxxxxxxxxx │
│ PORT=443                                │
│ MONGODB_URI=...                         │
└─────────────────────────────────────────┘
```

## Security Layers

```
┌────────────────────────────────────────────────┐
│          SECURITY ARCHITECTURE                │
├────────────────────────────────────────────────┤
│                                                │
│  LAYER 1: CLIENT-SIDE                         │
│  ├─ Validate CAPTCHA token exists             │
│  └─ Prevent submission without token          │
│                                                │
│  LAYER 2: TRANSPORT                           │
│  ├─ HTTPS encryption (production)             │
│  └─ Secure token transmission                 │
│                                                │
│  LAYER 3: SERVER-SIDE VALIDATION              │
│  ├─ Verify CAPTCHA with Cloudflare           │
│  ├─ Validate email/password                   │
│  └─ Check user status (active/suspended)      │
│                                                │
│  LAYER 4: CLOUDFLARE PROTECTION               │
│  ├─ Bot detection                             │
│  ├─ IP reputation checking                    │
│  ├─ Token expiration (time-limited)           │
│  └─ Rate limiting                             │
│                                                │
│  LAYER 5: DATABASE PROTECTION                 │
│  ├─ Password hashing (bcrypt)                 │
│  ├─ JWT token signing                         │
│  └─ User status flags (active/suspended)      │
│                                                │
│  LAYER 6: MONITORING                          │
│  ├─ Log CAPTCHA failures                      │
│  ├─ Monitor suspicious patterns                │
│  └─ Alert on repeated failures                │
│                                                │
└────────────────────────────────────────────────┘
```

## File Structure

```
Al-Noran-System-Development/
├── CLOUDFLARE_CAPTCHA_SETUP.md           (Setup Guide)
├── CAPTCHA_QUICK_REFERENCE.md            (Quick Guide)
├── IMPLEMENTATION_SUMMARY.md             (This file summary)
├── ARCHITECTURE.md                       (This file)
│
├── Web/
│   ├── frontend/
│   │   ├── package.json                  (✓ Updated)
│   │   ├── .env.example                  (✓ Updated)
│   │   └── src/
│   │       └── pages/
│   │           └── LoginPage.jsx         (✓ Updated)
│   │
│   └── backend/
│       ├── package.json
│       ├── .env.example                  (✓ Updated)
│       ├── src/
│       │   ├── controllers/
│       │   │   └── authController.js     (✓ Updated)
│       │   ├── services/
│       │   │   └── captchaService.js     (✓ NEW)
│       │   └── routes/
│       │       └── authRoutes.js         (No change needed)
│       │
```

## Technology Stack

```
FRONTEND
├─ React 19
├─ React Router 7
├─ Axios (HTTP)
├─ React Hot Toast (Notifications)
├─ TailwindCSS (Styling)
└─ @cloudflare/turnstile (NEW CAPTCHA)

BACKEND
├─ Express.js
├─ MongoDB
├─ JWT (Authentication)
├─ bcrypt (Password hashing)
├─ Axios (for Cloudflare verification) (NEW)
└─ Express Async Handler

INFRASTRUCTURE
├─ Cloudflare Turnstile (CAPTCHA)
├─ Node.js Runtime
└─ MongoDB Database
```

## Performance Considerations

```
PERFORMANCE METRICS

CAPTCHA Load Time
├─ Script download: ~50-100ms
├─ Widget render: ~200-500ms
└─ Total: ~250-600ms

Token Verification
├─ Network to Cloudflare: ~100-500ms
├─ Cloudflare processing: ~50-200ms
├─ Response to backend: ~100-200ms
└─ Total: ~250-900ms

Login Flow (with CAPTCHA)
├─ Form submission: ~1-2ms
├─ Backend processing: ~200-500ms
├─ CAPTCHA verification: ~250-900ms
├─ Password verification: ~50-100ms
├─ JWT generation: ~10-20ms
└─ Total: ~500-1500ms

User Experience
├─ Page load: Fast (script async)
├─ CAPTCHA: Invisible for trusted users (Managed)
├─ Login: Slightly slower (CAPTCHA check added)
└─ Error handling: Instant feedback

OPTIMIZATION
✓ Turnstile script loaded asynchronously
✓ CAPTCHA rendered in background
✓ Verification timeout set to 10s
✓ Error messages appear instantly
✓ CAPTCHA resets efficiently
```

## Deployment Checklist

```
PRE-DEPLOYMENT
□ Get Cloudflare Turnstile keys
□ Add keys to environment files
□ Run npm install in frontend
□ Test locally with real keys
□ Test error scenarios
□ Review error messages
□ Check backend logs

DEPLOYMENT
□ Set production environment variables
□ Enable HTTPS on domain
□ Configure domain in Cloudflare
□ Deploy backend first
□ Deploy frontend after
□ Test login flow
□ Monitor for errors

POST-DEPLOYMENT
□ Check Cloudflare dashboard
□ Monitor login metrics
□ Review error logs
□ Test on multiple devices
□ Verify user experience
□ Set up alerts/monitoring
```

---

This architecture diagram provides a complete overview of how Cloudflare CAPTCHA integrates with your Al-Noran system.
