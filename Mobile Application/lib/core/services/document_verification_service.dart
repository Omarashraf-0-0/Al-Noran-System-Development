import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_service.dart';
import '../storage/secure_storage.dart';

/// Service to check document verification status for ACID/UCR requests
class DocumentVerificationService {
  // Singleton pattern
  static final DocumentVerificationService _instance =
      DocumentVerificationService._internal();
  factory DocumentVerificationService() => _instance;
  DocumentVerificationService._internal();
  // Cached verification result
  Map<String, dynamic>? _cachedResult;
  DateTime? _cacheTime;
  static const Duration _cacheDuration = Duration(seconds: 30);

  /// Required documents by client type
  /// These must match EXACTLY what is uploaded during registration
  /// Synced with web frontend DocumentUploadPage.jsx requirements
  static List<String> getRequiredDocuments(String clientType) {
    switch (clientType) {
      case 'personal':
        // Personal: power_of_attorney + personal_id (Egyptian) or passport (non-Egyptian)
        // Note: The actual check depends on nationality stored in user data
        return ['power_of_attorney', 'personal_id'];
      case 'commercial':
        // Commercial: 8 required documents (synced with web frontend)
        return [
          'commercial_register',
          'tax_card',
          'contract',
          'certificate_vat',
          'import_export_card',
          'power_of_attorney',
          'personal_id_of_representative',
          'trade_certificates',
        ];
      case 'factory':
        // Factory: 8 required documents (synced with web frontend)
        return [
          'commercial_register',
          'tax_card',
          'contract',
          'industrial_register',
          'certificate_vat',
          'production_supplies',
          'power_of_attorney',
          'personal_id_of_representative',
        ];
      default:
        return ['power_of_attorney', 'personal_id'];
    }
  }

  /// Check if all required documents are approved for the current user
  /// Returns a result map with:
  /// - canSubmitRequests: bool - true if user can submit ACID/UCR requests
  /// - message: String - user-friendly message about status
  /// - missingDocuments: List<String> - list of missing document types
  /// - pendingDocuments: List<String> - list of documents pending review
  /// - rejectedDocuments: List<Map> - list of rejected documents with reasons
  Future<Map<String, dynamic>> checkDocumentStatus({
    bool forceRefresh = false,
  }) async {
    try {
      // Return cached result if still valid
      if (!forceRefresh && _cachedResult != null && _cacheTime != null) {
        final elapsed = DateTime.now().difference(_cacheTime!);
        if (elapsed < _cacheDuration) {
          print('📋 [DocumentVerification] Using cached result');
          return _cachedResult!;
        }
      }

      print('📋 [DocumentVerification] Checking document status...');

      // Get user data
      final userData = await SecureStorage.getUserData();
      final userId = userData?['_id'] ?? userData?['id'];

      // Try multiple paths to get clientType
      String? rawClientType =
          userData?['clientDetails']?['clientType'] ??
          userData?['clientType'] ??
          userData?['client_type'] ??
          userData?['type'];

      // إذا لم نجد clientType في userData، نجربه من SharedPreferences
      if (rawClientType == null || rawClientType.toString().isEmpty) {
        final prefs = await SharedPreferences.getInstance();
        rawClientType = prefs.getString('client_type');
        print(
          '📋 [DocumentVerification] Got clientType from SharedPreferences: $rawClientType',
        );
      }

      // Normalize clientType to lowercase for comparison
      final clientType = rawClientType?.toString().toLowerCase() ?? 'personal';

      print('📋 [DocumentVerification] Raw clientType: $rawClientType');
      print('📋 [DocumentVerification] Normalized clientType: $clientType');

      if (userId == null) {
        return {
          'canSubmitRequests': false,
          'message': 'يجب تسجيل الدخول أولاً',
          'missingDocuments': <String>[],
          'pendingDocuments': <String>[],
          'rejectedDocuments': <Map<String, dynamic>>[],
        };
      }

      // Get required documents for this client type
      final requiredDocs = getRequiredDocuments(clientType);
      print('📋 [DocumentVerification] Client type: $clientType');
      print('📋 [DocumentVerification] Required docs: $requiredDocs');

      // Fetch user's registration documents
      final response = await ApiService.getUploads(
        userId: userId,
        category: 'registration',
      );

      if (response['success'] != true) {
        return {
          'canSubmitRequests': false,
          'message': 'فشل تحميل بيانات المستندات',
          'missingDocuments': requiredDocs,
          'pendingDocuments': <String>[],
          'rejectedDocuments': <Map<String, dynamic>>[],
        };
      }

      final uploads = List<Map<String, dynamic>>.from(
        response['uploads'] ?? [],
      );
      print('📋 [DocumentVerification] Found ${uploads.length} uploads');

      // Analyze documents
      final List<String> missingDocs = [];
      final List<String> pendingDocs = [];
      final List<Map<String, dynamic>> rejectedDocs = [];
      int approvedCount = 0;

      for (final docType in requiredDocs) {
        final doc = uploads.where((u) => u['documentType'] == docType).toList();

        if (doc.isEmpty) {
          missingDocs.add(docType);
        } else {
          final status = doc.first['approvalStatus']?.toString() ?? 'pending';

          switch (status) {
            case 'approved':
              approvedCount++;
              break;
            case 'rejected':
              rejectedDocs.add({
                'type': docType,
                'reason': doc.first['rejectionReason'] ?? 'لم يتم تحديد السبب',
              });
              break;
            case 'pending':
            default:
              pendingDocs.add(docType);
              break;
          }
        }
      }

      // Determine if user can submit requests
      final bool canSubmit =
          missingDocs.isEmpty &&
          rejectedDocs.isEmpty &&
          pendingDocs.isEmpty &&
          approvedCount == requiredDocs.length;

      // Generate appropriate message
      String message;
      if (canSubmit) {
        message = 'جميع المستندات معتمدة. يمكنك تقديم الطلبات';
      } else if (missingDocs.isNotEmpty) {
        message =
            'يوجد ${missingDocs.length} مستند ناقص. يرجى رفع جميع المستندات المطلوبة من صفحة المستندات';
      } else if (rejectedDocs.isNotEmpty) {
        message =
            'يوجد ${rejectedDocs.length} مستند مرفوض. يرجى إعادة رفعها من صفحة المستندات';
      } else if (pendingDocs.isNotEmpty) {
        message = 'المستندات قيد المراجعة. سيتم إعلامك عند الموافقة عليها';
      } else {
        message = 'جاري التحقق من المستندات...';
      }

      final result = {
        'canSubmitRequests': canSubmit,
        'message': message,
        'missingDocuments': missingDocs,
        'pendingDocuments': pendingDocs,
        'rejectedDocuments': rejectedDocs,
        'approvedCount': approvedCount,
        'totalRequired': requiredDocs.length,
        'clientType': clientType,
      };

      // Cache the result
      _cachedResult = result;
      _cacheTime = DateTime.now();

      print(
        '📋 [DocumentVerification] Result: canSubmit=$canSubmit, missing=${missingDocs.length}, pending=${pendingDocs.length}, rejected=${rejectedDocs.length}',
      );

      return result;
    } catch (e) {
      print('❌ [DocumentVerification] Error: $e');
      return {
        'canSubmitRequests': false,
        'message': 'حدث خطأ في التحقق من المستندات',
        'missingDocuments': <String>[],
        'pendingDocuments': <String>[],
        'rejectedDocuments': <Map<String, dynamic>>[],
        'error': e.toString(),
      };
    }
  }

  /// Clear cached result
  void clearCache() {
    _cachedResult = null;
    _cacheTime = null;
  }

  /// Get Arabic name for document type
  static String getDocumentTypeName(String type) {
    switch (type) {
      case 'personal_id':
        return 'البطاقة الشخصية';
      case 'passport':
        return 'جواز السفر';
      case 'power_of_attorney':
        return 'التوكيل';
      case 'contract':
        return 'العقد';
      case 'tax_card':
        return 'البطاقة الضريبية';
      case 'commercial_register':
        return 'السجل التجاري';
      case 'certificate_vat':
        return 'شهادة القيمة المضافة';
      case 'industrial_register':
        return 'السجل الصناعي';
      case 'production_supplies':
        return 'مستلزمات الإنتاج';
      case 'import_export_card':
        return 'بطاقة استيراد/تصدير';
      case 'personal_id_of_representative':
        return 'بطاقة المفوض';
      case 'trade_certificates':
        return 'شهادات المزاولة';
      default:
        return type;
    }
  }
}
