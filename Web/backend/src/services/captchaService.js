const axios = require("axios");

/**
 * Verify Google reCAPTCHA v2 Token
 * @param {string} token - The reCAPTCHA token from the client
 * @returns {Promise<object>} - Verification result with success status
 */
const verifyCaptcha = async (token) => {
	try {
		if (!token) {
			console.log("⚠️ [reCAPTCHA] No token provided");
			return { success: false };
		}

		const secretKey = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
		if (!secretKey) {
			console.warn("⚠️ [reCAPTCHA] GOOGLE_RECAPTCHA_SECRET_KEY not configured");
			return { success: true }; // Skip verification if secret key is not configured
		}

		const response = await axios.post(
			"https://www.google.com/recaptcha/api/siteverify",
			{
				secret: secretKey,
				response: token,
			},
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				timeout: 10000, // 10 second timeout
			}
		);

		const { success, challenge_ts, hostname, error_codes } = response.data;

		if (success) {
			console.log(`✅ [reCAPTCHA] Token verified successfully. Hostname: ${hostname}`);
			return { success: true, challenge_ts, hostname };
		} else {
			console.warn(`⚠️ [reCAPTCHA] Verification failed - Error codes:`, error_codes);
			return { success: false, error_codes };
		}
	} catch (error) {
		console.error("❌ [reCAPTCHA] Verification error:", error.message);
		// In case of network error, don't block the login but log it
		// You can change this behavior based on your security requirements
		return { success: false, error: error.message };
	}
};

module.exports = {
	verifyCaptcha,
};
