package noran.desktop.Applications;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;
import java.io.IOException;

public class LoginApplication extends Application {
    @Override
    public void start(Stage stage) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(getClass().getResource("/noran/desktop/login-view-ar.fxml"));
        // Set explicit window size (1250x780) for consistent sizing across the app
        Scene scene = new Scene(fxmlLoader.load(), 1250, 780);
        stage.setTitle("Al Noran");
        stage.getIcons()
                .add(new javafx.scene.image.Image(getClass().getResourceAsStream("/noran/desktop/images/Logo.png")));
        stage.setScene(scene);
        stage.show();
    }

    public static void main(String[] args) {
        launch();

    }
}
