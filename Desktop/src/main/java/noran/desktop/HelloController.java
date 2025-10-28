package noran.desktop;

import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;

import java.awt.font.TextAttribute;
import java.text.AttributedString;
import com.ibm.icu.text.Bidi;
import com.ibm.icu.text.ArabicShaping;
import com.ibm.icu.text.ArabicShapingException;

import com.ibm.icu.text.ArabicShaping;
import com.ibm.icu.text.ArabicShapingException;
import com.ibm.icu.text.Bidi;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.font.FontProgramFactory;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.control.TableCell;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import noran.desktop.Controllers.User;
import noran.desktop.Controllers.Shipment;
import noran.desktop.models.InvoiceItem;
import noran.desktop.Database.DatabaseConnection;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.sql.*;
import java.util.ResourceBundle;

public class HelloController implements Initializable {

    @FXML private Label userNameLabel;
    @FXML private Label userIdLabel;
    @FXML private TextField searchField;

    @FXML private TableView<InvoiceItem> invoicesTable;
    @FXML private TableColumn<InvoiceItem, String> colDescription;
    @FXML private TableColumn<InvoiceItem, Double> colPrice;
    @FXML private TableColumn<InvoiceItem, String> colDate;

    @FXML private ComboBox<Shipment> clientShipmentComboBox;

    @FXML private Label clientNameLabel;
    @FXML private Label taxNumberLabel;
    @FXML private Label invoiceNumberLabel;
    @FXML private Label invoiceDateLabel;

    @FXML private Label totalCost;
    @FXML private Button deleteRowBtn;
    @FXML private Button downloadPdfBtn;

    private final ObservableList<Shipment> shipmentList = FXCollections.observableArrayList();
    private final ObservableList<InvoiceItem> invoiceList = FXCollections.observableArrayList();

    private final ObservableList<String> portOptions = FXCollections.observableArrayList(
            "Port of Alexandria","Port of El-Dekheila","Port of Damietta","Damietta Port",
            "Port Said","Port of Suez","Port of Adabiya","Port of Ain Sukhna",
            "Port of Safaga","Port of Nuweiba","Port of Ras Shukeir"
    );

    private String selectedClientName;
    private String selectedTaxNumber;
    private String selectedClientType;
    private String selectedClientId;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        User u = AppSession.getInstance().getCurrentUser();
        if (u != null) {
            if (userNameLabel != null) userNameLabel.setText(u.getName());
            if (userIdLabel != null) userIdLabel.setText("ID: " + u.getId());
        }

        setupInvoicesTable();
        setupShipmentComboBox();

        invoiceList.addListener((javafx.collections.ListChangeListener<InvoiceItem>) c -> updateTotalCost());

        if (u != null && u.getId() != null) {
            loadClientShipmentsByUserId(u.getId());
        }
    }

    private String shapeArabic(String text) {
        try {
            // Shape Arabic letters
            ArabicShaping arabicShaper = new ArabicShaping(ArabicShaping.LETTERS_SHAPE);
            String shaped = arabicShaper.shape(text);

            // Handle right-to-left direction
            Bidi bidi = new Bidi(shaped, Bidi.DIRECTION_RIGHT_TO_LEFT);
            return bidi.writeReordered(Bidi.DO_MIRRORING);
        } catch (ArabicShapingException e) {
            e.printStackTrace();
            return text;
        }
    }


    // ================= Table Setup =================
    private void setupInvoicesTable() {
        // Description as ComboBox
        colDescription.setCellFactory(col -> new TableCell<InvoiceItem, String>() {
            private final ComboBox<String> comboBox = new ComboBox<>(portOptions);
            {
                comboBox.setMaxWidth(Double.MAX_VALUE);
                comboBox.setOnAction(event -> {
                    InvoiceItem item = getTableView().getItems().get(getIndex());
                    if (item != null) {
                        String port = comboBox.getSelectionModel().getSelectedItem();
                        item.setDescription(port);
                        double cost = calculateShipmentCosts(new Shipment(0, port, 1, "pending"),
                                AppSession.getInstance().getCurrentUser());
                        item.setPrice(cost);
                        item.setDate("pending");
                        getTableView().refresh();
                        updateTotalCost();
                    }
                });
            }
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) setGraphic(null);
                else {
                    InvoiceItem currentItem = getTableView().getItems().get(getIndex());
                    comboBox.getSelectionModel().select(currentItem.getDescription());
                    setGraphic(comboBox);
                }
            }
        });

        colPrice.setCellValueFactory(new PropertyValueFactory<>("price"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("date"));
        invoicesTable.setItems(invoiceList);
    }

    // ================= Shipment ComboBox =================
    private void setupShipmentComboBox() {
        clientShipmentComboBox.setItems(shipmentList);
        clientShipmentComboBox.setPromptText("اختر الشحنة");
        clientShipmentComboBox.getSelectionModel().selectedItemProperty().addListener((obs, old, newVal) -> {
            if (newVal != null) {
                markShipmentAsDragged(newVal.getShipmentId());
                double cost = calculateShipmentCosts(newVal, AppSession.getInstance().getCurrentUser());
                invoiceList.add(new InvoiceItem(newVal.getPortName(), cost, newVal.getStatus()));
                invoiceNumberLabel.setText("رقم الشحنة: " + newVal.getShipmentId());
                invoiceDateLabel.setText("المنفذ: " + newVal.getPortName());
            }
        });
    }

    // ================= Load Shipments =================
    private void loadClientShipmentsByUserId(String userId) {
        shipmentList.clear();
        String sql = """
            SELECT s.shipment_id, s.port_name, s.num_of_containers, s.status, s.type_of_containers
            FROM shipments s
            INNER JOIN users u ON s.clientId = u._id
            WHERE u._id = ?
            """;
        try (Connection c = DatabaseConnection.connect();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Shipment s = new Shipment(
                        rs.getInt("shipment_id"),
                        rs.getString("port_name"),
                        rs.getInt("num_of_containers"),
                        rs.getString("status")
                );
                s.setTypeOfContainers(rs.getString("type_of_containers"));
                shipmentList.add(s);
            }
        } catch (SQLException e) { e.printStackTrace(); }
    }

    private void markShipmentAsDragged(int shipmentId) {
        String sql = "UPDATE shipments SET dragt = 1 WHERE shipment_id = ?";
        try (Connection c = DatabaseConnection.connect();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, shipmentId);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    // ================= Calculate Cost =================
    private double calculateShipmentCosts(Shipment shipment, User user) {
        if (shipment == null) return 0;
        String port = shipment.getPortName() != null ? shipment.getPortName().trim() : "";
        int numContainers = Math.max(shipment.getNumOfContainers(), 1);
        String type = shipment.getTypeOfContainers() != null ? shipment.getTypeOfContainers() : "";

        double portPrice = switch (port) {
            case "Port of Alexandria" -> 5000;
            case "Port of El-Dekheila" -> 4800;
            case "Port of Damietta", "Damietta Port" -> 4500;
            case "Port Said" -> 4200;
            case "Port of Suez" -> 4000;
            case "Port of Adabiya" -> 3800;
            case "Port of Ain Sukhna" -> 3700;
            case "Port of Safaga" -> 3500;
            case "Port of Nuweiba" -> 3300;
            case "Port of Ras Shukeir" -> 3100;
            default -> 4100;
        };
        double extraContainerFees = numContainers > 2 ? (numContainers - 2) * 500 : 0;

        double clearanceFees = 0, expensesTips = 0, sundries = 0;
        try {
            String cleaned = type.replaceAll("[\\[\\]\"]", "");
            for (String t : cleaned.split(",")) {
                t = t.trim();
                if (t.startsWith("20")) { clearanceFees += 5000; expensesTips += 3000; sundries += 1000; }
                else if (t.startsWith("40")) { clearanceFees += 6000; expensesTips += 3500; sundries += 1500; }
                else { clearanceFees += 5500; expensesTips += 3250; sundries += 1250; }
            }
        } catch (Exception e) { clearanceFees = 5500; expensesTips = 3250; sundries = 1250; }

        clearanceFees *= numContainers;
        expensesTips *= numContainers;
        sundries *= numContainers;

        double singleWindowFee = 1000;
        double adjustmentPercent = 0.0;
        if (user != null && user.getRank() != null) {
            adjustmentPercent = switch (user.getRank()) {
                case "low","rank1" -> 0.0;
                case "med","rank2" -> 0.015;
                case "high","rank3" -> 0.025;
                default -> 0.01;
            };
        }
        double factor = 1 + adjustmentPercent;
        return (portPrice + clearanceFees + expensesTips + sundries + extraContainerFees + singleWindowFee) * factor;
    }

    // ================= Add Row =================
    @FXML private void addNewInvoiceRow() {
        invoiceList.add(new InvoiceItem("", 0, "pending"));
    }

    // ================= Delete Row =================
    @FXML private void deleteSelectedRow() {
        InvoiceItem selected = invoicesTable.getSelectionModel().getSelectedItem();
        if (selected != null) invoiceList.remove(selected);
    }

    // ================= Update Total =================
    private void updateTotalCost() {
        double sum = invoiceList.stream().mapToDouble(InvoiceItem::getPrice).sum();
        totalCost.setText("المجموع الكلي : " + sum);
    }

    // ================= PDF Export =================
    @FXML private void downloadInvoicePDF() {
        if (invoiceList.isEmpty()) {
            Alert alert = new Alert(Alert.AlertType.WARNING, "لا يوجد بيانات لتصديرها.");
            alert.showAndWait();
            return;
        }

        try {
            FileChooser fileChooser = new FileChooser();
            fileChooser.setInitialFileName("invoice.pdf");
            fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("PDF Files", "*.pdf"));
            File file = fileChooser.showSaveDialog(invoicesTable.getScene().getWindow());
            if (file == null) return;

            PdfWriter writer = new PdfWriter(file.getAbsolutePath());
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(70, 36, 70, 36);

            // Arabic font
            String fontPath = "C:/Windows/Fonts/arial.ttf"; // replace if needed
            PdfFont arabicFont = PdfFontFactory.createFont(fontPath, PdfEncodings.IDENTITY_H);

            // Watermark
            ImageData imageData = ImageDataFactory.create(getClass().getResource("/noran/desktop/images/Logo.png"));
            Image watermark = new Image(imageData);
            watermark.setFixedPosition(0, 0);
            watermark.setWidth(pdf.getDefaultPageSize().getWidth());
            watermark.setHeight(pdf.getDefaultPageSize().getHeight());
            watermark.setOpacity(0.1f);
            document.add(watermark);

            // Title
            document.add(new Paragraph(shapeArabic("فاتورة")).setFont(arabicFont).setFontSize(20).setBold().setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("\n"));

            Table table = new Table(UnitValue.createPercentArray(new float[]{4, 2, 2}))
                    .useAllAvailableWidth()
                    .setTextAlignment(TextAlignment.RIGHT);
            double total = 0;
            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("الوصف")).setFont(arabicFont).setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("السعر")).setFont(arabicFont).setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph(shapeArabic("الحالة")).setFont(arabicFont).setBold()));

            for (InvoiceItem item : invoiceList) {
                table.addCell(new Cell().add(new Paragraph(shapeArabic(item.getDescription())).setFont(arabicFont)));
                table.addCell(new Cell().add(new Paragraph(String.format("%.2f", item.getPrice())).setFont(arabicFont)));
                table.addCell(new Cell().add(new Paragraph(shapeArabic(item.getDate())).setFont(arabicFont)));
                total += item.getPrice();
            }


            document.add(table);
            document.add(new Paragraph("\n"));
            document.add(new Paragraph(String.format("%.2f", total) + shapeArabic("المجموع الكلي :") )
                    .setFont(arabicFont).setFontSize(14).setBold().setTextAlignment(TextAlignment.RIGHT));

            document.close();

            Alert alert = new Alert(Alert.AlertType.INFORMATION, "تم تصدير الفاتورة بنجاح!");
            alert.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            Alert alert = new Alert(Alert.AlertType.ERROR, "حدث خطأ أثناء تصدير الفاتورة:\n" + e.getMessage());
            alert.showAndWait();
        }
    }

    @FXML public void onSearch(ActionEvent e) {
        String keyword = searchField.getText().trim().toLowerCase();
        ObservableList<InvoiceItem> filtered = FXCollections.observableArrayList();
        for (InvoiceItem item : invoiceList) {
            if (item.getDescription().toLowerCase().contains(keyword)) filtered.add(item);
        }
        invoicesTable.setItems(filtered);
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
    public void invoice_management_btn_handle(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/client-data.fxml"));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(new Scene(root));
        stage.show();
    }


    public void setSelectedClient(String name, String taxNumber, String clientType, String id) {
        this.selectedClientName = name;
        this.selectedTaxNumber = taxNumber;
        this.selectedClientType = clientType;
        this.selectedClientId = id;
        if (clientNameLabel != null) clientNameLabel.setText("اسم العميل : " + name);
        if (taxNumberLabel != null) taxNumberLabel.setText("الرقم الضريبي: " + taxNumber);
        invoiceList.clear();
        if (id != null) loadClientShipmentsByUserId(id);
    }
}
