package noran.desktop;

import noran.desktop.Applications.LoginApplication;

/**
 * Launcher class for the packaged JAR/EXE.
 * 
 * This is required because JavaFX applications need a non-JavaFX
 * main class when packaged as a fat JAR. The JavaFX runtime requires
 * the main class to not extend Application.
 */
public class Launcher {
    public static void main(String[] args) {
        LoginApplication.main(args);
    }
}
