package noran.desktop.Controllers;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import org.json.JSONObject;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class LoginController {

    @FXML
    private TextField usernameField;

    @FXML
    private PasswordField passwordField;

    private static final String LOGIN_URL = "http://localhost:3500/api/auth/login";

    @FXML
    protected void onLoginClicked(ActionEvent event) {
        String username = usernameField.getText().trim();
        String password = passwordField.getText().trim();

        if (username.isEmpty() || password.isEmpty()) {
            showAlert(Alert.AlertType.ERROR, "Email/Username and Password are required!");
            return;
        }

        try {
            // ✅ 1. Create JSON body
            JSONObject loginData = new JSONObject();
            loginData.put("identifier", username);
            loginData.put("password", password);

            // ✅ 2. Open HTTP connection
            URL url = new URL(LOGIN_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            conn.setDoInput(true);

            // ✅ 3. Write JSON body to request
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = loginData.toString().getBytes("UTF-8");
                os.write(input, 0, input.length);
                os.flush();
            }

            // ✅ 4. Get response
            int responseCode = conn.getResponseCode();
            InputStream is = (responseCode >= 200 && responseCode < 300)
                    ? conn.getInputStream()
                    : conn.getErrorStream();

            BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }

            reader.close();
            conn.disconnect();

            // ✅ 5. Parse server response
            JSONObject jsonResponse = new JSONObject(response.toString());

            if (jsonResponse.has("message") && jsonResponse.getString("message").toLowerCase().contains("success")) {
                showAlert(Alert.AlertType.INFORMATION, "✅ تسجيل الدخول ناجح!");
            } else {
                showAlert(Alert.AlertType.ERROR, jsonResponse.optString("message", "❌ خطأ في تسجيل الدخول"));
            }

        } catch (IOException e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "⚠️ Connection error: " + e.getMessage());
        }
    }

    private void showAlert(Alert.AlertType alertType, String message) {
        Alert alert = new Alert(alertType);
        alert.setTitle("Login Status");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
