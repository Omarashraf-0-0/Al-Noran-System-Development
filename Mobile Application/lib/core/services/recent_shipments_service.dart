import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// Service to track and manage recently viewed shipments
/// Stores the last 3 shipments (import or export) that the user opened
class RecentShipmentsService {
  static const String _recentShipmentsKey = 'recent_shipments';
  static const int _maxRecentShipments = 3;

  /// Add a shipment to recent list
  /// Maintains a max of 3 shipments, most recent first
  static Future<void> addRecentShipment(Map<String, dynamic> shipment) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Get existing recent shipments
      final List<Map<String, dynamic>> recentShipments = await getRecentShipments();
      
      // Extract shipment ID
      final shipmentId = shipment['id'] ?? shipment['acid'] ?? shipment['_id'];
      
      // Remove if already exists (to avoid duplicates)
      recentShipments.removeWhere((s) {
        final sId = s['id'] ?? s['acid'] ?? s['_id'];
        return sId == shipmentId;
      });
      
      // Add to beginning
      recentShipments.insert(0, {
        ...shipment,
        'viewedAt': DateTime.now().toIso8601String(),
      });
      
      // Keep only last 3
      if (recentShipments.length > _maxRecentShipments) {
        recentShipments.removeRange(_maxRecentShipments, recentShipments.length);
      }
      
      // Save to SharedPreferences
      final jsonString = jsonEncode(recentShipments);
      await prefs.setString(_recentShipmentsKey, jsonString);
      
      print('✅ [RecentShipments] Added shipment: $shipmentId, Total: ${recentShipments.length}');
    } catch (e) {
      print('❌ [RecentShipments] Error adding shipment: $e');
    }
  }
  
  /// Get list of recent shipments
  static Future<List<Map<String, dynamic>>> getRecentShipments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_recentShipmentsKey);
      
      if (jsonString == null || jsonString.isEmpty) {
        return [];
      }
      
      final List<dynamic> decoded = jsonDecode(jsonString);
      final List<Map<String, dynamic>> shipments = decoded
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      
      print('📋 [RecentShipments] Retrieved ${shipments.length} recent shipments');
      return shipments;
    } catch (e) {
      print('❌ [RecentShipments] Error getting shipments: $e');
      return [];
    }
  }
  
  /// Clear all recent shipments
  static Future<void> clearRecentShipments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_recentShipmentsKey);
      print('🗑️ [RecentShipments] Cleared all recent shipments');
    } catch (e) {
      print('❌ [RecentShipments] Error clearing shipments: $e');
    }
  }
}
