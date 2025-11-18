package noran.desktop.Controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import noran.desktop.models.Shipment;

import java.net.URL;
import java.util.ResourceBundle;

public class ShipmentPopupController implements Initializable {

    @FXML private TextField acidField;
    @FXML private TextField portField;
    @FXML private TextField countryField;
    @FXML private TextField containersField;
    @FXML private ComboBox<String> statusCombo;
    @FXML private TextField policyField;

    private Shipment original;
    private boolean saved = false;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // make status combo non-editable so user must pick from the list
        statusCombo.setEditable(false);
    }

    public void loadShipment(Shipment s) {
        this.original = s;
        acidField.setText(s.getAcid());
        portField.setText(s.getPortName());
        countryField.setText(s.getCountry());
        containersField.setText(String.valueOf(s.getNumOfContainers()));
        statusCombo.setValue(s.getStatus());
        policyField.setText(s.getPolicy());
    }

    @FXML
    private void save() {
        // validate
        if (portField.getText().isBlank() || countryField.getText().isBlank() ||
                containersField.getText().isBlank()) {
            System.out.println("⚠ Please fill port, country and containers");
            return;
        }
        int num;
        try {
            num = Integer.parseInt(containersField.getText().trim());
            if (num < 1) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            System.out.println("⚠ containers must be a positive integer");
            return;
        }

        saved = true;

        if (original != null) {
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
}
