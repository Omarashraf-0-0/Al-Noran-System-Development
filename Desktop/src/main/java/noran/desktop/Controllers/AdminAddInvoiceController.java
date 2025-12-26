package noran.desktop.Controllers;

import noran.desktop.Utils.AlertUtils;

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
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import noran.desktop.AppSession;
import noran.desktop.Database.MongoDirectConnection;
import noran.desktop.Utils.ComboBoxStyler;
import org.bson.types.ObjectId;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;

public class AdminAddInvoiceController {

    @FXML
    private TextField clientNameField;
    @FXML
    private Label invoiceNumberLabel;
    @FXML
    private Label invoiceDateLabel;
    @FXML
    private TableView<InvoiceRow> invoiceTable;
    @FXML
    private TableColumn<InvoiceRow, String> colDesc;
    @FXML
    private TableColumn<InvoiceRow, Double> colPrice;
    @FXML
    private Label totalLabel;

    // Sidebar and TopBar controller injection
    @FXML
    private SidebarController sidebarController;
    @FXML
    private VBox sidebar;
    @FXML
    private TopBarController topBarController;

    private final ObservableList<InvoiceRow> items = FXCollections.observableArrayList();

    // ================= INITIALIZE =================

    public void initialize() {

        colDesc.setCellValueFactory(new PropertyValueFactory<>("description"));
        colPrice.setCellValueFactory(new PropertyValueFactory<>("price"));
        invoiceTable.setItems(items);

        // Make columns fill the table width
        invoiceTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        // Set relative column widths: description is 2/3, price is 1/3
        colDesc.setMaxWidth(Double.MAX_VALUE);
        colPrice.setMaxWidth(Double.MAX_VALUE);
        colDesc.prefWidthProperty().bind(invoiceTable.widthProperty().multiply(0.66));
        colPrice.prefWidthProperty().bind(invoiceTable.widthProperty().multiply(0.33));

        invoiceNumberLabel.setText("INV-" + System.currentTimeMillis());
        invoiceDateLabel.setText(new SimpleDateFormat("dd/MM/yyyy").format(new Date()));

        items.addListener((javafx.collections.ListChangeListener<InvoiceRow>) c -> updateTotal());

        Platform.runLater(this::registerShortcuts);

        invoiceTable.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.DELETE) {
                deleteSelectedRow();
            }
        });

        // Set the active page in sidebar
        if (sidebarController != null) {
            sidebarController.setActivePage("new invoice");
        }

        // Setup TopBar with sidebar reference for toggle
        if (topBarController != null) {
            topBarController.setPageTitle("إضافة فاتورة جديدة");
            topBarController.setSidebar(sidebar);
            topBarController.setSearchBarVisible(false);
        }
    }

    // ================= SHORTCUTS =================

    private void registerShortcuts() {
        Scene scene = invoiceTable.getScene();
        if (scene == null)
            return;

        scene.addEventFilter(KeyEvent.KEY_PRESSED, e -> {

            if (e.isControlDown() && e.getCode() == KeyCode.A) {
                addNewRow();
                e.consume();
            }

            if (e.isControlDown() && e.getCode() == KeyCode.S) {
                generatePdf();
                e.consume();
            }

            if (e.isControlDown() && e.getCode() == KeyCode.D) {
                invoiceTable.requestFocus();
                if (!invoiceTable.getItems().isEmpty()) {
                    invoiceTable.getSelectionModel().selectFirst();
                }
                e.consume();
            }

            if (e.isControlDown() && e.getCode() == KeyCode.X) {
                clientNameField.requestFocus();
                clientNameField.selectAll();
                e.consume();
            }
        });
    }

    // ================= CURRENCY =================

    private double convertToEGP(double price, String currency) {
        if ("USD".equalsIgnoreCase(currency)) {
            return price * 50;
        }
        return price;
    }

    // ================= ADD ITEM =================

    @FXML
    private void addNewRow() {
        // Create modern styled dialog
        Dialog<InvoiceRow> dialog = new Dialog<>();
        dialog.setTitle("إضافة بند للفاتورة");
        dialog.setHeaderText(null);

        // Set dialog window icon when shown (scene is null before show)
        dialog.setOnShown(event -> {
            try {
                javafx.stage.Stage dialogStage = (javafx.stage.Stage) dialog.getDialogPane().getScene().getWindow();
                if (dialogStage != null) {
                    dialogStage.getIcons().add(new javafx.scene.image.Image(
                            getClass().getResourceAsStream("/noran/desktop/images/Logo.png")));
                }
            } catch (Exception e) {
                System.out.println("Could not set dialog icon: " + e.getMessage());
            }
        });

        // Get the dialog pane and style it
        DialogPane dialogPane = dialog.getDialogPane();
        dialogPane.setStyle(
                "-fx-background-color: #f8f9fa; " +
                        "-fx-font-family: 'Segoe UI', 'Noto Sans Arabic', system-ui;");
        dialogPane.setPrefWidth(450);

        // Create custom button types
        ButtonType addBtn = new ButtonType("إضافة", ButtonBar.ButtonData.OK_DONE);
        dialogPane.getButtonTypes().addAll(addBtn, ButtonType.CANCEL);

        // Style the buttons
        javafx.scene.Node addButton = dialogPane.lookupButton(addBtn);
        addButton.setStyle(
                "-fx-background-color: linear-gradient(to bottom, #a40000, #690000); " +
                        "-fx-text-fill: white; " +
                        "-fx-font-weight: bold; " +
                        "-fx-font-size: 14px; " +
                        "-fx-padding: 10 30; " +
                        "-fx-background-radius: 8; " +
                        "-fx-cursor: hand;");

        javafx.scene.Node cancelButton = dialogPane.lookupButton(ButtonType.CANCEL);
        cancelButton.setStyle(
                "-fx-background-color: #e5e7eb; " +
                        "-fx-text-fill: #374151; " +
                        "-fx-font-weight: bold; " +
                        "-fx-font-size: 14px; " +
                        "-fx-padding: 10 30; " +
                        "-fx-background-radius: 8; " +
                        "-fx-cursor: hand;");

        // Main container
        VBox mainContainer = new VBox(18);
        mainContainer.setStyle("-fx-padding: 25; -fx-background-color: white; -fx-background-radius: 16;");
        mainContainer.setAlignment(javafx.geometry.Pos.CENTER);

        // Logo Image
        javafx.scene.image.ImageView logoView = new javafx.scene.image.ImageView();
        try {
            javafx.scene.image.Image logo = new javafx.scene.image.Image(
                    getClass().getResourceAsStream("/noran/desktop/images/Logo.png"));
            logoView.setImage(logo);
            logoView.setFitWidth(120);
            logoView.setPreserveRatio(true);
        } catch (Exception e) {
            System.out.println("Could not load logo: " + e.getMessage());
        }

        // Header with title
        Label titleLabel = new Label("أدخل تفاصيل البند");
        titleLabel.setStyle(
                "-fx-font-size: 20; " +
                        "-fx-font-weight: bold; " +
                        "-fx-text-fill: #a40000;");

        // Create styled text fields
        TextField descField = createStyledTextField("اسم البند / الخدمة", "📦");
        TextField priceField = createStyledTextField("السعر", "💰");

        // Currency ComboBox with modern style
        ComboBox<String> currencyBox = new ComboBox<>();
        currencyBox.getItems().addAll("EGP", "USD");
        currencyBox.setValue("EGP");
        currencyBox.setPrefWidth(Double.MAX_VALUE);
        currencyBox.setPrefHeight(45);
        // Apply consistent styling using utility
        ComboBoxStyler.style(currencyBox);

        // Currency container with label
        VBox currencyContainer = new VBox(8);
        javafx.scene.layout.HBox currencyLabelBox = new javafx.scene.layout.HBox(8);
        currencyLabelBox.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
        Label currencyIcon = new Label("💵");
        currencyIcon.setStyle("-fx-font-size: 16;");
        Label currencyLabel = new Label("العملة");
        currencyLabel.setStyle("-fx-font-size: 14; -fx-text-fill: #6b7280; -fx-font-weight: 600;");
        currencyLabelBox.getChildren().addAll(currencyLabel, currencyIcon);
        currencyContainer.getChildren().addAll(currencyLabelBox, currencyBox);

        // Keyboard navigation
        descField.setOnAction(e -> priceField.requestFocus());
        priceField.setOnAction(e -> currencyBox.requestFocus());

        // Info tip
        Label tipLabel = new Label("💡 اضغط Enter للانتقال بين الحقول");
        tipLabel.setStyle(
                "-fx-font-size: 12; " +
                        "-fx-text-fill: #9ca3af; " +
                        "-fx-padding: 10 0 0 0;");

        // Add all components
        mainContainer.getChildren().addAll(
                logoView,
                titleLabel,
                new javafx.scene.control.Separator(),
                descField,
                priceField,
                currencyContainer,
                tipLabel);

        dialogPane.setContent(mainContainer);

        // Focus on description field
        Platform.runLater(() -> {
            // Get the actual TextField from the styled container
            if (descField.getParent() instanceof VBox) {
                descField.requestFocus();
            }
        });

        dialog.setResultConverter(btn -> {
            if (btn == addBtn) {
                try {
                    String desc = descField.getText().trim();
                    String priceText = priceField.getText().trim();

                    if (desc.isEmpty() || priceText.isEmpty()) {
                        showStyledAlert("تنبيه", "يرجى ملء جميع الحقول", "#f59e0b");
                        return null;
                    }

                    return new InvoiceRow(
                            desc,
                            Double.parseDouble(priceText),
                            currencyBox.getValue());
                } catch (NumberFormatException e) {
                    showStyledAlert("خطأ", "السعر يجب أن يكون رقماً صحيحاً", "#a40000");
                }
            }
            return null;
        });

        dialog.showAndWait().ifPresent(items::add);
    }

    // Helper method to create styled text field
    private TextField createStyledTextField(String prompt, String icon) {
        TextField field = new TextField();
        field.setPromptText(prompt);
        field.setStyle(
                "-fx-background-color: white; " +
                        "-fx-border-color: #d1d5db; " +
                        "-fx-border-radius: 10; " +
                        "-fx-background-radius: 10; " +
                        "-fx-padding: 12 16; " +
                        "-fx-font-size: 14px; " +
                        "-fx-prompt-text-fill: #9ca3af;");
        field.setPrefWidth(350);

        // Add focus styling
        field.focusedProperty().addListener((obs, wasFocused, isFocused) -> {
            if (isFocused) {
                field.setStyle(
                        "-fx-background-color: white; " +
                                "-fx-border-color: #1ba3b6; " +
                                "-fx-border-width: 2; " +
                                "-fx-border-radius: 10; " +
                                "-fx-background-radius: 10; " +
                                "-fx-padding: 12 16; " +
                                "-fx-font-size: 14px; " +
                                "-fx-effect: dropshadow(gaussian, rgba(27, 163, 182, 0.25), 8, 0, 0, 2);");
            } else {
                field.setStyle(
                        "-fx-background-color: white; " +
                                "-fx-border-color: #d1d5db; " +
                                "-fx-border-radius: 10; " +
                                "-fx-background-radius: 10; " +
                                "-fx-padding: 12 16; " +
                                "-fx-font-size: 14px; " +
                                "-fx-prompt-text-fill: #9ca3af;");
            }
        });

        return field;
    }

    // Helper method to show styled alert
    private void showStyledAlert(String title, String message, String color) {
        Alert alert = new Alert(Alert.AlertType.NONE);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.getDialogPane().getButtonTypes().add(ButtonType.OK);
        alert.getDialogPane().setStyle(
                "-fx-background-color: white; " +
                        "-fx-font-family: 'Segoe UI', 'Noto Sans Arabic', system-ui;");

        javafx.scene.Node okButton = alert.getDialogPane().lookupButton(ButtonType.OK);
        okButton.setStyle(
                "-fx-background-color: " + color + "; " +
                        "-fx-text-fill: white; " +
                        "-fx-font-weight: bold; " +
                        "-fx-padding: 8 24; " +
                        "-fx-background-radius: 8;");

        alert.showAndWait();
    }

    // ================= DELETE =================

    @FXML
    private void deleteSelectedRow() {
        InvoiceRow row = invoiceTable.getSelectionModel().getSelectedItem();
        if (row != null)
            items.remove(row);
    }

    // ================= TOTAL =================

    private void updateTotal() {
        double total = items.stream()
                .mapToDouble(r -> convertToEGP(r.getPrice(), r.getCurrency()))
                .sum();

        totalLabel.setText(String.format("المجموع الكلي: %,.2f جنيه مصري", total));
    }

    // ================= GENERATE PDF =================

    @FXML
    private void generatePdf() {

        String clientName = clientNameField.getText().trim();
        if (clientName.isEmpty()) {
            AlertUtils.showError("خطأ", "يرجى إدخال اسم العميل");
            return;
        }

        if (items.isEmpty() || items.stream().allMatch(i -> i.getPrice() <= 0)) {
            AlertUtils.showWarning("تنبيه", "أضف على الأقل بند واحد بقيمة أكبر من صفر");
            return;
        }

        FileChooser chooser = new FileChooser();
        chooser.setInitialFileName("فاتورة_" + invoiceNumberLabel.getText() + ".pdf");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("PDF Files", "*.pdf"));
        File file = chooser.showSaveDialog(invoiceTable.getScene().getWindow());
        if (file == null)
            return;

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
            } catch (Exception ignored) {
            }

            document.add(new Paragraph(shapeArabic("فاتورة رسمية"))
                    .setFont(font).setFontSize(28).setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\n"));

            document.add(new Paragraph(shapeArabic("اسم العميل: " + clientName)).setFont(font).setFontSize(16));
            document.add(new Paragraph(shapeArabic("رقم الفاتورة: " + invoiceNumberLabel.getText())).setFont(font)
                    .setFontSize(15));
            document.add(
                    new Paragraph(shapeArabic("التاريخ: " + invoiceDateLabel.getText())).setFont(font).setFontSize(15));
            document.add(new Paragraph("\n"));

            Table table = new Table(UnitValue.createPercentArray(new float[] { 6, 2 }))
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

            AlertUtils.showSuccess("تم بنجاح",
                    "تم إنشاء الفاتورة بنجاح وحفظها في قاعدة البيانات");

        } catch (Exception e) {
            e.printStackTrace();
            AlertUtils.showError("خطأ", "فشل في إنشاء PDF:\n" + e.getMessage());
        }
    }

    // ================= SAVE TO MONGO =================

    private void saveInvoiceToMongo(String clientName) {

        var db = MongoDirectConnection.connect();
        if (db == null)
            return;

        MongoCollection<org.bson.Document> invoices = db.getCollection("invoices");

        User currentUser = AppSession.getInstance().getCurrentUser();
        if (currentUser == null || currentUser.getId() == null) {
            MongoDirectConnection.close();
            return;
        }

        java.util.List<org.bson.Document> itemsList = new java.util.ArrayList<>();

        for (InvoiceRow row : items) {
            if (row.getPrice() <= 0)
                continue;

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

        public String getDescription() {
            return description;
        }

        public double getPrice() {
            return price;
        }

        public String getCurrency() {
            return currency;
        }
    }

    // ================= ARABIC =================

    private String shapeArabic(String text) {
        if (text == null || text.isEmpty())
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
}
