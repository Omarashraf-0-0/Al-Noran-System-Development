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
    @FXML
    private TableColumn<ExportShipment, String> colAssignedTo;

    private final ObservableList<ExportShipment> exports = FXCollections.observableArrayList();
    private FilteredList<ExportShipment> filteredData;

    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    // Stat card labels
    @FXML
    private Label totalExportsLabel;
    @FXML
    private Label inProgressExportsLabel;
    @FXML
    private Label completedExportsLabel;

    @FXML
    public void initialize() {
        // Setup Columns
        colCustomerName.setCellValueFactory(data -> data.getValue().customerNameProperty());
        colShipmentNumber.setCellValueFactory(data -> data.getValue().shipmentNumberProperty());
        colUcrNumber.setCellValueFactory(data -> data.getValue().ucrNumberProperty());
        colDestinationCountry.setCellValueFactory(data -> data.getValue().destinationCountryProperty());
        colDestinationPort.setCellValueFactory(data -> data.getValue().destinationPortProperty());
        colStatus.setCellValueFactory(data -> data.getValue().currentStatusProperty());

        // Setup Assigned To column (visible for admin only)
        if (colAssignedTo != null) {
            colAssignedTo.setCellValueFactory(data -> data.getValue().assignedToNameProperty());
            User currentUser = AppSession.getInstance().getCurrentUser();
            boolean isAdmin = currentUser != null && currentUser.isAdmin();
            colAssignedTo.setVisible(isAdmin);
        }

        // Setup Sorting and Filtering
        filteredData = new FilteredList<>(exports, p -> true);
        SortedList<ExportShipment> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(exportsTable.comparatorProperty());
        exportsTable.setItems(sortedData);

        // Make columns fill the table width evenly
        exportsTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);

        // Load Data from MongoDB
        loadExportsFromMongo();

        if (sidebarController != null)
            sidebarController.setActivePage("exports");
        setupTopBar();
    }

    public void loadExportsFromMongo() {
        // Show loading indicator
        exportsTable.setPlaceholder(new javafx.scene.control.Label("جاري تحميل البيانات..."));

        Task<List<ExportShipment>> fetchDataTask = new Task<>() {
            @Override
            protected List<ExportShipment> call() {
                List<ExportShipment> loadedList = new ArrayList<>();

                try {
                    MongoDatabase db = MongoConnection.getDatabase();
                    MongoCollection<Document> collection = db.getCollection("exportshipments");

                    // Get current user info for filtering
                    User currentUser = AppSession.getInstance().getCurrentUser();
                    String currentUserId = currentUser != null ? currentUser.getId() : "";
                    boolean isAdmin = currentUser != null && currentUser.isAdmin();

                    // Build aggregation pipeline
                    List<Bson> pipelineStages = new ArrayList<>();

                    // Filter by assignedEmployee for non-admin users
                    if (!isAdmin && !currentUserId.isEmpty()) {
                        pipelineStages.add(Aggregates.match(
                                com.mongodb.client.model.Filters.eq("assignedEmployee", new ObjectId(currentUserId))));
                    }

                    // Join exportshipments.userId == users._id to get Customer Name
                    pipelineStages.add(Aggregates.lookup("users", "userId", "_id", "userDetails"));
                    pipelineStages.add(
                            Aggregates.unwind("$userDetails", new UnwindOptions().preserveNullAndEmptyArrays(true)));

                    // For admin: also lookup assigned employee name
                    if (isAdmin) {
                        pipelineStages.add(Aggregates.lookup("users", "assignedEmployee", "_id", "assignedDetails"));
                        pipelineStages.add(Aggregates.unwind("$assignedDetails",
                                new UnwindOptions().preserveNullAndEmptyArrays(true)));
                    }

                    for (Document doc : collection.aggregate(pipelineStages)) {

                        // Extract Shipment ID
                        String id = doc.getObjectId("_id").toString();

                        // Extract User ID
                        String userId = "";
                        Object userIdObj = doc.get("userId");
                        if (userIdObj != null) {
                            if (userIdObj instanceof ObjectId) {
                                userId = ((ObjectId) userIdObj).toString();
                            } else {
                                userId = userIdObj.toString();
                            }
                        }

                        // Extract Customer Name from joined data
                        String customerName = "";
                        Document userDetails = doc.get("userDetails", Document.class);
                        if (userDetails != null) {
                            customerName = userDetails.getString("username");
                            if (customerName == null || customerName.isEmpty()) {
                                customerName = userDetails.getString("name");
                            }
                        }

                        // Extract other fields with null-safety
                        String shipmentNumber = doc.getString("shipmentNumber");
                        String ucrNumber = doc.getString("ucrNumber");
                        String destinationCountry = doc.getString("destinationCountry");
                        String destinationPort = doc.getString("destinationPort");
                        String shippingMethod = doc.getString("shippingMethod");
                        String currentStatus = doc.getString("currentStatus");
                        int containersCount = doc.getInteger("containersCount", 0);
                        double totalWeight = getDoubleValue(doc, "totalWeight");
                        double valueInEGP = getDoubleValue(doc, "valueInEGP");
                        double totalFees = getDoubleValue(doc, "totalFees");
                        boolean feePaid = doc.getBoolean("feePaid", false);

                        // Extract assigned employee name (for admin)
                        String assignedToName = "";
                        if (isAdmin) {
                            Document assignedDetails = doc.get("assignedDetails", Document.class);
                            if (assignedDetails != null) {
                                assignedToName = assignedDetails.getString("fullname");
                                if (assignedToName == null) {
                                    assignedToName = assignedDetails.getString("username");
                                }
                            }
                        }

                        loadedList.add(new ExportShipment(id, userId, customerName, shipmentNumber, ucrNumber,
                                destinationCountry, destinationPort, shippingMethod, currentStatus,
                                containersCount, totalWeight, valueInEGP, totalFees, feePaid, assignedToName));
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
            // Reset placeholder to default when data is loaded
            if (exports.isEmpty()) {
                exportsTable.setPlaceholder(new javafx.scene.control.Label("لا توجد بيانات"));
            }
            // Update stat cards
            updateExportStats();
        });

        fetchDataTask.setOnFailed(event -> {
            exportsTable.setPlaceholder(new javafx.scene.control.Label("خطأ في تحميل البيانات"));
        });

        new Thread(fetchDataTask).start();
    }

    /**
     * Update the stat card labels based on current exports data
     */
    private void updateExportStats() {
        int total = exports.size();
        int completed = 0;
        int inProgress = 0;

        for (ExportShipment e : exports) {
            String status = e.getCurrentStatus();
            if (status != null && (status.contains("تم التسليم") || status.equalsIgnoreCase("Delivered"))) {
                completed++;
            } else {
                inProgress++;
            }
        }

        if (totalExportsLabel != null) {
            totalExportsLabel.setText(String.valueOf(total));
        }
        if (inProgressExportsLabel != null) {
            inProgressExportsLabel.setText(String.valueOf(inProgress));
        }
        if (completedExportsLabel != null) {
            completedExportsLabel.setText(String.valueOf(completed));
        }
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
            stage.setScene(new javafx.scene.Scene(root, 560, 750));
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
            topBarController.setSearchPlaceholder("البحث باسم العميل، رقم الشحنة، UCR، أو الدولة...");
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
