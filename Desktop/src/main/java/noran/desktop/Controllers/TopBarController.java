package noran.desktop.Controllers;

import javafx.animation.TranslateTransition;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.geometry.Bounds;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.image.ImageView;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.util.Duration;
import noran.desktop.AppSession;

import java.net.URL;
import java.util.ResourceBundle;
import java.util.function.Consumer;

public class TopBarController implements Initializable {

    @FXML
    private Label userNameLabel;
    @FXML
    private Label userEmailLabel;
    @FXML
    private Label pageName;
    @FXML
    private TextField searchField;
    @FXML
    private HBox searchContainer;
    @FXML
    private HBox userProfileArea;
    @FXML
    private ImageView avatarImage;
    @FXML
    private ImageView menuIcon;

    private Consumer<String> onSearchListener;
    private ContextMenu userMenu;

    // Sidebar reference and state
    private VBox sidebar;
    private boolean sidebarVisible = true;
    private static final double SIDEBAR_WIDTH = 260;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        if (searchField != null) {
            searchField.textProperty().addListener((observable, oldValue, newValue) -> {
                if (onSearchListener != null) {
                    onSearchListener.accept(newValue);
                }
            });
        }

        // Create the dropdown menu
        createUserMenu();
    }

    /**
     * Set the sidebar reference so it can be toggled from the menu icon
     */
    public void setSidebar(VBox sidebar) {
        this.sidebar = sidebar;
    }

    @FXML
    private void toggleSidebar(MouseEvent event) {
        if (sidebar == null)
            return;

        TranslateTransition transition = new TranslateTransition(Duration.millis(300), sidebar);

        if (sidebarVisible) {
            // Slide out (hide)
            transition.setToX(-SIDEBAR_WIDTH);
            transition.setOnFinished(e -> {
                sidebar.setManaged(false);
            });
        } else {
            // Slide in (show)
            sidebar.setManaged(true);
            transition.setToX(0);
        }

        transition.play();
        sidebarVisible = !sidebarVisible;
    }

    private void createUserMenu() {
        userMenu = new ContextMenu();

        // Logout menu item
        MenuItem logoutItem = new MenuItem("تسجيل الخروج");
        logoutItem.setOnAction(e -> handleLogout());
        userMenu.getItems().add(logoutItem);

        // Apply CSS stylesheet when menu is shown to disable hover effects
        userMenu.setOnShowing(e -> {
            if (userMenu.getScene() != null) {
                userMenu.getScene().getStylesheets().add(
                        getClass().getResource("/noran/desktop/user-menu.css").toExternalForm());
            }
        });
    }

    @FXML
    private void showUserMenu(MouseEvent event) {
        if (userMenu != null && userProfileArea != null) {
            // Get the bounds of the profile area to position the menu
            Bounds bounds = userProfileArea.localToScreen(userProfileArea.getBoundsInLocal());

            // Show the menu below the profile area
            userMenu.show(userProfileArea, bounds.getMinX(), bounds.getMaxY() + 5);
        }
    }

    private void handleLogout() {
        try {
            // Clear the session
            AppSession.getInstance().logout();

            // Navigate to login screen
            Stage stage = (Stage) userProfileArea.getScene().getWindow();
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/login-view-ar.fxml"));
            Parent root = loader.load();
            stage.getScene().setRoot(root);

        } catch (Exception e) {
            e.printStackTrace();
            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle("خطأ");
            alert.setHeaderText(null);
            alert.setContentText("حدث خطأ أثناء تسجيل الخروج: " + e.getMessage());
            alert.showAndWait();
        }
    }

    public void setUserData(String name, String email) {
        if (userNameLabel != null)
            userNameLabel.setText(name);
        if (userEmailLabel != null)
            userEmailLabel.setText(email);
    }

    public void setPageTitle(String title) {
        if (pageName != null)
            pageName.setText(title);
    }

    public void setOnSearchAction(Consumer<String> action) {
        this.onSearchListener = action;
    }

    public void setSearchBarVisible(boolean visible) {
        if (searchContainer != null) {
            searchContainer.setVisible(visible);
            searchContainer.setManaged(true);
        }
    }
}