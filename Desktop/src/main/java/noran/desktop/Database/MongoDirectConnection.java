package noran.desktop.Database;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import io.github.cdimascio.dotenv.Dotenv;

public class MongoDirectConnection {

    // Try to find .env from multiple possible locations
    private static final Dotenv dotenv = loadDotenv();

    private static Dotenv loadDotenv() {
        // Try relative paths first, then fall back to environment variable
        String[] possiblePaths = {
                "./config",
                "../Web/backend",
                "../../Web/backend",
                System.getenv("NORAN_ENV_PATH")
        };

        for (String path : possiblePaths) {
            if (path == null)
                continue;
            try {
                Dotenv env = Dotenv.configure()
                        .directory(path)
                        .ignoreIfMissing()
                        .load();
                if (env.get("DATABASE_URI") != null) {
                    return env;
                }
            } catch (Exception ignored) {
            }
        }

        // Fallback: try loading from classpath or current directory
        return Dotenv.configure().ignoreIfMissing().load();
    }

    // Read the connection string from .env file
    private static final String CONNECTION_STRING = dotenv.get("DATABASE_URI");
    private static final String DATABASE_NAME = "Al_noran_System";

    private static MongoClient client;

    public static synchronized MongoDatabase connect() {
        if (CONNECTION_STRING == null || CONNECTION_STRING.isEmpty()) {
            return null;
        }

        try {
            // Reuse existing client if available
            if (client == null) {
                client = MongoClients.create(CONNECTION_STRING);
            }
            MongoDatabase db = client.getDatabase(DATABASE_NAME);
            db.listCollectionNames().first(); // Test connection
            return db;
        } catch (Exception e) {
            return null;
        }
    }

    public static void close() {
        if (client != null) {
            client.close();
            client = null;
        }
    }
}
