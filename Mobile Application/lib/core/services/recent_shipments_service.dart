import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Service to track and manage recently viewed shipments
/// Stores the last 3 shipments (import or export) that the user opened
/// Each user has their own separate recent shipments list
class RecentShipmentsService {
  static const String _recentShipmentsKeyPrefix = 'recent_shipments_';
  static const int _maxRecentShipments = 3;
  static const _secureStorage = FlutterSecureStorage();

  /// Get current user ID from secure storage
  static Future<String?> _getCurrentUserId() async {
    try {
      final userId = await _secureStorage.read(key: 'user_id');
      return userId;
    } catch (e) {
      print('❌ [RecentShipments] Error getting user ID: $e');
      return null;
    }
  }

  /// Get storage key for current user
  static Future<String> _getStorageKey() async {
    final userId = await _getCurrentUserId();
    return '${_recentShipmentsKeyPrefix}${userId ?? 'anonymous'}';
  }

  /// Add a shipment to recent list
  /// Maintains a max of 3 shipments, most recent first
  static Future<void> addRecentShipment(Map<String, dynamic> shipment) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storageKey = await _getStorageKey();

      // Get existing recent shipments for this user
      final List<Map<String, dynamic>> recentShipments =
          await getRecentShipments();

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
        recentShipments.removeRange(
          _maxRecentShipments,
          recentShipments.length,
        );
      }

      // Save to SharedPreferences with user-specific key
      final jsonString = jsonEncode(recentShipments);
      await prefs.setString(storageKey, jsonString);

      print(
        '✅ [RecentShipments] Added shipment: $shipmentId for user, Total: ${recentShipments.length}',
      );
    } catch (e) {
      print('❌ [RecentShipments] Error adding shipment: $e');
    }
  }

  /// Get list of recent shipments for current user
  static Future<List<Map<String, dynamic>>> getRecentShipments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storageKey = await _getStorageKey();
      final jsonString = prefs.getString(storageKey);

      if (jsonString == null || jsonString.isEmpty) {
        return [];
      }

      final List<dynamic> decoded = jsonDecode(jsonString);
      final List<Map<String, dynamic>> shipments =
          decoded.map((item) => Map<String, dynamic>.from(item)).toList();

      print(
        '📋 [RecentShipments] Retrieved ${shipments.length} recent shipments for user',
      );
      return shipments;
    } catch (e) {
      print('❌ [RecentShipments] Error getting shipments: $e');
      return [];
    }
  }

  /// Clear all recent shipments for current user
  static Future<void> clearRecentShipments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storageKey = await _getStorageKey();
      await prefs.remove(storageKey);
      print('🗑️ [RecentShipments] Cleared recent shipments for user');
    } catch (e) {
      print('❌ [RecentShipments] Error clearing shipments: $e');
    }
  }

  /// Clear recent shipments for all users (used on logout)
  static Future<void> clearAllUsersRecentShipments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final allKeys = prefs.getKeys();
      for (final key in allKeys) {
        if (key.startsWith(_recentShipmentsKeyPrefix)) {
          await prefs.remove(key);
        }
      }
      print('🗑️ [RecentShipments] Cleared all users recent shipments');
    } catch (e) {
      print('❌ [RecentShipments] Error clearing all shipments: $e');
    }
  }
}
