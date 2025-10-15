package noran.desktop.Controllers;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import javafx.scene.control.*;
import org.json.JSONObject;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class LoginController {

    @FXML
    private TextField usernameField;

    @FXML
    private PasswordField passwordField;

    @FXML
    private Button loginButton;

    @FXML
    private Hyperlink forgotPasswordLink;

    // ✅ Your Node.js backend URL
    private static final String LOGIN_URL = "http://localhost:3500/api/users/login";

    @FXML
    void onLoginClicked(ActionEvent event) {
        String username = usernameField.getText().trim();
        String password = passwordField.getText().trim();

        if (username.isEmpty() || password.isEmpty()) {
            showAlert(Alert.AlertType.WARNING, "الحقول مفقودة", "الرجاء إدخال اسم المستخدم وكلمة المرور.");
            return;
        }

        try {
            // 1️⃣ Prepare JSON payload
            JSONObject loginData = new JSONObject();
            loginData.put("identifier", username);
            loginData.put("password", password);

            // 2️⃣ Open HTTP connection
            URL url = new URL(LOGIN_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setDoOutput(true);

            // 3️⃣ Send request body
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = loginData.toString().getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            // 4️⃣ Read response
            int status = conn.getResponseCode();
            InputStream is = (status >= 200 && status < 300)
                    ? conn.getInputStream()
                    : conn.getErrorStream();

            BufferedReader reader = new BufferedReader(new InputStreamReader(is, "utf-8"));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line.trim());
            }

            conn.disconnect();

            // 5️⃣ Handle JSON response
            JSONObject jsonResponse = new JSONObject(response.toString());

            if (status == 200) {
                JSONObject user = jsonResponse.getJSONObject("user");
                String usernameResponse = user.getString("username");
                String token = jsonResponse.getString("token");

                // You can store token globally or in a file
                System.out.println("JWT Token: " + token);

                showAlert(Alert.AlertType.INFORMATION, "تسجيل الدخول ناجح", "مرحبًا، " + usernameResponse + "!");
                navigateToMainPage(event);
            } else {
                String errorMessage = jsonResponse.optString("error", "فشل تسجيل الدخول");
                showAlert(Alert.AlertType.ERROR, "خطأ", errorMessage);
            }

        } catch (Exception e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "خطأ في الاتصال", "تعذر الاتصال بالخادم. تأكد من أن السيرفر يعمل على localhost:3500");
        }
    }

    @FXML
    void onForgotPasswordClicked(ActionEvent event) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/email-for-otp-ar.fxml"));
            Parent root = loader.load();
            Scene scene = new Scene(root);

            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.setScene(scene);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر فتح شاشة إعادة تعيين كلمة المرور.");
        }
    }

    private void showAlert(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.getDialogPane().setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
        alert.showAndWait();
    }

    private void navigateToMainPage(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/main-page.fxml"));
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            Scene scene = new Scene(root);
            stage.setScene(scene);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر فتح الصفحة الرئيسية.");
        }
    }
}
