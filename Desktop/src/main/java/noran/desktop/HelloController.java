package noran.desktop;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ListChangeListener;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.GridPane;
import javafx.stage.Stage;
import noran.desktop.AppSession;
import noran.desktop.Controllers.SidebarController;
import noran.desktop.Controllers.TopBarController;
import noran.desktop.Controllers.User;
import noran.desktop.Database.MongoConnection;
import noran.desktop.models.InvoiceItem;
import noran.desktop.models.Shipment;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.io.IOException;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.*;

public class HelloController implements Initializable {

    @FXML private Label clientNameLabel;
    @FXML private Label taxNumberLabel;
    @FXML private Label invoiceNumberLabel;
    @FXML private Label invoiceDateLabel;
    @FXML private ComboBox<Shipment> clientShipmentComboBox;

    @FXML private TableView<InvoiceItem> invoicesTable;
    @FXML private TableColumn<InvoiceItem, String> colDescription;
    @FXML private TableColumn<InvoiceItem, String> colPrice;
    @FXML private TableColumn<InvoiceItem, String> colDate; // Currency Column
    @FXML private Label totalCost1;

    private final ObservableList<Shipment> shipmentList = FXCollections.observableArrayList();
    private final ObservableList<InvoiceItem> invoiceItems = FXCollections.observableArrayList();
    private FilteredList<InvoiceItem> filteredData;

    private String selectedClientId;
    private Shipment selectedShipment;

    @FXML private SidebarController sidebarController;
    @FXML private TopBarController topBarController;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        setupTable();
        setupComboBox();

        invoiceItems.addListener((ListChangeListener<InvoiceItem>) c -> updateTotal());
        invoiceDateLabel.setText("التاريخ: " + new SimpleDateFormat("dd/MM/yyyy").format(new Date()));

        if (sidebarController != null) sidebarController.setActivePage("invoices");
        setupTopBar();
    }

    private void setupTable() {
        colDescription.setCellValueFactory(new PropertyValueFactory<>("description"));

        // Format Price
        colPrice.setCellValueFactory(cellData ->
                new SimpleStringProperty(String.format("%.2f", cellData.getValue().getPrice())));

        // Currency
        colDate.setText("العملة");
        colDate.setCellValueFactory(new PropertyValueFactory<>("currency"));

        filteredData = new FilteredList<>(invoiceItems, p -> true);
        SortedList<InvoiceItem> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(invoicesTable.comparatorProperty());
        invoicesTable.setItems(sortedData);
    }

    private void setupComboBox() {
        clientShipmentComboBox.setItems(shipmentList);
        clientShipmentComboBox.getSelectionModel().selectedItemProperty().addListener((obs, old, newVal) -> {
            if (newVal != null) {
                selectedShipment = newVal;
                prepareInvoiceHeader(newVal);
            }
        });
    }

    public void setSelectedClient(String name, String taxNumber, String clientType, String id, String rank) {
        if (id != null) id = id.trim();
        this.selectedClientId = id;

        clientNameLabel.setText("اسم العميل: " + (name != null ? name : "غير محدد"));
        taxNumberLabel.setText("الرقم الضريبي: " + (taxNumber != null && !taxNumber.equals("-") ? taxNumber : "غير متوفر"));

        invoiceItems.clear();
        shipmentList.clear();
        updateTotal();

        if (id != null && !id.isEmpty()) {
            loadShipmentsFromMongo(id);
        } else {
            clientShipmentComboBox.setPromptText("لا توجد شحنات لهذا العميل");
        }
    }

    // ✅ 1. Load Shipments from MongoDB
    private void loadShipmentsFromMongo(String clientId) {
        shipmentList.clear();
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("shipments");

            // Find shipments for this user
            List<Document> found = collection.find(new Document("user_id", new ObjectId(clientId))).into(new ArrayList<>());

            for (Document doc : found) {
                String id = doc.getObjectId("_id").toString();

                // 🛑 FIX: Extract ACID from MongoDB
                String acid = doc.getString("acid");
                if (acid == null) acid = "غير محدد"; // Fallback if missing

                String port = doc.getString("port_name");
                int num = doc.getInteger("num_of_containers", 0);
                String status = doc.getString("status");

                // 🛑 FIX: Pass the 'acid' variable (4th argument) instead of ""
                Shipment s = new Shipment(id, clientId, "Client", acid, port, "", status, num, "");

                shipmentList.add(s);
            }
        } catch (Exception e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "خطأ في تحميل الشحنات: " + e.getMessage()).show();
        }
        clientShipmentComboBox.setPromptText(shipmentList.isEmpty() ? "لا توجد شحنات" : "اختر الشحنة");
    }
    private void prepareInvoiceHeader(Shipment shipment) {
        invoiceItems.clear();
        // Generate Invoice Number (Example: INV-LAST6DIGITS)
        String shortId = shipment.getId().substring(Math.max(0, shipment.getId().length() - 6));
        invoiceNumberLabel.setText("INV-" + shortId.toUpperCase());
        updateTotal();
    }

    @FXML
    public void addNewInvoiceRow() {
        Dialog<InvoiceItem> dialog = new Dialog<>();
        dialog.setTitle("إضافة بند للفاتورة");
        dialog.setHeaderText("أدخل تفاصيل البند");

        ButtonType loginButtonType = new ButtonType("إضافة", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(loginButtonType, ButtonType.CANCEL);

        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 150, 10, 10));

        TextField nameField = new TextField();
        nameField.setPromptText("اسم البند / الخدمة");

        TextField priceField = new TextField();
        priceField.setPromptText("السعر");

        ComboBox<String> currencyCombo = new ComboBox<>();
        currencyCombo.getItems().addAll("EGP", "USD");
        currencyCombo.setValue("EGP");

        grid.add(new Label("البند:"), 0, 0);
        grid.add(nameField, 1, 0);
        grid.add(new Label("السعر:"), 0, 1);
        grid.add(priceField, 1, 1);
        grid.add(new Label("العملة:"), 0, 2);
        grid.add(currencyCombo, 1, 2);

        dialog.getDialogPane().setContent(grid);

        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == loginButtonType) {
                try {
                    String name = nameField.getText();
                    double price = Double.parseDouble(priceField.getText());
                    String curr = currencyCombo.getValue();
                    return new InvoiceItem(name, price, curr, "Manual");
                } catch (NumberFormatException e) {
                    return null;
                }
            }
            return null;
        });

        Optional<InvoiceItem> result = dialog.showAndWait();
        result.ifPresent(item -> {
            invoiceItems.add(item);
            updateTotal();
        });
    }

    @FXML
    public void deleteSelectedRow() {
        InvoiceItem selected = invoicesTable.getSelectionModel().getSelectedItem();
        if (selected != null) {
            invoiceItems.remove(selected);
            updateTotal();
        }
    }

    private void updateTotal() {
        double totalEGP = 0;
        double totalUSD = 0;

        for (InvoiceItem item : invoiceItems) {
            if ("USD".equals(item.getCurrency())) {
                totalUSD += item.getPrice();
            } else {
                totalEGP += item.getPrice();
            }
        }

        StringBuilder sb = new StringBuilder("المجموع: ");
        if (totalEGP > 0) sb.append(String.format("%.2f EGP", totalEGP));
        if (totalEGP > 0 && totalUSD > 0) sb.append(" + ");
        if (totalUSD > 0) sb.append(String.format("%.2f USD", totalUSD));

        if (totalEGP == 0 && totalUSD == 0) sb.append("0.00");

        totalCost1.setText(sb.toString());
    }

    // 🛑 KEY METHOD: SEND TO MONGODB 🛑
    @FXML
    private void sendInvoiceToDatabase() {
        if (selectedShipment == null || invoiceItems.isEmpty()) {
            new Alert(Alert.AlertType.WARNING, "يجب اختيار شحنة وإضافة بنود أولاً").show();
            return;
        }

        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> invoicesCol = db.getCollection("invoices");

            String invoiceNum = invoiceNumberLabel.getText().replace("رقم الفاتورة: ", "");
            User currentUser = AppSession.getInstance().getCurrentUser();
            String employeeIdStr = (currentUser != null) ? currentUser.getId() : "";
            String username = (currentUser != null) ? currentUser.getName() : "Unknown";

            // 1. Prepare Items Array
            List<Document> itemsDocs = new ArrayList<>();
            for (InvoiceItem item : invoiceItems) {
                Document itemDoc = new Document()
                        .append("item", item.getDescription())
                        .append("itemPrice", item.getPrice())
                        .append("currencyType", item.getCurrency());
                itemsDocs.add(itemDoc);
            }

            // 2. Create Invoice Document
            Document invoiceDoc = new Document()
                    .append("invoiceNumber", invoiceNum)
                    .append("userId", new ObjectId(selectedClientId))
                    .append("shipmentId", new ObjectId(selectedShipment.getId()))
                    .append("employeeId", !employeeIdStr.isEmpty() ? new ObjectId(employeeIdStr) : null)
                    .append("username", username)
                    .append("invoiceItems", itemsDocs) // Array of items
                    .append("status", "في انتظار الموافقة") // Status as requested
                    .append("createdAt", new Date())
                    .append("updatedAt", new Date());

            // 3. Insert into MongoDB
            invoicesCol.insertOne(invoiceDoc);

            // 4. Update Shipment Status (Optional)
            MongoCollection<Document> shipmentsCol = db.getCollection("shipments");
            shipmentsCol.updateOne(
                    new Document("_id", new ObjectId(selectedShipment.getId())),
                    new Document("$set", new Document("is_invoiced", true))
            );

            new Alert(Alert.AlertType.INFORMATION, "تم إرسال الفاتورة للموافقة بنجاح").show();

            // Navigate back to client list or clear form
            onInvoiceManagementClick(null);

        } catch (Exception e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "فشل الحفظ: " + e.getMessage()).show();
        }
    }

    // Navigation Logic
    private void setupTopBar() {
        if (topBarController != null) {
            topBarController.setPageTitle("إنشاء فاتورة");
            User u = AppSession.getInstance().getCurrentUser();
            if(u != null) topBarController.setUserData(u.getName(), "ID: " + u.getId());
        }
    }

    @FXML public void onDashboardClick(ActionEvent e) throws Exception { navigate(e, "/noran/desktop/dashboard.fxml"); }
    // This goes back to the client selection list
    @FXML public void onInvoiceManagementClick(ActionEvent e) throws IOException { navigate(e, "/noran/desktop/client-data-invoice.fxml"); }

    private void navigate(ActionEvent event, String fxml) throws IOException {
        if (event == null) return; // Guard clause
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxml));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(new Scene(root));
        stage.show();
    }

    @FXML public void refresh(ActionEvent event) {}
    @FXML private void onSearch(ActionEvent e) {}
    @FXML private void downloadInvoicePDF() {}
}