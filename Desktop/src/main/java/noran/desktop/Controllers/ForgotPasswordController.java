package noran.desktop.Controllers;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.TextField;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.Node;
import javafx.stage.Stage;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.Parent;

import java.io.IOException;
import java.util.regex.Pattern;

public class ForgotPasswordController {

    @FXML
    private TextField emailField;

    /**
     * Handles the "إرسال الكود" button click
     */
    @FXML
    private void onSendCodeClicked(ActionEvent event) {
        String email = emailField.getText().trim();

        if (email.isEmpty()) {
            showAlert(AlertType.ERROR, "خطأ", "يرجى إدخال البريد الإلكتروني");
            return;
        }

        // Simple email validation
        if (!isValidEmail(email)) {
            showAlert(AlertType.ERROR, "بريد غير صالح", "الرجاء إدخال بريد إلكتروني صالح");
            return;
        }

        // Simulate sending code (you can replace this with your backend logic)
        // e.g., call API to send reset code
        showAlert(AlertType.INFORMATION, "تم الإرسال", "تم إرسال كود إعادة التعيين إلى البريد الإلكتروني");
        emailField.clear();
    }

    /**
     * Handles the "الرجوع" link click — navigates back to the login page
     */
    @FXML
    private void onBackClicked(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/fxml/Login.fxml"));
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            Scene scene = new Scene(root);
            stage.setScene(scene);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(AlertType.ERROR, "خطأ", "تعذر الرجوع إلى صفحة تسجيل الدخول");
        }
    }

    /**
     * Simple email format validation using regex
     */
    private boolean isValidEmail(String email) {
        String regex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        return Pattern.matches(regex, email);
    }

    /**
     * Utility method for showing alert dialogs
     */
    private void showAlert(AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
