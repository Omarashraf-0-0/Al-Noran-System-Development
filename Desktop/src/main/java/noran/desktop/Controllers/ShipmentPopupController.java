package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.ComboBox;
import javafx.scene.control.ListCell;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import javafx.util.StringConverter;
import noran.desktop.Database.MongoConnection;
import noran.desktop.Utils.ComboBoxStyler;
import noran.desktop.models.Shipment;
import org.bson.Document;

import java.net.URL;
import java.util.ResourceBundle;

public class ShipmentPopupController implements Initializable {

    @FXML
    private ComboBox<UserItem> clientCombo; // Custom Class to hold ID & Name
    @FXML
    private TextField acidField;
    @FXML
    private TextField portField;
    @FXML
    private TextField countryField;
    @FXML
    private TextField containersField;
    @FXML
    private ComboBox<String> statusCombo;
    @FXML
    private TextField policyField;

    private Shipment original;
    private boolean saved = false;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        statusCombo.setEditable(false);
        loadClients(); // Load users from MongoDB

        // Apply consistent ComboBox styling
        ComboBoxStyler.styleAll(clientCombo, statusCombo);
    }

    private void loadClients() {
        ObservableList<UserItem> clients = FXCollections.observableArrayList();
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> users = db.getCollection("users");

            for (Document doc : users.find()) {
                String id = doc.getObjectId("_id").toString();
                String name = doc.getString("fullname");
                if (name == null || name.isEmpty())
                    name = doc.getString("username"); // Fallback
                clients.add(new UserItem(id, name));
            }
            clientCombo.setItems(clients);
        } catch (Exception e) {
            System.err.println("Error loading clients: " + e.getMessage());
        }
    }

    public void loadShipment(Shipment s) {
        this.original = s;
        if (s == null)
            return;

        acidField.setText(s.getAcid());
        portField.setText(s.getPortName());
        countryField.setText(s.getCountry());
        containersField.setText(String.valueOf(s.getNumOfContainers()));
        statusCombo.setValue(s.getStatus());
        policyField.setText(s.getPolicy());

        // Select the correct client in ComboBox
        for (UserItem item : clientCombo.getItems()) {
            if (item.id.equals(s.getUserId())) {
                clientCombo.setValue(item);
                break;
            }
        }
    }

    @FXML
    private void save() {
        if (clientCombo.getValue() == null) {
            System.out.println("⚠ Please select a client");
            return;
        }
        if (portField.getText().isBlank() || countryField.getText().isBlank() || containersField.getText().isBlank()) {
            System.out.println("⚠ Please fill mandatory fields");
            return;
        }

        int num;
        try {
            num = Integer.parseInt(containersField.getText().trim());
            if (num < 1)
                throw new NumberFormatException();
        } catch (NumberFormatException e) {
            System.out.println("⚠ Containers must be a positive integer");
            return;
        }

        saved = true;

        if (original != null) {
            // Update the object with new values from fields
            original.setUserId(clientCombo.getValue().id);
            original.setCustomerName(clientCombo.getValue().name);
            original.setAcid(acidField.getText().trim());
            original.setPortName(portField.getText().trim());
            original.setCountry(countryField.getText().trim());
            original.setNumOfContainers(num);
            original.setStatus(statusCombo.getValue() == null ? "Pending" : statusCombo.getValue());
            original.setPolicy(policyField.getText().trim());
        }

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
        Stage stage = (Stage) acidField.getScene().getWindow();
        stage.close();
    }

    // Helper class for ComboBox
    private static class UserItem {
        String id;
        String name;

        public UserItem(String id, String name) {
            this.id = id;
            this.name = name;
        }

        @Override
        public String toString() {
            return name;
        }
    }
}