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
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.effect.DropShadow;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import javafx.util.Duration;
import noran.desktop.Services.APIService;
import org.json.JSONObject;

import java.io.IOException;

public class LoginController {

    @FXML
    private TextField usernameField;

    @FXML
    private PasswordField passwordField;

    // Use centralized config for API URL
    private static final String LOGIN_URL = noran.desktop.AppConfig.API_LOGIN;

    @FXML
    private void onLoginClicked(ActionEvent event) {
        String identifier = usernameField.getText().trim();
        String password = passwordField.getText().trim();

        if (identifier.isEmpty() || password.isEmpty()) {
            showCustomAlert("تحذير", "يرجى إدخال البريد الإلكتروني وكلمة المرور", AlertType.WARNING);
            return;
        }

        // Match backend keys exactly
        String jsonBody = String.format("{\"identifier\":\"%s\",\"password\":\"%s\"}", identifier, password);
        String response = APIService.post(LOGIN_URL, jsonBody);

        if (response == null || response.isBlank()) {
            showCustomAlert("خطأ في الاتصال", "فشل الاتصال بالخادم\nتأكد أن السيرفر يعمل على المنفذ 3500",
                    AlertType.ERROR);
            return;
        }

        try {
            JSONObject json = new JSONObject(response);

            // ✅ CRITICAL: Check for success (token) FIRST before checking error fields
            // This prevents "Login successful" message from being treated as an error
            if (json.has("token")) {

                // ---------------------------------------------------------
                // 🔴 CRITICAL FIX: Save Token to AppSession immediately
                // ---------------------------------------------------------
                String token = json.getString("token");
                noran.desktop.AppSession.getInstance().setAuthToken(token);

                String extractedId = "";
                String extractedName = "";
                String extractedRole = "";
                String extractedEmail = "";
                String employeeType = ""; // For admin detection

                // Additional fields for caching
                String phone = "";
                String fullname = "";
                String username = "";
                boolean verified = false;
                boolean active = false;
                String profilePhoto = "";

                try {
                    if (json.has("user") && json.get("user") instanceof JSONObject) {
                        JSONObject u = json.getJSONObject("user");
                        extractedId = u.optString("id", u.optString("_id", u.optString("userId", "")));
                        extractedName = u.optString("name", u.optString("username", u.optString("fullname", "")));
                        extractedRole = u.optString("type", u.optString("role", ""));
                        extractedEmail = u.optString("email", "");

                        // Additional fields
                        phone = u.optString("phone", "");
                        fullname = u.optString("fullname", "");
                        username = u.optString("username", "");
                        active = u.optBoolean("active", false);
                        profilePhoto = u.optString("profilePhoto", "");

                        // Extract employeeDetails
                        if (u.has("employeeDetails") && u.get("employeeDetails") instanceof JSONObject) {
                            JSONObject empDetails = u.getJSONObject("employeeDetails");
                            employeeType = empDetails.optString("employeeType", "");
                            verified = empDetails.optBoolean("verified", false);
                        }
                    } else {
                        extractedId = json.optString("id", json.optString("_id", ""));
                        extractedName = json.optString("name", json.optString("username", ""));
                        extractedRole = json.optString("type", json.optString("role", ""));
                        extractedEmail = json.optString("email", "");
                    }

                    // 🛑 ACCESS CONTROL CHECK 🛑
                    // Allow employees and admins (not clients)
                    if (!extractedRole.equalsIgnoreCase("employee") && !extractedRole.equalsIgnoreCase("admin")) {
                        showCustomAlert("تم رفض الوصول",
                                "هذا التطبيق مخصص للموظفين والمسؤولين فقط\nالدور الحالي: " + extractedRole,
                                AlertType.ERROR);
                        return;
                    }

                    // Determine user role:
                    // - If type from API is "admin" -> admin role
                    // - If employeeType is "System Admin" -> admin role
                    // - Otherwise -> employee role
                    String userRole;
                    if (extractedRole.equalsIgnoreCase("admin")) {
                        userRole = "admin";
                    } else if (employeeType.equalsIgnoreCase("System Admin")) {
                        userRole = "admin";
                    } else {
                        userRole = "employee";
                    }

                    // Fetch full profile to get profilePhoto (login response doesn't include it)
                    String profileResponse = noran.desktop.Services.APIService
                            .get(noran.desktop.AppConfig.API_PROFILE);
                    if (profileResponse != null && !profileResponse.isEmpty()) {
                        try {
                            JSONObject profileJson = new JSONObject(profileResponse);
                            if (profileJson.optBoolean("success", false) && profileJson.has("user")) {
                                JSONObject profileUser = profileJson.getJSONObject("user");
                                profilePhoto = profileUser.optString("profilePhoto", "");
                                System.out.println(
                                        "[LoginController] Fetched profilePhoto from profile: " + profilePhoto);
                            }
                        } catch (Exception pe) {
                            System.err.println("[LoginController] Error parsing profile response: " + pe.getMessage());
                        }
                    }

                    // Create user and save to session with all cached data
                    noran.desktop.Controllers.User loggedInUser = new noran.desktop.Controllers.User(extractedId,
                            extractedName, userRole, extractedEmail);
                    loggedInUser.setPhone(phone);
                    loggedInUser.setFullname(fullname);
                    loggedInUser.setUsername(username);
                    loggedInUser.setEmployeeType(employeeType);
                    loggedInUser.setVerified(verified);
                    loggedInUser.setActive(active);
                    loggedInUser.setProfilePhoto(profilePhoto);
                    noran.desktop.AppSession.getInstance().setCurrentUser(loggedInUser);

                } catch (Exception ex) {
                    ex.printStackTrace();
                    showCustomAlert("خطأ", "حدث خطأ أثناء معالجة بيانات المستخدم", AlertType.ERROR);
                    return;
                }

                showCustomAlert("تم تسجيل الدخول بنجاح", "أهلاً بك يا " + extractedName + " 👋", AlertType.SUCCESS);

                // Navigate to Dashboard - use setRoot to preserve window size
                FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/dashboard.fxml"));
                Parent root = loader.load();
                Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
                stage.getScene().setRoot(root);

            } else if (json.has("error") || json.has("message") || json.has("msg")) {
                // Check for error fields only if no token
                String errorMsg = json.optString("error",
                        json.optString("message",
                                json.optString("msg", "خطأ غير معروف")));
                String displayMsg = mapServerError(errorMsg);
                showCustomAlert("فشل تسجيل الدخول", displayMsg, AlertType.ERROR);
            } else {
                // No recognizable response - likely an error
                showCustomAlert("فشل تسجيل الدخول", "البريد الإلكتروني أو كلمة المرور غير صحيحة", AlertType.ERROR);
            }

        } catch (Exception e) {
            e.printStackTrace();
            showCustomAlert("فشل تسجيل الدخول", "البريد الإلكتروني أو كلمة المرور غير صحيحة", AlertType.ERROR);
        }
    }

    /**
     * Map common server error messages to user-friendly Arabic messages
     */
    private String mapServerError(String serverError) {
        if (serverError == null || serverError.isEmpty())
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة";

        String lower = serverError.toLowerCase();

        // Check for common authentication error patterns FIRST
        if (lower.contains("password") || lower.contains("كلمة") || lower.contains("credentials")) {
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        } else if (lower.contains("email") || lower.contains("البريد") || lower.contains("user not found")
                || lower.contains("not found") || lower.contains("no user") || lower.contains("does not exist")
                || lower.contains("doesn't exist") || lower.contains("not exist")) {
            return "البريد الإلكتروني غير مسجل في النظام";
        } else if (lower.contains("invalid") || lower.contains("incorrect") || lower.contains("wrong")
                || lower.contains("failed") || lower.contains("error")) {
            // Generic errors usually mean wrong credentials
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        } else if (lower.contains("frozen") || lower.contains("مجمد") || lower.contains("blocked")
                || lower.contains("suspended")) {
            return "الحساب مجمد\nيرجى التواصل مع الإدارة";
        } else if (lower.contains("inactive") || lower.contains("disabled") || lower.contains("deactivated")) {
            return "الحساب غير نشط\nيرجى التواصل مع الإدارة";
        } else if (lower.contains("network") || lower.contains("connection") || lower.contains("timeout")) {
            return "خطأ في الاتصال بالشبكة";
        } else if (lower.contains("unauthorized") || lower.contains("401")) {
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        } else if (lower.contains("internal") && lower.contains("server")) {
            // Only show server error for "internal server error" specifically
            return "خطأ في الخادم\nيرجى المحاولة لاحقاً";
        }

        // Default fallback - show credential error (most common case)
        return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
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
            showCustomAlert("خطأ", "تعذر فتح شاشة إعادة تعيين كلمة المرور", AlertType.ERROR);
        }
    }

    // ==========================================
    // CUSTOM STYLED ALERT DIALOG
    // ==========================================

    private enum AlertType {
        SUCCESS, ERROR, WARNING, INFO
    }

    private void showCustomAlert(String title, String message, AlertType type) {
        Stage alertStage = new Stage();
        alertStage.initModality(Modality.APPLICATION_MODAL);
        alertStage.initStyle(StageStyle.TRANSPARENT);

        // Main container with FIXED SIZE for consistency
        VBox container = new VBox(24);
        container.setAlignment(Pos.CENTER);
        container.setPadding(new Insets(40, 50, 40, 50));
        container.setNodeOrientation(NodeOrientation.RIGHT_TO_LEFT);
        container.setStyle(getContainerStyle(type));
        container.setMinWidth(380);
        container.setMaxWidth(380);
        container.setMinHeight(300);

        // Add shadow effect
        DropShadow shadow = new DropShadow();
        shadow.setColor(Color.rgb(0, 0, 0, 0.35));
        shadow.setRadius(30);
        shadow.setSpread(0.15);
        container.setEffect(shadow);

        // Icon circle with symbol - larger for visibility
        Circle iconCircle = new Circle(50);
        iconCircle.setFill(getIconColor(type));
        iconCircle.setEffect(new DropShadow(15, getIconColor(type).darker()));

        Label iconLabel = new Label(getIcon(type));
        iconLabel.setFont(Font.font("Segoe UI Emoji", FontWeight.BOLD, 42));
        iconLabel.setTextFill(Color.WHITE);

        javafx.scene.layout.StackPane iconPane = new javafx.scene.layout.StackPane(iconCircle, iconLabel);

        // Title label - larger font
        Label titleLabel = new Label(title);
        titleLabel.setFont(Font.font("Segoe UI", FontWeight.BOLD, 24));
        titleLabel.setTextFill(getTitleColor(type));

        // Message label - larger and centered
        Label messageLabel = new Label(message);
        messageLabel.setFont(Font.font("Segoe UI", FontWeight.NORMAL, 18));
        messageLabel.setTextFill(Color.web("#444444"));
        messageLabel.setWrapText(true);
        messageLabel.setAlignment(Pos.CENTER);
        messageLabel.setMaxWidth(320);
        messageLabel.setStyle("-fx-text-alignment: center;");

        // OK Button - larger
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

        // Animate entrance
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
            case SUCCESS -> "#10b981"; // Modern emerald green
            case ERROR -> "#ef4444"; // Modern red
            case WARNING -> "#f59e0b"; // Modern amber/gold yellow
            case INFO -> "#3b82f6"; // Modern blue
        };
        return "-fx-background-color: linear-gradient(to bottom, #ffffff, #f8f9fa); " +
                "-fx-background-radius: 24; " +
                "-fx-border-radius: 24; " +
                "-fx-border-color: " + borderColor + "; " +
                "-fx-border-width: 4;";
    }

    private Color getIconColor(AlertType type) {
        return switch (type) {
            case SUCCESS -> Color.web("#10b981"); // Emerald
            case ERROR -> Color.web("#ef4444"); // Red
            case WARNING -> Color.web("#f59e0b"); // Amber
            case INFO -> Color.web("#3b82f6"); // Blue
        };
    }

    private Color getTitleColor(AlertType type) {
        return switch (type) {
            case SUCCESS -> Color.web("#059669");
            case ERROR -> Color.web("#dc2626");
            case WARNING -> Color.web("#d97706"); // Darker amber
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