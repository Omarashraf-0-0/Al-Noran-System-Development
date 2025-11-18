package noran.desktop.Controllers;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
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

    @FXML
    public void initialize() {
        colName.setCellValueFactory(data -> data.getValue().fullnameProperty());
        colEmail.setCellValueFactory(data -> data.getValue().emailProperty());
        colSSN.setCellValueFactory(data -> data.getValue().ssnProperty());
        colPhone.setCellValueFactory(data -> data.getValue().phoneProperty());
        colType.setCellValueFactory(data -> data.getValue().clientTypeProperty());

        loadClients();
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
        clients.clear();
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
                        rs.getString("password") // <-- include password
                ));
            }

            clientTable.setItems(clients);

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
                        clients.add(client);
                    } else {
                        showAlert("Failed to add client remotely. Please try again.");
                        return;
                    }
                } else {
                    // Update existing client remotely first
                    boolean updated = RestMongoSyncClient.updateClientRemotely(client);
                    if (updated) {
                        updateLocalClient(client);
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
        Client newClient = new Client("", "", "", "", "", "", ""); // <-- include password
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

        // 1️⃣ Delete remotely first
        boolean remoteDeleted = RestMongoSyncClient.deleteClientRemotely(selected.getId());
        if (!remoteDeleted) {
            showAlert("Failed to delete client remotely.");
            return;
        }

        // 2️⃣ Delete locally
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "DELETE FROM users WHERE _id = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, selected.getId());
            stmt.executeUpdate();

            clients.remove(selected);
            clientTable.refresh();

            System.out.println("✔ Deleted client locally and remotely");

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Failed to delete client locally: " + e.getMessage());
        }
    }



    private void insertLocalClient(Client client) {
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "INSERT INTO users (fullname, email, ssn, phone, clientType, password, type, createdAt, updatedAt, active) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 'client', ?, ?, 1)";
            PreparedStatement stmt = conn.prepareStatement(sql);

            long now = System.currentTimeMillis();
            stmt.setString(1, client.getFullname());
            stmt.setString(2, client.getEmail());
            stmt.setString(3, client.getSsn());
            stmt.setString(4, client.getPhone());
            stmt.setString(5, client.getClientType());
            stmt.setString(6, client.getPassword()); // <-- set password
            stmt.setLong(7, now);
            stmt.setLong(8, now);

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
            stmt.setString(6, client.getPassword()); // <-- update password
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
    public void onInvoiceManagementClick(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/client-data-invoice.fxml"));
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

}
