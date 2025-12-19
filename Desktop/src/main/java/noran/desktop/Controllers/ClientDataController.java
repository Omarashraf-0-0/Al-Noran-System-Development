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
import javafx.scene.layout.VBox;
import noran.desktop.AppSession;
import noran.desktop.Database.MongoConnection;
import noran.desktop.models.Client;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class ClientDataController {

    @FXML
    private TableView<Client> clientTable;
    @FXML
    private TableColumn<Client, String> colName;
    @FXML
    private TableColumn<Client, String> colEmail;
    @FXML
    private TableColumn<Client, String> colSSN;
    @FXML
    private TableColumn<Client, String> colPhone;
    @FXML
    private TableColumn<Client, String> colType;

    private final ObservableList<Client> clients = FXCollections.observableArrayList();
    private FilteredList<Client> filteredData;

    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    @FXML
    public void initialize() {
        setupTable();
        loadClientsFromMongo();

        if (sidebarController != null)
            sidebarController.setActivePage("clients");
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

    // ✅ 1. LOAD FROM MONGODB
    public void loadClientsFromMongo() {
        Task<List<Client>> loadTask = new Task<>() {
            @Override
            protected List<Client> call() {
                List<Client> loadedList = new ArrayList<>();
                try {
                    MongoDatabase db = MongoConnection.getDatabase();
                    MongoCollection<Document> usersCol = db.getCollection("users");

                    for (Document doc : usersCol.find(new Document("type", "client"))) {
                        String id = doc.getObjectId("_id").toString();
                        String name = doc.getString("fullname");
                        String email = doc.getString("email");
                        String phone = doc.getString("phone");
                        String password = doc.getString("password");

                        String ssn = "";
                        String clientType = "Unknown";

                        Document clientDetails = (Document) doc.get("clientDetails");
                        if (clientDetails != null) {
                            ssn = clientDetails.getString("ssn");
                            clientType = clientDetails.getString("clientType");
                        } else {
                            ssn = doc.getString("ssn");
                            if (ssn == null)
                                ssn = doc.getString("taxNumber");
                            clientType = doc.getString("clientType");
                        }

                        if (name == null)
                            name = doc.getString("username");
                        if (ssn == null)
                            ssn = "-";
                        if (clientType == null)
                            clientType = "Personal";

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

            // ✅ PASS SAVE HANDLER TO POPUP
            popupController.setSaveHandler(this::saveClientToMongo);

            Stage stage = new Stage();
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.setScene(new Scene(root));
            stage.setTitle(
                    clientToEdit.getId() == null || clientToEdit.getId().isEmpty() ? "Add Client" : "Edit Client");
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("حدث خطأ: " + e.getMessage());
        }
    }

    // ✅ 2. SAVE TO MONGODB (Return Boolean + Handle Duplicates)
    // ✅ 2. SAVE TO MONGODB (With Password Hashing)
    private boolean saveClientToMongo(Client client) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> usersCol = db.getCollection("users");

            // --- PASSWORD HASHING LOGIC ---
            String finalPassword = client.getPassword();

            // Only hash if it exists AND it doesn't look like a Bcrypt hash already
            // (Prevents double-hashing when editing a user without changing password)
            if (finalPassword != null && !finalPassword.isEmpty()) {
                if (!finalPassword.startsWith("$2b$") && !finalPassword.startsWith("$2a$")) {
                    finalPassword = BCrypt.hashpw(finalPassword, BCrypt.gensalt());
                    System.out.println("🔒 Password hashed successfully.");
                }
            }
            // -----------------------------

            Document clientDetails = new Document()
                    .append("clientType", client.getClientType())
                    .append("ssn", client.getSsn());

            Document employeeDetails = new Document()
                    .append("employeeType", null)
                    .append("verified", false)
                    .append("isOnline", false);

            Document doc = new Document()
                    .append("fullname", client.getFullname())
                    .append("username", client.getFullname().replaceAll("\\s+", "").toLowerCase())
                    .append("email", client.getEmail())
                    .append("phone", client.getPhone())
                    .append("type", "client")
                    .append("active", true)
                    .append("password", finalPassword) // ✅ Save the HASHED password
                    .append("clientDetails", clientDetails)
                    .append("employeeDetails", employeeDetails);

            if (client.getId() == null || client.getId().isEmpty()) {
                // INSERT
                doc.append("createdAt", new Date());
                doc.append("updatedAt", new Date());
                doc.append("__v", 0);
                usersCol.insertOne(doc);
                System.out.println("✔ Inserted new client");
            } else {
                // UPDATE
                doc.append("updatedAt", new Date());
                usersCol.updateOne(
                        Filters.eq("_id", new ObjectId(client.getId())),
                        new Document("$set", doc));
                System.out.println("✔ Updated client: " + client.getId());
            }

            loadClientsFromMongo();
            return true; // ✅ Success

        } catch (com.mongodb.MongoWriteException e) {
            // 🛑 HANDLE DUPLICATE (Pop-up stays open)
            if (e.getError().getCode() == 11000) {
                String msg = e.getMessage();
                if (msg.contains("phone")) {
                    showAlert("تنبيه: رقم الهاتف (" + client.getPhone() + ") مسجل بالفعل لعميل آخر.");
                } else if (msg.contains("email")) {
                    showAlert("تنبيه: البريد الإلكتروني (" + client.getEmail() + ") مسجل بالفعل.");
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
            topBarController.setSidebar(sidebar);
            if (currentUser != null) {
                topBarController.setUserData(currentUser.getName(),
                        currentUser.getEmail() != null ? currentUser.getEmail() : "");
            }

            topBarController.setOnSearchAction(searchText -> {
                filteredData.setPredicate(client -> {
                    if (searchText == null || searchText.isEmpty())
                        return true;
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

}