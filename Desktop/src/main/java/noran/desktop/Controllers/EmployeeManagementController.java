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
import noran.desktop.models.Employee;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class EmployeeManagementController {

    @FXML private TableView<Employee> clientTable;
    @FXML private TableColumn<Employee, String> colName;
    @FXML private TableColumn<Employee, String> colEmail;
    @FXML private TableColumn<Employee, String> colPhone;
    @FXML private TableColumn<Employee, String> colType;
    @FXML private TableColumn<Employee, String> colRank;

    // --- Data Lists ---
    private final ObservableList<Employee> employees = FXCollections.observableArrayList();
    private FilteredList<Employee> filteredData; // Wraps the list for searching

    // --- Injected Controllers ---
    @FXML private SidebarController sidebarController;
    @FXML private TopBarController topBarController;

    @FXML
    public void initialize() {
        // 1. Setup Columns
        colName.setCellValueFactory(data -> data.getValue().fullnameProperty());
        colEmail.setCellValueFactory(data -> data.getValue().emailProperty());
        colPhone.setCellValueFactory(data -> data.getValue().phoneProperty());
        colType.setCellValueFactory(data -> data.getValue().jobTypeProperty());
        colRank.setCellValueFactory(data -> data.getValue().rankProperty());

        // 2. Wrap the ObservableList in a FilteredList (initially display all data)
        filteredData = new FilteredList<>(employees, p -> true);

        // 3. Wrap the FilteredList in a SortedList (to allow sorting by clicking headers)
        SortedList<Employee> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(clientTable.comparatorProperty());

        // 4. Bind the table to the SortedList
        clientTable.setItems(sortedData);

        // 5. Load Data
        loadEmployees();

        // 6. Setup Sidebar
        if (sidebarController != null) {
            sidebarController.setActivePage("employees");
        }

        // 7. Setup TopBar (User Info + Search Logic)
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {

            // Set Page Title
            topBarController.setPageTitle("إدارة الصلاحيات");

            // Set User Info
            if (currentUser != null) {
                String name = currentUser.getName() != null ? currentUser.getName() : "مدير النظام";
                String id = currentUser.getId() != null ? "ID: " + currentUser.getId() : "";
                topBarController.setUserData(name, id);
            }

            // --- DYNAMIC SEARCH LOGIC ---
            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(employee -> {
                    // If filter text is empty, display all employees.
                    if (searchText == null || searchText.isEmpty()) {
                        return true;
                    }

                    String lowerCaseFilter = searchText.toLowerCase();

                    // Search by Name or Phone
                    if (employee.getFullname() != null && employee.getFullname().toLowerCase().contains(lowerCaseFilter)) {
                        return true; // Match Name
                    } else if (employee.getPhone() != null && employee.getPhone().contains(lowerCaseFilter)) {
                        return true; // Match Phone
                    }

                    return false; // No Match
                });
            });
        }
    }

    public void loadEmployees() {
        employees.clear(); // Automatically updates the table because of binding
        try (Connection conn = DatabaseConnection.connect()) {
            // We map 'clientType' db column to jobType and 'active' to rank/status
            String sql = "SELECT _id, fullname, email, phone, clientType, employeeType, active, password FROM users WHERE type='employee'";
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                // Determine job title: check employeeType first, fallback to clientType
                String jobTitle = rs.getString("employeeType");
                if (jobTitle == null || jobTitle.isBlank()) jobTitle = rs.getString("clientType");

                employees.add(new Employee(
                        rs.getString("_id"),
                        rs.getString("fullname"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        jobTitle,
                        rs.getBoolean("active"),
                        rs.getString("password")
                ));
            }
            // Note: clientTable.setItems(employees) is REMOVED because it's now bound to sortedData

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error loading employees: " + e.getMessage());
        }
    }

    // --- CRUD OPERATIONS ---

    @FXML
    public void addُEmployee(ActionEvent event) {
        Employee newEmployee = new Employee("", "", "", "", "", true, "");
        openEmployeePopup(newEmployee);
    }

    @FXML
    public void editEmployee(ActionEvent event) {
        Employee selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select an employee to edit.");
            return;
        }
        openEmployeePopup(selected);
    }

    private void openEmployeePopup(Employee employee) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/add-employee-popup.fxml"));
            Parent root = loader.load();

            EmployeePopupController popupController = loader.getController();
            popupController.loadEmployee(employee);

            Stage stage = new Stage();
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.setScene(new Scene(root));
            stage.setTitle(employee.getId().isBlank() ? "Add Employee" : "Edit Employee");
            stage.showAndWait();

            if (popupController.isSaved()) {

                if (employee.getId().isBlank()) {
                    // 1. ADD TO REMOTE DATABASE FIRST
                    String remoteId = RestMongoSyncClient.addEmployeeRemotely(employee);

                    if (remoteId != null && !remoteId.isBlank()) {
                        // 2. IF SUCCESS, ADD TO LOCAL DATABASE
                        employee.setId(remoteId);
                        insertLocalEmployee(employee);
                        employees.add(employee); // Updates UI
                        System.out.println("✔ Added Employee Remotely & Locally");
                    } else {
                        showAlert("Failed to add employee to the server. Please check your connection.");
                    }

                } else {
                    // Editing existing
                    updateLocalEmployee(employee);
                    System.out.println("✔ Updated Employee Remotely & Locally");
                    // No need to add to list, the object inside is updated
                }
                clientTable.refresh();
            }

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error: " + e.getMessage());
        }
    }

    @FXML
    public void deleteEmployee(ActionEvent event) {
        Employee selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select an employee to delete.");
            return;
        }

        // 1. DELETE FROM REMOTE DATABASE FIRST
        boolean remoteDeleted = RestMongoSyncClient.deleteUserRemotely(selected.getId());

        if (remoteDeleted) {
            // 2. DELETE FROM LOCAL DATABASE
            try (Connection conn = DatabaseConnection.connect()) {
                String sql = "DELETE FROM users WHERE _id = ?";
                PreparedStatement stmt = conn.prepareStatement(sql);
                stmt.setString(1, selected.getId());
                stmt.executeUpdate();

                employees.remove(selected); // Updates UI
                System.out.println("✔ Deleted Employee Remotely & Locally");

            } catch (Exception e) {
                e.printStackTrace();
                showAlert("Deleted from Server, but failed to delete locally: " + e.getMessage());
            }
        } else {
            showAlert("Failed to delete employee from server. Local delete aborted.");
        }
    }

    @FXML
    public void freezeEmployee(ActionEvent event) {
        Employee selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select an employee to freeze/unfreeze.");
            return;
        }

        boolean newStatus = !selected.isActive(); // The new desired status
        boolean originalStatus = selected.isActive(); // Keep backup in case of failure

        // 1. UPDATE OBJECT IN MEMORY (Needed to send correct JSON to server)
        selected.setActive(newStatus);

        // 2. SEND UPDATE TO REMOTE SERVER
        boolean success = RestMongoSyncClient.updateEmployeeRemotely(selected);

        if (success) {
            // 3. IF REMOTE SUCCESS, UPDATE LOCAL DATABASE
            try (Connection conn = DatabaseConnection.connect()) {
                // SQLite uses 1 for true, 0 for false
                String sql = "UPDATE users SET active = ? WHERE _id = ?";
                PreparedStatement stmt = conn.prepareStatement(sql);
                stmt.setInt(1, newStatus ? 1 : 0);
                stmt.setString(2, selected.getId());
                stmt.executeUpdate();

                clientTable.refresh();
                System.out.println("✔ Freeze/Unfreeze synced successfully.");

            } catch (Exception e) {
                e.printStackTrace();
                // REVERT: Remote worked but Local failed
                selected.setActive(originalStatus);
                showAlert("Failed to update local status: " + e.getMessage());
                clientTable.refresh();
            }
        } else {
            // REVERT: Remote failed, so we undo the change in memory
            selected.setActive(originalStatus);
            showAlert("Failed to sync status with server. Action cancelled.");
            clientTable.refresh();
        }
    }

    // --- DB HELPERS ---

    private void insertLocalEmployee(Employee emp) {
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "INSERT INTO users (fullname, email, phone, employeeType, clientType, password, type, active, createdAt, updatedAt, _id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 'employee', 1, ?, ?, ?)";
            PreparedStatement stmt = conn.prepareStatement(sql);

            long now = System.currentTimeMillis();
            stmt.setString(1, emp.getFullname());
            stmt.setString(2, emp.getEmail());
            stmt.setString(3, emp.getPhone());
            stmt.setString(4, emp.getJobType());
            stmt.setString(5, emp.getJobType());
            stmt.setString(6, emp.getPassword());
            stmt.setLong(7, now);
            stmt.setLong(8, now);
            stmt.setString(9, emp.getId());

            stmt.executeUpdate();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updateLocalEmployee(Employee emp) {
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "UPDATE users SET fullname=?, email=?, phone=?, employeeType=?, clientType=?, password=?, updatedAt=? WHERE _id=?";
            PreparedStatement stmt = conn.prepareStatement(sql);

            stmt.setString(1, emp.getFullname());
            stmt.setString(2, emp.getEmail());
            stmt.setString(3, emp.getPhone());
            stmt.setString(4, emp.getJobType());
            stmt.setString(5, emp.getJobType());
            stmt.setString(6, emp.getPassword());
            stmt.setLong(7, System.currentTimeMillis());
            stmt.setString(8, emp.getId());

            stmt.executeUpdate();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void showAlert(String msg) {
        Alert alert = new Alert(Alert.AlertType.WARNING);
        alert.setContentText(msg);
        alert.showAndWait();
    }

    // --- NAVIGATION ---
    @FXML
    public void onDashboardClick(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/dashboard.fxml");
    }

    @FXML
    public void onInvoiceManagementClick(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/client-data-invoice.fxml");
    }

    @FXML
    public void shipments_management_btn_handle(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/shipments-management.fxml");
    }

    public void client_management(ActionEvent event) throws IOException {
        navigate(event, "/noran/desktop/client-data.fxml");
    }

    private void navigate(ActionEvent event, String fxmlPath) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(new Scene(root));
        stage.show();
    }

    public void refresh(ActionEvent event) {

    }
}