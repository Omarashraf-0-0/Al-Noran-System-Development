package noran.desktop.Utils;

import javafx.animation.FadeTransition;
import javafx.animation.ScaleTransition;
import javafx.geometry.Insets;
import javafx.geometry.NodeOrientation;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
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

/**
 * Utility class for displaying modern styled alerts throughout the application.
 * Provides consistent, animated alert dialogs with type-specific styling.
 */
public class AlertUtils {

    public enum AlertType {
        SUCCESS, ERROR, WARNING, INFO
    }

    /**
     * Show a modern styled alert dialog.
     * 
     * @param title   The alert title
     * @param message The alert message
     * @param type    The type of alert (SUCCESS, ERROR, WARNING, INFO)
     */
    public static void show(String title, String message, AlertType type) {
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

        StackPane iconPane = new StackPane(iconCircle, iconLabel);

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

    // Convenience methods for each type
    public static void showSuccess(String title, String message) {
        show(title, message, AlertType.SUCCESS);
    }

    public static void showError(String title, String message) {
        show(title, message, AlertType.ERROR);
    }

    public static void showWarning(String title, String message) {
        show(title, message, AlertType.WARNING);
    }

    public static void showInfo(String title, String message) {
        show(title, message, AlertType.INFO);
    }

    private static String getContainerStyle(AlertType type) {
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

    private static Color getIconColor(AlertType type) {
        return switch (type) {
            case SUCCESS -> Color.web("#10b981"); // Emerald
            case ERROR -> Color.web("#ef4444"); // Red
            case WARNING -> Color.web("#f59e0b"); // Amber
            case INFO -> Color.web("#3b82f6"); // Blue
        };
    }

    private static Color getTitleColor(AlertType type) {
        return switch (type) {
            case SUCCESS -> Color.web("#059669");
            case ERROR -> Color.web("#dc2626");
            case WARNING -> Color.web("#d97706"); // Darker amber
            case INFO -> Color.web("#2563eb");
        };
    }

    private static String getIcon(AlertType type) {
        return switch (type) {
            case SUCCESS -> "✓";
            case ERROR -> "✕";
            case WARNING -> "⚠";
            case INFO -> "ℹ";
        };
    }

    private static String getButtonStyle(AlertType type) {
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

    private static String getButtonHoverStyle(AlertType type) {
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
