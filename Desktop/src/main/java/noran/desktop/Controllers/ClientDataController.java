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

    @FXML private TableView<Client> clientTable;
    @FXML private TableColumn<Client, String> colName;
    @FXML private TableColumn<Client, String> colEmail;
    @FXML private TableColumn<Client, String> colSSN;
    @FXML private TableColumn<Client, String> colPhone;
    @FXML private TableColumn<Client, String> colType;

    private final ObservableList<Client> clients = FXCollections.observableArrayList();
    private FilteredList<Client> filteredData;

    @FXML private SidebarController sidebarController;
    @FXML private TopBarController topBarController;

    @FXML
    public void initialize() {
        setupTable();

        // 1. Initial Load (Forces Sync)
        loadClients();

        if (sidebarController != null) sidebarController.setActivePage("clients");
        setupTopBar();
    }

    private void setupTable() {
        colName.setCellValueFactory(data -> data.getValue().fullnameProperty());
        colEmail.setCellValueFactory(data -> data.getValue().emailProperty());
        colSSN.setCellValueFactory(data -> data.getValue().ssnProperty());
        colPhone.setCellValueFactory(data -> data.getValue().phoneProperty());
        colType.setCellValueFactory(data -> data.getValue().clientTypeProperty());

        filteredData = new FilteredList<>(clients, p -> true);
        SortedList<Client> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(clientTable.comparatorProperty());
        clientTable.setItems(sortedData);
    }

    public void loadClients() {
        // ✅ STEP 1: Sync Local DB with Remote Server First
        // This makes sure SQLite matches MongoDB exactly before we read from it.
        try {
            System.out.println("🔄 Syncing local database with remote server...");
            RestMongoSyncClient.syncUsersWithRemote();
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("⚠ Sync failed. Loading existing local data only.");
            // We don't show an alert here to avoid annoying the user if they are offline
        }

        // ✅ STEP 2: Clear old UI data
        clients.clear();

        // ✅ STEP 3: Load fresh data from SQLite
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
        } catch (Exception e) {
            e.printStackTrace();
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
            showAlert("يرجى تحديد عميل للتعديل.");
            return;
        }

        // Create a copy so we don't modify the table row directly
        Client tempClient = new Client(
                selected.getId(),
                selected.getFullname(),
                selected.getEmail(),
                selected.getSsn(),
                selected.getPhone(),
                selected.getClientType(),
                selected.getPassword()
        );

        openClientPopup(tempClient);
        // Note: loadClients() is called inside handleRemoteSave() if successful,
        // so we don't need it here explicitly unless the popup was cancelled,
        // but adding it doesn't hurt.
    }

    private void openClientPopup(Client clientToEdit) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/add-client-popup.fxml"));
            Parent root = loader.load();

            ClientPopupController popupController = loader.getController();
            popupController.loadClient(clientToEdit);

            Stage stage = new Stage();
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.setScene(new Scene(root));
            stage.setTitle(clientToEdit.getId().isBlank() ? "Add Client" : "Edit Client");
            stage.showAndWait();

            if (popupController.isSaved()) {
                handleRemoteSave(clientToEdit);
            }

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("حدث خطأ: " + e.getMessage());
        }
    }

    private void handleRemoteSave(Client client) {
        boolean success = false;
        String operation = "";

        if (client.getId() == null || client.getId().isBlank()) {
            operation = "add";
            String remoteId = RestMongoSyncClient.addClientRemotely(client);
            success = (remoteId != null && !remoteId.isBlank());
        } else {
            operation = "update";
            success = RestMongoSyncClient.updateClientRemotely(client);
        }

        if (success) {
            System.out.println("✔ Remote " + operation + " successful.");
            // loadClients() now handles the sync automatically!
            loadClients();
            clientTable.refresh();
        } else {
            showAlert("فشل الاتصال بالخادم. لم يتم حفظ البيانات.");
        }
    }

    @FXML
    private void deleteClient() {
        Client selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select a client to delete.");
            return;
        }

        boolean deleted = RestMongoSyncClient.deleteClientRemotely(selected.getId());

        if (deleted) {
            System.out.println("✔ Remote delete successful.");
            // loadClients() now handles the sync automatically!
            loadClients();
        } else {
            showAlert("Failed to delete client remotely.");
        }
    }

    // --- Helper Methods ---

    private void setupTopBar() {
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {
            topBarController.setPageTitle("إدارة العملاء");
            if (currentUser != null) {
                topBarController.setUserData(currentUser.getName(), "ID: " + currentUser.getId());
            }

            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(client -> {
                    if (searchText == null || searchText.isEmpty()) return true;
                    String lower = searchText.toLowerCase();
                    return (client.getFullname() != null && client.getFullname().toLowerCase().contains(lower)) ||
                            (client.getPhone() != null && client.getPhone().contains(lower)) ||
                            (client.getEmail() != null && client.getEmail().toLowerCase().contains(lower)) ||
                            (client.getSsn() != null && client.getSsn().contains(lower));
                });
            });
        }
    }

    private void showAlert(String msg) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setHeaderText(null);
        alert.setContentText(msg);
        alert.showAndWait();
    }

    public void refresh(ActionEvent event) {
        // Just calling loadClients is enough now because it includes sync
        loadClients();
    }

    // --- Navigation Methods ---
    @FXML public void onDashboardClick(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/dashboard.fxml"); }
    @FXML public void onInvoiceManagementClick(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/client-data-invoice.fxml"); }
    @FXML public void onTa5les(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/AdminInvoices.fxml"); }
    public void employee_management_btn_handle(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/employee-management.fxml"); }
    public void shipments_management(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/shipments-management.fxml"); }

    private void navigate(ActionEvent event, String fxml) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxml));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
}