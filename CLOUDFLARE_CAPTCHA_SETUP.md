# Cloudflare Turnstile CAPTCHA Integration Guide

## Overview
This guide explains how to set up Cloudflare Turnstile CAPTCHA for your login page to protect against automated attacks and bot abuse.

## Features
- ✅ Intelligent CAPTCHA that's invisible for trusted users
- ✅ Better user experience than traditional CAPTCHAs
- ✅ Backend verification for additional security
- ✅ Configurable error handling
- ✅ Support for multiple challenge types (Managed/Non-Managed)

## Step 1: Create Cloudflare Turnstile Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. In the left sidebar, find and click **"Turnstile"**
3. Click **"Create Site"**
4. Fill in the site details:
   - **Site Name**: Your application name (e.g., "Al-Noran Login")
   - **Domain**: Your domain (e.g., alnoran.com)
   - **Challenge Type**: Select "Managed" (recommended for better UX)
   - **Mode**: Choose between testing and production mode
5. Click **"Create"**
6. Copy your **Site Key** and **Secret Key**

## Step 2: Configure Frontend

### 2.1 Install Dependencies
```bash
cd Web/frontend
npm install @cloudflare/turnstile
```

### 2.2 Set Environment Variables
Create or update `.env` file in `Web/frontend/`:
```env
VITE_CLOUDFLARE_SITE_KEY=your_site_key_here
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Replace `your_site_key_here` with the **Site Key** from Cloudflare.

### 2.3 Verify Implementation
The LoginPage component now includes:
- Automatic Turnstile script loading
- CAPTCHA widget rendering
- Token validation before login
- Error handling and reset on failure

## Step 3: Configure Backend

### 3.1 Set Environment Variables
Update `.env` file in `Web/backend/`:
```env
CLOUDFLARE_SECRET_KEY=your_secret_key_here
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# ... other existing variables
```

Replace `your_secret_key_here` with the **Secret Key** from Cloudflare.

### 3.2 Verify Installation
The login controller now:
- Validates the CAPTCHA token from the frontend
- Verifies it with Cloudflare servers
- Rejects login if CAPTCHA verification fails
- Handles network errors gracefully

## Step 4: Testing

### Local Testing
1. Start the backend:
```bash
cd Web/backend
npm start
```

2. Start the frontend:
```bash
cd Web/frontend
npm run dev
```

3. Go to login page and you should see the Turnstile CAPTCHA widget
4. Complete the CAPTCHA challenge
5. Try logging in

### Test Mode
For development, you can use Cloudflare's test keys:
- **Site Key**: `1x00000000000000000000AA`
- **Secret Key**: `1x0000000000000000000000000000000AA`

Add these to your `.env` files for testing without creating a real Turnstile account.

## Step 5: Deployment

### Production Considerations
1. **Use Production Keys**: Replace test keys with real production keys before deploying
2. **HTTPS Required**: Turnstile requires HTTPS in production
3. **Domain Validation**: Ensure your domain is properly configured in Cloudflare
4. **Monitor Logs**: Check server logs for CAPTCHA verification failures

### Environment Configuration
```bash
# Production .env for frontend
VITE_CLOUDFLARE_SITE_KEY=your_production_site_key
VITE_API_URL=https://api.yourdomain.com

# Production .env for backend
CLOUDFLARE_SECRET_KEY=your_production_secret_key
```

## Troubleshooting

### CAPTCHA Widget Not Showing
- Check if `VITE_CLOUDFLARE_SITE_KEY` is set in frontend `.env`
- Verify the Turnstile script is loading (check browser console)
- Ensure your domain is whitelisted in Cloudflare Turnstile settings

### "Token verification failed" Error
- Verify `CLOUDFLARE_SECRET_KEY` is set correctly in backend `.env`
- Check if secret key is from the same site as the site key
- Ensure the token hasn't expired (tokens are valid for a short time)

### CAPTCHA Always Fails
- Check backend logs for detailed error messages
- Verify the domain in Cloudflare matches your deployment domain
- Ensure backend can reach Cloudflare servers (check firewall/proxy)

### Rate Limiting Issues
- Turnstile automatically handles rate limiting
- If issues persist, contact Cloudflare support

## API Changes

### Login Endpoint
**Before:**
```javascript
POST /api/auth/login
{
  email: "user@example.com",
  password: "password123"
}
```

**After:**
```javascript
POST /api/auth/login
{
  email: "user@example.com",
  password: "password123",
  captchaToken: "0.A1b2C3d4E5f6G7h8..." // Added
}
```

## Security Best Practices

1. **Never expose your Secret Key** in frontend code
2. **Use HTTPS** for all communications
3. **Monitor login attempts** for suspicious activity
4. **Rotate keys periodically** in production
5. **Configure rate limiting** on the login endpoint
6. **Log CAPTCHA failures** for security analysis

## Challenge Type Comparison

### Managed Challenge (Recommended)
- ✅ Better UX - invisible for trusted users
- ✅ Automatically adjusts difficulty
- ✅ Lower friction
- ⚠️ Less control over challenge difficulty

### Non-Managed Challenge
- ✅ Full control over difficulty
- ✅ Customizable error messages
- ⚠️ Always visible to users
- ⚠️ Higher friction

## Additional Resources

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Turnstile GitHub](https://github.com/cloudflare/turnstile)
- [Security Best Practices](https://developers.cloudflare.com/turnstile/get-started/)

## Support

For issues with:
- **Cloudflare Turnstile**: Visit [Cloudflare Community](https://community.cloudflare.com/)
- **Al-Noran Implementation**: Check the backend logs for CAPTCHA errors
- **Integration Help**: Review the code in `LoginPage.jsx` and `authController.js`

## Files Modified

### Frontend
- `Web/frontend/package.json` - Added @cloudflare/turnstile dependency
- `Web/frontend/src/pages/LoginPage.jsx` - Integrated Turnstile CAPTCHA
- `Web/frontend/.env.example` - Added CAPTCHA environment variable

### Backend
- `Web/backend/src/controllers/authController.js` - Added CAPTCHA token validation
- `Web/backend/src/services/captchaService.js` - Created CAPTCHA verification service
- `Web/backend/.env.example` - Added CAPTCHA secret key

## Next Steps

1. ✅ Create Cloudflare Turnstile account
2. ✅ Add keys to environment files
3. ✅ Install frontend dependencies (`npm install`)
4. ✅ Test locally
5. ✅ Deploy to production with real keys
