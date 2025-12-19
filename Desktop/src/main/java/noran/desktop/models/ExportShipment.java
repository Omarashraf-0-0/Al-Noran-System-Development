package noran.desktop.models;

import javafx.beans.property.*;

public class ExportShipment {
    private final StringProperty id;
    private final StringProperty userId;
    private final StringProperty customerName;
    private final StringProperty shipmentNumber;
    private final StringProperty ucrNumber;
    private final StringProperty destinationCountry;
    private final StringProperty destinationPort;
    private final StringProperty shippingMethod;
    private final StringProperty currentStatus;
    private final IntegerProperty containersCount;
    private final DoubleProperty totalWeight;
    private final DoubleProperty valueInEGP;
    private final DoubleProperty totalFees;
    private final BooleanProperty feePaid;

    public ExportShipment(String id, String userId, String customerName, String shipmentNumber,
            String ucrNumber, String destinationCountry, String destinationPort,
            String shippingMethod, String currentStatus, int containersCount,
            double totalWeight, double valueInEGP, double totalFees, boolean feePaid) {
        this.id = new SimpleStringProperty(id);
        this.userId = new SimpleStringProperty(userId);
        this.customerName = new SimpleStringProperty(customerName);
        this.shipmentNumber = new SimpleStringProperty(shipmentNumber);
        this.ucrNumber = new SimpleStringProperty(ucrNumber);
        this.destinationCountry = new SimpleStringProperty(destinationCountry);
        this.destinationPort = new SimpleStringProperty(destinationPort);
        this.shippingMethod = new SimpleStringProperty(shippingMethod);
        this.currentStatus = new SimpleStringProperty(currentStatus);
        this.containersCount = new SimpleIntegerProperty(containersCount);
        this.totalWeight = new SimpleDoubleProperty(totalWeight);
        this.valueInEGP = new SimpleDoubleProperty(valueInEGP);
        this.totalFees = new SimpleDoubleProperty(totalFees);
        this.feePaid = new SimpleBooleanProperty(feePaid);
    }

    // --- ID ---
    public String getId() {
        return id.get();
    }

    public void setId(String id) {
        this.id.set(id);
    }

    public StringProperty idProperty() {
        return id;
    }

    // --- User ID ---
    public String getUserId() {
        return userId.get();
    }

    public void setUserId(String userId) {
        this.userId.set(userId);
    }

    public StringProperty userIdProperty() {
        return userId;
    }

    // --- Customer Name ---
    public String getCustomerName() {
        return customerName.get();
    }

    public void setCustomerName(String name) {
        this.customerName.set(name);
    }

    public StringProperty customerNameProperty() {
        return customerName;
    }

    // --- Shipment Number ---
    public String getShipmentNumber() {
        return shipmentNumber.get();
    }

    public void setShipmentNumber(String num) {
        this.shipmentNumber.set(num);
    }

    public StringProperty shipmentNumberProperty() {
        return shipmentNumber;
    }

    // --- UCR Number ---
    public String getUcrNumber() {
        return ucrNumber.get();
    }

    public void setUcrNumber(String ucr) {
        this.ucrNumber.set(ucr);
    }

    public StringProperty ucrNumberProperty() {
        return ucrNumber;
    }

    // --- Destination Country ---
    public String getDestinationCountry() {
        return destinationCountry.get();
    }

    public void setDestinationCountry(String country) {
        this.destinationCountry.set(country);
    }

    public StringProperty destinationCountryProperty() {
        return destinationCountry;
    }

    // --- Destination Port ---
    public String getDestinationPort() {
        return destinationPort.get();
    }

    public void setDestinationPort(String port) {
        this.destinationPort.set(port);
    }

    public StringProperty destinationPortProperty() {
        return destinationPort;
    }

    // --- Shipping Method ---
    public String getShippingMethod() {
        return shippingMethod.get();
    }

    public void setShippingMethod(String method) {
        this.shippingMethod.set(method);
    }

    public StringProperty shippingMethodProperty() {
        return shippingMethod;
    }

    // --- Current Status ---
    public String getCurrentStatus() {
        return currentStatus.get();
    }

    public void setCurrentStatus(String status) {
        this.currentStatus.set(status);
    }

    public StringProperty currentStatusProperty() {
        return currentStatus;
    }

    // --- Containers Count ---
    public int getContainersCount() {
        return containersCount.get();
    }

    public void setContainersCount(int count) {
        this.containersCount.set(count);
    }

    public IntegerProperty containersCountProperty() {
        return containersCount;
    }

    // --- Total Weight ---
    public double getTotalWeight() {
        return totalWeight.get();
    }

    public void setTotalWeight(double weight) {
        this.totalWeight.set(weight);
    }

    public DoubleProperty totalWeightProperty() {
        return totalWeight;
    }

    // --- Value in EGP ---
    public double getValueInEGP() {
        return valueInEGP.get();
    }

    public void setValueInEGP(double value) {
        this.valueInEGP.set(value);
    }

    public DoubleProperty valueInEGPProperty() {
        return valueInEGP;
    }

    // --- Total Fees ---
    public double getTotalFees() {
        return totalFees.get();
    }

    public void setTotalFees(double fees) {
        this.totalFees.set(fees);
    }

    public DoubleProperty totalFeesProperty() {
        return totalFees;
    }

    // --- Fee Paid ---
    public boolean isFeePaid() {
        return feePaid.get();
    }

    public void setFeePaid(boolean paid) {
        this.feePaid.set(paid);
    }

    public BooleanProperty feePaidProperty() {
        return feePaid;
    }

    @Override
    public String toString() {
        if (getShipmentNumber() == null || getShipmentNumber().isEmpty()) {
            return "شحنة تصدير إلى (" + getDestinationCountry() + ")";
        }
        return getShipmentNumber();
    }
}
