package noran.desktop.Database;

import noran.desktop.Services.APIService;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;

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

        // ✅ Read local shipments using correct column name
        Map<String, JSONObject> localById = new HashMap<>();
        List<JSONObject> localList = new ArrayList<>();

        try (Connection conn = DatabaseConnection.connect()) {
            String sql = "SELECT shipment_id, clientId, port_name, num_of_containers, type_of_containers, third_gomroky, country, status, policy, dragt, clearance_fees, expenses_and_tips, sundries FROM shipments";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    JSONObject j = new JSONObject();
                    j.put("shipment_id", rs.getString("shipment_id"));
                    j.put("clientId", rs.getString("clientId"));
                    j.put("port_name", rs.getString("port_name"));
                    j.put("num_of_containers", rs.getInt("num_of_containers"));
                    j.put("type_of_containers", new JSONArray(rs.getString("type_of_containers") == null ? "[]" : rs.getString("type_of_containers")));
                    j.put("third_gomroky", new JSONArray(rs.getString("third_gomroky") == null ? "[]" : rs.getString("third_gomroky")));
                    j.put("country", rs.getString("country"));
                    j.put("status", rs.getString("status"));
                    j.put("policy", rs.getString("policy"));
                    j.put("dragt", rs.getInt("dragt") == 1);
                    j.put("clearance_fees", rs.getDouble("clearance_fees"));
                    j.put("expenses_and_tips", rs.getDouble("expenses_and_tips"));
                    j.put("sundries", rs.getDouble("sundries"));

                    String id = rs.getString("shipment_id");
                    if (id != null) localById.put(id, j);
                    localList.add(j);
                }
            }
        }

        // ✅ Insert remote-only shipments
        List<JSONObject> toInsert = new ArrayList<>();
        for (Map.Entry<String, JSONObject> e : remoteById.entrySet()) {
            if (!localById.containsKey(e.getKey())) toInsert.add(e.getValue());
        }

        System.out.println("Remote-only shipments to insert locally: " + toInsert.size());

        if (!toInsert.isEmpty()) {
            try (Connection conn = DatabaseConnection.connect()) {
                String insertSQL = """
                    INSERT OR REPLACE INTO shipments (
                        port_name, num_of_containers, type_of_containers, third_gomroky, country,
                        status, policy, dragt, clearance_fees, expenses_and_tips, sundries, clientId
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

                PreparedStatement pstmt = conn.prepareStatement(insertSQL);

                for (JSONObject doc : toInsert) {
                    pstmt.setString(1, doc.optString("port_name", ""));
                    pstmt.setInt(2, doc.optInt("num_of_containers", 0));
                    pstmt.setString(3, doc.has("type_of_containers") ? doc.getJSONArray("type_of_containers").toString() : "[]");
                    pstmt.setString(4, doc.has("third_gomroky") ? doc.getJSONArray("third_gomroky").toString() : "[]");
                    pstmt.setString(5, doc.optString("country", ""));
                    pstmt.setString(6, doc.optString("status", ""));
                    pstmt.setString(7, doc.optString("policy", ""));
                    pstmt.setInt(8, doc.optBoolean("dragt", false) ? 1 : 0);
                    pstmt.setDouble(9, doc.optDouble("clearance_fees", 0.0));
                    pstmt.setDouble(10, doc.optDouble("expenses_and_tips", 0.0));
                    pstmt.setDouble(11, doc.optDouble("sundries", 0.0));

                    // ✅ Link to a user (clientId)
                    String clientId = null;
                    if (doc.has("clientId")) {
                        Object c = doc.get("clientId");
                        if (c instanceof JSONObject) clientId = ((JSONObject) c).optString("$oid", null);
                        else clientId = doc.optString("clientId", null);
                    }
                    pstmt.setString(12, clientId);

                    pstmt.executeUpdate();
                    System.out.println("✅ Inserted shipment: " + doc.optString("port_name"));
                }
            }
        }

        System.out.println("✅ Shipments sync complete.");
    }

    private static void ensureLocalTableExists() throws Exception {
        try (Connection conn = DatabaseConnection.connect()) {
            String create = """
                CREATE TABLE IF NOT EXISTS shipments (
                    shipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    port_name TEXT NOT NULL,
                    num_of_containers INTEGER CHECK (num_of_containers >= 0),
                    type_of_containers TEXT,
                    third_gomroky TEXT,
                    country TEXT,
                    status TEXT,
                    policy TEXT,
                    dragt BOOLEAN DEFAULT 0,
                    clearance_fees REAL DEFAULT 0.00,
                    expenses_and_tips REAL DEFAULT 0.00,
                    sundries REAL DEFAULT 0.00,
                    clientId TEXT,
                    FOREIGN KEY (clientId) REFERENCES users(_id)
                )
            """;
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
            } else return doc.optString("_id", null);
        }
        return null;
    }
}
