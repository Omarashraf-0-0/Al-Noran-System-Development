package noran.desktop.Services;

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

    // Common method for sending requests
    private static String sendRequest(String urlString, String method, String jsonBody) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlString);
            conn = (HttpURLConnection) url.openConnection();

            // 🔴 FIX: Handle PATCH method explicitly using reflection or override header
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
                        Field delegateField = HttpURLConnection.class.getDeclaredField("delegate");
                        delegateField.setAccessible(true);
                        Object delegate = delegateField.get(conn);
                        if (delegate != null) {
                            Field delegateMethodField = delegate.getClass().getSuperclass().getDeclaredField("method");
                            delegateMethodField.setAccessible(true);
                            delegateMethodField.set(delegate, "PATCH");
                        }
                    } catch (Exception ex) {
                        // FALLBACK: If reflection fails (e.g., strong security managers), use X-HTTP-Method-Override
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("X-HTTP-Method-Override", "PATCH");
                    }
                }
            } else {
                conn.setRequestMethod(method);
            }

            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true); // Allow sending body
            conn.setDoInput(true);  // Allow reading response

            // Write JSON Body (only if not null/empty)
            if (jsonBody != null && !jsonBody.isBlank()) {
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                    os.flush();
                }
            }

            // Get Response
            int status = conn.getResponseCode();
            InputStream inputStream = (status >= 200 && status < 300)
                    ? conn.getInputStream()
                    : conn.getErrorStream();

            if (inputStream == null) {
                return null; // Handle case where both streams are null
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
            if (conn != null) conn.disconnect();
        }
    }
}