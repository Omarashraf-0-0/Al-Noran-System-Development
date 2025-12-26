package noran.desktop.Utils;

import javafx.scene.control.ComboBox;
import javafx.scene.control.ListCell;

/**
 * Utility class for applying consistent styling to ComboBox components across
 * the application.
 * This ensures all ComboBoxes have the same modern look with hover and focus
 * effects.
 */
public class ComboBoxStyler {

    // Default style for ComboBox
    private static final String DEFAULT_STYLE = "-fx-background-color: white; " +
            "-fx-border-color: #d1d5db; " +
            "-fx-border-radius: 8; " +
            "-fx-background-radius: 8; " +
            "-fx-padding: 6 12; " +
            "-fx-font-size: 14px; " +
            "-fx-cursor: hand;";

    // Focused style for ComboBox
    private static final String FOCUSED_STYLE = "-fx-background-color: white; " +
            "-fx-border-color: #1ba3b6; " +
            "-fx-border-width: 2; " +
            "-fx-border-radius: 8; " +
            "-fx-background-radius: 8; " +
            "-fx-padding: 6 12; " +
            "-fx-font-size: 14px; " +
            "-fx-cursor: hand; " +
            "-fx-effect: dropshadow(gaussian, rgba(27, 163, 182, 0.25), 8, 0, 0, 2);";

    // Hover style for ComboBox
    private static final String HOVER_STYLE = "-fx-background-color: white; " +
            "-fx-border-color: #1ba3b6; " +
            "-fx-border-radius: 8; " +
            "-fx-background-radius: 8; " +
            "-fx-padding: 6 12; " +
            "-fx-font-size: 14px; " +
            "-fx-cursor: hand;";

    /**
     * Apply consistent styling to a ComboBox with hover and focus effects.
     * This matches the styling used in Employee Management screen.
     *
     * @param comboBox The ComboBox to style
     */
    public static <T> void style(ComboBox<T> comboBox) {
        if (comboBox == null)
            return;

        comboBox.setStyle(DEFAULT_STYLE);

        // Set a custom button cell to properly display prompt text
        comboBox.setButtonCell(new ListCell<T>() {
            @Override
            protected void updateItem(T item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    // Show prompt text with gray color
                    String prompt = comboBox.getPromptText();
                    setText(prompt != null ? prompt : "");
                    setStyle("-fx-text-fill: #9ca3af; -fx-font-size: 14px;");
                } else {
                    setText(item.toString());
                    setStyle("-fx-text-fill: #333333; -fx-font-size: 14px;");
                }
            }
        });

        // Focus styling
        comboBox.focusedProperty().addListener((obs, wasFocused, isFocused) -> {
            comboBox.setStyle(isFocused ? FOCUSED_STYLE : DEFAULT_STYLE);
        });

        // Hover styling
        comboBox.setOnMouseEntered(e -> {
            if (!comboBox.isFocused()) {
                comboBox.setStyle(HOVER_STYLE);
            }
        });

        comboBox.setOnMouseExited(e -> {
            if (!comboBox.isFocused()) {
                comboBox.setStyle(DEFAULT_STYLE);
            }
        });
    }

    /**
     * Apply styling to multiple ComboBoxes at once.
     *
     * @param comboBoxes The ComboBoxes to style
     */
    @SuppressWarnings("unchecked")
    public static void styleAll(ComboBox<?>... comboBoxes) {
        for (ComboBox<?> comboBox : comboBoxes) {
            style((ComboBox<Object>) comboBox);
        }
    }
}
