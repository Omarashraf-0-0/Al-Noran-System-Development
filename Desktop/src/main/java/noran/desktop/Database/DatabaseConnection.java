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

            // ✅ Create table if not exists (added taxNumber and rank)
            String sql = "CREATE TABLE IF NOT EXISTS users ("
                    + "id TEXT PRIMARY KEY, "
                    + "fullname TEXT NOT NULL, "
                    + "username TEXT NOT NULL UNIQUE, "
                    + "phone TEXT, "
                    + "email TEXT NOT NULL UNIQUE, "
                    + "password TEXT NOT NULL, "
                    + "type TEXT CHECK(type IN ('client', 'employee')), "
                    + "active INTEGER DEFAULT 1, "
                    + "clientType TEXT, "
                    + "ssn TEXT, "
                    + "taxNumber TEXT, " // ✅ New column
                    + "employeeType TEXT, "
                    + "verified INTEGER DEFAULT 0, "
                    + "rank TEXT CHECK(rank IN ('low', 'med', 'high') OR rank IS NULL) DEFAULT NULL, " // ✅ New column with enum check
                    + "createdAt INTEGER, "
                    + "updatedAt INTEGER, "
                    + "version INTEGER DEFAULT 0"
                    + ");";

            // ✅ Execute SQL safely
            try (Statement stmt = conn.createStatement()) {
                stmt.execute(sql);
                System.out.println("✅ Successfully created or verified 'users' table structure");
            } catch (SQLException e) {
                e.printStackTrace();
            }

            System.out.println("✅ Database created or opened at: " + dbFile.getAbsolutePath());
        } catch (Exception e) {
            System.out.println("❌ Database connection failed: " + e.getMessage());
        }
        return conn;
    }

    public static void main(String[] args) {
        connect(); // Run once to create the file and table
    }
}
