import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/storage/secure_storage.dart';
import '../../core/services/notification_service.dart';
import '../../util/file_picker_helper.dart';

class DocumentsSettingsPage extends StatefulWidget {
  const DocumentsSettingsPage({Key? key}) : super(key: key);

  @override
  State<DocumentsSettingsPage> createState() => _DocumentsSettingsPageState();
}

class _DocumentsSettingsPageState extends State<DocumentsSettingsPage> {
  List<Map<String, dynamic>> _documents = [];
  List<Map<String, dynamic>> _requiredDocuments = [];
  String _clientType = '';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDocuments();
  }

  Future<void> _loadDocuments() async {
    try {
      setState(() => _isLoading = true);

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
          '📋 [DocumentsSettings] Got clientType from SharedPreferences: $rawClientType',
        );
      }

      // Normalize clientType to lowercase for comparison
      _clientType = rawClientType?.toString().toLowerCase() ?? 'personal';

      // Debug logging
      print('📋 [DocumentsSettings] Full userData: $userData');
      print(
        '📋 [DocumentsSettings] clientDetails: ${userData?['clientDetails']}',
      );
      print('📋 [DocumentsSettings] Raw clientType: $rawClientType');
      print('📋 [DocumentsSettings] Normalized clientType: $_clientType');

      // تحديد المستندات المطلوبة بناءً على نوع العميل
      _requiredDocuments = _getRequiredDocumentsByType(_clientType);
      print(
        '📋 [DocumentsSettings] Required documents count: ${_requiredDocuments.length}',
      );
      print(
        '📋 [DocumentsSettings] Required documents: ${_requiredDocuments.map((d) => d['type']).toList()}',
      );

      if (userId != null) {
        final response = await ApiService.getUploads(
          userId: userId,
          category: 'registration',
        );

        if (response['success'] == true) {
          final allUploads = List<Map<String, dynamic>>.from(
            response['uploads'] ?? [],
          );

          // Filter only registration documents
          final registrationDocs =
              allUploads.where((doc) {
                final category = doc['category']?.toString() ?? '';
                return category == 'registration';
              }).toList();

          print('📄 [DocumentsSettings] Total uploads: ${allUploads.length}');
          print(
            '📄 [DocumentsSettings] Registration docs: ${registrationDocs.length}',
          );

          setState(() {
            _documents = registrationDocs;
          });
        }
      }

      setState(() => _isLoading = false);
    } catch (e) {
      print('Error loading documents: $e');
      setState(() => _isLoading = false);
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ في تحميل المستندات',
      );
    }
  }

  List<Map<String, dynamic>> _getRequiredDocumentsByType(String clientType) {
    // These must match EXACTLY what is uploaded during registration
    switch (clientType) {
      case 'personal':
        // From personalRegistration.dart
        return [
          {
            'type': 'personal_id',
            'name': 'البطاقة الشخصية',
            'icon': Icons.credit_card,
          },
          {'type': 'power_of_attorney', 'name': 'التوكيل', 'icon': Icons.gavel},
        ];
      case 'commercial':
        // From commercialRegistration.dart
        return [
          {'type': 'contract', 'name': 'العقد', 'icon': Icons.description},
          {
            'type': 'tax_card',
            'name': 'البطاقة الضريبية',
            'icon': Icons.receipt_long,
          },
          {
            'type': 'commercial_register',
            'name': 'السجل التجاري',
            'icon': Icons.business,
          },
          {
            'type': 'certificate_vat',
            'name': 'شهادة القيمة المضافة',
            'icon': Icons.verified,
          },
          {
            'type': 'import_export_card',
            'name': 'بطاقة استيراد/تصدير',
            'icon': Icons.credit_card,
          },
        ];
      case 'factory':
        // From factoryRegistration.dart
        return [
          {'type': 'contract', 'name': 'العقد', 'icon': Icons.description},
          {
            'type': 'tax_card',
            'name': 'البطاقة الضريبية',
            'icon': Icons.receipt_long,
          },
          {
            'type': 'commercial_register',
            'name': 'السجل التجاري',
            'icon': Icons.business,
          },
          {
            'type': 'certificate_vat',
            'name': 'شهادة القيمة المضافة',
            'icon': Icons.verified,
          },
          {
            'type': 'production_supplies',
            'name': 'مستلزمات الإنتاج',
            'icon': Icons.inventory,
          },
          {
            'type': 'industrial_register',
            'name': 'السجل الصناعي',
            'icon': Icons.factory,
          },
        ];
      default:
        return [
          {
            'type': 'personal_id',
            'name': 'البطاقة الشخصية',
            'icon': Icons.credit_card,
          },
          {'type': 'power_of_attorney', 'name': 'التوكيل', 'icon': Icons.gavel},
        ];
    }
  }

  bool _isDocumentUploaded(String docType) {
    return _documents.any((doc) => doc['documentType'] == docType);
  }

  /// Get document by type
  Map<String, dynamic>? _getDocumentByType(String docType) {
    try {
      return _documents.firstWhere((doc) => doc['documentType'] == docType);
    } catch (e) {
      return null;
    }
  }

  /// Get document approval status
  String _getDocumentStatus(String docType) {
    final doc = _getDocumentByType(docType);
    if (doc == null) return 'not_uploaded';
    return doc['approvalStatus']?.toString() ?? 'pending';
  }

  /// Check if all required documents are approved
  bool get _allDocumentsApproved {
    for (var reqDoc in _requiredDocuments) {
      final status = _getDocumentStatus(reqDoc['type']);
      if (status != 'approved') return false;
    }
    return true;
  }

  /// Check if there are any rejected documents
  bool get _hasRejectedDocuments {
    return _documents.any((doc) => doc['approvalStatus'] == 'rejected');
  }

  /// Check if there are missing required documents
  bool get _hasMissingDocuments {
    return _requiredDocuments.any(
      (reqDoc) => !_isDocumentUploaded(reqDoc['type']),
    );
  }

  /// Get status color
  Color _getStatusColor(String status) {
    switch (status) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  /// Get status text
  String _getStatusText(String status) {
    switch (status) {
      case 'approved':
        return 'تمت الموافقة';
      case 'rejected':
        return 'مرفوض';
      case 'pending':
        return 'قيد المراجعة';
      case 'not_uploaded':
        return 'غير مرفوع';
      default:
        return 'غير محدد';
    }
  }

  /// Get status icon
  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      case 'pending':
        return Icons.access_time;
      case 'not_uploaded':
        return Icons.upload_file;
      default:
        return Icons.help_outline;
    }
  }

  String _getDocumentTypeName(String? type) {
    switch (type) {
      case 'personal_id':
        return 'البطاقة الشخصية';
      case 'national_id':
        return 'بطاقة الهوية';
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
      case 'power_of_attorney':
        return 'التوكيل';
      default:
        return type ?? 'مستند';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        body: CustomScrollView(
          slivers: [
            // Enhanced AppBar with Logo
            SliverAppBar(
              expandedHeight: 180,
              floating: false,
              pinned: true,
              elevation: 0,
              backgroundColor: const Color(0xFF690000),
              automaticallyImplyLeading: false,
              actions: [
                Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_forward, color: Colors.white),
                    onPressed: () => context.pop(),
                  ),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                centerTitle: true,
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                      colors: [
                        const Color(0xFF690000),
                        const Color(0xFF8B0000),
                      ],
                    ),
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(25),
                      bottomRight: Radius.circular(25),
                    ),
                  ),
                  child: SafeArea(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const SizedBox(height: 20),
                          // Logo
                          Container(
                            width: 70,
                            height: 70,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(15),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 15,
                                  offset: const Offset(0, 5),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(15),
                              child: Image.asset(
                                'assets/img/logo.png',
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return const Icon(
                                    Icons.folder_open,
                                    color: Color(0xFF690000),
                                    size: 40,
                                  );
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'المستندات المرفوعة',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // Content
            _isLoading
                ? SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const CircularProgressIndicator(
                          color: Color(0xFF690000),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'جاري تحميل المستندات...',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                : _documents.isEmpty
                ? SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(30),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.folder_open,
                            size: 80,
                            color: Colors.grey[400],
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'لا توجد مستندات مرفوعة',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'اسحب للأسفل للتحديث',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 13,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                : SliverPadding(
                  padding: const EdgeInsets.all(20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (index == 0) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Stats Cards Row
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildStatCard(
                                      'مقبولة',
                                      '${_documents.where((d) => d['approvalStatus'] == 'approved').length}',
                                      Colors.green,
                                      Icons.check_circle,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildStatCard(
                                      'قيد المراجعة',
                                      '${_documents.where((d) => d['approvalStatus'] == 'pending').length}',
                                      Colors.orange,
                                      Icons.access_time,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildStatCard(
                                      'مرفوضة',
                                      '${_documents.where((d) => d['approvalStatus'] == 'rejected').length}',
                                      Colors.red,
                                      Icons.cancel,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              // Second row - upload status
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildStatCard(
                                      'المرفوعة',
                                      '${_documents.length}',
                                      const Color(0xFF1ba3b6),
                                      Icons.cloud_upload,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildStatCard(
                                      'ناقصة',
                                      '${_requiredDocuments.where((r) => !_isDocumentUploaded(r['type'])).length}',
                                      const Color(0xFF690000),
                                      Icons.warning_amber,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              // Warning banner if documents not approved
                              if (!_allDocumentsApproved)
                                Container(
                                  margin: const EdgeInsets.only(bottom: 16),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Colors.orange.shade100,
                                        Colors.orange.shade50,
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: Colors.orange.shade300,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: Colors.orange,
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.info_outline,
                                          color: Colors.white,
                                          size: 24,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'تنبيه مهم',
                                              style: TextStyle(
                                                fontFamily: 'Cairo',
                                                fontSize: 15,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF2D2D2D),
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              _hasMissingDocuments
                                                  ? 'يوجد مستندات ناقصة. يرجى رفعها لتتمكن من تقديم طلبات ACID و UCR'
                                                  : _hasRejectedDocuments
                                                  ? 'يوجد مستندات مرفوضة. يرجى إعادة رفعها للتمكن من تقديم الطلبات'
                                                  : 'المستندات قيد المراجعة. ستتمكن من تقديم الطلبات بعد الموافقة عليها',
                                              style: TextStyle(
                                                fontFamily: 'Cairo',
                                                fontSize: 12,
                                                color: Colors.grey[700],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              const SizedBox(height: 8),

                              // Required Documents Section
                              Row(
                                children: [
                                  Container(
                                    width: 4,
                                    height: 20,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF690000),
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'المستندات المطلوبة',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 17,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF2D2D2D),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                            ],
                          );
                        }

                        // Show all uploaded documents + missing required documents
                        int uploadedDocsCount = _documents.length;
                        int missingDocsCount =
                            _requiredDocuments
                                .where(
                                  (reqDoc) =>
                                      !_isDocumentUploaded(reqDoc['type']),
                                )
                                .length;
                        int totalItems = uploadedDocsCount + missingDocsCount;

                        if (index - 1 < totalItems) {
                          int currentIndex = index - 1;

                          // Show uploaded documents first
                          if (currentIndex < uploadedDocsCount) {
                            final doc = _documents[currentIndex];
                            final isRequired = _requiredDocuments.any(
                              (reqDoc) => reqDoc['type'] == doc['documentType'],
                            );
                            return _buildDocumentCard(
                              doc,
                              isRequired: isRequired,
                            );
                          }

                          // Then show missing required documents
                          int missingIndex = currentIndex - uploadedDocsCount;
                          final missingDocs =
                              _requiredDocuments
                                  .where(
                                    (reqDoc) =>
                                        !_isDocumentUploaded(reqDoc['type']),
                                  )
                                  .toList();

                          if (missingIndex < missingDocs.length) {
                            return _buildMissingDocumentCard(
                              missingDocs[missingIndex],
                            );
                          }
                        }

                        return const SizedBox.shrink();
                      },
                      childCount:
                          _documents.length +
                          _requiredDocuments
                              .where(
                                (reqDoc) =>
                                    !_isDocumentUploaded(reqDoc['type']),
                              )
                              .length +
                          1,
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 13,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMissingDocumentCard(Map<String, dynamic> reqDoc) {
    return InkWell(
      onTap: () => _uploadDocument(reqDoc['type'], reqDoc['name']),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.orange.shade300, width: 2),
          boxShadow: [
            BoxShadow(
              color: Colors.orange.withOpacity(0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 65,
                height: 65,
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.orange.shade200, width: 2),
                ),
                child: Icon(
                  reqDoc['icon'] ?? Icons.description,
                  color: Colors.orange,
                  size: 32,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.orange,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'مطلوب',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            reqDoc['name'] ?? 'مستند',
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF2D2D2D),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'يرجى رفع هذا المستند',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.upload_file,
                  color: Colors.orange,
                  size: 24,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _uploadDocument(String documentType, String documentName) async {
    try {
      final File? pickedFile = await FilePickerHelper.pickFile(context);

      if (pickedFile != null) {
        setState(() => _isLoading = true);

        // Use uploadToS3 like registration pages for consistency
        final response = await ApiService.uploadToS3(
          file: pickedFile,
          category: 'registration',
          documentType: documentType,
          description: '$documentName - إضافة من صفحة المستندات',
          tags: [documentType, _clientType, 'registration'],
          userType: 'client',
          clientType: _clientType,
        );

        setState(() => _isLoading = false);

        if (response['success'] == true) {
          AlNoranPopups.showSuccess(
            context: context,
            message: 'تم رفع $documentName بنجاح\nفي انتظار مراجعة الإدارة',
          );
          // Refresh notifications
          NotificationService().refresh();
          _loadDocuments();
        } else {
          throw Exception(response['message'] ?? 'فشل رفع المستند');
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ أثناء رفع المستند: ${e.toString()}',
      );
    }
  }

  /// Re-upload rejected document
  Future<void> _reuploadDocument(Map<String, dynamic> existingDoc) async {
    final documentType = existingDoc['documentType']?.toString() ?? '';
    final documentName = _getDocumentTypeName(documentType);
    final rejectionReason =
        existingDoc['rejectionReason']?.toString() ?? 'لم يتم تحديد السبب';

    // Show rejection reason first with themed dialog
    final shouldReupload = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Container(
                padding: const EdgeInsets.all(0),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: Colors.white,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header with gradient
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        vertical: 20,
                        horizontal: 20,
                      ),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF690000), Color(0xFF8B0000)],
                        ),
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(20),
                          topRight: Radius.circular(20),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.warning_amber_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'المستند مرفوض',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Content
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'تم رفض مستند "$documentName" للسبب التالي:',
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF690000).withOpacity(0.05),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFF690000).withOpacity(0.2),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: const Color(0xFF690000),
                                  size: 20,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    rejectionReason,
                                    style: const TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 13,
                                      color: Color(0xFF690000),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.cloud_upload_outlined,
                                  color: const Color(0xFF1ba3b6),
                                  size: 22,
                                ),
                                const SizedBox(width: 10),
                                const Expanded(
                                  child: Text(
                                    'يرجى رفع المستند الصحيح لإكمال عملية التسجيل',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 12,
                                      color: Colors.black54,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Actions
                    Container(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(context, false),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                side: BorderSide(color: Colors.grey.shade300),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Text(
                                'لاحقاً',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  color: Colors.grey,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => Navigator.pop(context, true),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF690000),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.upload_file,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'رفع المستند',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
    );

    if (shouldReupload == true) {
      // Delete old document first, then upload new one
      try {
        final uploadId = existingDoc['_id']?.toString();
        if (uploadId != null) {
          await ApiService.deleteUpload(uploadId: uploadId);
        }
        // Now upload new document
        await _uploadDocument(documentType, documentName);
      } catch (e) {
        print('❌ [ReuploadDocument] Error: $e');
        // Still try to upload even if delete fails
        await _uploadDocument(documentType, documentName);
      }
    }
  }

  /// Replace/Edit pending document (same as re-upload but for pending status)
  Future<void> _replaceDocument(Map<String, dynamic> existingDoc) async {
    final documentType = existingDoc['documentType']?.toString() ?? '';
    final documentName = _getDocumentTypeName(documentType);

    // Show confirmation dialog with themed design
    final shouldReplace = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Container(
                padding: const EdgeInsets.all(0),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: Colors.white,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header with gradient
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        vertical: 20,
                        horizontal: 20,
                      ),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF690000), Color(0xFF8B0000)],
                        ),
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(20),
                          topRight: Radius.circular(20),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.edit_document,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'تعديل المستند',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Content
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'هل تريد استبدال مستند "$documentName" بملف جديد؟',
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1ba3b6).withOpacity(0.08),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFF1ba3b6).withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: const Color(0xFF1ba3b6),
                                  size: 22,
                                ),
                                const SizedBox(width: 10),
                                const Expanded(
                                  child: Text(
                                    'سيتم حذف الملف الحالي وإضافة الملف الجديد',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 13,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Actions
                    Container(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(context, false),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                side: BorderSide(color: Colors.grey.shade300),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Text(
                                'إلغاء',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  color: Colors.grey,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => Navigator.pop(context, true),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF690000),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.swap_horiz,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'استبدال',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
    );

    if (shouldReplace == true) {
      // Delete old document first, then upload new one
      try {
        final uploadId = existingDoc['_id']?.toString();
        if (uploadId != null) {
          await ApiService.deleteUpload(uploadId: uploadId);
        }
        // Now upload new document
        await _uploadDocument(documentType, documentName);
      } catch (e) {
        print('❌ [ReplaceDocument] Error: $e');
        // Still try to upload even if delete fails
        await _uploadDocument(documentType, documentName);
      }
    }
  }

  Widget _buildDocumentCard(
    Map<String, dynamic> doc, {
    bool isRequired = false,
  }) {
    final isPDF = doc['mimetype']?.toString().contains('pdf') ?? false;
    final isImage = doc['mimetype']?.toString().contains('image') ?? false;
    final approvalStatus = doc['approvalStatus']?.toString() ?? 'pending';
    final statusColor = _getStatusColor(approvalStatus);
    final statusText = _getStatusText(approvalStatus);
    final statusIcon = _getStatusIcon(approvalStatus);
    final isRejected = approvalStatus == 'rejected';
    final rejectionReason = doc['rejectionReason']?.toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border:
            isRejected
                ? Border.all(color: Colors.red.shade300, width: 2)
                : null,
        boxShadow: [
          BoxShadow(
            color:
                isRejected
                    ? Colors.red.withOpacity(0.1)
                    : Colors.black.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Icon Container
                Container(
                  width: 65,
                  height: 65,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors:
                          isPDF
                              ? [Colors.red.shade400, Colors.red.shade600]
                              : isImage
                              ? [Colors.blue.shade400, Colors.blue.shade600]
                              : [Colors.green.shade400, Colors.green.shade600],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: (isPDF
                                ? Colors.red
                                : isImage
                                ? Colors.blue
                                : Colors.green)
                            .withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    isPDF
                        ? Icons.picture_as_pdf
                        : isImage
                        ? Icons.image
                        : Icons.insert_drive_file,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                // Document Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Document name and status badge row
                      Row(
                        children: [
                          // Approval Status Badge
                          Container(
                            margin: const EdgeInsets.only(left: 8),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: statusColor,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(statusIcon, size: 12, color: Colors.white),
                                const SizedBox(width: 4),
                                Text(
                                  statusText,
                                  style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Text(
                              _getDocumentTypeName(doc['documentType']),
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF690000),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      // Rejection reason if rejected
                      if (isRejected &&
                          rejectionReason != null &&
                          rejectionReason.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.info_outline,
                                size: 14,
                                color: Colors.red.shade700,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  rejectionReason,
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 11,
                                    color: Colors.red.shade700,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      Row(
                        children: [
                          Icon(
                            Icons.description,
                            size: 14,
                            color: Colors.grey[500],
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              doc['filename'] ?? 'مستند',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today,
                            size: 14,
                            color: Colors.grey[500],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatDate(doc['uploadedAt']),
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 11,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Actions Divider
          Divider(height: 1, color: Colors.grey[200]),
          // Actions Row - different actions based on status
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // For approved: only view
                if (approvalStatus == 'approved') ...[
                  _buildActionButton(
                    icon: Icons.visibility,
                    label: 'عرض',
                    color: const Color(0xFF1ba3b6),
                    onPressed: () => _viewDocument(doc),
                  ),
                ]
                // For rejected: ONLY re-upload (no view)
                else if (isRejected) ...[
                  _buildActionButton(
                    icon: Icons.cloud_upload_outlined,
                    label: 'إعادة رفع المستند',
                    color: const Color(0xFF690000),
                    onPressed: () => _reuploadDocument(doc),
                  ),
                ]
                // For pending: view + edit
                else ...[
                  _buildActionButton(
                    icon: Icons.visibility,
                    label: 'عرض',
                    color: const Color(0xFF1ba3b6),
                    onPressed: () => _viewDocument(doc),
                  ),
                  Container(width: 1, height: 30, color: Colors.grey[200]),
                  _buildActionButton(
                    icon: Icons.edit,
                    label: 'تعديل',
                    color: const Color(0xFF690000),
                    onPressed: () => _replaceDocument(doc),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _viewDocument(Map<String, dynamic> doc) async {
    try {
      // Use presignedUrl from backend (with fallback to url)
      final url = doc['presignedUrl']?.toString() ?? doc['url']?.toString();
      final mimetype = doc['mimetype']?.toString() ?? '';

      if (url == null || url.isEmpty) {
        AlNoranPopups.showError(
          context: context,
          message: 'رابط المستند غير متوفر',
        );
        return;
      }

      // Check if there was a permission error
      if (doc['permissionError'] == true) {
        AlNoranPopups.showWarning(
          context: context,
          message: 'لا يمكن عرض المستند - مشكلة في صلاحيات الوصول',
        );
        return;
      }

      print('📄 [ViewDocument] Document data: $doc');
      print('📄 [ViewDocument] Opening URL: $url');
      print('📄 [ViewDocument] Mimetype: $mimetype');

      // If it's an image, show in full screen viewer inside the app
      if (mimetype.contains('image')) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => _ImageViewerPage(
                  imageUrl: url,
                  title: _getDocumentTypeName(doc['documentType']),
                ),
          ),
        );
      }
      // For PDF or other documents, open in external application
      else {
        try {
          final uri = Uri.parse(url);
          print('📄 [ViewDocument] Opening in external app: $uri');

          // Use external application for PDF - works better on mobile
          bool launched = await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );

          if (!launched) {
            // Fallback to platform default
            launched = await launchUrl(uri);
          }

          if (!launched) {
            throw Exception('Failed to launch URL');
          }

          print('📄 [ViewDocument] Document opened successfully');
        } catch (e) {
          print('❌ [ViewDocument] Launch error: $e');
          AlNoranPopups.showError(
            context: context,
            message: 'تعذر فتح المستند',
          );
        }
      }
    } catch (e) {
      print('❌ [ViewDocument] Error: $e');
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ في فتح المستند: ${e.toString()}',
      );
    }
  }

  Future<void> _editDocument(Map<String, dynamic> doc) async {
    final descriptionController = TextEditingController(
      text: doc['description']?.toString() ?? '',
    );

    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder:
          (dialogContext) => Directionality(
            textDirection: TextDirection.rtl,
            child: Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
              elevation: 0,
              backgroundColor: Colors.transparent,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFF690000),
                            const Color(0xFF8B0000),
                          ],
                        ),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(25),
                          topRight: Radius.circular(25),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.edit_document,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 16),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'تعديل المستند',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'تحديث معلومات المستند',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 13,
                                    color: Colors.white70,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Content
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Document Type Badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1ba3b6).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: const Color(0xFF1ba3b6).withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.label,
                                  size: 18,
                                  color: Color(0xFF1ba3b6),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _getDocumentTypeName(doc['documentType']),
                                  style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF1ba3b6),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Description Field
                          const Text(
                            'الوصف (اختياري)',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF2D2D2D),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F5F5),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: TextField(
                              controller: descriptionController,
                              decoration: const InputDecoration(
                                hintText: 'أضف وصف للمستند...',
                                hintStyle: TextStyle(
                                  fontFamily: 'Cairo',
                                  color: Color(0xFFBDBDBD),
                                ),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.all(16),
                              ),
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 14,
                              ),
                              maxLines: 4,
                              textDirection: TextDirection.rtl,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Actions
                    Padding(
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed:
                                  () => Navigator.pop(dialogContext, false),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                side: BorderSide(
                                  color: Colors.grey.shade300,
                                  width: 1.5,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Text(
                                'إلغاء',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF424242),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed:
                                  () => Navigator.pop(dialogContext, true),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF690000),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.check,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'حفظ التغييرات',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
    );

    if (result == true) {
      try {
        final uploadId = doc['_id']?.toString();
        if (uploadId == null) {
          AlNoranPopups.showError(
            context: context,
            message: 'معرف المستند غير صحيح',
          );
          return;
        }

        print('📝 [EditDocument] Updating document: $uploadId');
        print(
          '📝 [EditDocument] New description: ${descriptionController.text}',
        );

        final response = await ApiService.updateUpload(
          uploadId: uploadId,
          description: descriptionController.text.trim(),
        );

        if (response['success'] == true) {
          AlNoranPopups.showSuccess(
            context: context,
            message: 'تم تحديث المستند بنجاح',
          );
          _loadDocuments(); // Reload documents
        } else {
          AlNoranPopups.showError(
            context: context,
            message: response['message'] ?? 'فشل تحديث المستند',
          );
        }
      } catch (e) {
        print('❌ [EditDocument] Error: $e');
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ في تحديث المستند',
        );
      }
    }

    descriptionController.dispose();
  }

  Future<void> _deleteDocument(Map<String, dynamic> doc) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Text(
                'تأكيد الحذف',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.bold,
                ),
              ),
              content: Text(
                'هل أنت متأكد من حذف المستند "${_getDocumentTypeName(doc['documentType'])}"؟',
                style: const TextStyle(fontFamily: 'Cairo'),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text(
                    'إلغاء',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.grey),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'حذف',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
    );

    if (confirm == true) {
      try {
        final uploadId = doc['_id']?.toString();
        if (uploadId == null) {
          AlNoranPopups.showError(
            context: context,
            message: 'معرف المستند غير صحيح',
          );
          return;
        }

        print('🗑️ [DeleteDocument] Deleting document: $uploadId');

        final response = await ApiService.deleteUpload(uploadId: uploadId);

        if (response['success'] == true) {
          AlNoranPopups.showSuccess(
            context: context,
            message: 'تم حذف المستند بنجاح',
          );
          _loadDocuments(); // Reload documents
        } else {
          AlNoranPopups.showError(
            context: context,
            message: response['message'] ?? 'فشل حذف المستند',
          );
        }
      } catch (e) {
        print('❌ [DeleteDocument] Error: $e');
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ في حذف المستند',
        );
      }
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'غير محدد';
    try {
      final DateTime dateTime = DateTime.parse(date.toString());
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    } catch (e) {
      return 'غير محدد';
    }
  }
}

// Image Viewer Page - Full screen image viewer with zoom
class _ImageViewerPage extends StatelessWidget {
  final String imageUrl;
  final String title;

  const _ImageViewerPage({required this.imageUrl, required this.title});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black87,
          elevation: 0,
          automaticallyImplyLeading: false,
          title: Text(
            title,
            style: const TextStyle(
              fontFamily: 'Cairo',
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          centerTitle: true,
          actions: [
            Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
                tooltip: 'إغلاق',
              ),
            ),
          ],
        ),
        body: Center(
          child: InteractiveViewer(
            minScale: 0.5,
            maxScale: 4.0,
            child: Image.network(
              imageUrl,
              fit: BoxFit.contain,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        value:
                            loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                    loadingProgress.expectedTotalBytes!
                                : null,
                        color: Colors.white,
                        strokeWidth: 3,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'جاري تحميل الصورة...',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.error_outline,
                          color: Colors.white,
                          size: 64,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'فشل تحميل الصورة',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'تحقق من اتصال الإنترنت',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        bottomNavigationBar: Container(
          color: Colors.black87,
          padding: const EdgeInsets.all(12),
          child: SafeArea(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.zoom_in,
                  color: Colors.white.withOpacity(0.7),
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'اسحب بإصبعين للتكبير والتصغير',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
