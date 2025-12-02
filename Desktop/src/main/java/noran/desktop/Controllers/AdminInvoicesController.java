package noran.desktop.Controllers;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.layout.GridPane;
import javafx.geometry.Insets;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import noran.desktop.Database.DatabaseConnection;

import java.io.IOException;
import java.sql.*;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class AdminInvoicesController {

    @FXML private TableView<InvoiceAdmin> adminInvoicesTable;
    @FXML private TableColumn<InvoiceAdmin, String> colInvoiceNumber;
    @FXML private TableColumn<InvoiceAdmin, String> colClientName;
    @FXML private TableColumn<InvoiceAdmin, Double> colTotal;
    @FXML private TableColumn<InvoiceAdmin, String> colDate;
    @FXML private TableColumn<InvoiceAdmin, String> colStatus;
    @FXML private TableColumn<InvoiceAdmin, Void> colActions;
    @FXML private ComboBox<String> statusFilter;

    private final ObservableList<InvoiceAdmin> invoices = FXCollections.observableArrayList();
    private static final DateTimeFormatter AR_DATE = DateTimeFormatter
            .ofPattern("dd MMMM yyyy - hh:mm a", new Locale("ar"))
            .withZone(ZoneId.of("Africa/Cairo"));

    @FXML
    private void initialize() {
        setupColumns();
        setupRowClickListener();
        statusFilter.setValue("الكل");
        statusFilter.setItems(FXCollections.observableArrayList("الكل", "pending", "accepted", "rejected"));
        statusFilter.valueProperty().addListener((obs, old, newVal) -> refreshTable());
        refreshTable();
    }

    private void setupColumns() {
        colInvoiceNumber.setCellValueFactory(new PropertyValueFactory<>("invoiceNumber"));
        colClientName.setCellValueFactory(new PropertyValueFactory<>("clientName"));
        colTotal.setCellValueFactory(new PropertyValueFactory<>("total"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("formattedDate"));
        colStatus.setCellValueFactory(new PropertyValueFactory<>("status"));

        colActions.setCellFactory(param -> new TableCell<>() {
            private final Button acceptBtn = new Button("قبول");
            private final Button rejectBtn = new Button("رفض");
            private final HBox hbox = new HBox(10, acceptBtn, rejectBtn);

            {
                acceptBtn.setStyle("-fx-background-color: #28a745; -fx-text-fill: white; -fx-padding: 6 14; -fx-background-radius: 6;");
                rejectBtn.setStyle("-fx-background-color: #dc3545; -fx-text-fill: white; -fx-padding: 6 14; -fx-background-radius: 6;");
            }

            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                    setGraphic(null);
                } else {
                    InvoiceAdmin inv = getTableRow().getItem();
                    acceptBtn.setOnAction(e -> updateStatus(inv.getInvoiceNumber(), "accepted"));
                    rejectBtn.setOnAction(e -> updateStatus(inv.getInvoiceNumber(), "rejected"));
                    acceptBtn.setDisable("accepted".equals(inv.getStatus()));
                    rejectBtn.setDisable("rejected".equals(inv.getStatus()));
                    setGraphic(hbox);
                }
            }
        });

        adminInvoicesTable.setItems(invoices);
    }

    private void setupRowClickListener() {
        adminInvoicesTable.setRowFactory(tv -> {
            TableRow<InvoiceAdmin> row = new TableRow<>();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && (!row.isEmpty())) {
                    InvoiceAdmin invoice = row.getItem();
                    showInvoiceDetails(invoice.getInvoiceNumber());
                }
            });
            return row;
        });
    }

    @FXML
    private void refreshTable() {
        invoices.clear();
        String filter = statusFilter.getValue();
        String sql = """
            SELECT sf.invoiceNumber, sf.createdAt, sf.invoiceStatus,
                   u.fullname, u.taxNumber,
                   (COALESCE(sf.Port_fee_price,0) + COALESCE(sf.Clearance_Fees_price,0) +
                    COALESCE(sf.Expense_Tips_price,0) + COALESCE(sf.Sundries_price,0) +
                    COALESCE(sf.Additional_Services_price,0) + COALESCE(sf.unsupportedItemPrice,0)) AS total
            FROM shipment_fees sf
            JOIN shipments s ON sf.shipmentId = s.shipment_id
            JOIN users u ON s.clientId = u._id
            WHERE sf.invoiceNumber IS NOT NULL
            """ + (filter != null && !filter.equals("الكل") ? " AND sf.invoiceStatus = ?" : "") +
                " ORDER BY sf.createdAt DESC";

        try (Connection conn = DatabaseConnection.connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (filter != null && !filter.equals("الكل")) {
                ps.setString(1, filter);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String invNum = rs.getString("invoiceNumber");
                    String client = rs.getString("fullname");
                    String taxNumber = rs.getString("taxNumber");
                    if (taxNumber != null && !taxNumber.isEmpty()) {
                        client += " (" + taxNumber + ")";
                    }
                    double total = rs.getDouble("total");
                    String rawDate = rs.getString("createdAt");
                    String status = rs.getString("invoiceStatus");
                    if (status == null) status = "pending";

                    String niceDate = formatDate(rawDate);

                    invoices.add(new InvoiceAdmin(invNum, client, total, niceDate, status));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            showAlert("خطأ", "فشل تحميل الفواتير: " + e.getMessage());
        }
    }

    private void showInvoiceDetails(String invoiceNumber) {
        try {
            // Load ALL invoice details from shipment_fees table
            ShipmentFeeDetails details = getShipmentFeeDetails(invoiceNumber);

            if (details != null) {
                createAndShowDetailsDialog(details);
            } else {
                showAlert("خطأ", "لم يتم العثور على تفاصيل الفاتورة: " + invoiceNumber);
            }

        } catch (SQLException e) {
            e.printStackTrace();
            showAlert("خطأ", "فشل تحميل تفاصيل الفاتورة: " + e.getMessage());
        }
    }

    private ShipmentFeeDetails getShipmentFeeDetails(String invoiceNumber) throws SQLException {
        String sql = """
            SELECT 
                sf.id,
                sf.invoiceNumber,
                sf.unsupportedItemName,
                sf.unsupportedItemPrice,
                sf.shipmentId,
                sf.feeName,
                sf.feePrice,
                sf.createdAt,
                sf.Port_fee_price,
                sf.Additional_Services_price,
                sf.Clearance_Fees_price,
                sf.Expense_Tips_price,
                sf.Sundries_price,
                sf.invoiceStatus,
                (COALESCE(sf.Port_fee_price,0) + COALESCE(sf.Clearance_Fees_price,0) +
                 COALESCE(sf.Expense_Tips_price,0) + COALESCE(sf.Sundries_price,0) +
                 COALESCE(sf.Additional_Services_price,0) + COALESCE(sf.unsupportedItemPrice,0)) AS total
            FROM shipment_fees sf
            WHERE sf.invoiceNumber = ?
            """;

        try (Connection conn = DatabaseConnection.connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, invoiceNumber);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new ShipmentFeeDetails(
                            rs.getInt("id"),
                            rs.getString("invoiceNumber"),
                            rs.getString("unsupportedItemName"),
                            rs.getDouble("unsupportedItemPrice"),
                            rs.getInt("shipmentId"),
                            rs.getString("feeName"),
                            rs.getDouble("feePrice"),
                            rs.getString("createdAt"),
                            rs.getDouble("Port_fee_price"),
                            rs.getDouble("Additional_Services_price"),
                            rs.getDouble("Clearance_Fees_price"),
                            rs.getDouble("Expense_Tips_price"),
                            rs.getDouble("Sundries_price"),
                            rs.getString("invoiceStatus"),
                            rs.getDouble("total")
                    );
                }
            }
        }
        return null;
    }

    private void createAndShowDetailsDialog(ShipmentFeeDetails details) {
        try {
            Stage dialogStage = new Stage();
            dialogStage.initModality(Modality.APPLICATION_MODAL);
            dialogStage.initStyle(StageStyle.DECORATED);
            dialogStage.setTitle("تفاصيل الفاتورة - " + details.getInvoiceNumber());

            VBox root = new VBox(20);
            root.setPadding(new Insets(20));
            root.setStyle("-fx-background-color: #f4f6f9;");

            ScrollPane scroll = new ScrollPane(root);
            scroll.setFitToWidth(true);

            // 🔹 عنوان أعلى الصفحة
            Label header = new Label("تفاصيل الفاتورة #" + details.getInvoiceNumber());
            header.setStyle("-fx-font-size: 24px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

            // ======================================================
            // CARD COMPONENT FUNCTION
            // ======================================================


            // ======================================================
            // BASIC INFO CARD
            // ======================================================
            VBox basicCard = makeCard("المعلومات الأساسية");

            GridPane basicGrid = new GridPane();
            basicGrid.setHgap(20);
            basicGrid.setVgap(10);

            addLabelValue(basicGrid, 0, "رقم الفاتورة:", details.getInvoiceNumber());
            addLabelValue(basicGrid, 1, "رقم الشحنة:", String.valueOf(details.getShipmentId()));
            addLabelValue(basicGrid, 2, "الحالة:", getStatusArabic(details.getStatus()));
            addLabelValue(basicGrid, 3, "تاريخ الإنشاء:", formatDate(details.getCreatedAt()));

            basicCard.getChildren().add(basicGrid);

            // ======================================================
            // FEES CARD
            // ======================================================
            VBox feesCard = makeCard("تفاصيل الرسوم");

            GridPane feesGrid = new GridPane();
            feesGrid.setHgap(20);
            feesGrid.setVgap(10);

            int row = 0;
            if (details.getPortFee() > 0) addLabelValue(feesGrid, row++, "رسوم الميناء:", f(details.getPortFee()));
            if (details.getClearanceFees() > 0) addLabelValue(feesGrid, row++, "رسوم التخليص:", f(details.getClearanceFees()));
            if (details.getExpenseTips() > 0) addLabelValue(feesGrid, row++, "النثريات:", f(details.getExpenseTips()));
            if (details.getSundries() > 0) addLabelValue(feesGrid, row++, "مصروفات متنوعة:", f(details.getSundries()));
            if (details.getAdditionalServices() > 0) addLabelValue(feesGrid, row++, "خدمات إضافية:", f(details.getAdditionalServices()));
            if (details.getUnsupportedItemPrice() > 0) {
                addLabelValue(feesGrid, row++, "بند غير مدعوم:", details.getUnsupportedItemName());
                addLabelValue(feesGrid, row++, "سعره:", f(details.getUnsupportedItemPrice()));
            }

            feesCard.getChildren().add(feesGrid);

            // ======================================================
            // SUMMARY CARD
            // ======================================================
            VBox sumCard = makeCard("الملخص");

            Label totalLabel = new Label("الإجمالي: " + f(details.getTotal()));
            totalLabel.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: #27ae60;");

            sumCard.getChildren().add(totalLabel);

            // ======================================================
            // ACTION BUTTONS
            // ======================================================
            HBox actions = new HBox(15);
            actions.setPadding(new Insets(10));
            actions.setStyle("-fx-alignment: center;");

            Button closeBtn = new Button("إغلاق");
            closeBtn.setStyle(btn("gray"));
            closeBtn.setOnAction(e -> dialogStage.close());

            Button acceptBtn = new Button("قبول");
            acceptBtn.setStyle(btn("green"));
            acceptBtn.setDisable(details.getStatus().equals("accepted"));
            acceptBtn.setOnAction(e -> {
                updateStatus(details.getInvoiceNumber(), "accepted");
                dialogStage.close();
            });

            Button rejectBtn = new Button("رفض");
            rejectBtn.setStyle(btn("red"));
            rejectBtn.setDisable(details.getStatus().equals("rejected"));
            rejectBtn.setOnAction(e -> {
                updateStatus(details.getInvoiceNumber(), "rejected");
                dialogStage.close();
            });

            actions.getChildren().addAll(closeBtn, acceptBtn, rejectBtn);

            // Add components
            root.getChildren().addAll(header, basicCard, feesCard, sumCard, actions);

            Scene scene = new Scene(scroll, 700, 650);
            dialogStage.setScene(scene);
            dialogStage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("خطأ", "فشل عرض تفاصيل الفاتورة: " + e.getMessage());
        }
    }

    private String btn(String color) {
        return switch (color) {
            case "green" -> "-fx-background-color:#27ae60; -fx-text-fill:white; -fx-padding:10 25; -fx-background-radius:8;";
            case "red" -> "-fx-background-color:#c0392b; -fx-text-fill:white; -fx-padding:10 25; -fx-background-radius:8;";
            default -> "-fx-background-color:#7f8c8d; -fx-text-fill:white; -fx-padding:10 25; -fx-background-radius:8;";
        };
    }

    private String f(double n) {
        return String.format("%.2f", n);
    }

    VBox makeCard(String title) {
        VBox box = new VBox(10);
        box.setStyle("-fx-background-color: white; -fx-padding: 15; -fx-background-radius: 10;"
                + "-fx-border-color: #dfe6e9; -fx-border-radius: 10;");
        Label t = new Label(title);
        t.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");
        box.getChildren().add(t);
        return box;
    }


    private String generateRawDataString(ShipmentFeeDetails details) {
        return String.format(
                "ID: %d\n" +
                        "Invoice Number: %s\n" +
                        "Shipment ID: %d\n" +
                        "Created At: %s\n" +
                        "Status: %s\n" +
                        "Port Fee: %.2f\n" +
                        "Clearance Fees: %.2f\n" +
                        "Expense Tips: %.2f\n" +
                        "Sundries: %.2f\n" +
                        "Additional Services: %.2f\n" +
                        "Unsupported Item: %s (%.2f)\n" +
                        "Fee Name: %s\n" +
                        "Fee Price: %.2f\n" +
                        "Total Calculated: %.2f",
                details.getId(),
                details.getInvoiceNumber(),
                details.getShipmentId(),
                details.getCreatedAt(),
                details.getStatus(),
                details.getPortFee(),
                details.getClearanceFees(),
                details.getExpenseTips(),
                details.getSundries(),
                details.getAdditionalServices(),
                details.getUnsupportedItemName(),
                details.getUnsupportedItemPrice(),
                details.getFeeName(),
                details.getFeePrice(),
                details.getTotal()
        );
    }

    private void addLabelValue(GridPane grid, int row, String label, String value) {
        Label lbl = new Label(label);
        lbl.setStyle("-fx-font-weight: bold; -fx-font-size: 14px;");
        grid.add(lbl, 0, row);

        Label val = new Label(value != null ? value : "غير محدد");
        val.setStyle("-fx-font-size: 14px; -fx-text-fill: #495057;");
        grid.add(val, 1, row);
    }

    private String getStatusArabic(String status) {
        if (status == null) return "غير محدد";
        return switch (status.toLowerCase()) {
            case "accepted" -> "مقبولة";
            case "rejected" -> "مرفوضة";
            case "pending" -> "قيد الانتظار";
            default -> status;
        };
    }

    private void updateStatus(String invoiceNumber, String newStatus) {
        String sql = "UPDATE shipment_fees SET invoiceStatus = ? WHERE invoiceNumber = ?";
        try (Connection conn = DatabaseConnection.connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newStatus);
            ps.setString(2, invoiceNumber);
            int rows = ps.executeUpdate();
            if (rows > 0) {
                showAlert("تم بنجاح", "تم تغيير حالة الفاتورة " + invoiceNumber + " إلى: " +
                        ("accepted".equals(newStatus) ? "مقبولة" : "مرفوضة"));
                refreshTable();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            showAlert("خطأ", "فشل تحديث الحالة: " + e.getMessage());
        }
    }

    private String formatDate(String timestamp) {
        if (timestamp == null || timestamp.trim().isEmpty()) return "غير محدد";
        try {
            long millis = Long.parseLong(timestamp);
            return Instant.ofEpochMilli(millis).atZone(ZoneId.of("Africa/Cairo")).format(AR_DATE);
        } catch (Exception e) {
            return "تاريخ غير صحيح: " + timestamp;
        }
    }

    private void showAlert(String title, String message) {
        Alert a = new Alert("تم بنجاح".equals(title) ? Alert.AlertType.INFORMATION : Alert.AlertType.ERROR);
        a.setTitle(title);
        a.setHeaderText(null);
        a.setContentText(message);
        a.showAndWait();
    }

    @FXML
    private void goBack() throws IOException {
        Stage stage = (Stage) adminInvoicesTable.getScene().getWindow();
        Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/dashboard.fxml"));
        stage.setScene(new Scene(root));
        stage.setTitle("لوحة تحكم المدير");
        stage.centerOnScreen();
    }

    @FXML
    public void navigateToDashboard(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/dashboard.fxml");
    }

    private void loadPage(ActionEvent event, String fxmlPath) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }

    @FXML
    public void refresh(ActionEvent event) {
        refreshTable();
    }

    // Inner class for ALL shipment_fees table details
    public static class ShipmentFeeDetails {
        private final int id;
        private final String invoiceNumber;
        private final String unsupportedItemName;
        private final double unsupportedItemPrice;
        private final int shipmentId;
        private final String feeName;
        private final double feePrice;
        private final String createdAt;
        private final double portFee;
        private final double additionalServices;
        private final double clearanceFees;
        private final double expenseTips;
        private final double sundries;
        private final String status;
        private final double total;

        public ShipmentFeeDetails(int id, String invoiceNumber, String unsupportedItemName,
                                  double unsupportedItemPrice, int shipmentId, String feeName,
                                  double feePrice, String createdAt, double portFee,
                                  double additionalServices, double clearanceFees,
                                  double expenseTips, double sundries, String status, double total) {
            this.id = id;
            this.invoiceNumber = invoiceNumber;
            this.unsupportedItemName = unsupportedItemName;
            this.unsupportedItemPrice = unsupportedItemPrice;
            this.shipmentId = shipmentId;
            this.feeName = feeName;
            this.feePrice = feePrice;
            this.createdAt = createdAt;
            this.portFee = portFee;
            this.additionalServices = additionalServices;
            this.clearanceFees = clearanceFees;
            this.expenseTips = expenseTips;
            this.sundries = sundries;
            this.status = status != null ? status : "pending";
            this.total = total;
        }

        // Getters for all fields
        public int getId() { return id; }
        public String getInvoiceNumber() { return invoiceNumber; }
        public String getUnsupportedItemName() { return unsupportedItemName; }
        public double getUnsupportedItemPrice() { return unsupportedItemPrice; }
        public int getShipmentId() { return shipmentId; }
        public String getFeeName() { return feeName; }
        public double getFeePrice() { return feePrice; }
        public String getCreatedAt() { return createdAt; }
        public double getPortFee() { return portFee; }
        public double getAdditionalServices() { return additionalServices; }
        public double getClearanceFees() { return clearanceFees; }
        public double getExpenseTips() { return expenseTips; }
        public double getSundries() { return sundries; }
        public String getStatus() { return status; }
        public double getTotal() { return total; }
    }

    // Existing InvoiceAdmin class remains the same
    public static class InvoiceAdmin {
        private final String invoiceNumber, clientName, formattedDate, status;
        private final double total;

        public InvoiceAdmin(String invoiceNumber, String clientName, double total, String formattedDate, String status) {
            this.invoiceNumber = invoiceNumber;
            this.clientName = clientName;
            this.total = total;
            this.formattedDate = formattedDate;
            this.status = status != null ? status : "pending";
        }

        public String getInvoiceNumber() { return invoiceNumber; }
        public String getClientName() { return clientName; }
        public double getTotal() { return total; }
        public String getFormattedDate() { return formattedDate; }
        public String getStatus() { return status; }
    }
}