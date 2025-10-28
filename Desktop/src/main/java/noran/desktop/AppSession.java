package noran.desktop;

import noran.desktop.Controllers.User;

/**
 * Simple application session holder (singleton) to keep app-scoped objects like the current user.
 */
public final class AppSession {

    private static final AppSession INSTANCE = new AppSession();

    private User currentUser;

    private AppSession() {
    }

    public static AppSession getInstance() {
        return INSTANCE;
    }

    public User getCurrentUser() {
        return currentUser;
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void clear() {
        this.currentUser = null;
    }
}
