package noran.desktop.Controllers;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.stage.Stage;
import java.io.IOException;

public class SidebarController {

    // 1. Inject the Buttons from FXML
    @FXML
    private Button dashboardBtn;
    @FXML
    private Button clientsBtn;
    @FXML
    private Button invoicesBtn;
    @FXML
    private Button employeesBtn;
    @FXML
    private Button shipmentsBtn;
    @FXML
    private Button exportShipmentsBtn;
    @FXML
    private Button addInvoicesBtn;
    @FXML
    private Button invoiceCompletionBtn;
    @FXML
    private Button acceptedInvoicesBtn;

    // CSS style class names
    private final String ACTIVE_CLASS = "sidebar-button-active";
    private final String INACTIVE_CLASS = "sidebar-button";

    @FXML
    private void initialize() {
        // Hide admin-only buttons for non-admin users
        User currentUser = noran.desktop.AppSession.getInstance().getCurrentUser();
        if (currentUser == null || !currentUser.isAdmin()) {
            // Hide parent HBox wrappers to eliminate gaps
            hideButtonWithParent(invoiceCompletionBtn);
            hideButtonWithParent(clientsBtn);
            hideButtonWithParent(employeesBtn);
            hideButtonWithParent(acceptedInvoicesBtn);
        }
    }

    private void hideButtonWithParent(Button btn) {
        if (btn != null) {
            btn.setVisible(false);
            btn.setManaged(false);
        }
    }

    /**
     * Call this method from your Page Controllers to highlight the sidebar.
     * 
     * @param pageName The name of the page (e.g., "dashboard", "clients")
     */
    public void setActivePage(String pageName) {
        // Reset all buttons to inactive first
        resetStyles();

        // Highlight the specific button based on the name
        switch (pageName.toLowerCase()) {
            case "dashboard":
                setButtonActive(dashboardBtn);
                break;
            case "clients":
                setButtonActive(clientsBtn);
                break;
            case "invoices":
                setButtonActive(invoicesBtn);
                break;
            case "employees":
                setButtonActive(employeesBtn);
                break;
            case "shipments":
                setButtonActive(shipmentsBtn);
                break;
            case "exports":
                setButtonActive(exportShipmentsBtn);
                break;
            case "new invoice":
                setButtonActive(addInvoicesBtn);
                break;
            case "invoice completion":
                setButtonActive(invoiceCompletionBtn);
                break;
            case "accepted invoices":
                setButtonActive(acceptedInvoicesBtn);
                break;
        }
    }

    private void setButtonActive(Button btn) {
        if (btn != null) {
            btn.getStyleClass().remove(INACTIVE_CLASS);
            btn.getStyleClass().add(ACTIVE_CLASS);
        }
    }

    private void setButtonInactive(Button btn) {
        if (btn != null) {
            btn.getStyleClass().remove(ACTIVE_CLASS);
            if (!btn.getStyleClass().contains(INACTIVE_CLASS)) {
                btn.getStyleClass().add(INACTIVE_CLASS);
            }
        }
    }

    private void resetStyles() {
        setButtonInactive(dashboardBtn);
        setButtonInactive(clientsBtn);
        setButtonInactive(invoicesBtn);
        setButtonInactive(employeesBtn);
        setButtonInactive(shipmentsBtn);
        setButtonInactive(exportShipmentsBtn);
        setButtonInactive(addInvoicesBtn);
        setButtonInactive(addInvoicesBtn);
        setButtonInactive(invoiceCompletionBtn);
        setButtonInactive(acceptedInvoicesBtn);
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
    private void navigateToAddInvoices(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/admin-add-invoice.fxml");
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
    public void navigateToExportShipments(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/exports-management.fxml");
    }

    @FXML
    public void navigateToTa5lees(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/AdminInvoices.fxml");
    }

    @FXML
    public void navigateToAcceptedInvoices(ActionEvent event) throws IOException {
        loadPage(event, "/noran/desktop/AcceptedInvoicesView.fxml");
    }

    // Helper method to avoid repeating code
    private void loadPage(ActionEvent event, String fxmlPath) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
        Parent root = loader.load();
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();

        // Keep the existing scene and just change its root content
        // This preserves window size because we don't create a new Scene
        stage.getScene().setRoot(root);
    }
}