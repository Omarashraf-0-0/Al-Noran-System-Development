# OTP Verification Page - Documentation

## 📋 Overview
Created a complete OTP (One-Time Password) verification page following the same design principles as the ForgetPasswordPage, with Arabic text and proper routing flow.

## 🎨 Components Created

### 1. **OTPInput.jsx** (`src/components/OTPInput.jsx`)
A reusable component with 6 input boxes for OTP digits.

**Features:**
- ✅ 6 individual input boxes for digits
- ✅ Auto-focus on first input
- ✅ Auto-advance to next input when typing
- ✅ Backspace navigation between inputs
- ✅ Arrow key navigation (left/right)
- ✅ Paste support (automatically splits pasted code)
- ✅ Only accepts numeric input
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Visual feedback (border color changes)
- ✅ RTL support with LTR digit display

**Props:**
- `length` (number, default: 6): Number of OTP digits
- `value` (string): Current OTP value
- `onChange` (function): Callback when OTP changes

### 2. **OTPForm.jsx** (`src/components/OTPForm.jsx`)
The form component that contains the OTP input and submit button.

**Features:**
- ✅ OTP input with validation
- ✅ Email display (from previous step)
- ✅ Submit button (disabled until all 6 digits entered)
- ✅ Resend OTP functionality
- ✅ Back to previous page link
- ✅ Arabic text throughout
- ✅ Loading state for resend button

**Props:**
- `onSubmit` (function): Callback when form is submitted
- `email` (string): User's email address to display

### 3. **OTPPage.jsx** (`src/pages/OTPPage.jsx`)
The main page component that integrates everything.

**Features:**
- ✅ Uses same layout as ForgetPasswordPage (Navbar + BackgroundContainer + FormContainer)
- ✅ Receives email from previous page via React Router state
- ✅ Redirects to forget-password if no email provided
- ✅ Ready for backend integration (commented code included)
- ✅ Toast notifications

## 🔄 Navigation Flow

```
ForgetPasswordPage → OTPPage → (Future: ResetPasswordPage)
   /forget-password     /verify-otp
```

### Flow Details:
1. User enters email on `/forget-password`
2. Clicks "إرسال" (Send)
3. Navigates to `/verify-otp` with email in state
4. User enters 6-digit OTP
5. Clicks "تأكيد" (Confirm)
6. (Ready for next step: reset password page)

## 🛠️ Backend Integration Guide

### When Your Backend is Ready:

#### 1. **Send OTP Endpoint** (in `ForgetPasswordPage.jsx`)
Replace the commented code around line 14-27 with your actual API call:

\`\`\`javascript
const handleForgotPassword = async (formData) => {
    try {
        const response = await axios.post(\`\${import.meta.env.VITE_API_URL}/api/auth/forgot-password\`, {
            email: formData.email
        });
        
        if (response.data.success) {
            toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
            navigate("/verify-otp", { state: { email: formData.email } });
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "فشل في إرسال رمز التحقق");
    }
};
\`\`\`

#### 2. **Verify OTP Endpoint** (in `OTPPage.jsx`)
Replace the commented code around line 23-38 with your actual API call:

\`\`\`javascript
const handleVerifyOTP = async (formData) => {
    try {
        const response = await axios.post(\`\${import.meta.env.VITE_API_URL}/api/auth/verify-otp\`, {
            email: formData.email,
            otp: formData.otp
        });
        
        if (response.data.success) {
            toast.success("تم التحقق بنجاح!");
            navigate("/reset-password", { 
                state: { 
                    email: formData.email, 
                    token: response.data.token // or whatever your backend returns
                } 
            });
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "فشل التحقق من الرمز");
    }
};
\`\`\`

#### 3. **Resend OTP Endpoint** (in `OTPForm.jsx`)
Replace the commented code around line 21 with your actual API call:

\`\`\`javascript
const handleResendOTP = async () => {
    setIsResending(true);
    try {
        await axios.post(\`\${import.meta.env.VITE_API_URL}/api/auth/resend-otp\`, { 
            email 
        });
        toast.success("تم إعادة إرسال الرمز بنجاح");
    } catch (error) {
        toast.error(error.response?.data?.message || "فشل في إعادة إرسال الرمز");
    } finally {
        setIsResending(false);
    }
};
\`\`\`

## 📱 Routes Added

Added to `src/App.jsx`:
- `/forget-password` - Forget password page (also fixed the route from `/forgetpassword`)
- `/verify-otp` - OTP verification page (NEW)

## 🎨 Design Consistency

The OTP page follows the exact same design pattern as ForgetPasswordPage:
- ✅ Same color scheme (#690000 primary color)
- ✅ Same component structure (Navbar, BackgroundContainer, FormContainer)
- ✅ Same spacing using Spacer component
- ✅ Same button styles
- ✅ Same Arabic text style and formatting
- ✅ Same responsive breakpoints (sm, md, lg)
- ✅ Same hover and focus states

## 🌐 Arabic Text Used

- **Title:** "التحقق من الرمز" (Verify Code)
- **Subtitle:** "أدخل الرمز المكون من 6 أرقام المرسل إلى" (Enter the 6-digit code sent to)
- **Button:** "تأكيد" (Confirm)
- **Resend text:** "لم تستلم الرمز؟" (Didn't receive the code?)
- **Resend button:** "إعادة إرسال الرمز" (Resend code)
- **Loading:** "جاري الإرسال..." (Sending...)
- **Back link:** "العودة للخلف" (Go back)

## 🧪 Testing the Page

1. Start the frontend:
   \`\`\`bash
   cd Web/frontend
   npm run dev
   \`\`\`

2. Navigate to: `http://localhost:5173/forget-password`

3. Enter any email and click "إرسال"

4. You should be redirected to `/verify-otp` with the email displayed

5. Try entering the OTP:
   - Type digits (should auto-advance)
   - Use backspace to go back
   - Paste a 6-digit code (should auto-fill)
   - Try the resend button
   - Verify the back link works

## 📦 Files Modified/Created

**Created:**
- `src/components/OTPInput.jsx` - OTP input component (6 boxes)
- `src/components/OTPForm.jsx` - Form wrapper with submit logic
- `src/pages/OTPPage.jsx` - Main OTP verification page

**Modified:**
- `src/App.jsx` - Added OTP route + fixed forget-password route
- `src/pages/ForgetPasswordPage.jsx` - Added navigation to OTP page
- `src/components/ForgetPasswordForm.jsx` - Fixed email field binding + added form submit

## 🔐 Security Notes

When implementing backend:
- OTP should expire after 5-10 minutes
- Limit OTP attempts (max 3-5 attempts)
- Rate limit resend requests (max 1 per minute)
- Use secure random generation for OTP
- Send OTP via email (or SMS for production)
- Consider adding countdown timer for resend button

## 🎯 Next Steps (For Your Backend Friend)

Required API endpoints:

1. **POST `/api/auth/forgot-password`**
   - Body: `{ email }`
   - Action: Generate OTP, send via email
   - Response: `{ success: true, message: "OTP sent" }`

2. **POST `/api/auth/verify-otp`**
   - Body: `{ email, otp }`
   - Action: Verify OTP matches
   - Response: `{ success: true, token: "..." }` (for reset password)

3. **POST `/api/auth/resend-otp`**
   - Body: `{ email }`
   - Action: Generate new OTP, send via email
   - Response: `{ success: true, message: "OTP resent" }`

## ✅ Ready for Production

The page is fully functional and styled. Once your backend friend provides the endpoints, simply uncomment the API calls and update the endpoint URLs!
