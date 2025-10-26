package noran.desktop;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import noran.desktop.Controllers.User;

import java.net.URL;
import java.util.ResourceBundle;

public class HelloController implements Initializable {

    @FXML
    private Label welcomeText;

    @FXML
    private Label userNameLabel;

    @FXML
    private Label userIdLabel;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // Populate user details from the application session if available
        User u = AppSession.getInstance().getCurrentUser();
        if (u != null) {
            if (userNameLabel != null) userNameLabel.setText(u.getName() == null || u.getName().isBlank() ? "" : u.getName());
            if (userIdLabel != null) {
                String idText = (u.getId() == null || u.getId().isBlank()) ? "" : ("ID: " + u.getId());
                userIdLabel.setText(idText);
            }
        }
    }

    @FXML
    protected void onHelloButtonClick() {
        if (welcomeText != null) welcomeText.setText("Welcome to JavaFX Application!");
    }
}