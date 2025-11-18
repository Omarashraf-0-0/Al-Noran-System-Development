package noran.desktop.Services;

import java.io.*;
import java.net.HttpURLConnection;
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

    // Common method for sending requests
    private static String sendRequest(String urlString, String method, String jsonBody) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlString);
            conn = (HttpURLConnection) url.openConnection();

            conn.setRequestMethod(method);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            conn.setDoInput(true);

            // Send JSON body if provided
            if (jsonBody != null && !jsonBody.isBlank()) {
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                    os.flush();
                }
            }

            // Read response
            int status = conn.getResponseCode();
            InputStream inputStream = (status >= 200 && status < 300)
                    ? conn.getInputStream()
                    : conn.getErrorStream();

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
