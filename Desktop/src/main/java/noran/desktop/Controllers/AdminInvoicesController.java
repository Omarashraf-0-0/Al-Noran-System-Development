package noran.desktop.Controllers;

import noran.desktop.Utils.AlertUtils;

// JavaFX Imports
import com.itextpdf.layout.element.Cell;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

// MongoDB Imports
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.bson.conversions.Bson;

// PDF & Arabic Support Imports
import com.ibm.icu.text.ArabicShaping;
import com.ibm.icu.text.ArabicShapingException;
import com.ibm.icu.text.Bidi;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.properties.BaseDirection;
import com.itextpdf.layout.properties.Property;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

// Internal Imports
import noran.desktop.AppSession;
import noran.desktop.Database.MongoConnection;
import noran.desktop.Utils.ComboBoxStyler;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class AdminInvoicesController {

    @FXML
    private TableView<InvoiceAdminModel> adminInvoicesTable;
    @FXML
    private TableColumn<InvoiceAdminModel, String> colInvoiceNumber;
    @FXML
    private TableColumn<InvoiceAdminModel, String> colClientName;
    @FXML
    private TableColumn<InvoiceAdminModel, String> colTotal;
    @FXML
    private TableColumn<InvoiceAdminModel, String> colDate;
    @FXML
    private TableColumn<InvoiceAdminModel, String> colStatus;
    @FXML
    private TableColumn<InvoiceAdminModel, Void> colActions;
    @FXML
    private ComboBox<String> statusFilter;

    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    // Stat card labels
    @FXML
    private Label pendingCountLabel;
    @FXML
    private Label acceptedCountLabel;
    @FXML
    private Label rejectedCountLabel;

    private final ObservableList<InvoiceAdminModel> invoicesList = FXCollections.observableArrayList();
    private javafx.collections.transformation.FilteredList<InvoiceAdminModel> filteredData;
    private String currentSearchText = "";

    @FXML
    private void initialize() {
        setupColumns();

        statusFilter.setValue("الكل");
        statusFilter.setItems(FXCollections.observableArrayList("الكل", "في انتظار الموافقة", "مقبولة", "مرفوضة"));
        statusFilter.valueProperty().addListener((obs, old, newVal) -> refreshTable());
        ComboBoxStyler.style(statusFilter);

        // Setup filtered list for search
        filteredData = new javafx.collections.transformation.FilteredList<>(invoicesList, p -> true);
        javafx.collections.transformation.SortedList<InvoiceAdminModel> sortedData = new javafx.collections.transformation.SortedList<>(
                filteredData);
        sortedData.comparatorProperty().bind(adminInvoicesTable.comparatorProperty());
        adminInvoicesTable.setItems(sortedData);

        // Make columns fill the table width evenly
        adminInvoicesTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);

        refreshTable();

        if (sidebarController != null)
            sidebarController.setActivePage("invoice completion");
        setupTopBar();
    }

    private void setupTopBar() {
        if (topBarController != null) {
            topBarController.setPageTitle("تخليص الفواتير");
            topBarController.setSidebar(sidebar);
            topBarController.setSearchPlaceholder("البحث برقم الفاتورة، اسم العميل، أو التاريخ...");
            User u = AppSession.getInstance().getCurrentUser();
            if (u != null)
                topBarController.setUserData(u.getName(), u.getEmail() != null ? u.getEmail() : "");

            // Connect search
            topBarController.setOnSearchAction(searchText -> {
                currentSearchText = searchText;
                applySearchFilter();
            });
        }
    }

    private void applySearchFilter() {
        filteredData.setPredicate(invoice -> {
            if (currentSearchText == null || currentSearchText.isEmpty()) {
                return true;
            }
            String lower = currentSearchText.toLowerCase();
            // Search by invoice number, client name, or date
            boolean matchesInvoice = invoice.getInvoiceNumber() != null &&
                    invoice.getInvoiceNumber().toLowerCase().contains(lower);
            boolean matchesClient = invoice.getClientName() != null &&
                    invoice.getClientName().toLowerCase().contains(lower);
            boolean matchesDate = invoice.getDate() != null &&
                    invoice.getDate().contains(lower);
            return matchesInvoice || matchesClient || matchesDate;
        });
    }

    private void setupColumns() {
        colInvoiceNumber.setCellValueFactory(new PropertyValueFactory<>("invoiceNumber"));
        colClientName.setCellValueFactory(new PropertyValueFactory<>("clientName"));
        colTotal.setCellValueFactory(new PropertyValueFactory<>("totalDisplay"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("date"));
        colStatus.setCellValueFactory(new PropertyValueFactory<>("status"));

        colActions.setCellFactory(param -> new TableCell<>() {
            private final Button actionBtn = new Button("عرض / اتخاذ إجراء");

            {
                actionBtn.setStyle(
                        "-fx-background-color: #007bff; -fx-text-fill: white; -fx-padding: 6 12; -fx-background-radius: 5; -fx-font-weight: bold;");
                actionBtn.setCursor(javafx.scene.Cursor.HAND);
            }

            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                    setGraphic(null);
                } else {
                    InvoiceAdminModel inv = getTableRow().getItem();
                    actionBtn.setOnAction(e -> showInvoiceDetailsDialog(inv));
                    setGraphic(actionBtn);
                }
            }
        });
    }

    @FXML
    private void refreshTable() {
        // Show loading indicator
        adminInvoicesTable.setPlaceholder(new javafx.scene.control.Label("جاري تحميل البيانات..."));
        invoicesList.clear();

        String filterStatus = statusFilter.getValue();

        javafx.concurrent.Task<List<InvoiceAdminModel>> loadTask = new javafx.concurrent.Task<>() {
            @Override
            protected List<InvoiceAdminModel> call() {
                List<InvoiceAdminModel> loadedList = new java.util.ArrayList<>();
                try {
                    MongoDatabase db = MongoConnection.getDatabase();
                    MongoCollection<Document> collection = db.getCollection("invoices");

                    List<Bson> pipeline = new ArrayList<>();

                    // 1. Join with Users
                    pipeline.add(Aggregates.lookup("users", "userId", "_id", "userDetails"));

                    // 2. Filter Status
                    if (filterStatus != null && !"الكل".equals(filterStatus)) {
                        pipeline.add(Aggregates.match(Filters.eq("status", filterStatus)));
                    }

                    // 3. Sort
                    pipeline.add(Aggregates.sort(Sorts.descending("createdAt")));

                    for (Document doc : collection.aggregate(pipeline)) {
                        String invNum = doc.getString("invoiceNumber");
                        String status = doc.getString("status");

                        Date dateObj = doc.getDate("createdAt");
                        String dateStr = dateObj != null ? new SimpleDateFormat("dd/MM/yyyy").format(dateObj) : "N/A";

                        String clientName = "غير معروف";
                        List<Document> users = doc.getList("userDetails", Document.class);
                        if (users != null && !users.isEmpty()) {
                            Document user = users.get(0);
                            clientName = user.getString("fullname");
                            if (clientName == null)
                                clientName = user.getString("username");
                        }

                        // Calculate Totals from Items Array
                        List<Document> items = doc.getList("invoiceItems", Document.class);
                        double sumEGP = 0;
                        double sumUSD = 0;

                        if (items != null) {
                            for (Document item : items) {
                                double price = getDoubleSafe(item, "itemPrice");
                                String curr = item.getString("currencyType");
                                if ("USD".equalsIgnoreCase(curr))
                                    sumUSD += price;
                                else
                                    sumEGP += price;
                            }
                        }

                        StringBuilder totalStr = new StringBuilder();
                        if (sumEGP > 0)
                            totalStr.append(String.format("%.2f EGP", sumEGP));
                        if (sumEGP > 0 && sumUSD > 0)
                            totalStr.append(" + ");
                        if (sumUSD > 0)
                            totalStr.append(String.format("%.2f USD", sumUSD));
                        if (totalStr.length() == 0)
                            totalStr.append("0.00");

                        loadedList.add(
                                new InvoiceAdminModel(invNum, clientName, totalStr.toString(), dateStr, status, doc));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    javafx.application.Platform.runLater(
                            () -> AlertUtils.showError("خطأ", "خطأ في تحميل البيانات: " + e.getMessage()));
                }
                return loadedList;
            }
        };

        loadTask.setOnSucceeded(event -> {
            invoicesList.setAll(loadTask.getValue());
            if (invoicesList.isEmpty()) {
                adminInvoicesTable.setPlaceholder(new javafx.scene.control.Label("لا توجد بيانات"));
            }
            // Update stat cards
            updateInvoiceStats();
        });

        loadTask.setOnFailed(event -> {
            adminInvoicesTable.setPlaceholder(new javafx.scene.control.Label("خطأ في تحميل البيانات"));
        });

        new Thread(loadTask).start();
    }

    /**
     * Update the stat card labels based on current invoices data
     */
    private void updateInvoiceStats() {
        int pending = 0;
        int accepted = 0;
        int rejected = 0;

        for (InvoiceAdminModel inv : invoicesList) {
            String status = inv.getStatus();
            if (status != null) {
                if (status.contains("انتظار") || status.equalsIgnoreCase("pending")) {
                    pending++;
                } else if (status.contains("مقبول") || status.equalsIgnoreCase("accepted")) {
                    accepted++;
                } else if (status.contains("مرفوض") || status.equalsIgnoreCase("rejected")) {
                    rejected++;
                }
            }
        }

        if (pendingCountLabel != null) {
            pendingCountLabel.setText(String.valueOf(pending));
        }
        if (acceptedCountLabel != null) {
            acceptedCountLabel.setText(String.valueOf(accepted));
        }
        if (rejectedCountLabel != null) {
            rejectedCountLabel.setText(String.valueOf(rejected));
        }
    }

    private void showInvoiceDetailsDialog(InvoiceAdminModel invoice) {
        Dialog<Void> dialog = new Dialog<>();
        dialog.setTitle("تفاصيل الفاتورة: " + invoice.getInvoiceNumber());

        // Set app icon on dialog window
        Stage dialogStage = (Stage) dialog.getDialogPane().getScene().getWindow();
        dialogStage.getIcons().add(new javafx.scene.image.Image(
                getClass().getResourceAsStream("/noran/desktop/images/Logo.png")));

        // Remove default header, we'll create a custom one
        dialog.setHeaderText(null);
        dialog.setGraphic(null);

        ButtonType closeType = new ButtonType("إغلاق", ButtonBar.ButtonData.CANCEL_CLOSE);
        dialog.getDialogPane().getButtonTypes().add(closeType);

        VBox content = new VBox(0);
        content.setStyle("-fx-min-width: 550px; -fx-background-color: #f8f9fa;");

        // Custom Header with gradient
        VBox header = new VBox(8);
        header.setAlignment(Pos.CENTER_RIGHT);
        header.setStyle("-fx-background-color: linear-gradient(to left, #a40000, #7a0000); -fx-padding: 20 24;");

        Label titleLabel = new Label("📄 تفاصيل الفاتورة");
        titleLabel.setStyle("-fx-font-size: 20px; -fx-font-weight: 700; -fx-text-fill: white;");

        HBox clientInfo = new HBox(20);
        clientInfo.setAlignment(Pos.CENTER_RIGHT);

        Label clientLabel = new Label("👤 العميل: " + invoice.getClientName());
        clientLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: rgba(255,255,255,0.9);");

        Label statusLabel = new Label("📋 الحالة: " + invoice.getStatus());
        String statusColor = "pending".equalsIgnoreCase(invoice.getStatus()) ||
                "في انتظار الموافقة".equals(invoice.getStatus()) ? "#fbbf24"
                        : "مقبولة".equals(invoice.getStatus()) ? "#10b981" : "#ef4444";
        statusLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: " + statusColor + "; -fx-font-weight: 600; " +
                "-fx-background-color: rgba(255,255,255,0.9); -fx-padding: 4 12; -fx-background-radius: 12;");

        clientInfo.getChildren().addAll(statusLabel, clientLabel);
        header.getChildren().addAll(titleLabel, clientInfo);

        // Table Section
        VBox tableSection = new VBox(12);
        tableSection.setStyle("-fx-padding: 20 24;");

        Label itemsTitle = new Label("بنود الفاتورة:");
        itemsTitle.setStyle("-fx-font-size: 15px; -fx-font-weight: 600; -fx-text-fill: #374151;");

        TableView<Document> itemsTable = new TableView<>();
        itemsTable.setPrefHeight(200);
        itemsTable.setStyle("-fx-background-color: white; -fx-background-radius: 12; " +
                "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.08), 8, 0, 0, 2);");
        itemsTable.getStylesheets().add(getClass().getResource("/noran/desktop/invoices-table.css").toExternalForm());
        itemsTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);

        TableColumn<Document, String> colItem = new TableColumn<>("البند");
        colItem.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getString("item")));
        colItem.setStyle("-fx-alignment: CENTER-RIGHT;");

        TableColumn<Document, String> colPrice = new TableColumn<>("السعر");
        colPrice.setCellValueFactory(data -> {
            Double p = getDoubleSafe(data.getValue(), "itemPrice");
            String c = data.getValue().getString("currencyType");
            return new SimpleStringProperty(String.format("%.2f %s", p, c));
        });
        colPrice.setStyle("-fx-alignment: CENTER;");

        itemsTable.getColumns().addAll(colItem, colPrice);

        List<Document> items = invoice.getSourceDoc().getList("invoiceItems", Document.class);
        if (items != null)
            itemsTable.setItems(FXCollections.observableArrayList(items));

        tableSection.getChildren().addAll(itemsTitle, itemsTable);

        // Actions Section
        HBox actions = new HBox(12);
        actions.setAlignment(Pos.CENTER);
        actions.setStyle("-fx-padding: 16 24 24 24;");

        Button acceptBtn = new Button("✅ قبول الفاتورة");
        acceptBtn.setStyle("-fx-background-color: #059669; " +
                "-fx-text-fill: white; -fx-font-weight: 800; -fx-font-size: 14px; " +
                "-fx-padding: 12 28; -fx-background-radius: 10; -fx-cursor: hand; " +
                "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.2), 4, 0, 0, 2);");

        Button rejectBtn = new Button("❌ رفض الفاتورة");
        rejectBtn.setStyle("-fx-background-color: #dc2626; " +
                "-fx-text-fill: white; -fx-font-weight: 800; -fx-font-size: 14px; " +
                "-fx-padding: 12 28; -fx-background-radius: 10; -fx-cursor: hand; " +
                "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.2), 4, 0, 0, 2);");

        Button pdfBtn = new Button("📥 طباعة PDF");
        pdfBtn.setStyle("-fx-background-color: #2563eb; " +
                "-fx-text-fill: white; -fx-font-weight: 800; -fx-font-size: 14px; " +
                "-fx-padding: 12 28; -fx-background-radius: 10; -fx-cursor: hand; " +
                "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.2), 4, 0, 0, 2);");

        acceptBtn.setOnAction(e ->

        {
            updateInvoiceStatus(invoice, "مقبولة");
            dialog.close();
        });

        rejectBtn.setOnAction(e -> {
            updateInvoiceStatus(invoice, "مرفوضة");
            dialog.close();
        });

        pdfBtn.setOnAction(e ->

        generatePdf(invoice));

        actions.getChildren().addAll(pdfBtn, rejectBtn, acceptBtn);

        content.getChildren().addAll(header, tableSection, actions);

        dialog.getDialogPane().setContent(content);
        dialog.getDialogPane().setStyle("-fx-background-color: #f8f9fa; -fx-padding: 0;");

        // Style the close button
        dialog.getDialogPane().lookupButton(closeType).setStyle(
                "-fx-background-color: linear-gradient(to bottom, #6b7280, #4b5563); " +
                        "-fx-text-fill: white; -fx-font-weight: 600; -fx-padding: 10 24; " +
                        "-fx-background-radius: 8; -fx-cursor: hand;");

        dialog.showAndWait();
    }

    private void updateInvoiceStatus(InvoiceAdminModel invoice, String newStatus) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("invoices");

            collection.updateOne(
                    Filters.eq("invoiceNumber", invoice.getInvoiceNumber()),
                    Updates.set("status", newStatus));

            AlertUtils.showSuccess("تم بنجاح", "تم تحديث الحالة إلى: " + newStatus);
            refreshTable();

        } catch (Exception e) {
            e.printStackTrace();
            AlertUtils.showError("خطأ", "فشل التحديث: " + e.getMessage());
        }
    }

    private void generatePdf(InvoiceAdminModel invoice) {
        FileChooser chooser = new FileChooser();
        chooser.setInitialFileName("فاتورة_" + invoice.getInvoiceNumber() + ".pdf");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("PDF Files", "*.pdf"));
        File file = chooser.showSaveDialog(null);
        if (file == null)
            return;

        try {
            PdfWriter writer = new PdfWriter(file);
            PdfDocument pdf = new PdfDocument(writer);
            com.itextpdf.layout.Document document = new com.itextpdf.layout.Document(pdf, PageSize.A4);
            document.setMargins(50, 50, 50, 50);

            document.setTextAlignment(TextAlignment.RIGHT);
            document.setProperty(Property.BASE_DIRECTION, BaseDirection.RIGHT_TO_LEFT);

            String fontPath = "C:/Windows/Fonts/arial.ttf";
            PdfFont font = PdfFontFactory.createFont(fontPath, PdfEncodings.IDENTITY_H);

            // Header
            document.add(new Paragraph(shapeArabic("فاتورة رسمية")).setFont(font).setFontSize(24).setBold()
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("\n"));
            document.add(new Paragraph(shapeArabic("رقم الفاتورة: " + invoice.getInvoiceNumber())).setFont(font));
            document.add(new Paragraph(shapeArabic("العميل: " + invoice.getClientName())).setFont(font));
            document.add(new Paragraph(shapeArabic("التاريخ: " + invoice.getDate())).setFont(font));
            document.add(new Paragraph("\n"));

            // Table
            Table table = new Table(UnitValue.createPercentArray(new float[] { 4, 2, 2 })).useAllAvailableWidth();
            table.setTextAlignment(TextAlignment.RIGHT);
            table.setProperty(Property.BASE_DIRECTION, BaseDirection.RIGHT_TO_LEFT);

            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("البند")).setFont(font).setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY)));
            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("السعر")).setFont(font).setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY)));
            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("العملة")).setFont(font).setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY)));

            List<Document> items = invoice.getSourceDoc().getList("invoiceItems", Document.class);
            if (items != null) {
                for (Document item : items) {
                    String desc = item.getString("item");
                    double price = getDoubleSafe(item, "itemPrice");
                    String curr = item.getString("currencyType");

                    table.addCell(new Cell().add(new Paragraph(shapeArabic(desc)).setFont(font)));
                    table.addCell(new Cell().add(new Paragraph(String.format("%.2f", price)).setFont(font)));
                    table.addCell(new Cell().add(new Paragraph(curr).setFont(font)));
                }
            }

            document.add(table);

            document.add(new Paragraph("\n"));
            document.add(new Paragraph(shapeArabic("الإجمالي: " + invoice.getTotalDisplay()))
                    .setFont(font).setFontSize(16).setBold()
                    .setTextAlignment(TextAlignment.RIGHT));

            document.close();
            AlertUtils.showSuccess("تم بنجاح", "تم حفظ PDF بنجاح");

        } catch (Exception e) {
            e.printStackTrace();
            AlertUtils.showError("خطأ", "فشل إنشاء PDF: " + e.getMessage());
        }
    }

    // Helper: Handle integer vs double storage in MongoDB
    private double getDoubleSafe(Document doc, String key) {
        Object val = doc.get(key);
        if (val instanceof Number) {
            return ((Number) val).doubleValue();
        }
        return 0.0;
    }

    private String shapeArabic(String text) {
        if (text == null)
            return "";
        try {
            ArabicShaping shaper = new ArabicShaping(ArabicShaping.LETTERS_SHAPE);
            String shaped = shaper.shape(text);
            Bidi bidi = new Bidi(shaped, Bidi.DIRECTION_RIGHT_TO_LEFT);
            return bidi.writeReordered(Bidi.DO_MIRRORING | Bidi.REMOVE_BIDI_CONTROLS);
        } catch (ArabicShapingException e) {
            return text;
        }
    }

    // Model Class
    public static class InvoiceAdminModel {
        private final String invoiceNumber;
        private final String clientName;
        private final String totalDisplay;
        private final String date;
        private final String status;
        private final Document sourceDoc;

        public InvoiceAdminModel(String inv, String client, String total, String date, String status, Document source) {
            this.invoiceNumber = inv;
            this.clientName = client;
            this.totalDisplay = total;
            this.date = date;
            this.status = status;
            this.sourceDoc = source;
        }

        public String getInvoiceNumber() {
            return invoiceNumber;
        }

        public String getClientName() {
            return clientName;
        }

        public String getTotalDisplay() {
            return totalDisplay;
        }

        public String getDate() {
            return date;
        }

        public String getStatus() {
            return status;
        }

        public Document getSourceDoc() {
            return sourceDoc;
        }
    }

    @FXML
    public void onDashboardClick(ActionEvent e) throws IOException {
        navigate(e, "/noran/desktop/dashboard.fxml");
    }

    @FXML
    public void refresh(ActionEvent e) {
        refreshTable();
    }

    private void navigate(ActionEvent event, String fxml) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxml));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.getScene().setRoot(root);
    }
}