class MessageModel {
  final String id;
  final String chatId;
  final String senderId;
  final String senderType;
  final String text;
  final bool isRead;
  final DateTime createdAt;
  final SenderInfo? senderInfo;

  MessageModel({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.senderType,
    required this.text,
    this.isRead = false,
    required this.createdAt,
    this.senderInfo,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['_id'] ?? '',
      chatId: json['chatId'] ?? '',
      senderId:
          json['senderId'] is String
              ? json['senderId']
              : json['senderId']?['_id'] ?? '',
      senderType: json['senderType'] ?? 'client',
      text: json['text'] ?? '',
      isRead: json['isRead'] ?? false,
      createdAt:
          json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
      senderInfo:
          json['senderId'] is Map
              ? SenderInfo.fromJson(json['senderId'])
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'chatId': chatId,
      'senderId': senderId,
      'senderType': senderType,
      'text': text,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class SenderInfo {
  final String id;
  final String fullname;
  final String username;
  final String type;

  SenderInfo({
    required this.id,
    required this.fullname,
    required this.username,
    required this.type,
  });

  factory SenderInfo.fromJson(Map<String, dynamic> json) {
    return SenderInfo(
      id: json['_id'] ?? '',
      fullname: json['fullname'] ?? '',
      username: json['username'] ?? '',
      type: json['type'] ?? 'client',
    );
  }
}
