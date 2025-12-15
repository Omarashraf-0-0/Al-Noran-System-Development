package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.concurrent.Task;
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
import noran.desktop.Database.MongoConnection; // Direct Mongo Access
import noran.desktop.models.Employee;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

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
        colRank.setCellValueFactory(data -> data.getValue().rankProperty()); // Assuming 'active' status is mapped here or rank logic

        // 2. Wrap the ObservableList
        filteredData = new FilteredList<>(employees, p -> true);
        SortedList<Employee> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(clientTable.comparatorProperty());
        clientTable.setItems(sortedData);

        // 3. Load Data from MongoDB
        loadEmployeesFromMongo();

        // 4. Setup Sidebar
        if (sidebarController != null) {
            sidebarController.setActivePage("employees");
        }

        // 5. Setup TopBar
        setupTopBar();
    }

    // ✅ 1. LOAD FROM MONGODB
    public void loadEmployeesFromMongo() {
        Task<List<Employee>> task = new Task<>() {
            @Override
            protected List<Employee> call() {
                List<Employee> list = new ArrayList<>();
                try {
                    MongoDatabase db = MongoConnection.getDatabase();
                    MongoCollection<Document> users = db.getCollection("users");

                    // Filter for type='employee'
                    for (Document doc : users.find(new Document("type", "employee"))) {
                        String id = doc.getObjectId("_id").toString();
                        String fullname = doc.getString("fullname");
                        String email = doc.getString("email");
                        String phone = doc.getString("phone");
                        boolean active = doc.getBoolean("active", true);
                        String password = doc.getString("password");

                        // Handle job title variations
                        String jobTitle = doc.getString("employeeType");
                        if (jobTitle == null || jobTitle.isBlank()) {
                            jobTitle = doc.getString("clientType"); // Fallback
                        }
                        if (jobTitle == null) jobTitle = "موظف";

                        list.add(new Employee(id, fullname, email, phone, jobTitle, active, password));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    Platform.runLater(() -> showAlert("Connection Error: " + e.getMessage()));
                }
                return list;
            }
        };

        task.setOnSucceeded(e -> {
            employees.setAll(task.getValue());
            clientTable.refresh();
        });

        new Thread(task).start();
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
                saveEmployeeToMongo(employee);
            }

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error: " + e.getMessage());
        }
    }

    // ✅ 2. SAVE (ADD/UPDATE) TO MONGODB
    private void saveEmployeeToMongo(Employee emp) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> users = db.getCollection("users");

            Document doc = new Document()
                    .append("fullname", emp.getFullname())
                    .append("username", emp.getFullname()) // Sync username
                    .append("email", emp.getEmail())
                    .append("phone", emp.getPhone())
                    .append("employeeType", emp.getJobType()) // Save job title
                    .append("type", "employee") // Enforce type
                    .append("active", emp.isActive())
                    .append("password", emp.getPassword());

            if (emp.getId() == null || emp.getId().isBlank()) {
                // INSERT
                doc.append("createdAt", new java.util.Date());
                users.insertOne(doc);
                System.out.println("✔ Inserted new employee");
            } else {
                // UPDATE
                doc.append("updatedAt", new java.util.Date());
                users.updateOne(
                        Filters.eq("_id", new ObjectId(emp.getId())),
                        new Document("$set", doc)
                );
                System.out.println("✔ Updated employee: " + emp.getId());
            }

            // Refresh UI
            loadEmployeesFromMongo();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Failed to save: " + e.getMessage());
        }
    }

    // ✅ 3. DELETE FROM MONGODB
    @FXML
    public void deleteEmployee(ActionEvent event) {
        Employee selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select an employee to delete.");
            return;
        }

        try {
            MongoDatabase db = MongoConnection.getDatabase();
            db.getCollection("users").deleteOne(Filters.eq("_id", new ObjectId(selected.getId())));

            employees.remove(selected);
            System.out.println("✔ Deleted employee: " + selected.getId());

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Failed to delete: " + e.getMessage());
        }
    }

    // ✅ 4. FREEZE (TOGGLE ACTIVE) IN MONGODB
    @FXML
    public void freezeEmployee(ActionEvent event) {
        Employee selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select an employee to freeze/unfreeze.");
            return;
        }

        boolean newStatus = !selected.isActive();

        try {
            MongoDatabase db = MongoConnection.getDatabase();
            db.getCollection("users").updateOne(
                    Filters.eq("_id", new ObjectId(selected.getId())),
                    Updates.set("active", newStatus)
            );

            // Update UI locally to reflect change immediately
            selected.setActive(newStatus);
            clientTable.refresh();
            System.out.println("✔ Employee status updated to: " + newStatus);

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Failed to update status: " + e.getMessage());
        }
    }

    private void showAlert(String msg) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setHeaderText(null);
        alert.setContentText(msg);
        alert.showAndWait();
    }

    public void refresh(ActionEvent event) {
        loadEmployeesFromMongo();
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
                    String lower = searchText.toLowerCase();
                    return (employee.getFullname() != null && employee.getFullname().toLowerCase().contains(lower)) ||
                            (employee.getPhone() != null && employee.getPhone().contains(lower));
                });
            });
        }
    }

    // Navigation methods...
    @FXML public void onDashboardClick(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/dashboard.fxml"); }
    @FXML public void onInvoiceManagementClick(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/client-data-invoice.fxml"); }
    @FXML public void client_management_btn_handle(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/client-data.fxml"); }
    @FXML public void shipments_management(ActionEvent event) throws IOException { navigate(event, "/noran/desktop/shipments-management.fxml"); }

    private void navigate(ActionEvent event, String fxmlPath) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
}