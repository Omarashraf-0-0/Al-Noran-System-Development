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
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;

/**
 * Sync shipments between remote (REST-backed Mongo) and local SQLite `shipments` table.
 *
 * Behavior:
 * - Fetch remote shipments via GET
 * - Read local shipments from SQLite
 * - Push local-only shipments to remote via POST
 * - Insert remote-only shipments into local SQLite
 *
 * Configure endpoints below.
 */
public class RestMongoShipmentsSyncClient {

    private static final String REMOTE_SHIPMENTS_GET_URL = "http://localhost:3500/api/shipments/getAll";
    private static final String REMOTE_SHIPMENTS_CREATE_URL = "http://localhost:3500/api/shipments/addShipments";

    public static void main(String[] args) {
        try {
            syncShipmentsWithRemote();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            MongoConnection.closeConnection();
        }
    }

    public static void syncShipmentsWithRemote() throws Exception {
        System.out.println("Starting shipments sync: fetching remote shipments...");

        JSONArray remoteArr = fetchRemoteShipments();
        Map<String, JSONObject> remoteById = new HashMap<>();
        for (int i = 0; i < remoteArr.length(); i++) {
            JSONObject doc = remoteArr.getJSONObject(i);
            String id = parseId(doc);
            if (id != null) remoteById.put(id, doc);
        }

    ensureLocalTableExists();

        // Read local shipments using the new schema
        Map<String, JSONObject> localById = new HashMap<>();
        List<JSONObject> localList = new ArrayList<>();
        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "SELECT id, user_id, port_name, num_of_containers, type_of_containers, third_gomroky, country, status, policy, dragt, clearance_fees, expenses_and_tips, sundries, createdAt, updatedAt, version FROM shipments";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    JSONObject j = new JSONObject();
                    j.put("id", rs.getString("id"));
                    j.put("user_id", rs.getString("user_id"));
                    j.put("port_name", rs.getString("port_name"));
                    j.put("num_of_containers", rs.getInt("num_of_containers"));
                    // arrays stored as JSON text
                    j.put("type_of_containers", new org.json.JSONArray(rs.getString("type_of_containers") == null ? "[]" : rs.getString("type_of_containers")));
                    j.put("third_gomroky", new org.json.JSONArray(rs.getString("third_gomroky") == null ? "[]" : rs.getString("third_gomroky")));
                    j.put("country", rs.getString("country"));
                    j.put("status", rs.getString("status"));
                    j.put("policy", rs.getString("policy"));
                    j.put("dragt", rs.getInt("dragt") == 1);
                    j.put("clearance_fees", rs.getDouble("clearance_fees"));
                    j.put("expenses_and_tips", rs.getDouble("expenses_and_tips"));
                    j.put("sundries", rs.getDouble("sundries"));
                    j.put("createdAt", rs.getLong("createdAt"));
                    j.put("updatedAt", rs.getLong("updatedAt"));
                    j.put("version", rs.getInt("version"));

                    String id = rs.getString("id");
                    if (id != null) localById.put(id, j);
                    localList.add(j);
                }
            }
        }

        // Local-only -> push to remote
        List<JSONObject> toPush = new ArrayList<>();
        for (JSONObject local : localList) {
            String id = local.optString("id", null);
            if (id == null || id.isBlank()) continue;
            if (!remoteById.containsKey(id)) toPush.add(local);
        }

        System.out.println("Local-only shipments to push: " + toPush.size());
        for (JSONObject s : toPush) {
            JSONObject payload = new JSONObject();
            payload.put("user_id", s.optString("user_id", ""));
            payload.put("port_name", s.optString("port_name", ""));
            payload.put("num_of_containers", s.optInt("num_of_containers", 0));
            // ensure arrays are sent as actual arrays
            Object types = s.opt("type_of_containers");
            if (types instanceof org.json.JSONArray) payload.put("type_of_containers", types);
            else payload.put("type_of_containers", new org.json.JSONArray());
            Object third = s.opt("third_gomroky");
            if (third instanceof org.json.JSONArray) payload.put("third_gomroky", third);
            else payload.put("third_gomroky", new org.json.JSONArray());
            payload.put("country", s.optString("country", ""));
            payload.put("status", s.optString("status", ""));
            payload.put("policy", s.optString("policy", ""));
            payload.put("dragt", s.optBoolean("dragt", false));
            payload.put("clearance_fees", s.optDouble("clearance_fees", 0.0));
            payload.put("expenses_and_tips", s.optDouble("expenses_and_tips", 0.0));
            payload.put("sundries", s.optDouble("sundries", 0.0));

            String resp = APIService.post(REMOTE_SHIPMENTS_CREATE_URL, payload.toString());
            System.out.println("Pushed shipment " + payload.optString("port_name") + " -> " + (resp == null ? "null" : resp));
        }

        // Remote-only -> insert locally
        List<JSONObject> toInsert = new ArrayList<>();
        for (Map.Entry<String, JSONObject> e : remoteById.entrySet()) {
            String id = e.getKey();
            if (!localById.containsKey(id)) toInsert.add(e.getValue());
        }

        System.out.println("Remote-only shipments to insert locally: " + toInsert.size());
        if (!toInsert.isEmpty()) {
            try (Connection conn = DatabaseConnection.connect()) {
                String insertSQL = "INSERT OR REPLACE INTO shipments (id, user_id, port_name, num_of_containers, type_of_containers, third_gomroky, country, status, policy, dragt, clearance_fees, expenses_and_tips, sundries, createdAt, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                PreparedStatement pstmt = conn.prepareStatement(insertSQL);
                int count = 0;
                for (JSONObject doc : toInsert) {
                    String id = parseId(doc);
                    pstmt.setString(1, id);
                    // user_id may be nested
                    String userId = null;
                    if (doc.has("user_id")) {
                        Object u = doc.get("user_id");
                        if (u instanceof JSONObject) userId = ((JSONObject) u).optString("$oid", null);
                        else userId = doc.optString("user_id", null);
                    }
                    pstmt.setString(2, userId);
                    pstmt.setString(3, doc.optString("port_name", null));
                    pstmt.setInt(4, doc.optInt("num_of_containers", 0));
                    // store arrays as JSON text
                    pstmt.setString(5, doc.has("type_of_containers") ? doc.get("type_of_containers").toString() : "[]");
                    pstmt.setString(6, doc.has("third_gomroky") ? doc.get("third_gomroky").toString() : "[]");
                    pstmt.setString(7, doc.optString("country", null));
                    pstmt.setString(8, doc.optString("status", null));
                    pstmt.setString(9, doc.optString("policy", null));
                    pstmt.setInt(10, doc.optBoolean("dragt", false) ? 1 : 0);
                    pstmt.setDouble(11, doc.optDouble("clearance_fees", 0.0));
                    pstmt.setDouble(12, doc.optDouble("expenses_and_tips", 0.0));
                    pstmt.setDouble(13, doc.optDouble("sundries", 0.0));
                    pstmt.setLong(14, getLongFromMongoDate(doc.opt("createdAt")));
                    pstmt.setLong(15, getLongFromMongoDate(doc.opt("updatedAt")));
                    pstmt.setInt(16, doc.optInt("__v", 0));

                    pstmt.executeUpdate();
                    count++;
                }
                System.out.println("Inserted " + count + " shipments into local DB.");
            }
        }

        System.out.println("Shipments sync complete.");
    }

    private static void ensureLocalTableExists() throws Exception {
        try (Connection conn = DatabaseConnection.connect()) {
            String create = "CREATE TABLE IF NOT EXISTS shipments ("+
                    "id TEXT PRIMARY KEY, " +
                    "user_id TEXT, " +
                    "port_name TEXT, " +
                    "num_of_containers INTEGER, " +
                    "type_of_containers TEXT, " +
                    "third_gomroky TEXT, " +
                    "country TEXT, " +
                    "status TEXT, " +
                    "policy TEXT, " +
                    "dragt INTEGER DEFAULT 0, " +
                    "clearance_fees REAL DEFAULT 0.0, " +
                    "expenses_and_tips REAL DEFAULT 0.0, " +
                    "sundries REAL DEFAULT 0.0, " +
                    "createdAt INTEGER, " +
                    "updatedAt INTEGER, " +
                    "version INTEGER DEFAULT 0" +
                    ")";
            try (Statement st = conn.createStatement()) {
                st.execute(create);
            }
        }
    }

    private static JSONArray fetchRemoteShipments() {
        try {
            URL url = new URL(REMOTE_SHIPMENTS_GET_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");

            int status = conn.getResponseCode();
            BufferedReader br = new BufferedReader(new InputStreamReader(status >= 200 && status < 300 ? conn.getInputStream() : conn.getErrorStream(), StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            String resp = sb.toString();
            if (resp.isBlank()) return new JSONArray();

            Object parsed = new org.json.JSONTokener(resp).nextValue();
            if (parsed instanceof JSONArray) return (JSONArray) parsed;
            if (parsed instanceof JSONObject) {
                JSONObject o = (JSONObject) parsed;
                if (o.has("shipments") && o.get("shipments") instanceof JSONArray) return o.getJSONArray("shipments");
                // If single object, wrap
                return new JSONArray().put(o);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return new JSONArray();
    }

    private static String parseId(JSONObject doc) {
        if (doc == null) return null;
        if (doc.has("_id")) {
            Object idObj = doc.get("_id");
            if (idObj instanceof JSONObject) {
                JSONObject idDoc = (JSONObject) idObj;
                if (idDoc.has("$oid")) return idDoc.optString("$oid", null);
            } else {
                return doc.optString("_id", null);
            }
        }
        return doc.optString("id", null);
    }

    private static long getLongFromMongoDate(Object o) {
        if (o == null) return System.currentTimeMillis();
        try {
            if (o instanceof JSONObject) {
                JSONObject dobj = (JSONObject) o;
                if (dobj.has("$date")) {
                    Object d = dobj.get("$date");
                    if (d instanceof JSONObject) {
                        JSONObject n = (JSONObject) d;
                        if (n.has("$numberLong")) return Long.parseLong(n.getString("$numberLong"));
                    } else if (d instanceof Number) {
                        return ((Number) d).longValue();
                    }
                }
            } else if (o instanceof Number) return ((Number) o).longValue();
        } catch (Exception ignored) { }
        return System.currentTimeMillis();
    }
}
