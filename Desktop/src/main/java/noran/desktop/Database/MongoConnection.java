package noran.desktop.Database;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import io.github.cdimascio.dotenv.Dotenv;

import java.io.File;

public class MongoConnection {

    // 1. Point to the specific folder containing your .env file
    // Note: We use double backslashes for Windows paths
    private static final String ENV_PATH = "C:\\Users\\fcbmo\\IdeaProjects\\Al-Noran-System-Development\\Web\\backend";

    private static final Dotenv dotenv = Dotenv.configure()
            .directory(ENV_PATH) // 👈 Specify the folder here
            .ignoreIfMissing()
            .load();

    // 2. Read the variable name exactly as it is in your .env file
    private static final String CONNECTION_STRING = dotenv.get("DATABASE_URI");

    // Since the DB name isn't a separate variable in your .env, we can keep it here or extract it
    private static final String DATABASE_NAME = "Al_noran_System";

    private static MongoClient client;
    private static MongoDatabase database;

    public static MongoDatabase getDatabase() {
        if (client == null) {
            if (CONNECTION_STRING == null || CONNECTION_STRING.isEmpty()) {
                System.err.println("❌ Error: DATABASE_URI not found! Checked path: " + ENV_PATH);
                return null;
            }

            try {
                client = MongoClients.create(CONNECTION_STRING);
                database = client.getDatabase(DATABASE_NAME);
                System.out.println("✅ Connected to MongoDB successfully using secure .env");
            } catch (Exception e) {
                System.err.println("❌ Connection failed: " + e.getMessage());
            }
        }
        return database;
    }

    public static void closeConnection() {
        if (client != null) {
            client.close();
            client = null;
            database = null;
        }
    }
}