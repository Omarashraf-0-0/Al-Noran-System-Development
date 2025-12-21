package noran.desktop.Controllers;

import javafx.animation.FadeTransition;
import javafx.animation.ScaleTransition;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.geometry.Insets;
import javafx.geometry.NodeOrientation;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.effect.DropShadow;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import javafx.util.Duration;

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

public class OTPVerificationController {

    @FXML
    private TextField otp1, otp2, otp3, otp4, otp5;
    private String userEmail;
    @FXML
    private TextField newPasswordField, confirmedNewPassword;

    private enum AlertType {
        SUCCESS, ERROR, WARNING, INFO
    }

    @FXML
    private void initialize() {
        // Setup auto-focus chain: otp1 -> otp2 -> otp3 -> otp4 -> otp5
        if (otp1 != null && otp2 != null && otp3 != null && otp4 != null && otp5 != null) {
            setupAutoFocus(otp1, null, otp2);
            setupAutoFocus(otp2, otp1, otp3);
            setupAutoFocus(otp3, otp2, otp4);
            setupAutoFocus(otp4, otp3, otp5);
            setupAutoFocus(otp5, otp4, null);
        }
    }

    private void setupAutoFocus(TextField current, TextField prev, TextField next) {
        // Restrict to single digit and auto-move to next
        current.textProperty().addListener((obs, oldV, newV) -> {
            // Only allow single digit
            if (!newV.matches("\\d?")) {
                current.setText(oldV);
                return;
            }
            // Auto-focus next field when digit entered
            if (newV.length() == 1 && next != null) {
                next.requestFocus();
            }
        });

        // Handle backspace to go to previous field
        current.setOnKeyPressed(event -> {
            if (event.getCode() == javafx.scene.input.KeyCode.BACK_SPACE) {
                if (current.getText().isEmpty() && prev != null) {
                    prev.requestFocus();
                    prev.clear();
                }
            }
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
            showCustomAlert("خطأ", "تعذر الرجوع إلى الصفحة السابقة", AlertType.ERROR);
        }
    }

    @FXML
    private void onResendClicked(ActionEvent event) {
        try {
            if (resendOtp(userEmail))
                showCustomAlert("تم الإرسال ✅", "تمت إعادة إرسال رمز التحقق", AlertType.SUCCESS);
            else
                showCustomAlert("خطأ", "فشل في إرسال الكود", AlertType.ERROR);
        } catch (IOException e) {
            showCustomAlert("خطأ في الاتصال", "تعذر الاتصال بالخادم", AlertType.ERROR);
        }
    }

    private boolean resendOtp(String email) throws IOException {
        URL url = new URL(noran.desktop.AppConfig.API_FORGOT_PASSWORD);
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
            showCustomAlert("خطأ", "يرجى إدخال رمز مكون من 5 أرقام", AlertType.WARNING);
            return;
        }

        try {
            if (verifyOtp(userEmail, otp)) {
                try {
                    FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/reset-passowrd.fxml"));
                    Parent root = loader.load();
                    OTPVerificationController controller = loader.getController();
                    controller.setUserEmail(this.userEmail);

                    Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
                    stage.setScene(new Scene(root));
                    stage.show();
                    return;
                } catch (IOException e) {
                    e.printStackTrace();
                    showCustomAlert("خطأ", "تعذر فتح صفحة إعادة تعيين كلمة المرور.", AlertType.ERROR);
                    return;
                }
            } else {
                showCustomAlert("خطأ", "رمز التحقق غير صحيح", AlertType.ERROR);
            }
        } catch (IOException e) {
            showCustomAlert("خطأ في الاتصال", "تعذر التحقق من الكود", AlertType.ERROR);
        }
    }

    private boolean verifyOtp(String email, String otp) throws IOException {
        URL url = new URL(noran.desktop.AppConfig.API_VERIFY_OTP);
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

                String responseText = response.toString();
                System.out.println("Response: " + responseText);
                return responseText.contains("تم التحقق من الرمز بنجاح");
            }
        }
        return false;
    }

    @FXML
    private void onSendCodeClicked(ActionEvent event) {
        if (newPasswordField == null || confirmedNewPassword == null) {
            showCustomAlert("خطأ", "حقل كلمة المرور غير متوفر", AlertType.ERROR);
            return;
        }

        String newPass = newPasswordField.getText();
        String confirm = confirmedNewPassword.getText();
        if (newPass == null || newPass.isBlank()) {
            showCustomAlert("خطأ", "يرجى إدخال كلمة المرور الجديدة", AlertType.WARNING);
            return;
        }
        if (!newPass.equals(confirm)) {
            showCustomAlert("خطأ", "كلمات المرور غير متطابقة", AlertType.WARNING);
            return;
        }

        try {
            if (resetPassword(userEmail, newPass)) {
                showCustomAlert("نجاح ✅", "تم تحديث كلمة المرور بنجاح", AlertType.SUCCESS);
                try {
                    Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/login-view-ar.fxml"));
                    Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
                    stage.setScene(new Scene(root));
                    stage.show();
                } catch (IOException ioEx) {
                    showCustomAlert("خطأ", "تعذر فتح صفحة تسجيل الدخول", AlertType.ERROR);
                }
            } else {
                showCustomAlert("خطأ", "فشل في تحديث كلمة المرور", AlertType.ERROR);
            }
        } catch (Exception e) {
            showCustomAlert("خطأ في الاتصال", "تعذر الاتصال بالخادم", AlertType.ERROR);
        }
    }

    public boolean resetPassword(String email, String newPassword) {
        String url = noran.desktop.AppConfig.API_RESET_PASSWORD;

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPatch patchRequest = new HttpPatch(url);
            patchRequest.setHeader("Content-Type", "application/json; charset=UTF-8");

            String jsonBody = String.format("{\"email\":\"%s\",\"newPassword\":\"%s\"}", email, newPassword);
            patchRequest.setEntity(new StringEntity(jsonBody, StandardCharsets.UTF_8));

            HttpResponse response = client.execute(patchRequest);
            int statusCode = response.getStatusLine().getStatusCode();

            String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
            System.out.println("Response Code: " + statusCode);
            System.out.println("Response Body: " + responseBody);

            return statusCode == 200;

        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    // ============================================
    // CUSTOM STYLED ALERT - SAME AS LOGIN
    // ============================================

    private void showCustomAlert(String title, String message, AlertType type) {
        Stage alertStage = new Stage();
        alertStage.initModality(Modality.APPLICATION_MODAL);
        alertStage.initStyle(StageStyle.TRANSPARENT);

        VBox container = new VBox(24);
        container.setAlignment(Pos.CENTER);
        container.setPadding(new Insets(40, 50, 40, 50));
        container.setNodeOrientation(NodeOrientation.RIGHT_TO_LEFT);
        container.setStyle(getContainerStyle(type));
        container.setMinWidth(380);
        container.setMaxWidth(380);
        container.setMinHeight(300);

        DropShadow shadow = new DropShadow();
        shadow.setColor(Color.rgb(0, 0, 0, 0.35));
        shadow.setRadius(30);
        shadow.setSpread(0.15);
        container.setEffect(shadow);

        Circle iconCircle = new Circle(50);
        iconCircle.setFill(getIconColor(type));
        iconCircle.setEffect(new DropShadow(15, getIconColor(type).darker()));

        Label iconLabel = new Label(getIcon(type));
        iconLabel.setFont(Font.font("Segoe UI Emoji", FontWeight.BOLD, 42));
        iconLabel.setTextFill(Color.WHITE);

        StackPane iconPane = new StackPane(iconCircle, iconLabel);

        Label titleLabel = new Label(title);
        titleLabel.setFont(Font.font("Segoe UI", FontWeight.BOLD, 24));
        titleLabel.setTextFill(getTitleColor(type));

        Label messageLabel = new Label(message);
        messageLabel.setFont(Font.font("Segoe UI", FontWeight.NORMAL, 18));
        messageLabel.setTextFill(Color.web("#444444"));
        messageLabel.setWrapText(true);
        messageLabel.setAlignment(Pos.CENTER);
        messageLabel.setMaxWidth(320);
        messageLabel.setStyle("-fx-text-alignment: center;");

        Button okBtn = new Button("حسناً");
        okBtn.setFont(Font.font("Segoe UI", FontWeight.BOLD, 18));
        okBtn.setPrefWidth(160);
        okBtn.setPrefHeight(50);
        okBtn.setStyle(getButtonStyle(type));
        okBtn.setCursor(javafx.scene.Cursor.HAND);

        okBtn.setOnMouseEntered(e -> okBtn.setStyle(getButtonHoverStyle(type)));
        okBtn.setOnMouseExited(e -> okBtn.setStyle(getButtonStyle(type)));
        okBtn.setOnAction(e -> alertStage.close());

        container.getChildren().addAll(iconPane, titleLabel, messageLabel, okBtn);

        Scene scene = new Scene(container);
        scene.setFill(Color.TRANSPARENT);
        alertStage.setScene(scene);

        container.setScaleX(0.7);
        container.setScaleY(0.7);
        container.setOpacity(0);

        ScaleTransition scale = new ScaleTransition(Duration.millis(200), container);
        scale.setToX(1);
        scale.setToY(1);

        FadeTransition fade = new FadeTransition(Duration.millis(200), container);
        fade.setToValue(1);

        alertStage.show();
        scale.play();
        fade.play();
    }

    private String getContainerStyle(AlertType type) {
        String borderColor = switch (type) {
            case SUCCESS -> "#10b981";
            case ERROR -> "#ef4444";
            case WARNING -> "#f59e0b";
            case INFO -> "#3b82f6";
        };
        return "-fx-background-color: linear-gradient(to bottom, #ffffff, #f8f9fa); " +
                "-fx-background-radius: 24; " +
                "-fx-border-radius: 24; " +
                "-fx-border-color: " + borderColor + "; " +
                "-fx-border-width: 4;";
    }

    private Color getIconColor(AlertType type) {
        return switch (type) {
            case SUCCESS -> Color.web("#10b981");
            case ERROR -> Color.web("#ef4444");
            case WARNING -> Color.web("#f59e0b");
            case INFO -> Color.web("#3b82f6");
        };
    }

    private Color getTitleColor(AlertType type) {
        return switch (type) {
            case SUCCESS -> Color.web("#059669");
            case ERROR -> Color.web("#dc2626");
            case WARNING -> Color.web("#d97706");
            case INFO -> Color.web("#2563eb");
        };
    }

    private String getIcon(AlertType type) {
        return switch (type) {
            case SUCCESS -> "✓";
            case ERROR -> "✕";
            case WARNING -> "⚠";
            case INFO -> "ℹ";
        };
    }

    private String getButtonStyle(AlertType type) {
        String bgColor = switch (type) {
            case SUCCESS -> "#10b981";
            case ERROR -> "#ef4444";
            case WARNING -> "#f59e0b";
            case INFO -> "#3b82f6";
        };
        return "-fx-background-color: " + bgColor + "; " +
                "-fx-text-fill: white; " +
                "-fx-background-radius: 25; " +
                "-fx-border-radius: 25; " +
                "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.2), 8, 0, 0, 2);";
    }

    private String getButtonHoverStyle(AlertType type) {
        String bgColor = switch (type) {
            case SUCCESS -> "#059669";
            case ERROR -> "#dc2626";
            case WARNING -> "#d97706";
            case INFO -> "#2563eb";
        };
        return "-fx-background-color: " + bgColor + "; " +
                "-fx-text-fill: white; " +
                "-fx-background-radius: 25; " +
                "-fx-border-radius: 25; " +
                "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.3), 10, 0, 0, 3);";
    }
}
