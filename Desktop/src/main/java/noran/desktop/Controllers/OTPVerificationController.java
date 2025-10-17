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

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class OTPVerificationController {

    @FXML private TextField otp1, otp2, otp3, otp4, otp5;
    private String userEmail;

    @FXML
    private void initialize() {
        restrictToSingleDigit(otp1);
        restrictToSingleDigit(otp2);
        restrictToSingleDigit(otp3);
        restrictToSingleDigit(otp4);
        restrictToSingleDigit(otp5);
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
                showResetPasswordDialog(event);
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
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                String line = br.readLine();
                return line != null && line.contains("OTP verified successfully");
            }
        }
        return false;
    }

    private void showResetPasswordDialog(ActionEvent event) {
        Dialog<ButtonType> dialog = new Dialog<>();
        dialog.setTitle("إعادة تعيين كلمة المرور");
        dialog.setHeaderText("أدخل كلمة المرور الجديدة");

        VBox box = new VBox(10);
        PasswordField newPass = new PasswordField();
        PasswordField confirmPass = new PasswordField();
        box.getChildren().addAll(new Label("كلمة المرور الجديدة:"), newPass,
                new Label("تأكيد كلمة المرور:"), confirmPass);
        dialog.getDialogPane().setContent(box);
        dialog.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);

        dialog.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                if (!newPass.getText().equals(confirmPass.getText())) {
                    showAlert(Alert.AlertType.ERROR, "خطأ", "كلمات المرور غير متطابقة");
                    return;
                }

                try {
                    if (resetPassword(userEmail, newPass.getText())) {
                        showAlert(Alert.AlertType.INFORMATION, "نجاح", "تم تحديث كلمة المرور");
                        navigateToLogin(event);
                    } else {
                        showAlert(Alert.AlertType.ERROR, "خطأ", "فشل في تحديث كلمة المرور");
                    }
                } catch (IOException e) {
                    showAlert(Alert.AlertType.ERROR, "خطأ في الاتصال", "تعذر الاتصال بالخادم");
                }
            }
        });
    }

    private boolean resetPassword(String email, String password) throws IOException {
        String hashed = BCrypt.hashpw(password, BCrypt.gensalt(10));
        URL url = new URL("http://localhost:3500/api/otp/resetPassword");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("PATCH");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setDoOutput(true);
        String json = "{\"email\":\"" + email + "\",\"newPassword\":\"" + hashed + "\"}";
        try (OutputStream os = conn.getOutputStream()) {
            os.write(json.getBytes(StandardCharsets.UTF_8));
        }
        return conn.getResponseCode() == 200;
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
