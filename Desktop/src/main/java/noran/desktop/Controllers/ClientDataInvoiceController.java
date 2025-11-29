package noran.desktop.Controllers;

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
import noran.desktop.AppSession;
import noran.desktop.Database.DatabaseConnection;
import noran.desktop.HelloController;

import java.io.IOException;
import java.net.URL;
import java.sql.*;
import java.util.ResourceBundle;

public class ClientDataInvoiceController implements Initializable {

    @FXML private Label userNameLabel;
    @FXML private Label userIdLabel;
    @FXML private Button btnViewAcceptedInvoices;

    // Table Setup
    @FXML private TableView<UserRow> invoicesTable;
    @FXML private TableColumn<UserRow, String> colClientName;
    @FXML private TableColumn<UserRow, String> colClientNumber;
    @FXML private TableColumn<UserRow, String> colClientType;
    @FXML private TableColumn<UserRow, String> colClientRank;

    // --- Data Lists ---
    private final ObservableList<UserRow> userList = FXCollections.observableArrayList();
    private FilteredList<UserRow> filteredData;

    // --- Injected Controllers ---
    @FXML private SidebarController sidebarController;
    @FXML private TopBarController topBarController;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // 1. Setup Table Columns
        colClientName.setCellValueFactory(data -> data.getValue().usernameProperty());
        colClientNumber.setCellValueFactory(data -> data.getValue().taxNumberProperty());
        colClientType.setCellValueFactory(data -> data.getValue().clientTypeProperty());
        colClientRank.setCellValueFactory(data -> data.getValue().rankProperty());

        // 2. Wrap the ObservableList in a FilteredList (initially display all data)
        filteredData = new FilteredList<>(userList, p -> true);

        // 3. Wrap the FilteredList in a SortedList (to allow sorting by clicking headers)
        SortedList<UserRow> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(invoicesTable.comparatorProperty());

        // 4. Bind the table to the SortedList
        invoicesTable.setItems(sortedData);

        // 5. Load Data
        loadUsersFromDatabase();

        // 6. Setup Sidebar
        if (sidebarController != null) {
            sidebarController.setActivePage("invoices");
        }

        // 7. Setup TopBar (User Info + Search Logic)
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {

            // Set Page Title
            topBarController.setPageTitle("إدارة الفواتير");

            // Set User Info
            if (currentUser != null) {
                String name = currentUser.getName() != null ? currentUser.getName() : "مدير النظام";
                String id = currentUser.getId() != null ? "ID: " + currentUser.getId() : "";
                topBarController.setUserData(name, id);
            }

            // --- DYNAMIC SEARCH LOGIC ---
            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(user -> {
                    // If filter text is empty, display all users.
                    if (searchText == null || searchText.isEmpty()) {
                        return true;
                    }

                    String lowerCaseFilter = searchText.toLowerCase();

                    // Search by Name or Tax Number
                    if (user.getUsername() != null && user.getUsername().toLowerCase().contains(lowerCaseFilter)) {
                        return true; // Match Name
                    } else if (user.getTaxNumber() != null && user.getTaxNumber().contains(lowerCaseFilter)) {
                        return true; // Match Tax Number
                    }

                    return false; // No Match
                });
            });
        }

        // Double-click to open invoice screen
        invoicesTable.setOnMouseClicked(event -> {
            if (event.getClickCount() == 2) {
                UserRow selected = invoicesTable.getSelectionModel().getSelectedItem();
                if (selected != null) {
                    openInvoiceManagement(selected);
                }
            }
        });
    }

    private void loadUsersFromDatabase() {
        userList.clear(); // Automatically updates the table because of binding

        String sql = """
            SELECT _id, fullname, taxNumber, clientType, rank 
            FROM users 
            WHERE type = 'client' AND active = 1
            ORDER BY fullname
            """;

        try (Connection conn = DatabaseConnection.connect();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                String id = rs.getString("_id");
                String fullname = rs.getString("fullname");
                String taxNumber = rs.getString("taxNumber");
                String clientType = rs.getString("clientType");
                String rank = rs.getString("rank");

                // Normalize rank
                if (rank == null || rank.trim().isEmpty()) {
                    rank = "low";
                } else {
                    rank = rank.toLowerCase();
                    if (rank.equals("rank1")) rank = "low";
                    if (rank.equals("rank2")) rank = "med";
                    if (rank.equals("rank3")) rank = "high";
                }

                userList.add(new UserRow(fullname, clientType, taxNumber != null ? taxNumber : "-", rank, id));
            }

        } catch (SQLException e) {
            e.printStackTrace();
            showAlert("خطأ", "فشل تحميل بيانات العملاء: " + e.getMessage());
        }
    }

    // --- Navigation & Other Actions ---

    @FXML
    public void onDashboardClick(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/dashboard.fxml");
    }

    @FXML
    public void onTa5les(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/AdminInvoices.fxml");
    }

    @FXML
    private void openAcceptedInvoices() {
        try {
            Stage currentStage = (Stage) btnViewAcceptedInvoices.getScene().getWindow();
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/AcceptedInvoicesView.fxml"));
            Scene scene = new Scene(root);
            currentStage.setScene(scene);
            currentStage.setTitle("الفواتير المقبولة والمرسلة");
            currentStage.centerOnScreen();
        } catch (IOException e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "فشل في فتح صفحة الفواتير المقبولة:\n" + e.getMessage()).show();
        }
    }

    private void openInvoiceManagement(UserRow user) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/invoices-management.fxml"));
            Parent root = loader.load();
            HelloController controller = loader.getController();

            // Pass ALL required data including rank
            controller.setSelectedClient(
                    user.getUsername(),
                    user.getTaxNumber(),
                    user.getClientType(),
                    user.getId(),
                    user.getRank()
            );

            Scene scene = new Scene(root);
            Stage stage = (Stage) invoicesTable.getScene().getWindow();
            stage.setScene(scene);
            stage.show();

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

    public void onClientManagementClick(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/client-data.fxml");
    }

    public void invoice_management(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/client-data-invoice.fxml");
    }

    public void shipment_management(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/shipments-management.fxml");
    }

    public void employee_management(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/employee-management.fxml");
    }

    // Helper for navigation
    private void navigate(ActionEvent event, String fxmlPath) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }

    // --- Inner Class: UserRow ---
    public static class UserRow {
        private final SimpleStringProperty username;
        private final SimpleStringProperty clientType;
        private final SimpleStringProperty taxNumber;
        private final SimpleStringProperty rank;
        private final SimpleStringProperty id;

        public UserRow(String username, String clientType, String taxNumber, String rank, String id) {
            this.username = new SimpleStringProperty(username != null ? username : "غير محدد");
            this.clientType = new SimpleStringProperty(clientType != null ? clientType : "عادي");
            this.taxNumber = new SimpleStringProperty(taxNumber != null ? taxNumber : "-");
            this.rank = new SimpleStringProperty(rank != null ? rank : "low");
            this.id = new SimpleStringProperty(id);
        }

        public String getId() { return id.get(); }
        public String getUsername() { return username.get(); }
        public String getClientType() { return clientType.get(); }
        public String getTaxNumber() { return taxNumber.get(); }
        public String getRank() { return rank.get(); }

        public StringProperty usernameProperty() { return username; }
        public StringProperty clientTypeProperty() { return clientType; }
        public StringProperty taxNumberProperty() { return taxNumber; }
        public StringProperty rankProperty() { return rank; }
        public StringProperty idProperty() { return id; }
    }
}