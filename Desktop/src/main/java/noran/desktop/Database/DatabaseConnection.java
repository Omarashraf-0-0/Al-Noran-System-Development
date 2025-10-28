package noran.desktop.Database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.io.File;
import java.sql.Statement;

public class DatabaseConnection {

    private static final String DB_PATH = "src/main/java/noran/desktop/Database/database.db";

    public static Connection connect() {
        Connection conn = null;
        try {
            // ✅ Ensure folder exists
            File dbFile = new File(DB_PATH);
            dbFile.getParentFile().mkdirs();

            // ✅ Create or open database
            String url = "jdbc:sqlite:" + DB_PATH;
            conn = DriverManager.getConnection(url);

            try (Statement stmt = conn.createStatement()) {
                // ✅ Recreate the users table
                String usersTable = """
                    CREATE TABLE IF NOT EXISTS users (
                        _id TEXT PRIMARY KEY,
                        fullname TEXT,
                        username TEXT UNIQUE,
                        phone TEXT,
                        email TEXT UNIQUE,
                        password TEXT,
                        type TEXT CHECK(type IN ('client', 'employee')),
                        active BOOLEAN DEFAULT 1,
                        taxNumber TEXT,
                        rank TEXT CHECK(rank IN ('low', 'med', 'high') OR rank IS NULL) DEFAULT NULL,
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
                System.out.println("✅ 'users' table ready.");

                // ✅ Recreate the shipments table (with clientId)
                String shipmentsTable = """
                    CREATE TABLE IF NOT EXISTS shipments (
                        shipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        port_name TEXT NOT NULL,
                        num_of_containers INTEGER CHECK (num_of_containers >= 0),
                        type_of_containers TEXT,
                        third_gomroky TEXT,
                        country TEXT,
                        status TEXT,
                        policy TEXT,
                        dragt BOOLEAN DEFAULT 0,
                        clearance_fees REAL DEFAULT 0.00,
                        expenses_and_tips REAL DEFAULT 0.00,
                        sundries REAL DEFAULT 0.00,
                        clientId TEXT,
                        FOREIGN KEY (clientId) REFERENCES users(_id)
                    );
                """;
                stmt.execute(shipmentsTable);
                System.out.println("✅ 'shipments' table ready with 'clientId'.");
            }

            // ✅ Insert two shipments for clientId = 69000ca02bbdd9014e8996eb
            try (Statement stmt = conn.createStatement()) {
                String insertShipments = """
                    INSERT INTO shipments (
                        port_name,
                        num_of_containers,
                        type_of_containers,
                        third_gomroky,
                        country,
                        status,
                        policy,
                        dragt,
                        clearance_fees,
                        expenses_and_tips,
                        sundries,
                        clientId
                    ) VALUES
                    (
                        'Damietta Port',
                        10,
                        '["20ft"]',
                        'Alex Customs',
                        'Egypt',
                        'Pending',
                        'Policy-56789',
                        0,
                        250.00,
                        100.00,
                        50.00,
                        '69000ca02bbdd9014e8996eb'
                    ),
                    (
                        'Port Said',
                        15,
                        '["40ft HC", "20ft"]',
                        'Suez Customs',
                        'Egypt',
                        'Delivered',
                        'Policy-98765',
                        1,
                        600.00,
                        300.00,
                        120.00,
                        '69000ca02bbdd9014e8996eb'
                    );
                """;
                stmt.execute(insertShipments);
                System.out.println("✅ Two shipments inserted successfully for clientId 69000ca02bbdd9014e8996eb.");
            } catch (SQLException e) {
                System.err.println("❌ Insert failed: " + e.getMessage());
            }

            System.out.println("✅ Database ready at: " + new File(DB_PATH).getAbsolutePath());

        } catch (SQLException e) {
            System.err.println("❌ SQL Error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Database connection failed: " + e.getMessage());
        }

        return conn;
    }

    public static void main(String[] args) {
        connect(); // Run once to recreate tables and insert data
    }
}
