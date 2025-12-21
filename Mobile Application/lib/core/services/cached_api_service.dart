import 'dart:async';
import '../network/api_service.dart';
import 'cache_manager.dart';

/// خدمة API مع التخزين المؤقت (Cache)
/// تقلل من عدد الطلبات للسيرفر وتحسن الأداء بشكل كبير
class CachedApiService {
  // Singleton instance
  static final CachedApiService _instance = CachedApiService._internal();
  factory CachedApiService() => _instance;
  CachedApiService._internal();

  // Cache Manager
  final CacheManager _cache = CacheManager();

  // Loading flags to prevent duplicate requests
  final Map<String, bool> _loadingFlags = {};

  // ==================== Shipments APIs ====================

  /// جلب جميع الشحنات (الواردات)
  Future<Map<String, dynamic>> getAllShipments({
    bool forceRefresh = false,
  }) async {
    const key = CacheManager.keyAllShipments;

    // Return cached data if available and not forcing refresh
    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    // Prevent duplicate requests
    if (_loadingFlags[key] == true) {
      print('⏳ [CachedAPI] Already loading $key, waiting...');
      await Future.delayed(const Duration(milliseconds: 200));
      final cached = _cache.get<Map<String, dynamic>>(key);
      return cached ?? {'success': false, 'message': 'Still loading...'};
    }

    _loadingFlags[key] = true;
    print('🌐 [CachedAPI] Fetching $key from server...');

    try {
      final response = await ApiService.getAllShipments();
      if (response['success'] == true) {
        _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
        // Also save to disk for offline access
        await _cache.saveToDisk(key, response);
      }
      return response;
    } finally {
      _loadingFlags[key] = false;
    }
  }

  /// جلب شحنات التصدير
  Future<Map<String, dynamic>> getMyExportShipments({
    bool forceRefresh = false,
  }) async {
    const key = CacheManager.keyExportShipments;

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    if (_loadingFlags[key] == true) {
      print('⏳ [CachedAPI] Already loading $key, waiting...');
      await Future.delayed(const Duration(milliseconds: 200));
      final cached = _cache.get<Map<String, dynamic>>(key);
      return cached ?? {'success': false, 'message': 'Still loading...'};
    }

    _loadingFlags[key] = true;
    print('🌐 [CachedAPI] Fetching $key from server...');

    try {
      final response = await ApiService.getMyExportShipments();
      if (response['success'] == true) {
        _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
        await _cache.saveToDisk(key, response);
      }
      return response;
    } finally {
      _loadingFlags[key] = false;
    }
  }

  /// جلب تفاصيل شحنة بـ ACID
  Future<Map<String, dynamic>> getShipmentByAcid({
    required String acid,
    bool forceRefresh = false,
  }) async {
    final key = 'shipment_$acid';

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching shipment $acid from server...');
    final response = await ApiService.getShipmentByAcid(acid: acid);

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
    }
    return response;
  }

  /// جلب تفاصيل شحنة تصدير بـ ID
  Future<Map<String, dynamic>> getExportShipmentById({
    required String shipmentId,
    bool forceRefresh = false,
  }) async {
    final key = 'export_shipment_$shipmentId';

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching export shipment $shipmentId from server...');
    final response = await ApiService.getExportShipmentById(id: shipmentId);

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
    }
    return response;
  }

  /// جلب المستندات المطلوبة
  Future<Map<String, dynamic>> getRequiredDocuments({
    required String shipmentId,
    bool forceRefresh = false,
  }) async {
    final key = 'docs_$shipmentId';

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching documents for $shipmentId from server...');
    final response = await ApiService.getRequiredDocuments(
      shipmentId: shipmentId,
    );

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlShort);
    }
    return response;
  }

  /// جلب مستندات التصدير المطلوبة
  Future<Map<String, dynamic>> getExportRequiredDocuments({
    required String shipmentId,
    bool forceRefresh = false,
  }) async {
    final key = 'export_docs_$shipmentId';

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print(
      '🌐 [CachedAPI] Fetching export documents for $shipmentId from server...',
    );
    final response = await ApiService.getExportRequiredDocuments(
      shipmentId: shipmentId,
    );

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlShort);
    }
    return response;
  }

  // ==================== UCR & ACID APIs ====================

  /// جلب طلبات UCR
  Future<Map<String, dynamic>> getMyUcrRequests({
    bool forceRefresh = false,
  }) async {
    const key = CacheManager.keyUcrRequests;

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching UCR requests from server...');
    final response = await ApiService.getMyUcrRequests();

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
    }
    return response;
  }

  /// جلب طلبات ACID
  Future<Map<String, dynamic>> getAllAcidRequests({
    bool forceRefresh = false,
  }) async {
    const key = CacheManager.keyAcidRequests;

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching ACID requests from server...');
    final response = await ApiService.getAllAcidRequests();

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
    }
    return response;
  }

  /// جلب تفاصيل طلب UCR
  Future<Map<String, dynamic>> getUcrRequestById({
    required String ucrId,
    bool forceRefresh = false,
  }) async {
    final key = 'ucr_$ucrId';

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching UCR $ucrId from server...');
    final response = await ApiService.getUcrRequestById(id: ucrId);

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
    }
    return response;
  }

  // ==================== Payments APIs ====================

  /// جلب الفواتير
  Future<Map<String, dynamic>> getMyInvoices({
    bool forceRefresh = false,
  }) async {
    const key = CacheManager.keyInvoices;

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching invoices from server...');
    final response = await ApiService.getMyInvoices();

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
    }
    return response;
  }

  /// جلب المدفوعات
  Future<Map<String, dynamic>> getMyPayments({
    bool forceRefresh = false,
  }) async {
    const key = CacheManager.keyPayments;

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching payments from server...');
    final response = await ApiService.getMyPayments();

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
    }
    return response;
  }

  /// جلب رصيد المحفظة
  Future<Map<String, dynamic>> getWalletBalance({
    bool forceRefresh = false,
  }) async {
    const key = CacheManager.keyWalletBalance;

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching wallet balance from server...');
    final response = await ApiService.getWalletBalance();

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlShort);
    }
    return response;
  }

  // ==================== User Profile APIs ====================

  /// جلب بيانات المستخدم
  Future<Map<String, dynamic>> getUserProfile({
    bool forceRefresh = false,
  }) async {
    const key = CacheManager.keyUserProfile;

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching user profile from server...');
    final response = await ApiService.getUserProfile();

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlLong);
    }
    return response;
  }

  /// جلب المستندات المرفوعة
  Future<Map<String, dynamic>> getUploads({
    required String userId,
    String? category,
    bool forceRefresh = false,
  }) async {
    final key = 'uploads_${category ?? ''}_$userId';

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching uploads from server...');
    final response = await ApiService.getUploads(
      userId: userId,
      category: category,
    );

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlMedium);
    }
    return response;
  }

  /// جلب تفاصيل ملف مرفوع بـ ID
  Future<Map<String, dynamic>> getUploadById({
    required String uploadId,
    bool forceRefresh = false,
  }) async {
    final key = 'upload_$uploadId';

    if (!forceRefresh) {
      final cached = _cache.get<Map<String, dynamic>>(key);
      if (cached != null) {
        return cached;
      }
    }

    print('🌐 [CachedAPI] Fetching upload $uploadId from server...');
    final response = await ApiService.getUploadById(uploadId: uploadId);

    if (response['success'] == true) {
      _cache.set(key, response, ttlMinutes: CacheManager.ttlLong);
    }
    return response;
  }

  /// جلب تفاصيل عدة ملفات بالتوازي (أسرع بكثير)
  Future<Map<String, Map<String, dynamic>>> getMultipleUploadsById({
    required List<String> uploadIds,
    bool forceRefresh = false,
  }) async {
    final results = <String, Map<String, dynamic>>{};
    final idsToFetch = <String>[];

    // Check cache first
    for (final id in uploadIds) {
      if (!forceRefresh) {
        final cached = _cache.get<Map<String, dynamic>>('upload_$id');
        if (cached != null) {
          results[id] = cached;
          continue;
        }
      }
      idsToFetch.add(id);
    }

    if (idsToFetch.isEmpty) {
      print('📦 [CachedAPI] All ${uploadIds.length} uploads from cache');
      return results;
    }

    print(
      '🌐 [CachedAPI] Fetching ${idsToFetch.length} uploads in parallel...',
    );

    // Fetch remaining in parallel
    final futures = idsToFetch.map((id) => getUploadById(uploadId: id));
    final responses = await Future.wait(futures);

    for (var i = 0; i < idsToFetch.length; i++) {
      results[idsToFetch[i]] = responses[i];
    }

    return results;
  }

  // ==================== Cache Control ====================

  /// تحديث cache الشحنات بعد تعديل
  void invalidateShipmentCache(String? shipmentId) {
    _cache.invalidateShipments();
    if (shipmentId != null) {
      _cache.invalidate('shipment_$shipmentId');
      _cache.invalidate('export_shipment_$shipmentId');
      _cache.invalidate('docs_$shipmentId');
      _cache.invalidate('export_docs_$shipmentId');
    }
    print('🔄 [CachedAPI] Shipment cache invalidated');
  }

  /// تحديث cache المدفوعات بعد عملية دفع
  void invalidatePaymentCache() {
    _cache.invalidatePayments();
    print('🔄 [CachedAPI] Payment cache invalidated');
  }

  /// تحديث cache بيانات المستخدم
  void invalidateUserCache() {
    _cache.invalidate(CacheManager.keyUserProfile);
    _cache.invalidatePattern('uploads_');
    print('🔄 [CachedAPI] User cache invalidated');
  }

  /// مسح كل الـ cache
  void clearAllCache() {
    _cache.clearAll();
    print('🧹 [CachedAPI] All cache cleared');
  }

  /// الحصول على إحصائيات الـ cache
  Map<String, dynamic> getCacheStats() {
    return _cache.getStats();
  }

  // ==================== Prefetch Data ====================

  /// تحميل البيانات مسبقاً لتحسين الأداء
  /// يُستدعى بعد تسجيل الدخول مباشرة
  Future<void> prefetchData() async {
    print('🚀 [CachedAPI] Prefetching data...');

    // Load data in parallel
    await Future.wait([
      getAllShipments(),
      getMyExportShipments(),
      getUserProfile(),
      getMyInvoices(),
    ], eagerError: false);

    print('✅ [CachedAPI] Prefetch completed');
  }

  /// تحميل بيانات الصفحة الرئيسية
  Future<Map<String, List<Map<String, dynamic>>>> prefetchHomeData() async {
    print('🏠 [CachedAPI] Prefetching home data...');

    final results = await Future.wait([
      getAllShipments(),
      getMyExportShipments(),
    ]);

    final importShipments =
        results[0]['success'] == true
            ? List<Map<String, dynamic>>.from(results[0]['shipments'] ?? [])
            : <Map<String, dynamic>>[];

    final exportShipments =
        results[1]['success'] == true
            ? List<Map<String, dynamic>>.from(results[1]['shipments'] ?? [])
            : <Map<String, dynamic>>[];

    print(
      '✅ [CachedAPI] Home data prefetched: ${importShipments.length} imports, ${exportShipments.length} exports',
    );

    return {'imports': importShipments, 'exports': exportShipments};
  }
}
