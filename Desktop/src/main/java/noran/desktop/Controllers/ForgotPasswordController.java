package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import noran.desktop.Database.MongoConnection;
import org.bson.Document;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

public class ForgotPasswordController {

    @FXML
    private TextField emailField;

    @FXML
    private void onSendCodeClicked(ActionEvent event) {
        String email = emailField.getText().trim();

        if (email.isEmpty()) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "يرجى إدخال البريد الإلكتروني");
            return;
        }

        if (!isValidEmail(email)) {
            showAlert(Alert.AlertType.ERROR, "بريد غير صالح", "الرجاء إدخال بريد إلكتروني صالح");
            return;
        }

        if (!isEmailInDatabase(email)) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "البريد الإلكتروني غير موجود");
            return;
        }

        try {
            boolean success = sendOtpRequest(email);
            if (success) {
                showAlert(Alert.AlertType.INFORMATION, "تم الإرسال", "تم إرسال كود إعادة التعيين إلى البريد الإلكتروني");
                goToOTPVerificationPage(event, email);
            } else {
                showAlert(Alert.AlertType.ERROR, "خطأ", "فشل في إرسال الكود. يرجى المحاولة لاحقًا.");
            }
        } catch (IOException e) {
            showAlert(Alert.AlertType.ERROR, "خطأ في الاتصال", "تعذر الاتصال بخادم OTP. تأكد أن الخادم يعمل.");
        }
    }

    private boolean isEmailInDatabase(String email) {
        MongoCollection<Document> usersCollection = MongoConnection.getDatabase().getCollection("users");
        Document user = usersCollection.find(Filters.eq("email", email)).first();
        return user != null;
    }

    private boolean sendOtpRequest(String email) throws IOException {
        URL url = new URL("http://localhost:3500/api/otp/forgotPassword");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setDoOutput(true);

        String json = "{\"email\":\"" + email + "\"}";
        try (OutputStream os = conn.getOutputStream()) {
            os.write(json.getBytes(StandardCharsets.UTF_8));
        }

        return conn.getResponseCode() == 200;
    }

    private void goToOTPVerificationPage(ActionEvent event, String email) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/OTPVerification.fxml"));
            Parent root = loader.load();
            OTPVerificationController controller = loader.getController();
            controller.setUserEmail(email);
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.setScene(new Scene(root));
            stage.show();
        } catch (IOException e) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر فتح صفحة رمز التحقق");
        }
    }

    @FXML
    private void onBackClicked(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/login-view-ar.fxml"));
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.setScene(new Scene(root));
            stage.show();
        } catch (IOException e) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر الرجوع إلى صفحة تسجيل الدخول");
        }
    }

    private boolean isValidEmail(String email) {
        String regex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        return Pattern.matches(regex, email);
    }

    private void showAlert(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
