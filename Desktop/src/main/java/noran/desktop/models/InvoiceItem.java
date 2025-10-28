package noran.desktop.models;

import javafx.beans.property.*;

public class InvoiceItem {
    private final SimpleStringProperty description; // الوصف
    private final SimpleDoubleProperty price;       // السعر
    private final SimpleStringProperty date;        // الحالة or التاريخ

    public InvoiceItem(String description, double price, String date) {
        this.description = new SimpleStringProperty(description);
        this.price = new SimpleDoubleProperty(price);
        this.date = new SimpleStringProperty(date);
    }

    public String getDescription() { return description.get(); }
    public void setDescription(String desc) { description.set(desc); }
    public SimpleStringProperty descriptionProperty() { return description; }

    public double getPrice() { return price.get(); }
    public void setPrice(double p) { price.set(p); }
    public SimpleDoubleProperty priceProperty() { return price; }

    public String getDate() { return date.get(); }
    public void setDate(String d) { date.set(d); }
    public SimpleStringProperty dateProperty() { return date; }
}
