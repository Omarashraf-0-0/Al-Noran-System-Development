package noran.desktop.Controllers;

import noran.desktop.Utils.AlertUtils;

import com.ibm.icu.text.ArabicShaping;
import com.ibm.icu.text.ArabicShapingException;
import com.ibm.icu.text.Bidi;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.BaseDirection;
import com.itextpdf.layout.properties.Property;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import javafx.beans.property.SimpleStringProperty;
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
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import javafx.scene.layout.VBox;
import noran.desktop.AppSession;
import noran.desktop.Database.MongoConnection;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class AcceptedInvoicesController {

    @FXML
    private TableView<AcceptedInvoiceModel> acceptedInvoicesTable;
    @FXML
    private TableColumn<AcceptedInvoiceModel, String> colInvoiceNumber;
    @FXML
    private TableColumn<AcceptedInvoiceModel, String> colClientName;
    @FXML
    private TableColumn<AcceptedInvoiceModel, String> colTotalAmount;
    @FXML
    private TableColumn<AcceptedInvoiceModel, String> colDate;
    @FXML
    private TableColumn<AcceptedInvoiceModel, Void> colActions;

    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    private final ObservableList<AcceptedInvoiceModel> invoiceList = FXCollections.observableArrayList();

    @FXML
    private void initialize() {
        setupTableColumns();
        loadAcceptedInvoices();

        if (topBarController != null) {
            topBarController.setPageTitle("الفواتير المقبولة");
            topBarController.setSidebar(sidebar);
            User u = AppSession.getInstance().getCurrentUser();
            if (u != null)
                topBarController.setUserData(u.getName(), u.getEmail() != null ? u.getEmail() : "");
        }

        if (sidebarController != null) {
            sidebarController.setActivePage("invoice completion");
        }
    }

    private void setupTableColumns() {
        colInvoiceNumber.setCellValueFactory(new PropertyValueFactory<>("invoiceNumber"));
        colClientName.setCellValueFactory(new PropertyValueFactory<>("clientName"));
        colTotalAmount.setCellValueFactory(new PropertyValueFactory<>("totalAmount"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("createdAt"));

        colActions.setCellFactory(param -> new TableCell<>() {
            private final Button viewBtn = new Button("عرض PDF");
            {
                viewBtn.setStyle(
                        "-fx-background-color: #28a745; -fx-text-fill: white; -fx-background-radius: 6; -fx-font-weight: bold;");
                viewBtn.setCursor(javafx.scene.Cursor.HAND);
            }

            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                    setGraphic(null);
                } else {
                    AcceptedInvoiceModel invoice = getTableRow().getItem();
                    viewBtn.setOnAction(e -> generatePdf(invoice));
                    setGraphic(viewBtn);
                }
            }
        });

        acceptedInvoicesTable.setItems(invoiceList);
    }

    private void loadAcceptedInvoices() {
        // Show loading indicator
        acceptedInvoicesTable.setPlaceholder(new javafx.scene.control.Label("جاري تحميل البيانات..."));

        invoiceList.clear();
        try {
            MongoDatabase db = MongoConnection.getDatabase();
            MongoCollection<Document> collection = db.getCollection("invoices");

            List<Bson> pipeline = new ArrayList<>();
            pipeline.add(Aggregates.lookup("users", "userId", "_id", "userDetails"));
            pipeline.add(Aggregates.match(Filters.eq("status", "مقبولة")));
            pipeline.add(Aggregates.sort(Sorts.descending("createdAt")));

            for (Document doc : collection.aggregate(pipeline)) {
                String invNum = doc.getString("invoiceNumber");

                Date dateObj = doc.getDate("createdAt");
                String dateStr = dateObj != null ? new SimpleDateFormat("dd/MM/yyyy").format(dateObj) : "N/A";

                String clientName = "Unknown";
                List<Document> users = doc.getList("userDetails", Document.class);
                if (users != null && !users.isEmpty()) {
                    clientName = users.get(0).getString("fullname");
                }

                // Calc Total
                List<Document> items = doc.getList("invoiceItems", Document.class);
                double sumEGP = 0;
                double sumUSD = 0;
                if (items != null) {
                    for (Document item : items) {
                        double price = getDoubleSafe(item, "itemPrice");
                        if ("USD".equalsIgnoreCase(item.getString("currencyType")))
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

                invoiceList.add(new AcceptedInvoiceModel(invNum, clientName, totalStr.toString(), dateStr, doc));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // PDF Logic
    private void generatePdf(AcceptedInvoiceModel invoice) {
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

            document.add(new Paragraph(shapeArabic("فاتورة رسمية")).setFont(font).setFontSize(24).setBold()
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("\n"));
            document.add(new Paragraph(shapeArabic("رقم الفاتورة: " + invoice.getInvoiceNumber())).setFont(font));
            document.add(new Paragraph(shapeArabic("العميل: " + invoice.getClientName())).setFont(font));
            document.add(new Paragraph("\n"));

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
            document.add(new Paragraph(shapeArabic("الإجمالي: " + invoice.getTotalAmount()))
                    .setFont(font).setFontSize(16).setBold().setTextAlignment(TextAlignment.RIGHT));

            document.close();
            AlertUtils.showSuccess("تم بنجاح", "تم حفظ PDF بنجاح");

        } catch (Exception e) {
            e.printStackTrace();
            AlertUtils.showError("خطأ", "فشل إنشاء PDF: " + e.getMessage());
        }
    }

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

    @FXML
    public void goBack(ActionEvent e) throws IOException {
        navigate(e, "/noran/desktop/client-data-invoice.fxml");
    }

    private void navigate(ActionEvent event, String fxml) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxml));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.getScene().setRoot(root);
    }

    public static class AcceptedInvoiceModel {
        private final String invoiceNumber;
        private final String clientName;
        private final String totalAmount;
        private final String createdAt;
        private final Document sourceDoc;

        public AcceptedInvoiceModel(String invoiceNumber, String clientName, String totalAmount, String createdAt,
                Document sourceDoc) {
            this.invoiceNumber = invoiceNumber;
            this.clientName = clientName;
            this.totalAmount = totalAmount;
            this.createdAt = createdAt;
            this.sourceDoc = sourceDoc;
        }

        public String getInvoiceNumber() {
            return invoiceNumber;
        }

        public String getClientName() {
            return clientName;
        }

        public String getTotalAmount() {
            return totalAmount;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public Document getSourceDoc() {
            return sourceDoc;
        }
    }

    @FXML
    public void refresh(ActionEvent e) {
        loadAcceptedInvoices();
    }
}