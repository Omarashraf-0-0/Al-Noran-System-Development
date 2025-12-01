package noran.desktop.models;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

public class Client {

    private final StringProperty id;
    private final StringProperty fullname;
    private final StringProperty email;
    private final StringProperty ssn;
    private final StringProperty phone;
    private final StringProperty clientType;
    private final StringProperty password; // <-- new field

    // Constructor including password
    public Client(String id, String fullname, String email, String ssn, String phone, String clientType, String password) {
        this.id = new SimpleStringProperty(id);
        this.fullname = new SimpleStringProperty(fullname);
        this.email = new SimpleStringProperty(email);
        this.ssn = new SimpleStringProperty(ssn);
        this.phone = new SimpleStringProperty(phone);
        this.clientType = new SimpleStringProperty(clientType);
        this.password = new SimpleStringProperty(password);
    }

    // ------------------ ID ------------------
    public String getId() { return id.get(); }
    public void setId(String value) { id.set(value); }
    public StringProperty idProperty() { return id; }

    // ------------------ Fullname ------------------
    public String getFullname() { return fullname.get(); }
    public void setFullname(String value) { fullname.set(value); }
    public StringProperty fullnameProperty() { return fullname; }

    // ------------------ Email ------------------
    public String getEmail() { return email.get(); }
    public void setEmail(String value) { email.set(value); }
    public StringProperty emailProperty() { return email; }

    // ------------------ SSN ------------------
    public String getSsn() { return ssn.get(); }
    public void setSsn(String value) { ssn.set(value); }
    public StringProperty ssnProperty() { return ssn; }

    // ------------------ Phone ------------------
    public String getPhone() { return phone.get(); }
    public void setPhone(String value) { phone.set(value); }
    public StringProperty phoneProperty() { return phone; }

    // ------------------ Client Type ------------------
    public String getClientType() { return clientType.get(); }
    public void setClientType(String value) { clientType.set(value); }
    public StringProperty clientTypeProperty() { return clientType; }

    // ------------------ Password ------------------
    public String getPassword() { return password.get(); }
    public void setPassword(String value) { password.set(value); }
    public StringProperty passwordProperty() { return password; }
}
