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

        // Match backend keys exactly
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

                // ---------------------------------------------------------
                // 🔴 CRITICAL FIX: Save Token to AppSession immediately
                // ---------------------------------------------------------
                String token = json.getString("token");
                noran.desktop.AppSession.getInstance().setAuthToken(token);

                String extractedId = "";
                String extractedName = "";
                String extractedRole = "";
                String extractedEmail = "";

                try {
                    if (json.has("user") && json.get("user") instanceof JSONObject) {
                        JSONObject u = json.getJSONObject("user");
                        extractedId = u.optString("id", u.optString("_id", u.optString("userId", "")));
                        extractedName = u.optString("name", u.optString("username", u.optString("fullname", "")));
                        extractedRole = u.optString("type", u.optString("role", ""));
                        extractedEmail = u.optString("email", "");
                    } else {
                        extractedId = json.optString("id", json.optString("_id", ""));
                        extractedName = json.optString("name", json.optString("username", ""));
                        extractedRole = json.optString("type", json.optString("role", ""));
                        extractedEmail = json.optString("email", "");
                    }

                    // 🛑 ACCESS CONTROL CHECK 🛑
                    // Check if role is strictly "employee" (ignoring case)
                    if (!extractedRole.equalsIgnoreCase("employee")) {
                        showAlert(Alert.AlertType.ERROR, "تم رفض الوصول",
                                "هذا التطبيق مخصص للموظفين فقط.\n(الدور الحالي: " + extractedRole + ")");
                        return; // Stop here, do not load dashboard
                    }

                    // Create user and save to session
                    noran.desktop.Controllers.User loggedInUser = new noran.desktop.Controllers.User(extractedId,
                            extractedName, extractedRole, extractedEmail);
                    noran.desktop.AppSession.getInstance().setCurrentUser(loggedInUser);

                } catch (Exception ex) {
                    ex.printStackTrace();
                    showAlert(Alert.AlertType.ERROR, "خطأ", "حدث خطأ أثناء معالجة بيانات المستخدم.");
                    return;
                }

                showAlert(Alert.AlertType.INFORMATION, "تم تسجيل الدخول", "أهلاً بك يا " + extractedName);

                // Navigate to Dashboard - use setRoot to preserve window size
                FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/dashboard.fxml"));
                Parent root = loader.load();
                Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
                stage.getScene().setRoot(root);

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
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.getScene().setRoot(root);
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