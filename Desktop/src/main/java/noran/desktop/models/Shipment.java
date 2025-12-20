package noran.desktop.models;

import javafx.beans.property.*;

public class Shipment {
    private final StringProperty id;
    private final StringProperty userId;
    private final StringProperty customerName;
    private final StringProperty acid;
    private final StringProperty portName;
    private final StringProperty country;
    private final StringProperty status;
    private final IntegerProperty numOfContainers;
    private final StringProperty policy;
    private final StringProperty assignedToName; // Name of employee this shipment is assigned to

    // Helper field for container types string from DB (if needed)
    private String typeOfContainersJson;

    public Shipment(String id, String userId, String customerName, String acid, String portName, String country,
            String status, int numOfContainers, String policy) {
        this(id, userId, customerName, acid, portName, country, status, numOfContainers, policy, "");
    }

    public Shipment(String id, String userId, String customerName, String acid, String portName, String country,
            String status, int numOfContainers, String policy, String assignedToName) {
        this.id = new SimpleStringProperty(id);
        this.userId = new SimpleStringProperty(userId);
        this.customerName = new SimpleStringProperty(customerName);
        this.acid = new SimpleStringProperty(acid);
        this.portName = new SimpleStringProperty(portName);
        this.country = new SimpleStringProperty(country);
        this.status = new SimpleStringProperty(status);
        this.numOfContainers = new SimpleIntegerProperty(numOfContainers);
        this.policy = new SimpleStringProperty(policy);
        this.assignedToName = new SimpleStringProperty(assignedToName);
    }

    // --- Getters & Setters --- (Keep existing ones)

    public String getId() {
        return id.get();
    }

    public void setId(String id) {
        this.id.set(id);
    }

    public String getUserId() {
        return userId.get();
    }

    public void setUserId(String userId) {
        this.userId.set(userId);
    }

    public String getCustomerName() {
        return customerName.get();
    }

    public void setCustomerName(String name) {
        this.customerName.set(name);
    }

    public StringProperty customerNameProperty() {
        return customerName;
    }

    public String getAcid() {
        return acid.get();
    }

    public void setAcid(String acid) {
        this.acid.set(acid);
    }

    public StringProperty acidProperty() {
        return acid;
    }

    public String getPortName() {
        return portName.get();
    }

    public void setPortName(String portName) {
        this.portName.set(portName);
    }

    public StringProperty portNameProperty() {
        return portName;
    }

    public String getCountry() {
        return country.get();
    }

    public void setCountry(String country) {
        this.country.set(country);
    }

    public StringProperty countryProperty() {
        return country;
    }

    public String getStatus() {
        return status.get();
    }

    public void setStatus(String status) {
        this.status.set(status);
    }

    public StringProperty statusProperty() {
        return status;
    }

    public int getNumOfContainers() {
        return numOfContainers.get();
    }

    public void setNumOfContainers(int num) {
        this.numOfContainers.set(num);
    }

    public IntegerProperty numOfContainersProperty() {
        return numOfContainers;
    }

    public String getPolicy() {
        return policy.get();
    }

    public void setPolicy(String policy) {
        this.policy.set(policy);
    }

    public StringProperty policyProperty() {
        return policy;
    }

    public String getAssignedToName() {
        return assignedToName.get();
    }

    public void setAssignedToName(String name) {
        this.assignedToName.set(name);
    }

    public StringProperty assignedToNameProperty() {
        return assignedToName;
    }

    public String getTypeOfContainersJson() {
        return typeOfContainersJson;
    }

    public void setTypeOfContainersJson(String typeOfContainersJson) {
        this.typeOfContainersJson = typeOfContainersJson;
    }

    // ✅ FIX: Override toString to display ACID in ComboBox
    @Override
    public String toString() {
        // You can customize this. E.g. return getAcid() + " (" + getPortName() + ")";
        if (getAcid() == null || getAcid().isEmpty()) {
            return "شحنة من ميناء (" + getPortName() + ")";
        }
        return getAcid();
    }
}