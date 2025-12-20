import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../services/user_cache_service.dart';
import '../services/notification_service.dart';

/// Premium Unified TopBar widget for consistent UI across the app
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

  /// Whether to show welcome section (greeting + name)
  final bool showWelcome;

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
    this.showWelcome = true,
  });

  @override
  State<UnifiedTopBar> createState() => _UnifiedTopBarState();
}

class _UnifiedTopBarState extends State<UnifiedTopBar>
    with SingleTickerProviderStateMixin {
  // Premium Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accentColor = Color(0xFF1ba3b6);
  static const Color goldAccent = Color(0xFFD4AF37);

  final UserCacheService _userCache = UserCacheService();
  final NotificationService _notificationService = NotificationService();
  StreamSubscription? _userDataSubscription;
  StreamSubscription? _unreadCountSubscription;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  String _userName = '';
  String _userEmail = '';
  String? _profilePhotoUrl;
  bool _isLoadingPhoto = true;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _loadUnreadCount();

    // Pulse animation for notification badge
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Listen to user data updates
    _userDataSubscription = _userCache.userDataStream.listen((_) {
      if (mounted) _updateFromCache();
    });

    // Listen to unread count updates
    _unreadCountSubscription = _notificationService.unreadCountStream.listen((
      count,
    ) {
      if (mounted) setState(() => _unreadCount = count);
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _userDataSubscription?.cancel();
    _unreadCountSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadUnreadCount() async {
    if (_notificationService.isInitialized) {
      setState(() => _unreadCount = _notificationService.unreadCount);
    } else {
      final count = await _notificationService.fetchUnreadCount();
      if (mounted) setState(() => _unreadCount = count);
    }
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
    if (_userCache.isInitialized) {
      _updateFromCache();
      return;
    }
    await _userCache.initialize();
    if (mounted) _updateFromCache();
  }

  String get _displayTitle => widget.title ?? _userName.split(' ').first;
  String get _displaySubtitle => widget.subtitle ?? _userEmail;

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'صباح الخير';
    return 'مساء الخير';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            primaryDark,
            primaryLight,
            primaryDark.withValues(alpha: 0.95),
          ],
          stops: const [0.0, 0.5, 1.0],
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withValues(alpha: 0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Top Row: Actions
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Left: Profile & Notification
                      Row(
                        children: [
                          if (widget.showProfilePhoto) _buildProfilePhoto(),
                          if (widget.showProfilePhoto &&
                              widget.showNotification)
                            const SizedBox(width: 12),
                          if (widget.showNotification)
                            _buildNotificationButton(),
                          // Show title in center when no welcome section
                          if (!widget.showWelcome &&
                              !widget.showProfilePhoto) ...[
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.title ?? '',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                                if (widget.subtitle != null &&
                                    widget.subtitle!.isNotEmpty)
                                  Text(
                                    widget.subtitle!,
                                    style: TextStyle(
                                      color: Colors.white.withValues(
                                        alpha: 0.7,
                                      ),
                                      fontSize: 13,
                                      fontFamily: 'Cairo',
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ],
                      ),

                      // Right: Menu or Back
                      if (widget.showBackButton)
                        _buildBackButton()
                      else if (widget.showMenu)
                        _buildMenuButton()
                      else
                        const SizedBox(width: 48),
                    ],
                  ),

                  // Welcome Section
                  if (widget.showWelcome) ...[
                    const SizedBox(height: 16),
                    _buildWelcomeSection(),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeSection() {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(Icons.waving_hand_rounded, color: goldAccent, size: 28),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Text(
                    '${_getGreeting()}،',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontSize: 18,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      _displayTitle.isNotEmpty ? _displayTitle : 'مستخدم',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _displaySubtitle,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 13,
                  fontFamily: 'Cairo',
                ),
                textAlign: TextAlign.right,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProfilePhoto() {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        if (widget.onProfilePressed != null) {
          widget.onProfilePressed!();
        } else {
          context.push('/profile');
        }
      },
      child: Container(
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            colors: [goldAccent, accentColor, goldAccent],
            stops: const [0.0, 0.5, 1.0],
          ),
          boxShadow: [
            BoxShadow(
              color: goldAccent.withValues(alpha: 0.4),
              blurRadius: 12,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Container(
          padding: const EdgeInsets.all(2),
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
          ),
          child:
              _isLoadingPhoto
                  ? const CircleAvatar(
                    radius: 22,
                    backgroundColor: Colors.white,
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: primaryDark,
                      ),
                    ),
                  )
                  : _profilePhotoUrl != null
                  ? CircleAvatar(
                    radius: 22,
                    backgroundColor: Colors.white,
                    child: ClipOval(
                      child: Image.network(
                        _profilePhotoUrl!,
                        width: 44,
                        height: 44,
                        fit: BoxFit.cover,
                        errorBuilder:
                            (_, __, ___) => const Icon(
                              Icons.person_rounded,
                              color: primaryDark,
                              size: 26,
                            ),
                      ),
                    ),
                  )
                  : const CircleAvatar(
                    radius: 22,
                    backgroundColor: Colors.white,
                    child: Icon(
                      Icons.person_rounded,
                      color: primaryDark,
                      size: 26,
                    ),
                  ),
        ),
      ),
    );
  }

  Widget _buildNotificationButton() {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        if (widget.onNotificationPressed != null) {
          widget.onNotificationPressed!();
        } else {
          context.push('/notifications');
        }
      },
      child: Stack(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.2),
                width: 1,
              ),
            ),
            child: const Icon(
              Icons.notifications_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),
          if (_unreadCount > 0)
            Positioned(
              right: 0,
              top: 0,
              child: AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _pulseAnimation.value,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            accentColor,
                            accentColor.withValues(alpha: 0.8),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: accentColor.withValues(alpha: 0.5),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: Text(
                        _unreadCount > 99 ? '99+' : _unreadCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMenuButton() {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        if (widget.onMenuPressed != null) {
          widget.onMenuPressed!();
        }
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
        child: const Icon(Icons.menu_rounded, color: Colors.white, size: 24),
      ),
    );
  }

  Widget _buildBackButton() {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        if (widget.onBackPressed != null) {
          widget.onBackPressed!();
        } else if (GoRouter.of(context).canPop()) {
          context.pop();
        } else {
          context.go('/home');
        }
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
        child: const Icon(
          Icons.arrow_back_rounded,
          color: Colors.white,
          size: 24,
        ),
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
  static const Color primaryLight = Color(0xFF8B0000);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            primaryDark,
            primaryLight,
            primaryDark.withValues(alpha: 0.95),
          ],
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withValues(alpha: 0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
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
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                      textAlign: TextAlign.center,
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 13,
                          fontFamily: 'Cairo',
                        ),
                        textAlign: TextAlign.center,
                      ),
                  ],
                ),
              ),

              // Back Button (on the left in RTL)
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  if (onBackPressed != null) {
                    onBackPressed!();
                  } else if (GoRouter.of(context).canPop()) {
                    GoRouter.of(context).pop();
                  } else {
                    GoRouter.of(context).go('/home');
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                  child: const Icon(
                    Icons.arrow_back_rounded,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
