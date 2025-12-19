import 'dart:async';
import '../network/api_service.dart';

/// Singleton service for caching shipments data in memory
/// This prevents repeated API calls and improves performance
class ShipmentsCacheService {
  // Singleton instance
  static final ShipmentsCacheService _instance =
      ShipmentsCacheService._internal();
  factory ShipmentsCacheService() => _instance;
  ShipmentsCacheService._internal();

  // Cached data
  List<Map<String, dynamic>> _allShipments = [];
  Map<String, Map<String, dynamic>> _shipmentDetailsCache = {};
  Map<String, List<Map<String, dynamic>>> _requiredDocumentsCache = {};

  // Loading state
  bool _isLoading = false;
  bool _isInitialized = false;
  DateTime? _lastFetchTime;

  // Cache duration (5 minutes)
  static const Duration _cacheDuration = Duration(minutes: 5);

  // Stream controller for notifying listeners of updates
  final _shipmentsController =
      StreamController<List<Map<String, dynamic>>>.broadcast();
  Stream<List<Map<String, dynamic>>> get shipmentsStream =>
      _shipmentsController.stream;

  // Getters
  List<Map<String, dynamic>> get allShipments => _allShipments;
  bool get isInitialized => _isInitialized;
  bool get isLoading => _isLoading;

  /// Check if cache is stale
  bool get _isCacheStale {
    if (_lastFetchTime == null) return true;
    return DateTime.now().difference(_lastFetchTime!) > _cacheDuration;
  }

  /// Get all shipments (from cache or API)
  Future<List<Map<String, dynamic>>> getAllShipments({
    bool forceRefresh = false,
  }) async {
    // Return cached data if available and not stale
    if (_isInitialized &&
        !forceRefresh &&
        !_isCacheStale &&
        _allShipments.isNotEmpty) {
      print(
        '📦 [ShipmentsCache] Returning ${_allShipments.length} cached shipments',
      );
      return _allShipments;
    }

    // Prevent multiple simultaneous fetches
    if (_isLoading) {
      print('📦 [ShipmentsCache] Already loading, waiting...');
      // Wait for current fetch to complete
      await Future.delayed(const Duration(milliseconds: 100));
      return _allShipments;
    }

    _isLoading = true;
    print('📦 [ShipmentsCache] Fetching shipments from API...');

    try {
      final response = await ApiService.getAllShipments();

      if (response['success'] == true) {
        _allShipments = List<Map<String, dynamic>>.from(
          response['shipments'] ?? [],
        );
        _lastFetchTime = DateTime.now();
        _isInitialized = true;
        _shipmentsController.add(_allShipments);
        print('📦 [ShipmentsCache] Cached ${_allShipments.length} shipments');
      }
    } catch (e) {
      print('❌ [ShipmentsCache] Error fetching shipments: $e');
    } finally {
      _isLoading = false;
    }

    return _allShipments;
  }

  /// Get shipment by ACID (from cache or API)
  Future<Map<String, dynamic>?> getShipmentByAcid(
    String acid, {
    bool forceRefresh = false,
  }) async {
    // Check cache first
    if (!forceRefresh && _shipmentDetailsCache.containsKey(acid)) {
      print('📦 [ShipmentsCache] Returning cached shipment: $acid');
      return _shipmentDetailsCache[acid];
    }

    print('📦 [ShipmentsCache] Fetching shipment $acid from API...');

    try {
      final response = await ApiService.getShipmentByAcid(acid: acid);

      if (response['success'] == true && response['shipment'] != null) {
        final shipment = response['shipment'] as Map<String, dynamic>;
        _shipmentDetailsCache[acid] = shipment;
        print('📦 [ShipmentsCache] Cached shipment: $acid');
        return shipment;
      }
    } catch (e) {
      print('❌ [ShipmentsCache] Error fetching shipment $acid: $e');
    }

    return null;
  }

  /// Get required documents for a shipment (from cache or API)
  Future<List<Map<String, dynamic>>> getRequiredDocuments(
    String shipmentId, {
    bool forceRefresh = false,
  }) async {
    // Check cache first
    if (!forceRefresh && _requiredDocumentsCache.containsKey(shipmentId)) {
      print('📋 [ShipmentsCache] Returning cached documents for: $shipmentId');
      return _requiredDocumentsCache[shipmentId]!;
    }

    print('📋 [ShipmentsCache] Fetching documents for $shipmentId from API...');

    try {
      final response = await ApiService.getRequiredDocuments(
        shipmentId: shipmentId,
      );

      if (response['success'] == true) {
        final docs = List<Map<String, dynamic>>.from(
          response['requiredDocuments'] ?? [],
        );

        // Fetch file details for uploaded documents
        for (var doc in docs) {
          if (doc['uploaded'] == true && doc['fileId'] != null) {
            final fileId = doc['fileId'].toString();
            try {
              final fileResponse = await ApiService.getUploadById(
                uploadId: fileId,
              );
              if (fileResponse['success'] == true &&
                  fileResponse['upload'] != null) {
                doc['uploadData'] = fileResponse['upload'];
              }
            } catch (e) {
              print('❌ [ShipmentsCache] Error fetching file $fileId: $e');
            }
          }
        }

        _requiredDocumentsCache[shipmentId] = docs;
        print(
          '📋 [ShipmentsCache] Cached ${docs.length} documents for: $shipmentId',
        );
        return docs;
      }
    } catch (e) {
      print('❌ [ShipmentsCache] Error fetching documents: $e');
    }

    return [];
  }

  /// Invalidate documents cache for a shipment (call after upload)
  void invalidateDocumentsCache(String shipmentId) {
    _requiredDocumentsCache.remove(shipmentId);
    print('📋 [ShipmentsCache] Invalidated documents cache for: $shipmentId');
  }

  /// Invalidate shipment cache
  void invalidateShipmentCache(String acid) {
    _shipmentDetailsCache.remove(acid);
    print('📦 [ShipmentsCache] Invalidated shipment cache for: $acid');
  }

  /// Update a specific shipment's status in cache (called when notification is received)
  void updateShipmentStatus(String acid, String newStatus) {
    // Update in all shipments list
    for (var i = 0; i < _allShipments.length; i++) {
      if (_allShipments[i]['acid'] == acid) {
        _allShipments[i]['status'] = newStatus;
        _allShipments[i]['updatedAt'] = DateTime.now().toIso8601String();
        print('📦 [ShipmentsCache] Updated status for $acid to: $newStatus');
        break;
      }
    }

    // Update in details cache
    if (_shipmentDetailsCache.containsKey(acid)) {
      _shipmentDetailsCache[acid]!['status'] = newStatus;
      _shipmentDetailsCache[acid]!['updatedAt'] =
          DateTime.now().toIso8601String();
    }

    // Notify listeners
    _shipmentsController.add(_allShipments);
  }

  /// Force refresh a specific shipment by ACID
  Future<void> refreshShipment(String acid) async {
    print('📦 [ShipmentsCache] Force refreshing shipment: $acid');
    _shipmentDetailsCache.remove(acid);
    await getShipmentByAcid(acid, forceRefresh: true);
    // Also refresh the main list
    await getAllShipments(forceRefresh: true);
  }

  /// Refresh all caches
  Future<void> refresh() async {
    print('📦 [ShipmentsCache] Refreshing all caches...');
    _shipmentDetailsCache.clear();
    _requiredDocumentsCache.clear();
    await getAllShipments(forceRefresh: true);
  }

  /// Clear all cached data (call on logout)
  void clear() {
    _allShipments = [];
    _shipmentDetailsCache.clear();
    _requiredDocumentsCache.clear();
    _isInitialized = false;
    _lastFetchTime = null;
    _shipmentsController.add([]);
    print('📦 [ShipmentsCache] Cache cleared');
  }

  /// Get recent shipments (last 3)
  List<Map<String, dynamic>> getRecentShipments() {
    return _allShipments.take(3).toList();
  }

  /// Get shipment statistics
  Map<String, int> getStatistics() {
    return {
      'totalShipments': _allShipments.length,
      'activeShipments':
          _allShipments.where((s) => s['status'] != 'تمت بنجاح').length,
      'completedShipments':
          _allShipments.where((s) => s['status'] == 'تمت بنجاح').length,
    };
  }

  /// Dispose the stream controller
  void dispose() {
    _shipmentsController.close();
  }
}
