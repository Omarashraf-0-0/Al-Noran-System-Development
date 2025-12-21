package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.stage.Stage;
import noran.desktop.Database.MongoConnection;
import noran.desktop.models.Shipment;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.Date;
import java.util.function.Function;

public class ImportShipmentPopupController {

    @FXML
    private TextField acidField;
    @FXML
    private TextField policyField;
    @FXML
    private TextField number46Field;
    @FXML
    private TextField containersField;
    @FXML
    private TextField portField;
    @FXML
    private TextField countryField;
    @FXML
    private TextField importerNameField;
    @FXML
    private TextField employerNameField;
    @FXML
    private TextField shipmentDescriptionField;
    @FXML
    private TextField clearanceFeesField;
    @FXML
    private TextField expensesField;
    @FXML
    private TextField sundriesField;
    @FXML
    private ComboBox<String> statusCombo;
    @FXML
    private CheckBox dragtCheckbox;
    @FXML
    private CheckBox isInvoicedCheckbox;

    private Shipment currentShipment;
    private boolean saved = false;
    private Function<Document, Boolean> saveHandler;

    // Additional fields from MongoDB that we need to track
    private String shipmentId;
    private String userId;
    private String employeeId;

    /**
     * Load an existing import shipment into the form for editing
     */
    public void loadShipment(Shipment shipment, Document fullDoc) {
        this.currentShipment = shipment;
        this.shipmentId = shipment.getId();
        this.userId = shipment.getUserId();

        // Load basic fields from Shipment object
        if (shipment.getAcid() != null)
            acidField.setText(shipment.getAcid());
        if (shipment.getPolicy() != null)
            policyField.setText(shipment.getPolicy());
        if (shipment.getPortName() != null)
            portField.setText(shipment.getPortName());
        if (shipment.getCountry() != null)
            countryField.setText(shipment.getCountry());

        containersField.setText(String.valueOf(shipment.getNumOfContainers()));

        if (shipment.getStatus() != null)
            statusCombo.setValue(shipment.getStatus());

        // Load additional fields from full document
        if (fullDoc != null) {
            if (fullDoc.getString("number46") != null)
                number46Field.setText(fullDoc.getString("number46"));
            if (fullDoc.getString("importerName") != null)
                importerNameField.setText(fullDoc.getString("importerName"));
            if (fullDoc.getString("employerName") != null)
                employerNameField.setText(fullDoc.getString("employerName"));
            if (fullDoc.getString("shipmentDescription") != null)
                shipmentDescriptionField.setText(fullDoc.getString("shipmentDescription"));

            clearanceFeesField.setText(String.valueOf(getDoubleValue(fullDoc, "clearance_fees")));
            expensesField.setText(String.valueOf(getDoubleValue(fullDoc, "expenses_and_tips")));
            sundriesField.setText(String.valueOf(getDoubleValue(fullDoc, "sundries")));

            dragtCheckbox.setSelected(fullDoc.getBoolean("dragt", false));
            isInvoicedCheckbox.setSelected(fullDoc.getBoolean("is_invoiced", false));

            if (fullDoc.get("employee_id") != null) {
                employeeId = fullDoc.getObjectId("employee_id").toString();
            }
        }
    }

    /**
     * Set the save handler function that will be called when saving
     */
    public void setSaveHandler(Function<Document, Boolean> handler) {
        this.saveHandler = handler;
    }

    @FXML
    private void save() {
        // Validate required fields
        if (acidField.getText().isEmpty()) {
            showAlert("الرجاء إدخال رقم ACID");
            return;
        }

        // Build the document with all fields
        Document doc = new Document()
                .append("acid", acidField.getText().trim())
                .append("policy", policyField.getText().trim())
                .append("number46", number46Field.getText().trim())
                .append("port_name", portField.getText().trim())
                .append("country", countryField.getText().trim())
                .append("importerName", importerNameField.getText().trim())
                .append("employerName", employerNameField.getText().trim())
                .append("shipmentDescription", shipmentDescriptionField.getText().trim())
                .append("status", statusCombo.getValue() != null ? statusCombo.getValue() : "في انتظار الشحن")
                .append("dragt", dragtCheckbox.isSelected())
                .append("is_invoiced", isInvoicedCheckbox.isSelected())
                .append("updatedAt", new Date());

        // Parse numeric fields
        try {
            doc.append("num_of_containers", Integer.parseInt(containersField.getText().trim()));
        } catch (NumberFormatException e) {
            doc.append("num_of_containers", 0);
        }

        try {
            doc.append("clearance_fees", Double.parseDouble(clearanceFeesField.getText().trim()));
        } catch (NumberFormatException e) {
            doc.append("clearance_fees", 0.0);
        }

        try {
            doc.append("expenses_and_tips", Double.parseDouble(expensesField.getText().trim()));
        } catch (NumberFormatException e) {
            doc.append("expenses_and_tips", 0.0);
        }

        try {
            doc.append("sundries", Double.parseDouble(sundriesField.getText().trim()));
        } catch (NumberFormatException e) {
            doc.append("sundries", 0.0);
        }

        // Add IDs
        doc.append("_id", shipmentId);
        doc.append("user_id", userId);
        if (employeeId != null && !employeeId.isEmpty()) {
            doc.append("employee_id", employeeId);
        }

        // Use save handler if provided
        if (saveHandler != null) {
            boolean success = saveHandler.apply(doc);
            if (success) {
                saved = true;
                closeWindow();
            }
        } else {
            // Direct save to MongoDB
            boolean success = saveToMongo(doc);
            if (success) {
                saved = true;
                closeWindow();
            }
        }
    }

    private boolean saveToMongo(Document doc) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("shipments");

            String id = doc.getString("_id");
            doc.remove("_id"); // Remove _id from update document

            if (id == null || id.isEmpty()) {
                // INSERT NEW
                if (userId != null && !userId.isEmpty()) {
                    doc.append("user_id", new ObjectId(userId));
                }
                doc.append("createdAt", new Date());
                collection.insertOne(doc);
                System.out.println("✔ تم إضافة شحنة استيراد جديدة");
            } else {
                // UPDATE EXISTING
                collection.updateOne(
                        new Document("_id", new ObjectId(id)),
                        new Document("$set", doc));
                System.out.println("✔ تم تحديث شحنة الاستيراد: " + id);
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
        Stage stage = (Stage) acidField.getScene().getWindow();
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

    private double getDoubleValue(Document doc, String field) {
        Object value = doc.get(field);
        if (value == null)
            return 0.0;
        if (value instanceof Double)
            return (Double) value;
        if (value instanceof Integer)
            return ((Integer) value).doubleValue();
        if (value instanceof Long)
            return ((Long) value).doubleValue();
        if (value instanceof Number)
            return ((Number) value).doubleValue();
        return 0.0;
    }
}
