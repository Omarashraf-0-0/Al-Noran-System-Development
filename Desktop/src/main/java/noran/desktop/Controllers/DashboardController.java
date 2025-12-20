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
import noran.desktop.Database.DatabaseConnection;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
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
        try (Connection conn = DatabaseConnection.connect()) {
            // إجمالي الإيرادات
            String sql = "SELECT COALESCE(SUM(Port_fee_price + Clearance_Fees_price + Expense_Tips_price + Sundries_price + Additional_Services_price + COALESCE(unsupportedItemPrice,0)), 0) AS total FROM shipment_fees WHERE invoiceNumber IS NOT NULL";
            try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                if (rs.next())
                    totalRevenueLabel.setText(String.format("%,.2f", rs.getDouble("total")));
            }

            // الفواتير المعلقة
            sql = "SELECT COUNT(*) FROM shipment_fees WHERE invoiceNumber IS NOT NULL AND (invoiceStatus IS NULL OR invoiceStatus = 'pending')";
            try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                if (rs.next())
                    pendingInvoicesLabel.setText(String.valueOf(rs.getInt(1)));
            }

            // الفواتير المقبولة
            sql = "SELECT COUNT(*) FROM shipment_fees WHERE invoiceNumber IS NOT NULL AND invoiceStatus = 'accepted'";
            try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                if (rs.next())
                    completedInvoicesLabel.setText(String.valueOf(rs.getInt(1)));
            }

            // الشحنات الجارية
            sql = "SELECT COUNT(*) FROM shipments WHERE status IN ('pending', 'in_progress', 'processing')";
            try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                if (rs.next())
                    ongoingShipmentsLabel.setText(String.valueOf(rs.getInt(1)));
            }

            loadCharts(conn);
        } catch (SQLException e) {
            e.printStackTrace();
            showAlert(Alert.AlertType.ERROR, "خطأ", "فشل تحميل البيانات: " + e.getMessage());
        }
    }

    private void loadCharts(Connection conn) throws SQLException {
        // Chart 1: مقبولة vs معلقة
        String sql = "SELECT SUM(CASE WHEN invoiceStatus = 'accepted' THEN 1 ELSE 0 END) AS a, SUM(CASE WHEN invoiceStatus IS NULL OR invoiceStatus = 'pending' THEN 1 ELSE 0 END) AS p FROM shipment_fees WHERE invoiceNumber IS NOT NULL";
        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                int a = rs.getInt("a"), p = rs.getInt("p");
                chartAcceptedVsPending.setData(FXCollections.observableArrayList(
                        new PieChart.Data("مقبولة (" + a + ")", a),
                        new PieChart.Data("معلقة (" + p + ")", p)));
            }
        }

        // Chart 2
        sql = "SELECT COUNT(*) AS t, SUM(CASE WHEN invoiceStatus IS NULL OR invoiceStatus = 'pending' THEN 1 ELSE 0 END) AS p FROM shipment_fees WHERE invoiceNumber IS NOT NULL";
        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                int p = rs.getInt("p"), done = rs.getInt("t") - p;
                chartPendingInvoicesRatio.setData(FXCollections.observableArrayList(
                        new PieChart.Data("معلقة (" + p + ")", p),
                        new PieChart.Data("تمت المعالجة (" + done + ")", done)));
            }
        }

        // Chart 3
        sql = "SELECT version, COUNT(*) AS c FROM users WHERE type = 'client' AND version IS NOT NULL GROUP BY version";
        ObservableList<PieChart.Data> data = FXCollections.observableArrayList();
        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                int v = rs.getInt("version");
                int c = rs.getInt("c");
                String label = switch (v) {
                    case 0 -> "جديد";
                    case 1 -> "قديم";
                    case 2 -> "محدث";
                    default -> "إصدار " + v;
                };
                data.add(new PieChart.Data(label + " (" + c + ")", c));
            }
            if (data.isEmpty())
                data.add(new PieChart.Data("لا يوجد عملاء", 1));
            chartClientsByVersion.setData(data);
        }

        for (PieChart c : new PieChart[] { chartAcceptedVsPending, chartPendingInvoicesRatio, chartClientsByVersion }) {
            c.setLegendVisible(true);
            c.setLabelsVisible(false);
            c.setClockwise(true);
            c.setStartAngle(90);
        }
    }

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