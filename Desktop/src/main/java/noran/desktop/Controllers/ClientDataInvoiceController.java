package noran.desktop.Controllers;

import javafx.beans.property.SimpleStringProperty;
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
    @FXML private TableView<UserRow> invoicesTable;
    @FXML private TableColumn<UserRow, String> colClientName;
    @FXML private TableColumn<UserRow, String> colClientNumber;
    @FXML private TableColumn<UserRow, String> colClientType;
    @FXML private TableColumn<UserRow, String> colClientRank;
    @FXML private TextField searchField;

    private final ObservableList<UserRow> userList = FXCollections.observableArrayList();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // Setup Table Columns
        colClientName.setCellValueFactory(data -> data.getValue().usernameProperty());
        colClientNumber.setCellValueFactory(data -> data.getValue().taxNumberProperty());
        colClientType.setCellValueFactory(data -> data.getValue().clientTypeProperty());
        colClientRank.setCellValueFactory(data -> data.getValue().rankProperty());

        loadUsersFromDatabase();
        setupSearchFilter();

        // Show current logged-in user info
        var currentUser = AppSession.getInstance().getCurrentUser();
        if (currentUser != null) {
            if (userNameLabel != null) userNameLabel.setText(currentUser.getName() != null ? currentUser.getName() : "");
            if (userIdLabel != null) userIdLabel.setText(currentUser.getId() != null ? "ID: " + currentUser.getId() : "");
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
        userList.clear();
        // Fixed: Use fullname, taxNumber (not ssn), rank, and filter only active clients
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

            invoicesTable.setItems(userList);

        } catch (SQLException e) {
            e.printStackTrace();
            showAlert("خطأ", "فشل تحميل بيانات العملاء: " + e.getMessage());
        }
    }

    private void setupSearchFilter() {
        FilteredList<UserRow> filteredData = new FilteredList<>(userList, p -> true);

        searchField.textProperty().addListener((observable, oldValue, newValue) -> {
            filteredData.setPredicate(user -> {
                if (newValue == null || newValue.isBlank()) return true;
                String lowerCaseFilter = newValue.toLowerCase();
                return user.getUsername().toLowerCase().contains(lowerCaseFilter) ||
                        (user.getTaxNumber() != null && user.getTaxNumber().contains(newValue));
            });
        });

        SortedList<UserRow> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(invoicesTable.comparatorProperty());
        invoicesTable.setItems(sortedData);
    }

    @FXML
    public void onDashboardClick(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/dashboard.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }


    @FXML
    public void onTa5les(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/AdminInvoices.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
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
                    user.getRank()  // This was missing before!
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

    public void onClientManagementClick(ActionEvent event)throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/client-data.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }

    // Updated UserRow with proper getters
    public static class UserRow {
        private final javafx.beans.property.SimpleStringProperty username;
        private final javafx.beans.property.SimpleStringProperty clientType;
        private final javafx.beans.property.SimpleStringProperty taxNumber;
        private final javafx.beans.property.SimpleStringProperty rank;
        private final javafx.beans.property.SimpleStringProperty id;

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

        public javafx.beans.property.StringProperty usernameProperty() { return username; }
        public javafx.beans.property.StringProperty clientTypeProperty() { return clientType; }
        public javafx.beans.property.StringProperty taxNumberProperty() { return taxNumber; }
        public javafx.beans.property.StringProperty rankProperty() { return rank; }
        public javafx.beans.property.StringProperty idProperty() { return id; }

    }




}