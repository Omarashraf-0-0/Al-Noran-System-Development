package noran.desktop;

import com.ibm.icu.text.ArabicShaping;
import com.ibm.icu.text.ArabicShapingException;
import com.ibm.icu.text.Bidi;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.image.ImageDataFactory;
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
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
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
import noran.desktop.models.InvoiceItem;
import noran.desktop.models.Shipment;
import noran.desktop.Database.DatabaseConnection;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.sql.*;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.ResourceBundle;

public class HelloController implements Initializable {

    @FXML private Label clientNameLabel;
    @FXML private Label taxNumberLabel;
    @FXML private Label invoiceNumberLabel;
    @FXML private Label invoiceDateLabel;
    @FXML private ComboBox<Shipment> clientShipmentComboBox;
    @FXML private TableView<InvoiceItem> invoicesTable;
    @FXML private TableColumn<InvoiceItem, String> colDescription;
    @FXML private TableColumn<InvoiceItem, Double> colPrice;
    @FXML private TableColumn<InvoiceItem, String> colDate;
    @FXML private Label totalCost;

    private final ObservableList<Shipment> shipmentList = FXCollections.observableArrayList();
    private final ObservableList<InvoiceItem> invoiceItems = FXCollections.observableArrayList();
    private String selectedClientId;
    private String selectedClientRank = "low";
    private Shipment selectedShipment;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        setupTable();
        setupComboBox();
        invoiceItems.addListener((javafx.collections.ListChangeListener<InvoiceItem>) c -> updateTotal());
        invoiceDateLabel.setText("التاريخ: " + new SimpleDateFormat("dd/MM/yyyy").format(new Date()));
    }

    private void setupTable() {
        colDescription.setCellValueFactory(new PropertyValueFactory<>("description"));
        colPrice.setCellValueFactory(new PropertyValueFactory<>("price"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("date"));
        invoicesTable.setItems(invoiceItems);
    }

    private void setupComboBox() {
        clientShipmentComboBox.setItems(shipmentList);
        clientShipmentComboBox.getSelectionModel().selectedItemProperty().addListener((obs, old, newVal) -> {
            if (newVal != null) {
                selectedShipment = newVal;
                generateInvoiceForShipment(newVal);
            }
        });
    }

    public void setSelectedClient(String name, String taxNumber, String clientType, String id, String rank) {
        if (id != null) id = id.trim();
        System.out.println("[DEBUG] setSelectedClient called with id='" + id + "', name='" + name + "', rank='" + rank + "'");
        this.selectedClientId = id;
        this.selectedClientRank = (rank == null || rank.isEmpty()) ? "low" : rank.toLowerCase();
        clientNameLabel.setText("اسم العميل: " + (name != null ? name : "غير محدد"));
        taxNumberLabel.setText("الرقم الضريبي: " + (taxNumber != null && !taxNumber.equals("-") ? taxNumber : "غير متوفر"));
        invoiceItems.clear();
        shipmentList.clear();
        if (id != null && !id.isEmpty()) {
            loadShipmentsForClient(id);
        } else {
            clientShipmentComboBox.setPromptText("لا توجد شحنات لهذا العميل");
        }
    }

    private void loadShipmentsForClient(String clientId) {
        shipmentList.clear();
        String sql = "SELECT shipment_id, port_name, num_of_containers, type_of_containers_json, status, dragt FROM shipments WHERE clientId = ? AND (dragt = 0 OR dragt IS NULL) ORDER BY shipment_id DESC";
        try (Connection conn = DatabaseConnection.connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, clientId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int id = rs.getInt("shipment_id");
                    String port = rs.getString("port_name");
                    int num = rs.getInt("num_of_containers");
                    String types = rs.getString("type_of_containers_json");
                    String status = rs.getString("status");
                    Shipment s = new Shipment(id, port, num, status);
                    s.setTypeOfContainersJson(types);
                    shipmentList.add(s);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        clientShipmentComboBox.setPromptText(shipmentList.isEmpty() ? "لا توجد شحنات" : "اختر الشحنة");
    }

    private void generateInvoiceForShipment(Shipment shipment) {
        invoiceItems.clear();
        double portPrice = getPortPrice(shipment.getPortName());
        int containers = Math.max(shipment.getNumOfContainers(), 1);
        double extraContainers = containers > 2 ? (containers - 2) * 500 : 0;

        double clearancePer = 0, expensesPer = 0, sundriesPer = 0;
        String json = shipment.getTypeOfContainersJson();
        if (json != null && !json.trim().isEmpty()) {
            json = json.replaceAll("[\\[\\]\"]", "").trim();
            for (String type : json.split(",")) {
                String t = type.trim().toLowerCase();
                if (t.contains("20")) { clearancePer += 5000; expensesPer += 3000; sundriesPer += 1000; }
                else if (t.contains("40")) { clearancePer += 6000; expensesPer += 3500; sundriesPer += 1500; }
                else if (!t.isEmpty()) { clearancePer += 5500; expensesPer += 3250; sundriesPer += 1250; }
            }
        }
        if (clearancePer == 0) {
            clearancePer = 5500; expensesPer = 3250; sundriesPer = 1250;
        }

        double clearanceFees = clearancePer * containers;
        double expensesTips = expensesPer * containers;
        double sundries = sundriesPer * containers;
        double singleWindow = 1000;

        double rankMultiplier = switch (selectedClientRank) {
            case "med", "rank2" -> 1.015;
            case "high", "rank3" -> 1.025;
            default -> 1.0;
        };

        double adjPort = portPrice * rankMultiplier;
        double adjClearance = clearanceFees * rankMultiplier;
        double adjExpenses = expensesTips * rankMultiplier;
        double adjSundries = sundries * rankMultiplier;
        double adjExtra = extraContainers * rankMultiplier;
        double adjSingle = singleWindow * rankMultiplier;

        invoiceItems.add(new InvoiceItem("رسوم الميناء", adjPort, "مُحسب"));
        invoiceItems.add(new InvoiceItem("رسوم التخليص", adjClearance, "مُحسب"));
        invoiceItems.add(new InvoiceItem("مصروفات وإكراميات", adjExpenses, "مُحسب"));
        invoiceItems.add(new InvoiceItem("مصروفات متفرقة", adjSundries, "مُحسب"));
        invoiceItems.add(new InvoiceItem("رسوم اضافية للحاويات الزائدة", adjExtra, "مُحسب"));
        invoiceItems.add(new InvoiceItem("رسوم النافذة الواحدة", adjSingle, "مُحسب"));

        invoiceNumberLabel.setText("رقم الفاتورة: INV-" + shipment.getId() + "-" + (System.currentTimeMillis() % 10000));
        updateTotal();

        markShipmentAsInvoiced(shipment.getId());
        saveInvoiceToDatabase(shipment.getId(), adjPort, adjClearance, adjExpenses, adjSundries, adjExtra, adjSingle);
    }

    private double getPortPrice(String port) {
        return switch (port) {
            case "Port of Alexandria" -> 5000;
            case "Port of El-Dekheila" -> 4800;
            case "Port of Damietta" -> 4500;
            case "Port Said" -> 4200;
            case "Port of Suez" -> 4000;
            case "Port of Adabiya" -> 3800;
            case "Port of Ain Sukhna" -> 3700;
            case "Port of Safaga" -> 3500;
            case "Port of Nuweiba" -> 3300;
            case "Port of Ras Shukeir" -> 3100;
            default -> 4100;
        };
    }

    private void markShipmentAsInvoiced(int shipmentId) {
        String sql = "UPDATE shipments SET dragt = 1 WHERE shipment_id = ?";
        try (Connection c = DatabaseConnection.connect(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, shipmentId);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    private void saveInvoiceToDatabase(int shipmentId, double port, double clearance, double expenses, double sundries, double extra, double single) {
        String invoiceNum = invoiceNumberLabel.getText().replace("رقم الفاتورة: ", "");
        String sql = "INSERT INTO shipment_fees (invoiceNumber, shipmentId, feeName, feePrice, " +
                "Port_fee_price, Clearance_Fees_price, Expense_Tips_price, Sundries_price, " +
                "Additional_Services_price, invoiceStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)";
        Timestamp now = new Timestamp(System.currentTimeMillis());
        try (Connection c = DatabaseConnection.connect();
             PreparedStatement ps = c.prepareStatement(sql)) {
            // Insert each row...
            // (your existing logic unchanged)
            ps.setString(1, invoiceNum); ps.setInt(2, shipmentId);
            // ... rest of your batch logic
        } catch (SQLException e) { e.printStackTrace(); }
    }



    @FXML
    public void addNewInvoiceRow() {
        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle("إضافة عنصر يدوي");
        dialog.setHeaderText("أدخل اسم العنصر والسعر");
        dialog.setContentText("الاسم:");

        dialog.showAndWait().ifPresent(name -> {

            // 🔍 التحقق من أن الاسم يحتوي على حرف واحد على الأقل وليس أرقامًا فقط
            if (name == null || name.trim().isEmpty() || name.trim().matches("\\d+")) {
                Alert a = new Alert(Alert.AlertType.ERROR, "يجب إدخال اسم صحيح يحتوي على حرف واحد على الأقل!");
                a.show();
                return;
            }

            TextInputDialog priceDialog = new TextInputDialog("100");
            priceDialog.setTitle("السعر");
            priceDialog.setContentText("السعر:");

            priceDialog.showAndWait().ifPresent(p -> {
                try {
                    double price = Double.parseDouble(p);

                    // 🔍 شرط أن السعر يجب أن يكون 1 أو أكثر
                    if (price < 100) {
                        Alert a = new Alert(Alert.AlertType.ERROR, "السعر يجب أن يكون 100 أو أكثر!");
                        a.show();
                        return;
                    }

                    invoiceItems.add(new InvoiceItem(name, price, "يدوي"));
                    updateTotal();
                } catch (Exception ex) {
                    Alert a = new Alert(Alert.AlertType.ERROR, "السعر غير صحيح!");
                    a.show();
                }
            });
        });
    }

    @FXML
    public void deleteSelectedRow() {  // ← لازم تكون public
        InvoiceItem selected = invoicesTable.getSelectionModel().getSelectedItem();
        if (selected != null && "يدوي".equals(selected.getDate())) {
            invoiceItems.remove(selected);
            updateTotal();
        } else {
            Alert a = new Alert(Alert.AlertType.WARNING, "اختر عنصرًا يدويًا للحذف");
            a.show();
        }
    }

//    @FXML
//    private void deleteSelectedRow() {
//        InvoiceItem selected = invoicesTable.getSelectionModel().getSelectedItem();
//        if (selected != null && "يدوي".equals(selected.getDate())) {
//            invoiceItems.remove(selected);
//        }
//    }

    private void updateTotal() {
        double total = invoiceItems.stream().mapToDouble(InvoiceItem::getPrice).sum();
        totalCost.setText(String.format("المجموع الكلي: %.2f جنيه", total));
    }

    // =================== Arabic Text Shaping Helper ===================
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

    // =================== Professional PDF Export ===================
    @FXML
    private void downloadInvoicePDF() {
        if (invoiceItems.isEmpty()) {
            new Alert(Alert.AlertType.WARNING, "لا توجد عناصر في الفاتورة لتصديرها.").show();
            return;
        }

        FileChooser chooser = new FileChooser();
        chooser.setInitialFileName("فاتورة_" + invoiceNumberLabel.getText().replace("رقم الفاتورة: ", "") + ".pdf");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("PDF Files", "*.pdf"));
        File file = chooser.showSaveDialog(invoicesTable.getScene().getWindow());
        if (file == null) return;

        try {
            PdfWriter writer = new PdfWriter(file);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(70, 50, 70, 50);

            // Font
            String fontPath = "C:/Windows/Fonts/arial.ttf";
            PdfFont font = PdfFontFactory.createFont(fontPath, PdfEncodings.IDENTITY_H);

            // Watermark Logo (optional - make sure path is correct)
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
                    .setFont(font).setFontSize(26).setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\n"));

            // Client Info
            document.add(new Paragraph(shapeArabic(clientNameLabel.getText())).setFont(font).setFontSize(14));
            document.add(new Paragraph(shapeArabic(taxNumberLabel.getText())).setFont(font).setFontSize(14));
            document.add(new Paragraph(shapeArabic(invoiceNumberLabel.getText())).setFont(font).setFontSize(14));
            document.add(new Paragraph(shapeArabic(invoiceDateLabel.getText())).setFont(font).setFontSize(14));
            document.add(new Paragraph("\n"));

            // Table
            Table table = new Table(UnitValue.createPercentArray(new float[]{5, 2, 2}))
                    .useAllAvailableWidth()
                    .setTextAlignment(TextAlignment.RIGHT);

            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("الوصف")).setFont(font).setBold().setBackgroundColor(com.itextpdf.kernel.colors.DeviceGray.GRAY)));
            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("السعر")).setFont(font).setBold().setBackgroundColor(com.itextpdf.kernel.colors.DeviceGray.GRAY)));
            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("الحالة")).setFont(font).setBold().setBackgroundColor(com.itextpdf.kernel.colors.DeviceGray.GRAY)));

            double total = 0;
            for (InvoiceItem item : invoiceItems) {
                table.addCell(new Cell().add(new Paragraph(shapeArabic(item.getDescription())).setFont(font)));
                table.addCell(new Cell().add(new Paragraph(String.format("%.2f", item.getPrice())).setFont(font).setTextAlignment(TextAlignment.LEFT)));
                table.addCell(new Cell().add(new Paragraph(shapeArabic(item.getDate())).setFont(font)));
                total += item.getPrice();
            }

            document.add(table);

            // Total
            document.add(new Paragraph("\n"));
            document.add(new Paragraph(shapeArabic("المجموع الكلي: " + String.format("%.2f جنيه مصري", total)))
                    .setFont(font).setFontSize(18).setBold()
                    .setTextAlignment(TextAlignment.RIGHT));

            document.close();

            new Alert(Alert.AlertType.INFORMATION, "تم حفظ الفاتورة بنجاح في: " + file.getName()).show();

        } catch (Exception e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "فشل في إنشاء الفاتورة:\n" + e.getMessage()).show();
        }
    }

    @FXML
    private void sendInvoiceToDatabase() {
        if (selectedShipment == null || invoiceItems.isEmpty()) {
            new Alert(Alert.AlertType.WARNING, "اختر شحنة وأنشئ فاتورة أولاً!").show();
            return;
        }

        String invoiceNum = invoiceNumberLabel.getText().replace("رقم الفاتورة: ", "").trim();
        int shipmentId = selectedShipment.getId();
        Timestamp now = new Timestamp(System.currentTimeMillis());

        // متغيرات لتجميع القيم
        double portFee = 0, clearanceFee = 0, expenseTips = 0, sundries = 0, additionalServices = 0;
        StringBuilder manualNames = new StringBuilder();
        double manualTotal = 0;

        // قراءة كل العناصر من الفاتورة وتوزيعها
        for (InvoiceItem item : invoiceItems) {
            String desc = item.getDescription().trim();
            double price = item.getPrice();

            if (desc.contains("رسوم الميناء")) {
                portFee = price;
            } else if (desc.contains("رسوم التخليص")) {
                clearanceFee = price;
            } else if (desc.contains("مصروفات وإكراميات")) {
                expenseTips = price;
            } else if (desc.contains("مصروفات متفرقة")) {
                sundries = price;
            } else if (desc.contains("رسوم النافذة الواحدة") || desc.contains("رسوم اضافية للحاويات الزائدة")) {
                additionalServices += price;
            } else {
                // عنصر يدوي
                if (manualNames.length() > 0) manualNames.append("، ");
                manualNames.append(desc);
                manualTotal += price;
            }
        }

        // استعلام الإدخال (صف واحد فقط)
        String sql = """
        INSERT INTO shipment_fees (
            invoiceNumber, shipmentId,
            Port_fee_price, Clearance_Fees_price, Expense_Tips_price, Sundries_price,
            Additional_Services_price,
            unsupportedItemName, unsupportedItemPrice,
            createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = DatabaseConnection.connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, invoiceNum);
            ps.setInt(2, shipmentId);
            ps.setDouble(3, portFee);
            ps.setDouble(4, clearanceFee);
            ps.setDouble(5, expenseTips);
            ps.setDouble(6, sundries);
            ps.setDouble(7, additionalServices);
            ps.setString(8, manualNames.length() > 0 ? manualNames.toString() : null);
            ps.setDouble(9, manualTotal);
            ps.setTimestamp(10, now);

            ps.executeUpdate();

            // تحديث حالة الشحنة
            markShipmentAsInvoiced(shipmentId);

            // رسالة نجاح كبيرة وقابلة للنسخ
            showSuccessDialog(invoiceNum, shipmentId, portFee, clearanceFee, expenseTips, sundries, additionalServices, manualNames.toString(), manualTotal);

        } catch (SQLException e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "فشل في الحفظ:\n" + e.getMessage()).show();
        }
    }


    private void showSuccessDialog(String invoiceNum, int shipmentId, double port, double clearance,
                                   double expenses, double sundries, double additional, String manualName, double manualTotal) {

        String content = String.format("""
        تم حفظ الفاتورة بنجاح في قاعدة البيانات!
        
        رقم الفاتورة: %s
        معرف الشحنة: %d
        التاريخ: %s
        
        ═══════════════════════════════
        التفاصيل المالية:
        • رسوم الميناء          : %,12.2f جنيه
        • رسوم التخليص          : %,12.2f جنيه
        • مصروفات وإكراميات     : %,12.2f جنيه
        • مصروفات متفرقة        : %,12.2f جنيه
        • خدمات إضافية + نافذة    : %,12.2f جنيه
        %s%s : %,12.2f جنيه
        ═══════════════════════════════
        المجموع الكلي           : %,12.2f جنيه
        """,
                invoiceNum, shipmentId, invoiceDateLabel.getText().replace("التاريخ: ", ""),
                port, clearance, expenses, sundries, additional,
                manualName.isEmpty() ? "" : "• عناصر يدوية (" + manualName + ")\n",
                manualName.isEmpty() ? "" : " ".repeat(25),
                manualTotal,
                invoiceItems.stream().mapToDouble(InvoiceItem::getPrice).sum()
        );

        // نافذة كبيرة قابلة للنسخ
        Stage dialog = new Stage();
        dialog.setTitle("تم الإرسال بنجاح");
        dialog.initModality(Modality.APPLICATION_MODAL);

        TextArea textArea = new TextArea(content);
        textArea.setEditable(false);
        textArea.setWrapText(true);
        textArea.setStyle("-fx-font-family: 'Courier New', monospace; -fx-font-size: 14px;");
        textArea.setPrefSize(680, 500);

        Button copyBtn = new Button("نسخ إلى الحافظة");
        copyBtn.setOnAction(e -> {
            Clipboard.getSystemClipboard().setContent(
                    new ClipboardContent() {{ putString(content); }}
            );
            copyBtn.setText("تم النسخ!");
        });

        Button closeBtn = new Button("إغلاق");
        closeBtn.setOnAction(e -> dialog.close());

        HBox buttons = new HBox(15, copyBtn, closeBtn);
        buttons.setAlignment(Pos.CENTER);
        buttons.setPadding(new Insets(10));

        VBox root = new VBox(10, textArea, buttons);
        root.setPadding(new Insets(15));
        root.setStyle("-fx-background-color: #f8fff8; -fx-border-color: #4caf50; -fx-border-width: 3;");

        dialog.setScene(new Scene(root));
        dialog.showAndWait();
    }
    @FXML
    private void onSearch(ActionEvent e) {
        // unchanged
    }

    @FXML
    private void invoice_management_btn_handle(ActionEvent event)throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/invoices-management.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
    @FXML public void client_management(ActionEvent event)throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/client-data.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }

    // ================= Navigation =================
    @FXML public void onDashboardClick(ActionEvent e) throws Exception {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/dashboard.fxml"));
        Parent root = loader.load();
        Stage stage = (Stage)((Node)e.getSource()).getScene().getWindow();
        stage.setScene(new Scene(root));
        stage.show();
    }
    @FXML
    public void onTa5les(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/AdminInvoices.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }

    public void employee_management_btn_handle(ActionEvent event)throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/employee-management.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
}