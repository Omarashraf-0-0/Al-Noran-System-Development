import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/network/api_service.dart';
import '../../core/services/user_cache_service.dart';

class CustomerSupportChatPage extends StatefulWidget {
  final String shipmentId;
  final String? employeeName;

  const CustomerSupportChatPage({
    Key? key,
    required this.shipmentId,
    this.employeeName,
  }) : super(key: key);

  @override
  State<CustomerSupportChatPage> createState() =>
      _CustomerSupportChatPageState();
}

class _CustomerSupportChatPageState extends State<CustomerSupportChatPage>
    with TickerProviderStateMixin {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  // Premium Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accentColor = Color(0xFF1BA3B6);
  static const Color goldAccent = Color(0xFFD4AF37);
  static const Color bgColor = Color(0xFFF8F9FA);

  // Animation Controllers
  late AnimationController _fadeController;
  late AnimationController _typingController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _typingAnimation;

  // State
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isOnline = false;
  bool _isTyping = false;
  bool _isSending = false;
  String _currentUserName = 'أنت';
  String? _userProfilePhotoUrl;
  final UserCacheService _userCache = UserCacheService();

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _loadMessages();
    _loadUserData();
    _checkEmployeeStatus();
    _focusNode.addListener(() => setState(() {}));
  }

  void _initAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );

    _typingController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..repeat(reverse: true);
    _typingAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _typingController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _typingController.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      // First, get cached data instantly
      if (_userCache.isInitialized) {
        setState(() {
          _currentUserName =
              _userCache.userName.isNotEmpty ? _userCache.userName : 'أنت';
          _userProfilePhotoUrl = _userCache.profilePhotoUrl;
        });
      } else {
        await _userCache.initialize();
        if (mounted) {
          setState(() {
            _currentUserName =
                _userCache.userName.isNotEmpty ? _userCache.userName : 'أنت';
            _userProfilePhotoUrl = _userCache.profilePhotoUrl;
          });
        }
      }
      print('📸 [Chat] User profile photo URL: $_userProfilePhotoUrl');
    } catch (e) {
      print('❌ [Chat] Error loading user data: $e');
    }
  }

  Future<void> _checkEmployeeStatus() async {
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) {
      setState(() => _isOnline = true);
    }
  }

  Future<void> _loadMessages() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = 'chat_messages_${widget.shipmentId}';
      final messagesJson = prefs.getString(key);

      if (messagesJson != null) {
        final List<dynamic> decoded = jsonDecode(messagesJson);
        setState(() {
          _messages = decoded.cast<Map<String, dynamic>>();
          _isLoading = false;
        });
      } else {
        setState(() {
          _messages = [
            {
              'id': DateTime.now().millisecondsSinceEpoch.toString(),
              'text': 'مرحباً بك! 👋\nكيف يمكنني مساعدتك بخصوص شحنتك؟',
              'isEmployee': true,
              'time': _getCurrentTime(),
              'date': _getCurrentDate(),
              'hasLogo': true,
              'senderName': widget.employeeName ?? 'فريق الدعم',
            },
          ];
          _isLoading = false;
        });
        await _saveMessages();
      }

      _fadeController.forward();
      _scrollToBottom();
    } catch (e) {
      print('❌ [Chat] Error loading messages: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveMessages() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = 'chat_messages_${widget.shipmentId}';
      await prefs.setString(key, jsonEncode(_messages));
    } catch (e) {
      print('❌ [Chat] Error saving messages: $e');
    }
  }

  void _sendMessage() async {
    if (_messageController.text.trim().isEmpty || _isSending) return;

    HapticFeedback.lightImpact();
    final messageText = _messageController.text.trim();
    _messageController.clear();

    setState(() {
      _isSending = true;
      _messages.add({
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'text': messageText,
        'isEmployee': false,
        'time': _getCurrentTime(),
        'date': _getCurrentDate(),
        'hasLogo': false,
        'senderName': _currentUserName,
        'status': 'sending',
      });
    });

    _scrollToBottom();

    await Future.delayed(const Duration(milliseconds: 300));

    setState(() {
      _messages.last['status'] = 'sent';
      _isSending = false;
    });

    await _saveMessages();
    _simulateEmployeeResponse(messageText);
  }

  void _simulateEmployeeResponse(String userMessage) {
    setState(() => _isTyping = true);
    _scrollToBottom();

    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;

      setState(() => _isTyping = false);
      String response = _generateAutoResponse(userMessage);

      setState(() {
        if (_messages.isNotEmpty && _messages.last['isEmployee'] == false) {
          _messages.last['status'] = 'delivered';
        }

        _messages.add({
          'id': DateTime.now().millisecondsSinceEpoch.toString(),
          'text': response,
          'isEmployee': true,
          'time': _getCurrentTime(),
          'date': _getCurrentDate(),
          'hasLogo': true,
          'senderName': widget.employeeName ?? 'فريق الدعم',
        });
      });

      _saveMessages();
      _scrollToBottom();
    });
  }

  String _generateAutoResponse(String message) {
    final lowerMessage = message.toLowerCase();

    if (lowerMessage.contains('شحنة') || lowerMessage.contains('وصول')) {
      return 'شحنتك في الطريق وسيتم تحديث الحالة قريباً 📦\n\nهل تريد معلومات إضافية عن موعد الوصول المتوقع؟';
    } else if (lowerMessage.contains('مستندات') ||
        lowerMessage.contains('ورق')) {
      return 'يمكنك رفع المستندات المطلوبة من صفحة تفاصيل الشحنة 📄\n\nهل تحتاج مساعدة في عملية الرفع؟';
    } else if (lowerMessage.contains('متى') || lowerMessage.contains('موعد')) {
      return 'سيتم التواصل معك عند وصول الشحنة للميناء ⏰\n\nيمكنك متابعة التحديثات من التطبيق أولاً بأول.';
    } else if (lowerMessage.contains('سعر') ||
        lowerMessage.contains('تكلفة') ||
        lowerMessage.contains('فلوس')) {
      return 'يمكنك مشاهدة التكاليف التفصيلية من صفحة تفاصيل الشحنة 💰\n\nهل تريد توضيح لأي بند معين؟';
    } else if (lowerMessage.contains('شكر') || lowerMessage.contains('ممتاز')) {
      return 'شكراً لك! 😊\n\nسعداء بخدمتك. لا تتردد في التواصل معنا في أي وقت.';
    } else {
      return 'شكراً لتواصلك معنا 🙏\n\nسيقوم أحد موظفينا بالرد عليك في أقرب وقت ممكن.';
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _getCurrentTime() {
    final now = DateTime.now();
    final hour =
        now.hour > 12 ? now.hour - 12 : (now.hour == 0 ? 12 : now.hour);
    final period = now.hour >= 12 ? 'م' : 'ص';
    return '${hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')} $period';
  }

  String _getCurrentDate() {
    final now = DateTime.now();
    return '${now.day}/${now.month}/${now.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: bgColor,
        body: SafeArea(
          child: Column(
            children: [
              _buildPremiumAppBar(),
              Expanded(
                child:
                    _isLoading
                        ? _buildLoadingState()
                        : FadeTransition(
                          opacity: _fadeAnimation,
                          child: _buildMessagesList(),
                        ),
              ),
              _buildPremiumMessageInput(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumAppBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryDark, primaryLight],
        ),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Support Avatar (now first in RTL)
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Stack(
              children: [
                Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.asset(
                      'assets/img/logo.png',
                      width: 40,
                      height: 40,
                      fit: BoxFit.contain,
                      errorBuilder:
                          (_, __, ___) => Icon(
                            Icons.support_agent_rounded,
                            color: primaryDark,
                            size: 28,
                          ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: _isOnline ? Colors.green : Colors.grey,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow:
                          _isOnline
                              ? [
                                BoxShadow(
                                  color: Colors.green.withOpacity(0.5),
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                ),
                              ]
                              : null,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Name and Status
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.employeeName ?? 'فريق الدعم',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      _isOnline ? 'متصل الآن' : 'غير متصل',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.85),
                        fontSize: 13,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    if (_isOnline) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'سريع الرد',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // Shipment ID Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: goldAccent.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: goldAccent.withOpacity(0.5)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.local_shipping_outlined,
                  size: 14,
                  color: goldAccent,
                ),
                const SizedBox(width: 4),
                Text(
                  '#${widget.shipmentId.length > 6 ? widget.shipmentId.substring(0, 6) : widget.shipmentId}',
                  style: TextStyle(
                    color: goldAccent,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Back Button (now at end in RTL - appears on left)
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_forward_ios_rounded, size: 18),
              color: Colors.white,
              onPressed: () {
                HapticFeedback.lightImpact();
                Navigator.pop(context);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  primaryDark.withOpacity(0.1),
                  accentColor.withOpacity(0.1),
                ],
              ),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: CircularProgressIndicator(
                color: primaryDark,
                strokeWidth: 3,
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'جاري تحميل المحادثة...',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessagesList() {
    return Column(
      children: [
        // Date Header
        if (_messages.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _messages.first['date'] ?? _getCurrentDate(),
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),

        // Messages
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: _messages.length + (_isTyping ? 1 : 0),
            itemBuilder: (context, index) {
              if (_isTyping && index == _messages.length) {
                return _buildTypingIndicator();
              }

              final message = _messages[index];
              final showAvatar =
                  index == 0 ||
                  _messages[index - 1]['isEmployee'] != message['isEmployee'];

              return _buildPremiumMessageBubble(
                message: message,
                showAvatar: showAvatar,
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTypingIndicator() {
    // Employee typing indicator on FAR LEFT side (using LTR for proper positioning)
    return Padding(
      padding: const EdgeInsets.only(bottom: 16, left: 0, right: 50),
      child: Directionality(
        textDirection: TextDirection.ltr,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.asset(
                  'assets/img/logo.png',
                  width: 28,
                  height: 28,
                  fit: BoxFit.contain,
                  errorBuilder:
                      (_, __, ___) => Icon(
                        Icons.support_agent_rounded,
                        color: primaryDark,
                        size: 20,
                      ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: AnimatedBuilder(
                animation: _typingAnimation,
                builder: (context, child) {
                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(3, (i) {
                      return Padding(
                        padding: EdgeInsets.only(left: i < 2 ? 4 : 0),
                        child: Opacity(
                          opacity: (_typingAnimation.value - (i * 0.2)).clamp(
                            0.3,
                            1.0,
                          ),
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: primaryDark.withOpacity(0.6),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      );
                    }),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumMessageBubble({
    required Map<String, dynamic> message,
    required bool showAvatar,
  }) {
    final bool isEmployee = message['isEmployee'] ?? false;
    final String text = message['text'] ?? '';
    final String time = message['time'] ?? '';
    final String? status = message['status'];

    // Chat Layout for RTL (Arabic):
    // - User messages: FAR RIGHT with profile photo on the right edge
    // - Employee messages: FAR LEFT with avatar on the left edge

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, 20 * (1 - value)),
          child: Opacity(opacity: value, child: child),
        );
      },
      child: Padding(
        padding: EdgeInsets.only(
          bottom: 12,
          // Padding for the opposite side
          left: isEmployee ? 0 : 50, // User: padding from left
          right: isEmployee ? 50 : 0, // Employee: padding from right
        ),
        // Use LTR for chat layout so User is on FAR RIGHT and Employee is on FAR LEFT
        child: Directionality(
          textDirection: TextDirection.ltr,
          child: Row(
            mainAxisAlignment:
                isEmployee ? MainAxisAlignment.start : MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Employee avatar (FAR LEFT - first in LTR row)
              if (isEmployee && showAvatar) ...[
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset(
                      'assets/img/logo.png',
                      width: 28,
                      height: 28,
                      fit: BoxFit.contain,
                      errorBuilder:
                          (_, __, ___) => Icon(
                            Icons.support_agent_rounded,
                            color: primaryDark,
                            size: 20,
                          ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ] else if (isEmployee) ...[
                const SizedBox(width: 44),
              ],

              // Message bubble
              Flexible(
                child: GestureDetector(
                  onLongPress: () {
                    HapticFeedback.mediumImpact();
                    _showMessageOptions(message);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient:
                          !isEmployee
                              ? LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [primaryDark, primaryLight],
                              )
                              : null,
                      color: isEmployee ? Colors.white : null,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        // User on right: small bottom-right, Employee on left: small bottom-left
                        bottomRight: Radius.circular(isEmployee ? 18 : 4),
                        bottomLeft: Radius.circular(isEmployee ? 4 : 18),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (isEmployee ? Colors.grey : primaryDark)
                              .withOpacity(0.15),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment:
                          isEmployee
                              ? CrossAxisAlignment.start
                              : CrossAxisAlignment.end,
                      children: [
                        Text(
                          text,
                          style: TextStyle(
                            color: isEmployee ? Colors.black87 : Colors.white,
                            fontSize: 15,
                            height: 1.5,
                            fontFamily: 'Cairo',
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              time,
                              style: TextStyle(
                                color:
                                    isEmployee
                                        ? Colors.grey[500]
                                        : Colors.white.withOpacity(0.8),
                                fontSize: 11,
                                fontFamily: 'Cairo',
                              ),
                            ),
                            if (!isEmployee && status != null) ...[
                              const SizedBox(width: 4),
                              Icon(
                                status == 'delivered'
                                    ? Icons.done_all
                                    : status == 'sent'
                                    ? Icons.done
                                    : Icons.access_time_rounded,
                                size: 14,
                                color:
                                    status == 'delivered'
                                        ? accentColor
                                        : Colors.white.withOpacity(0.7),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // User avatar (FAR RIGHT - last in row for user messages)
              if (!isEmployee && showAvatar) ...[
                const SizedBox(width: 8),
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [primaryDark, primaryLight],
                    ),
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: primaryDark.withOpacity(0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child:
                        _userProfilePhotoUrl != null &&
                                _userProfilePhotoUrl!.isNotEmpty
                            ? CachedNetworkImage(
                              imageUrl: _userProfilePhotoUrl!,
                              width: 36,
                              height: 36,
                              fit: BoxFit.cover,
                              placeholder:
                                  (context, url) => const Center(
                                    child: Icon(
                                      Icons.person_rounded,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                  ),
                              errorWidget:
                                  (context, url, error) => const Center(
                                    child: Icon(
                                      Icons.person_rounded,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                  ),
                            )
                            : const Center(
                              child: Icon(
                                Icons.person_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                  ),
                ),
              ] else if (!isEmployee) ...[
                const SizedBox(width: 44),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showMessageOptions(Map<String, dynamic> message) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 20),
                ListTile(
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: accentColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.copy_rounded, color: accentColor),
                  ),
                  title: const Text(
                    'نسخ الرسالة',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  onTap: () {
                    Clipboard.setData(
                      ClipboardData(text: message['text'] ?? ''),
                    );
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text(
                          'تم نسخ الرسالة',
                          style: TextStyle(fontFamily: 'Cairo'),
                        ),
                        backgroundColor: primaryDark,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
    );
  }

  Widget _buildPremiumMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Row(
        children: [
          // Text Input
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color:
                      _focusNode.hasFocus
                          ? primaryDark.withOpacity(0.3)
                          : Colors.transparent,
                  width: 2,
                ),
              ),
              child: TextField(
                controller: _messageController,
                focusNode: _focusNode,
                textDirection: TextDirection.rtl,
                textAlign: TextAlign.right,
                maxLines: 4,
                minLines: 1,
                style: const TextStyle(fontFamily: 'Cairo', fontSize: 15),
                decoration: InputDecoration(
                  hintText: 'اكتب رسالتك هنا...',
                  hintStyle: TextStyle(
                    color: Colors.grey[400],
                    fontFamily: 'Cairo',
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                ),
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Send Button
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors:
                    _messageController.text.trim().isNotEmpty
                        ? [primaryDark, primaryLight]
                        : [Colors.grey[300]!, Colors.grey[400]!],
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow:
                  _messageController.text.trim().isNotEmpty
                      ? [
                        BoxShadow(
                          color: primaryDark.withOpacity(0.4),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ]
                      : null,
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap:
                    _messageController.text.trim().isNotEmpty
                        ? _sendMessage
                        : null,
                borderRadius: BorderRadius.circular(16),
                child: Center(
                  child:
                      _isSending
                          ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                          : Transform.rotate(
                            angle: 3.14159,
                            child: const Icon(
                              Icons.send_rounded,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
