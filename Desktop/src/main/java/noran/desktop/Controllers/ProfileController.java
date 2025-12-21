package noran.desktop.Controllers;

import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.shape.Circle;
import noran.desktop.AppSession;

public class ProfileController {

    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    // Hero Section
    @FXML
    private Label fullnameLabel;
    @FXML
    private Label roleLabel;
    @FXML
    private Label roleBadge;
    @FXML
    private Label statusLabel;
    @FXML
    private Circle statusIndicator;
    @FXML
    private ImageView profileImage;
    @FXML
    private StackPane profileImageContainer;
    @FXML
    private Label defaultAvatar;

    // Personal Info Card
    @FXML
    private Label usernameLabel;
    @FXML
    private Label fullnameInfoLabel;
    @FXML
    private Label employeeTypeLabel;

    // Contact Info Card
    @FXML
    private Label emailLabel;
    @FXML
    private Label phoneLabel;
    @FXML
    private Label verifiedLabel;

    // Account Info Card
    @FXML
    private Label createdAtLabel;
    @FXML
    private Label updatedAtLabel;
    @FXML
    private Label activeLabel;

    @FXML
    public void initialize() {
        if (sidebarController != null) {
            sidebarController.setActivePage("profile");
        }
        setupTopBar();
        loadUserProfile();
    }

    private void setupTopBar() {
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {
            topBarController.setPageTitle("الملف الشخصي");
            topBarController.setSearchBarVisible(false);
            topBarController.setSidebar(sidebar);
            if (currentUser != null) {
                String name = currentUser.getName() != null ? currentUser.getName() : "مستخدم";
                String email = currentUser.getEmail() != null ? currentUser.getEmail() : "";
                topBarController.setUserData(name, email);
                // Load profile photo
                String profilePhoto = currentUser.getProfilePhoto();
                if (profilePhoto != null && !profilePhoto.isEmpty()) {
                    topBarController.setProfilePhoto(profilePhoto);
                }
            }
        }
    }

    private void loadUserProfile() {
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (currentUser == null)
            return;

        // Use cached data from login - instant loading!
        populateProfileFromCache(currentUser);
    }

    private void populateProfileFromCache(User user) {
        // Get data from cached User object
        String fullname = user.getFullname() != null ? user.getFullname() : user.getName();
        String username = user.getUsername() != null ? user.getUsername() : "";
        String email = user.getEmail() != null ? user.getEmail() : "";
        String phone = user.getPhone() != null ? user.getPhone() : "";
        String employeeType = user.getEmployeeType() != null ? user.getEmployeeType() : "";
        boolean verified = user.isVerified();
        boolean active = user.isActive();
        String profilePhotoPath = user.getProfilePhoto();

        // Hero Section
        fullnameLabel.setText(fullname != null && !fullname.isEmpty() ? fullname : "غير معروف");

        String roleText = "موظف";
        String badgeText = "موظف";
        if ("System Admin".equalsIgnoreCase(employeeType) || user.isAdmin()) {
            roleText = "مدير النظام";
            badgeText = "System Admin";
            roleBadge.setStyle("-fx-background-color: rgba(255,255,255,0.3); -fx-background-radius: 20; " +
                    "-fx-padding: 4 16; -fx-text-fill: white; -fx-font-size: 13; -fx-font-weight: bold;");
        } else {
            badgeText = employeeType != null && !employeeType.isEmpty() ? employeeType : "موظف";
        }
        roleLabel.setText(roleText);
        roleBadge.setText(badgeText);

        // Status
        if (active) {
            statusLabel.setText("نشط");
            statusIndicator.setStyle("-fx-fill: #10b981;");
        } else {
            statusLabel.setText("غير نشط");
            statusIndicator.setStyle("-fx-fill: #ef4444;");
        }

        // Personal Info Card
        usernameLabel.setText(!username.isEmpty() ? username : "-");
        fullnameInfoLabel.setText(fullname != null && !fullname.isEmpty() ? fullname : "-");
        employeeTypeLabel.setText(employeeType != null && !employeeType.isEmpty() ? employeeType : user.getRole());

        // Contact Info Card
        emailLabel.setText(!email.isEmpty() ? email : "-");
        phoneLabel.setText(!phone.isEmpty() ? phone : "-");

        if (verified) {
            verifiedLabel.setText("موثق ✓");
            verifiedLabel.setStyle("-fx-font-size: 16; -fx-font-weight: 600; -fx-text-fill: #10b981;");
        } else {
            verifiedLabel.setText("غير موثق");
            verifiedLabel.setStyle("-fx-font-size: 16; -fx-font-weight: 600; -fx-text-fill: #f59e0b;");
        }

        // Account Info Card - Dates not cached, show placeholder
        createdAtLabel.setText("-");
        updatedAtLabel.setText("-");

        if (active) {
            activeLabel.setText("نشط ✓");
            activeLabel.setStyle("-fx-font-size: 16; -fx-font-weight: bold; -fx-text-fill: #10b981;");
        } else {
            activeLabel.setText("غير نشط");
            activeLabel.setStyle("-fx-font-size: 16; -fx-font-weight: bold; -fx-text-fill: #ef4444;");
        }

        // Profile Photo
        loadProfilePhoto(profilePhotoPath);
    }

    private void loadProfilePhoto(String photoPath) {
        if (photoPath != null && !photoPath.isEmpty()) {
            // Run in background thread to avoid blocking UI
            new Thread(() -> {
                try {
                    String fullUrl;
                    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
                        fullUrl = photoPath; // Already a full URL
                    } else {
                        // S3 path - fetch presigned URL from backend
                        fullUrl = noran.desktop.Services.APIService.getPresignedUrl(photoPath);
                        if (fullUrl == null) {
                            Platform.runLater(() -> defaultAvatar.setVisible(true));
                            return;
                        }
                    }

                    Image image = new Image(fullUrl, true);
                    image.progressProperty().addListener((obs, oldVal, newVal) -> {
                        if (newVal.doubleValue() >= 1.0 && !image.isError()) {
                            Platform.runLater(() -> {
                                profileImage.setImage(image);
                                defaultAvatar.setVisible(false);
                            });
                        }
                    });

                    image.errorProperty().addListener((obs, oldVal, newVal) -> {
                        if (newVal) {
                            Platform.runLater(() -> defaultAvatar.setVisible(true));
                        }
                    });
                } catch (Exception e) {
                    Platform.runLater(() -> defaultAvatar.setVisible(true));
                }
            }).start();
        } else {
            defaultAvatar.setVisible(true);
        }
    }
}
