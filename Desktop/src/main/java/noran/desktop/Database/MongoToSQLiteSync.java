package noran.desktop.Database;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Types;

public class MongoToSQLiteSync {

    public static void main(String[] args) {
        syncUsers();
    }

    public static void syncUsers() {
        MongoDatabase mongoDatabase = MongoConnection.getDatabase();
        MongoCollection<Document> usersCollection = mongoDatabase.getCollection("users");

        try (Connection sqliteConn = DatabaseConnection.connect()) {

            String insertSQL = "INSERT OR REPLACE INTO users (" +
                    "id, fullname, username, phone, email, password, type, active, " +
                    "clientType, ssn, employeeType, verified, createdAt, updatedAt, version" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            PreparedStatement pstmt = sqliteConn.prepareStatement(insertSQL);

            MongoCursor<Document> cursor = usersCollection.find().iterator();
            int count = 0;

            while (cursor.hasNext()) {
                Document doc = cursor.next();

                // Flatten nested fields safely
                Document clientDetails = doc.get("clientDetails", Document.class);
                Document employeeDetails = doc.get("employeeDetails", Document.class);

                pstmt.setString(1, doc.getObjectId("_id").toHexString());
                pstmt.setString(2, doc.getString("fullname"));
                pstmt.setString(3, doc.getString("username"));
                pstmt.setString(4, doc.getString("phone"));
                pstmt.setString(5, doc.getString("email"));
                pstmt.setString(6, doc.getString("password"));
                pstmt.setString(7, doc.getString("type"));
                pstmt.setInt(8, doc.getBoolean("active", true) ? 1 : 0);

                if (clientDetails != null) {
                    pstmt.setString(9, clientDetails.getString("clientType"));
                    pstmt.setString(10, clientDetails.getString("ssn"));
                } else {
                    pstmt.setNull(9, Types.VARCHAR);
                    pstmt.setNull(10, Types.VARCHAR);
                }

                if (employeeDetails != null) {
                    pstmt.setString(11, employeeDetails.getString("employeeType"));
                    pstmt.setInt(12, employeeDetails.getBoolean("verified", false) ? 1 : 0);
                } else {
                    pstmt.setNull(11, Types.VARCHAR);
                    pstmt.setInt(12, 0);
                }

                // createdAt / updatedAt
                long createdAt = getLongFromMongoDate(doc.get("createdAt"));
                long updatedAt = getLongFromMongoDate(doc.get("updatedAt"));

                pstmt.setLong(13, createdAt);
                pstmt.setLong(14, updatedAt);
                pstmt.setInt(15, doc.getInteger("__v", 0));

                pstmt.executeUpdate();
                count++;
            }

            System.out.println("✅ Synced " + count + " users from MongoDB → SQLite");

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            MongoConnection.closeConnection();
        }
    }

    /**
     * Helper to extract numeric timestamps safely from MongoDB $date formats.
     */
    private static long getLongFromMongoDate(Object mongoDate) {
        if (mongoDate == null) return System.currentTimeMillis();

        if (mongoDate instanceof Document) {
            Document dateDoc = (Document) mongoDate;
            Object numberLong = dateDoc.get("$numberLong");
            if (numberLong != null) {
                try {
                    return Long.parseLong(numberLong.toString());
                } catch (NumberFormatException ignored) { }
            }
        } else if (mongoDate instanceof Number) {
            return ((Number) mongoDate).longValue();
        }

        return System.currentTimeMillis();
    }
}
