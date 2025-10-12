module noran.desktop {
    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.web;

    requires org.controlsfx.controls;
    requires com.dlsc.formsfx;
    requires net.synedra.validatorfx;
    requires org.kordamp.ikonli.javafx;
    requires org.kordamp.bootstrapfx.core;
    requires eu.hansolo.tilesfx;
    requires com.almasb.fxgl.all;

    opens noran.desktop to javafx.fxml;
    opens noran.desktop.Controllers to javafx.fxml;
    opens noran.desktop.Applications to javafx.graphics, javafx.fxml; // ✅ add this line

    exports noran.desktop;
    exports noran.desktop.Applications; // ✅ optional but recommended if other modules will reference it
}
