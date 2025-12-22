package noran.desktop;

import noran.desktop.Utils.AlertUtils;

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
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.VBox;
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

    @FXML
    private Label clientNameLabel;
    @FXML
    private Label taxNumberLabel;
    @FXML
    private Label invoiceNumberLabel;
    @FXML
    private Label invoiceDateLabel;
    @FXML
    private ComboBox<Shipment> clientShipmentComboBox;

    @FXML
    private TableView<InvoiceItem> invoicesTable;
    @FXML
    private TableColumn<InvoiceItem, String> colDescription;
    @FXML
    private TableColumn<InvoiceItem, String> colPrice;
    @FXML
    private TableColumn<InvoiceItem, String> colDate; // Currency Column
    @FXML
    private Label totalCost1;

    private final ObservableList<Shipment> shipmentList = FXCollections.observableArrayList();
    private final ObservableList<InvoiceItem> invoiceItems = FXCollections.observableArrayList();
    private FilteredList<InvoiceItem> filteredData;

    private String selectedClientId;
    private Shipment selectedShipment;

    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        setupTable();
        setupComboBox();

        invoiceItems.addListener((ListChangeListener<InvoiceItem>) c -> updateTotal());
        invoiceDateLabel.setText(new SimpleDateFormat("dd/MM/yyyy").format(new Date()));

        if (sidebarController != null)
            sidebarController.setActivePage("invoices");
        setupTopBar();
    }

    private void setupTable() {
        colDescription.setCellValueFactory(new PropertyValueFactory<>("description"));

        // Format Price
        colPrice.setCellValueFactory(
                cellData -> new SimpleStringProperty(String.format("%.2f", cellData.getValue().getPrice())));

        // Currency
        colDate.setText("العملة");
        colDate.setCellValueFactory(new PropertyValueFactory<>("currency"));

        // Set Arabic placeholder for empty table
        invoicesTable.setPlaceholder(new javafx.scene.control.Label("لا توجد بنود للعرض"));

        filteredData = new FilteredList<>(invoiceItems, p -> true);
        SortedList<InvoiceItem> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(invoicesTable.comparatorProperty());
        invoicesTable.setItems(sortedData);

        // Auto-resize columns
        invoicesTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
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
        if (id != null)
            id = id.trim();
        this.selectedClientId = id;

        clientNameLabel.setText(name != null ? name : "غير محدد");
        taxNumberLabel
                .setText(taxNumber != null && !taxNumber.equals("-") ? taxNumber : "غير متوفر");

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
            List<Document> found = collection.find(new Document("user_id", new ObjectId(clientId)))
                    .into(new ArrayList<>());

            for (Document doc : found) {
                String id = doc.getObjectId("_id").toString();

                // 🛑 FIX: Extract ACID from MongoDB
                String acid = doc.getString("acid");
                if (acid == null)
                    acid = "غير محدد"; // Fallback if missing

                String port = doc.getString("port_name");
                int num = doc.getInteger("num_of_containers", 0);
                String status = doc.getString("status");

                // 🛑 FIX: Pass the 'acid' variable (4th argument) instead of ""
                Shipment s = new Shipment(id, clientId, "Client", acid, port, "", status, num, "");

                shipmentList.add(s);
            }
        } catch (Exception e) {
            e.printStackTrace();
            AlertUtils.showError("خطأ", "خطأ في تحميل الشحنات: " + e.getMessage());
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
        // Create modern styled dialog
        Dialog<InvoiceItem> dialog = new Dialog<>();
        dialog.setTitle("إضافة بند للفاتورة");
        dialog.setHeaderText(null);

        // Set dialog window icon when shown
        dialog.setOnShown(event -> {
            try {
                javafx.stage.Stage dialogStage = (javafx.stage.Stage) dialog.getDialogPane().getScene().getWindow();
                if (dialogStage != null) {
                    dialogStage.getIcons().add(new javafx.scene.image.Image(
                            getClass().getResourceAsStream("/noran/desktop/images/Logo.png")));
                }
            } catch (Exception e) {
                System.out.println("Could not set dialog icon: " + e.getMessage());
            }
        });

        // Get the dialog pane and style it
        DialogPane dialogPane = dialog.getDialogPane();
        dialogPane.setStyle(
                "-fx-background-color: #f8f9fa; " +
                        "-fx-font-family: 'Segoe UI', 'Noto Sans Arabic', system-ui;");
        dialogPane.setPrefWidth(450);

        // Create custom button types
        ButtonType addBtn = new ButtonType("إضافة", ButtonBar.ButtonData.OK_DONE);
        dialogPane.getButtonTypes().addAll(addBtn, ButtonType.CANCEL);

        // Style the buttons
        javafx.scene.Node addButton = dialogPane.lookupButton(addBtn);
        addButton.setStyle(
                "-fx-background-color: linear-gradient(to bottom, #a40000, #690000); " +
                        "-fx-text-fill: white; " +
                        "-fx-font-weight: bold; " +
                        "-fx-font-size: 14px; " +
                        "-fx-padding: 10 30; " +
                        "-fx-background-radius: 8; " +
                        "-fx-cursor: hand;");

        javafx.scene.Node cancelButton = dialogPane.lookupButton(ButtonType.CANCEL);
        cancelButton.setStyle(
                "-fx-background-color: #e5e7eb; " +
                        "-fx-text-fill: #374151; " +
                        "-fx-font-weight: bold; " +
                        "-fx-font-size: 14px; " +
                        "-fx-padding: 10 30; " +
                        "-fx-background-radius: 8; " +
                        "-fx-cursor: hand;");

        // Main container
        VBox mainContainer = new VBox(18);
        mainContainer.setStyle("-fx-padding: 25; -fx-background-color: white; -fx-background-radius: 16;");
        mainContainer.setAlignment(javafx.geometry.Pos.CENTER);

        // Logo Image
        javafx.scene.image.ImageView logoView = new javafx.scene.image.ImageView();
        try {
            javafx.scene.image.Image logo = new javafx.scene.image.Image(
                    getClass().getResourceAsStream("/noran/desktop/images/Logo.png"));
            logoView.setImage(logo);
            logoView.setFitWidth(120);
            logoView.setPreserveRatio(true);
        } catch (Exception e) {
            System.out.println("Could not load logo: " + e.getMessage());
        }

        // Header with title
        Label titleLabel = new Label("أدخل تفاصيل البند");
        titleLabel.setStyle(
                "-fx-font-size: 20; " +
                        "-fx-font-weight: bold; " +
                        "-fx-text-fill: #a40000;");

        // Create styled text fields
        TextField descField = createStyledTextField("اسم البند / الخدمة");
        TextField priceField = createStyledTextField("السعر");

        // Currency ComboBox with modern style
        ComboBox<String> currencyBox = new ComboBox<>();
        currencyBox.getItems().addAll("EGP", "USD");
        currencyBox.setValue("EGP");
        currencyBox.setPrefWidth(Double.MAX_VALUE);
        currencyBox.setPrefHeight(45);
        styleComboBox(currencyBox);

        // Currency container with label
        VBox currencyContainer = new VBox(8);
        javafx.scene.layout.HBox currencyLabelBox = new javafx.scene.layout.HBox(8);
        currencyLabelBox.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
        Label currencyIcon = new Label("💵");
        currencyIcon.setStyle("-fx-font-size: 16;");
        Label currencyLabel = new Label("العملة");
        currencyLabel.setStyle("-fx-font-size: 14; -fx-text-fill: #6b7280; -fx-font-weight: 600;");
        currencyLabelBox.getChildren().addAll(currencyLabel, currencyIcon);
        currencyContainer.getChildren().addAll(currencyLabelBox, currencyBox);

        // Keyboard navigation
        descField.setOnAction(e -> priceField.requestFocus());
        priceField.setOnAction(e -> currencyBox.requestFocus());

        // Info tip
        Label tipLabel = new Label("💡 اضغط Enter للانتقال بين الحقول");
        tipLabel.setStyle(
                "-fx-font-size: 12; " +
                        "-fx-text-fill: #9ca3af; " +
                        "-fx-padding: 10 0 0 0;");

        // Add all components
        mainContainer.getChildren().addAll(
                logoView,
                titleLabel,
                new Separator(),
                descField,
                priceField,
                currencyContainer,
                tipLabel);

        dialogPane.setContent(mainContainer);

        // Focus on description field
        javafx.application.Platform.runLater(descField::requestFocus);

        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == addBtn) {
                try {
                    String desc = descField.getText().trim();
                    String priceText = priceField.getText().trim();

                    if (desc.isEmpty() || priceText.isEmpty()) {
                        showStyledAlert("تنبيه", "يرجى ملء جميع الحقول", "#f59e0b");
                        return null;
                    }

                    return new InvoiceItem(
                            desc,
                            Double.parseDouble(priceText),
                            currencyBox.getValue(),
                            "Manual");
                } catch (NumberFormatException e) {
                    showStyledAlert("خطأ", "السعر يجب أن يكون رقماً صحيحاً", "#a40000");
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

    // Helper method to create styled text field
    private TextField createStyledTextField(String prompt) {
        TextField field = new TextField();
        field.setPromptText(prompt);
        String defaultStyle = "-fx-background-color: white; " +
                "-fx-border-color: #d1d5db; " +
                "-fx-border-radius: 10; " +
                "-fx-background-radius: 10; " +
                "-fx-padding: 12 16; " +
                "-fx-font-size: 14px; " +
                "-fx-prompt-text-fill: #9ca3af;";
        field.setStyle(defaultStyle);
        field.setPrefWidth(350);

        // Add focus styling
        field.focusedProperty().addListener((obs, wasFocused, isFocused) -> {
            if (isFocused) {
                field.setStyle(
                        "-fx-background-color: white; " +
                                "-fx-border-color: #1ba3b6; " +
                                "-fx-border-width: 2; " +
                                "-fx-border-radius: 10; " +
                                "-fx-background-radius: 10; " +
                                "-fx-padding: 12 16; " +
                                "-fx-font-size: 14px; " +
                                "-fx-effect: dropshadow(gaussian, rgba(27, 163, 182, 0.25), 8, 0, 0, 2);");
            } else {
                field.setStyle(defaultStyle);
            }
        });

        return field;
    }

    // Helper method to style ComboBox
    private void styleComboBox(ComboBox<?> comboBox) {
        String defaultStyle = "-fx-background-color: white; " +
                "-fx-border-color: #d1d5db; " +
                "-fx-border-radius: 10; " +
                "-fx-background-radius: 10; " +
                "-fx-padding: 8 12; " +
                "-fx-font-size: 14px; " +
                "-fx-cursor: hand;";

        String focusedStyle = "-fx-background-color: white; " +
                "-fx-border-color: #1ba3b6; " +
                "-fx-border-width: 2; " +
                "-fx-border-radius: 10; " +
                "-fx-background-radius: 10; " +
                "-fx-padding: 8 12; " +
                "-fx-font-size: 14px; " +
                "-fx-cursor: hand; " +
                "-fx-effect: dropshadow(gaussian, rgba(27, 163, 182, 0.25), 8, 0, 0, 2);";

        comboBox.setStyle(defaultStyle);

        comboBox.focusedProperty().addListener((obs, wasFocused, isFocused) -> {
            comboBox.setStyle(isFocused ? focusedStyle : defaultStyle);
        });

        comboBox.setOnMouseEntered(e -> {
            if (!comboBox.isFocused()) {
                comboBox.setStyle(
                        "-fx-background-color: white; " +
                                "-fx-border-color: #1ba3b6; " +
                                "-fx-border-radius: 10; " +
                                "-fx-background-radius: 10; " +
                                "-fx-padding: 8 12; " +
                                "-fx-font-size: 14px; " +
                                "-fx-cursor: hand;");
            }
        });

        comboBox.setOnMouseExited(e -> {
            if (!comboBox.isFocused()) {
                comboBox.setStyle(defaultStyle);
            }
        });
    }

    // Helper method to show styled alert
    private void showStyledAlert(String title, String message, String color) {
        Alert alert = new Alert(Alert.AlertType.NONE);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.getDialogPane().getButtonTypes().add(ButtonType.OK);
        alert.getDialogPane().setStyle(
                "-fx-background-color: white; " +
                        "-fx-font-family: 'Segoe UI', 'Noto Sans Arabic', system-ui;");

        javafx.scene.Node okButton = alert.getDialogPane().lookupButton(ButtonType.OK);
        okButton.setStyle(
                "-fx-background-color: " + color + "; " +
                        "-fx-text-fill: white; " +
                        "-fx-font-weight: bold; " +
                        "-fx-padding: 8 24; " +
                        "-fx-background-radius: 8;");

        alert.showAndWait();
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
        if (totalEGP > 0)
            sb.append(String.format("%.2f EGP", totalEGP));
        if (totalEGP > 0 && totalUSD > 0)
            sb.append(" + ");
        if (totalUSD > 0)
            sb.append(String.format("%.2f USD", totalUSD));

        if (totalEGP == 0 && totalUSD == 0)
            sb.append("0.00");

        totalCost1.setText(sb.toString());
    }

    // 🛑 KEY METHOD: SEND TO MONGODB 🛑
    @FXML
    private void sendInvoiceToDatabase() {
        if (selectedShipment == null || invoiceItems.isEmpty()) {
            AlertUtils.showWarning("تنبيه", "يجب اختيار شحنة وإضافة بنود أولاً");
            return;
        }

        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> invoicesCol = db.getCollection("invoices");

            // Generate unique invoice number with timestamp
            String timestamp = String.valueOf(System.currentTimeMillis() % 1000000);
            String shortId = selectedShipment.getId().substring(Math.max(0, selectedShipment.getId().length() - 4));
            String invoiceNum = "INV-" + shortId.toUpperCase() + "-" + timestamp;

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
                    new Document("$set", new Document("is_invoiced", true)));

            AlertUtils.showSuccess("تم بنجاح", "تم إرسال الفاتورة للموافقة بنجاح");

            // Navigate back to client list or clear form
            onInvoiceManagementClick(null);

        } catch (com.mongodb.MongoWriteException e) {
            // Handle duplicate key error specifically
            if (e.getError().getCode() == 11000) {
                AlertUtils.showWarning("تنبيه", "فاتورة بهذا الرقم موجودة بالفعل.\nيرجى المحاولة مرة أخرى.");
            } else {
                e.printStackTrace();
                AlertUtils.showError("خطأ", "فشل الحفظ: " + e.getMessage());
            }
        } catch (Exception e) {
            e.printStackTrace();
            AlertUtils.showError("خطأ", "فشل الحفظ: " + e.getMessage());
        }
    }

    // Navigation Logic
    private void setupTopBar() {
        if (topBarController != null) {
            topBarController.setPageTitle("إنشاء فاتورة");
            topBarController.setSidebar(sidebar);
            User u = AppSession.getInstance().getCurrentUser();
            if (u != null)
                topBarController.setUserData(u.getName(), u.getEmail() != null ? u.getEmail() : "");
        }
    }

    @FXML
    public void onDashboardClick(ActionEvent e) throws Exception {
        navigate(e, "/noran/desktop/dashboard.fxml");
    }

    // This goes back to the client selection list
    @FXML
    public void onInvoiceManagementClick(ActionEvent e) throws IOException {
        navigate(e, "/noran/desktop/client-data-invoice.fxml");
    }

    private void navigate(ActionEvent event, String fxml) throws IOException {
        if (event == null)
            return; // Guard clause
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxml));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.getScene().setRoot(root);
    }

    @FXML
    public void refresh(ActionEvent event) {
    }

    @FXML
    private void onSearch(ActionEvent e) {
    }

    @FXML
    private void downloadInvoicePDF() {
    }
}