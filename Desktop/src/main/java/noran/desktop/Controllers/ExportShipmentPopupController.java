package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.stage.Stage;
import noran.desktop.Database.MongoConnection;
import noran.desktop.Utils.ComboBoxStyler;
import noran.desktop.models.ExportShipment;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.net.URL;
import java.util.Date;
import java.util.ResourceBundle;
import java.util.function.Function;

public class ExportShipmentPopupController implements Initializable {

    @FXML
    private TextField shipmentNumberField;
    @FXML
    private TextField ucrNumberField;
    @FXML
    private ComboBox<String> shippingMethodCombo;
    @FXML
    private TextField destinationCountryField;
    @FXML
    private TextField destinationPortField;
    @FXML
    private TextField containersCountField;
    @FXML
    private TextField totalWeightField;
    @FXML
    private TextField valueInEGPField;
    @FXML
    private TextField totalFeesField;
    @FXML
    private CheckBox feePaidCheckbox;
    @FXML
    private ComboBox<String> statusCombo;

    private ExportShipment currentExport;
    private boolean saved = false;
    private Function<ExportShipment, Boolean> saveHandler;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // Apply consistent ComboBox styling
        ComboBoxStyler.styleAll(shippingMethodCombo, statusCombo);
    }

    /**
     * Load an existing export shipment into the form for editing
     */
    public void loadExport(ExportShipment export) {
        this.currentExport = export;

        if (export.getShipmentNumber() != null)
            shipmentNumberField.setText(export.getShipmentNumber());
        if (export.getUcrNumber() != null)
            ucrNumberField.setText(export.getUcrNumber());
        if (export.getShippingMethod() != null)
            shippingMethodCombo.setValue(export.getShippingMethod());
        if (export.getDestinationCountry() != null)
            destinationCountryField.setText(export.getDestinationCountry());
        if (export.getDestinationPort() != null)
            destinationPortField.setText(export.getDestinationPort());

        containersCountField.setText(String.valueOf(export.getContainersCount()));
        totalWeightField.setText(String.valueOf(export.getTotalWeight()));
        valueInEGPField.setText(String.valueOf(export.getValueInEGP()));
        totalFeesField.setText(String.valueOf(export.getTotalFees()));
        feePaidCheckbox.setSelected(export.isFeePaid());

        if (export.getCurrentStatus() != null)
            statusCombo.setValue(export.getCurrentStatus());
    }

    /**
     * Set the save handler function that will be called when saving
     */
    public void setSaveHandler(Function<ExportShipment, Boolean> handler) {
        this.saveHandler = handler;
    }

    @FXML
    private void save() {
        // Validate required fields
        if (shipmentNumberField.getText().isEmpty()) {
            showAlert("الرجاء إدخال رقم الشحنة");
            return;
        }

        // Update the export object with form values
        currentExport.setShipmentNumber(shipmentNumberField.getText().trim());
        currentExport.setUcrNumber(ucrNumberField.getText().trim());
        currentExport
                .setShippingMethod(shippingMethodCombo.getValue() != null ? shippingMethodCombo.getValue() : "sea");
        currentExport.setDestinationCountry(destinationCountryField.getText().trim());
        currentExport.setDestinationPort(destinationPortField.getText().trim());

        try {
            currentExport.setContainersCount(Integer.parseInt(containersCountField.getText().trim()));
        } catch (NumberFormatException e) {
            currentExport.setContainersCount(0);
        }

        try {
            currentExport.setTotalWeight(Double.parseDouble(totalWeightField.getText().trim()));
        } catch (NumberFormatException e) {
            currentExport.setTotalWeight(0.0);
        }

        try {
            currentExport.setValueInEGP(Double.parseDouble(valueInEGPField.getText().trim()));
        } catch (NumberFormatException e) {
            currentExport.setValueInEGP(0.0);
        }

        try {
            currentExport.setTotalFees(Double.parseDouble(totalFeesField.getText().trim()));
        } catch (NumberFormatException e) {
            currentExport.setTotalFees(0.0);
        }

        currentExport.setFeePaid(feePaidCheckbox.isSelected());
        currentExport.setCurrentStatus(statusCombo.getValue() != null ? statusCombo.getValue() : "pending");

        // Use save handler if provided
        if (saveHandler != null) {
            boolean success = saveHandler.apply(currentExport);
            if (success) {
                saved = true;
                closeWindow();
            }
            // If failed, popup stays open (handler shows error)
        } else {
            // Direct save to MongoDB
            boolean success = saveToMongo();
            if (success) {
                saved = true;
                closeWindow();
            }
        }
    }

    private boolean saveToMongo() {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("exportshipments");

            Document doc = new Document()
                    .append("shipmentNumber", currentExport.getShipmentNumber())
                    .append("ucrNumber", currentExport.getUcrNumber())
                    .append("shippingMethod", currentExport.getShippingMethod())
                    .append("destinationCountry", currentExport.getDestinationCountry())
                    .append("destinationPort", currentExport.getDestinationPort())
                    .append("containersCount", currentExport.getContainersCount())
                    .append("totalWeight", currentExport.getTotalWeight())
                    .append("valueInEGP", currentExport.getValueInEGP())
                    .append("totalFees", currentExport.getTotalFees())
                    .append("feePaid", currentExport.isFeePaid())
                    .append("currentStatus", currentExport.getCurrentStatus())
                    .append("updatedAt", new Date());

            if (currentExport.getId() == null || currentExport.getId().isEmpty()) {
                // INSERT NEW
                doc.append("userId", new ObjectId(currentExport.getUserId()));
                doc.append("createdAt", new Date());
                collection.insertOne(doc);
                System.out.println("✔ تم إضافة شحنة تصدير جديدة");
            } else {
                // UPDATE EXISTING
                collection.updateOne(
                        new Document("_id", new ObjectId(currentExport.getId())),
                        new Document("$set", doc));
                System.out.println("✔ تم تحديث شحنة التصدير: " + currentExport.getId());
            }
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("خطأ في حفظ البيانات: " + e.getMessage());
            return false;
        }
    }

    @FXML
    private void cancel() {
        saved = false;
        closeWindow();
    }

    private void closeWindow() {
        Stage stage = (Stage) shipmentNumberField.getScene().getWindow();
        stage.close();
    }

    public boolean isSaved() {
        return saved;
    }

    private void showAlert(String msg) {
        Alert alert = new Alert(Alert.AlertType.WARNING);
        alert.setHeaderText(null);
        alert.setContentText(msg);
        alert.showAndWait();
    }
}
