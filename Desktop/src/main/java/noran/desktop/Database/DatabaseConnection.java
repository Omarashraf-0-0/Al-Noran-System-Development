package noran.desktop.Database;

import java.io.File;
import java.sql.*;

public class DatabaseConnection {

    private static final String DB_PATH = "src/main/java/noran/desktop/Database/database.db";

    public static Connection connect() {
        Connection conn = null;
        try {
            // Ensure folder exists
            File dbFile = new File(DB_PATH);
            dbFile.getParentFile().mkdirs();

            String url = "jdbc:sqlite:" + DB_PATH;
            conn = DriverManager.getConnection(url);

            try (Statement stmt = conn.createStatement()) {

                // Create users table
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

                // Create shipments table (base schema)
                String shipmentsTable = """
                    CREATE TABLE IF NOT EXISTS shipments (
                        shipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        port_name TEXT NOT NULL,
                        num_of_containers INTEGER CHECK (num_of_containers >= 0),
                        type_of_containers_json TEXT,
                        third_gomroky_json TEXT,
                        country TEXT,
                        status TEXT,
                        policy TEXT,
                        dragt BOOLEAN DEFAULT 0,
                        clearance_fees REAL DEFAULT 0.00,
                        expenses_and_tips REAL DEFAULT 0.00,
                        sundries REAL DEFAULT 0.00,
                        acid TEXT,
                        importerName TEXT,
                        number46 TEXT,
                        employerName TEXT,
                        shipmentDescription TEXT,
                        arrivalDate TEXT,
                        invoiceUrl TEXT,
                        createdAt TEXT,
                        updatedAt TEXT,
                        employee_id TEXT,
                        requiredDocuments TEXT,
                        clientId TEXT,
                        FOREIGN KEY (clientId) REFERENCES users(_id)
                    );
                """;
                stmt.execute(shipmentsTable);
                System.out.println("✅ 'shipments' table ensured (created if missing).");

                // Create shipment_fees table (base)
                String shipmentFeesTable = """
                    CREATE TABLE IF NOT EXISTS shipment_fees (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        invoiceNumber TEXT,
                        unsupportedItemName TEXT,
                        unsupportedItemPrice REAL,
                        shipmentId INTEGER,
                        feeName TEXT,
                        feePrice REAL,
                        createdAt TEXT,
                        Port_fee_price REAL DEFAULT 0,
                        Additional_Services_price REAL DEFAULT 0,
                        Clearance_Fees_price REAL DEFAULT 0,
                        Expense_Tips_price REAL DEFAULT 0,
                        Sundries_price REAL DEFAULT 0
                    );
                """;
                stmt.execute(shipmentFeesTable);
                System.out.println("✅ 'shipment_fees' table ensured (created if missing).");
            }

            // Schema migrations: add missing columns if the table exists but lacks them
            ensureColumnExists(conn, "shipments", "type_of_containers_json", "TEXT");
            ensureColumnExists(conn, "shipments", "third_gomroky_json", "TEXT");
            ensureColumnExists(conn, "shipments", "clientId", "TEXT");
            ensureColumnExists(conn, "shipments", "dragt", "BOOLEAN DEFAULT 0");
            ensureColumnExists(conn, "shipments", "clearance_fees", "REAL DEFAULT 0.00");
            ensureColumnExists(conn, "shipments", "expenses_and_tips", "REAL DEFAULT 0.00");
            ensureColumnExists(conn, "shipments", "sundries", "REAL DEFAULT 0.00");

            ensureColumnExists(conn, "shipment_fees", "invoiceStatus", "TEXT CHECK (invoiceStatus IN ('pending','accepted','rejected')) DEFAULT 'pending'");

            System.out.println("✅ Schema migration checks complete.");
            System.out.println("✅ Database ready at: " + new File(DB_PATH).getAbsolutePath());

        } catch (SQLException e) {
            System.err.println("❌ SQL Error: " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("❌ Database connection failed: " + e.getMessage());
            e.printStackTrace();
        }

        return conn;
    }

    /**
     * Adds the specified column to the table if it's missing.
     * columnDef should be the column type and optional default/check fragment.
     */
    private static void ensureColumnExists(Connection conn, String tableName, String columnName, String columnDef) {
        try {
            boolean hasColumn = false;
            try (PreparedStatement ps = conn.prepareStatement("PRAGMA table_info('" + tableName + "')");
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String col = rs.getString("name");
                    if (columnName.equalsIgnoreCase(col)) {
                        hasColumn = true;
                        break;
                    }
                }
            }

            if (!hasColumn) {
                String sql = "ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDef + ";";
                try (Statement alter = conn.createStatement()) {
                    alter.execute(sql);
                    System.out.println("🔧 Added missing column '" + columnName + "' to table '" + tableName + "'.");
                }
            } else {
                System.out.println("ℹ Column '" + columnName + "' already exists in '" + tableName + "'.");
            }
        } catch (SQLException e) {
            System.err.println("❌ Failed to ensure column '" + columnName + "' in table '" + tableName + "': " + e.getMessage());
            // continue without rethrowing
        }
    }

    // Run as a standalone migration helper if desired
    public static void main(String[] args) {
        connect();
    }
}
