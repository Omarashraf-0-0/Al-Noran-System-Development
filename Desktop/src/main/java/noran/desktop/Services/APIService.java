package noran.desktop.Services;

import noran.desktop.AppSession; // ✅ Import AppSession to get the token

import java.io.*;
import java.lang.reflect.Field;
import java.net.HttpURLConnection;
import java.net.ProtocolException;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class APIService {

    // POST request
    public static String post(String urlString, String jsonBody) {
        return sendRequest(urlString, "POST", jsonBody);
    }

    // PUT request
    public static String put(String urlString, String jsonBody) {
        return sendRequest(urlString, "PUT", jsonBody);
    }

    // DELETE request
    public static String delete(String urlString) {
        return sendRequest(urlString, "DELETE", null);
    }

    // PATCH request
    public static String patch(String urlString, String jsonBody) {
        return sendRequest(urlString, "PATCH", jsonBody);
    }

    // GET request (authenticated)
    public static String get(String urlString) {
        System.out.println("[APIService] GET request to: " + urlString);
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlString);
            conn = (HttpURLConnection) url.openConnection();

            // Attach token if available
            String token = AppSession.getInstance().getAuthToken();
            System.out.println("[APIService] GET - Token available: " + (token != null && !token.isBlank()));
            if (token != null && !token.isBlank()) {
                conn.setRequestProperty("Authorization", "Bearer " + token);
            }

            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoInput(true);

            int status = conn.getResponseCode();
            System.out.println("[APIService] GET - Response status: " + status);

            InputStream inputStream = (status >= 200 && status < 300)
                    ? conn.getInputStream()
                    : conn.getErrorStream();

            if (inputStream == null) {
                System.out.println("[APIService] GET - inputStream is null");
                return null;
            }

            try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                return response.toString();
            }
        } catch (IOException e) {
            System.out.println("[APIService] GET - IOException: " + e.getMessage());
            e.printStackTrace();
            return null;
        } finally {
            if (conn != null)
                conn.disconnect();
        }
    }

    /**
     * Fetches a presigned URL for an S3 key from the backend API.
     * 
     * @param s3Key The S3 key path (e.g., "employees/123/registration/photo.jpg")
     * @return The presigned URL string, or null if failed
     */
    public static String getPresignedUrl(String s3Key) {
        if (s3Key == null || s3Key.isEmpty()) {
            System.out.println("[APIService] getPresignedUrl: s3Key is null or empty");
            return null;
        }

        System.out.println("[APIService] getPresignedUrl: Fetching presigned URL for s3Key: " + s3Key);

        try {
            String encodedKey = java.net.URLEncoder.encode(s3Key, StandardCharsets.UTF_8);
            String url = noran.desktop.AppConfig.API_PRESIGNED_URL + encodedKey;
            System.out.println("[APIService] getPresignedUrl: Calling URL: " + url);

            String response = get(url);
            System.out.println("[APIService] getPresignedUrl: Response: "
                    + (response != null ? response.substring(0, Math.min(200, response.length())) + "..." : "null"));

            if (response == null) {
                System.out.println("[APIService] getPresignedUrl: Response is null - check if backend is running");
                return null;
            }

            org.json.JSONObject json = new org.json.JSONObject(response);
            if (json.optBoolean("success", false)) {
                String presignedUrl = json.optString("url", null);
                System.out.println("[APIService] getPresignedUrl: SUCCESS - Got presigned URL");
                return presignedUrl;
            } else {
                System.out.println("[APIService] getPresignedUrl: Response success=false. Full response: " + response);
            }
        } catch (Exception e) {
            System.out.println("[APIService] getPresignedUrl: Exception: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    // Common method for sending requests
    private static String sendRequest(String urlString, String method, String jsonBody) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlString);
            conn = (HttpURLConnection) url.openConnection();

            // -----------------------------------------------------------
            // 1. 🔴 AUTHENTICATION: Attach Token if available
            // -----------------------------------------------------------
            String token = AppSession.getInstance().getAuthToken();
            if (token != null && !token.isBlank()) {
                conn.setRequestProperty("Authorization", "Bearer " + token);
            }

            // -----------------------------------------------------------
            // 2. 🔴 PATCH FIX: Handle PATCH method via Reflection/Override
            // -----------------------------------------------------------
            if (method.equals("PATCH")) {
                try {
                    conn.setRequestMethod("PATCH");
                } catch (ProtocolException e) {
                    // If standard setRequestMethod fails, use reflection to force it
                    try {
                        Field methodField = HttpURLConnection.class.getDeclaredField("method");
                        methodField.setAccessible(true);
                        methodField.set(conn, "PATCH");

                        // Also set the delegate if using newer Java versions
                        try {
                            Field delegateField = HttpURLConnection.class.getDeclaredField("delegate");
                            delegateField.setAccessible(true);
                            Object delegate = delegateField.get(conn);
                            if (delegate != null) {
                                Field delegateMethodField = delegate.getClass().getSuperclass()
                                        .getDeclaredField("method");
                                delegateMethodField.setAccessible(true);
                                delegateMethodField.set(delegate, "PATCH");
                            }
                        } catch (NoSuchFieldException ignored) {
                            // Delegate field might not exist in some JDK versions, safe to ignore
                        }
                    } catch (Exception ex) {
                        // FALLBACK: If reflection fails, use X-HTTP-Method-Override
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("X-HTTP-Method-Override", "PATCH");
                    }
                }
            } else {
                conn.setRequestMethod(method);
            }

            // -----------------------------------------------------------
            // 3. Standard Headers & Body
            // -----------------------------------------------------------
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true); // Allow sending body
            conn.setDoInput(true); // Allow reading response

            // Write JSON Body (only if not null/empty)
            if (jsonBody != null && !jsonBody.isBlank()) {
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                    os.flush();
                }
            }

            // -----------------------------------------------------------
            // 4. Get Response
            // -----------------------------------------------------------
            int status = conn.getResponseCode();
            InputStream inputStream = (status >= 200 && status < 300)
                    ? conn.getInputStream()
                    : conn.getErrorStream();

            if (inputStream == null) {
                return null;
            }

            try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                return response.toString();
            }

        } catch (IOException e) {
            e.printStackTrace();
            return null;
        } finally {
            if (conn != null)
                conn.disconnect();
        }
    }
}