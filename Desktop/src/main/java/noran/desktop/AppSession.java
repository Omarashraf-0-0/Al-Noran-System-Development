package noran.desktop;

import noran.desktop.Controllers.User;

public class AppSession {
    private static AppSession instance;
    private User currentUser;
    private String authToken; // 🔴 NEW: Store the token

    private AppSession() {}

    public static AppSession getInstance() {
        if (instance == null) instance = new AppSession();
        return instance;
    }

    public User getCurrentUser() { return currentUser; }
    public void setCurrentUser(User currentUser) { this.currentUser = currentUser; }

    // 🔴 NEW Getters & Setters for Token
    public String getAuthToken() { return authToken; }
    public void setAuthToken(String authToken) { this.authToken = authToken; }

    public void logout() {
        currentUser = null;
        authToken = null;
    }
}