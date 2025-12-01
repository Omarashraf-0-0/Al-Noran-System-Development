package noran.desktop.Controllers;

import noran.desktop.AppSession;
import noran.desktop.Database.DatabaseConnection;

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

    // --- Data Lists ---
    private final ObservableList<Shipment> shipments = FXCollections.observableArrayList();
    private FilteredList<Shipment> filteredData; // Wrapper for search

    // --- Injected Controllers ---
    @FXML private SidebarController sidebarController;
    @FXML private TopBarController topBarController;

    @FXML
    public void initialize() {
        // 1. Setup Columns
        colPortName.setCellValueFactory(data -> data.getValue().portNameProperty());
        colContainerNumber.setCellValueFactory(data -> data.getValue().numOfContainersProperty().asString());
        colCounrty.setCellValueFactory(data -> data.getValue().countryProperty());
        colShipmentStatus.setCellValueFactory(data -> data.getValue().statusProperty());
        colPolicy.setCellValueFactory(data -> data.getValue().policyProperty());

        // 2. Wrap the ObservableList in a FilteredList (initially display all data)
        filteredData = new FilteredList<>(shipments, p -> true);

        // 3. Wrap the FilteredList in a SortedList (to allow sorting by clicking headers)
        SortedList<Shipment> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(clientTable.comparatorProperty());

        // 4. Bind the table to the SortedList
        clientTable.setItems(sortedData);

        // 5. Load Data
        loadShipments();

        // 6. Setup Sidebar
        if (sidebarController != null) {
            sidebarController.setActivePage("shipments");
        }

        // 7. Setup TopBar (User Info + Search Logic)
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {

            // Set Page Title
            topBarController.setPageTitle("إدارة الشحنات");

            // Set User Info
            if (currentUser != null) {
                String name = currentUser.getName() != null ? currentUser.getName() : "مدير النظام";
                String id = currentUser.getId() != null ? "ID: " + currentUser.getId() : "";
                topBarController.setUserData(name, id);
            }

            // --- DYNAMIC SEARCH LOGIC ---
            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(shipment -> {
                    // If filter text is empty, display all shipments.
                    if (searchText == null || searchText.isEmpty()) {
                        return true;
                    }

                    String lowerCaseFilter = searchText.toLowerCase();

                    // Search specifically by Port Name
                    if (shipment.getPortName() != null && shipment.getPortName().toLowerCase().contains(lowerCaseFilter)) {
                        return true;
                    }

                    return false; // No Match
                });
            });
        }
    }

    public void loadShipments() {
        shipments.clear(); // Automatically updates the table because of binding
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "SELECT shipment_id, port_name, country, num_of_containers, status, policy FROM shipments";
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                shipments.add(new Shipment(
                        rs.getInt("shipment_id"),
                        rs.getString("port_name"),
                        rs.getInt("num_of_containers"),
                        rs.getString("country"),
                        rs.getString("status"),
                        rs.getString("policy")
                ));
            }
            // Note: clientTable.setItems(shipments) is REMOVED because it's bound to sortedData
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
            stage.setTitle(shipment.getId()==0 ? "Add Shipment" : "Edit Shipment");
            stage.showAndWait();

            if (popupController.isSaved()) {
                if (shipment.getId()==0) {
                    // Create remotely first
                    int remoteId = addShipmentRemotely(shipment);
                    if (remoteId == 0) {
                        showAlert("Failed to add shipment on remote server.");
                        return;
                    }
                    // set server id and insert into local
                    shipment.setId(remoteId);
                    insertLocalShipment(shipment);
                    shipments.add(shipment); // Updates UI
                } else {
                    // update remote first
                    boolean ok = updateShipmentRemotely(shipment);
                    if (!ok) {
                        showAlert("Failed to update shipment on remote server.");
                        return;
                    }
                    updateLocalShipment(shipment);
                    // No need to add to list, object is updated in place
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
            ps.setInt(1, selected.getId());
            int deleted = ps.executeUpdate();

            if (deleted > 0) {
                shipments.remove(selected); // Updates UI
                clientTable.refresh();
                showAlert("Shipment deleted succesfully.");
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

    // --- NAVIGATION ---
    @FXML public void onDashboardClick(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/dashboard.fxml"); }
    @FXML public void onInvoiceManagementClick(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/client-data-invoice.fxml"); }
    @FXML public void client_management_btn_handle(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/client-data.fxml"); }
    @FXML public void employee_management_btn_handle(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/employee-management.fxml"); }

    private void navigate(ActionEvent event, String fxmlPath) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }

    // --- DB HELPERS ---
    private void insertLocalShipment(Shipment s) {
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "INSERT INTO shipments (shipment_id, port_name, country, num_of_containers, status, policy) VALUES (?, ?, ?, ?, ?, ?)";
            PreparedStatement ps = conn.prepareStatement(sql);
            long now = System.currentTimeMillis();
            ps.setInt(1, s.getId());
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
            ps.setInt(6, s.getId());
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

    // --- REMOTE API HELPERS ---
    private static final String REMOTE_USERS_GET_URL = "http://localhost:3500/api/users/getAll";
    private static final String REMOTE_USERS_CREATE_URL = "http://localhost:3500/api/users/getAll";
    private static final String REMOTE_SHIPMENTS_URL = "http://localhost:3500/api/shipments";

    public static int addShipmentRemotely(Shipment shipment) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("acid", shipment.getAcid());
            payload.put("port_name", shipment.getPortName());
            payload.put("country", shipment.getCountry());
            payload.put("num_of_containers", shipment.getNumOfContainers());
            payload.put("status", shipment.getStatus() == null || shipment.getStatus().isBlank() ? "Pending" : shipment.getStatus());
            payload.put("policy", shipment.getPolicy());

            System.out.println("Sending shipment payload:\n" + payload.toString(2));

            String response = APIService.post(REMOTE_SHIPMENTS_URL, payload.toString());

            if (response == null) return 0;

            JSONObject respJson = new JSONObject(response);

            if (respJson.has("shipment") && respJson.getJSONObject("shipment").has("id")) {
                return respJson.getJSONObject("shipment").getInt("id");
            }

            System.out.println("Server response did not contain shipment.id: " + response);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
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
}