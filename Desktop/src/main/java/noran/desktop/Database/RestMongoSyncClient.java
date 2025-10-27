package noran.desktop.Database;

import noran.desktop.Services.APIService;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;

/**
 * Simple REST-based sync client.
 *
 * Behavior:
 * - Fetches users from remote REST endpoint (assumed JSON array of user objects).
 * - Reads local users from SQLite and compares by email (recommended unique key).
 * - Pushes local-only users to remote via POST (one-by-one or bulk depending on backend).
 * - Inserts remote-only users into SQLite database.
 *
 * NOTE: Configure the remote endpoints below to match your backend API.
 */
public class RestMongoSyncClient {

    // Configure these to match your server API
    private static final String REMOTE_USERS_GET_URL = "http://localhost:3500/api/users/getAll"; // should return JSON array or { users: [...] }
    private static final String REMOTE_USERS_CREATE_URL = "http://localhost:3500/api/users"; // POST a single user JSON or adjust for bulk

    /**
     * Entry for manual runs.
     */
    public static void main(String[] args) {
        try {
            syncUsersWithRemote();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            MongoConnection.closeConnection();
        }
    }

    public static void syncUsersWithRemote() throws Exception {
        System.out.println("Starting sync with remote: fetching remote users...");

        JSONArray remoteUsers = fetchRemoteUsers();
        Map<String, JSONObject> remoteByEmail = new HashMap<>();
        if (remoteUsers != null) {
            for (int i = 0; i < remoteUsers.length(); i++) {
                JSONObject u = remoteUsers.getJSONObject(i);
                String email = u.optString("email", null);
                if (email != null && !email.isBlank()) remoteByEmail.put(email.toLowerCase(), u);
            }
        }

        // Read local users
        Map<String, JSONObject> localByEmail = new HashMap<>();
        List<JSONObject> localUsersList = new ArrayList<>();

        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "SELECT id, fullname, username, phone, email, password, type, active, clientType, ssn, employeeType, verified, createdAt, updatedAt, version FROM users";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    JSONObject u = new JSONObject();
                    u.put("id", rs.getString("id"));
                    u.put("fullname", rs.getString("fullname"));
                    u.put("username", rs.getString("username"));
                    u.put("phone", rs.getString("phone"));
                    u.put("email", rs.getString("email"));
                    u.put("password", rs.getString("password"));
                    u.put("type", rs.getString("type"));
                    u.put("active", rs.getInt("active"));
                    u.put("clientType", rs.getString("clientType"));
                    u.put("ssn", rs.getString("ssn"));
                    u.put("employeeType", rs.getString("employeeType"));
                    u.put("verified", rs.getInt("verified"));
                    u.put("createdAt", rs.getLong("createdAt"));
                    u.put("updatedAt", rs.getLong("updatedAt"));
                    u.put("version", rs.getInt("version"));

                    String email = rs.getString("email");
                    if (email != null && !email.isBlank()) {
                        localByEmail.put(email.toLowerCase(), u);
                    }
                    localUsersList.add(u);
                }
            }
        }

        // Determine local-only (present locally but not at remote)
        List<JSONObject> toPushRemote = new ArrayList<>();
        for (JSONObject local : localUsersList) {
            String email = local.optString("email", null);
            if (email == null || email.isBlank()) continue;
            if (!remoteByEmail.containsKey(email.toLowerCase())) {
                toPushRemote.add(local);
            }
        }

        System.out.println("Local-only users to push to remote: " + toPushRemote.size());
        // Push one-by-one (adjust if backend supports bulk)
        for (JSONObject u : toPushRemote) {
            // Build minimal payload expected by backend. Adjust fields as necessary.
            JSONObject payload = new JSONObject();
            payload.put("fullname", u.optString("fullname", ""));
            payload.put("username", u.optString("username", ""));
            payload.put("email", u.optString("email", ""));
            payload.put("phone", u.optString("phone", ""));
            payload.put("password", u.optString("password", ""));
            payload.put("type", u.optString("type", "client"));

            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            System.out.println("Pushed user " + payload.optString("email") + " -> response: " + response);
        }

        // Determine remote-only (present remotely but not locally)
        List<JSONObject> toInsertLocal = new ArrayList<>();
        for (Map.Entry<String, JSONObject> entry : remoteByEmail.entrySet()) {
            String email = entry.getKey();
            if (!localByEmail.containsKey(email)) {
                toInsertLocal.add(entry.getValue());
            }
        }

        System.out.println("Remote-only users to insert locally: " + toInsertLocal.size());

        // Insert remote-only into local SQLite
        if (!toInsertLocal.isEmpty()) {
            try (Connection sqliteConn = DatabaseConnection.connect()) {
                String insertSQL = "INSERT OR REPLACE INTO users (" +
                        "id, fullname, username, phone, email, password, type, active, " +
                        "clientType, ssn, employeeType, verified, createdAt, updatedAt, version" +
                        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                PreparedStatement pstmt = sqliteConn.prepareStatement(insertSQL);

                int count = 0;
                for (JSONObject doc : toInsertLocal) {
                    // Attempt to map fields safely
                    String id = doc.optString("_id", doc.optString("id", ""));
                    pstmt.setString(1, id);
                    pstmt.setString(2, doc.optString("fullname", doc.optString("name", null)));
                    pstmt.setString(3, doc.optString("username", null));
                    pstmt.setString(4, doc.optString("phone", null));
                    pstmt.setString(5, doc.optString("email", null));
                    pstmt.setString(6, doc.optString("password", null));
                    pstmt.setString(7, doc.optString("type", null));
                    pstmt.setInt(8, doc.optBoolean("active", true) ? 1 : 0);

                    // clientDetails
                    JSONObject clientDetails = doc.optJSONObject("clientDetails");
                    if (clientDetails != null) {
                        pstmt.setString(9, clientDetails.optString("clientType", null));
                        pstmt.setString(10, clientDetails.optString("ssn", null));
                    } else {
                        pstmt.setNull(9, java.sql.Types.VARCHAR);
                        pstmt.setNull(10, java.sql.Types.VARCHAR);
                    }

                    // employeeDetails
                    JSONObject employeeDetails = doc.optJSONObject("employeeDetails");
                    if (employeeDetails != null) {
                        pstmt.setString(11, employeeDetails.optString("employeeType", null));
                        pstmt.setInt(12, employeeDetails.optBoolean("verified", false) ? 1 : 0);
                    } else {
                        pstmt.setNull(11, java.sql.Types.VARCHAR);
                        pstmt.setInt(12, 0);
                    }

                    pstmt.setLong(13, doc.optLong("createdAt", System.currentTimeMillis()));
                    pstmt.setLong(14, doc.optLong("updatedAt", System.currentTimeMillis()));
                    pstmt.setInt(15, doc.optInt("__v", 0));

                    pstmt.executeUpdate();
                    count++;
                }

                System.out.println("✅ Inserted " + count + " remote users into local SQLite.");
            }
        }

        System.out.println("Sync complete.");
    }

    private static JSONArray fetchRemoteUsers() {
        try {
            // Basic GET using HttpURLConnection (APIService currently only has POST helper)
            URL url = new URL(REMOTE_USERS_GET_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");

            int status = conn.getResponseCode();
            BufferedReader br = new BufferedReader(new InputStreamReader(
                    status >= 200 && status < 300 ? conn.getInputStream() : conn.getErrorStream(), StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);

            String response = sb.toString();
            if (response.isBlank()) return new JSONArray();

            // REST APIs sometimes wrap array into { users: [...] }
            try {
                Object parsed = new org.json.JSONTokener(response).nextValue();
                if (parsed instanceof JSONArray) return (JSONArray) parsed;
                if (parsed instanceof JSONObject) {
                    JSONObject obj = (JSONObject) parsed;
                    if (obj.has("users") && obj.get("users") instanceof JSONArray) {
                        return obj.getJSONArray("users");
                    }
                    // If response is a single object, wrap it
                    return new JSONArray().put(obj);
                }
            } catch (Exception ex) {
                ex.printStackTrace();
                return new JSONArray();
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return new JSONArray();
    }
}
