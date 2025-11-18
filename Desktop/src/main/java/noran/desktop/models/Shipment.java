package noran.desktop.models;

import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;
import javafx.beans.property.IntegerProperty;

public class Shipment {
    private  int id = 0;         // local Mongo _id or server id
    private StringProperty acid = new SimpleStringProperty("");// unique acid identifier
    private final StringProperty portName;
    private final IntegerProperty numOfContainers;
    private final StringProperty country;
    private final StringProperty status;
    private final StringProperty policy;
    private String typeOfContainersJson; // <- add this


    public Shipment(int id, String acid, String portName, int numOfContainers, String country, String status, String policy) {
        this.id = id;
        this.acid = new SimpleStringProperty(acid == null ? "" : acid);
        this.portName = new SimpleStringProperty(portName == null ? "" : portName);
        this.numOfContainers = new SimpleIntegerProperty(numOfContainers);
        this.country = new SimpleStringProperty(country == null ? "" : country);
        this.status = new SimpleStringProperty(status == null ? "" : status);
        this.policy = new SimpleStringProperty(policy == null ? "" : policy);
    }
    public Shipment(int id,  String portName, int numOfContainers, String country, String status, String policy) {
        this.id = id;
        this.portName = new SimpleStringProperty(portName == null ? "" : portName);
        this.numOfContainers = new SimpleIntegerProperty(numOfContainers);
        this.country = new SimpleStringProperty(country == null ? "" : country);
        this.status = new SimpleStringProperty(status == null ? "" : status);
        this.policy = new SimpleStringProperty(policy == null ? "" : policy);
    }
    public Shipment(int id, String portName, int numOfContainers, String status) {
        this.id = id;
        this.acid = new SimpleStringProperty("0000000000");
        this.portName = new SimpleStringProperty(portName == null ? "" : portName);
        this.numOfContainers = new SimpleIntegerProperty(numOfContainers);
        this.country = new SimpleStringProperty("Egypt");
        this.status = new SimpleStringProperty(status == null ? "" : status);
        this.policy = new SimpleStringProperty("Policy 001");
    }

    // id
    public int getId() { return id; }
    public void setId(int v) { id=v; }
    public int idProperty() { return id; }

    // acid
    public String getAcid() { return acid.get(); }
    public void setAcid(String v) { acid.set(v); }
    public StringProperty acidProperty() { return acid; }

    // portName
    public String getPortName() { return portName.get(); }
    public void setPortName(String v) { portName.set(v); }
    public StringProperty portNameProperty() { return portName; }

    // numOfContainers
    public int getNumOfContainers() { return numOfContainers.get(); }
    public void setNumOfContainers(int v) { numOfContainers.set(v); }
    public IntegerProperty numOfContainersProperty() { return numOfContainers; }

    // country
    public String getCountry() { return country.get(); }
    public void setCountry(String v) { country.set(v); }
    public StringProperty countryProperty() { return country; }

    // status
    public String getStatus() { return status.get(); }
    public void setStatus(String v) { status.set(v); }
    public StringProperty statusProperty() { return status; }

    // policy
    public String getPolicy() { return policy.get(); }
    public void setPolicy(String v) { policy.set(v); }
    public StringProperty policyProperty() { return policy; }

    @Override
    public String toString() {
        return "شحنة " + getAcid() + " - " + getPortName();
    }

    public String getTypeOfContainersJson() {
        return typeOfContainersJson;
    }

    public void setTypeOfContainersJson(String typeOfContainersJson) {
        this.typeOfContainersJson = typeOfContainersJson;
    }
}
