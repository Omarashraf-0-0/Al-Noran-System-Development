package noran.desktop.Controllers;

import javafx.fxml.FXML;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import noran.desktop.models.Employee;

public class EmployeePopupController {

    @FXML private TextField fullnameField;
    @FXML private TextField emailField;
    @FXML private TextField phoneField;
    @FXML private TextField passwordField;
    @FXML private ComboBox<String> jobTypeField; // Defines Role (Manager, Staff, etc.)

    private Employee originalEmployee;
    private boolean saved = false;

    public void loadEmployee(Employee emp) {
        this.originalEmployee = emp;

        fullnameField.setText(emp.getFullname());
        emailField.setText(emp.getEmail());
        phoneField.setText(emp.getPhone());
        passwordField.setText(emp.getPassword());
        jobTypeField.setValue(emp.getJobType());
    }

    @FXML
    private void save() {
        if (fullnameField.getText().isBlank() || emailField.getText().isBlank() || jobTypeField.getValue() == null) {
            System.out.println("❌ Fields cannot be empty.");
            return;
        }

        saved = true;

        originalEmployee.setFullname(fullnameField.getText());
        originalEmployee.setEmail(emailField.getText());
        originalEmployee.setPhone(phoneField.getText());
        originalEmployee.setJobType(jobTypeField.getValue());
        originalEmployee.setPassword(passwordField.getText());

        close();
    }

    @FXML
    private void cancel() {
        saved = false;
        close();
    }

    public boolean isSaved() { return saved; }

    private void close() {
        Stage stage = (Stage) fullnameField.getScene().getWindow();
        stage.close();
    }
}