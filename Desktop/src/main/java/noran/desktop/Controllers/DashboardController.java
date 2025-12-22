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
import javafx.scene.chart.PieChart;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Tooltip;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import javafx.scene.layout.VBox;
import noran.desktop.AppSession;
// Note: Dashboard now uses MongoDB REST API instead of local SQLite

import java.io.File;
import java.io.IOException;
import java.net.URL;
// SQL imports removed - using REST API
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.ResourceBundle;

public class DashboardController implements Initializable {

    @FXML
    private Label userNameLabel;
    @FXML
    private Label userIdLabel;
    @FXML
    private Label totalRevenueLabel;
    @FXML
    private Label pendingInvoicesLabel;
    @FXML
    private Label completedInvoicesLabel;
    @FXML
    private Label ongoingShipmentsLabel;

    @FXML
    private PieChart chartAcceptedVsPending;
    @FXML
    private PieChart chartPendingInvoicesRatio;
    @FXML
    private PieChart chartClientsByVersion;

    @FXML
    private Button downloadReportBtn;

    @FXML
    private SidebarController sidebarController;

    @FXML
    private VBox sidebar; // The actual sidebar VBox from fx:include

    @FXML
    private TopBarController topBarController;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        User currentUser = AppSession.getInstance().getCurrentUser();
        System.out.println(currentUser.toString());
        loadDashboardData();
        sidebarController.setActivePage("dashboard");
        if (topBarController != null && currentUser != null) {
            String name = currentUser.getName() != null ? currentUser.getName() : "مدير النظام";
            String email = currentUser.getEmail() != null ? currentUser.getEmail() : "";
            topBarController.setUserData(name, email);
            topBarController.setSidebar(sidebar); // Pass sidebar for toggle
            // Load profile photo
            String profilePhoto = currentUser.getProfilePhoto();
            System.out.println("[DashboardController] Profile photo from user: '" + profilePhoto + "'");
            if (profilePhoto != null && !profilePhoto.isEmpty()) {
                topBarController.setProfilePhoto(profilePhoto);
            } else {
                System.out.println("[DashboardController] No profile photo set for user");
            }
        }
        topBarController.setSearchBarVisible(false);

    }

    private void applyChartStyle(PieChart chart) {
        // Make the chart look hollow (Donut Chart) or just cleaner
        chart.setClockwise(true);
        chart.setLabelsVisible(false); // Hide lines and text pointing to slices
        chart.setLegendVisible(true);

        // Add Tooltips (Shows value when you hover mouse)
        for (PieChart.Data data : chart.getData()) {
            Tooltip tooltip = new Tooltip(data.getName() + ": " + (int) data.getPieValue());
            tooltip.setStyle("-fx-font-size: 14px; -fx-background-color: #333; -fx-text-fill: white;");
            Tooltip.install(data.getNode(), tooltip);

            // Add click listener (optional)
            data.getNode().setOnMouseClicked(e -> {
                System.out.println("Clicked on " + data.getName());
            });
        }
    }

    private void loadDashboardData() {
        // Fetch data from MongoDB via REST API
        try {
            String token = AppSession.getInstance().getAuthToken();
            if (token == null || token.isBlank()) {
                showAlert(Alert.AlertType.WARNING, "تنبيه", "لم يتم تسجيل الدخول. يرجى تسجيل الدخول أولاً.");
                return;
            }

            // Fetch dashboard stats from API
            String response = fetchFromAPI(noran.desktop.AppConfig.API_DASHBOARD_STATS, token);
            if (response == null) {
                showAlert(Alert.AlertType.ERROR, "خطأ", "فشل في الاتصال بالخادم");
                return;
            }

            org.json.JSONObject stats = new org.json.JSONObject(response);

            // Update labels with data from MongoDB
            double poundRevenue = stats.optDouble("poundRevenue", 0);
            double dollarRevenue = stats.optDouble("dollarRevenue", 0);
            double totalRevenue = poundRevenue; // Display pound revenue as main revenue
            totalRevenueLabel.setText(String.format("%,.2f", totalRevenue));

            int ongoingInvoices = stats.optInt("ongoingInvoices", 0);
            pendingInvoicesLabel.setText(String.valueOf(ongoingInvoices));

            int completedInvoices = stats.optInt("completedInvoices", 0);
            completedInvoicesLabel.setText(String.valueOf(completedInvoices));

            int ongoingSeaShipments = stats.optInt("ongoingSeaShipments", 0);
            int ongoingAirShipments = stats.optInt("ongoingAirShipments", 0);
            int totalOngoing = ongoingSeaShipments + ongoingAirShipments;
            ongoingShipmentsLabel.setText(String.valueOf(totalOngoing));

            // Load charts with API data
            loadChartsFromAPI(stats, token);

        } catch (Exception e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "خطأ", "فشل تحميل البيانات: " + e.getMessage());
        }
    }

    private void loadChartsFromAPI(org.json.JSONObject stats, String token) {
        // Chart 1: مقبولة vs معلقة (Completed vs Ongoing invoices)
        int completedInvoices = stats.optInt("completedInvoices", 0);
        int ongoingInvoices = stats.optInt("ongoingInvoices", 0);
        chartAcceptedVsPending.setData(FXCollections.observableArrayList(
                new PieChart.Data("مقبولة (" + completedInvoices + ")", completedInvoices),
                new PieChart.Data("معلقة (" + ongoingInvoices + ")", ongoingInvoices)));

        // Chart 2: Pending vs Processed invoices
        int total = completedInvoices + ongoingInvoices;
        chartPendingInvoicesRatio.setData(FXCollections.observableArrayList(
                new PieChart.Data("معلقة (" + ongoingInvoices + ")", ongoingInvoices),
                new PieChart.Data("تمت المعالجة (" + completedInvoices + ")", completedInvoices)));

        // Chart 3: Shipments by type (Sea vs Air)
        int seaShipments = stats.optInt("ongoingSeaShipments", 0);
        int airShipments = stats.optInt("ongoingAirShipments", 0);
        int completedShipments = stats.optInt("completedShipments", 0);

        ObservableList<PieChart.Data> shipmentData = FXCollections.observableArrayList();
        if (seaShipments > 0)
            shipmentData.add(new PieChart.Data("شحن بحري (" + seaShipments + ")", seaShipments));
        if (airShipments > 0)
            shipmentData.add(new PieChart.Data("شحن جوي (" + airShipments + ")", airShipments));
        if (completedShipments > 0)
            shipmentData.add(new PieChart.Data("مكتملة (" + completedShipments + ")", completedShipments));
        if (shipmentData.isEmpty())
            shipmentData.add(new PieChart.Data("لا توجد شحنات", 1));
        chartClientsByVersion.setData(shipmentData);

        // Apply styling to all charts
        for (PieChart c : new PieChart[] { chartAcceptedVsPending, chartPendingInvoicesRatio, chartClientsByVersion }) {
            c.setLegendVisible(true);
            c.setLabelsVisible(false);
            c.setClockwise(true);
            c.setStartAngle(90);
        }
    }

    private String fetchFromAPI(String urlString, String token) {
        try {
            java.net.URL url = new java.net.URL(urlString);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            int status = conn.getResponseCode();
            if (status == 401) {
                System.err.println("❌ 401 Unauthorized: Token expired or invalid");
                return null;
            }

            if (status >= 200 && status < 300) {
                java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null)
                    sb.append(line);
                br.close();
                return sb.toString();
            } else {
                System.err.println("❌ API Error: " + status);
                return null;
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to fetch from API: " + e.getMessage());
            return null;
        }
    }

    // Old SQLite loadCharts method removed - now using loadChartsFromAPI()

    // ============================== PDF EXPORT - عربي 100% بدون أي خطأ
    // ==============================
    @FXML
    private void downloadDashboardReport() {
        FileChooser fc = new FileChooser();
        fc.setInitialFileName("تقرير_الإحصائيات_"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".pdf");
        fc.getExtensionFilters().add(new FileChooser.ExtensionFilter("PDF Files", "*.pdf"));
        File file = fc.showSaveDialog(downloadReportBtn.getScene().getWindow());
        if (file == null)
            return;

        try {
            PdfWriter writer = new PdfWriter(file);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, PageSize.A4);
            doc.setMargins(60, 50, 60, 50);

            // الحل الصحيح للخط العربي (بدون boolean)
            PdfFont font = PdfFontFactory.createFont("C:/Windows/Fonts/arial.ttf", "Identity-H");

            // شعار خلفي
            try {
                Image logo = new Image(
                        ImageDataFactory.create(getClass().getResource("/noran/desktop/images/Logo.png")));
                logo.scaleToFit(pdf.getDefaultPageSize().getWidth(), pdf.getDefaultPageSize().getHeight());
                logo.setFixedPosition(0, 0);
                logo.setOpacity(0.07f);
                doc.add(logo);
            } catch (Exception ignored) {
            }

            // عنوان
            doc.add(new Paragraph(fixArabic("تقرير إحصائيات النظام"))
                    .setFont(font).setFontSize(28).setBold().setTextAlignment(TextAlignment.CENTER));

            String dateAr = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("dd MMMM yyyy - hh:mm a", new Locale("ar")));
            doc.add(new Paragraph(fixArabic("تاريخ التقرير: " + dateAr))
                    .setFont(font).setFontSize(14).setTextAlignment(TextAlignment.CENTER).setMarginBottom(30));

            // جدول الإحصائيات
            Table table = new Table(UnitValue.createPercentArray(new float[] { 2.8f, 1.2f }))
                    .useAllAvailableWidth()
                    .setFont(font)
                    .setFontSize(14);

            table.addHeaderCell(
                    new Cell().add(new Paragraph(fixArabic("البيان")).setBold().setFontColor(ColorConstants.WHITE))
                            .setBackgroundColor(new DeviceRgb(201, 30, 43)).setTextAlignment(TextAlignment.CENTER));
            table.addHeaderCell(
                    new Cell().add(new Paragraph(fixArabic("القيمة")).setBold().setFontColor(ColorConstants.WHITE))
                            .setBackgroundColor(new DeviceRgb(201, 30, 43)).setTextAlignment(TextAlignment.CENTER));

            addRow(table, "إجمالي الإيرادات", totalRevenueLabel.getText() + " جنيه");
            addRow(table, "الفواتير المعلقة", pendingInvoicesLabel.getText());
            addRow(table, "الفواتير المقبولة", completedInvoicesLabel.getText());
            addRow(table, "الشحنات الجارية", ongoingShipmentsLabel.getText());

            doc.add(table);

            // باقي الجداول
            doc.add(new Paragraph(fixArabic("توزيع الفواتير")).setFont(font).setFontSize(18).setBold()
                    .setMarginTop(30));
            Table t1 = new Table(2).useAllAvailableWidth().setFont(font);
            for (PieChart.Data d : chartAcceptedVsPending.getData()) {
                String name = d.getName().split(" \\(")[0];
                t1.addCell(new Cell().add(new Paragraph(fixArabic(name)).setTextAlignment(TextAlignment.RIGHT)));
                t1.addCell(new Cell().add(
                        new Paragraph(String.valueOf((int) d.getPieValue())).setTextAlignment(TextAlignment.CENTER)));
            }
            doc.add(t1);

            doc.add(new Paragraph(fixArabic("توزيع العملاء")).setFont(font).setFontSize(16).setBold().setMarginTop(20));
            Table t3 = new Table(2).useAllAvailableWidth().setFont(font);
            for (PieChart.Data d : chartClientsByVersion.getData()) {
                String name = d.getName().replaceAll(" \\(\\d+\\)", "");
                t3.addCell(new Cell().add(new Paragraph(fixArabic(name)).setTextAlignment(TextAlignment.RIGHT)));
                t3.addCell(new Cell().add(
                        new Paragraph(String.valueOf((int) d.getPieValue())).setTextAlignment(TextAlignment.CENTER)));
            }
            doc.add(t3);

            doc.add(new Paragraph(fixArabic("تم إنشاء التقرير بواسطة نظام نوران")).setFont(font).setFontSize(12)
                    .setItalic().setTextAlignment(TextAlignment.CENTER).setMarginTop(50));
            doc.close();

            showAlert(Alert.AlertType.INFORMATION, "تم", "تم حفظ التقرير بنجاح:\n" + file.getAbsolutePath());

        } catch (Exception e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "فشل", "فشل إنشاء التقرير:\n" + e.getMessage());
        }
    }

    private void addRow(Table table, String label, String value) {
        table.addCell(
                new Cell().add(new Paragraph(fixArabic(label)).setTextAlignment(TextAlignment.RIGHT).setPadding(12)));
        table.addCell(
                new Cell().add(new Paragraph(fixArabic(value)).setTextAlignment(TextAlignment.CENTER).setPadding(12)));
    }

    // دالة تصليح العربية بدون TEXT_DIRECTION_LOGICAL_TO_VISUAL
    private String fixArabic(String text) {
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

    private void showAlert(javafx.scene.control.Alert.AlertType type, String title, String msg) {
        if (type == javafx.scene.control.Alert.AlertType.ERROR) {
            AlertUtils.showError(title, msg);
        } else if (type == javafx.scene.control.Alert.AlertType.WARNING) {
            AlertUtils.showWarning(title, msg);
        } else if (type == javafx.scene.control.Alert.AlertType.INFORMATION) {
            AlertUtils.showSuccess(title, msg);
        } else {
            AlertUtils.showInfo(title, msg);
        }
    }

    // Navigation
    @FXML
    private void client_management_btn_handle(javafx.event.ActionEvent e) throws IOException {
        navigate(e, "/noran/desktop/client-data.fxml");
    }

    @FXML
    private void invoice_management_btn_handle(javafx.event.ActionEvent e) throws IOException {
        navigate(e, "/noran/desktop/client-data-invoice.fxml");
    }

    @FXML
    private void onTa5les(javafx.event.ActionEvent e) throws IOException {
        navigate(e, "/noran/desktop/AdminInvoices.fxml");
    }

    private void navigate(javafx.event.ActionEvent e, String fxml) throws IOException {
        Parent root = FXMLLoader.load(getClass().getResource(fxml));
        Stage stage = (Stage) ((Node) e.getSource()).getScene().getWindow();
        stage.getScene().setRoot(root);
    }

    public void employee_management(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/employee-management.fxml"));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.getScene().setRoot(root);
    }

    public void shipments_management(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/shipments-management.fxml"));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.getScene().setRoot(root);
    }
}