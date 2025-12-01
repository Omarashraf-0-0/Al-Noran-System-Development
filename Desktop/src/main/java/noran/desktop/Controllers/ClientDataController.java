package noran.desktop.Controllers;

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
import javafx.scene.control.Alert;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.stage.Modality;
import javafx.stage.Stage;
import noran.desktop.AppSession;
import noran.desktop.Database.DatabaseConnection;
import noran.desktop.Database.RestMongoSyncClient;
import noran.desktop.models.Client;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class ClientDataController {

    // --- FXML Table Fields ---
    @FXML private TableView<Client> clientTable;
    @FXML private TableColumn<Client, String> colName;
    @FXML private TableColumn<Client, String> colEmail;
    @FXML private TableColumn<Client, String> colSSN;
    @FXML private TableColumn<Client, String> colPhone;
    @FXML private TableColumn<Client, String> colType;

    // --- Data Lists ---
    // 1. Master Data (Contains everything from DB)
    private final ObservableList<Client> clients = FXCollections.observableArrayList();
    // 2. Filtered Data (Wraps Master Data for searching)
    private FilteredList<Client> filteredData;

    // --- Controllers Injected via <fx:include> ---
    @FXML private SidebarController sidebarController;
    @FXML private TopBarController topBarController;

    @FXML
    public void initialize() {
        // 1. Setup Table Columns
        colName.setCellValueFactory(data -> data.getValue().fullnameProperty());
        colEmail.setCellValueFactory(data -> data.getValue().emailProperty());
        colSSN.setCellValueFactory(data -> data.getValue().ssnProperty());
        colPhone.setCellValueFactory(data -> data.getValue().phoneProperty());
        colType.setCellValueFactory(data -> data.getValue().clientTypeProperty());

        // 2. Wrap the ObservableList in a FilteredList (initially display all data)
        filteredData = new FilteredList<>(clients, p -> true);

        // 3. Wrap the FilteredList in a SortedList (to allow sorting by clicking headers)
        SortedList<Client> sortedData = new SortedList<>(filteredData);

        // 4. Bind the SortedList comparator to the TableView comparator
        sortedData.comparatorProperty().bind(clientTable.comparatorProperty());

        // 5. Add sorted (and filtered) data to the table
        clientTable.setItems(sortedData);

        // 6. Load Data from Database
        loadClients();

        // 7. Configure Sidebar (Highlight "Clients" button)
        if (sidebarController != null) {
            sidebarController.setActivePage("clients");
        }

        // 8. Configure TopBar (Title + User Info + Search Logic)
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {

            // Set Page Title
            topBarController.setPageTitle("إدارة العملاء");

            // Set User Info
            if (currentUser != null) {
                String name = currentUser.getName() != null ? currentUser.getName() : "مدير النظام";
                String id = currentUser.getId() != null ? "ID: " + currentUser.getId() : "";
                topBarController.setUserData(name, id);
            }

            // --- DYNAMIC SEARCH LOGIC ---
            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(client -> {
                    // If filter text is empty, display all clients.
                    if (searchText == null || searchText.isEmpty()) {
                        return true;
                    }

                    // Compare name, email, phone with filter text (Case Insensitive)
                    String lowerCaseFilter = searchText.toLowerCase();

                    if (client.getFullname() != null && client.getFullname().toLowerCase().contains(lowerCaseFilter)) {
                        return true; // Match Name
                    } else if (client.getPhone() != null && client.getPhone().toLowerCase().contains(lowerCaseFilter)) {
                        return true; // Match Phone
                    } else if (client.getEmail() != null && client.getEmail().toLowerCase().contains(lowerCaseFilter)) {
                        return true; // Match Email
                    } else if (client.getSsn() != null && client.getSsn().contains(lowerCaseFilter)) {
                        return true; // Match SSN
                    }

                    return false; // No Match
                });
            });
        }
    }

    private void deleteClientsWithNullId() {
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "DELETE FROM users WHERE _id IS NULL OR _id = ''";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                int affected = stmt.executeUpdate();
                System.out.println("Deleted " + affected + " clients with null or empty _id");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void loadClients() {
        clients.clear(); // This automatically clears the TableView because of bindings
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "SELECT _id, fullname, email, ssn, phone, clientType, password FROM users WHERE type='client'";
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                clients.add(new Client(
                        rs.getString("_id"),
                        rs.getString("fullname"),
                        rs.getString("email"),
                        rs.getString("ssn"),
                        rs.getString("phone"),
                        rs.getString("clientType"),
                        rs.getString("password")
                ));
            }
            // Note: We do NOT need clientTable.setItems(clients) here.
            // The table is bound to 'sortedData', which watches 'filteredData', which watches 'clients'.

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void openClientPopup(Client client) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/add-client-popup.fxml"));
            Parent root = loader.load();

            ClientPopupController popupController = loader.getController();
            popupController.loadClient(client);

            Stage stage = new Stage();
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.setScene(new Scene(root));
            stage.setTitle(client.getId().isBlank() ? "Add Client" : "Edit Client");
            stage.showAndWait();

            if (popupController.isSaved()) {

                if (client.getId().isBlank()) {
                    // 1️⃣ Add client remotely first and get server-generated _id
                    String remoteId = RestMongoSyncClient.addClientRemotely(client);
                    if (remoteId != null && !remoteId.isBlank()) {
                        client.setId(remoteId);

                        // 2️⃣ Save locally
                        insertLocalClient(client);
                        clients.add(client); // Updates UI automatically
                    } else {
                        showAlert("Failed to add client remotely. Please try again.");
                        return;
                    }
                } else {
                    // Update existing client remotely first
                    boolean updated = RestMongoSyncClient.updateClientRemotely(client);
                    if (updated) {
                        updateLocalClient(client);
                        // No need to add to list, the object inside the list is updated
                    } else {
                        showAlert("Failed to update client remotely. Please try again.");
                        return;
                    }
                }

                clientTable.refresh();
            }

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("An error occurred: " + e.getMessage());
        }
    }

    @FXML
    private void addClient() {
        Client newClient = new Client("", "", "", "", "", "", "");
        openClientPopup(newClient);
    }

    @FXML
    private void editClient() {
        Client selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select a client to edit.");
            return;
        }
        openClientPopup(selected);
    }

    @FXML
    private void deleteClient() {
        Client selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select a client to delete.");
            return;
        }

        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "DELETE FROM users WHERE _id = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, selected.getId());
            stmt.executeUpdate();

            clients.remove(selected); // Updates UI automatically
            // clientTable.refresh(); // Usually not needed if ObservableList is used properly, but safe to keep

            System.out.println("✔ Deleted client ");

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Failed to delete client locally: " + e.getMessage());
        }
    }

    private void insertLocalClient(Client client) {
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "INSERT INTO users (fullname, email, ssn, phone, clientType, password, type, createdAt, updatedAt, active,_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 'client', ?, ?, 1,?)";
            PreparedStatement stmt = conn.prepareStatement(sql);

            long now = System.currentTimeMillis();
            stmt.setString(1, client.getFullname());
            stmt.setString(2, client.getEmail());
            stmt.setString(3, client.getSsn());
            stmt.setString(4, client.getPhone());
            stmt.setString(5, client.getClientType());
            stmt.setString(6, client.getPassword());
            stmt.setLong(7, now);
            stmt.setLong(8, now);
            stmt.setString(9, client.getId());

            stmt.executeUpdate();
            System.out.println("✔ Local DB inserted new client");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updateLocalClient(Client client) {
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "UPDATE users SET fullname=?, email=?, ssn=?, phone=?, clientType=?, password=?, updatedAt=? WHERE _id=?";
            PreparedStatement stmt = conn.prepareStatement(sql);

            stmt.setString(1, client.getFullname());
            stmt.setString(2, client.getEmail());
            stmt.setString(3, client.getSsn());
            stmt.setString(4, client.getPhone());
            stmt.setString(5, client.getClientType());
            stmt.setString(6, client.getPassword());
            stmt.setLong(7, System.currentTimeMillis());
            stmt.setString(8, client.getId());

            stmt.executeUpdate();
            System.out.println("✔ Local DB updated client");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void showAlert(String msg) {
        Alert alert = new Alert(Alert.AlertType.WARNING);
        alert.setHeaderText(null);
        alert.setContentText(msg);
        alert.showAndWait();
    }

    // --- Navigation Methods ---

    @FXML
    public void onDashboardClick(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/dashboard.fxml");
    }

    @FXML
    public void onInvoiceManagementClick(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/client-data-invoice.fxml");
    }

    @FXML
    public void onTa5les(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/AdminInvoices.fxml");
    }

    public void employee_management_btn_handle(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/employee-management.fxml");
    }

    public void shipments_management(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/shipments-management.fxml");
    }

    private void navigate(ActionEvent event, String fxml) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxml));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }

    public void refresh(ActionEvent event) {

    }
}