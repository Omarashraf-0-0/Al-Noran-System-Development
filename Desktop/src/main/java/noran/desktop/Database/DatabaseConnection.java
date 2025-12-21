package noran.desktop.Database;

import java.io.File;
import java.sql.*;

public class DatabaseConnection {

    private static final String DB_PATH = "src/main/java/noran/desktop/Database/database.db";

    public static Connection connect() {
        Connection conn = null;
        try {
            File dbFile = new File(DB_PATH);
            if (!dbFile.exists()) {
                dbFile.getParentFile().mkdirs();
            }

            String url = "jdbc:sqlite:" + DB_PATH;
            conn = DriverManager.getConnection(url);

            try (Statement stmt = conn.createStatement()) {
                // 1. Users Table
                String usersTable = """
                    CREATE TABLE IF NOT EXISTS users (
                        _id TEXT PRIMARY KEY,
                        fullname TEXT,
                        username TEXT,
                        phone TEXT,
                        email TEXT,
                        password TEXT,
                        type TEXT,
                        active BOOLEAN DEFAULT 1,
                        taxNumber TEXT,
                        rank TEXT,
                        clientType TEXT,
                        ssn TEXT,
                        employeeType TEXT,
                        verified BOOLEAN DEFAULT 0,
                        createdAt TEXT,
                        updatedAt TEXT,
                        version INTEGER DEFAULT 0
                    );
                """;
                stmt.execute(usersTable);

                // 2. 🛑 FIX: REMOVED "DROP TABLE" FROM HERE.
                // Only create if it doesn't exist. SyncClient will handle the reset.
                String shipmentsTable = """
                    CREATE TABLE IF NOT EXISTS shipments (
                        _id TEXT PRIMARY KEY,
                        acid TEXT,
                        port_name TEXT,
                        country TEXT,
                        num_of_containers INTEGER,
                        status TEXT,
                        policy TEXT,
                        dragt BOOLEAN DEFAULT 0,
                        clearance_fees REAL DEFAULT 0.00,
                        expenses_and_tips REAL DEFAULT 0.00,
                        sundries REAL DEFAULT 0.00,
                        importerName TEXT,
                        number46 TEXT,
                        employerName TEXT,
                        shipmentDescription TEXT,
                        arrivalDate TEXT,
                        invoiceUrl TEXT,
                        employee_id TEXT,
                        clientId TEXT
                    );
                """;
                stmt.execute(shipmentsTable);

                // 3. Shipment Fees Table
                String shipmentFeesTable = """
                    CREATE TABLE IF NOT EXISTS shipment_fees (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        shipmentId TEXT, 
                        feeName TEXT,
                        feePrice REAL,
                        invoiceStatus TEXT DEFAULT 'pending'
                    );
                """;
                stmt.execute(shipmentFeesTable);
            }

        } catch (SQLException e) {
            System.err.println("❌ SQL Error: " + e.getMessage());
            e.printStackTrace();
        }
        return conn;
    }
}