import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// مدير الـ Cache المركزي للتطبيق
/// يوفر تخزين مؤقت في الذاكرة مع دعم TTL وتخزين دائم
class CacheManager {
  // Singleton instance
  static final CacheManager _instance = CacheManager._internal();
  factory CacheManager() => _instance;
  CacheManager._internal();

  // In-memory cache
  final Map<String, _CacheEntry> _memoryCache = {};

  // Cache keys constants
  static const String keyAllShipments = 'all_shipments';
  static const String keyExportShipments = 'export_shipments';
  static const String keyImportShipments = 'import_shipments';
  static const String keyUcrRequests = 'ucr_requests';
  static const String keyAcidRequests = 'acid_requests';
  static const String keyInvoices = 'invoices';
  static const String keyPayments = 'payments';
  static const String keyWalletBalance = 'wallet_balance';
  static const String keyUserProfile = 'user_profile';
  static const String keyNotifications = 'notifications';

  // Default TTL values (in minutes)
  static const int ttlShort = 2; // 2 minutes - for frequently changing data
  static const int ttlMedium = 5; // 5 minutes - for shipments, etc.
  static const int ttlLong = 15; // 15 minutes - for relatively static data
  static const int ttlVeryLong = 60; // 1 hour - for rarely changing data

  /// Get data from cache
  /// Returns null if not found or expired
  T? get<T>(String key) {
    final entry = _memoryCache[key];
    if (entry == null) {
      print('📦 [CacheManager] MISS: $key (not found)');
      return null;
    }

    if (entry.isExpired) {
      print('📦 [CacheManager] MISS: $key (expired)');
      _memoryCache.remove(key);
      return null;
    }

    print('📦 [CacheManager] HIT: $key');
    return entry.data as T?;
  }

  /// Set data in cache with TTL
  void set<T>(String key, T data, {int ttlMinutes = ttlMedium}) {
    _memoryCache[key] = _CacheEntry(
      data: data,
      expiresAt: DateTime.now().add(Duration(minutes: ttlMinutes)),
    );
    print('📦 [CacheManager] SET: $key (TTL: ${ttlMinutes}min)');
  }

  /// Check if cache has valid data for key
  bool has(String key) {
    final entry = _memoryCache[key];
    if (entry == null) return false;
    if (entry.isExpired) {
      _memoryCache.remove(key);
      return false;
    }
    return true;
  }

  /// Invalidate specific cache key
  void invalidate(String key) {
    _memoryCache.remove(key);
    print('📦 [CacheManager] INVALIDATE: $key');
  }

  /// Invalidate cache keys matching pattern
  void invalidatePattern(String pattern) {
    final keysToRemove =
        _memoryCache.keys.where((key) => key.contains(pattern)).toList();
    for (final key in keysToRemove) {
      _memoryCache.remove(key);
    }
    print(
      '📦 [CacheManager] INVALIDATE PATTERN: $pattern (${keysToRemove.length} keys)',
    );
  }

  /// Invalidate all shipment-related caches
  void invalidateShipments() {
    invalidatePattern('shipment');
    invalidate(keyAllShipments);
    invalidate(keyExportShipments);
    invalidate(keyImportShipments);
    print('📦 [CacheManager] All shipment caches invalidated');
  }

  /// Invalidate all payment-related caches
  void invalidatePayments() {
    invalidate(keyInvoices);
    invalidate(keyPayments);
    invalidate(keyWalletBalance);
    print('📦 [CacheManager] All payment caches invalidated');
  }

  /// Clear all cache
  void clearAll() {
    _memoryCache.clear();
    print('📦 [CacheManager] ALL CACHE CLEARED');
  }

  /// Get cache statistics
  Map<String, dynamic> getStats() {
    int validEntries = 0;
    int expiredEntries = 0;

    for (final entry in _memoryCache.values) {
      if (entry.isExpired) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      'totalEntries': _memoryCache.length,
      'validEntries': validEntries,
      'expiredEntries': expiredEntries,
      'keys': _memoryCache.keys.toList(),
    };
  }

  // ==================== Persistent Cache ====================

  /// Save data to persistent storage
  Future<void> saveToDisk(String key, dynamic data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonData = jsonEncode({
        'data': data,
        'savedAt': DateTime.now().toIso8601String(),
      });
      await prefs.setString('cache_$key', jsonData);
      print('💾 [CacheManager] Saved to disk: $key');
    } catch (e) {
      print('❌ [CacheManager] Error saving to disk: $e');
    }
  }

  /// Load data from persistent storage
  Future<T?> loadFromDisk<T>(String key, {int maxAgeMinutes = 60}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonData = prefs.getString('cache_$key');

      if (jsonData == null) {
        print('💾 [CacheManager] Disk MISS: $key (not found)');
        return null;
      }

      final decoded = jsonDecode(jsonData);
      final savedAt = DateTime.parse(decoded['savedAt']);

      if (DateTime.now().difference(savedAt).inMinutes > maxAgeMinutes) {
        print('💾 [CacheManager] Disk MISS: $key (expired)');
        await prefs.remove('cache_$key');
        return null;
      }

      print('💾 [CacheManager] Disk HIT: $key');
      return decoded['data'] as T?;
    } catch (e) {
      print('❌ [CacheManager] Error loading from disk: $e');
      return null;
    }
  }

  /// Remove data from persistent storage
  Future<void> removeFromDisk(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('cache_$key');
      print('💾 [CacheManager] Removed from disk: $key');
    } catch (e) {
      print('❌ [CacheManager] Error removing from disk: $e');
    }
  }

  /// Clear all persistent cache
  Future<void> clearDiskCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((key) => key.startsWith('cache_'));
      for (final key in keys) {
        await prefs.remove(key);
      }
      print('💾 [CacheManager] Disk cache cleared');
    } catch (e) {
      print('❌ [CacheManager] Error clearing disk cache: $e');
    }
  }
}

/// Internal cache entry with expiration
class _CacheEntry {
  final dynamic data;
  final DateTime expiresAt;

  _CacheEntry({required this.data, required this.expiresAt});

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}
