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
                // 🗑️ Drop old users table
//                stmt.execute("DROP TABLE IF EXISTS users;");
//                System.out.println("🗑️  Old 'users' table deleted.");

                // ✅ Recreate the users table
                String usersTable = """
                    CREATE TABLE users (
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
                System.out.println("✅ 'users' table recreated successfully.");

                // 🗑️ Drop old shipments table
//                stmt.execute("DROP TABLE IF EXISTS shipments;");
//                System.out.println("🗑️  Old 'shipments' table deleted.");

                // ✅ Recreate the shipments table (with clientId)
                String shipmentsTable = """
                    CREATE TABLE shipments (
                        shipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        port_name TEXT NOT NULL,
                        num_of_containers INTEGER CHECK (num_of_containers >= 0),
                        type_of_containers TEXT,       -- JSON string for array-like data
                        third_gomroky TEXT,            -- customs office
                        country TEXT,
                        status TEXT,
                        policy TEXT,
                        dragt BOOLEAN DEFAULT 0,
                        clearance_fees REAL DEFAULT 0.00,
                        expenses_and_tips REAL DEFAULT 0.00,
                        sundries REAL DEFAULT 0.00,
                        clientId TEXT,                 -- 🔗 new column linking to users._id
                        FOREIGN KEY (clientId) REFERENCES users(_id)
                    );
                """;
                stmt.execute(shipmentsTable);
                System.out.println("✅ 'shipments' table recreated successfully with new column 'clientId'.");
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
        connect(); // Run once to recreate tables
    }
}
