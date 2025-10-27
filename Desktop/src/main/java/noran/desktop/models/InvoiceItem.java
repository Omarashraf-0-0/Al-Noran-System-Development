package noran.desktop.models;

import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

/**
 * Model for an invoice line item.
 */
public class InvoiceItem {

    private final SimpleStringProperty description = new SimpleStringProperty();
    private final SimpleDoubleProperty price = new SimpleDoubleProperty();
    private final SimpleStringProperty date = new SimpleStringProperty();

    public InvoiceItem() {
    }

    public InvoiceItem(String description, double price, String date) {
        this.description.set(description);
        this.price.set(price);
        this.date.set(date);
    }

    public String getDescription() {
        return description.get();
    }

    public StringProperty descriptionProperty() {
        return description;
    }

    public void setDescription(String description) {
        this.description.set(description);
    }

    public double getPrice() {
        return price.get();
    }

    public SimpleDoubleProperty priceProperty() {
        return price;
    }

    public void setPrice(double price) {
        this.price.set(price);
    }

    public String getDate() {
        return date.get();
    }

    public StringProperty dateProperty() {
        return date;
    }

    public void setDate(String date) {
        this.date.set(date);
    }
}
