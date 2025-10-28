package noran.desktop.Controllers;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.chart.PieChart;
import javafx.scene.control.Label;
import javafx.stage.Stage;
import javafx.event.ActionEvent;
import noran.desktop.AppSession;
import noran.desktop.Controllers.User;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

public class DashboardController implements Initializable {

    @FXML private Label userNameLabel;
    @FXML private Label userIdLabel;

    @FXML private PieChart chartRevenueComparison;
    @FXML private PieChart chartMonthlyPayments;
    @FXML private PieChart chartActiveClients;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // ========== USER INFO ==========
        User u = AppSession.getInstance().getCurrentUser();
        if (u != null) {
            if (userNameLabel != null)
                userNameLabel.setText(u.getName() == null || u.getName().isBlank() ? "" : u.getName());
            if (userIdLabel != null)
                userIdLabel.setText(u.getId() == null || u.getId().isBlank() ? "" : "ID: " + u.getId());
        }

        // ========== CHARTS SETUP ==========
        setupRevenueChart();
        setupMonthlyPaymentsChart();
        setupActiveClientsChart();
    }

    private void setupRevenueChart() {
        if (chartRevenueComparison == null) return;
        ObservableList<PieChart.Data> data = FXCollections.observableArrayList(
                new PieChart.Data("بحري", 200),
                new PieChart.Data("جوي", 100)
        );
        chartRevenueComparison.setData(data);
        chartRevenueComparison.setLegendVisible(true);
        chartRevenueComparison.setLabelsVisible(false);
        chartRevenueComparison.setClockwise(true);
        chartRevenueComparison.setStartAngle(90);
        chartRevenueComparison.setStyle("-fx-pie-color: teal;");
        applyChartColors(chartRevenueComparison, "#1fb5b5", "#7b0d0d");
    }

    private void setupMonthlyPaymentsChart() {
        if (chartMonthlyPayments == null) return;
        ObservableList<PieChart.Data> data = FXCollections.observableArrayList(
                new PieChart.Data("الدخل", 100000),
                new PieChart.Data("المصروفات", 10000)
        );
        chartMonthlyPayments.setData(data);
        chartMonthlyPayments.setLegendVisible(true);
        chartMonthlyPayments.setLabelsVisible(false);
        applyChartColors(chartMonthlyPayments, "#1fb5b5", "#7b0d0d");
    }

    private void setupActiveClientsChart() {
        if (chartActiveClients == null) return;
        ObservableList<PieChart.Data> data = FXCollections.observableArrayList(
                new PieChart.Data("اسم العميل 1", 5),
                new PieChart.Data("اسم العميل 2", 4),
                new PieChart.Data("اسم العميل 3", 3)
        );
        chartActiveClients.setData(data);
        chartActiveClients.setLegendVisible(true);
        chartActiveClients.setLabelsVisible(false);
        applyChartColors(chartActiveClients, "#1fb5b5", "#7b0d0d", "#4e0606");
    }

    // Helper: apply consistent colors
    private void applyChartColors(PieChart chart, String... colors) {
        for (int i = 0; i < chart.getData().size() && i < colors.length; i++) {
            chart.getData().get(i).getNode().setStyle("-fx-pie-color: " + colors[i] + ";");
        }
    }

    // ========== EVENT HANDLERS ==========
    public void onSearch(ActionEvent actionEvent) { }

    public void invoice_management_btn_handle(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/client-data.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
}
