package noran.desktop.Controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import java.net.URL;
import java.util.ResourceBundle;
import java.util.function.Consumer;

public class TopBarController implements Initializable {

    @FXML private Label userNameLabel;
    @FXML private Label userIdLabel;
    @FXML private Label pageName;
    @FXML private TextField searchField;
    @FXML private HBox searchContainer;

    private Consumer<String> onSearchListener;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        if (searchField != null) {
            searchField.textProperty().addListener((observable, oldValue, newValue) -> {
                if (onSearchListener != null) {
                    onSearchListener.accept(newValue);
                }
            });
        }
    }

    public void setUserData(String name, String id) {
        if (userNameLabel != null) userNameLabel.setText(name);
        if (userIdLabel != null) userIdLabel.setText(id);
    }

    public void setPageTitle(String title) {
        if (pageName != null) pageName.setText(title);
    }

    public void setOnSearchAction(Consumer<String> action) {
        this.onSearchListener = action;
    }

    // --- UPDATED METHOD ---
    public void setSearchBarVisible(boolean visible) {
        if (searchContainer != null) {
            // 1. Hide the element visually
            searchContainer.setVisible(visible);

            // 2. KEEP it managed so it still takes up space in the layout
            // (Do NOT set managed(false) here)
            searchContainer.setManaged(true);
        }
    }
}