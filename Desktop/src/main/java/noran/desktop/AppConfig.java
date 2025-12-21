package noran.desktop;

/**
 * Central configuration for the application.
 * Contains server URLs and other app-wide settings.
 */
public class AppConfig {

    // ============================================================
    // 🔧 SERVER CONFIGURATION - CHANGE THIS FOR DEPLOYMENT
    // ============================================================

    /**
     * Base URL for the backend API server.
     * 
     * FOR LOCAL DEVELOPMENT: "http://localhost:3500"
     * FOR PRODUCTION (DEPLOYED): "https://al-noran-system-development.onrender.com"
     */
    public static final String BASE_URL = "https://al-noran-system-development.onrender.com";

    // ============================================================
    // API ENDPOINTS (derived from BASE_URL)
    // ============================================================

    // User endpoints
    public static final String API_USERS = BASE_URL + "/api/users";
    public static final String API_LOGIN = API_USERS + "/login";
    public static final String API_PROFILE = API_USERS + "/profile";
    public static final String API_USERS_GET_ALL = API_USERS + "/getAll";

    // OTP endpoints
    public static final String API_OTP = BASE_URL + "/api/otp";
    public static final String API_FORGOT_PASSWORD = API_OTP + "/forgotPassword";
    public static final String API_VERIFY_OTP = API_OTP + "/verifyOTP";
    public static final String API_RESET_PASSWORD = API_OTP + "/resetPassword";

    // Shipments endpoints
    public static final String API_SHIPMENTS = BASE_URL + "/api/shipments";
    public static final String API_SHIPMENTS_GET_ALL = API_SHIPMENTS + "/getAll";
    public static final String API_SHIPMENTS_ADD = API_SHIPMENTS + "/addShipments";

    // Uploads endpoints
    public static final String API_UPLOADS = BASE_URL + "/api/uploads";
    public static final String API_PRESIGNED_URL = API_UPLOADS + "/presigned-url/";
}
