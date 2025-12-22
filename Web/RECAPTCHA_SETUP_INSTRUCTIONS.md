# reCAPTCHA v2 Setup Instructions

## ✅ What Was Done

I've successfully integrated **Google reCAPTCHA v2** into your login page. The implementation includes:

1. ✅ Added `ReCAPTCHA` component to LoginPage.jsx
2. ✅ Added captcha token validation before login
3. ✅ Added automatic reset on login error
4. ✅ Arabic language support (`hl="ar"`)
5. ✅ Light theme for better visibility

## 🚨 IMPORTANT: You Need to Get reCAPTCHA Keys

The message **"يرجى إكمال التحقق الأمني"** (Please complete security verification) appears because:
- ❌ You don't have a valid reCAPTCHA Site Key configured yet
- ❌ Backend expects a captcha token but frontend wasn't sending it

## 📝 Quick Setup (5 Minutes)

### Step 1: Get Your reCAPTCHA Keys

1. Go to: **https://www.google.com/recaptcha/admin**
2. Sign in with your Google account
3. Click **"+"** to create a new site
4. Fill in the form:
   - **Label**: `Al-Noran System` (or any name)
   - **reCAPTCHA type**: Select **"reCAPTCHA v2"** → **"I'm not a robot" Checkbox**
   - **Domains**: 
     - Add `localhost` (for development)
     - Add your production domain (e.g., `alnoran.com`)
   - Accept the Terms of Service
5. Click **"Submit"**
6. Copy both:
   - ✅ **Site Key** (starts with `6L...`)
   - ✅ **Secret Key** (starts with `6L...`)

### Step 2: Configure Frontend

Edit `Web/frontend/.env`:

```env
VITE_GOOGLE_RECAPTCHA_SITE_KEY=6Lxxx_YOUR_SITE_KEY_HERE_xxxxx
```

**Replace** `your_recaptcha_site_key_here` with your **Site Key**.

### Step 3: Configure Backend

Edit `Web/backend/.env`:

```env
GOOGLE_RECAPTCHA_SECRET_KEY=6Lxxx_YOUR_SECRET_KEY_HERE_xxxxx
```

**Replace** with your **Secret Key**.

### Step 4: Restart Both Servers

```bash
# Terminal 1 - Backend
cd Web/backend
npm start

# Terminal 2 - Frontend  
cd Web/frontend
npm run dev
```

### Step 5: Test

1. Open http://localhost:5173/login
2. You should see a **reCAPTCHA checkbox** below the password field
3. ✅ Check the box "I'm not a robot"
4. Try logging in - it should work now!

## 🎯 What You'll See

### Before (Current Issue):
- ❌ No reCAPTCHA visible
- ❌ Error: "يرجى إكمال التحقق الأمني"
- ❌ Cannot login

### After (With Valid Keys):
- ✅ reCAPTCHA checkbox appears on login page
- ✅ Users must check "I'm not a robot"
- ✅ Login works normally
- ✅ Protection against bots

## 🔍 Troubleshooting

### Issue: reCAPTCHA doesn't show up

**Solution:**
1. Check if `VITE_GOOGLE_RECAPTCHA_SITE_KEY` is in `.env`
2. Make sure it starts with `6L`
3. Restart the dev server (`npm run dev`)

### Issue: "Invalid site key"

**Solution:**
1. Go back to https://www.google.com/recaptcha/admin
2. Verify you copied the **Site Key** (not Secret Key)
3. Check that `localhost` is in the domains list

### Issue: Backend still says "Please complete security verification"

**Solution:**
1. Check `Web/backend/.env` has `GOOGLE_RECAPTCHA_SECRET_KEY`
2. Restart backend server
3. Clear browser cache

## 📄 Files Modified

1. ✅ `Web/frontend/src/pages/LoginPage.jsx` - Added reCAPTCHA component
2. ✅ `Web/frontend/.env` - Added placeholder for site key
3. ℹ️ Backend already has reCAPTCHA verification implemented

## 🔐 Security Notes

- ✅ reCAPTCHA v2 provides visible checkbox verification
- ✅ Protects against automated bot attacks
- ✅ Token is validated on backend
- ✅ Automatically resets on failed login attempts
- ✅ Arabic language support for better UX

## 📞 Need Help?

If you still see issues after following these steps:
1. Check browser console for errors (F12)
2. Check backend logs for CAPTCHA errors
3. Verify both keys are correctly configured
4. Make sure you selected **reCAPTCHA v2 Checkbox** (not v3 or invisible)

---

**Note:** The package `react-google-recaptcha` is already installed in your project, so no additional npm install is needed!
