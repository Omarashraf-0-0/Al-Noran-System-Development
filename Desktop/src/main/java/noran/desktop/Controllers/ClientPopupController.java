package noran.desktop.Controllers;

import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import noran.desktop.models.Client;
import java.util.function.Function;

public class ClientPopupController {

    @FXML private TextField fullnameField;
    @FXML private TextField emailField;
    @FXML private TextField ssnField;
    @FXML private TextField phoneField;
    @FXML private TextField passwordField;
    @FXML private ComboBox<String> clientTypeField;

    private Client originalClient;
    private boolean saved = false;

    // Handler function: Takes a Client, returns Boolean (Success/Fail)
    private Function<Client, Boolean> saveHandler;

    public void setSaveHandler(Function<Client, Boolean> saveHandler) {
        this.saveHandler = saveHandler;
    }

    public void loadClient(Client client) {
        this.originalClient = client;

        fullnameField.setText(client.getFullname());
        emailField.setText(client.getEmail());
        ssnField.setText(client.getSsn());
        phoneField.setText(client.getPhone());
        clientTypeField.setValue(client.getClientType());
        passwordField.setText(client.getPassword() != null ? client.getPassword() : "");
    }

    @FXML
    private void save() {
        // Validation
        if (fullnameField.getText().isBlank() ||
                emailField.getText().isBlank() ||
                ssnField.getText().isBlank() ||
                phoneField.getText().isBlank() ||
                clientTypeField.getValue() == null ||
                passwordField.getText().isBlank()) {

            showAlert("خطأ: يرجى ملء جميع الحقول.");
            return;
        }

        // Update Model
        originalClient.setFullname(fullnameField.getText());
        originalClient.setEmail(emailField.getText());
        originalClient.setSsn(ssnField.getText());
        originalClient.setPhone(phoneField.getText());
        originalClient.setClientType(clientTypeField.getValue());
        originalClient.setPassword(passwordField.getText());

        // Call Main Controller to Save
        if (saveHandler != null) {
            boolean success = saveHandler.apply(originalClient);

            if (success) {
                saved = true;
                close(); // ✅ Close ONLY if save was successful
            }
            // 🛑 If false, do nothing. The alert is shown by the main controller.
        }
    }

    @FXML
    private void cancel() {
        saved = false;
        close();
    }

    public boolean isSaved() { return saved; }

    private void close() {
        Stage stage = (Stage) fullnameField.getScene().getWindow();
        stage.close();
    }

    private void showAlert(String msg) {
        new Alert(Alert.AlertType.WARNING, msg).show();
    }
}