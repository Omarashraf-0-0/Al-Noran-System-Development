package noran.desktop.Database;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class MongoConnection {

    private static final String CONNECTION_STRING =
            "mongodb+srv://al-noran:al-noran@cluster0.kap4tle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    private static final String DATABASE_NAME = "Al_noran_System";

    private static MongoClient client;
    private static MongoDatabase database;

    /**
     * Returns a singleton MongoDatabase instance.
     */
    public static MongoDatabase getDatabase() {
        if (client == null) {
            client = MongoClients.create(CONNECTION_STRING);
            database = client.getDatabase(DATABASE_NAME);
        }
        return database;
    }

    /**
     * Creates a new user document in the "users" collection.
     *
     * @param email    The user's email address
     * @param password The user's password (in a real app, hash this before saving)
     */
    public static void createUser(String email, String password) {
        MongoDatabase db = getDatabase();
        MongoCollection<Document> usersCollection = db.getCollection("users");

        Document newUser = new Document("email", email)
                .append("password", password)
                .append("createdAt", System.currentTimeMillis());

        usersCollection.insertOne(newUser);
        System.out.println("✅ User created successfully with email: " + email);
    }

    /**
     * Closes the MongoDB client connection.
     */
    public static void closeConnection() {
        if (client != null) {
            client.close();
            client = null;
            database = null;
            System.out.println("🔒 MongoDB connection closed.");
        }
    }

    // For quick manual testing
    public static void main(String[] args) {
        createUser("testuser@example.com", "password123");
        closeConnection();
    }
}
