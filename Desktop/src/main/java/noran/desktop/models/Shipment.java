package noran.desktop.models;

public class Shipment {

    private int shipmentId;
    private String portName;
    private int numOfContainers;        // renamed to match controller
    private String status;
    private String typeOfContainers;     // added field

    public Shipment(int shipmentId, String portName, int numOfContainers, String status) {
        this.shipmentId = shipmentId;
        this.portName = portName;
        this.numOfContainers = numOfContainers;
        this.status = status;
        this.typeOfContainers = "";
    }

    // Getters
    public int getShipmentId() {
        return shipmentId;
    }

    public String getPortName() {
        return portName;
    }

    public int getNumOfContainers() {
        return numOfContainers;
    }

    public String getStatus() {
        return status;
    }

    public String getTypeOfContainers() {
        return typeOfContainers;
    }

    // Setters
    public void setTypeOfContainers(String typeOfContainers) {
        this.typeOfContainers = typeOfContainers;
    }

    @Override
    public String toString() {
        return "شحنة #" + shipmentId + " - " + portName + " (" + numOfContainers + " حاوية)";
    }
}
