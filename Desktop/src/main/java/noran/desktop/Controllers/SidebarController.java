package noran.desktop.Controllers;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.stage.Stage;
import java.io.IOException;

public class SidebarController {

    // 1. Inject the Buttons from FXML
    @FXML private Button dashboardBtn;
    @FXML private Button clientsBtn;
    @FXML private Button invoicesBtn;
    @FXML private Button employeesBtn;
    @FXML private Button shipmentsBtn;

    // Constant Styles
    private final String ACTIVE_STYLE = "-fx-background-color: #c91e2b; -fx-text-fill: white; -fx-font-size: 13; -fx-alignment: CENTER_RIGHT; -fx-padding: 8 12; -fx-background-radius: 8;";
    private final String INACTIVE_STYLE = "-fx-background-color: transparent; -fx-text-fill: #333; -fx-font-size: 13; -fx-alignment: CENTER_RIGHT; -fx-padding: 8 12;";

    /**
     * Call this method from your Page Controllers to highlight the sidebar.
     * @param pageName The name of the page (e.g., "dashboard", "clients")
     */
    public void setActivePage(String pageName) {
        // Reset all buttons to transparent first
        resetStyles();

        // Highlight the specific button based on the name
        switch (pageName.toLowerCase()) {
            case "dashboard":
                dashboardBtn.setStyle(ACTIVE_STYLE);
                break;
            case "clients":
                clientsBtn.setStyle(ACTIVE_STYLE);
                break;
            case "invoices":
                invoicesBtn.setStyle(ACTIVE_STYLE);
                break;
            case "employees":
                employeesBtn.setStyle(ACTIVE_STYLE);
                break;
            case "shipments":
                shipmentsBtn.setStyle(ACTIVE_STYLE);
                break;
        }
    }

    private void resetStyles() {
        if(dashboardBtn != null) dashboardBtn.setStyle(INACTIVE_STYLE);
        if(clientsBtn != null) clientsBtn.setStyle(INACTIVE_STYLE);
        if(invoicesBtn != null) invoicesBtn.setStyle(INACTIVE_STYLE);
        if(employeesBtn != null) employeesBtn.setStyle(INACTIVE_STYLE);
        if(shipmentsBtn != null) shipmentsBtn.setStyle(INACTIVE_STYLE);
    }

    // --- Navigation Methods ---

    @FXML
    private void navigateToClients(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/client-data.fxml");
    }

    @FXML
    private void navigateToInvoices(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/client-data-invoice.fxml");
    }

    @FXML
    public void navigateToDashboard(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/dashboard.fxml");
    }

    @FXML
    public void navigateToEmployees(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/employee-management.fxml");
    }

    @FXML
    public void shipments_management(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/shipments-management.fxml");
    }
    @FXML
    public void navigateToTa5lees(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/AdminInvoices.fxml");
    }
    // Helper method to avoid repeating code
    private void loadPage(ActionEvent event, String fxmlPath) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
}