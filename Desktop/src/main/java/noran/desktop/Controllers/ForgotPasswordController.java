package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
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
import noran.desktop.Database.MongoConnection;
import org.bson.Document;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;

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

        // Validate email format
        if (!isValidEmail(email)) {
            showAlert(AlertType.ERROR, "بريد غير صالح", "الرجاء إدخال بريد إلكتروني صالح");
            return;
        }

        // Check if email exists in the database
        if (!isEmailInDatabase(email)) {
            showAlert(AlertType.ERROR, "خطأ", "البريد الإلكتروني غير موجود");
            return;
        }

        // Send the email to Node.js OTP server
        try {
            boolean success = sendOtpRequest(email);

            if (success) {
                showAlert(AlertType.INFORMATION, "تم الإرسال", "تم إرسال كود إعادة التعيين إلى البريد الإلكتروني");
                goToOTPVerificationPage(event, email);
            } else {
                showAlert(AlertType.ERROR, "خطأ", "فشل في إرسال الكود. يرجى المحاولة لاحقًا.");
            }

        } catch (IOException e) {
            e.printStackTrace();
            showAlert(AlertType.ERROR, "خطأ في الاتصال", "تعذر الاتصال بخادم OTP. تأكد أن الخادم يعمل.");
        }
    }

    /**
     * Checks if the email exists in the MongoDB users collection
     */
    private boolean isEmailInDatabase(String email) {
        MongoCollection<Document> usersCollection = MongoConnection.getDatabase().getCollection("users");
        Document user = usersCollection.find(Filters.eq("email", email)).first();
        return user != null; // Returns true if email exists, false otherwise
    }

    /**
     * Sends a POST request to Node.js OTP server
     */
    private boolean sendOtpRequest(String email) throws IOException {
        URL url = new URL("http://localhost:3500/send-otp");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setRequestProperty("Accept", "application/json");
        conn.setDoOutput(true);

        // JSON body
        String jsonInput = "{\"email\": \"" + email + "\"}";

        // Write the JSON data to the request body
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonInput.getBytes(StandardCharsets.UTF_8);
            os.write(input);
            os.flush();
        }

        int code = conn.getResponseCode();
        System.out.println("Response code: " + code);

        if (code == 200) {
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line.trim());
                }
                System.out.println("✅ Server response: " + response);
            }
            return true;
        } else {
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                StringBuilder errorResponse = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    errorResponse.append(line.trim());
                }
                System.out.println("❌ Error response: " + errorResponse);
            }
            return false;
        }
    }

    /**
     * Navigates to the OTP Verification page
     */
    private void goToOTPVerificationPage(ActionEvent event, String email) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/OTPVerification.fxml"));
            Parent root = loader.load();
            OTPVerificationController controller = loader.getController();
            controller.setUserEmail(email); // Pass email to OTPVerificationController
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            Scene scene = new Scene(root);
            stage.setScene(scene);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(AlertType.ERROR, "خطأ", "تعذر فتح صفحة رمز التحقق (OTP)");
        }
    }

    /**
     * Handles the "الرجوع" link click — navigates back to the login page
     */
    @FXML
    private void onBackClicked(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/login-view-ar.fxml"));
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
     * Simple email format validation
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