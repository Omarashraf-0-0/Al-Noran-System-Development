import 'package:flutter/material.dart';
import 'dart:ui' as ui;
import '../../../core/network/api_service.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/message_model.dart';
import 'package:intl/intl.dart';
import 'dart:async';

class ChatScreen extends StatefulWidget {
  final String shipmentId;
  final String shipmentAcid;

  const ChatScreen({
    Key? key,
    required this.shipmentId,
    required this.shipmentAcid,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  // Colors
  static const Color primaryDark = Color(0xFF690000);

  // State
  String? _chatId;
  String? _currentUserId;
  String _currentUserName = 'أنت';
  String? _employeeName;
  List<MessageModel> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  bool _isOnline = true;
  String? _error;
  Timer? _autoRefreshTimer;

  // Auto-refresh interval
  Duration _refreshInterval = const Duration(seconds: 5);
  int _refreshCount = 0;

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    final userData = await SecureStorage.getUserData();
    if (userData != null) {
      setState(() {
        _currentUserId = userData['_id'] ?? userData['id'];
        _currentUserName =
            userData['fullname'] ?? userData['username'] ?? 'أنت';
      });
    }
    _initializeChat();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _initializeChat() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Get or create chat for this shipment
      final chatResult = await ApiService.getOrCreateChat(widget.shipmentId);

      if (!chatResult['success']) {
        setState(() {
          _error = chatResult['message'];
          _isLoading = false;
        });
        return;
      }

      _chatId = chatResult['chat']['_id'];

      // Get employee name from chat
      if (chatResult['chat']['employeeId'] != null) {
        _employeeName =
            chatResult['chat']['employeeId']['fullname'] ??
            chatResult['chat']['employeeId']['username'] ??
            'موظف الدعم';
      }

      // Load messages
      await _loadMessages();

      // Start auto-refresh after initial load
      _startAutoRefresh();
    } catch (e) {
      setState(() {
        _error = 'حدث خطأ: $e';
        _isLoading = false;
      });
    }
  }

  void _startAutoRefresh() {
    _autoRefreshTimer?.cancel();
    _autoRefreshTimer = Timer.periodic(_refreshInterval, (timer) {
      if (mounted && _chatId != null) {
        _loadMessages(silent: true);
        _refreshCount++;
      }
    });
  }

  Future<void> _loadMessages({bool silent = false}) async {
    if (_chatId == null) return;

    try {
      final result = await ApiService.getMessages(_chatId!);

      if (result['success']) {
        final newMessages =
            (result['messages'] as List)
                .map((m) => MessageModel.fromJson(m))
                .toList();

        // Only update if messages changed
        if (!silent || _messages.length != newMessages.length) {
          if (mounted) {
            setState(() {
              _messages = newMessages;
              _isLoading = false;
            });
          }

          // Scroll to bottom only if not silent or new messages arrived
          if (!silent || _messages.length < newMessages.length) {
            _scrollToBottom();
          }
        }
      } else {
        if (!silent && mounted) {
          setState(() {
            _error = result['message'];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (!silent && mounted) {
        setState(() {
          _error = 'حدث خطأ في تحميل الرسائل';
          _isLoading = false;
        });
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty || _chatId == null) return;

    final messageText = _messageController.text.trim();
    _messageController.clear();

    setState(() {
      _isSending = true;
    });

    try {
      final result = await ApiService.sendMessage(_chatId!, messageText);

      if (result['success']) {
        // Reload messages to get the new one
        await _loadMessages();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                result['message'],
                style: const TextStyle(fontFamily: 'Cairo'),
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'فشل إرسال الرسالة',
              style: TextStyle(fontFamily: 'Cairo'),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  Widget _buildMessage(MessageModel message) {
    // Determine if this is the current user's message
    final isMyMessage =
        _currentUserId != null && message.senderId == _currentUserId;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment:
            isMyMessage ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User message on left, Employee on right
          if (!isMyMessage) const Spacer(),

          // Message bubble
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.7,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isMyMessage ? primaryDark : Colors.grey[200],
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft:
                      isMyMessage
                          ? const Radius.circular(4)
                          : const Radius.circular(16),
                  bottomRight:
                      isMyMessage
                          ? const Radius.circular(16)
                          : const Radius.circular(4),
                ),
              ),
              child: Column(
                crossAxisAlignment:
                    isMyMessage
                        ? CrossAxisAlignment.start
                        : CrossAxisAlignment.end,
                children: [
                  Text(
                    message.text,
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      color: isMyMessage ? Colors.white : Colors.black,
                      fontSize: 15,
                      height: 1.4,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (isMyMessage) ...[
                        Icon(
                          Icons.check,
                          size: 14,
                          color: Colors.white.withOpacity(0.7),
                        ),
                        const SizedBox(width: 4),
                      ],
                      Text(
                        DateFormat('hh:mm a').format(message.createdAt),
                        style: TextStyle(
                          color:
                              isMyMessage
                                  ? Colors.white.withOpacity(0.7)
                                  : Colors.grey[600],
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
          if (!isMyMessage) ...[
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

          if (isMyMessage) const Spacer(),
        ],
      ),
    );
  }

  Widget _buildLogo({double size = 50}) {
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

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: ui.TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: _buildAppBar(),
        body:
            _isLoading
                ? const Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(primaryDark),
                  ),
                )
                : _error != null
                ? _buildErrorView()
                : Column(
                  children: [
                    // Messages list
                    Expanded(
                      child:
                          _messages.isEmpty
                              ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.chat_bubble_outline,
                                      size: 64,
                                      color: Colors.grey[400],
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      'لا توجد رسائل بعد',
                                      style: TextStyle(
                                        fontFamily: 'Cairo',
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'ابدأ المحادثة الآن!',
                                      style: TextStyle(
                                        fontFamily: 'Cairo',
                                        fontSize: 14,
                                        color: Colors.grey[500],
                                      ),
                                    ),
                                  ],
                                ),
                              )
                              : ListView.builder(
                                controller: _scrollController,
                                padding: const EdgeInsets.all(16),
                                itemCount: _messages.length,
                                itemBuilder: (context, index) {
                                  return _buildMessage(_messages[index]);
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
                  _employeeName ?? 'فريق الدعم',
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

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 16,
                color: Colors.red,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _initializeChat,
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryDark,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'إعادة المحاولة',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  color: Colors.white,
                  fontSize: 16,
                ),
              ),
            ),
          ],
        ),
      ),
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
                  textAlign: TextAlign.right,
                  maxLines: null,
                  textInputAction: TextInputAction.send,
                  style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'اكتب رسالة...',
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
                icon:
                    _isSending
                        ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                        : const Icon(Icons.send, color: Colors.white),
                onPressed: _isSending ? null : _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
