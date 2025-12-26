package noran.desktop.Controllers;

import noran.desktop.Utils.AlertUtils;

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
import javafx.scene.layout.VBox;
import noran.desktop.AppSession;
import noran.desktop.Database.MongoConnection;
import noran.desktop.Utils.ComboBoxStyler;
import noran.desktop.models.Employee;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class EmployeeManagementController {

    @FXML
    private TableView<Employee> clientTable;
    @FXML
    private TableColumn<Employee, String> colName;
    @FXML
    private TableColumn<Employee, String> colEmail;
    @FXML
    private TableColumn<Employee, String> colPhone;
    @FXML
    private TableColumn<Employee, String> colType;
    @FXML
    private TableColumn<Employee, String> colRank;
    @FXML
    private javafx.scene.control.ComboBox<String> employeeTypeFilter;
    @FXML
    private javafx.scene.control.ComboBox<String> employeeStatusFilter;

    private final ObservableList<Employee> employees = FXCollections.observableArrayList();
    private FilteredList<Employee> filteredData;

    // Track current search text for combined filtering
    private String currentSearchText = "";

    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    @FXML
    public void initialize() {
        // 1. Setup Columns
        colName.setCellValueFactory(data -> data.getValue().fullnameProperty());
        colEmail.setCellValueFactory(data -> data.getValue().emailProperty());
        colPhone.setCellValueFactory(data -> data.getValue().phoneProperty());
        colType.setCellValueFactory(data -> data.getValue().jobTypeProperty());

        // Display "Active" or "Frozen" based on boolean
        colRank.setCellValueFactory(
                data -> new javafx.beans.property.SimpleStringProperty(data.getValue().isActive() ? "نشط" : "مجمد"));

        // 2. Setup Filter ComboBoxes
        setupFilters();

        // 3. Wrap List
        filteredData = new FilteredList<>(employees, p -> true);
        SortedList<Employee> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(clientTable.comparatorProperty());
        clientTable.setItems(sortedData);

        // 4. Load Data
        loadEmployeesFromMongo();

        if (sidebarController != null)
            sidebarController.setActivePage("employees");
        setupTopBar();
    }

    private void setupFilters() {
        // Initialize Employee Type Filter
        if (employeeTypeFilter != null) {
            employeeTypeFilter.setItems(FXCollections.observableArrayList(
                    "الكل", "مدخل بيانات", "موظف عمليات", "موظف مالي", "مسؤول"));
            employeeTypeFilter.setValue("الكل");
            employeeTypeFilter.valueProperty().addListener((obs, old, newVal) -> applyFilters());
            ComboBoxStyler.style(employeeTypeFilter);
        }

        // Initialize Employee Status Filter
        if (employeeStatusFilter != null) {
            employeeStatusFilter.setItems(FXCollections.observableArrayList("الكل", "نشط", "مجمد"));
            employeeStatusFilter.setValue("الكل");
            employeeStatusFilter.valueProperty().addListener((obs, old, newVal) -> applyFilters());
            ComboBoxStyler.style(employeeStatusFilter);
        }
    }

    private void applyFilters() {
        filteredData.setPredicate(employee -> {
            // 1. Type Filter
            String typeFilter = employeeTypeFilter != null ? employeeTypeFilter.getValue() : "الكل";
            if (typeFilter != null && !"الكل".equals(typeFilter)) {
                if (employee.getJobType() == null || !employee.getJobType().equals(typeFilter)) {
                    return false;
                }
            }

            // 2. Status Filter
            String statusFilter = employeeStatusFilter != null ? employeeStatusFilter.getValue() : "الكل";
            if (statusFilter != null && !"الكل".equals(statusFilter)) {
                boolean isActive = employee.isActive();
                if ("نشط".equals(statusFilter) && !isActive)
                    return false;
                if ("مجمد".equals(statusFilter) && isActive)
                    return false;
            }

            // 3. Search Filter
            if (currentSearchText != null && !currentSearchText.isEmpty()) {
                String lower = currentSearchText.toLowerCase();
                boolean matchesName = employee.getFullname() != null
                        && employee.getFullname().toLowerCase().contains(lower);
                boolean matchesPhone = employee.getPhone() != null && employee.getPhone().contains(lower);
                boolean matchesEmail = employee.getEmail() != null && employee.getEmail().toLowerCase().contains(lower);
                if (!matchesName && !matchesPhone && !matchesEmail) {
                    return false;
                }
            }

            return true;
        });
    }

    // ✅ 1. LOAD FROM MONGODB (Matching JSON Structure)
    public void loadEmployeesFromMongo() {
        // Show loading indicator
        clientTable.setPlaceholder(new javafx.scene.control.Label("جاري تحميل البيانات..."));

        Task<List<Employee>> task = new Task<>() {
            @Override
            protected List<Employee> call() {
                List<Employee> list = new ArrayList<>();
                try {
                    MongoDatabase db = MongoConnection.getDatabase();
                    MongoCollection<Document> users = db.getCollection("users");

                    // Filter only 'employee' type
                    for (Document doc : users.find(new Document("type", "employee"))) {
                        String id = doc.getObjectId("_id").toString();
                        String fullname = doc.getString("fullname");
                        String email = doc.getString("email");
                        String phone = doc.getString("phone");
                        boolean active = doc.getBoolean("active", true);
                        String password = doc.getString("password");

                        // 🛑 EXTRACT NESTED employeeDetails
                        String jobTitle = "موظف"; // Default
                        Document empDetails = (Document) doc.get("employeeDetails");

                        if (empDetails != null && empDetails.getString("employeeType") != null) {
                            jobTitle = empDetails.getString("employeeType");
                        } else if (doc.getString("clientType") != null) {
                            // Fallback for old data format
                            jobTitle = doc.getString("clientType");
                        }

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
            if (employees.isEmpty()) {
                clientTable.setPlaceholder(new javafx.scene.control.Label("لا توجد بيانات"));
            }
        });

        task.setOnFailed(e -> {
            clientTable.setPlaceholder(new javafx.scene.control.Label("خطأ في تحميل البيانات"));
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

    // -------------------------------------------------------------
    // REPLACE openEmployeePopup WITH THIS
    // -------------------------------------------------------------
    private void openEmployeePopup(Employee employee) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/add-employee-popup.fxml"));
            Parent root = loader.load();

            EmployeePopupController popupController = loader.getController();
            popupController.loadEmployee(employee);

            // ✅ PASS THE SAVE FUNCTION TO THE POPUP
            popupController.setSaveHandler(this::saveEmployeeToMongo);

            Stage stage = new Stage();
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.getIcons().add(
                    new javafx.scene.image.Image(getClass().getResourceAsStream("/noran/desktop/images/Logo.png")));
            stage.setScene(new Scene(root));
            stage.setTitle(employee.getId().isBlank() ? "Add Employee" : "Edit Employee");
            stage.showAndWait();

            // We don't need to check isSaved() here anymore because the saving
            // happens inside the popup flow now.

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error: " + e.getMessage());
        }
    }

    // -------------------------------------------------------------
    // REPLACE saveEmployeeToMongo WITH THIS (Returns Boolean)
    // -------------------------------------------------------------
    // ✅ 2. SAVE TO MONGODB (With Password Hashing)
    private boolean saveEmployeeToMongo(Employee emp) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> users = db.getCollection("users");

            // --- PASSWORD HASHING LOGIC ---
            String finalPassword = emp.getPassword();

            // Only hash if it exists AND it doesn't look like a Bcrypt hash already
            // (Prevents double-hashing when editing an employee without changing password)
            if (finalPassword != null && !finalPassword.isEmpty()) {
                if (!finalPassword.startsWith("$2b$") && !finalPassword.startsWith("$2a$")) {
                    finalPassword = BCrypt.hashpw(finalPassword, BCrypt.gensalt());
                    System.out.println("🔒 Password hashed successfully.");
                }
            }
            // -----------------------------

            Document employeeDetails = new Document()
                    .append("employeeType", emp.getJobType())
                    .append("verified", false)
                    .append("isOnline", false);

            Document doc = new Document()
                    .append("fullname", emp.getFullname())
                    .append("username", emp.getFullname().replaceAll("\\s+", "").toLowerCase())
                    .append("email", emp.getEmail())
                    .append("phone", emp.getPhone())
                    .append("password", finalPassword) // ✅ Save HASHED password
                    .append("type", "employee")
                    .append("active", emp.isActive())
                    .append("employeeDetails", employeeDetails)
                    .append("clientDetails", new Document("clientType", null).append("ssn", ""));

            if (emp.getId() == null || emp.getId().isBlank()) {
                // INSERT
                doc.append("createdAt", new Date());
                doc.append("updatedAt", new Date());
                doc.append("__v", 0);
                users.insertOne(doc);
                System.out.println("✔ Inserted new employee");
            } else {
                // UPDATE
                doc.append("updatedAt", new Date());
                users.updateOne(
                        Filters.eq("_id", new ObjectId(emp.getId())),
                        new Document("$set", doc));
                System.out.println("✔ Updated employee: " + emp.getId());
            }

            loadEmployeesFromMongo();
            return true; // ✅ Success

        } catch (com.mongodb.MongoWriteException e) {
            // 🛑 HANDLE DUPLICATE (Pop-up stays open)
            if (e.getError().getCode() == 11000) {
                String msg = e.getMessage();
                if (msg.contains("phone")) {
                    showAlert("تنبيه: رقم الهاتف (" + emp.getPhone() + ") مسجل بالفعل لموظف آخر.");
                } else if (msg.contains("email")) {
                    showAlert("تنبيه: البريد الإلكتروني (" + emp.getEmail() + ") مسجل بالفعل.");
                } else {
                    showAlert("تنبيه: توجد بيانات مكررة (هاتف أو إيميل).");
                }
            } else {
                e.printStackTrace();
                showAlert("خطأ قاعدة بيانات: " + e.getMessage());
            }
            return false; // ❌ Fail

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("فشل الحفظ: " + e.getMessage());
            return false; // ❌ Fail
        }
    }

    // ✅ 3. DELETE
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

    // ✅ 4. FREEZE
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
                    Updates.set("active", newStatus));

            selected.setActive(newStatus);
            clientTable.refresh();
            System.out.println("✔ Employee status updated to: " + newStatus);

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Failed to update status: " + e.getMessage());
        }
    }

    private void showAlert(String msg) {
        AlertUtils.showInfo("إشعار", msg);
    }

    public void refresh(ActionEvent event) {
        loadEmployeesFromMongo();
    }

    // --- NAVIGATION ---
    private void setupTopBar() {
        User currentUser = AppSession.getInstance().getCurrentUser();
        if (topBarController != null) {
            topBarController.setPageTitle("إدارة الموظفين");
            topBarController.setSidebar(sidebar);
            topBarController.setSearchPlaceholder("البحث بالاسم، الهاتف، أو الإيميل...");
            if (currentUser != null) {
                String name = currentUser.getName() != null ? currentUser.getName() : "مدير النظام";
                String email = currentUser.getEmail() != null ? currentUser.getEmail() : "";
                topBarController.setUserData(name, email);
            }

            topBarController.setOnSearchAction(searchText -> {
                currentSearchText = searchText;
                applyFilters();
            });
        }
    }

}