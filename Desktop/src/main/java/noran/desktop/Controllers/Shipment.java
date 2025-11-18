package noran.desktop.Controllers;

public class Shipment {
    private int shipmentId;
    private String portName;
    private int numOfContainers;
    private String typeOfContainers;
    private String status;
    private String policy;
    private String country;
    private String thirdGomroky;
    private boolean dragt;
    private double clearanceFees;
    private double expensesAndTips;
    private double sundries;
    private String clientId;

    public Shipment() {}

    public Shipment(int shipmentId, String portName, int numOfContainers, String status) {
        this.shipmentId = shipmentId;
        this.portName = portName;
        this.numOfContainers = numOfContainers;
        this.status = status;
    }

    public int getShipmentId() { return shipmentId; }
    public void setShipmentId(int shipmentId) { this.shipmentId = shipmentId; }

    public String getPortName() { return portName; }
    public void setPortName(String portName) { this.portName = portName; }

    public int getNumOfContainers() { return numOfContainers; }
    public void setNumOfContainers(int numOfContainers) { this.numOfContainers = numOfContainers; }

    public String getTypeOfContainers() { return typeOfContainers; }
    public void setTypeOfContainers(String typeOfContainers) { this.typeOfContainers = typeOfContainers; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPolicy() { return policy; }
    public void setPolicy(String policy) { this.policy = policy; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getThirdGomroky() { return thirdGomroky; }
    public void setThirdGomroky(String thirdGomroky) { this.thirdGomroky = thirdGomroky; }

    public boolean isDragt() { return dragt; }
    public void setDragt(boolean dragt) { this.dragt = dragt; }

    public double getClearanceFees() { return clearanceFees; }
    public void setClearanceFees(double clearanceFees) { this.clearanceFees = clearanceFees; }

    public double getExpensesAndTips() { return expensesAndTips; }
    public void setExpensesAndTips(double expensesAndTips) { this.expensesAndTips = expensesAndTips; }

    public double getSundries() { return sundries; }
    public void setSundries(double sundries) { this.sundries = sundries; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    @Override
    public String toString() {
        return portName + " (" + numOfContainers + " containers)";
    }
}
