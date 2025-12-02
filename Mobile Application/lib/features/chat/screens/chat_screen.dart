import 'package:flutter/material.dart';
import '../../../core/network/api_service.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/message_model.dart';
import 'package:intl/intl.dart';

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

  String? _chatId;
  String? _currentUserId;
  List<MessageModel> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _error;

  // Auto-refresh timer
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
      });
    }
    _initializeChat();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
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
    // Refresh messages every 5 seconds
    Future.delayed(_refreshInterval, () {
      if (mounted && _chatId != null) {
        _loadMessages(silent: true);
        _refreshCount++;
        _startAutoRefresh(); // Continue refreshing
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
          setState(() {
            _messages = newMessages;
            _isLoading = false;
          });

          // Scroll to bottom only if not silent or new messages arrived
          if (!silent || _messages.length < newMessages.length) {
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
        }
      } else {
        if (!silent) {
          setState(() {
            _error = result['message'];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (!silent) {
        setState(() {
          _error = 'حدث خطأ في تحميل الرسائل';
          _isLoading = false;
        });
      }
    }
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message']),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('فشل إرسال الرسالة'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isSending = false;
      });
    }
  }

  Widget _buildMessage(MessageModel message) {
    // Determine if this is the current user's message by comparing senderId
    final isMyMessage =
        _currentUserId != null && message.senderId == _currentUserId;

    return Align(
      alignment: isMyMessage ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
        ),
        decoration: BoxDecoration(
          color: isMyMessage ? const Color(0xFF690000) : Colors.grey[300],
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(12),
            topRight: const Radius.circular(12),
            bottomLeft: Radius.circular(isMyMessage ? 12 : 0),
            bottomRight: Radius.circular(isMyMessage ? 0 : 12),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isMyMessage && message.senderInfo != null)
              Text(
                message.senderInfo!.fullname,
                style: TextStyle(
                  fontSize: 12,
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                ),
              ),
            Text(
              message.text,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'Cairo',
                color: isMyMessage ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              DateFormat('hh:mm a').format(message.createdAt),
              style: TextStyle(
                fontSize: 10,
                fontFamily: 'Cairo',
                color: isMyMessage ? Colors.white70 : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: const Color(0xFF690000),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              centerTitle: true,
              title: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'محادثة',
                    style: TextStyle(
                      fontSize: 18,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'الشحنة: ${widget.shipmentAcid}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontFamily: 'Cairo',
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child:
                _isLoading
                    ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32.0),
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Color(0xFF690000),
                          ),
                        ),
                      ),
                    )
                    : _error != null
                    ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          children: [
                            Text(
                              _error!,
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                color: Colors.red,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _initializeChat,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF690000),
                              ),
                              child: const Text(
                                'إعادة المحاولة',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                    : SizedBox(
                      height: MediaQuery.of(context).size.height - 200,
                      child: Column(
                        children: [
                          Expanded(
                            child:
                                _messages.isEmpty
                                    ? const Center(
                                      child: Text(
                                        'لا توجد رسائل بعد\nابدأ المحادثة الآن!',
                                        style: TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 16,
                                          color: Colors.grey,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    )
                                    : ListView.builder(
                                      controller: _scrollController,
                                      padding: const EdgeInsets.all(8),
                                      itemCount: _messages.length,
                                      itemBuilder: (context, index) {
                                        return _buildMessage(_messages[index]);
                                      },
                                    ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.grey.withOpacity(0.2),
                                  spreadRadius: 1,
                                  blurRadius: 5,
                                  offset: const Offset(0, -2),
                                ),
                              ],
                            ),
                            child: SafeArea(
                              child: Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _messageController,
                                      decoration: InputDecoration(
                                        hintText: 'اكتب رسالتك...',
                                        hintStyle: const TextStyle(
                                          fontFamily: 'Cairo',
                                        ),
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(
                                            24,
                                          ),
                                          borderSide: BorderSide(
                                            color: Colors.grey[300]!,
                                          ),
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(
                                            24,
                                          ),
                                          borderSide: BorderSide(
                                            color: Colors.grey[300]!,
                                          ),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(
                                            24,
                                          ),
                                          borderSide: const BorderSide(
                                            color: Color(0xFF690000),
                                            width: 2,
                                          ),
                                        ),
                                        contentPadding:
                                            const EdgeInsets.symmetric(
                                              horizontal: 16,
                                              vertical: 8,
                                            ),
                                      ),
                                      style: const TextStyle(
                                        fontFamily: 'Cairo',
                                      ),
                                      maxLines: null,
                                      textInputAction: TextInputAction.send,
                                      onSubmitted: (_) => _sendMessage(),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF690000),
                                      shape: BoxShape.circle,
                                    ),
                                    child: IconButton(
                                      icon:
                                          _isSending
                                              ? const SizedBox(
                                                width: 20,
                                                height: 20,
                                                child: CircularProgressIndicator(
                                                  strokeWidth: 2,
                                                  valueColor:
                                                      AlwaysStoppedAnimation<
                                                        Color
                                                      >(Colors.white),
                                                ),
                                              )
                                              : const Icon(
                                                Icons.send,
                                                color: Colors.white,
                                              ),
                                      onPressed:
                                          _isSending ? null : _sendMessage,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
          ),
        ],
      ),
    );
  }
}
