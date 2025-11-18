package noran.desktop.Controllers;

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
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.BaseDirection;
import com.itextpdf.layout.properties.Property;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.util.Duration;
import noran.desktop.Database.DatabaseConnection;

import java.io.File;
import java.io.IOException;
import java.sql.*;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class AcceptedInvoicesController {

    @FXML private TableView<InvoiceSummary> acceptedInvoicesTable;
    @FXML private TableColumn<InvoiceSummary, String> colInvoiceNumber;
    @FXML private TableColumn<InvoiceSummary, String> colClientName;
    @FXML private TableColumn<InvoiceSummary, Double> colTotalAmount;
    @FXML private TableColumn<InvoiceSummary, String> colDate;
    @FXML private TableColumn<InvoiceSummary, Void> colActions;

    private final ObservableList<InvoiceSummary> invoiceList = FXCollections.observableArrayList();

    private static final DateTimeFormatter ARABIC_DATE_FORMATTER = DateTimeFormatter
            .ofPattern("dd MMMM yyyy - hh:mm a", new Locale("ar"))
            .withZone(ZoneId.of("Africa/Cairo"));

    @FXML
    private void initialize() {
        setupTableColumns();
        setupActionColumn();
        loadAcceptedInvoices();
    }

    private void setupTableColumns() {
        colInvoiceNumber.setCellValueFactory(new PropertyValueFactory<>("invoiceNumber"));
        colClientName.setCellValueFactory(new PropertyValueFactory<>("clientName"));
        colTotalAmount.setCellValueFactory(new PropertyValueFactory<>("totalAmount"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("createdAt"));
        acceptedInvoicesTable.setItems(invoiceList);
    }

    private void setupActionColumn() {
        colActions.setCellFactory(param -> new TableCell<>() {
            private final Button viewBtn = new Button("عرض PDF");

            {
                viewBtn.setStyle("-fx-background-color: #28a745; -fx-text-fill: white; -fx-background-radius: 6; -fx-font-weight: bold; -fx-padding: 8 16;");
                viewBtn.setCursor(javafx.scene.Cursor.HAND);
            }

            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                    setGraphic(null);
                } else {
                    InvoiceSummary invoice = getTableRow().getItem();
                    viewBtn.setOnAction(e -> loadInvoiceDetailsAndGeneratePDF(invoice.getInvoiceNumber()));
                    setGraphic(viewBtn);
                }
            }
        });
    }

    private void loadAcceptedInvoices() {
        invoiceList.clear();
        String sql = """
            SELECT sf.invoiceNumber, sf.createdAt, u.fullname, u.taxNumber,
                   (COALESCE(sf.Port_fee_price, 0) + COALESCE(sf.Clearance_Fees_price, 0) +
                    COALESCE(sf.Expense_Tips_price, 0) + COALESCE(sf.Sundries_price, 0) +
                    COALESCE(sf.Additional_Services_price, 0) + COALESCE(sf.unsupportedItemPrice, 0)) AS total
            FROM shipment_fees sf
            JOIN shipments s ON sf.shipmentId = s.shipment_id
            JOIN users u ON s.clientId = u._id
            GROUP BY sf.invoiceNumber
            ORDER BY sf.createdAt DESC
            """;

        try (Connection conn = DatabaseConnection.connect();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                String invoiceNum = rs.getString("invoiceNumber");
                String clientName = rs.getString("fullname");
                String taxNumber = rs.getString("taxNumber");
                double total = rs.getDouble("total");

                String rawDate = rs.getString("createdAt");
                String niceDate = formatTimestamp(rawDate);

                invoiceList.add(new InvoiceSummary(
                        invoiceNum,
                        clientName + (taxNumber != null && !taxNumber.isEmpty() ? " (" + taxNumber + ")" : ""),
                        total,
                        niceDate
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            showBigMessage("خطأ في تحميل الفواتير", "فشل الاتصال بقاعدة البيانات", e.getMessage(), false);
        }
    }

    private void loadInvoiceDetailsAndGeneratePDF(String invoiceNumber) {
        String sql = """
            SELECT 
                sf.invoiceNumber,
                sf.createdAt,
                sf.Port_fee_price,
                sf.Clearance_Fees_price,
                sf.Expense_Tips_price,
                sf.Sundries_price,
                sf.Additional_Services_price,
                sf.unsupportedItemName,
                sf.unsupportedItemPrice,
                u.fullname,
                u.taxNumber
            FROM shipment_fees sf
            JOIN shipments s ON sf.shipmentId = s.shipment_id
            JOIN users u ON s.clientId = u._id
            WHERE sf.invoiceNumber = ?
            LIMIT 1
            """;

        try (Connection conn = DatabaseConnection.connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, invoiceNumber);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String clientName = rs.getString("fullname");
                    String taxNumber = rs.getString("taxNumber");
                    String rawDate = rs.getString("createdAt");
                    String niceDate = formatTimestamp(rawDate);

                    double port = rs.getDouble("Port_fee_price");
                    double clearance = rs.getDouble("Clearance_Fees_price");
                    double expenses = rs.getDouble("Expense_Tips_price");
                    double sundries = rs.getDouble("Sundries_price");
                    double additional = rs.getDouble("Additional_Services_price");
                    String manualName = rs.getString("unsupportedItemName");
                    double manualPrice = rs.getDouble("unsupportedItemPrice");

                    generatePdfFromDbData(invoiceNumber, clientName, taxNumber != null ? taxNumber : "غير متوفر",
                            niceDate, port, clearance, expenses, sundries, additional, manualName, manualPrice);
                } else {
                    showBigMessage("فاتورة غير موجودة", "لم يتم العثور على الفاتورة", "رقم الفاتورة: " + invoiceNumber, false);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            showBigMessage("خطأ قاعدة بيانات", "فشل في جلب بيانات الفاتورة", e.getMessage(), false);
        }
    }


    private String formatTimestamp(String timestampStr) {
        if (timestampStr == null || timestampStr.trim().isEmpty()) {
            return "غير محدد";
        }
        try {
            long timestamp = Long.parseLong(timestampStr);
            return Instant.ofEpochMilli(timestamp)
                    .atZone(ZoneId.of("Africa/Cairo"))
                    .format(ARABIC_DATE_FORMATTER);
        } catch (NumberFormatException e) {
            return "تاريخ غير صحيح";
        }
    }


    // --------------------------------------------------------------
    //   PDF CREATION — UPDATED WITH FULL RTL SUPPORT
    // --------------------------------------------------------------

    private void generatePdfFromDbData(String invoiceNumber, String clientName, String taxNumber,
                                       String invoiceDate, double port, double clearance, double expenses,
                                       double sundries, double additional, String manualName, double manualPrice) {

        FileChooser chooser = new FileChooser();
        chooser.setInitialFileName("فاتورة_" + invoiceNumber + ".pdf");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("PDF Files", "*.pdf"));
        File file = chooser.showSaveDialog(acceptedInvoicesTable.getScene().getWindow());
        if (file == null) return;

        try {
            PdfWriter writer = new PdfWriter(file);
            PdfDocument pdf = new PdfDocument(writer);

            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(70, 50, 70, 50);

            // ⭐ RTL support
            document.setTextAlignment(TextAlignment.RIGHT);
            document.setProperty(Property.BASE_DIRECTION, BaseDirection.RIGHT_TO_LEFT);


            String fontPath = "C:/Windows/Fonts/arial.ttf";
            PdfFont font = PdfFontFactory.createFont(fontPath, PdfEncodings.IDENTITY_H);

            try {
                Image logo = new Image(ImageDataFactory.create(getClass().getResource("/noran/desktop/images/Logo.png")));
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

            document.add(new Paragraph(shapeArabic("اسم العميل: " + clientName)).setFont(font).setFontSize(15));
//            document.add(new Paragraph(shapeArabic("الرقم الضريبي: " + taxNumber)).setFont(font).setFontSize(15));
            document.add(new Paragraph(shapeArabic("رقم الفاتورة: " + invoiceNumber)).setFont(font).setFontSize(15));
            document.add(new Paragraph(shapeArabic("التاريخ: " + invoiceDate)).setFont(font).setFontSize(15));
            document.add(new Paragraph("\n"));

            Table table = new Table(UnitValue.createPercentArray(new float[]{6, 2}))
                    .useAllAvailableWidth();

            // ⭐ RTL for table
            table.setTextAlignment(TextAlignment.RIGHT);
            table.setProperty(Property.BASE_DIRECTION, BaseDirection.RIGHT_TO_LEFT);


            table.addHeaderCell(
                    new Cell().add(new Paragraph(shapeArabic("الوصف"))
                                    .setFont(font).setBold().setBackgroundColor(ColorConstants.LIGHT_GRAY))
                            .setTextAlignment(TextAlignment.RIGHT)
            );

            table.addHeaderCell(
                    new Cell().add(new Paragraph(shapeArabic("السعر"))
                                    .setFont(font).setBold().setBackgroundColor(ColorConstants.LIGHT_GRAY))
                            .setTextAlignment(TextAlignment.RIGHT)
            );

            addRowIfNotZero(table, font, "رسوم الميناء", port);
            addRowIfNotZero(table, font, "رسوم التخليص", clearance);
            addRowIfNotZero(table, font, "مصروفات وإكراميات", expenses);
            addRowIfNotZero(table, font, "مصروفات متفرقة", sundries);
            addRowIfNotZero(table, font, "رسوم إضافية + نافذة واحدة", additional);

            if (manualName != null && !manualName.trim().isEmpty() && manualPrice > 0) {
                table.addCell(new Cell().add(new Paragraph(shapeArabic(manualName)).setFont(font))
                        .setTextAlignment(TextAlignment.RIGHT));
                table.addCell(new Cell().add(new Paragraph(String.format("%,.2f", manualPrice)).setFont(font))
                        .setTextAlignment(TextAlignment.RIGHT));
            }

            document.add(table);

            double total = port + clearance + expenses + sundries + additional + manualPrice;

            document.add(new Paragraph("\n"));
            document.add(new Paragraph(shapeArabic("المجموع الكلي: " + String.format("%,.2f جنيه مصري", total)))
                    .setFont(font).setFontSize(20).setBold()
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBackgroundColor(new DeviceRgb(240, 240, 240))
                    .setPadding(12));

            document.close();

            String successMessage = """
                تم إنشاء الفاتورة بنجاح!
                
                رقم الفاتورة: %s
                اسم العميل: %s
                الرقم الضريبي: %s
                التاريخ: %s
                
                ════════════════════════════════════
                التفاصيل المالية:
                • رسوم الميناء              : %,.2f جنيه
                • رسوم التخليص              : %,.2f جنيه
                • مصروفات وإكراميات        : %,.2f جنيه
                • مصروفات متفرقة           : %,.2f جنيه
                • خدمات إضافية + نافذة      : %,.2f جنيه
                %s
                ════════════════════════════════════
                المجموع الكلي               : %,.2f جنيه مصري
                
                تم حفظ الملف في:
                %s
                """.formatted(
                    invoiceNumber, clientName, taxNumber, invoiceDate,
                    port, clearance, expenses, sundries, additional,
                    (manualName != null && !manualName.isEmpty()) ? "• " + manualName + "        : " + String.format("%,.2f", manualPrice) + " جنيه\n" : "",
                    total, file.getAbsolutePath()
            );

            showBigMessage("تم إنشاء الفاتورة بنجاح", "تم حفظ الملف بنجاح!", successMessage, true);

        } catch (Exception e) {
            e.printStackTrace();
            showBigMessage("فشل في إنشاء الـ PDF", "حدث خطأ!", e.getMessage(), false);
        }
    }


    private void addRowIfNotZero(Table table, PdfFont font, String desc, double price) {
        if (price > 0) {
            table.addCell(new Cell().add(new Paragraph(shapeArabic(desc)).setFont(font))
                    .setTextAlignment(TextAlignment.RIGHT));
            table.addCell(new Cell().add(new Paragraph(String.format("%,.2f", price)).setFont(font))
                    .setTextAlignment(TextAlignment.RIGHT));
        }
    }


    private String shapeArabic(String text) {
        if (text == null) return "";
        try {
            ArabicShaping shaper = new ArabicShaping(ArabicShaping.LETTERS_SHAPE);
            String shaped = shaper.shape(text);
            Bidi bidi = new Bidi(shaped, Bidi.DIRECTION_RIGHT_TO_LEFT);
            return bidi.writeReordered(Bidi.DO_MIRRORING | Bidi.REMOVE_BIDI_CONTROLS);
        } catch (ArabicShapingException e) {
            return text;
        }
    }

    private void showBigMessage(String title, String header, String content, boolean isSuccess) {
        Stage dialog = new Stage();
        dialog.initModality(Modality.APPLICATION_MODAL);
        dialog.setTitle(title);
        dialog.setResizable(false);

        TextArea textArea = new TextArea(content);
        textArea.setEditable(false);
        textArea.setWrapText(true);
        textArea.setPrefRowCount(24);
        textArea.setPrefColumnCount(90);
        textArea.setStyle("-fx-font-family: 'Consolas', 'Courier New', monospace; -fx-font-size: 15px; -fx-background-color: #f8f9fa;");

        Button copyBtn = new Button("نسخ النص كاملاً");
        copyBtn.setStyle("-fx-background-color: #0078d4; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 12 30; -fx-background-radius: 8;");
        copyBtn.setOnAction(e -> {
            Clipboard clipboard = Clipboard.getSystemClipboard();
            ClipboardContent cc = new ClipboardContent();
            cc.putString(content);
            clipboard.setContent(cc);
            copyBtn.setText("تم النسخ!");
            new Timeline(new KeyFrame(Duration.seconds(2), ev -> copyBtn.setText("نسخ النص كاملاً"))).play();
        });

        Button closeBtn = new Button("إغلاق");
        closeBtn.setStyle("-fx-background-color: #dc3545; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 12 30; -fx-background-radius: 8;");
        closeBtn.setOnAction(e -> dialog.close());

        HBox buttons = new HBox(20, copyBtn, closeBtn);
        buttons.setAlignment(Pos.CENTER);
        buttons.setPadding(new Insets(15));

        Label headerLabel = new Label(header);
        headerLabel.setStyle("-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: " + (isSuccess ? "#28a745" : "#dc3545") + ";");

        VBox root = new VBox(20, headerLabel, textArea, buttons);
        root.setPadding(new Insets(25));
        root.setStyle("-fx-background-color: white; -fx-border-color: #dee2e6; -fx-border-width: 3; -fx-background-radius: 15; -fx-border-radius: 15;");

        Scene scene = new Scene(root, 960, 700);
        dialog.setScene(scene);
        dialog.showAndWait();
    }

    @FXML
    private void goBack() throws IOException {
        Stage stage = (Stage) acceptedInvoicesTable.getScene().getWindow();
        Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/client-data-invoice.fxml"));
        stage.setScene(new Scene(root));
        stage.setTitle("إنشاء فاتورة جديدة");
        stage.centerOnScreen();
    }

    public static class InvoiceSummary {
        private final String invoiceNumber;
        private final String clientName;
        private final double totalAmount;
        private final String createdAt;

        public InvoiceSummary(String invoiceNumber, String clientName, double totalAmount, String createdAt) {
            this.invoiceNumber = invoiceNumber;
            this.clientName = clientName;
            this.totalAmount = totalAmount;
            this.createdAt = createdAt;
        }

        public String getInvoiceNumber() { return invoiceNumber; }
        public String getClientName() { return clientName; }
        public double getTotalAmount() { return totalAmount; }
        public String getCreatedAt() { return createdAt; }
    }
}


// ---------------- END OF FULL CODE ----------------
