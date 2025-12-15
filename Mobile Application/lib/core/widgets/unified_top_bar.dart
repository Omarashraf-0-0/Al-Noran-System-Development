import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/user_cache_service.dart';

/// Unified TopBar widget for consistent UI across the app
/// This widget handles user data, profile photo, and navigation
/// Uses UserCacheService for efficient data loading
class UnifiedTopBar extends StatefulWidget {
  /// Optional title to display (defaults to user's first name)
  final String? title;

  /// Optional subtitle (defaults to user's email)
  final String? subtitle;

  /// Whether to show the notification icon
  final bool showNotification;

  /// Whether to show the menu icon
  final bool showMenu;

  /// Whether to show back button instead of menu
  final bool showBackButton;

  /// Custom callback for back button (defaults to context.pop)
  final VoidCallback? onBackPressed;

  /// Callback when menu is pressed
  final VoidCallback? onMenuPressed;

  /// Callback when notification is pressed
  final VoidCallback? onNotificationPressed;

  /// Callback when profile photo is pressed
  final VoidCallback? onProfilePressed;

  /// Whether to show the profile photo
  final bool showProfilePhoto;

  /// Custom height for the container
  final double? height;

  const UnifiedTopBar({
    super.key,
    this.title,
    this.subtitle,
    this.showNotification = true,
    this.showMenu = true,
    this.showBackButton = false,
    this.onBackPressed,
    this.onMenuPressed,
    this.onNotificationPressed,
    this.onProfilePressed,
    this.showProfilePhoto = true,
    this.height,
  });

  @override
  State<UnifiedTopBar> createState() => _UnifiedTopBarState();
}

class _UnifiedTopBarState extends State<UnifiedTopBar> {
  static const Color primaryDark = Color(0xFF690000);
  static const Color accentColor = Color(0xFF1ba3b6);

  final UserCacheService _userCache = UserCacheService();
  StreamSubscription? _userDataSubscription;

  String _userName = '';
  String _userEmail = '';
  String? _profilePhotoUrl;
  bool _isLoadingPhoto = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();

    // Listen to user data updates
    _userDataSubscription = _userCache.userDataStream.listen((_) {
      if (mounted) {
        _updateFromCache();
      }
    });
  }

  @override
  void dispose() {
    _userDataSubscription?.cancel();
    super.dispose();
  }

  void _updateFromCache() {
    setState(() {
      _userName = _userCache.userName;
      _userEmail = _userCache.userEmail;
      _profilePhotoUrl = _userCache.profilePhotoUrl;
      _isLoadingPhoto = false;
    });
  }

  Future<void> _loadUserData() async {
    // First, check if cache is already initialized
    if (_userCache.isInitialized) {
      _updateFromCache();
      return;
    }

    // If not initialized, initialize it
    await _userCache.initialize();
    if (mounted) {
      _updateFromCache();
    }
  }

  String get _displayTitle {
    if (widget.title != null) return widget.title!;
    return _userName.split(' ').first;
  }

  String get _displaySubtitle {
    if (widget.subtitle != null) return widget.subtitle!;
    return _userEmail;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: primaryDark,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(25),
          bottomRight: Radius.circular(25),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Left side: Profile Photo & Notification (RTL: right side)
            Row(
              children: [
                if (widget.showProfilePhoto) ...[
                  _buildProfilePhoto(),
                  const SizedBox(width: 8),
                ],
                if (widget.showNotification) _buildNotificationButton(),
              ],
            ),

            // Center: Title & Subtitle
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _displayTitle,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                if (_displaySubtitle.isNotEmpty)
                  Text(
                    _displaySubtitle,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontFamily: 'Cairo',
                    ),
                  ),
              ],
            ),

            // Right side: Menu or Back Button (RTL: left side)
            if (widget.showBackButton)
              _buildBackButton()
            else if (widget.showMenu)
              _buildMenuButton()
            else
              const SizedBox(width: 48), // Spacer for alignment
          ],
        ),
      ),
    );
  }

  Widget _buildProfilePhoto() {
    return InkWell(
      onTap: widget.onProfilePressed ?? () => context.push('/profile'),
      borderRadius: BorderRadius.circular(50),
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
        ),
        child:
            _isLoadingPhoto
                ? const CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.white,
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: primaryDark,
                    ),
                  ),
                )
                : _profilePhotoUrl != null
                ? CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.white,
                  child: ClipOval(
                    child: Image.network(
                      _profilePhotoUrl!,
                      width: 40,
                      height: 40,
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: primaryDark,
                          ),
                        );
                      },
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(
                          Icons.person,
                          color: primaryDark,
                          size: 24,
                        );
                      },
                    ),
                  ),
                )
                : const CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.white,
                  child: Icon(Icons.person, color: primaryDark, size: 24),
                ),
      ),
    );
  }

  Widget _buildNotificationButton() {
    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: IconButton(
            icon: const Icon(
              Icons.notifications,
              color: Colors.white,
              size: 24,
            ),
            onPressed: widget.onNotificationPressed ?? () {},
          ),
        ),
        Positioned(
          right: 8,
          top: 8,
          child: Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: accentColor,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMenuButton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: IconButton(
        icon: const Icon(Icons.menu, color: Colors.white, size: 26),
        onPressed: widget.onMenuPressed,
      ),
    );
  }

  Widget _buildBackButton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: IconButton(
        icon: const Icon(Icons.arrow_forward, color: Colors.white, size: 26),
        onPressed:
            widget.onBackPressed ??
            () {
              if (GoRouter.of(context).canPop()) {
                context.pop();
              } else {
                context.go('/home');
              }
            },
      ),
    );
  }
}

/// Simplified TopBar for internal pages (with back button)
class SimpleTopBar extends StatelessWidget {
  final String title;
  final String? subtitle;
  final VoidCallback? onBackPressed;
  final List<Widget>? actions;

  const SimpleTopBar({
    super.key,
    required this.title,
    this.subtitle,
    this.onBackPressed,
    this.actions,
  });

  static const Color primaryDark = Color(0xFF690000);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: primaryDark,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(25),
          bottomRight: Radius.circular(25),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Actions (on the right in RTL)
            if (actions != null && actions!.isNotEmpty)
              Row(children: actions!)
            else
              const SizedBox(width: 48),

            // Title & Subtitle
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontFamily: 'Cairo',
                      ),
                      textAlign: TextAlign.center,
                    ),
                ],
              ),
            ),

            // Back Button (on the left in RTL)
            Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: IconButton(
                icon: const Icon(
                  Icons.arrow_forward,
                  color: Colors.white,
                  size: 26,
                ),
                onPressed:
                    onBackPressed ??
                    () {
                      if (GoRouter.of(context).canPop()) {
                        GoRouter.of(context).pop();
                      } else {
                        GoRouter.of(context).go('/home');
                      }
                    },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
