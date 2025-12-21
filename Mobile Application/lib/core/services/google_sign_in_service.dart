import 'package:google_sign_in/google_sign_in.dart';

/// Service to handle Google Sign-In functionality
class GoogleSignInService {
  // Web Client ID from Firebase (client_type: 3)
  static const String _webClientId =
      '91905603876-37179v7mfmf99gtjjdn1cua8v9l295el.apps.googleusercontent.com';

  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId: _webClientId,
  );

  /// Sign in with Google
  /// Returns user info map on success, null on failure/cancel
  static Future<Map<String, dynamic>?> signIn() async {
    try {
      print('🔐 [GoogleSignIn] Starting sign in...');

      // Sign out first to ensure account picker shows
      await _googleSignIn.signOut();
      print('🔐 [GoogleSignIn] Signed out previous session');

      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      print('🔐 [GoogleSignIn] Sign in completed, account: $account');

      if (account == null) {
        print('🔐 [GoogleSignIn] User cancelled sign in');
        return null;
      }

      print('🔐 [GoogleSignIn] Signed in successfully!');
      print('🔐 [GoogleSignIn] Email: ${account.email}');
      print('🔐 [GoogleSignIn] Display Name: ${account.displayName}');
      print('🔐 [GoogleSignIn] ID: ${account.id}');

      // Get authentication tokens
      print('🔐 [GoogleSignIn] Getting authentication tokens...');
      final GoogleSignInAuthentication auth = await account.authentication;
      print(
        '🔐 [GoogleSignIn] ID Token: ${auth.idToken != null ? "EXISTS" : "NULL"}',
      );
      print(
        '🔐 [GoogleSignIn] Access Token: ${auth.accessToken != null ? "EXISTS" : "NULL"}',
      );

      final userData = {
        'email': account.email,
        'displayName': account.displayName ?? '',
        'photoUrl': account.photoUrl ?? '',
        'id': account.id,
        'idToken': auth.idToken,
        'accessToken': auth.accessToken,
      };

      print('🔐 [GoogleSignIn] Returning user data: $userData');
      return userData;
    } catch (e, stackTrace) {
      print('❌ [GoogleSignIn] Error: $e');
      print('❌ [GoogleSignIn] Stack trace: $stackTrace');
      return null;
    }
  }

  /// Sign out from Google
  static Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      print('🔐 [GoogleSignIn] Signed out');
    } catch (e) {
      print('❌ [GoogleSignIn] Sign out error: $e');
    }
  }

  /// Check if user is currently signed in
  static Future<bool> isSignedIn() async {
    return await _googleSignIn.isSignedIn();
  }

  /// Get current signed in account
  static GoogleSignInAccount? get currentUser => _googleSignIn.currentUser;
}
