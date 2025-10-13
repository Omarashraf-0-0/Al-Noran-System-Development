package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.*;

import static com.mongodb.client.model.Filters.eq;
import noran.desktop.Database.MongoConnection;

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

        Document user = usersCollection.find(eq("username", username)).first();

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
        showAlert(Alert.AlertType.INFORMATION, "Password Reset", "Password reset instructions sent to your email.");
    }

    private void showAlert(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
