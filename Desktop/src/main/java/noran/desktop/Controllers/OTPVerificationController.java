package noran.desktop.Controllers;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import org.mindrot.jbcrypt.BCrypt;

import org.apache.http.client.methods.HttpPatch;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.entity.StringEntity;
import org.apache.http.util.EntityUtils;
import org.apache.http.HttpResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class OTPVerificationController {

    @FXML private TextField otp1, otp2, otp3, otp4, otp5;
    private String userEmail;
    @FXML private TextField newPasswordField, confirmedNewPassword;

    @FXML
    private void initialize() {
        // only attach listeners if otp fields are present in this view
        if (otp1 != null) restrictToSingleDigit(otp1);
        if (otp2 != null) restrictToSingleDigit(otp2);
        if (otp3 != null) restrictToSingleDigit(otp3);
        if (otp4 != null) restrictToSingleDigit(otp4);
        if (otp5 != null) restrictToSingleDigit(otp5);
    }

    private void restrictToSingleDigit(TextField field) {
        field.textProperty().addListener((obs, oldV, newV) -> {
            if (!newV.matches("\\d?")) field.setText(oldV);
        });
    }

    public void setUserEmail(String email) {
        this.userEmail = email;
    }

    @FXML
    private void onBackClicked(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/email-for-otp-ar.fxml"));
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.setScene(new Scene(root));
            stage.show();
        } catch (IOException e) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر الرجوع إلى الصفحة السابقة");
        }
    }

    @FXML
    private void onResendClicked(ActionEvent event) {
        try {
            if (resendOtp(userEmail))
                showAlert(Alert.AlertType.INFORMATION, "تم الإرسال", "تمت إعادة إرسال رمز التحقق");
            else
                showAlert(Alert.AlertType.ERROR, "خطأ", "فشل في إرسال الكود");
        } catch (IOException e) {
            showAlert(Alert.AlertType.ERROR, "خطأ في الاتصال", "تعذر الاتصال بالخادم");
        }
    }

    private boolean resendOtp(String email) throws IOException {
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

    @FXML
    private void onConfirmClicked(ActionEvent event) {
        String otp = otp1.getText() + otp2.getText() + otp3.getText() + otp4.getText() + otp5.getText();
        if (!otp.matches("\\d{5}")) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "يرجى إدخال رمز مكون من 5 أرقام");
            return;
        }

        try {
            if (verifyOtp(userEmail, otp)) {
                // load reset page as a full scene controlled by this controller
                try {
                    FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/reset-passowrd.fxml"));
                    Parent root = loader.load();
                    // controller will be OTPVerificationController instance used by the reset scene
                    OTPVerificationController controller = loader.getController();
                    controller.setUserEmail(this.userEmail);

                    Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
                    stage.setScene(new Scene(root));
                    stage.show();
                    return;
                } catch (IOException e) {
                    e.printStackTrace();
                    showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر فتح صفحة إعادة تعيين كلمة المرور.");
                    return;
                }
            } else {
                showAlert(Alert.AlertType.ERROR, "خطأ", "رمز التحقق غير صحيح");
            }
        } catch (IOException e) {
            showAlert(Alert.AlertType.ERROR, "خطأ في الاتصال", "تعذر التحقق من الكود");
        }
    }

    private boolean verifyOtp(String email, String otp) throws IOException {
        URL url = new URL("http://localhost:3500/api/otp/verifyOTP");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setDoOutput(true);

        String json = "{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\"}";
        try (OutputStream os = conn.getOutputStream()) {
            os.write(json.getBytes(StandardCharsets.UTF_8));
        }

        if (conn.getResponseCode() == 200) {
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {

                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }

                // ✅ Parse JSON and check for Arabic success message
                String responseText = response.toString();
                System.out.println("Response: " + responseText);
                return responseText.contains("تم التحقق من الرمز بنجاح");
            }
        }
        return false;
    }


    private void showResetPasswordDialog(ActionEvent event) {
        // deprecated: we now use a full scene (reset-passowrd.fxml) instead of a dialog
    }

    @FXML
    private void onSendCodeClicked(ActionEvent event) {
        // Handle reset password submission from reset-passowrd.fxml
        if (newPasswordField == null || confirmedNewPassword == null) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "حقل كلمة المرور غير متوفر");
            return;
        }

        String newPass = newPasswordField.getText();
        String confirm = confirmedNewPassword.getText();
        if (newPass == null || newPass.isBlank()) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "يرجى إدخال كلمة المرور الجديدة");
            return;
        }
        if (!newPass.equals(confirm)) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "كلمات المرور غير متطابقة");
            return;
        }

        try {
            if (resetPassword(userEmail, newPass)) {
                showAlert(Alert.AlertType.INFORMATION, "نجاح", "تم تحديث كلمة المرور");
                // navigate to dashboard after successful reset
                try {
                    Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/dashboard.fxml"));
                    Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
                    stage.setScene(new Scene(root));
                    stage.show();
                } catch (IOException ioEx) {
                    showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر فتح لوحة التحكم");
                }
            } else {
                showAlert(Alert.AlertType.ERROR, "خطأ", "فشل في تحديث كلمة المرور");
            }
        } catch (Exception e) {
            showAlert(Alert.AlertType.ERROR, "خطأ في الاتصال", "تعذر الاتصال بالخادم");
        }
    }

    public boolean resetPassword(String email, String newPassword) {
        String url = "http://localhost:3500/api/otp/resetPassword";

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPatch patchRequest = new HttpPatch(url);
            patchRequest.setHeader("Content-Type", "application/json; charset=UTF-8");

            // Build JSON body
            String jsonBody = String.format("{\"email\":\"%s\",\"newPassword\":\"%s\"}", email, newPassword);
            patchRequest.setEntity(new StringEntity(jsonBody, StandardCharsets.UTF_8));

            // Execute request
            HttpResponse response = client.execute(patchRequest);
            int statusCode = response.getStatusLine().getStatusCode();

            // Read response
            String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
            System.out.println("Response Code: " + statusCode);
            System.out.println("Response Body: " + responseBody);

            // Check for success
            return statusCode == 200;

        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }


    private void navigateToLogin(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/login-view-ar.fxml"));
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.setScene(new Scene(root));
            stage.show();
        } catch (IOException e) {
            showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر فتح صفحة تسجيل الدخول");
        }
    }

    private void showAlert(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
