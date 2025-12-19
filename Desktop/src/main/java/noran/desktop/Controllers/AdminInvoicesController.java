package noran.desktop.Controllers;

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

    private final ObservableList<InvoiceAdminModel> invoicesList = FXCollections.observableArrayList();

    @FXML
    private void initialize() {
        setupColumns();

        statusFilter.setValue("الكل");
        statusFilter.setItems(FXCollections.observableArrayList("الكل", "في انتظار الموافقة", "مقبولة", "مرفوضة"));
        statusFilter.valueProperty().addListener((obs, old, newVal) -> refreshTable());

        refreshTable();

        if (sidebarController != null)
            sidebarController.setActivePage("invoice completion");
        setupTopBar();
    }

    private void setupTopBar() {
        if (topBarController != null) {
            topBarController.setPageTitle("تخليص الفواتير");
            topBarController.setSidebar(sidebar);
            User u = AppSession.getInstance().getCurrentUser();
            if (u != null)
                topBarController.setUserData(u.getName(), u.getEmail() != null ? u.getEmail() : "");
        }
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

        adminInvoicesTable.setItems(invoicesList);
    }

    @FXML
    private void refreshTable() {
        invoicesList.clear();
        String filterStatus = statusFilter.getValue();

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

                // Calculate Totals form Items Array
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

                invoicesList.add(new InvoiceAdminModel(invNum, clientName, totalStr.toString(), dateStr, status, doc));
            }

        } catch (Exception e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "خطأ في تحميل البيانات: " + e.getMessage()).show();
        }
    }

    private void showInvoiceDetailsDialog(InvoiceAdminModel invoice) {
        Dialog<Void> dialog = new Dialog<>();
        dialog.setTitle("تفاصيل الفاتورة: " + invoice.getInvoiceNumber());
        dialog.setHeaderText("العميل: " + invoice.getClientName() + "\nالحالة الحالية: " + invoice.getStatus());

        ButtonType closeType = new ButtonType("إغلاق", ButtonBar.ButtonData.CANCEL_CLOSE);
        dialog.getDialogPane().getButtonTypes().add(closeType);

        VBox content = new VBox(15);
        content.setPadding(new Insets(20));
        content.setStyle("-fx-min-width: 500px;");

        TableView<Document> itemsTable = new TableView<>();
        itemsTable.setPrefHeight(200);

        TableColumn<Document, String> colItem = new TableColumn<>("البند");
        colItem.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getString("item")));
        colItem.setPrefWidth(250);

        TableColumn<Document, String> colPrice = new TableColumn<>("السعر");
        colPrice.setCellValueFactory(data -> {
            Double p = getDoubleSafe(data.getValue(), "itemPrice");
            String c = data.getValue().getString("currencyType");
            return new SimpleStringProperty(String.format("%.2f %s", p, c));
        });
        colPrice.setPrefWidth(150);

        itemsTable.getColumns().addAll(colItem, colPrice);

        List<Document> items = invoice.getSourceDoc().getList("invoiceItems", Document.class);
        if (items != null)
            itemsTable.setItems(FXCollections.observableArrayList(items));

        content.getChildren().addAll(new Label("بنود الفاتورة:"), itemsTable);

        HBox actions = new HBox(15);
        actions.setAlignment(Pos.CENTER);

        Button acceptBtn = new Button("قبول الفاتورة");
        acceptBtn.setStyle("-fx-background-color: #28a745; -fx-text-fill: white; -fx-font-weight: bold;");

        Button rejectBtn = new Button("رفض الفاتورة");
        rejectBtn.setStyle("-fx-background-color: #dc3545; -fx-text-fill: white; -fx-font-weight: bold;");

        Button pdfBtn = new Button("طباعة PDF");
        pdfBtn.setStyle("-fx-background-color: #17a2b8; -fx-text-fill: white; -fx-font-weight: bold;");

        if (!"في انتظار الموافقة".equals(invoice.getStatus())) {
            acceptBtn.setDisable(true);
            rejectBtn.setDisable(true);
        }

        acceptBtn.setOnAction(e -> {
            updateInvoiceStatus(invoice, "مقبولة");
            dialog.close();
        });

        rejectBtn.setOnAction(e -> {
            updateInvoiceStatus(invoice, "مرفوضة");
            dialog.close();
        });

        pdfBtn.setOnAction(e -> generatePdf(invoice));

        actions.getChildren().addAll(acceptBtn, rejectBtn, pdfBtn);
        content.getChildren().add(actions);

        dialog.getDialogPane().setContent(content);
        dialog.show();
    }

    private void updateInvoiceStatus(InvoiceAdminModel invoice, String newStatus) {
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("invoices");

            collection.updateOne(
                    Filters.eq("invoiceNumber", invoice.getInvoiceNumber()),
                    Updates.set("status", newStatus));

            new Alert(Alert.AlertType.INFORMATION, "تم تحديث الحالة إلى: " + newStatus).show();
            refreshTable();

        } catch (Exception e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "فشل التحديث: " + e.getMessage()).show();
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
            new Alert(Alert.AlertType.INFORMATION, "تم حفظ PDF بنجاح").show();

        } catch (Exception e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "فشل إنشاء PDF: " + e.getMessage()).show();
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