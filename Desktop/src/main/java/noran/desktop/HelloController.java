package noran.desktop;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.stage.Stage;
import noran.desktop.Controllers.User;
import noran.desktop.models.InvoiceItem;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

public class HelloController implements Initializable {

    @FXML
    private Label welcomeText;

    @FXML
    private Label userNameLabel;

    @FXML
    private Label userIdLabel;

    @FXML
    private TextField searchField;
    
    @FXML
    private TableView<InvoiceItem> invoicesTable;
    
    @FXML
    private TableColumn<InvoiceItem, String> colDescription;
    
    @FXML
    private TableColumn<InvoiceItem, Double> colPrice;
    
    @FXML
    private TableColumn<InvoiceItem, String> colDate;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // Populate user details from the application session if available
        User u = AppSession.getInstance().getCurrentUser();
        if (u != null) {
            if (userNameLabel != null) userNameLabel.setText(u.getName() == null || u.getName().isBlank() ? "" : u.getName());
            if (userIdLabel != null) {
                String idText = (u.getId() == null || u.getId().isBlank()) ? "" : ("ID: " + u.getId());
                userIdLabel.setText(idText);
            }
        }
        
        // setup invoices table if present on this view
        setupInvoicesTable();
    }

    @FXML
    protected void onHelloButtonClick() {
        if (welcomeText != null) welcomeText.setText("Welcome to JavaFX Application!");
    }

    @FXML
    public void onSearch(ActionEvent event) {
        String q = (searchField == null) ? "" : searchField.getText();
        // simple placeholder behavior: show query in welcomeText if available
        if (welcomeText != null) {
            welcomeText.setText("بحث: " + (q == null ? "" : q));
        }
        System.out.println("Search triggered: " + q);
    }

    private void setupInvoicesTable() {
        if (invoicesTable == null) return;

        // configure columns
        if (colDescription != null) colDescription.setCellValueFactory(new PropertyValueFactory<>("description"));
        if (colPrice != null) colPrice.setCellValueFactory(new PropertyValueFactory<>("price"));
        if (colDate != null) colDate.setCellValueFactory(new PropertyValueFactory<>("date"));



    }

    public void onDashboardClick(ActionEvent event) throws IOException {
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/noran/desktop/dashboard.fxml"));
        Parent root = loader.load();
        Scene scene = new Scene(root);
        Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
        stage.setScene(scene);
        stage.show();
    }
}