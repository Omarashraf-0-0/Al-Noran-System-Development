package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.stage.Stage;

import static com.mongodb.client.model.Filters.eq;
import noran.desktop.Database.MongoConnection;

import java.io.IOException;

public class LoginController {

    @FXML
    private TextField usernameField;

    @FXML
    private PasswordField passwordField;

    @FXML
    private Button loginButton;

    @FXML
    private Hyperlink forgotPasswordLink;

    private MongoDatabase database;

    @FXML
    void initialize() {
        // Connect to MongoDB when controller is initialized
        database = MongoConnection.getDatabase();
        System.out.println("Connected to MongoDB successfully!");
    }

    @FXML
    void onLoginClicked(ActionEvent event) {
        String username = usernameField.getText().trim();
        String password = passwordField.getText().trim();

        if (username.isEmpty() || password.isEmpty()) {
            showAlert(Alert.AlertType.WARNING, "Missing Fields", "Please enter both username and password.");
            return;
        }

        MongoCollection<Document> usersCollection = database.getCollection("users");

        Document user = usersCollection.find(eq("email", username)).first();

        if (user == null) {
            showAlert(Alert.AlertType.ERROR, "Login Failed", "No user found with that username.");
        } else {
            String storedPassword = user.getString("password");

            if (password.equals(storedPassword)) {
                showAlert(Alert.AlertType.INFORMATION, "Login Successful", "Welcome, " + username + "!");
            } else {
                showAlert(Alert.AlertType.ERROR, "Login Failed", "Incorrect password.");
            }
        }
    }

    @FXML
    void onForgotPasswordClicked(ActionEvent event) {
        try {
            // Load the FXML file (make sure this path is correct!)
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/email-for-otp-ar.fxml"));

            // Create a new scene
            Parent root = loader.load();
            Scene scene = new Scene(root);

            // Get the current stage and switch the scene
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.setScene(scene);
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "Error", "Unable to open Forgot Password screen.");
        }
    }


    private void showAlert(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
