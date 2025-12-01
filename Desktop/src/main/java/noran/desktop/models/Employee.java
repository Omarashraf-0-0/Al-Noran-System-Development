package noran.desktop.models;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class Employee {
    private final StringProperty id;
    private final StringProperty fullname;
    private final StringProperty email;
    private final StringProperty phone;
    private final StringProperty jobType; // Maps to clientType/role
    private final StringProperty rank;    // Maps to Status (Active/Frozen)
    private final StringProperty password;
    private boolean isActive;

    public Employee(String id, String fullname, String email, String phone, String jobType, boolean isActive, String password) {
        this.id = new SimpleStringProperty(id);
        this.fullname = new SimpleStringProperty(fullname);
        this.email = new SimpleStringProperty(email);
        this.phone = new SimpleStringProperty(phone);
        this.jobType = new SimpleStringProperty(jobType);
        this.isActive = isActive;
        this.rank = new SimpleStringProperty(isActive ? "نشط" : "مجمد"); // Active : Frozen
        this.password = new SimpleStringProperty(password);
    }

    // Getters for properties (needed for TableView)
    public StringProperty fullnameProperty() { return fullname; }
    public StringProperty emailProperty() { return email; }
    public StringProperty phoneProperty() { return phone; }
    public StringProperty jobTypeProperty() { return jobType; }
    public StringProperty rankProperty() { return rank; }

    // Standard Getters and Setters
    public String getId() { return id.get(); }
    public void setId(String id) { this.id.set(id); }

    public String getFullname() { return fullname.get(); }
    public void setFullname(String fullname) { this.fullname.set(fullname); }

    public String getEmail() { return email.get(); }
    public void setEmail(String email) { this.email.set(email); }

    public String getPhone() { return phone.get(); }
    public void setPhone(String phone) { this.phone.set(phone); }

    public String getJobType() { return jobType.get(); }
    public void setJobType(String jobType) { this.jobType.set(jobType); }

    public String getPassword() { return password.get(); }
    public void setPassword(String password) { this.password.set(password); }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) {
        this.isActive = active;
        this.rank.set(active ? "نشط" : "مجمد");
    }
}