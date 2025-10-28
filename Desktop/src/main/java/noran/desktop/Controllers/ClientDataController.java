package noran.desktop.Controllers;

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

public class ClientDataController implements Initializable {

    @FXML private Label userNameLabel;
    @FXML private Label userIdLabel;
    @FXML private TableView<UserRow> invoicesTable;
    @FXML private TableColumn<UserRow, String> colClientName;
    @FXML private TableColumn<UserRow, String> colClientNumber;
    @FXML private TableColumn<UserRow, String> colClientType;
    @FXML private TableColumn<UserRow, String> colClientRank;
    @FXML private TextField searchField;

    private ObservableList<UserRow> userList = FXCollections.observableArrayList();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        colClientName.setCellValueFactory(data -> data.getValue().usernameProperty());
        colClientNumber.setCellValueFactory(data -> data.getValue().taxNumberProperty());
        colClientType.setCellValueFactory(data -> data.getValue().clientTypeProperty());
        colClientRank.setCellValueFactory(data -> data.getValue().rankProperty());

        loadUsersFromDatabase();
        setupSearchFilter();

        var currentUser = AppSession.getInstance().getCurrentUser();
        if (currentUser != null) {
            if (userNameLabel != null) userNameLabel.setText(currentUser.getName() == null ? "" : currentUser.getName());
            if (userIdLabel != null) userIdLabel.setText(currentUser.getId() == null ? "" : "ID: " + currentUser.getId());
        }

        // Double-click to open invoice management
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
        String sql = "SELECT _id, username, clientType, ssn FROM users WHERE type = 'client'";

        try (Connection conn = DatabaseConnection.connect();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                String username = rs.getString("username");
                String clientType = rs.getString("clientType");
                String taxNumber = rs.getString("ssn");
                String rank = "N/A";
                String id = rs.getString("_id");

                userList.add(new UserRow(username, clientType, taxNumber, rank,id));
            }
            invoicesTable.setItems(userList);

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private void setupSearchFilter() {
        FilteredList<UserRow> filteredData = new FilteredList<>(userList, p -> true);
        searchField.textProperty().addListener((obs, old, newVal) -> {
            filteredData.setPredicate(user -> {
                if (newVal == null || newVal.isBlank()) return true;
                return user.getUsername().toLowerCase().contains(newVal.toLowerCase());
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

    private void openInvoiceManagement(UserRow user) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/invoices-management.fxml"));
            Parent root = loader.load();
            HelloController controller = loader.getController();
            controller.setSelectedClient(user.getUsername(), user.getTaxNumber(), user.getClientType(), user.getId());

            Scene scene = new Scene(root);
            Stage stage = (Stage) invoicesTable.getScene().getWindow();
            stage.setScene(scene);
            stage.show();

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static class UserRow {
        private final javafx.beans.property.SimpleStringProperty username;
        private final javafx.beans.property.SimpleStringProperty clientType;
        private final javafx.beans.property.SimpleStringProperty taxNumber;
        private final javafx.beans.property.SimpleStringProperty rank;
        private final javafx.beans.property.SimpleStringProperty id;

        public UserRow(String username, String clientType, String taxNumber, String rank, String id) {
            this.username = new javafx.beans.property.SimpleStringProperty(username);
            this.clientType = new javafx.beans.property.SimpleStringProperty(clientType);
            this.taxNumber = new javafx.beans.property.SimpleStringProperty(taxNumber);
            this.rank = new javafx.beans.property.SimpleStringProperty(rank);
            this.id = new javafx.beans.property.SimpleStringProperty(id);
        }
        public String getId() {return id.get();}
        public String getUsername() { return username.get(); }
        public String getClientType() { return clientType.get(); }
        public String getTaxNumber() { return taxNumber.get(); }
        public String getRank() { return rank.get(); }

        public javafx.beans.property.StringProperty usernameProperty() { return username; }
        public javafx.beans.property.StringProperty clientTypeProperty() { return clientType; }
        public javafx.beans.property.StringProperty taxNumberProperty() { return taxNumber; }
        public javafx.beans.property.StringProperty rankProperty() { return rank; }
    }
}