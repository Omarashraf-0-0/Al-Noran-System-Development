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
import java.util.*;

/**
 * REST-based sync client for syncing users between a remote REST API and local SQLite database.
 * Supports nested structures and MongoDB-style fields like {_id: {$oid: ...}, createdAt: {$date: {...}}}
 */
public class RestMongoSyncClient {

    private static final String REMOTE_USERS_GET_URL = "http://localhost:3500/api/users/getAll";
    private static final String REMOTE_USERS_CREATE_URL = "http://localhost:3500/api/users";

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
            String sql = "SELECT _id, fullname, username, phone, email, password, type, active, taxNumber, rank, clientType, ssn, employeeType, verified, createdAt, updatedAt, version FROM users";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    JSONObject u = new JSONObject();
                    u.put("_id", rs.getString("_id"));
                    u.put("fullname", rs.getString("fullname"));
                    u.put("username", rs.getString("username"));
                    u.put("phone", rs.getString("phone"));
                    u.put("email", rs.getString("email"));
                    u.put("password", rs.getString("password"));
                    u.put("type", rs.getString("type"));
                    u.put("active", rs.getInt("active"));
                    u.put("taxNumber", rs.getString("taxNumber"));
                    u.put("rank", rs.getString("rank"));
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

        // Local-only users to push
        List<JSONObject> toPushRemote = new ArrayList<>();
        for (JSONObject local : localUsersList) {
            String email = local.optString("email", null);
            if (email == null || email.isBlank()) continue;
            if (!remoteByEmail.containsKey(email.toLowerCase())) {
                toPushRemote.add(local);
            }
        }

        System.out.println("Local-only users to push to remote: " + toPushRemote.size());
        for (JSONObject u : toPushRemote) {
            JSONObject payload = new JSONObject();
            payload.put("fullname", u.optString("fullname", ""));
            payload.put("username", u.optString("username", ""));
            payload.put("email", u.optString("email", ""));
            payload.put("phone", u.optString("phone", ""));
            payload.put("password", u.optString("password", ""));
            payload.put("type", u.optString("type", "client"));
            payload.put("taxNumber", u.optString("taxNumber", ""));
            payload.put("rank", u.optString("rank", null));

            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            System.out.println("Pushed user " + payload.optString("email") + " -> response: " + response);
        }

        // Remote-only users to insert locally
        List<JSONObject> toInsertLocal = new ArrayList<>();
        for (Map.Entry<String, JSONObject> entry : remoteByEmail.entrySet()) {
            if (!localByEmail.containsKey(entry.getKey())) {
                toInsertLocal.add(entry.getValue());
            }
        }

        System.out.println("Remote-only users to insert locally: " + toInsertLocal.size());

        // Insert new remote users
        if (!toInsertLocal.isEmpty()) {
            try (Connection sqliteConn = DatabaseConnection.connect()) {
                String insertSQL = "INSERT OR REPLACE INTO users (" +
                        "_id, fullname, username, phone, email, password, type, active, taxNumber, rank, clientType, ssn, employeeType, verified, createdAt, updatedAt, version" +
                        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                PreparedStatement pstmt = sqliteConn.prepareStatement(insertSQL);

                for (JSONObject doc : toInsertLocal) {
                    // _id
                    String id = null;
                    if (doc.has("_id")) {
                        Object idObj = doc.get("_id");
                        if (idObj instanceof JSONObject && ((JSONObject) idObj).has("$oid")) {
                            id = ((JSONObject) idObj).optString("$oid", null);
                        } else {
                            id = doc.optString("_id", null);
                        }
                    }
                    pstmt.setString(1, id);

                    // Basic info
                    pstmt.setString(2, doc.optString("fullname", ""));
                    pstmt.setString(3, doc.optString("username", ""));
                    pstmt.setString(4, doc.optString("phone", ""));
                    pstmt.setString(5, doc.optString("email", ""));
                    pstmt.setString(6, doc.optString("password", ""));
                    pstmt.setString(7, doc.optString("type", "client"));
                    pstmt.setInt(8, doc.optBoolean("active", true) ? 1 : 0);

                    // Tax & rank (sanitize invalid rank values)
                    pstmt.setString(9, doc.optString("taxNumber", ""));
                    String rank = doc.optString("rank", null);
                    if (rank == null || rank.equalsIgnoreCase("null") || rank.isBlank()) {
                        rank = null;
                    } else {
                        rank = rank.toLowerCase(Locale.ROOT);
                        if (!Arrays.asList("low", "med", "high").contains(rank)) {
                            rank = null;
                        }
                    }
                    pstmt.setString(10, rank);

                    // Client details
                    JSONObject clientDetails = doc.optJSONObject("clientDetails");
                    if (clientDetails != null) {
                        pstmt.setString(11, clientDetails.optString("clientType", ""));
                        pstmt.setString(12, clientDetails.optString("ssn", ""));
                    } else {
                        pstmt.setString(11, "");
                        pstmt.setString(12, "");
                    }

                    // Employee details
                    JSONObject employeeDetails = doc.optJSONObject("employeeDetails");
                    if (employeeDetails != null) {
                        pstmt.setString(13, employeeDetails.optString("employeeType", ""));
                        pstmt.setInt(14, employeeDetails.optBoolean("verified", false) ? 1 : 0);
                    } else {
                        pstmt.setString(13, "");
                        pstmt.setInt(14, 0);
                    }

                    // createdAt & updatedAt
                    long createdAt = parseMongoDate(doc.opt("createdAt"));
                    long updatedAt = parseMongoDate(doc.opt("updatedAt"));
                    pstmt.setLong(15, createdAt);
                    pstmt.setLong(16, updatedAt);

                    // version
                    pstmt.setInt(17, parseMongoInt(doc.opt("__v")));

                    pstmt.executeUpdate();
                    System.out.println("✅ Inserted user: " + doc.optString("fullname"));
                }

                System.out.println("✅ Successfully inserted remote users into local SQLite.");
            }
        }

        System.out.println("Sync complete.");
    }

    private static long parseMongoDate(Object obj) {
        long now = System.currentTimeMillis();
        if (obj instanceof JSONObject) {
            JSONObject dateObj = ((JSONObject) obj).optJSONObject("$date");
            if (dateObj != null) {
                return Long.parseLong(dateObj.optString("$numberLong", String.valueOf(now)));
            }
        }
        return now;
    }

    private static int parseMongoInt(Object obj) {
        if (obj instanceof JSONObject) {
            return Integer.parseInt(((JSONObject) obj).optString("$numberInt", "0"));
        } else if (obj instanceof Number) {
            return ((Number) obj).intValue();
        }
        return 0;
    }

    private static JSONArray fetchRemoteUsers() {
        try {
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

            Object parsed = new org.json.JSONTokener(response).nextValue();
            if (parsed instanceof JSONArray) return (JSONArray) parsed;
            if (parsed instanceof JSONObject) {
                JSONObject obj = (JSONObject) parsed;
                if (obj.has("users") && obj.get("users") instanceof JSONArray) {
                    return obj.getJSONArray("users");
                }
                return new JSONArray().put(obj);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new JSONArray();
    }
}
