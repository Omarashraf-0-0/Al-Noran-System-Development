import 'package:google_sign_in/google_sign_in.dart';

/// Service to handle Google Sign-In functionality
class GoogleSignInService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
    ],
  );

  /// Sign in with Google
  /// Returns user info map on success, null on failure/cancel
  static Future<Map<String, dynamic>?> signIn() async {
    try {
      // Sign out first to ensure account picker shows
      await _googleSignIn.signOut();
      
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      
      if (account == null) {
        print('🔐 [GoogleSignIn] User cancelled sign in');
        return null;
      }

      print('🔐 [GoogleSignIn] Signed in: ${account.email}');
      
      // Get authentication tokens
      final GoogleSignInAuthentication auth = await account.authentication;
      
      return {
        'email': account.email,
        'displayName': account.displayName ?? '',
        'photoUrl': account.photoUrl ?? '',
        'id': account.id,
        'idToken': auth.idToken,
        'accessToken': auth.accessToken,
      };
    } catch (e) {
      print('❌ [GoogleSignIn] Error: $e');
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
