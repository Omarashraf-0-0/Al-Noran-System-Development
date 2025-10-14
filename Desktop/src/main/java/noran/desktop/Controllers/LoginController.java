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
import javafx.stage.Stage;
import javafx.scene.control.*;
import org.mindrot.jbcrypt.BCrypt;
import noran.desktop.Database.MongoConnection;

import static com.mongodb.client.model.Filters.eq;

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
            showAlert(Alert.AlertType.WARNING, "الحقول مفقودة", "الرجاء إدخال اسم المستخدم وكلمة المرور.");
            return;
        }

        MongoCollection<Document> usersCollection = database.getCollection("users");

        Document user = usersCollection.find(eq("email", username)).first();

        if (user == null) {
            showAlert(Alert.AlertType.ERROR, "فشل تسجيل الدخول", "لم يتم العثور على مستخدم بهذا البريد الإلكتروني.");
        } else {
            String storedPassword = user.getString("password");

            if (BCrypt.checkpw(password, storedPassword)) {
                showAlert(Alert.AlertType.INFORMATION, "تسجيل الدخول ناجح", "مرحبًا، " + username + "!");
                // Optionally navigate to the main application page
                // navigateToMainPage(event);
            } else {
                showAlert(Alert.AlertType.ERROR, "فشل تسجيل الدخول", "كلمة المرور غير صحيحة.");
            }
        }
    }

    @FXML
    void onForgotPasswordClicked(ActionEvent event) {
        try {
            // Load the FXML file for OTP entry
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/email-for-otp-ar.fxml"));
            Parent root = loader.load();
            Scene scene = new Scene(root);

            // Get the current stage and switch the scene
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.setScene(scene);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر فتح شاشة إعادة تعيين كلمة المرور.");
        }
    }

    /**
     * Utility method to show alerts
     */
    private void showAlert(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.getDialogPane().setNodeOrientation(javafx.geometry.NodeOrientation.RIGHT_TO_LEFT);
        alert.showAndWait();
    }

    /**
     * Optional: Navigate to main application page after successful login
     */
    private void navigateToMainPage(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/main-page.fxml"));
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            Scene scene = new Scene(root);
            stage.setScene(scene);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "خطأ", "تعذر فتح الصفحة الرئيسية.");
        }
    }
}