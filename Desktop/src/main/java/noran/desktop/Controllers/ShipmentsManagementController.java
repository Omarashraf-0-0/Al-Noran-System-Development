package noran.desktop.Controllers;

import org.bson.conversions.Bson;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.UnwindOptions;
import javafx.application.Platform;
import javafx.concurrent.Task;
import noran.desktop.AppSession;
import noran.desktop.Database.MongoConnection; // Your Mongo Class
import noran.desktop.models.Shipment;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.scene.layout.VBox;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ShipmentsManagementController {

    @FXML
    private TableView<Shipment> clientTable;

    // Updated columns based on your request
    @FXML
    private TableColumn<Shipment, String> colCustomerName;
    @FXML
    private TableColumn<Shipment, String> colAcid;
    @FXML
    private TableColumn<Shipment, String> colPortName;
    @FXML
    private TableColumn<Shipment, String> colCountry;
    @FXML
    private TableColumn<Shipment, String> colShipmentStatus;
    @FXML
    private TableColumn<Shipment, String> colAssignedTo;

    private final ObservableList<Shipment> shipments = FXCollections.observableArrayList();
    private FilteredList<Shipment> filteredData;

    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    // Stat card labels
    @FXML
    private Label totalShipmentsLabel;
    @FXML
    private Label inProgressLabel;
    @FXML
    private Label completedLabel;

    @FXML
    public void initialize() {
        // Setup Columns
        colCustomerName.setCellValueFactory(data -> data.getValue().customerNameProperty());
        colAcid.setCellValueFactory(data -> data.getValue().acidProperty());
        colPortName.setCellValueFactory(data -> data.getValue().portNameProperty());
        colCountry.setCellValueFactory(data -> data.getValue().countryProperty());
        colShipmentStatus.setCellValueFactory(data -> data.getValue().statusProperty());

        // Setup Assigned To column (visible for admin only)
        if (colAssignedTo != null) {
            colAssignedTo.setCellValueFactory(data -> data.getValue().assignedToNameProperty());
            User currentUser = AppSession.getInstance().getCurrentUser();
            boolean isAdmin = currentUser != null && currentUser.isAdmin();
            colAssignedTo.setVisible(isAdmin);
        }

        // Setup Sorting and Filtering
        filteredData = new FilteredList<>(shipments, p -> true);
        SortedList<Shipment> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(clientTable.comparatorProperty());
        clientTable.setItems(sortedData);

        // Make columns fill the table width evenly
        clientTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);

        // Load Data directly from MongoDB
        loadShipmentsFromMongo();

        if (sidebarController != null)
            sidebarController.setActivePage("shipments");
        setupTopBar();
    }

    public void loadShipmentsFromMongo() {
        // Show loading indicator
        clientTable.setPlaceholder(new javafx.scene.control.Label("جاري تحميل البيانات..."));

        // Create a background task to fetch data so UI doesn't freeze
        Task<List<Shipment>> fetchDataTask = new Task<>() {
            @Override
            protected List<Shipment> call() {
                List<Shipment> loadedList = new ArrayList<>();

                try {
                    MongoDatabase db = MongoConnection.getDatabase();
                    MongoCollection<Document> collection = db.getCollection("shipments");

                    // Get current user info for filtering
                    User currentUser = AppSession.getInstance().getCurrentUser();
                    String currentUserId = currentUser != null ? currentUser.getId() : "";
                    boolean isAdmin = currentUser != null && currentUser.isAdmin();

                    // Build aggregation pipeline
                    List<Bson> pipelineStages = new ArrayList<>();

                    // Filter by employee_id for non-admin users
                    if (!isAdmin && !currentUserId.isEmpty()) {
                        pipelineStages.add(Aggregates.match(
                                com.mongodb.client.model.Filters.eq("employee_id", new ObjectId(currentUserId))));
                    }

                    // Join shipments.user_id == users._id to get Customer Name
                    pipelineStages.add(Aggregates.lookup("users", "user_id", "_id", "userDetails"));
                    pipelineStages.add(
                            Aggregates.unwind("$userDetails", new UnwindOptions().preserveNullAndEmptyArrays(true)));

                    // For admin: also lookup assigned employee name
                    if (isAdmin) {
                        pipelineStages.add(Aggregates.lookup("users", "employee_id", "_id", "assignedDetails"));
                        pipelineStages.add(Aggregates.unwind("$assignedDetails",
                                new UnwindOptions().preserveNullAndEmptyArrays(true)));
                    }

                    for (Document doc : collection.aggregate(pipelineStages)) {
                        // 1. Extract Shipment ID
                        String id = doc.getObjectId("_id").toString();

                        // 2. Extract User ID
                        String userId = "";
                        if (doc.get("user_id") != null) {
                            userId = doc.getObjectId("user_id").toString();
                        }

                        // 3. Extract Customer Name
                        String customerName = "Unknown";
                        Document userDetails = (Document) doc.get("userDetails");
                        if (userDetails != null && userDetails.getString("fullname") != null) {
                            customerName = userDetails.getString("fullname");
                        }

                        // 4. Extract other fields
                        String acid = doc.getString("acid") != null ? doc.getString("acid") : "";
                        String portName = doc.getString("port_name") != null ? doc.getString("port_name") : "";
                        String country = doc.getString("country") != null ? doc.getString("country") : "";
                        String status = doc.getString("status") != null ? doc.getString("status") : "Pending";
                        int containers = doc.getInteger("num_of_containers", 0);
                        String policy = doc.getString("policy") != null ? doc.getString("policy") : "";

                        // 5. Extract assigned employee name (for admin)
                        String assignedToName = "";
                        if (isAdmin) {
                            Document assignedDetails = (Document) doc.get("assignedDetails");
                            if (assignedDetails != null && assignedDetails.getString("fullname") != null) {
                                assignedToName = assignedDetails.getString("fullname");
                            }
                        }

                        loadedList.add(new Shipment(id, userId, customerName, acid, portName, country, status,
                                containers, policy, assignedToName));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    Platform.runLater(() -> showAlert("Error connecting to MongoDB: " + e.getMessage()));
                }
                return loadedList;
            }
        };

        // When task finishes successfully
        fetchDataTask.setOnSucceeded(event -> {
            shipments.setAll(fetchDataTask.getValue());
            if (shipments.isEmpty()) {
                clientTable.setPlaceholder(new javafx.scene.control.Label("لا توجد بيانات"));
            }
            // Update stat cards
            updateShipmentStats();
        });

        fetchDataTask.setOnFailed(event -> {
            clientTable.setPlaceholder(new javafx.scene.control.Label("خطأ في تحميل البيانات"));
        });

        // Run the task
        new Thread(fetchDataTask).start();
    }

    /**
     * Update the stat card labels based on current shipments data
     */
    private void updateShipmentStats() {
        int total = shipments.size();
        int completed = 0;
        int inProgress = 0;

        for (Shipment s : shipments) {
            String status = s.getStatus();
            if (status != null && (status.contains("تم التسليم") || status.equalsIgnoreCase("Delivered"))) {
                completed++;
            } else {
                inProgress++;
            }
        }

        if (totalShipmentsLabel != null) {
            totalShipmentsLabel.setText(String.valueOf(total));
        }
        if (inProgressLabel != null) {
            inProgressLabel.setText(String.valueOf(inProgress));
        }
        if (completedLabel != null) {
            completedLabel.setText(String.valueOf(completed));
        }
    } // --- OTHER METHODS (Add/Edit/Delete) ---
      // You should update these to use MongoConnection directly instead of
      // RestMongoSyncClient later

    @FXML
    public void deleteShipment(ActionEvent event) {
        Shipment selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select a shipment to delete.");
            return;
        }

        // Direct Delete Logic (Optional - replacing your sync client)
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            db.getCollection("shipments").deleteOne(new Document("_id", new ObjectId(selected.getId())));
            shipments.remove(selected);
            System.out.println("Deleted from MongoDB");
        } catch (Exception e) {
            showAlert("Failed to delete: " + e.getMessage());
        }
    }

    // ... Keep your Edit, OpenPopup, Navigation, and SetupTopBar methods ...
    // Note: In editShipment, ensure you pass the new fields correctly.

    private void showAlert(String msg) {
        noran.desktop.Utils.AlertUtils.showInfo("تنبيه", msg);
    }

    // --- NAVIGATION HELPERS (Kept same) ---
    private void setupTopBar() {
        if (topBarController != null) {
            topBarController.setPageTitle("إدارة شحنات الاستيراد");
            topBarController.setSidebar(sidebar);
            topBarController.setSearchPlaceholder("البحث بالميناء، اسم العميل، أو ACID...");
            // Search Logic
            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(shipment -> {
                    if (searchText == null || searchText.isEmpty())
                        return true;
                    String lower = searchText.toLowerCase();
                    // Search by Port OR Customer Name OR ACID
                    return (shipment.getPortName() != null && shipment.getPortName().toLowerCase().contains(lower)) ||
                            (shipment.getCustomerName() != null
                                    && shipment.getCustomerName().toLowerCase().contains(lower))
                            ||
                            (shipment.getAcid() != null && shipment.getAcid().toLowerCase().contains(lower));
                });
            });
        }
    }
    // Inside ShipmentsManagementController.java

    @FXML
    public void editShipment(ActionEvent event) {
        Shipment selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select a shipment to edit.");
            return;
        }
        // Pass the actual object (or a clone if you prefer)
        openShipmentPopup(selected);
    }

    // For ADDING a new shipment (Connect this to your Add Button)
    @FXML
    public void addShipment(ActionEvent event) {
        // Create an empty dummy shipment
        Shipment newShipment = new Shipment(null, "", "", "", "", "", "Pending", 0, "");
        openShipmentPopup(newShipment);
    }

    private void openShipmentPopup(Shipment shipment) {
        try {
            // Load full document from MongoDB for this shipment
            Document fullDoc = getFullShipmentDocument(shipment.getId());

            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/import-shipment-popup.fxml"));
            Parent root = loader.load();

            ImportShipmentPopupController popupController = loader.getController();
            popupController.loadShipment(shipment, fullDoc);
            popupController.setSaveHandler(this::saveImportShipmentToMongo);

            Stage stage = new Stage();
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.getIcons().add(
                    new javafx.scene.image.Image(getClass().getResourceAsStream("/noran/desktop/images/Logo.png")));
            stage.setScene(new Scene(root, 420, 700));
            stage.setTitle("تعديل شحنة الاستيراد");
            stage.showAndWait();

            if (popupController.isSaved()) {
                loadShipmentsFromMongo(); // Refresh Table
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private Document getFullShipmentDocument(String shipmentId) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("shipments");
            return collection.find(new Document("_id", new ObjectId(shipmentId))).first();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private boolean saveImportShipmentToMongo(Document doc) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("shipments");

            String id = doc.getString("_id");
            doc.remove("_id");
            doc.remove("user_id");
            doc.remove("employee_id");

            if (id != null && !id.isEmpty()) {
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

    private void saveShipmentToMongo(Shipment s) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("shipments");

            Document doc = new Document()
                    .append("user_id", new ObjectId(s.getUserId())) // Link to User
                    .append("acid", s.getAcid())
                    .append("port_name", s.getPortName())
                    .append("country", s.getCountry())
                    .append("num_of_containers", s.getNumOfContainers())
                    .append("status", s.getStatus())
                    .append("policy", s.getPolicy())
                    .append("updatedAt", new java.util.Date());

            if (s.getId() == null || s.getId().isEmpty()) {
                // INSERT NEW
                doc.append("createdAt", new java.util.Date());
                collection.insertOne(doc);
                System.out.println("Inserted new shipment");
            } else {
                // UPDATE EXISTING
                collection.updateOne(
                        new Document("_id", new ObjectId(s.getId())),
                        new Document("$set", doc));
                System.out.println("Updated shipment: " + s.getId());
            }
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error saving to database: " + e.getMessage());
        }
    }

    // Navigation methods...
    @FXML
    public void onDashboardClick(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/dashboard.fxml");
    }

    @FXML
    public void onInvoiceManagementClick(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/client-data-invoice.fxml");
    }

    @FXML
    public void client_management_btn_handle(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/client-data.fxml");
    }

    @FXML
    public void employee_management_btn_handle(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/employee-management.fxml");
    }

    private void navigate(ActionEvent event, String fxmlPath) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.getScene().setRoot(root);
    }

    @FXML
    public void refresh(ActionEvent e) {
        loadShipmentsFromMongo();
    }
}