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
    private FilteredList<Employee> filteredData;

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

        // 2. Wrap the ObservableList
        filteredData = new FilteredList<>(employees, p -> true);
        SortedList<Employee> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(clientTable.comparatorProperty());
        clientTable.setItems(sortedData);

        // 3. Load Data (Syncs automatically)
        loadEmployees();

        // 4. Setup Sidebar
        if (sidebarController != null) {
            sidebarController.setActivePage("employees");
        }

        // 5. Setup TopBar
        setupTopBar();
    }

    public void loadEmployees() {
        // ✅ STEP 1: Sync Local DB with Remote Server First
        try {
            System.out.println("🔄 Syncing local database with remote server...");
            RestMongoSyncClient.syncUsersWithRemote();
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("⚠ Sync failed. Loading existing local data only.");
        }

        // ✅ STEP 2: Clear old UI data
        employees.clear();

        // ✅ STEP 3: Load fresh data from SQLite
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "SELECT _id, fullname, email, phone, clientType, employeeType, active, password FROM users WHERE type='employee'";
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
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

        // 🛑 Create a COPY of the employee so we don't modify the table directly
        Employee tempEmployee = new Employee(
                selected.getId(),
                selected.getFullname(),
                selected.getEmail(),
                selected.getPhone(),
                selected.getJobType(),
                selected.isActive(),
                selected.getPassword()
        );

        openEmployeePopup(tempEmployee);
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
                handleRemoteSave(employee);
            }

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error: " + e.getMessage());
        }
    }

    /**
     * ✅ REMOTE FIRST SAVE LOGIC
     */
    private void handleRemoteSave(Employee employee) {
        boolean success = false;
        String operation = "";

        if (employee.getId() == null || employee.getId().isBlank()) {
            operation = "add";
            // Uses addEmployeeRemotely which returns the new ID
            String remoteId = RestMongoSyncClient.addEmployeeRemotely(employee);
            success = (remoteId != null && !remoteId.isBlank());
        } else {
            operation = "update";
            // Uses updateEmployeeRemotely (Self-Healing version)
            success = RestMongoSyncClient.updateEmployeeRemotely(employee);
        }

        if (success) {
            System.out.println("✔ Remote " + operation + " successful.");
            // loadEmployees() handles the sync and refresh
            loadEmployees();
            clientTable.refresh();
        } else {
            showAlert("فشل الاتصال بالخادم. لم يتم حفظ البيانات.");
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
            System.out.println("✔ Remote delete successful.");
            // Sync & Reload handles local deletion
            loadEmployees();
        } else {
            showAlert("Failed to delete employee from server.");
        }
    }

    @FXML
    public void freezeEmployee(ActionEvent event) {
        Employee selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select an employee to freeze/unfreeze.");
            return;
        }

        boolean originalStatus = selected.isActive();
        boolean newStatus = !originalStatus;

        // Create temp copy for update
        Employee tempEmp = new Employee(
                selected.getId(),
                selected.getFullname(),
                selected.getEmail(),
                selected.getPhone(),
                selected.getJobType(),
                newStatus, // Apply new status
                selected.getPassword()
        );

        // Send update to server
        boolean success = RestMongoSyncClient.updateEmployeeRemotely(tempEmp);

        if (success) {
            // Sync and reload to get the official change
            loadEmployees();
            System.out.println("✔ Freeze/Unfreeze synced successfully.");
        } else {
            showAlert("Failed to sync status with server.");
        }
    }

    private void showAlert(String msg) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setHeaderText(null);
        alert.setContentText(msg);
        alert.showAndWait();
    }

    public void refresh(ActionEvent event) {
        loadEmployees();
    }

    // --- NAVIGATION ---
    private void setupTopBar() {
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {
            topBarController.setPageTitle("إدارة الصلاحيات");
            if (currentUser != null) {
                String name = currentUser.getName() != null ? currentUser.getName() : "مدير النظام";
                String id = currentUser.getId() != null ? "ID: " + currentUser.getId() : "";
                topBarController.setUserData(name, id);
            }

            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(employee -> {
                    if (searchText == null || searchText.isEmpty()) return true;
                    String lowerCaseFilter = searchText.toLowerCase();
                    if (employee.getFullname() != null && employee.getFullname().toLowerCase().contains(lowerCaseFilter)) return true;
                    if (employee.getPhone() != null && employee.getPhone().contains(lowerCaseFilter)) return true;
                    return false;
                });
            });
        }
    }

}