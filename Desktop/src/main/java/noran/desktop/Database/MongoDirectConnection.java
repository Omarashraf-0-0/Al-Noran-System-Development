package noran.desktop.Database;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import io.github.cdimascio.dotenv.Dotenv;

public class MongoDirectConnection {

    // Point to the specific folder containing your .env file
    private static final String ENV_PATH = "C:\\Users\\fcbmo\\IdeaProjects\\Al-Noran-System-Development\\Web\\backend";

    private static final Dotenv dotenv = Dotenv.configure()
            .directory(ENV_PATH)
            .ignoreIfMissing()
            .load();

    // Read the connection string from .env file
    private static final String CONNECTION_STRING = dotenv.get("DATABASE_URI");
    private static final String DATABASE_NAME = "Al_noran_System";

    private static MongoClient client;

    public static MongoDatabase connect() {
        if (CONNECTION_STRING == null || CONNECTION_STRING.isEmpty()) {
            System.err.println("❌ Error: DATABASE_URI not found! Checked path: " + ENV_PATH);
            return null;
        }

        try {
            client = MongoClients.create(CONNECTION_STRING);
            MongoDatabase db = client.getDatabase(DATABASE_NAME);
            db.listCollectionNames().first();
            System.out.println("✅ MongoDB connected using secure .env");
            return db;
        } catch (Exception e) {
            System.err.println("❌ MongoDB connection failed: " + e.getMessage());
            return null;
        }
    }

    public static void close() {
        if (client != null) {
            client.close();
            System.out.println("🔒 MongoDB closed");
        }
    }
}
