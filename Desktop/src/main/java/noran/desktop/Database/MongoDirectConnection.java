package noran.desktop.Database;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

public class MongoDirectConnection {

    private static final String CONNECTION_STRING =
            "mongodb+srv://al-noran:al-noran@cluster0.kap4tle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    private static final String DATABASE_NAME = "Al_noran_System";

    private static MongoClient client;

    public static MongoDatabase connect() {
        try {
            client = MongoClients.create(CONNECTION_STRING);
            MongoDatabase db = client.getDatabase(DATABASE_NAME);
            db.listCollectionNames().first();
            System.out.println("✅ MongoDB connected");
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
