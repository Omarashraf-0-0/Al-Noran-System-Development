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

    // ---------------------------------------------------
    // 1. MAIN SYNC LOGIC (Syncs BOTH Clients & Employees)
    // ---------------------------------------------------
    public static void syncUsersWithRemote() throws Exception {
        System.out.println("Starting sync with remote...");

        JSONArray remoteUsers = fetchRemoteUsers();
        if (remoteUsers == null) remoteUsers = new JSONArray();

        Map<String, JSONObject> remoteByEmail = new HashMap<>();
        Set<String> validRemoteIds = new HashSet<>();

        for (int i = 0; i < remoteUsers.length(); i++) {
            JSONObject u = remoteUsers.getJSONObject(i);
            String email = u.optString("email", "").toLowerCase();
            String id = u.optString("id", u.optString("_id", ""));
            if (!email.isBlank()) remoteByEmail.put(email, u);
            if (!id.isBlank()) validRemoteIds.add(id);
        }

        // PULL: Insert/Update Remote Users into Local SQLite
        try (Connection sqliteConn = DatabaseConnection.connect()) {
            String insertSQL = "INSERT OR REPLACE INTO users (_id, fullname, username, phone, email, password, type, active, taxNumber, rank, clientType, ssn, employeeType, verified, createdAt, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement pstmt = sqliteConn.prepareStatement(insertSQL);

            for (int i = 0; i < remoteUsers.length(); i++) {
                JSONObject doc = remoteUsers.getJSONObject(i);

                String id = doc.optString("id", doc.optString("_id", null));
                pstmt.setString(1, id);
                pstmt.setString(2, doc.optString("fullname", ""));
                pstmt.setString(3, doc.optString("username", ""));
                pstmt.setString(4, doc.optString("phone", ""));
                pstmt.setString(5, doc.optString("email", ""));
                pstmt.setString(6, doc.optString("password", ""));

                String type = doc.optString("type", "client").toLowerCase();
                if (!type.equals("client") && !type.equals("employee")) type = "client";
                pstmt.setString(7, type);

                pstmt.setInt(8, doc.optBoolean("active", true) ? 1 : 0);
                pstmt.setString(9, doc.optString("taxNumber", ""));

                // SANITIZE RANK (low, med, high or NULL)
                String rawRank = doc.optString("rank", null);
                if (rawRank == null || rawRank.isBlank() || rawRank.equalsIgnoreCase("null")) {
                    pstmt.setString(10, null);
                } else {
                    String sanitizedRank = rawRank.toLowerCase().trim();
                    if (sanitizedRank.equals("low") || sanitizedRank.equals("med") || sanitizedRank.equals("high")) {
                        pstmt.setString(10, sanitizedRank);
                    } else {
                        pstmt.setString(10, null);
                    }
                }

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

                pstmt.setLong(15, System.currentTimeMillis());
                pstmt.setLong(16, System.currentTimeMillis());
                pstmt.setInt(17, 0);

                pstmt.executeUpdate();
            }
        }

        // CLEANUP: Delete Local Orphans
        System.out.println("🧹 Cleaning up local database...");
        try (Connection conn = DatabaseConnection.connect()) {
            List<String> localIdsToDelete = new ArrayList<>();
            String selectIds = "SELECT _id FROM users";
            try (PreparedStatement ps = conn.prepareStatement(selectIds)) {
                ResultSet rs = ps.executeQuery();
                while(rs.next()) {
                    String localId = rs.getString("_id");
                    if (localId != null && !localId.isBlank() && !validRemoteIds.contains(localId)) {
                        localIdsToDelete.add(localId);
                    }
                }
            }

            if (!localIdsToDelete.isEmpty()) {
                String deleteSql = "DELETE FROM users WHERE _id = ?";
                try (PreparedStatement psDelete = conn.prepareStatement(deleteSql)) {
                    for (String idToDelete : localIdsToDelete) {
                        psDelete.setString(1, idToDelete);
                        psDelete.executeUpdate();
                        System.out.println("❌ Deleted local orphan user: " + idToDelete);
                    }
                }
            }
        }
        System.out.println("✔ Sync and Cleanup Complete.");
    }

    private static JSONArray fetchRemoteUsers() {
        try {
            URL url = new URL(REMOTE_USERS_GET_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");
            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            return new JSONArray(sb.toString());
        } catch (Exception e) { return null; }
    }

    // ---------------------------------------------------
    // 2. CLIENT METHODS
    // ---------------------------------------------------

    public static String addClientRemotely(Client client) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("fullname", client.getFullname());
            String email = client.getEmail().isBlank() ? "user" + System.currentTimeMillis() + "@example.com" : client.getEmail();
            payload.put("email", email);
            payload.put("username", email.split("@")[0]);
            payload.put("phone", client.getPhone());
            payload.put("password", client.getPassword().isBlank() ? "123456" : client.getPassword());
            payload.put("type", "client");
            payload.put("clientType", client.getClientType());
            payload.put("ssn", client.getSsn());

            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            JSONObject respJson = new JSONObject(response);

            if (respJson.has("user")) {
                JSONObject u = respJson.getJSONObject("user");
                return u.optString("id", u.optString("_id", null));
            }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    public static boolean updateClientRemotely(Client client) {
        try {
            if (client.getId() == null || client.getId().isBlank()) return false;
            String updateUrl = REMOTE_USERS_BASE_URL + client.getId().trim();
            JSONObject payload = new JSONObject();
            payload.put("fullname", client.getFullname());
            payload.put("username", client.getEmail().split("@")[0]);
            payload.put("email", client.getEmail());
            payload.put("phone", client.getPhone());
            if (!client.getPassword().isBlank()) payload.put("password", client.getPassword());
            payload.put("type", "client");
            payload.put("clientType", client.getClientType());
            payload.put("ssn", client.getSsn());

            String response = APIService.put(updateUrl, payload.toString());
            if (response == null) return false;
            JSONObject respJson = new JSONObject(response);

            if (respJson.optString("message").toLowerCase().contains("not found")) {
                String newId = addClientRemotely(client);
                if (newId != null) client.setId(newId);
                return newId != null;
            }
            return !respJson.has("error");
        } catch (Exception e) { return false; }
    }

    public static boolean deleteClientRemotely(String clientId) {
        if (clientId == null || clientId.isBlank()) return false;
        try {
            String response = APIService.delete(REMOTE_USERS_BASE_URL + clientId.trim());
            JSONObject respJson = new JSONObject(response);
            return respJson.has("message") && respJson.getString("message").toLowerCase().contains("deleted");
        } catch (Exception e) { return false; }
    }

    // ---------------------------------------------------
    // 3. EMPLOYEE METHODS (MISSING IN YOUR CODE)
    // ---------------------------------------------------

    public static String addEmployeeRemotely(Employee emp) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("fullname", emp.getFullname());
            String email = emp.getEmail().isBlank() ? "user" + System.currentTimeMillis() + "@example.com" : emp.getEmail();
            payload.put("username", email.split("@")[0]);
            payload.put("email", email);
            payload.put("phone", emp.getPhone());
            payload.put("password", emp.getPassword());
            payload.put("type", "employee");
            payload.put("employeeType", emp.getJobType().isBlank() ? "staff" : emp.getJobType());
            payload.put("active", emp.isActive());

            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            JSONObject respJson = new JSONObject(response);

            if (respJson.has("user")) {
                JSONObject u = respJson.getJSONObject("user");
                return u.optString("id", u.optString("_id", null));
            }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    public static boolean updateEmployeeRemotely(Employee emp) {
        try {
            if (emp.getId() == null || emp.getId().isBlank()) return false;

            String updateUrl = REMOTE_USERS_BASE_URL + emp.getId().trim();
            JSONObject payload = new JSONObject();
            payload.put("fullname", emp.getFullname());
            payload.put("email", emp.getEmail());
            payload.put("phone", emp.getPhone());
            if (emp.getPassword() != null && !emp.getPassword().isBlank()) payload.put("password", emp.getPassword());
            payload.put("type", "employee");
            payload.put("active", emp.isActive());

            JSONObject details = new JSONObject();
            details.put("employeeType", emp.getJobType());
            payload.put("employeeDetails", details);

            String response = APIService.put(updateUrl, payload.toString());
            if (response == null) return false;
            JSONObject respJson = new JSONObject(response);

            // Self-Healing
            if (respJson.optString("message").contains("not found")) {
                String newId = addEmployeeRemotely(emp);
                if (newId != null) emp.setId(newId);
                return newId != null;
            }

            return !respJson.has("error");
        } catch (Exception e) { return false; }
    }

    // Generic helper used by Employee Controller
    public static boolean deleteUserRemotely(String userId) {
        return deleteClientRemotely(userId);
    }
}