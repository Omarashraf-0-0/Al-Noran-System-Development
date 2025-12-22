package noran.desktop.Utils;

import javafx.animation.FadeTransition;
import javafx.animation.ParallelTransition;
import javafx.animation.ScaleTransition;
import javafx.geometry.Insets;
import javafx.geometry.NodeOrientation;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.effect.BlurType;
import javafx.scene.effect.DropShadow;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
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
 * Modern styled alert dialogs matching Al-Noran login/dashboard theme.
 * Clean, professional design with brand colors and no heavy shadows.
 */
public class AlertUtils {

    public enum AlertType {
        SUCCESS, ERROR, WARNING, INFO
    }

    /**
     * Show a modern styled alert dialog matching app theme.
     */
    public static void show(String title, String message, AlertType type) {
        Stage alertStage = new Stage();
        alertStage.initModality(Modality.APPLICATION_MODAL);
        alertStage.initStyle(StageStyle.TRANSPARENT);

        // Main container - clean white card style matching login/dashboard
        VBox container = new VBox(22);
        container.setAlignment(Pos.CENTER);
        container.setPadding(new Insets(40, 50, 40, 50));
        container.setNodeOrientation(NodeOrientation.RIGHT_TO_LEFT);
        container.setStyle(getContainerStyle(type));
        container.setMinWidth(380);
        container.setMaxWidth(380);
        container.setMinHeight(300);

        // Add soft drop shadow
        container.setEffect(new DropShadow(BlurType.GAUSSIAN, Color.rgb(0, 0, 0, 0.15), 20, 0.3, 0, 8));

        // Logo at top
        try {
            ImageView logo = new ImageView(new Image(
                    AlertUtils.class.getResourceAsStream("/noran/desktop/images/Logo.png")));
            logo.setFitHeight(70);
            logo.setFitWidth(100);
            logo.setPreserveRatio(true);
            logo.setOpacity(0.9);
            container.getChildren().add(logo);
        } catch (Exception ignored) {
        }

        // Icon circle with symbol - clean style
        Circle iconCircle = new Circle(40);
        iconCircle.setFill(getIconColor(type));

        Label iconLabel = new Label(getIcon(type));
        iconLabel.setFont(Font.font("Segoe UI Emoji", FontWeight.BOLD, 32));
        iconLabel.setTextFill(Color.WHITE);

        StackPane iconPane = new StackPane(iconCircle, iconLabel);

        // Title label
        Label titleLabel = new Label(title);
        titleLabel.setFont(Font.font("Segoe UI", FontWeight.BOLD, 22));
        titleLabel.setTextFill(getTitleColor(type));

        // Message label
        Label messageLabel = new Label(message);
        messageLabel.setFont(Font.font("Segoe UI", FontWeight.NORMAL, 15));
        messageLabel.setTextFill(Color.web("#495057"));
        messageLabel.setWrapText(true);
        messageLabel.setAlignment(Pos.CENTER);
        messageLabel.setMaxWidth(320);
        messageLabel.setStyle("-fx-text-alignment: center; -fx-line-spacing: 3;");

        // OK Button - matching login button style
        Button okBtn = new Button("حسناً");
        okBtn.setFont(Font.font("Segoe UI", FontWeight.BOLD, 16));
        okBtn.setPrefWidth(130);
        okBtn.setPrefHeight(46);
        okBtn.setStyle(getButtonStyle(type));
        okBtn.setCursor(javafx.scene.Cursor.HAND);

        okBtn.setOnMouseEntered(e -> okBtn.setStyle(getButtonHoverStyle(type)));
        okBtn.setOnMouseExited(e -> okBtn.setStyle(getButtonStyle(type)));
        okBtn.setOnAction(e -> {
            // Animate exit
            ScaleTransition scaleOut = new ScaleTransition(Duration.millis(120), container);
            scaleOut.setToX(0.95);
            scaleOut.setToY(0.95);
            FadeTransition fadeOut = new FadeTransition(Duration.millis(120), container);
            fadeOut.setToValue(0);
            ParallelTransition exitAnim = new ParallelTransition(scaleOut, fadeOut);
            exitAnim.setOnFinished(ev -> alertStage.close());
            exitAnim.play();
        });

        container.getChildren().addAll(iconPane, titleLabel, messageLabel, okBtn);

        // Create scene with transparent backdrop
        StackPane root = new StackPane(container);
        root.setStyle("-fx-background-color: transparent;");
        root.setOnMouseClicked(e -> {
            if (e.getTarget() == root) {
                okBtn.fire();
            }
        });

        Scene scene = new Scene(root, 480, 380);
        scene.setFill(Color.TRANSPARENT);
        alertStage.setScene(scene);

        // Animate entrance
        container.setScaleX(0.9);
        container.setScaleY(0.9);
        container.setOpacity(0);

        ScaleTransition scale = new ScaleTransition(Duration.millis(180), container);
        scale.setToX(1);
        scale.setToY(1);

        FadeTransition fade = new FadeTransition(Duration.millis(180), container);
        fade.setToValue(1);

        alertStage.show();

        ParallelTransition enterAnim = new ParallelTransition(scale, fade);
        enterAnim.play();
    }

    // Convenience methods
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
            case SUCCESS -> "#10b981";
            case ERROR -> "#a40000";
            case WARNING -> "#f59e0b";
            case INFO -> "#1ba3b6";
        };
        // Clean white card matching login/dashboard - no heavy shadows
        return "-fx-background-color: white; " +
                "-fx-background-radius: 24; " +
                "-fx-border-radius: 24; " +
                "-fx-border-color: " + borderColor + "; " +
                "-fx-border-width: 2;";
    }

    private static Color getIconColor(AlertType type) {
        return switch (type) {
            case SUCCESS -> Color.web("#10b981");
            case ERROR -> Color.web("#a40000");
            case WARNING -> Color.web("#f59e0b");
            case INFO -> Color.web("#1ba3b6");
        };
    }

    private static Color getTitleColor(AlertType type) {
        return switch (type) {
            case SUCCESS -> Color.web("#059669");
            case ERROR -> Color.web("#690000");
            case WARNING -> Color.web("#b45309");
            case INFO -> Color.web("#0e7490");
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
        String gradient = switch (type) {
            case SUCCESS -> "linear-gradient(to bottom, #22c980, #10b981, #059669)";
            case ERROR -> "linear-gradient(to bottom, #c41e1e, #a40000, #7a0000)";
            case WARNING -> "linear-gradient(to bottom, #fbbf24, #f59e0b, #d97706)";
            case INFO -> "linear-gradient(to bottom, #22d3ee, #1ba3b6, #0e7490)";
        };
        // Clean button style matching login - no shadows
        return "-fx-background-color: " + gradient + "; " +
                "-fx-text-fill: white; " +
                "-fx-background-radius: 14; " +
                "-fx-border-radius: 14;";
    }

    private static String getButtonHoverStyle(AlertType type) {
        String gradient = switch (type) {
            case SUCCESS -> "linear-gradient(to bottom, #34d399, #22c980, #10b981)";
            case ERROR -> "linear-gradient(to bottom, #dc2626, #b91c1c, #991b1b)";
            case WARNING -> "linear-gradient(to bottom, #fcd34d, #fbbf24, #f59e0b)";
            case INFO -> "linear-gradient(to bottom, #67e8f9, #22d3ee, #1ba3b6)";
        };
        return "-fx-background-color: " + gradient + "; " +
                "-fx-text-fill: white; " +
                "-fx-background-radius: 14; " +
                "-fx-border-radius: 14;";
    }
}
