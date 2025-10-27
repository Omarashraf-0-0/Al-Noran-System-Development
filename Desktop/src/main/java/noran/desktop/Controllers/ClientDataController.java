package noran.desktop.Controllers;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.stage.Stage;
import noran.desktop.AppSession;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

public class ClientDataController implements Initializable {
    @FXML
    Label userNameLabel;
    @FXML
    Label userIdLabel;

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

    public void onDashboardClick(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/dashboard.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
}
