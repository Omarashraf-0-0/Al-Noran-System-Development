package noran.desktop.Controllers;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.Parent;
import javafx.stage.Stage;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Alert;
import javafx.scene.control.TextField;
import javafx.scene.control.Alert.AlertType;

import java.io.IOException;

public class OTPVerificationController {

    @FXML private TextField otp1;
    @FXML private TextField otp2;
    @FXML private TextField otp3;
    @FXML private TextField otp4;
    @FXML private TextField otp5;

    /**
     * Handle "الرجوع" link click
     */
    @FXML
    private void onBackClicked(ActionEvent event) {
        try {
            Parent root = FXMLLoader.load(getClass().getResource("/noran/desktop/email-for-otp-ar.fxml"));
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            Scene scene = new Scene(root);
            stage.setScene(scene);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            showAlert(AlertType.ERROR, "خطأ", "تعذر الرجوع إلى صفحة البريد الإلكتروني");
        }
    }

    /**
     * Handle "إعادة إرسال الكود"
     */
    @FXML
    private void onResendClicked(ActionEvent event) {
        showAlert(AlertType.INFORMATION, "تم الإرسال", "تمت إعادة إرسال رمز التحقق إلى بريدك الإلكتروني");
    }

    /**
     * Handle "تأكيد الكود"
     */
    @FXML
    private void onConfirmClicked(ActionEvent event) {
        String otp = otp1.getText() + otp2.getText() + otp3.getText() + otp4.getText() + otp5.getText();

        if (otp.length() == 5) {
            showAlert(AlertType.INFORMATION, "نجاح", "تم تأكيد الكود بنجاح");
            // Move to next page if needed
        } else {
            showAlert(AlertType.ERROR, "خطأ", "يرجى إدخال رمز مكون من 5 أرقام");
        }
    }

    /**
     * Utility for showing alerts
     */
    private void showAlert(AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
