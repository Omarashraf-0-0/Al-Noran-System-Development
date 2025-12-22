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
    private boolean sidebarVisible = false; // Default: sidebar is CLOSED
    private static final double SIDEBAR_WIDTH = 280;

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

        // Auto-load user data and profile photo from session
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (currentUser != null) {
            if (userNameLabel != null) {
                userNameLabel.setText(currentUser.getName() != null ? currentUser.getName() : "");
            }
            if (userEmailLabel != null) {
                userEmailLabel.setText(currentUser.getEmail() != null ? currentUser.getEmail() : "");
            }

            // Check for cached profile image first
            javafx.scene.image.Image cachedImage = AppSession.getInstance().getCachedProfileImage();
            if (cachedImage != null && avatarImage != null) {
                // Use cached image - no need to reload
                avatarImage.setImage(cachedImage);
                double size = Math.min(avatarImage.getFitWidth(), avatarImage.getFitHeight());
                javafx.scene.shape.Circle clip = new javafx.scene.shape.Circle(size / 2, size / 2, size / 2);
                avatarImage.setClip(clip);
            } else {
                // Load profile photo from session (will be cached after loading)
                String profilePhoto = currentUser.getProfilePhoto();
                if (profilePhoto != null && !profilePhoto.isEmpty()) {
                    setProfilePhoto(profilePhoto);
                }
            }
        }
    }

    /**
     * Set the sidebar reference so it can be toggled from the menu icon.
     * Sidebar starts hidden by default.
     * Also registers Ctrl+Tab keyboard shortcut for toggling.
     */
    public void setSidebar(VBox sidebar) {
        this.sidebar = sidebar;
        // Hide sidebar immediately on startup
        if (sidebar != null) {
            sidebar.setTranslateX(-SIDEBAR_WIDTH);
            sidebar.setManaged(false);

            // Register Ctrl+Tab shortcut when scene becomes available
            javafx.application.Platform.runLater(() -> {
                if (sidebar.getScene() != null) {
                    registerSidebarShortcut(sidebar.getScene());
                } else {
                    // If scene is not yet available, wait for it
                    sidebar.sceneProperty().addListener((obs, oldScene, newScene) -> {
                        if (newScene != null) {
                            registerSidebarShortcut(newScene);
                        }
                    });
                }
            });
        }
    }

    // Track if animation is currently running
    private TranslateTransition currentTransition;
    private boolean isAnimating = false;

    @FXML
    private void toggleSidebar(MouseEvent event) {
        toggleSidebarAction();
    }

    /**
     * Public method to toggle sidebar (can be called from keyboard shortcut)
     */
    public void toggleSidebarAction() {
        if (sidebar == null)
            return;

        // If animation is running, stop it and complete immediately
        if (isAnimating && currentTransition != null) {
            currentTransition.stop();
            // Set to target position immediately
            if (sidebarVisible) {
                sidebar.setTranslateX(0);
            } else {
                sidebar.setTranslateX(-SIDEBAR_WIDTH);
                sidebar.setManaged(false);
            }
        }

        isAnimating = true;
        currentTransition = new TranslateTransition(Duration.millis(250), sidebar);

        if (sidebarVisible) {
            // Slide out (hide)
            currentTransition.setToX(-SIDEBAR_WIDTH);
            currentTransition.setOnFinished(e -> {
                sidebar.setManaged(false);
                isAnimating = false;
            });
        } else {
            // Slide in (show)
            sidebar.setManaged(true);
            currentTransition.setToX(0);
            currentTransition.setOnFinished(e -> {
                isAnimating = false;
            });
        }

        currentTransition.play();
        sidebarVisible = !sidebarVisible;
    }

    /**
     * Register Ctrl+Tab shortcut to toggle sidebar
     */
    public void registerSidebarShortcut(javafx.scene.Scene scene) {
        if (scene == null)
            return;

        scene.addEventFilter(javafx.scene.input.KeyEvent.KEY_PRESSED, e -> {
            if (e.isControlDown() && e.getCode() == javafx.scene.input.KeyCode.TAB) {
                toggleSidebarAction();
                e.consume();
            }
        });
    }

    private void createUserMenu() {
        userMenu = new ContextMenu();

        // Profile menu item
        MenuItem profileItem = new MenuItem("الملف الشخصي");
        profileItem.setStyle("-fx-text-fill: #333333;");
        profileItem.setOnAction(e -> navigateToProfile());
        userMenu.getItems().add(profileItem);

        // Separator
        userMenu.getItems().add(new SeparatorMenuItem());

        // Logout menu item
        MenuItem logoutItem = new MenuItem("تسجيل الخروج");
        logoutItem.setStyle("-fx-text-fill: #c91e2b;");
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

    private void navigateToProfile() {
        try {
            Stage stage = (Stage) userProfileArea.getScene().getWindow();
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/profile.fxml"));
            Parent root = loader.load();
            stage.getScene().setRoot(root);
        } catch (Exception e) {
            e.printStackTrace();
            noran.desktop.Utils.AlertUtils.showError("خطأ", "حدث خطأ أثناء فتح الملف الشخصي: " + e.getMessage());
        }
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
            noran.desktop.Utils.AlertUtils.showError("خطأ", "حدث خطأ أثناء تسجيل الخروج: " + e.getMessage());
        }
    }

    public void setUserData(String name, String email) {
        if (userNameLabel != null)
            userNameLabel.setText(name);
        if (userEmailLabel != null)
            userEmailLabel.setText(email);
    }

    public void setProfilePhoto(String photoPath) {
        if (avatarImage == null || photoPath == null || photoPath.isEmpty()) {
            return;
        }

        // Run in background to avoid blocking UI
        new Thread(() -> {
            try {
                String fullUrl;
                if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
                    fullUrl = photoPath; // Already a full URL
                } else {
                    // S3 path - need to fetch presigned URL from backend
                    fullUrl = noran.desktop.Services.APIService.getPresignedUrl(photoPath);
                    if (fullUrl == null) {
                        return;
                    }
                }

                // Load image on background thread
                javafx.scene.image.Image image = new javafx.scene.image.Image(fullUrl, true);

                image.progressProperty().addListener((obs, oldVal, newVal) -> {
                    if (newVal.doubleValue() >= 1.0 && !image.isError()) {
                        // Cache the image in AppSession
                        AppSession.getInstance().setCachedProfileImage(image);
                        javafx.application.Platform.runLater(() -> {
                            avatarImage.setImage(image);
                            // Apply circular clip
                            double size = Math.min(avatarImage.getFitWidth(), avatarImage.getFitHeight());
                            javafx.scene.shape.Circle clip = new javafx.scene.shape.Circle(size / 2, size / 2,
                                    size / 2);
                            avatarImage.setClip(clip);
                        });
                    }
                });
            } catch (Exception e) {
                // Keep default avatar - silent fail
            }
        }).start();
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

    /**
     * Set the placeholder text for the search field to indicate what it searches.
     */
    public void setSearchPlaceholder(String placeholder) {
        if (searchField != null) {
            searchField.setPromptText(placeholder);
        }
    }
}