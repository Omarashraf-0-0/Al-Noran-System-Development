package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
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
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.effect.DropShadow;
import javafx.scene.shape.Circle;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import javafx.util.Duration;
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

    private enum AlertType {
        SUCCESS, ERROR, WARNING, INFO
    }

    @FXML
    private void onSendCodeClicked(ActionEvent event) {
        String email = emailField.getText().trim();

        if (email.isEmpty()) {
            showCustomAlert("خطأ", "يرجى إدخال البريد الإلكتروني", AlertType.ERROR);
            return;
        }

        if (!isValidEmail(email)) {
            showCustomAlert("بريد غير صالح", "الرجاء إدخال بريد إلكتروني صالح", AlertType.WARNING);
            return;
        }

        if (!isEmailInDatabase(email)) {
            showCustomAlert("خطأ", "البريد الإلكتروني غير موجود", AlertType.ERROR);
            return;
        }

        try {
            boolean success = sendOtpRequest(email);
            if (success) {
                showCustomAlert("تم الإرسال ✅", "تم إرسال كود إعادة التعيين إلى البريد الإلكتروني", AlertType.SUCCESS);
                goToOTPVerificationPage(event, email);
            } else {
                showCustomAlert("خطأ", "فشل في إرسال الكود. يرجى المحاولة لاحقًا.", AlertType.ERROR);
            }
        } catch (IOException e) {
            showCustomAlert("خطأ في الاتصال", "تعذر الاتصال بخادم OTP. تأكد أن الخادم يعمل.", AlertType.ERROR);
        }
    }

    private boolean isEmailInDatabase(String email) {
        MongoCollection<Document> usersCollection = MongoConnection.getDatabase().getCollection("users");
        Document user = usersCollection.find(Filters.eq("email", email)).first();
        return user != null;
    }

    private boolean sendOtpRequest(String email) throws IOException {
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

    private void goToOTPVerificationPage(ActionEvent event, String email) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/OTPVerification.fxml"));
            Parent root = loader.load();
            OTPVerificationController controller = loader.getController();
            controller.setUserEmail(email);
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            Scene currentScene = stage.getScene();
            stage.setScene(new Scene(root, currentScene.getWidth(), currentScene.getHeight()));
            stage.show();
        } catch (IOException e) {
            showCustomAlert("خطأ", "تعذر فتح صفحة رمز التحقق", AlertType.ERROR);
        }
    }

    @FXML
    private void onBackClicked(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/login-view-ar.fxml"));
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            Scene currentScene = stage.getScene();
            stage.setScene(new Scene(root, currentScene.getWidth(), currentScene.getHeight()));
            stage.show();
        } catch (IOException e) {
            showCustomAlert("خطأ", "تعذر الرجوع إلى صفحة تسجيل الدخول", AlertType.ERROR);
        }
    }

    private boolean isValidEmail(String email) {
        String regex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        return Pattern.matches(regex, email);
    }

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
