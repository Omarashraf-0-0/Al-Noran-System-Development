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

    // ✅ Match your Node.js backend
    private static final String LOGIN_URL = "http://localhost:3500/api/users/login";

    @FXML
    private void onLoginClicked(ActionEvent event) {
        try {
            String identifier = usernameField.getText();
            String password = passwordField.getText();

            if (identifier.isEmpty() || password.isEmpty()) {
                showAlert(Alert.AlertType.WARNING, "تحذير", "يرجى إدخال البريد الإلكتروني / اسم المستخدم وكلمة المرور.");
                return;
            }

            // ✅ Send JSON {identifier, password}
            String jsonBody = String.format(
                    "{\"identifier\": \"%s\", \"password\": \"%s\"}",
                    identifier, password
            );

            String response = APIService.post(LOGIN_URL, jsonBody);

            if (response == null || response.isBlank()) {
                showAlert(Alert.AlertType.ERROR, "خطأ", "فشل الاتصال بالخادم. حاول مرة أخرى.");
                return;
            }

            JSONObject jsonResponse;
            try {
                jsonResponse = new JSONObject(response);
            } catch (Exception e) {
                showAlert(Alert.AlertType.ERROR, "خطأ في الاستجابة", "الاستجابة من الخادم ليست بتنسيق JSON صحيح:\n" + response);
                return;
            }

            if (jsonResponse.has("error")) {
                showAlert(Alert.AlertType.ERROR, "فشل تسجيل الدخول", jsonResponse.getString("error"));
            } else if (jsonResponse.has("token")) {
                showAlert(Alert.AlertType.INFORMATION, "تم تسجيل الدخول", "تم تسجيل الدخول بنجاح!");


            } else {
                showAlert(Alert.AlertType.ERROR, "فشل تسجيل الدخول", "حدث خطأ غير متوقع أثناء تسجيل الدخول.");
            }

        } catch (Exception e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "خطأ غير متوقع", e.getMessage());
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
