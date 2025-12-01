package noran.desktop.Controllers;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.stage.Stage;
import javafx.scene.Scene;
import javafx.fxml.FXMLLoader;
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

    @FXML private void initialize() {
        setupColumns();
        statusFilter.setValue("الكل");
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
//goBack
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
                    String client = rs.getString("fullname") + (rs.getString("taxNumber") != null ? " (" + rs.getString("taxNumber") + ")" : "");
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
            return "تاريخ غير صحيح";
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
        Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/dashboard.fxml")); // أو أي صفحة رئيسية
        stage.setScene(new Scene(root));
        stage.setTitle("لوحة تحكم المدير");
        stage.centerOnScreen();
    }

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