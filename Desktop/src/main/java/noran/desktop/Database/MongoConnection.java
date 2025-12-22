package noran.desktop.Database;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import io.github.cdimascio.dotenv.Dotenv;

public class MongoConnection {

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

    private static final String CONNECTION_STRING = dotenv.get("DATABASE_URI");
    private static final String DATABASE_NAME = "Al_noran_System";

    private static MongoClient client;
    private static MongoDatabase database;

    public static synchronized MongoDatabase getDatabase() {
        if (client == null) {
            if (CONNECTION_STRING == null || CONNECTION_STRING.isEmpty()) {
                return null;
            }

            try {
                client = MongoClients.create(CONNECTION_STRING);
                database = client.getDatabase(DATABASE_NAME);
            } catch (Exception e) {
                return null;
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