package noran.desktop.Controllers;

import com.ibm.icu.text.ArabicShaping;
import com.ibm.icu.text.ArabicShapingException;
import com.ibm.icu.text.Bidi;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.mongodb.client.MongoCollection;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.GridPane;
import javafx.stage.FileChooser;
import noran.desktop.AppSession;
import noran.desktop.Database.MongoDirectConnection;
import org.bson.types.ObjectId;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;

public class AdminAddInvoiceController {

    @FXML private TextField clientNameField;
    @FXML private Label invoiceNumberLabel;
    @FXML private Label invoiceDateLabel;
    @FXML private TableView<InvoiceRow> invoiceTable;
    @FXML private TableColumn<InvoiceRow, String> colDesc;
    @FXML private TableColumn<InvoiceRow, Double> colPrice;
    @FXML private Label totalLabel;

    private final ObservableList<InvoiceRow> items = FXCollections.observableArrayList();

    // ================= INITIALIZE =================

    public void initialize() {

        colDesc.setCellValueFactory(new PropertyValueFactory<>("description"));
        colPrice.setCellValueFactory(new PropertyValueFactory<>("price"));
        invoiceTable.setItems(items);

        invoiceNumberLabel.setText("INV-" + System.currentTimeMillis());
        invoiceDateLabel.setText(new SimpleDateFormat("dd/MM/yyyy").format(new Date()));

        items.addListener((javafx.collections.ListChangeListener<InvoiceRow>) c -> updateTotal());
    }

    // ================= CURRENCY CONVERSION =================

    private double convertToEGP(double price, String currency) {
        if ("USD".equalsIgnoreCase(currency)) {
            return price * 50;
        }
        return price; // EGP
    }

    // ================= ADD ITEM =================

    @FXML
    private void addNewRow() {

        Dialog<InvoiceRow> dialog = new Dialog<>();
        dialog.setTitle("إضافة بند جديد");

        ButtonType addBtn = new ButtonType("إضافة", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(addBtn, ButtonType.CANCEL);

        TextField descField = new TextField();
        TextField priceField = new TextField();

        ChoiceBox<String> currencyBox = new ChoiceBox<>();
        currencyBox.getItems().addAll("EGP", "USD");
        currencyBox.setValue("EGP");

        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);

        grid.add(new Label("اسم البند:"), 0, 0);
        grid.add(descField, 1, 0);

        grid.add(new Label("السعر:"), 0, 1);
        grid.add(priceField, 1, 1);

        grid.add(new Label("العملة:"), 0, 2);
        grid.add(currencyBox, 1, 2);

        dialog.getDialogPane().setContent(grid);

        dialog.setResultConverter(btn -> {
            if (btn == addBtn) {
                try {
                    return new InvoiceRow(
                            descField.getText().trim(),
                            Double.parseDouble(priceField.getText().trim()),
                            currencyBox.getValue()
                    );
                } catch (Exception e) {
                    new Alert(Alert.AlertType.ERROR, "بيانات غير صحيحة").show();
                }
            }
            return null;
        });

        dialog.showAndWait().ifPresent(items::add);
    }

    // ================= DELETE =================

    @FXML
    private void deleteSelectedRow() {
        InvoiceRow row = invoiceTable.getSelectionModel().getSelectedItem();
        if (row != null) items.remove(row);
    }

    // ================= TOTAL =================

    private void updateTotal() {
        double total = items.stream()
                .mapToDouble(r -> convertToEGP(r.getPrice(), r.getCurrency()))
                .sum();

        totalLabel.setText(String.format("المجموع الكلي: %,.2f جنيه مصري", total));
    }

    // ================= GENERATE PDF (UNCHANGED FORM) =================

    @FXML
    private void generatePdf() {

        String clientName = clientNameField.getText().trim();
        if (clientName.isEmpty()) {
            new Alert(Alert.AlertType.ERROR, "يرجى إدخال اسم العميل").show();
            return;
        }

        if (items.isEmpty() || items.stream().allMatch(i -> i.getPrice() <= 0)) {
            new Alert(Alert.AlertType.WARNING, "أضف على الأقل بند واحد بقيمة أكبر من صفر").show();
            return;
        }

        FileChooser chooser = new FileChooser();
        chooser.setInitialFileName("فاتورة_" + invoiceNumberLabel.getText() + ".pdf");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("PDF Files", "*.pdf"));
        File file = chooser.showSaveDialog(invoiceTable.getScene().getWindow());
        if (file == null) return;

        try {
            PdfWriter writer = new PdfWriter(file);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(70, 50, 70, 50);

            PdfFont font = PdfFontFactory.createFont("C:/Windows/Fonts/arial.ttf", "Identity-H");

            try {
                Image logo = new Image(ImageDataFactory.create(
                        getClass().getResource("/noran/desktop/images/Logo.png")));
                logo.setFixedPosition(0, 0);
                logo.setWidth(pdf.getDefaultPageSize().getWidth());
                logo.setHeight(pdf.getDefaultPageSize().getHeight());
                logo.setOpacity(0.08f);
                document.add(logo);
            } catch (Exception ignored) {}

            document.add(new Paragraph(shapeArabic("فاتورة رسمية"))
                    .setFont(font).setFontSize(28).setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\n"));

            document.add(new Paragraph(shapeArabic("اسم العميل: " + clientName)).setFont(font).setFontSize(16));
            document.add(new Paragraph(shapeArabic("رقم الفاتورة: " + invoiceNumberLabel.getText())).setFont(font).setFontSize(15));
            document.add(new Paragraph(shapeArabic("التاريخ: " + invoiceDateLabel.getText())).setFont(font).setFontSize(15));
            document.add(new Paragraph("\n"));

            Table table = new Table(UnitValue.createPercentArray(new float[]{6, 2}))
                    .useAllAvailableWidth()
                    .setTextAlignment(TextAlignment.RIGHT);

            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("الوصف")).setFont(font).setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY)));
            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("السعر")).setFont(font).setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY)));

            double total = 0;
            for (InvoiceRow row : items) {
                if (row.getPrice() > 0) {
                    double egp = convertToEGP(row.getPrice(), row.getCurrency());
                    table.addCell(new Cell().add(new Paragraph(shapeArabic(row.getDescription())).setFont(font)));
                    table.addCell(new Cell().add(new Paragraph(String.format("%,.2f", egp)).setFont(font)));
                    total += egp;
                }
            }

            document.add(table);
            document.add(new Paragraph("\n"));

            document.add(new Paragraph(shapeArabic("المجموع الكلي: " + String.format("%,.2f جنيه مصري", total)))
                    .setFont(font).setFontSize(20).setBold()
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBackgroundColor(new DeviceRgb(240, 255, 240))
                    .setPadding(12));

            document.close();

            saveInvoiceToMongo(clientName);

            new Alert(Alert.AlertType.INFORMATION,
                    "تم إنشاء الفاتورة بنجاح وحفظها في قاعدة البيانات").show();

        } catch (Exception e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "فشل في إنشاء PDF:\n" + e.getMessage()).show();
        }
    }

    // ================= SAVE TO MONGO =================

    private void saveInvoiceToMongo(String clientName) {

        var db = MongoDirectConnection.connect();
        if (db == null) return;

        MongoCollection<org.bson.Document> invoices = db.getCollection("invoices");

        User currentUser = AppSession.getInstance().getCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            MongoDirectConnection.close();
            return;
        }

        java.util.List<org.bson.Document> itemsList = new java.util.ArrayList<>();

        for (InvoiceRow row : items) {
            if (row.getPrice() <= 0) continue;

            itemsList.add(new org.bson.Document()
                    .append("item", row.getDescription())
                    .append("itemPrice", convertToEGP(row.getPrice(), row.getCurrency()))
                    .append("currencyType", row.getCurrency()));
        }

        Date now = new Date();

        org.bson.Document invoiceDoc = new org.bson.Document()
                .append("invoiceNumber", invoiceNumberLabel.getText())
                .append("username", clientName)
                .append("employeeId", new ObjectId(currentUser.getId()))
                .append("userId", null)
                .append("shipmentId", null)
                .append("items", itemsList)
                .append("createdAt", now)
                .append("updatedAt", now);

        invoices.insertOne(invoiceDoc);
        MongoDirectConnection.close();
    }

    // ================= MODEL =================

    public static class InvoiceRow {
        private final String description;
        private final double price;
        private final String currency;

        public InvoiceRow(String description, double price, String currency) {
            this.description = description;
            this.price = price;
            this.currency = currency;
        }

        public String getDescription() { return description; }
        public double getPrice() { return price; }
        public String getCurrency() { return currency; }
    }

    // ================= ARABIC =================

    private String shapeArabic(String text) {
        if (text == null || text.isEmpty()) return "";
        try {
            ArabicShaping shaper = new ArabicShaping(ArabicShaping.LETTERS_SHAPE);
            String shaped = shaper.shape(text);
            Bidi bidi = new Bidi(shaped, Bidi.DIRECTION_RIGHT_TO_LEFT);
            return bidi.writeReordered(Bidi.DO_MIRRORING | Bidi.REMOVE_BIDI_CONTROLS);
        } catch (ArabicShapingException e) {
            return text;
        }
    }
}
