package noran.desktop.Controllers;

import org.bson.conversions.Bson;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.UnwindOptions;
import javafx.application.Platform;
import javafx.concurrent.Task;
import noran.desktop.AppSession;
import noran.desktop.Database.MongoConnection;
import noran.desktop.models.ExportShipment;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ExportShipmentsController {

    @FXML
    private TableView<ExportShipment> exportsTable;

    @FXML
    private TableColumn<ExportShipment, String> colCustomerName;
    @FXML
    private TableColumn<ExportShipment, String> colShipmentNumber;
    @FXML
    private TableColumn<ExportShipment, String> colUcrNumber;
    @FXML
    private TableColumn<ExportShipment, String> colDestinationCountry;
    @FXML
    private TableColumn<ExportShipment, String> colDestinationPort;
    @FXML
    private TableColumn<ExportShipment, String> colStatus;

    private final ObservableList<ExportShipment> exports = FXCollections.observableArrayList();
    private FilteredList<ExportShipment> filteredData;

    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    @FXML
    public void initialize() {
        // Setup Columns
        colCustomerName.setCellValueFactory(data -> data.getValue().customerNameProperty());
        colShipmentNumber.setCellValueFactory(data -> data.getValue().shipmentNumberProperty());
        colUcrNumber.setCellValueFactory(data -> data.getValue().ucrNumberProperty());
        colDestinationCountry.setCellValueFactory(data -> data.getValue().destinationCountryProperty());
        colDestinationPort.setCellValueFactory(data -> data.getValue().destinationPortProperty());
        colStatus.setCellValueFactory(data -> data.getValue().currentStatusProperty());

        // Setup Sorting and Filtering
        filteredData = new FilteredList<>(exports, p -> true);
        SortedList<ExportShipment> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(exportsTable.comparatorProperty());
        exportsTable.setItems(sortedData);

        // Load Data from MongoDB
        loadExportsFromMongo();

        if (sidebarController != null)
            sidebarController.setActivePage("exports");
        setupTopBar();
    }

    public void loadExportsFromMongo() {
        Task<List<ExportShipment>> fetchDataTask = new Task<>() {
            @Override
            protected List<ExportShipment> call() {
                List<ExportShipment> loadedList = new ArrayList<>();

                try {
                    MongoDatabase db = MongoConnection.getDatabase();
                    MongoCollection<Document> collection = db.getCollection("exportshipments");

                    // Join exportshipments.userId == users._id to get Customer Name
                    List<Bson> pipeline = Arrays.asList(
                            Aggregates.lookup("users", "userId", "_id", "userDetails"),
                            Aggregates.unwind("$userDetails", new UnwindOptions().preserveNullAndEmptyArrays(true)));

                    for (Document doc : collection.aggregate(pipeline)) {

                        // Extract Shipment ID
                        String id = doc.getObjectId("_id").toString();

                        // Extract User ID
                        String userId = "";
                        if (doc.get("userId") != null) {
                            userId = doc.getObjectId("userId").toString();
                        }

                        // Extract Customer Name
                        String customerName = "غير معروف";
                        Document userDetails = (Document) doc.get("userDetails");
                        if (userDetails != null && userDetails.getString("fullname") != null) {
                            customerName = userDetails.getString("fullname");
                        }

                        // Extract fields
                        String shipmentNumber = doc.getString("shipmentNumber") != null
                                ? doc.getString("shipmentNumber")
                                : "";
                        String ucrNumber = doc.getString("ucrNumber") != null ? doc.getString("ucrNumber") : "";
                        String destinationCountry = doc.getString("destinationCountry") != null
                                ? doc.getString("destinationCountry")
                                : "";
                        String destinationPort = doc.getString("destinationPort") != null
                                ? doc.getString("destinationPort")
                                : "";
                        String shippingMethod = doc.getString("shippingMethod") != null
                                ? doc.getString("shippingMethod")
                                : "";
                        String currentStatus = doc.getString("currentStatus") != null ? doc.getString("currentStatus")
                                : "pending";
                        int containersCount = doc.getInteger("containersCount", 0);
                        double totalWeight = getDoubleValue(doc, "totalWeight");
                        double valueInEGP = getDoubleValue(doc, "valueInEGP");
                        double totalFees = getDoubleValue(doc, "totalFees");
                        boolean feePaid = doc.getBoolean("feePaid", false);

                        loadedList.add(new ExportShipment(id, userId, customerName, shipmentNumber, ucrNumber,
                                destinationCountry, destinationPort, shippingMethod, currentStatus,
                                containersCount, totalWeight, valueInEGP, totalFees, feePaid));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    Platform.runLater(() -> showAlert("خطأ في الاتصال بقاعدة البيانات: " + e.getMessage()));
                }
                return loadedList;
            }
        };

        fetchDataTask.setOnSucceeded(event -> {
            exports.setAll(fetchDataTask.getValue());
        });

        new Thread(fetchDataTask).start();
    }

    @FXML
    public void editExport(ActionEvent event) {
        ExportShipment selected = exportsTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("الرجاء تحديد شحنة للتعديل.");
            return;
        }
        openExportPopup(selected);
    }

    private void openExportPopup(ExportShipment export) {
        try {
            javafx.fxml.FXMLLoader loader = new javafx.fxml.FXMLLoader(
                    getClass().getResource("/noran/desktop/export-shipment-popup.fxml"));
            javafx.scene.Parent root = loader.load();

            ExportShipmentPopupController popupController = loader.getController();
            popupController.loadExport(export);
            popupController.setSaveHandler(this::saveExportToMongo);

            javafx.stage.Stage stage = new javafx.stage.Stage();
            stage.initModality(javafx.stage.Modality.APPLICATION_MODAL);
            stage.getIcons().add(
                    new javafx.scene.image.Image(getClass().getResourceAsStream("/noran/desktop/images/Logo.png")));
            stage.setScene(new javafx.scene.Scene(root, 420, 650));
            stage.setTitle(
                    export.getId() == null || export.getId().isEmpty() ? "إضافة شحنة تصدير" : "تعديل شحنة التصدير");
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("خطأ في فتح النافذة: " + e.getMessage());
        }
    }

    private boolean saveExportToMongo(ExportShipment export) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("exportshipments");

            Document doc = new Document()
                    .append("shipmentNumber", export.getShipmentNumber())
                    .append("ucrNumber", export.getUcrNumber())
                    .append("shippingMethod", export.getShippingMethod())
                    .append("destinationCountry", export.getDestinationCountry())
                    .append("destinationPort", export.getDestinationPort())
                    .append("containersCount", export.getContainersCount())
                    .append("totalWeight", export.getTotalWeight())
                    .append("valueInEGP", export.getValueInEGP())
                    .append("totalFees", export.getTotalFees())
                    .append("feePaid", export.isFeePaid())
                    .append("currentStatus", export.getCurrentStatus())
                    .append("updatedAt", new java.util.Date());

            if (export.getId() == null || export.getId().isEmpty()) {
                // INSERT NEW
                if (export.getUserId() != null && !export.getUserId().isEmpty()) {
                    doc.append("userId", new ObjectId(export.getUserId()));
                }
                doc.append("createdAt", new java.util.Date());
                collection.insertOne(doc);
                System.out.println("✔ تم إضافة شحنة تصدير جديدة");
            } else {
                // UPDATE EXISTING
                collection.updateOne(
                        new Document("_id", new ObjectId(export.getId())),
                        new Document("$set", doc));
                System.out.println("✔ تم تحديث شحنة التصدير: " + export.getId());
            }

            loadExportsFromMongo(); // Refresh table
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("خطأ في حفظ البيانات: " + e.getMessage());
            return false;
        }
    }

    @FXML
    public void deleteExport(ActionEvent event) {
        ExportShipment selected = exportsTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("الرجاء تحديد شحنة للحذف.");
            return;
        }

        try {
            MongoDatabase db = MongoConnection.getDatabase();
            db.getCollection("exportshipments").deleteOne(new Document("_id", new ObjectId(selected.getId())));
            exports.remove(selected);
            System.out.println("✔ تم حذف شحنة التصدير: " + selected.getId());
        } catch (Exception e) {
            showAlert("فشل الحذف: " + e.getMessage());
        }
    }

    @FXML
    public void refresh(ActionEvent event) {
        loadExportsFromMongo();
    }

    private void showAlert(String msg) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setHeaderText(null);
        alert.setContentText(msg);
        alert.showAndWait();
    }

    /**
     * Safely extract a double value from a MongoDB Document.
     * Handles both Integer and Double types stored in MongoDB.
     */
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

    private void setupTopBar() {
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {
            topBarController.setPageTitle("إدارة شحنات التصدير");
            topBarController.setSidebar(sidebar);
            if (currentUser != null) {
                topBarController.setUserData(currentUser.getName(),
                        currentUser.getEmail() != null ? currentUser.getEmail() : "");
            }

            // Search Logic
            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(export -> {
                    if (searchText == null || searchText.isEmpty())
                        return true;
                    String lower = searchText.toLowerCase();
                    return (export.getCustomerName() != null && export.getCustomerName().toLowerCase().contains(lower))
                            ||
                            (export.getShipmentNumber() != null
                                    && export.getShipmentNumber().toLowerCase().contains(lower))
                            ||
                            (export.getUcrNumber() != null && export.getUcrNumber().toLowerCase().contains(lower)) ||
                            (export.getDestinationCountry() != null
                                    && export.getDestinationCountry().toLowerCase().contains(lower));
                });
            });
        }
    }
}
