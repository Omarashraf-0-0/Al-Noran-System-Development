package noran.desktop;

import javafx.scene.image.Image;
import noran.desktop.Controllers.User;

public class AppSession {
    private static AppSession instance;
    private User currentUser;
    private String authToken; // 🔴 Store the token
    private Image cachedProfileImage; // Cached profile image to avoid reloading

    private AppSession() {
    }

    public static AppSession getInstance() {
        if (instance == null)
            instance = new AppSession();
        return instance;
    }

    public User getCurrentUser() {
        return currentUser;
    }

    public void setCurrentUser(User currentUser) {
        this.currentUser = currentUser;
    }

    // 🔴 Getters & Setters for Token
    public String getAuthToken() {
        return authToken;
    }

    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }

    // Cached profile image
    public Image getCachedProfileImage() {
        return cachedProfileImage;
    }

    public void setCachedProfileImage(Image image) {
        this.cachedProfileImage = image;
    }

    public void logout() {
        currentUser = null;
        authToken = null;
        cachedProfileImage = null;
    }
}