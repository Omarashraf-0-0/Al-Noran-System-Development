package noran.desktop.Controllers;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
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
import noran.desktop.Database.MongoConnection; // Your MongoDB Connection Class
import noran.desktop.models.Client;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

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

        // Load data directly from MongoDB
        loadClientsFromMongo();

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

    // ✅ 1. LOAD DIRECTLY FROM MONGODB
    public void loadClientsFromMongo() {
        Task<List<Client>> loadTask = new Task<>() {
            @Override
            protected List<Client> call() {
                List<Client> loadedList = new ArrayList<>();
                try {
                    MongoDatabase db = MongoConnection.getDatabase();
                    MongoCollection<Document> usersCol = db.getCollection("users");

                    // Filter only 'client' type users
                    for (Document doc : usersCol.find(new Document("type", "client"))) {
                        String id = doc.getObjectId("_id").toString();
                        String name = doc.getString("fullname");
                        String email = doc.getString("email");
                        String ssn = doc.getString("ssn"); // Or taxNumber depending on your schema
                        String phone = doc.getString("phone");
                        String clientType = doc.getString("clientType");
                        String password = doc.getString("password"); // If you need it

                        // Handle nulls safely
                        if (name == null) name = doc.getString("username");
                        if (ssn == null) ssn = doc.getString("taxNumber"); // Fallback
                        if (clientType == null) clientType = "Unknown";

                        loadedList.add(new Client(id, name, email, ssn, phone, clientType, password));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    Platform.runLater(() -> showAlert("Connection Error: " + e.getMessage()));
                }
                return loadedList;
            }
        };

        loadTask.setOnSucceeded(e -> {
            clients.setAll(loadTask.getValue());
            clientTable.refresh();
        });

        new Thread(loadTask).start();
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
        openClientPopup(selected);
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
            stage.setTitle(clientToEdit.getId() == null || clientToEdit.getId().isEmpty() ? "Add Client" : "Edit Client");
            stage.showAndWait();

            if (popupController.isSaved()) {
                saveClientToMongo(clientToEdit);
            }

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("حدث خطأ: " + e.getMessage());
        }
    }

    // ✅ 2. SAVE DIRECTLY TO MONGODB
    private void saveClientToMongo(Client client) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> usersCol = db.getCollection("users");

            Document doc = new Document()
                    .append("fullname", client.getFullname())
                    .append("username", client.getFullname()) // Keep username synced if needed
                    .append("email", client.getEmail())
                    .append("phone", client.getPhone())
                    .append("ssn", client.getSsn()) // Or taxNumber
                    .append("taxNumber", client.getSsn()) // Redundant safety
                    .append("clientType", client.getClientType())
                    .append("type", "client") // Force type to 'client'
                    .append("active", true)
                    .append("password", client.getPassword());

            if (client.getId() == null || client.getId().isEmpty()) {
                // INSERT NEW
                doc.append("createdAt", new java.util.Date());
                usersCol.insertOne(doc);
                System.out.println("✔ Inserted new client");
            } else {
                // UPDATE EXISTING
                doc.append("updatedAt", new java.util.Date());
                usersCol.updateOne(
                        Filters.eq("_id", new ObjectId(client.getId())),
                        new Document("$set", doc)
                );
                System.out.println("✔ Updated client: " + client.getId());
            }

            // Refresh Table
            loadClientsFromMongo();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("فشل الحفظ في قاعدة البيانات: " + e.getMessage());
        }
    }

    // ✅ 3. DELETE DIRECTLY FROM MONGODB
    @FXML
    private void deleteClient() {
        Client selected = clientTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            showAlert("Select a client to delete.");
            return;
        }

        try {
            MongoDatabase db = MongoConnection.getDatabase();
            db.getCollection("users").deleteOne(Filters.eq("_id", new ObjectId(selected.getId())));

            clients.remove(selected);
            System.out.println("✔ Deleted client: " + selected.getId());

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("فشل الحذف من الخادم: " + e.getMessage());
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
        loadClientsFromMongo();
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