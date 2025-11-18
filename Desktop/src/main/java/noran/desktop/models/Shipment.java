package noran.desktop.models;

public class Shipment {
    private int shipmentId;
    private String portName;
    private int numOfContainers;
    private String status;
    private String typeOfContainersJson;

    public Shipment(int shipmentId, String portName, int numOfContainers, String status) {
        this.shipmentId = shipmentId;
        this.portName = portName;
        this.numOfContainers = numOfContainers;
        this.status = status;
    }

    public int getShipmentId() { return shipmentId; }
    public String getPortName() { return portName; }
    public int getNumOfContainers() { return numOfContainers; }
    public String getStatus() { return status; }
    public String getTypeOfContainersJson() { return typeOfContainersJson; }
    public void setTypeOfContainersJson(String json) { this.typeOfContainersJson = json; }

    @Override
    public String toString() {
        return "شحنة #" + shipmentId + " - " + portName + " (" + numOfContainers + " حاوية)";
    }
}