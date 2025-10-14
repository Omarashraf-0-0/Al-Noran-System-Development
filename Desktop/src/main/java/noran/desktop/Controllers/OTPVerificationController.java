package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.Parent;
import javafx.stage.Stage;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Alert;
import javafx.scene.control.TextField;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Dialog;
import javafx.scene.layout.VBox;
import javafx.scene.control.Label;
import noran.desktop.Database.MongoConnection;
import org.bson.Document;
import org.mindrot.jbcrypt.BCrypt;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class OTPVerificationController {

    @FXML private TextField otp1;
    @FXML private TextField otp2;
    @FXML private TextField otp3;
    @FXML private TextField otp4;
    @FXML private TextField otp5;
    private String userEmail; // To store the email from ForgotPasswordController

    /**
     * Initialize the controller, adding listeners to restrict OTP fields to single digits
     */
    @FXML
    private void initialize() {
        // Restrict each OTP field to a single numeric character
        restrictToSingleDigit(otp1);
        restrictToSingleDigit(otp2);
        restrictToSingleDigit(otp3);
        restrictToSingleDigit(otp4);
        restrictToSingleDigit(otp5);
    }

    /**
     * Restrict TextField to accept only one numeric character
     */
    private void restrictToSingleDigit(TextField textField) {
        textField.textProperty().addListener((observable, oldValue, newValue) -> {
            if (!newValue.matches("\\d?")) {
                textField.setText(oldValue); // Revert to previous value if not a digit
            }
            if (newValue.length() > 1) {
                textField.setText(newValue.substring(0, 1)); // Limit to one character
            }
        });
    }

    // Setter for email (to be called from ForgotPasswordController)
    public void setUserEmail(String email) {
        this.userEmail = email;
    }

    /**
     * Handle "الرجوع" link click
     */
    @FXML
    private void onBackClicked(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/email-for-otp-ar.fxml"));
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            Scene scene = new Scene(root);
            stage.setScene(scene);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(AlertType.ERROR, "خطأ", "تعذر الرجوع إلى صفحة البريد الإلكتروني");
        }
    }

    /**
     * Handle "إعادة إرسال الكود"
     */
    @FXML
    private void onResendClicked(ActionEvent event) {
        try {
            boolean success = resendOtpRequest(userEmail);
            if (success) {
                showAlert(AlertType.INFORMATION, "تم الإرسال", "تمت إعادة إرسال رمز التحقق إلى بريدك الإلكتروني");
            } else {
                showAlert(AlertType.ERROR, "خطأ", "فشل في إعادة إرسال الكود. يرجى المحاولة لاحقًا.");
            }
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(AlertType.ERROR, "خطأ في الاتصال", "تعذر الاتصال بخادم OTP. تأكد أن الخادم يعمل.");
        }
    }

    /**
     * Resend OTP request to Node.js server
     */
    private boolean resendOtpRequest(String email) throws IOException {
        URL url = new URL("http://localhost:3000/send-otp");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setRequestProperty("Accept", "application/json");
        conn.setDoOutput(true);

        String jsonInput = "{\"email\": \"" + email + "\"}";
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonInput.getBytes(StandardCharsets.UTF_8);
            os.write(input);
            os.flush();
        }

        int code = conn.getResponseCode();
        return code == 200;
    }

    /**
     * Handle "تأكيد الكود"
     */
    @FXML
    private void onConfirmClicked(ActionEvent event) {
        // Validate OTP fields
        String otp = getOtpInput();
        if (otp == null) {
            showAlert(AlertType.ERROR, "خطأ", "يرجى إدخال رمز مكون من 5 أرقام");
            return;
        }

        // Reverse the OTP back to original order for server verification
        String originalOtp = new StringBuilder(otp).reverse().toString();

        try {
            boolean isValidOtp = verifyOtp(userEmail, originalOtp);
            if (isValidOtp) {
                showResetPasswordDialog(event);
            } else {
                showAlert(AlertType.ERROR, "خطأ", "رمز التحقق غير صحيح");
            }
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(AlertType.ERROR, "خطأ في الاتصال", "تعذر التحقق من رمز OTP. تأكد أن الخادم يعمل.");
        }
    }

    /**
     * Get and validate OTP input from text fields
     */
    private String getOtpInput() {
        // Read fields in reverse order for RTL (otp1 is last digit, otp5 is first)
        String otp = otp5.getText() + otp4.getText() + otp3.getText() + otp2.getText() + otp1.getText();
        if (otp.length() != 5 || !otp.matches("\\d{5}")) {
            return null; // Return null if input is invalid
        }
        return otp;
    }

    /**
     * Verify OTP with Node.js server
     */
    private boolean verifyOtp(String email, String otp) throws IOException {
        URL url = new URL("http://localhost:3000/verify-otp");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setRequestProperty("Accept", "application/json");
        conn.setDoOutput(true);

        String jsonInput = "{\"email\": \"" + email + "\", \"otp\": \"" + otp + "\"}";
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonInput.getBytes(StandardCharsets.UTF_8);
            os.write(input);
            os.flush();
        }

        int code = conn.getResponseCode();
        if (code == 200) {
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line.trim());
                }
                return response.toString().contains("OTP verified successfully");
            }
        }
        return false;
    }

    /**
     * Show dialog for resetting password
     */
    private void showResetPasswordDialog(ActionEvent event) {
        Dialog<ButtonType> dialog = new Dialog<>();
        dialog.setTitle("إعادة تعيين كلمة المرور");
        dialog.setHeaderText("أدخل كلمة المرور الجديدة");

        VBox content = new VBox(10);
        TextField newPasswordField = new TextField();
        newPasswordField.setPromptText("كلمة المرور الجديدة");
        TextField confirmPasswordField = new TextField();
        confirmPasswordField.setPromptText("تأكيد كلمة المرور");
        content.getChildren().addAll(
                new Label("كلمة المرور الجديدة:"),
                newPasswordField,
                new Label("تأكيد كلمة المرور:"),
                confirmPasswordField
        );

        dialog.getDialogPane().setContent(content);
        dialog.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);

        dialog.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                String newPassword = newPasswordField.getText();
                String confirmPassword = confirmPasswordField.getText();

                if (newPassword.isEmpty() || confirmPassword.isEmpty()) {
                    showAlert(AlertType.ERROR, "خطأ", "يرجى ملء جميع الحقول");
                    return;
                }

                if (!newPassword.equals(confirmPassword)) {
                    showAlert(AlertType.ERROR, "خطأ", "كلمات المرور غير متطابقة");
                    return;
                }

                try {
                    boolean success = updatePassword(userEmail, newPassword);
                    if (success) {
                        showAlert(AlertType.INFORMATION, "نجاح", "تم تحديث كلمة المرور بنجاح");
                        // Navigate back to login page
                        Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/login-view-ar.fxml"));
                        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
                        Scene scene = new Scene(root);
                        stage.setScene(scene);
                        stage.show();
                    } else {
                        showAlert(AlertType.ERROR, "خطأ", "فشل في تحديث كلمة المرور");
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                    showAlert(AlertType.ERROR, "خطأ", "تعذر تحديث كلمة المرور");
                }
            }
        });
    }

    /**
     * Update password in MongoDB and Node.js server
     */
    private boolean updatePassword(String email, String newPassword) throws IOException {
        // Hash the password using bcrypt
        String hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt(10));

        // Update in MongoDB
        MongoCollection<Document> usersCollection = MongoConnection.getDatabase().getCollection("users");
        Document result = usersCollection.findOneAndUpdate(
                Filters.eq("email", email),
                Updates.set("password", hashedPassword)
        );

        // Update in Node.js server
        URL url = new URL("http://localhost:3000/update-password");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setRequestProperty("Accept", "application/json");
        conn.setDoOutput(true);

        String jsonInput = "{\"email\": \"" + email + "\", \"password\": \"" + hashedPassword + "\"}";
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonInput.getBytes(StandardCharsets.UTF_8);
            os.write(input);
            os.flush();
        }

        int code = conn.getResponseCode();
        return code == 200 && result != null;
    }

    /**
     * Utility for showing alerts
     */
    private void showAlert(AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}