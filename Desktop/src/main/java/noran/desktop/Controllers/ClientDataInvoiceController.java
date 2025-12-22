package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.stage.Stage;
import javafx.scene.layout.VBox;
import noran.desktop.AppSession;
import noran.desktop.Database.MongoConnection;
import noran.desktop.HelloController;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.io.IOException;
import java.net.URL;
import java.util.*;
import java.util.stream.Collectors;

public class ClientDataInvoiceController implements Initializable {

    // Button removed

    // Table Setup
    @FXML
    private TableView<UserRow> invoicesTable;
    @FXML
    private TableColumn<UserRow, String> colClientName;
    @FXML
    private TableColumn<UserRow, String> colClientNumber;
    @FXML
    private TableColumn<UserRow, String> colClientType;
    @FXML
    private TableColumn<UserRow, String> colClientRank;

    // --- Data Lists ---
    private final ObservableList<UserRow> userList = FXCollections.observableArrayList();
    private FilteredList<UserRow> filteredData;

    // --- Injected Controllers ---
    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // 1. Setup Table Columns
        colClientName.setCellValueFactory(data -> data.getValue().usernameProperty());
        colClientNumber.setCellValueFactory(data -> data.getValue().shipmentCountProperty());
        colClientType.setCellValueFactory(data -> data.getValue().clientTypeProperty());
        colClientRank.setCellValueFactory(data -> data.getValue().rankProperty());

        // Make columns fill the table width
        invoicesTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);

        // 2. Setup Search/Filter
        filteredData = new FilteredList<>(userList, p -> true);
        SortedList<UserRow> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(invoicesTable.comparatorProperty());
        invoicesTable.setItems(sortedData);

        // 3. Load Data from MongoDB
        loadUsersWithShipments();

        // 4. Setup UI Components
        if (sidebarController != null)
            sidebarController.setActivePage("invoices");
        setupTopBar();

        // 5. Double-click Action
        invoicesTable.setOnMouseClicked(event -> {
            if (event.getClickCount() == 2) {
                UserRow selected = invoicesTable.getSelectionModel().getSelectedItem();
                if (selected != null) {
                    openInvoiceManagement(selected);
                }
            }
        });
    }

    private void setupTopBar() {
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {
            topBarController.setPageTitle("إدارة الفواتير");
            topBarController.setSidebar(sidebar);
            topBarController.setSearchPlaceholder("البحث باسم العميل أو الرقم الضريبي...");
            if (currentUser != null) {
                topBarController.setUserData(currentUser.getName(),
                        currentUser.getEmail() != null ? currentUser.getEmail() : "");
            }

            // Dynamic Search
            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(user -> {
                    if (searchText == null || searchText.isEmpty())
                        return true;
                    String lower = searchText.toLowerCase();
                    return (user.getUsername() != null && user.getUsername().toLowerCase().contains(lower)) ||
                            (user.getClientType() != null && user.getClientType().toLowerCase().contains(lower));
                });
            });
        }
    }

    // ✅ LOAD LOGIC: Only get users who actually have shipments (ASYNC)
    private void loadUsersWithShipments() {
        // Show loading indicator
        invoicesTable.setPlaceholder(new Label("جاري تحميل البيانات..."));
        userList.clear();

        javafx.concurrent.Task<List<UserRow>> loadTask = new javafx.concurrent.Task<>() {
            @Override
            protected List<UserRow> call() {
                List<UserRow> loadedList = new ArrayList<>();
                try {
                    MongoDatabase db = MongoConnection.getDatabase();
                    MongoCollection<Document> shipmentsCol = db.getCollection("shipments");
                    MongoCollection<Document> usersCol = db.getCollection("users");

                    // OPTIMIZED: Use aggregation to count shipments per user in ONE query
                    Map<ObjectId, Long> shipmentCountMap = new HashMap<>();

                    // Aggregation pipeline: group by user_id and count
                    List<Document> pipeline = new ArrayList<>();
                    pipeline.add(new Document("$group", new Document("_id", "$user_id")
                            .append("count", new Document("$sum", 1))));

                    for (Document result : shipmentsCol.aggregate(pipeline)) {
                        ObjectId userId = result.getObjectId("_id");
                        Long count = 0L;

                        // Handle potential mixed types for count
                        Object countObj = result.get("count");
                        if (countObj instanceof Number) {
                            count = ((Number) countObj).longValue();
                        }

                        if (userId != null) {
                            shipmentCountMap.put(userId, count);
                        }
                    }

                    if (shipmentCountMap.isEmpty()) {
                        return loadedList;
                    }

                    // 2. Find User details ONLY for users with shipments
                    // Get Set of IDs
                    List<ObjectId> userIds = new ArrayList<>(shipmentCountMap.keySet());

                    List<Document> usersFound = usersCol.find(
                            Filters.and(
                                    Filters.in("_id", userIds),
                                    Filters.eq("active", true)))
                            .into(new ArrayList<>());

                    for (Document doc : usersFound) {
                        ObjectId objId = doc.getObjectId("_id");
                        String id = objId.toString();
                        String fullname = doc.getString("fullname");
                        String clientType = doc.getString("clientType");
                        String rank = doc.getString("rank");

                        // Get shipment count from pre-computed map (O(1) lookup)
                        long shipmentCount = shipmentCountMap.getOrDefault(objId, 0L);

                        // Normalize Data
                        if (fullname == null)
                            fullname = doc.getString("username");
                        if (clientType == null)
                            clientType = "عادي";

                        // Rank Logic
                        if (rank == null || rank.trim().isEmpty()) {
                            rank = "low";
                        } else {
                            rank = rank.toLowerCase();
                            if (rank.equals("rank1"))
                                rank = "low";
                            else if (rank.equals("rank2"))
                                rank = "med";
                            else if (rank.equals("rank3"))
                                rank = "high";
                        }

                        loadedList.add(new UserRow(fullname, clientType, String.valueOf(shipmentCount), rank, id));
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                }
                return loadedList;
            }
        };

        loadTask.setOnSucceeded(event -> {
            userList.setAll(loadTask.getValue());
            if (userList.isEmpty()) {
                invoicesTable.setPlaceholder(new Label("لا توجد بيانات"));
            }
        });

        loadTask.setOnFailed(event -> {
            invoicesTable.setPlaceholder(new Label("خطأ في تحميل البيانات"));
            loadTask.getException().printStackTrace();
        });

        new Thread(loadTask).start();
    }

    // --- Navigation ---

    private void openInvoiceManagement(UserRow user) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/invoices-management.fxml"));
            Parent root = loader.load();
            HelloController controller = loader.getController();

            // Pass Data to HelloController
            controller.setSelectedClient(
                    user.getUsername(),
                    user.getShipmentCount(),
                    user.getClientType(),
                    user.getId(),
                    user.getRank());

            Stage stage = (Stage) invoicesTable.getScene().getWindow();
            stage.getScene().setRoot(root);

        } catch (IOException e) {
            e.printStackTrace();
            showAlert("خطأ", "لا يمكن فتح شاشة الفواتير: " + e.getMessage());
        }
    }

    private void showAlert(String title, String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    @FXML
    public void onDashboardClick(ActionEvent e) throws IOException {
        navigate(e, "/noran/desktop/dashboard.fxml");
    }

    @FXML
    public void onTa5les(ActionEvent e) throws IOException {
        navigate(e, "/noran/desktop/AdminInvoices.fxml");
    }

    @FXML
    public void refresh(ActionEvent e) {
        loadUsersWithShipments();
    }

    private void navigate(ActionEvent event, String fxmlPath) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.getScene().setRoot(root);
    }

    // --- Inner Class: UserRow ---
    public static class UserRow {
        private final SimpleStringProperty username;
        private final SimpleStringProperty clientType;
        private final SimpleStringProperty shipmentCount;
        private final SimpleStringProperty rank;
        private final SimpleStringProperty id;

        public UserRow(String username, String clientType, String shipmentCount, String rank, String id) {
            this.username = new SimpleStringProperty(username);
            this.clientType = new SimpleStringProperty(clientType);
            this.shipmentCount = new SimpleStringProperty(shipmentCount);
            this.rank = new SimpleStringProperty(rank);
            this.id = new SimpleStringProperty(id);
        }

        public String getId() {
            return id.get();
        }

        public String getUsername() {
            return username.get();
        }

        public String getClientType() {
            return clientType.get();
        }

        public String getShipmentCount() {
            return shipmentCount.get();
        }

        public String getRank() {
            return rank.get();
        }

        public StringProperty usernameProperty() {
            return username;
        }

        public StringProperty clientTypeProperty() {
            return clientType;
        }

        public StringProperty shipmentCountProperty() {
            return shipmentCount;
        }

        public StringProperty rankProperty() {
            return rank;
        }
    }
}