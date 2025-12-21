package noran.desktop.models;

import javafx.beans.property.*;

public class InvoiceItem {
    private final StringProperty description;
    private final DoubleProperty price;
    private final StringProperty currency; // "EGP" or "USD"
    private final StringProperty type; // "Manual"

    public InvoiceItem(String description, double price, String currency, String type) {
        this.description = new SimpleStringProperty(description);
        this.price = new SimpleDoubleProperty(price);
        this.currency = new SimpleStringProperty(currency);
        this.type = new SimpleStringProperty(type);
    }

    public String getDescription() { return description.get(); }
    public StringProperty descriptionProperty() { return description; }

    public double getPrice() { return price.get(); }
    public DoubleProperty priceProperty() { return price; }

    public String getCurrency() { return currency.get(); }
    public StringProperty currencyProperty() { return currency; }

    public String getType() { return type.get(); }
}