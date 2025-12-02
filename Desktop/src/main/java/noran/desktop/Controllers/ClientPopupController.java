package noran.desktop.Controllers;

import javafx.fxml.FXML;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import noran.desktop.models.Client;

public class ClientPopupController {

    @FXML private TextField fullnameField;
    @FXML private TextField emailField;
    @FXML private TextField ssnField;
    @FXML private TextField phoneField;
    @FXML private TextField passwordField;
    @FXML private javafx.scene.control.ComboBox<String> clientTypeField;

    private Client originalClient;
    private boolean saved = false;

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
        if (fullnameField.getText().isBlank() ||
                emailField.getText().isBlank() ||
                ssnField.getText().isBlank() ||
                phoneField.getText().isBlank() ||
                clientTypeField.getValue() == null ||
                passwordField.getText().isBlank()) {

            System.out.println("❌ Cannot save empty fields.");
            return;
        }

        saved = true;

        originalClient.setFullname(fullnameField.getText());
        originalClient.setEmail(emailField.getText());
        originalClient.setSsn(ssnField.getText());
        originalClient.setPhone(phoneField.getText());
        originalClient.setClientType(clientTypeField.getValue());
        originalClient.setPassword(passwordField.getText());

        close();
    }

    @FXML
    private void cancel() {
        saved = false;
        close();
    }

    public boolean isSaved() {
        return saved;
    }

    private void close() {
        Stage stage = (Stage) fullnameField.getScene().getWindow();
        stage.close();
    }
}
