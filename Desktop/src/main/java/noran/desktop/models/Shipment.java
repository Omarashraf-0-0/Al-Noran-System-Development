package noran.desktop.models;

public class Shipment {
    private final int shipmentId;
    private final String portName;
    private final int numContainers;
    private final String status;

    public Shipment(int shipmentId, String portName, int numContainers, String status) {
        this.shipmentId = shipmentId;
        this.portName = portName;
        this.numContainers = numContainers;
        this.status = status;
    }

    public int getShipmentId() { return shipmentId; }
    public String getPortName() { return portName; }
    public int getNumContainers() { return numContainers; }
    public String getStatus() { return status; }

    @Override
    public String toString() {
        return "شحنة #" + shipmentId + " - " + portName + " (" + numContainers + " حاوية)";
    }
}