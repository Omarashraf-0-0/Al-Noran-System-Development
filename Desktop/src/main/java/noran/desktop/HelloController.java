package noran.desktop;

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
import javafx.stage.Stage;
import noran.desktop.Controllers.User;
import noran.desktop.Database.DatabaseConnection;
import noran.desktop.models.InvoiceItem;
import noran.desktop.models.Shipment;

import java.io.IOException;
import java.net.URL;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ResourceBundle;

public class HelloController implements Initializable {

    /* ---------- UI elements ---------- */
    @FXML private Label userNameLabel;
    @FXML private Label userIdLabel;
    @FXML private TextField searchField;

    @FXML private TableView<InvoiceItem> invoicesTable;
    @FXML private TableColumn<InvoiceItem, String> colDescription;
    @FXML private TableColumn<InvoiceItem, Double> colPrice;
    @FXML private TableColumn<InvoiceItem, String> colDate;

    @FXML private ComboBox<Shipment> clientShipmentComboBox;

    /* ---------- NEW DYNAMIC LABELS ---------- */
    @FXML private Label clientNameLabel;
    @FXML private Label taxNumberLabel;
    @FXML private Label invoiceNumberLabel;
    @FXML private Label invoiceDateLabel;

    /* ---------- Data ---------- */
    private String selectedClientName;
    private String selectedTaxNumber;
    private String selectedClientType;

    private final ObservableList<Shipment> shipmentList = FXCollections.observableArrayList();
    private final ObservableList<InvoiceItem> invoiceList = FXCollections.observableArrayList();

    /* ---------- Init ---------- */
    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // logged‑in user (top‑right avatar)
        User u = AppSession.getInstance().getCurrentUser();
        if (u != null) {
            if (userNameLabel != null) userNameLabel.setText(u.getName() == null ? "" : u.getName());
            if (userIdLabel != null)   userIdLabel.setText(u.getId() == null ? "" : "ID: " + u.getId());
        }

        setupInvoicesTable();
        setupShipmentComboBox();
    }

    /* ---------- Called from ClientDataController ---------- */
    public void setSelectedClient(String name, String taxNumber, String clientType) {
        this.selectedClientName   = name;
        this.selectedTaxNumber    = taxNumber;
        this.selectedClientType   = clientType;

        updateClientHeader();
        loadClientShipments();
        loadInvoicesForShipment(null);               // show all invoices of this client first
    }

    /* ---------- UI updates ---------- */
    private void updateClientHeader() {
        if (clientNameLabel != null)
            clientNameLabel.setText("اسم العميل : " + selectedClientName);

        if (taxNumberLabel != null)
            taxNumberLabel.setText("الرقم الضريبي: " + selectedTaxNumber);

        // invoice number & date will be set when an invoice is selected
        if (invoiceNumberLabel != null) invoiceNumberLabel.setText("رقم الفاتورة: -");
        if (invoiceDateLabel != null)   invoiceDateLabel.setText("التاريخ: -");
    }

    private void setupInvoicesTable() {
        if (invoicesTable == null) return;
        colDescription.setCellValueFactory(new PropertyValueFactory<>("description"));
        colPrice.setCellValueFactory(new PropertyValueFactory<>("price"));
        colDate.setCellValueFactory(new PropertyValueFactory<>("date"));
        invoicesTable.setItems(invoiceList);

        // When a row is selected → show its number & date
        invoicesTable.getSelectionModel().selectedItemProperty().addListener((obs, old, newVal) -> {
            if (newVal != null) {
                // Assuming you store invoice_id and date in InvoiceItem (add fields if needed)
                // Here we just reuse the date column
                invoiceDateLabel.setText("التاريخ: " + newVal.getDate());
                // If you have an invoice_id column, pull it the same way
                invoiceNumberLabel.setText("رقم الفاتورة: " + getInvoiceIdForItem(newVal));
            }
        });
    }

    private String getInvoiceIdForItem(InvoiceItem item) {
        // Simple lookup – you can store invoice_id inside InvoiceItem if you prefer
        String sql = "SELECT id FROM invoices WHERE client_tax_number = ? AND description = ? AND price = ? AND date = ?";
        try (Connection c = DatabaseConnection.connect();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, selectedTaxNumber);
            ps.setString(2, item.getDescription());
            ps.setDouble(3, item.getPrice());
            ps.setString(4, item.getDate());
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return "#" + rs.getInt("id");
        } catch (SQLException e) { e.printStackTrace(); }
        return "-";
    }

    private void setupShipmentComboBox() {
        clientShipmentComboBox.setItems(shipmentList);
        clientShipmentComboBox.setPromptText("اختر الشحنة");
        clientShipmentComboBox.getSelectionModel().selectedItemProperty().addListener(
                (obs, old, newVal) -> {
                    if (newVal != null) {
                        loadInvoicesForShipment(newVal.getShipmentId());
                    } else {
                        loadInvoicesForShipment(null);
                    }
                });
    }

    /* ---------- DB loading ---------- */
    private void loadClientShipments() {
        shipmentList.clear();
        String sql = "SELECT shipment_id, port_name, num_of_containers, status " +
                "FROM shipments WHERE client_tax_number = ?";

        try (Connection c = DatabaseConnection.connect();
             PreparedStatement ps = c.prepareStatement(sql)) {

            ps.setString(1, selectedTaxNumber);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                Shipment s = new Shipment(
                        rs.getInt("shipment_id"),
                        rs.getString("port_name"),
                        rs.getInt("num_of_containers"),
                        rs.getString("status")
                );
                shipmentList.add(s);
            }
        } catch (SQLException e) { e.printStackTrace(); }
    }

    private void loadInvoicesForShipment(Integer shipmentId) {
        invoiceList.clear();
        String sql;
        if (shipmentId == null) {
            sql = "SELECT description, price, date FROM invoices WHERE client_tax_number = ?";
        } else {
            sql = "SELECT description, price, date FROM invoices WHERE client_tax_number = ? AND shipment_id = ?";
        }

        try (Connection c = DatabaseConnection.connect();
             PreparedStatement ps = c.prepareStatement(sql)) {

            ps.setString(1, selectedTaxNumber);
            if (shipmentId != null) ps.setInt(2, shipmentId);

            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                InvoiceItem i = new InvoiceItem(
                        rs.getString("description"),
                        rs.getDouble("price"),
                        rs.getString("date")
                );
                invoiceList.add(i);
            }
        } catch (SQLException e) { e.printStackTrace(); }
    }

    /* ---------- Search & navigation ---------- */
    @FXML public void onSearch(ActionEvent e) {
        String q = searchField.getText();
        System.out.println("Search: " + q);
    }

    @FXML public void onDashboardClick(ActionEvent e) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/dashboard.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) e.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
}