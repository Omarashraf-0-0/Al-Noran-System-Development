package noran.desktop.Controllers;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import noran.desktop.Services.APIService;
import org.json.JSONObject;

import java.io.IOException;

public class LoginController {

    @FXML
    private TextField usernameField;

    @FXML
    private PasswordField passwordField;

    // ✅ Match your backend login endpoint
    private static final String LOGIN_URL = "http://localhost:3500/api/users/login";

    @FXML
    private void onLoginClicked(ActionEvent event) {
        String identifier = usernameField.getText().trim();
        String password = passwordField.getText().trim();

        if (identifier.isEmpty() || password.isEmpty()) {
            showAlert(Alert.AlertType.WARNING, "تحذير", "يرجى إدخال البريد الإلكتروني / اسم المستخدم وكلمة المرور.");
            return;
        }

        // ✅ Match backend keys exactly: identifier and password
        String jsonBody = String.format("{\"identifier\":\"%s\",\"password\":\"%s\"}", identifier, password);

        String response = APIService.post(LOGIN_URL, jsonBody);

        if (response == null || response.isBlank()) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "فشل الاتصال بالخادم. تأكد أن السيرفر يعمل على المنفذ 3500.");
            return;
        }

        try {
            JSONObject json = new JSONObject(response);

            if (json.has("error")) {
                showAlert(Alert.AlertType.ERROR, "فشل تسجيل الدخول", json.getString("error"));
            } else if (json.has("token")) {

                // extract user info when available and store in AppSession so it's accessible app-wide
                try {
                    String extractedId = "";
                    String extractedName = "";

                    if (json.has("user") && json.get("user") instanceof JSONObject) {
                        JSONObject u = json.getJSONObject("user");
                        extractedId = u.optString("id", u.optString("_id", u.optString("userId", "")));
                        extractedName = u.optString("name", u.optString("username", u.optString("fullname", "")));
                    } else {
                        // try top-level fields as fallback
                        extractedId = json.optString("id", json.optString("_id", ""));
                        extractedName = json.optString("name", json.optString("username", json.optString("username", "")));
                    }

                    // create and store User in session
                    noran.desktop.Controllers.User loggedInUser = new noran.desktop.Controllers.User(extractedId, extractedName);
                    noran.desktop.AppSession.getInstance().setCurrentUser(loggedInUser);
                } catch (Exception ex) {
                    // don't fail login if parsing user info fails — keep going
                    ex.printStackTrace();
                }
                showAlert(Alert.AlertType.INFORMATION, "تم تسجيل الدخول", "تم تسجيل الدخول بنجاح!");
                FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/dashboard.fxml"));
                Parent root = loader.load();
                Scene scene = new Scene(root);
                Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
                stage.setScene(scene);
                stage.show();
            } else {
                showAlert(Alert.AlertType.INFORMATION, "استجابة الخادم", response);
            }

        } catch (Exception e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "خطأ في الاستجابة", "تعذر تحليل استجابة JSON:\n" + response);
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

    private void showAlert(Alert.AlertType alertType, String title, String message) {
        Alert alert = new Alert(alertType);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
