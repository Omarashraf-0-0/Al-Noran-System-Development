package noran.desktop.Database;

import noran.desktop.AppSession;
import noran.desktop.Services.APIService;
import noran.desktop.models.Client;
import noran.desktop.models.Employee;
import noran.desktop.models.Shipment;
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
import java.sql.Statement;
import java.util.*;

public class RestMongoSyncClient {
    private static final String REMOTE_USERS_BASE_URL = noran.desktop.AppConfig.API_USERS + "/";
    private static final String REMOTE_USERS_GET_URL = noran.desktop.AppConfig.API_USERS_GET_ALL;
    private static final String REMOTE_USERS_CREATE_URL = noran.desktop.AppConfig.API_USERS_GET_ALL;

    private static final String SHIPMENTS_GET_ALL = noran.desktop.AppConfig.API_SHIPMENTS_GET_ALL;
    private static final String SHIPMENTS_BASE = noran.desktop.AppConfig.API_SHIPMENTS + "/";

    private static final String SHIPMENTS_GET_ALL = "http://localhost:3500/api/shipments/getAll";
    private static final String SHIPMENTS_BASE = "http://localhost:3500/api/shipments/";

    public static void main(String[] args) {
        try {
            syncUsersWithRemote();
            syncShipmentsWithRemote();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            MongoConnection.closeConnection();
        }
    }

    // ---------------------------------------------------
    // 1. SHIPMENTS SYNC
    // ---------------------------------------------------

    public static void syncShipmentsWithRemote() {
        System.out.println("📦 Syncing Shipments: Fetching from remote...");

        JSONArray remoteShipments = fetchJsonArray(SHIPMENTS_GET_ALL);

        if (remoteShipments == null) {
            System.err.println("⚠ Could not fetch remote shipments. Skipping sync.");
            return;
        }

        try (Connection conn = DatabaseConnection.connect()) {

            // 🛑 RESET TABLE HERE (Inside Sync Only)
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("DROP TABLE IF EXISTS shipments");
                String createSql = """
<<<<<<< HEAD
                    CREATE TABLE shipments (
                        _id TEXT PRIMARY KEY,
                        acid TEXT,
                        port_name TEXT,
                        country TEXT,
                        num_of_containers INTEGER,
                        status TEXT,
                        policy TEXT,
                        dragt BOOLEAN DEFAULT 0,
                        clearance_fees REAL DEFAULT 0.00,
                        expenses_and_tips REAL DEFAULT 0.00,
                        sundries REAL DEFAULT 0.00,
                        importerName TEXT,
                        number46 TEXT,
                        employerName TEXT,
                        shipmentDescription TEXT,
                        arrivalDate TEXT,
                        invoiceUrl TEXT,
                        employee_id TEXT,
                        clientId TEXT
                    );
                """;
=======
                            CREATE TABLE shipments (
                                _id TEXT PRIMARY KEY,
                                acid TEXT,
                                port_name TEXT,
                                country TEXT,
                                num_of_containers INTEGER,
                                status TEXT,
                                policy TEXT,
                                dragt BOOLEAN DEFAULT 0,
                                clearance_fees REAL DEFAULT 0.00,
                                expenses_and_tips REAL DEFAULT 0.00,
                                sundries REAL DEFAULT 0.00,
                                importerName TEXT,
                                number46 TEXT,
                                employerName TEXT,
                                shipmentDescription TEXT,
                                arrivalDate TEXT,
                                invoiceUrl TEXT,
                                employee_id TEXT,
                                clientId TEXT
                            );
                        """;
>>>>>>> main
                stmt.execute(createSql);
            }

            // INSERT DATA
            String insertSql = "INSERT INTO shipments (_id, acid, port_name, country, num_of_containers, status, policy) VALUES (?, ?, ?, ?, ?, ?, ?)";

            try (PreparedStatement psInsert = conn.prepareStatement(insertSql)) {
                conn.setAutoCommit(false);

                for (int i = 0; i < remoteShipments.length(); i++) {
                    JSONObject s = remoteShipments.getJSONObject(i);

                    String id = "";
                    if (s.has("_id") && s.get("_id") instanceof JSONObject) {
                        id = s.getJSONObject("_id").optString("$oid", "");
                    } else {
                        id = s.optString("_id", s.optString("id", ""));
                    }

                    String acid = s.optString("acid", "ACID-" + System.currentTimeMillis());

                    int containers = 0;
                    Object numObj = s.opt("num_of_containers");
<<<<<<< HEAD
                    if (numObj instanceof Integer) containers = (Integer) numObj;
                    else if (numObj instanceof JSONObject) containers = ((JSONObject) numObj).optInt("$numberInt", 0);
=======
                    if (numObj instanceof Integer)
                        containers = (Integer) numObj;
                    else if (numObj instanceof JSONObject)
                        containers = ((JSONObject) numObj).optInt("$numberInt", 0);
>>>>>>> main

                    psInsert.setString(1, id);
                    psInsert.setString(2, acid);
                    psInsert.setString(3, s.optString("port_name", ""));
                    psInsert.setString(4, s.optString("country", ""));
                    psInsert.setInt(5, containers);
                    psInsert.setString(6, s.optString("status", "Pending"));
                    psInsert.setString(7, s.optString("policy", ""));

                    psInsert.addBatch();
                }
                psInsert.executeBatch();
                conn.commit();
            }
            System.out.println("✔ Shipments Synced: " + remoteShipments.length() + " records inserted.");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
<<<<<<< HEAD
    // ---------------------------------------------------
    // 2. USERS SYNC
    // ---------------------------------------------------
    public static void syncUsersWithRemote() throws Exception {
        System.out.println("Starting user sync...");
        JSONArray remoteUsers = fetchJsonArray(REMOTE_USERS_GET_URL);
        if (remoteUsers == null) return;

        Set<String> validRemoteIds = new HashSet<>();

        try (Connection conn = DatabaseConnection.connect()) {
            String insertSQL = "INSERT OR REPLACE INTO users (_id, fullname, username, phone, email, password, type, active, taxNumber, rank, clientType, ssn, employeeType, verified, createdAt, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement pstmt = conn.prepareStatement(insertSQL);

            for (int i = 0; i < remoteUsers.length(); i++) {
                JSONObject doc = remoteUsers.getJSONObject(i);

                String id = doc.optString("id", doc.optString("_id", null));
                if (id != null) validRemoteIds.add(id);

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

=======

    // ---------------------------------------------------
    // 2. USERS SYNC
    // ---------------------------------------------------
    public static void syncUsersWithRemote() throws Exception {
        System.out.println("Starting user sync...");
        JSONArray remoteUsers = fetchJsonArray(REMOTE_USERS_GET_URL);
        if (remoteUsers == null)
            return;

        Set<String> validRemoteIds = new HashSet<>();

        try (Connection conn = DatabaseConnection.connect()) {
            String insertSQL = "INSERT OR REPLACE INTO users (_id, fullname, username, phone, email, password, type, active, taxNumber, rank, clientType, ssn, employeeType, verified, createdAt, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement pstmt = conn.prepareStatement(insertSQL);

            for (int i = 0; i < remoteUsers.length(); i++) {
                JSONObject doc = remoteUsers.getJSONObject(i);

                String id = doc.optString("id", doc.optString("_id", null));
                if (id != null)
                    validRemoteIds.add(id);

                pstmt.setString(1, id);
                pstmt.setString(2, doc.optString("fullname", ""));
                pstmt.setString(3, doc.optString("username", ""));
                pstmt.setString(4, doc.optString("phone", ""));
                pstmt.setString(5, doc.optString("email", ""));
                pstmt.setString(6, doc.optString("password", ""));

                String type = doc.optString("type", "client").toLowerCase();
                if (!type.equals("client") && !type.equals("employee"))
                    type = "client";
                pstmt.setString(7, type);

                pstmt.setInt(8, doc.optBoolean("active", true) ? 1 : 0);
                pstmt.setString(9, doc.optString("taxNumber", ""));

>>>>>>> main
                String rawRank = doc.optString("rank", null);
                if (rawRank == null || rawRank.equalsIgnoreCase("null") ||
                        (!rawRank.equals("low") && !rawRank.equals("med") && !rawRank.equals("high"))) {
                    pstmt.setString(10, null);
                } else {
                    pstmt.setString(10, rawRank.toLowerCase());
                }

                JSONObject clientDetails = doc.optJSONObject("clientDetails");
                pstmt.setString(11, clientDetails != null ? clientDetails.optString("clientType", "") : "");
                pstmt.setString(12, clientDetails != null ? clientDetails.optString("ssn", "") : "");

                JSONObject employeeDetails = doc.optJSONObject("employeeDetails");
                pstmt.setString(13, employeeDetails != null ? employeeDetails.optString("employeeType", "") : "");
                pstmt.setInt(14, (employeeDetails != null && employeeDetails.optBoolean("verified")) ? 1 : 0);

                pstmt.setLong(15, System.currentTimeMillis());
                pstmt.setLong(16, System.currentTimeMillis());
                pstmt.setInt(17, 0);

                pstmt.executeUpdate();
            }

            // Cleanup Orphans
            List<String> localIdsToDelete = new ArrayList<>();
            ResultSet rs = conn.createStatement().executeQuery("SELECT _id FROM users");
<<<<<<< HEAD
            while(rs.next()) {
                String lid = rs.getString("_id");
                if(!validRemoteIds.contains(lid)) localIdsToDelete.add(lid);
            }
            if (!localIdsToDelete.isEmpty()) {
                PreparedStatement psDel = conn.prepareStatement("DELETE FROM users WHERE _id = ?");
                for(String delId : localIdsToDelete) {
=======
            while (rs.next()) {
                String lid = rs.getString("_id");
                if (!validRemoteIds.contains(lid))
                    localIdsToDelete.add(lid);
            }
            if (!localIdsToDelete.isEmpty()) {
                PreparedStatement psDel = conn.prepareStatement("DELETE FROM users WHERE _id = ?");
                for (String delId : localIdsToDelete) {
>>>>>>> main
                    psDel.setString(1, delId);
                    psDel.executeUpdate();
                }
                System.out.println("🧹 Cleaned " + localIdsToDelete.size() + " orphan users.");
            }
        }
        System.out.println("✔ User Sync Complete.");
    }

    // ---------------------------------------------------
    // HELPERS
    // ---------------------------------------------------
    private static JSONArray fetchJsonArray(String urlString) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");

            // 🔴 FIX: ATTACH TOKEN TO HEADER
            String token = noran.desktop.AppSession.getInstance().getAuthToken();
            if (token != null && !token.isBlank()) {
                conn.setRequestProperty("Authorization", "Bearer " + token);
            } else {
                System.out.println("⚠ Warning: No auth token found in session!");
            }

            if (conn.getResponseCode() == 401) {
                System.err.println("❌ 401 Unauthorized: Check if token is valid/expired.");
                return null;
            }

<<<<<<< HEAD
            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
=======
            BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null)
                sb.append(line);
>>>>>>> main
            return new JSONArray(sb.toString());

        } catch (Exception e) {
            System.err.println("❌ Failed to fetch: " + urlString + " (" + e.getMessage() + ")");
            return null;
        }
    }
<<<<<<< HEAD
=======

>>>>>>> main
    // ---------------------------------------------------
    // CRUD METHODS
    // ---------------------------------------------------
    public static String addClientRemotely(Client client) {
        try {
            JSONObject payload = new JSONObject();
<<<<<<< HEAD
=======
            payload.put("fullname", client.getFullname());
            payload.put("email", client.getEmail());
            payload.put("username", client.getEmail().split("@")[0]);
            payload.put("phone", client.getPhone());
            payload.put("password", client.getPassword());
            payload.put("type", "client");
            payload.put("clientType", client.getClientType());
            payload.put("ssn", client.getSsn());
            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            JSONObject r = new JSONObject(response);
            if (r.has("user"))
                return r.getJSONObject("user").optString("id", r.getJSONObject("user").optString("_id", null));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static boolean updateClientRemotely(Client client) {
        try {
            String url = REMOTE_USERS_BASE_URL + client.getId();
            JSONObject payload = new JSONObject();
>>>>>>> main
            payload.put("fullname", client.getFullname());
            payload.put("email", client.getEmail());
            payload.put("username", client.getEmail().split("@")[0]);
            payload.put("phone", client.getPhone());
            if (!client.getPassword().isBlank())
                payload.put("password", client.getPassword());
            payload.put("type", "client");
            payload.put("clientType", client.getClientType());
            payload.put("ssn", client.getSsn());
<<<<<<< HEAD
            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            JSONObject r = new JSONObject(response);
            if (r.has("user")) return r.getJSONObject("user").optString("id", r.getJSONObject("user").optString("_id", null));
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    public static boolean updateClientRemotely(Client client) {
        try {
            String url = REMOTE_USERS_BASE_URL + client.getId();
            JSONObject payload = new JSONObject();
            payload.put("fullname", client.getFullname());
            payload.put("email", client.getEmail());
            payload.put("phone", client.getPhone());
            if(!client.getPassword().isBlank()) payload.put("password", client.getPassword());
            payload.put("type", "client");
            payload.put("clientType", client.getClientType());
            payload.put("ssn", client.getSsn());

            String response = APIService.put(url, payload.toString());
            return response != null && !new JSONObject(response).has("error");
        } catch (Exception e) { return false; }
    }

=======

            String response = APIService.put(url, payload.toString());
            return response != null && !new JSONObject(response).has("error");
        } catch (Exception e) {
            return false;
        }
    }

>>>>>>> main
    public static String addEmployeeRemotely(Employee emp) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("fullname", emp.getFullname());
            payload.put("email", emp.getEmail());
            payload.put("username", emp.getEmail().split("@")[0]);
            payload.put("phone", emp.getPhone());
            payload.put("password", emp.getPassword());
            payload.put("type", "employee");
            payload.put("employeeType", emp.getJobType());
            String response = APIService.post(REMOTE_USERS_CREATE_URL, payload.toString());
            JSONObject r = new JSONObject(response);
<<<<<<< HEAD
            if (r.has("user")) return r.getJSONObject("user").optString("id", r.getJSONObject("user").optString("_id", null));
        } catch (Exception e) { e.printStackTrace(); }
=======
            if (r.has("user"))
                return r.getJSONObject("user").optString("id", r.getJSONObject("user").optString("_id", null));
        } catch (Exception e) {
            e.printStackTrace();
        }
>>>>>>> main
        return null;
    }

    public static boolean updateEmployeeRemotely(Employee emp) {
        try {
            String url = REMOTE_USERS_BASE_URL + emp.getId();
            JSONObject payload = new JSONObject();
            payload.put("fullname", emp.getFullname());
            payload.put("email", emp.getEmail());
            payload.put("phone", emp.getPhone());
<<<<<<< HEAD
            if(!emp.getPassword().isBlank()) payload.put("password", emp.getPassword());
=======
            if (!emp.getPassword().isBlank())
                payload.put("password", emp.getPassword());
>>>>>>> main
            payload.put("type", "employee");
            payload.put("active", emp.isActive());
            payload.put("employeeDetails", new JSONObject().put("employeeType", emp.getJobType()));

            String response = APIService.put(url, payload.toString());
            return response != null && !new JSONObject(response).has("error");
<<<<<<< HEAD
        } catch (Exception e) { return false; }
    }

    public static boolean deleteUserRemotely(String id) {
        try {
            String response = APIService.delete(REMOTE_USERS_BASE_URL + id);
            return response != null && new JSONObject(response).has("message");
        } catch (Exception e) { return false; }
    }

    // Shipments CRUD
    public static boolean addShipmentRemotely(Shipment s) {
        try {
            JSONObject payload = new JSONObject();
            if(s.getAcid() != null) payload.put("acid", s.getAcid());
=======
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean deleteUserRemotely(String id) {
        try {
            String response = APIService.delete(REMOTE_USERS_BASE_URL + id);
            return response != null && new JSONObject(response).has("message");
        } catch (Exception e) {
            return false;
        }
    }

    // Shipments CRUD
    public static boolean addShipmentRemotely(Shipment s) {
        try {
            JSONObject payload = new JSONObject();
            if (s.getAcid() != null)
                payload.put("acid", s.getAcid());
            payload.put("port_name", s.getPortName());
            payload.put("country", s.getCountry());
            payload.put("num_of_containers", s.getNumOfContainers());
            payload.put("status", s.getStatus());
            payload.put("policy", s.getPolicy());
            String response = APIService.post(SHIPMENTS_BASE, payload.toString());
            return response != null && new JSONObject(response).has("success");
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean updateShipmentRemotely(Shipment s) {
        try {
            String url = SHIPMENTS_BASE + s.getAcid();
            JSONObject payload = new JSONObject();
>>>>>>> main
            payload.put("port_name", s.getPortName());
            payload.put("country", s.getCountry());
            payload.put("num_of_containers", s.getNumOfContainers());
            payload.put("status", s.getStatus());
            payload.put("policy", s.getPolicy());
<<<<<<< HEAD
            String response = APIService.post(SHIPMENTS_BASE, payload.toString());
            return response != null && new JSONObject(response).has("success");
        } catch (Exception e) { return false; }
    }

    public static boolean updateShipmentRemotely(Shipment s) {
        try {
            String url = SHIPMENTS_BASE + s.getAcid();
            JSONObject payload = new JSONObject();
            payload.put("port_name", s.getPortName());
            payload.put("country", s.getCountry());
            payload.put("num_of_containers", s.getNumOfContainers());
            payload.put("status", s.getStatus());
            payload.put("policy", s.getPolicy());
            String response = APIService.patch(url, payload.toString());
            return response != null && !new JSONObject(response).has("error");
        } catch (Exception e) { return false; }
    }

=======
            String response = APIService.patch(url, payload.toString());
            return response != null && !new JSONObject(response).has("error");
        } catch (Exception e) {
            return false;
        }
    }

>>>>>>> main
    public static boolean deleteShipmentRemotely(String acid) {
        try {
            String response = APIService.delete(SHIPMENTS_BASE + acid);
            return response != null && new JSONObject(response).has("message");
<<<<<<< HEAD
        } catch (Exception e) { return false; }
=======
        } catch (Exception e) {
            return false;
        }
>>>>>>> main
    }
}