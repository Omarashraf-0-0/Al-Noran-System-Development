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
                // ⚠️ Drop the users table if it exists
                stmt.execute("DROP TABLE IF EXISTS users;");
                System.out.println("🗑️  Old 'users' table deleted.");

                // ✅ Recreate the users table from scratch
                String sql = """
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

                stmt.execute(sql);
                System.out.println("✅ 'users' table recreated successfully.");
            }

            System.out.println("✅ Database ready at: " + dbFile.getAbsolutePath());

        } catch (SQLException e) {
            System.err.println("❌ SQL Error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Database connection failed: " + e.getMessage());
        }

        return conn;
    }

    public static void main(String[] args) {
        connect(); // Run once to recreate table
    }
}
