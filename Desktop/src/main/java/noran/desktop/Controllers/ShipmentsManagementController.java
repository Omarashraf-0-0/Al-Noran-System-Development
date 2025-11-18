package noran.desktop.Controllers;

import noran.desktop.Database.DatabaseConnection;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.stage.Modality;
import javafx.stage.Stage;
import noran.desktop.Services.APIService;
import noran.desktop.models.Shipment;
import org.json.JSONObject;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class ShipmentsManagementController {

    @FXML private TableView<Shipment> clientTable;
    @FXML private TableColumn<Shipment, String> colPortName;
    @FXML private TableColumn<Shipment, String> colContainerNumber;
    @FXML private TableColumn<Shipment, String> colCounrty;
    @FXML private TableColumn<Shipment, String> colShipmentStatus;
    @FXML private TableColumn<Shipment, String> colPolicy;

    private final ObservableList<Shipment> shipments = FXCollections.observableArrayList();

    @FXML
    public void initialize() {
        colPortName.setCellValueFactory(data -> data.getValue().portNameProperty());
        colContainerNumber.setCellValueFactory(data -> data.getValue().numOfContainersProperty().asString());
        colCounrty.setCellValueFactory(data -> data.getValue().countryProperty());
        colShipmentStatus.setCellValueFactory(data -> data.getValue().statusProperty());
        colPolicy.setCellValueFactory(data -> data.getValue().policyProperty());

        loadShipments();
    }

    public void loadShipments() {
        shipments.clear();
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "SELECT shipment_id, port_name, country, num_of_containers, status, policy FROM shipments";
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                shipments.add(new Shipment(
                        rs.getString("shipment_id"),
                        rs.getString("port_name"),
                        rs.getInt("num_of_containers"),
                        rs.getString("country"),
                        rs.getString("status"),
                        rs.getString("policy")
                ));
            }
            clientTable.setItems(shipments);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void openShipmentPopup(Shipment shipment) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/shipments-popup.fxml"));
            Parent root = loader.load();

            ShipmentPopupController popupController = loader.getController();
            popupController.loadShipment(shipment);

            Stage stage = new Stage();
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.setScene(new Scene(root));
            stage.setTitle(shipment.getId().isBlank() ? "Add Shipment" : "Edit Shipment");
            stage.showAndWait();

            if (popupController.isSaved()) {
                if (shipment.getId().isBlank()) {
                    // Create remotely first
                    String remoteId = addShipmentRemotely(shipment);
                    if (remoteId == null) {
                        showAlert("Failed to add shipment on remote server.");
                        return;
                    }
                    // set server id and insert into local
                    shipment.setId(remoteId);
                    insertLocalShipment(shipment);
                    shipments.add(shipment);
                } else {
                    // update remote first
                    boolean ok = updateShipmentRemotely(shipment);
                    if (!ok) {
                        showAlert("Failed to update shipment on remote server.");
                        return;
                    }
                    updateLocalShipment(shipment);
                }
                clientTable.refresh();
            }
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error: " + e.getMessage());
        }
    }

    @FXML
    public void deleteShipment(ActionEvent event) {
        Shipment selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select a shipment to delete.");
            return;
        }

        // Delete local only
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "DELETE FROM shipments WHERE shipment_id = ?";
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setString(1, selected.getId());
            int deleted = ps.executeUpdate();

            if (deleted > 0) {
                shipments.remove(selected);
                clientTable.refresh();
                showAlert("Shipment deleted locally.");
            } else {
                showAlert("Shipment not found in local database.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Local delete failed: " + e.getMessage());
        }
    }

    @FXML
    public void editShipment(ActionEvent event) {
        Shipment selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select a shipment to edit.");
            return;
        }
        openShipmentPopup(selected);
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
    public void client_management_btn_handle(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/client-data.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }

    private void insertLocalShipment(Shipment s) {
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "INSERT INTO shipments (shipment_id, port_name, country, num_of_containers, status, policy) VALUES (?, ?, ?, ?, ?, ?)";
            PreparedStatement ps = conn.prepareStatement(sql);
            long now = System.currentTimeMillis();
            ps.setString(1, s.getId());
            ps.setString(2, s.getPortName());
            ps.setString(3, s.getCountry());
            ps.setInt(4, s.getNumOfContainers());
            ps.setString(5, s.getStatus());
            ps.setString(6, s.getPolicy());
            ps.executeUpdate();
            System.out.println("✔ Inserted shipment locally");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updateLocalShipment(Shipment s) {
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "UPDATE shipments SET port_name=?, country=?, num_of_containers=?, status=?, policy=? WHERE shipment_id=?";
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setString(1, s.getPortName());
            ps.setString(2, s.getCountry());
            ps.setInt(3, s.getNumOfContainers());
            ps.setString(4, s.getStatus());
            ps.setString(5, s.getPolicy());
            ps.setString(6, s.getId());
            ps.executeUpdate();
            System.out.println("✔ Updated shipment locally");
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

    private static final String REMOTE_USERS_GET_URL = "http://localhost:3500/api/users/getAll";
    private static final String REMOTE_USERS_CREATE_URL = "http://localhost:3500/api/users/getAll";
    private static final String REMOTE_SHIPMENTS_URL = "http://localhost:3500/api/shipments";

    // --- existing user methods omitted for brevity ---

    // Add shipment remotely
    public static String addShipmentRemotely(Shipment shipment) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("acid", shipment.getAcid());
            payload.put("port_name", shipment.getPortName());
            payload.put("country", shipment.getCountry());
            payload.put("num_of_containers", shipment.getNumOfContainers());
            payload.put("status", shipment.getStatus().isBlank() ? "Pending" : shipment.getStatus());
            payload.put("policy", shipment.getPolicy());

            System.out.println("Sending shipment payload:\n" + payload.toString(2));

            String response = APIService.post(REMOTE_SHIPMENTS_URL, payload.toString());
            JSONObject respJson = new JSONObject(response);

            if (respJson.has("shipment") && respJson.getJSONObject("shipment").has("id")) {
                return respJson.getJSONObject("shipment").getString("id");
            }

            System.out.println("Server response did not contain shipment.id: " + response);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static boolean updateShipmentRemotely(Shipment shipment) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("_id", shipment.getId());
            payload.put("acid", shipment.getAcid());
            payload.put("port_name", shipment.getPortName());
            payload.put("country", shipment.getCountry());
            payload.put("num_of_containers", shipment.getNumOfContainers());
            payload.put("status", shipment.getStatus());
            payload.put("policy", shipment.getPolicy());

            String updateUrl = REMOTE_SHIPMENTS_URL + "/" + shipment.getId();
            String response = APIService.put(updateUrl, payload.toString());

            JSONObject respJson = new JSONObject(response);
            return !respJson.has("error");
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean deleteShipmentRemotely(String shipmentId) {
        if (shipmentId == null || shipmentId.isBlank()) return false;
        try {
            String deleteUrl = REMOTE_SHIPMENTS_URL + "/" + shipmentId;
            String response = APIService.delete(deleteUrl);
            JSONObject respJson = new JSONObject(response);
            return respJson.has("message") && respJson.getString("message").toLowerCase().contains("deleted");
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public void employee_management_btn_handle(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/shipments-management.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
}
