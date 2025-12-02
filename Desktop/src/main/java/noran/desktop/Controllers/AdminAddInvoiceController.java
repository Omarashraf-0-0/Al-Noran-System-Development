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
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.GridPane;
import javafx.stage.FileChooser;

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

    public void initialize() {
        // Table setup
        colDesc.setCellValueFactory(new PropertyValueFactory<>("description"));
        colPrice.setCellValueFactory(new PropertyValueFactory<>("price"));
        invoiceTable.setItems(items);

        // Invoice number & date
        invoiceNumberLabel.setText("INV-" + System.currentTimeMillis() % 1000000);
        invoiceDateLabel.setText(new SimpleDateFormat("dd/MM/yyyy").format(new Date()));

        // Recalculate total whenever list changes
        items.addListener((javafx.collections.ListChangeListener<InvoiceRow>) c -> updateTotal());

        // Add a default empty row so user can start typing immediately
        addEmptyRow();
    }

    private InvoiceRow showAddItemDialog() {
        // إنشاء Dialog
        Dialog<InvoiceRow> dialog = new Dialog<>();
        dialog.setTitle("إضافة بند جديد");
        dialog.setHeaderText("اكتب اسم البند والسعر");

        // زر تأكيد وإلغاء
        ButtonType addButtonType = new ButtonType("إضافة", ButtonBar.ButtonData.OK_DONE);
        dialog.getDialogPane().getButtonTypes().addAll(addButtonType, ButtonType.CANCEL);

        // عناصر الإدخال
        TextField descField = new TextField();
        descField.setPromptText("اسم البند");

        TextField priceField = new TextField();
        priceField.setPromptText("السعر");

        // تصميم بسيط
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);

        grid.add(new Label("اسم البند:"), 0, 0);
        grid.add(descField, 1, 0);

        grid.add(new Label("السعر:"), 0, 1);
        grid.add(priceField, 1, 1);

        dialog.getDialogPane().setContent(grid);

        // منع إضافة بند بدون بيانات
        Node addButton = dialog.getDialogPane().lookupButton(addButtonType);
        addButton.setDisable(true);

        // تفعيل الزر عند إدخال اسم وسعر
        descField.textProperty().addListener((obs, oldVal, newVal) -> {
            addButton.setDisable(newVal.trim().isEmpty() || priceField.getText().trim().isEmpty());
        });

        priceField.textProperty().addListener((obs, oldVal, newVal) -> {
            addButton.setDisable(newVal.trim().isEmpty() || descField.getText().trim().isEmpty());
        });

        // عند الضغط على إضافة، يرجّع InvoiceRow جديد
        dialog.setResultConverter(button -> {
            if (button == addButtonType) {
                try {
                    double price = Double.parseDouble(priceField.getText().trim());
                    return new InvoiceRow(descField.getText().trim(), price);
                } catch (NumberFormatException e) {
                    new Alert(Alert.AlertType.ERROR, "السعر يجب أن يكون رقمًا صحيحًا!").show();
                }
            }
            return null;
        });

        return dialog.showAndWait().orElse(null);
    }



    @FXML
    private void addNewRow() {
        InvoiceRow newItem = showAddItemDialog();

        if (newItem != null) {
            items.add(newItem);
            updateTotal();
        }
    }


    private void addEmptyRow() {
        int newRowIndex = items.size();
        items.add(new InvoiceRow("اضغط هنا لكتابة الوصف", 0.0));

        // ننتظر قليلاً حتى يُضاف الصف ثم نبدأ التعديل
        javafx.application.Platform.runLater(() -> {
            invoiceTable.scrollTo(newRowIndex);
            invoiceTable.getSelectionModel().select(newRowIndex);
            invoiceTable.getFocusModel().focus(newRowIndex, colDesc);
            invoiceTable.edit(newRowIndex, colDesc); // الطريقة الصحيحة الآن
        });
    }

    @FXML
    private void deleteSelectedRow() {
        InvoiceRow selected = invoiceTable.getSelectionModel().getSelectedItem();
        if (selected != null) {
            items.remove(selected);
        } else {
            new Alert(Alert.AlertType.WARNING, "يرجى اختيار بند للحذف").show();
        }
    }

    private void updateTotal() {
        double total = items.stream().mapToDouble(InvoiceRow::getPrice).sum();
        totalLabel.setText(String.format("المجموع الكلي: %, .2f جنيه", total));
    }

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

            String fontPath = "C:/Windows/Fonts/arial.ttf"; // or any Arabic-supporting font
            PdfFont font = PdfFontFactory.createFont(fontPath, "Identity-H");

            // Watermark Logo
            try {
                Image logo = new Image(ImageDataFactory.create(getClass().getResource("/noran/desktop/images/Logo.png")));
                logo.setFixedPosition(0, 0);
                logo.setWidth(pdf.getDefaultPageSize().getWidth());
                logo.setHeight(pdf.getDefaultPageSize().getHeight());
                logo.setOpacity(0.08f);
                document.add(logo);
            } catch (Exception ignored) {}

            // Title
            document.add(new Paragraph(shapeArabic("فاتورة رسمية"))
                    .setFont(font).setFontSize(28).setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\n"));

            // Header info
            document.add(new Paragraph(shapeArabic("اسم العميل: " + clientName)).setFont(font).setFontSize(16));
            document.add(new Paragraph(shapeArabic("رقم الفاتورة: " + invoiceNumberLabel.getText())).setFont(font).setFontSize(15));
            document.add(new Paragraph(shapeArabic("التاريخ: " + invoiceDateLabel.getText())).setFont(font).setFontSize(15));
            document.add(new Paragraph("\n"));

            // Table
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
                    table.addCell(new Cell().add(new Paragraph(shapeArabic(row.getDescription())).setFont(font)));
                    table.addCell(new Cell().add(new Paragraph(String.format("%,.2f", row.getPrice())).setFont(font)));
                    total += row.getPrice();
                }
            }

            document.add(table);

            // Total
            document.add(new Paragraph("\n"));
            document.add(new Paragraph(shapeArabic("المجموع الكلي: " + String.format("%,.2f جنيه مصري", total)))
                    .setFont(font).setFontSize(20).setBold()
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBackgroundColor(new DeviceRgb(240, 255, 240))
                    .setPadding(12));

            document.close();

            new Alert(Alert.AlertType.INFORMATION,
                    "تم إنشاء الفاتورة بنجاح!\nالملف: " + file.getAbsolutePath()).show();

        } catch (Exception e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "فشل في إنشاء PDF:\n" + e.getMessage()).show();
        }
    }

    // Helper class for table rows
    public static class InvoiceRow {
        private String description;
        private double price;

        public InvoiceRow(String description, double price) {
            this.description = description;
            this.price = price;
        }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
    }

    // Arabic shaping (same as you already use)
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