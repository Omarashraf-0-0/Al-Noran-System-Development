import 'dart:async';
import '../network/api_service.dart';
import '../storage/secure_storage.dart';

/// Singleton service for caching user data in memory
/// This prevents repeated API calls and improves performance
class UserCacheService {
  // Singleton instance
  static final UserCacheService _instance = UserCacheService._internal();
  factory UserCacheService() => _instance;
  UserCacheService._internal();

  // Cached data
  String? _userName;
  String? _userEmail;
  String? _profilePhotoUrl;
  String? _userId;
  Map<String, dynamic>? _fullUserData;

  // Loading state
  bool _isLoading = false;
  bool _isInitialized = false;

  // Stream controller for notifying listeners of updates
  final _userDataController =
      StreamController<Map<String, dynamic>?>.broadcast();
  Stream<Map<String, dynamic>?> get userDataStream =>
      _userDataController.stream;

  // Getters
  String get userName => _userName ?? '';
  String get userEmail => _userEmail ?? '';
  String? get profilePhotoUrl => _profilePhotoUrl;
  String? get userId => _userId;
  Map<String, dynamic>? get fullUserData => _fullUserData;
  bool get isInitialized => _isInitialized;
  bool get isLoading => _isLoading;

  /// Initialize the cache with user data
  /// Call this once after login
  Future<void> initialize({bool forceRefresh = false}) async {
    if (_isInitialized && !forceRefresh) {
      print('📦 [UserCache] Already initialized, skipping...');
      return;
    }

    if (_isLoading) {
      print('📦 [UserCache] Already loading, skipping...');
      return;
    }

    _isLoading = true;
    print('📦 [UserCache] Initializing user cache...');

    try {
      // First, load from local storage (fast)
      final localData = await SecureStorage.getUserData();
      if (localData != null) {
        _updateFromData(localData);
        print('📦 [UserCache] Loaded from storage: $_userName');
      }

      // Then, fetch fresh data from API (slower but more accurate)
      final response = await ApiService.getUserProfile();
      if (response['success'] == true && response['user'] != null) {
        final user = response['user'];
        _updateFromData(user);
        _profilePhotoUrl = user['profilePhotoUrl'];
        print(
          '📦 [UserCache] Updated from API: $_userName, photo: $_profilePhotoUrl',
        );
      }

      _isInitialized = true;
      _userDataController.add(_fullUserData);
    } catch (e) {
      print('❌ [UserCache] Error initializing: $e');
    } finally {
      _isLoading = false;
    }
  }

  void _updateFromData(Map<String, dynamic> data) {
    _fullUserData = data;
    _userName = data['fullname'] ?? data['username'] ?? '';
    _userEmail = data['email'] ?? '';
    _userId = data['_id'] ?? data['id'];
    _profilePhotoUrl = data['profilePhotoUrl'] ?? _profilePhotoUrl;
  }

  /// Update profile photo URL
  void updateProfilePhoto(String? url) {
    _profilePhotoUrl = url;
    _userDataController.add(_fullUserData);
    print('📦 [UserCache] Profile photo updated: $url');
  }

  /// Refresh user data from API
  Future<void> refresh() async {
    print('📦 [UserCache] Refreshing user data...');
    await initialize(forceRefresh: true);
  }

  /// Clear all cached data (call on logout)
  void clear() {
    _userName = null;
    _userEmail = null;
    _profilePhotoUrl = null;
    _userId = null;
    _fullUserData = null;
    _isInitialized = false;
    _userDataController.add(null);
    print('📦 [UserCache] Cache cleared');
  }

  /// Get cached data synchronously (returns empty if not initialized)
  Map<String, dynamic> getCachedData() {
    return {
      'userName': _userName ?? '',
      'userEmail': _userEmail ?? '',
      'profilePhotoUrl': _profilePhotoUrl,
      'userId': _userId,
      'isInitialized': _isInitialized,
    };
  }

  /// Dispose the stream controller
  void dispose() {
    _userDataController.close();
  }
}
