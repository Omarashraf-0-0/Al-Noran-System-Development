package noran.desktop.Services;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class APIService {

    public static String post(String endpoint, String jsonBody) throws IOException {
        URL url = new URL(endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonBody.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        int responseCode = conn.getResponseCode();
        InputStream is = (responseCode >= 200 && responseCode < 300)
                ? conn.getInputStream()
                : conn.getErrorStream();

        BufferedReader br = new BufferedReader(new InputStreamReader(is, "utf-8"));
        StringBuilder response = new StringBuilder();
        String responseLine;

        while ((responseLine = br.readLine()) != null) {
            response.append(responseLine.trim());
        }

        conn.disconnect();
        return response.toString();
    }
}
