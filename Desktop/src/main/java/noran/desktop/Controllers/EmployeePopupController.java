package noran.desktop.Controllers;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import noran.desktop.Utils.ComboBoxStyler;
import noran.desktop.models.Employee;

import java.net.URL;
import java.util.ResourceBundle;
import java.util.function.Function;

public class EmployeePopupController implements Initializable {

    @FXML
    private TextField fullnameField;
    @FXML
    private TextField emailField;
    @FXML
    private TextField phoneField;
    @FXML
    private TextField passwordField;
    @FXML
    private ComboBox<String> jobTypeField;

    private Employee originalEmployee;
    private boolean saved = false;

    // Function that takes an Employee and returns Boolean (Success/Fail)
    private Function<Employee, Boolean> saveHandler;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // Apply consistent ComboBox styling
        ComboBoxStyler.style(jobTypeField);
    }

    public void setSaveHandler(Function<Employee, Boolean> saveHandler) {
        this.saveHandler = saveHandler;
    }

    public void loadEmployee(Employee emp) {
        this.originalEmployee = emp;
        fullnameField.setText(emp.getFullname());
        emailField.setText(emp.getEmail());
        phoneField.setText(emp.getPhone());
        passwordField.setText(emp.getPassword());
        // Only set value if not null/empty, otherwise let prompt text show
        if (emp.getJobType() != null && !emp.getJobType().isEmpty()) {
            jobTypeField.setValue(emp.getJobType());
        }
    }

    @FXML
    private void save() {
        if (fullnameField.getText().isBlank() || emailField.getText().isBlank() || jobTypeField.getValue() == null) {
            System.out.println("❌ Fields cannot be empty.");
            return;
        }

        // 1. Update the object with UI data
        originalEmployee.setFullname(fullnameField.getText());
        originalEmployee.setEmail(emailField.getText());
        originalEmployee.setPhone(phoneField.getText());
        originalEmployee.setJobType(jobTypeField.getValue());
        originalEmployee.setPassword(passwordField.getText());

        // 2. Call the Save Handler (in Main Controller)
        if (saveHandler != null) {
            boolean success = saveHandler.apply(originalEmployee);

            // 3. ONLY CLOSE IF SUCCESSFUL
            if (success) {
                saved = true;
                close();
            }
            // If success is false, we DO NOT close. The alert is shown by the main
            // controller.
        }
    }

    @FXML
    private void cancel() {
        saved = false;
        close();
    }

    public boolean isSaved() {
        return saved;
    }

    private void close() {
        Stage stage = (Stage) fullnameField.getScene().getWindow();
        stage.close();
    }
}