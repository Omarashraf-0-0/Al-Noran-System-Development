package noran.desktop.Database;

import noran.desktop.Services.APIService;
import noran.desktop.models.Client;
import noran.desktop.models.Employee;
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
 */
public class RestMongoSyncClient {
    private static final String REMOTE_USERS_BASE_URL = "http://localhost:3500/api/users/";
    private static final String REMOTE_USERS_GET_URL = "http://localhost:3500/api/users/getAll";
    private static final String REMOTE_USERS_CREATE_URL = "http://localhost:3500/api/users/getAll";

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

        // Local-only users to push to remote
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

            // Skip users with missing email (email is required)
            String email = u.optString("email", "").trim();
            if (email.isBlank()) {
                System.out.println("⚠ Skipping user with missing email: " + u.optString("fullname", ""));
                continue;
            }

            JSONObject payload = new JSONObject();

            // Fullname
            String fullname = u.optString("fullname", "").trim();
            if (fullname.isBlank()) fullname = "Unknown";
            payload.put("fullname", fullname);

            // Username
            String username = u.optString("username", "").trim();
            if (username.isBlank()) username = email.split("@")[0]; // use part of email
            payload.put("username", username);

            payload.put("email", email);

            // Phone
            String phone = u.optString("phone", "").trim();
            if (phone.isBlank()) phone = "01000000000";
            payload.put("phone", phone);

            // Password
            String password = u.optString("password", "").trim();
            if (password.isBlank()) password = "123456";
            payload.put("password", password);

            // Type
            String type = u.optString("type", "client").trim().toLowerCase();
            if (!type.equals("client") && !type.equals("employee")) type = "client";
            payload.put("type", type);

            if (type.equals("client")) {
                // ClientType
                String clientType = u.optString("clientType", "personal").trim();
                if (!clientType.equalsIgnoreCase("personal") && !clientType.equalsIgnoreCase("business")) {
                    clientType = "personal";
                }
                payload.put("clientType", clientType);

                // SSN for personal clients
                if (clientType.equalsIgnoreCase("personal")) {
                    String ssn = u.optString("ssn", "").trim();
                    if (ssn.isBlank()) ssn = "0000000000000";
                    payload.put("ssn", ssn);
                }

                // TaxNumber for business clients
                if (clientType.equalsIgnoreCase("business")) {
                    String tax = u.optString("taxNumber", "").trim();
                    if (tax.isBlank()) tax = "000000000";
                    payload.put("taxNumber", tax);
                } else {
                    payload.put("taxNumber", u.optString("taxNumber", "").trim());
                }
            }

            if (type.equals("employee")) {
                String empType = u.optString("employeeType", "").trim();
                if (empType.isBlank()) empType = "staff";
                payload.put("employeeType", empType);
            }

            System.out.println("\n--- SENDING PAYLOAD ---\n" + payload.toString(2));

            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            System.out.println("Pushed user " + payload.optString("email") + " -> response: " + response);

            // Handle duplicate
            if (response.contains("already exists")) {
                System.out.println("⚠ Duplicate detected. Deleting local user: " + payload.optString("email"));
                try (Connection conn = DatabaseConnection.connect()) {
                    String deleteSql = "DELETE FROM users WHERE email = ?";
                    PreparedStatement ps = conn.prepareStatement(deleteSql);
                    ps.setString(1, payload.optString("email"));
                    ps.executeUpdate();
                }
            }
        }


        // Remote-only users to insert locally
        List<JSONObject> toInsertLocal = new ArrayList<>();
        for (Map.Entry<String, JSONObject> entry : remoteByEmail.entrySet()) {
            if (!localByEmail.containsKey(entry.getKey())) {
                toInsertLocal.add(entry.getValue());
            }
        }

        System.out.println("Remote-only users to insert locally: " + toInsertLocal.size());

        // Insert new remote users into SQLite
        if (!toInsertLocal.isEmpty()) {
            try (Connection sqliteConn = DatabaseConnection.connect()) {
                String insertSQL = "INSERT OR REPLACE INTO users (" +
                        "_id, fullname, username, phone, email, password, type, active, taxNumber, rank, clientType, ssn, employeeType, verified, createdAt, updatedAt, version" +
                        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                PreparedStatement pstmt = sqliteConn.prepareStatement(insertSQL);

                for (JSONObject doc : toInsertLocal) {

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
                    pstmt.setString(2, doc.optString("fullname", ""));
                    pstmt.setString(3, doc.optString("username", ""));
                    pstmt.setString(4, doc.optString("phone", ""));
                    pstmt.setString(5, doc.optString("email", ""));
                    pstmt.setString(6, doc.optString("password", ""));
                    pstmt.setString(7, doc.optString("type", "client"));
                    pstmt.setInt(8, doc.optBoolean("active", true) ? 1 : 0);

                    pstmt.setString(9, doc.optString("taxNumber", ""));
                    String rank = doc.optString("rank", null);
                    if (rank == null || rank.equalsIgnoreCase("null") || rank.isBlank()) {
                        rank = null;
                    } else {
                        rank = rank.toLowerCase(Locale.ROOT);
                        if (!Arrays.asList("low", "med", "high").contains(rank)) rank = null;
                    }
                    pstmt.setString(10, rank);

                    JSONObject clientDetails = doc.optJSONObject("clientDetails");
                    if (clientDetails != null) {
                        pstmt.setString(11, clientDetails.optString("clientType", ""));
                        pstmt.setString(12, clientDetails.optString("ssn", ""));
                    } else {
                        pstmt.setString(11, "");
                        pstmt.setString(12, "");
                    }

                    JSONObject employeeDetails = doc.optJSONObject("employeeDetails");
                    if (employeeDetails != null) {
                        pstmt.setString(13, employeeDetails.optString("employeeType", ""));
                        pstmt.setInt(14, employeeDetails.optBoolean("verified", false) ? 1 : 0);
                    } else {
                        pstmt.setString(13, "");
                        pstmt.setInt(14, 0);
                    }

                    long createdAt = parseMongoDate(doc.opt("createdAt"));
                    long updatedAt = parseMongoDate(doc.opt("updatedAt"));
                    pstmt.setLong(15, createdAt);
                    pstmt.setLong(16, updatedAt);
                    pstmt.setInt(17, parseMongoInt(doc.opt("__v")));

                    pstmt.executeUpdate();
                    System.out.println("✅ Inserted user: " + doc.optString("fullname"));
                }

                System.out.println("✔ Successfully inserted remote users into local SQLite.");
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
    public static String addClientRemotely(Client client) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("fullname", client.getFullname().isBlank() ? "No Name" : client.getFullname());
            payload.put("username", client.getEmail().isBlank() ? "user" + System.currentTimeMillis()
                    : client.getEmail().split("@")[0]);
            payload.put("email", client.getEmail().isBlank() ? "user" + System.currentTimeMillis() + "@example.com"
                    : client.getEmail());
            payload.put("phone", client.getPhone().isBlank() ? "01000000000" : client.getPhone());
            payload.put("password", client.getPassword().isBlank() ? "123456" : client.getPassword());
            payload.put("type", "client");
            payload.put("clientType", client.getClientType().isBlank() ? "personal" : client.getClientType());
            payload.put("ssn", client.getSsn().isBlank() ? "0000000000000" : client.getSsn());

            System.out.println("Sending payload to server:\n" + payload.toString(2));

            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            JSONObject respJson = new JSONObject(response);

            // Extract ID from "user.id"
            if (respJson.has("user") && respJson.getJSONObject("user").has("id")) {
                return respJson.getJSONObject("user").getString("id");
            }

            System.out.println("Server response did not contain user.id: " + response);

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }


    public static boolean updateClientRemotely(Client client) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("_id", client.getId());
            payload.put("fullname", client.getFullname());
            payload.put("username", client.getEmail().split("@")[0]);
            payload.put("email", client.getEmail());
            payload.put("phone", client.getPhone());
            payload.put("password", client.getPassword());
            payload.put("type", "client");
            payload.put("clientType", client.getClientType());
            payload.put("ssn", client.getSsn());

            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());

            JSONObject respJson = new JSONObject(response);
            return !respJson.has("error"); // Return true if no error
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean deleteClientRemotely(String clientId) {
        if (clientId == null || clientId.isBlank()) return false;

        try {
            String deleteUrl = "http://localhost:3500/api/users/" + clientId;
            String response = APIService.delete(deleteUrl); // uses DELETE method
            System.out.println("Remote delete response: " + response);

            // Optional: check response message
            JSONObject respJson = new JSONObject(response);
            return respJson.has("message") && respJson.getString("message").toLowerCase().contains("deleted");

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ---------------------------------------------------
    // EMPLOYEE SPECIFIC REMOTE METHODS
    // ---------------------------------------------------

    public static String addEmployeeRemotely(Employee emp) {
        try {
            JSONObject payload = new JSONObject();

            // Basic User Data
            payload.put("fullname", emp.getFullname().isBlank() ? "No Name" : emp.getFullname());
            String generatedUsername = emp.getEmail().contains("@") ? emp.getEmail().split("@")[0] : emp.getEmail();
            payload.put("username", generatedUsername);
            payload.put("email", emp.getEmail());
            payload.put("phone", emp.getPhone().isBlank() ? "01000000000" : emp.getPhone());
            payload.put("password", emp.getPassword().isBlank() ? "123456" : emp.getPassword());

            // Specific Employee Data
            payload.put("type", "employee");
            // Mapping 'jobType' from UI to 'employeeType' for Backend
            payload.put("employeeType", emp.getJobType().isBlank() ? "staff" : emp.getJobType());
            // Default Active status
            payload.put("active", emp.isActive());

            System.out.println("Sending Employee payload to server:\n" + payload.toString(2));

            // Send Request
            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            JSONObject respJson = new JSONObject(response);

            // Extract ID from "user.id" or "id" depending on your API response structure
            if (respJson.has("user") && respJson.getJSONObject("user").has("id")) {
                return respJson.getJSONObject("user").getString("id");
            } else if (respJson.has("_id")) {
                return respJson.getString("_id");
            } else if (respJson.has("id")) {
                return respJson.getString("id");
            }

            System.out.println("Server response did not contain ID: " + response);

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to add employee remotely: " + e.getMessage());
        }
        return null;
    }

    public static boolean updateEmployeeRemotely(Employee emp) {
        try {
            // 1. FIX: Target the specific User ID URL
            String updateUrl = REMOTE_USERS_BASE_URL + emp.getId();

            JSONObject payload = new JSONObject();

            // Standard fields
            payload.put("fullname", emp.getFullname());
            payload.put("email", emp.getEmail());
            payload.put("phone", emp.getPhone());
            // Only send password if it's actually needed/changed
            if (emp.getPassword() != null && !emp.getPassword().isBlank()) {
                payload.put("password", emp.getPassword());
            }
            payload.put("type", "employee");

            // 2. FIX: Send 'active' status (Crucial for Freeze/Unfreeze)
            payload.put("active", emp.isActive());

            // 3. FIX: Nest employeeType inside employeeDetails to match Mongoose Schema
            JSONObject empDetails = new JSONObject();
            // Ensure emp.getJobType() matches one of your Mongoose ENUMS:
            // ['Regular Employee', 'Certified Employee', 'Department Manager', 'System Admin']
            empDetails.put("employeeType", emp.getJobType());
            payload.put("employeeDetails", empDetails);

            System.out.println("Sending Update Payload to: " + updateUrl);
            System.out.println(payload.toString(2));

            // 4. FIX: Use PATCH instead of POST
            String response = APIService.patch(updateUrl, payload.toString());

            System.out.println("Update Response: " + response);

            // Validation: If response is null or contains error/message indicating failure
            if (response == null) return false;
            JSONObject respJson = new JSONObject(response);

            // Depending on your backend, successful updates usually return the updated doc or a success message
            return !respJson.has("error");

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to update employee remotely: " + e.getMessage());
            return false;
        }
    }
    // Re-use the delete logic since ID is unique across both types
    public static boolean deleteUserRemotely(String userId) {
        return deleteClientRemotely(userId);
    }



}
