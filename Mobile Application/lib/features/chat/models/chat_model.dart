class ChatModel {
  final String id;
  final String clientId;
  final String employeeId;
  final String shipmentId;
  final String status;
  final DateTime lastMessageAt;
  final int unreadCount;
  final ClientInfo? clientInfo;
  final EmployeeInfo? employeeInfo;
  final ShipmentInfo? shipmentInfo;

  ChatModel({
    required this.id,
    required this.clientId,
    required this.employeeId,
    required this.shipmentId,
    required this.status,
    required this.lastMessageAt,
    this.unreadCount = 0,
    this.clientInfo,
    this.employeeInfo,
    this.shipmentInfo,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    return ChatModel(
      id: json['_id'] ?? '',
      clientId:
          json['clientId'] is String
              ? json['clientId']
              : json['clientId']?['_id'] ?? '',
      employeeId:
          json['employeeId'] is String
              ? json['employeeId']
              : json['employeeId']?['_id'] ?? '',
      shipmentId:
          json['shipmentId'] is String
              ? json['shipmentId']
              : json['shipmentId']?['_id'] ?? '',
      status: json['status'] ?? 'active',
      lastMessageAt:
          json['lastMessageAt'] != null
              ? DateTime.parse(json['lastMessageAt'])
              : DateTime.now(),
      unreadCount: json['unreadCount'] ?? 0,
      clientInfo:
          json['clientId'] is Map
              ? ClientInfo.fromJson(json['clientId'])
              : null,
      employeeInfo:
          json['employeeId'] is Map
              ? EmployeeInfo.fromJson(json['employeeId'])
              : null,
      shipmentInfo:
          json['shipmentId'] is Map
              ? ShipmentInfo.fromJson(json['shipmentId'])
              : null,
    );
  }
}

class ClientInfo {
  final String id;
  final String fullname;
  final String username;
  final String email;

  ClientInfo({
    required this.id,
    required this.fullname,
    required this.username,
    required this.email,
  });

  factory ClientInfo.fromJson(Map<String, dynamic> json) {
    return ClientInfo(
      id: json['_id'] ?? '',
      fullname: json['fullname'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
    );
  }
}

class EmployeeInfo {
  final String id;
  final String fullname;
  final String username;
  final String email;

  EmployeeInfo({
    required this.id,
    required this.fullname,
    required this.username,
    required this.email,
  });

  factory EmployeeInfo.fromJson(Map<String, dynamic> json) {
    return EmployeeInfo(
      id: json['_id'] ?? '',
      fullname: json['fullname'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
    );
  }
}

class ShipmentInfo {
  final String id;
  final String acid;
  final String status;
  final String country;

  ShipmentInfo({
    required this.id,
    required this.acid,
    required this.status,
    required this.country,
  });

  factory ShipmentInfo.fromJson(Map<String, dynamic> json) {
    return ShipmentInfo(
      id: json['_id'] ?? '',
      acid: json['acid'] ?? '',
      status: json['status'] ?? '',
      country: json['country'] ?? '',
    );
  }
}
