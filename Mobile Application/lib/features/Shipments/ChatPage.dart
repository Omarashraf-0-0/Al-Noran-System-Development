import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_service.dart';

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

class _CustomerSupportChatPageState extends State<CustomerSupportChatPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  // Colors
  static const Color primaryDark = Color(0xFF690000);

  // State
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isOnline = false;
  String _currentUserName = 'أنت';

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _loadUserData();
    _checkEmployeeStatus();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      final userData = await ApiService.getUserData();
      if (mounted) {
        setState(() {
          _currentUserName =
              userData['fullname'] ?? userData['username'] ?? 'أنت';
        });
      }
    } catch (e) {
      print('❌ [Chat] Error loading user data: $e');
    }
  }

  Future<void> _checkEmployeeStatus() async {
    // TODO: Implement real-time employee status check via Socket.IO
    // For now, simulate online status
    setState(() {
      _isOnline = true;
    });
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
        // Initialize with welcome message
        setState(() {
          _messages = [
            {
              'text': 'مرحباً بك! كيف يمكنني مساعدتك بخصوص شحنتك؟',
              'isEmployee': true,
              'time': _getCurrentTime(),
              'hasLogo': true,
              'senderName': widget.employeeName ?? 'موظف الدعم',
            },
          ];
          _isLoading = false;
        });
        await _saveMessages();
      }

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
      final messagesJson = jsonEncode(_messages);
      await prefs.setString(key, messagesJson);
    } catch (e) {
      print('❌ [Chat] Error saving messages: $e');
    }
  }

  void _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    final messageText = _messageController.text.trim();
    _messageController.clear();

    setState(() {
      _messages.add({
        'text': messageText,
        'isEmployee': false,
        'time': _getCurrentTime(),
        'hasLogo': false,
        'senderName': _currentUserName,
        'status': 'sent', // sent, delivered, read
      });
    });

    await _saveMessages();
    _scrollToBottom();

    // TODO: Send message to backend via Socket.IO or HTTP
    // For now, simulate employee response after 2 seconds
    _simulateEmployeeResponse(messageText);
  }

  void _simulateEmployeeResponse(String userMessage) {
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;

      String response = _generateAutoResponse(userMessage);

      setState(() {
        _messages.add({
          'text': response,
          'isEmployee': true,
          'time': _getCurrentTime(),
          'hasLogo': true,
          'senderName': widget.employeeName ?? 'موظف الدعم',
        });
      });

      _saveMessages();
      _scrollToBottom();
    });
  }

  String _generateAutoResponse(String message) {
    final lowerMessage = message.toLowerCase();

    if (lowerMessage.contains('شحنة') || lowerMessage.contains('وصول')) {
      return 'شحنتك في الطريق وسيتم تحديث الحالة قريباً. هل تريد معلومات إضافية؟';
    } else if (lowerMessage.contains('مستندات') ||
        lowerMessage.contains('ورق')) {
      return 'يمكنك رفع المستندات المطلوبة من صفحة تفاصيل الشحنة. هل تحتاج مساعدة في الرفع؟';
    } else if (lowerMessage.contains('متى') || lowerMessage.contains('موعد')) {
      return 'سيتم التواصل معك عند وصول الشحنة للميناء. يمكنك متابعة التحديثات من التطبيق.';
    } else if (lowerMessage.contains('سعر') ||
        lowerMessage.contains('تكلفة') ||
        lowerMessage.contains('فلوس')) {
      return 'يمكنك مشاهدة التكاليف التفصيلية من صفحة تفاصيل الشحنة. هل تريد توضيح لأي بند معين؟';
    } else {
      return 'شكراً لتواصلك معنا. سيقوم أحد موظفينا بالرد عليك في أقرب وقت.';
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
    return '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: _buildAppBar(),
        body:
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : Column(
                  children: [
                    // Messages list
                    Expanded(
                      child: ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final message = _messages[index];
                          return _buildMessageBubble(
                            text: message['text'] ?? '',
                            isEmployee: message['isEmployee'] ?? false,
                            time: message['time'] ?? '',
                            hasLogo: message['hasLogo'] ?? false,
                            senderName: message['senderName'] ?? '',
                            status: message['status'],
                          );
                        },
                      ),
                    ),

                    // Message input
                    _buildMessageInput(),
                  ],
                ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 1,
      automaticallyImplyLeading: false,
      title: Row(
        children: [
          // Logo
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.all(4),
            child: _buildLogo(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.employeeName ?? 'فريق الدعم',
                  style: const TextStyle(
                    color: primaryDark,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _isOnline ? Colors.green : Colors.grey,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _isOnline ? 'متصل' : 'غير متصل',
                      style: TextStyle(
                        color: _isOnline ? Colors.green : Colors.grey,
                        fontSize: 12,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.arrow_forward, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ],
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Text input
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF5F5F5),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: TextField(
                  controller: _messageController,
                  textDirection: TextDirection.rtl,
                  textAlign: TextAlign.right,
                  maxLines: null,
                  textInputAction: TextInputAction.send,
                  style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'اكتب رسالة...',
                    hintTextDirection: TextDirection.rtl,
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
            ),

            const SizedBox(width: 12),

            // Send button
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: primaryDark,
                borderRadius: BorderRadius.circular(8),
              ),
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white),
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble({
    required String text,
    required bool isEmployee,
    required String time,
    required bool hasLogo,
    required String senderName,
    String? status,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment:
            isEmployee ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Message bubble
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.7,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isEmployee ? Colors.grey[200] : primaryDark,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft:
                      isEmployee
                          ? const Radius.circular(16)
                          : const Radius.circular(4),
                  bottomRight:
                      isEmployee
                          ? const Radius.circular(4)
                          : const Radius.circular(16),
                ),
              ),
              child: Column(
                crossAxisAlignment:
                    isEmployee
                        ? CrossAxisAlignment.end
                        : CrossAxisAlignment.start,
                children: [
                  Text(
                    text,
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      color: isEmployee ? Colors.black : Colors.white,
                      fontSize: 15,
                      height: 1.4,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (!isEmployee && status != null) ...[
                        Icon(
                          status == 'read'
                              ? Icons.done_all
                              : status == 'delivered'
                              ? Icons.done_all
                              : Icons.check,
                          size: 14,
                          color:
                              status == 'read'
                                  ? Colors.blue
                                  : Colors.white.withOpacity(0.7),
                        ),
                        const SizedBox(width: 4),
                      ],
                      Text(
                        time,
                        style: TextStyle(
                          color:
                              isEmployee
                                  ? Colors.grey[600]
                                  : Colors.white.withOpacity(0.7),
                          fontSize: 11,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Employee logo (if employee message)
          if (isEmployee && hasLogo) ...[
            const SizedBox(width: 8),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(6),
              ),
              padding: const EdgeInsets.all(2),
              child: _buildLogo(size: 32),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLogo({double size = 50}) {
    // Try to load logo from assets, fallback to placeholder
    return Image.asset(
      'assets/img/logo.png',
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) {
        // Fallback logo
        return Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: primaryDark,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Center(
            child: Text(
              'N',
              style: TextStyle(
                color: Colors.white,
                fontSize: size * 0.5,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        );
      },
    );
  }
}
