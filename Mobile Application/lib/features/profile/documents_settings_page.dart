import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/storage/secure_storage.dart';
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
      _clientType = userData?['clientDetails']?['clientType'] ?? 'personal';

      // تحديد المستندات المطلوبة بناءً على نوع العميل
      _requiredDocuments = _getRequiredDocumentsByType(_clientType);

      if (userId != null) {
        final response = await ApiService.getUploads(
          userId: userId,
          category: 'registration',
        );

        if (response['success'] == true) {
          setState(() {
            _documents = List<Map<String, dynamic>>.from(
              response['uploads'] ?? [],
            );
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
    switch (clientType) {
      case 'personal':
        return [
          {
            'type': 'national_id',
            'name': 'بطاقة الهوية',
            'icon': Icons.credit_card,
          },
          {'type': 'contract', 'name': 'العقد', 'icon': Icons.description},
        ];
      case 'commercial':
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
          {'type': 'power_of_attorney', 'name': 'التوكيل', 'icon': Icons.gavel},
        ];
      case 'factory':
        return [
          {'type': 'contract', 'name': 'العقد', 'icon': Icons.description},
          {
            'type': 'tax_card',
            'name': 'البطاقة الضريبية',
            'icon': Icons.receipt_long,
          },
          {
            'type': 'industrial_register',
            'name': 'السجل الصناعي',
            'icon': Icons.factory,
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
            'type': 'import_export_card',
            'name': 'بطاقة استيراد/تصدير',
            'icon': Icons.credit_card,
          },
          {'type': 'power_of_attorney', 'name': 'التوكيل', 'icon': Icons.gavel},
        ];
      default:
        return [
          {
            'type': 'national_id',
            'name': 'بطاقة الهوية',
            'icon': Icons.credit_card,
          },
          {'type': 'contract', 'name': 'العقد', 'icon': Icons.description},
        ];
    }
  }

  bool _isDocumentUploaded(String docType) {
    return _documents.any((doc) => doc['documentType'] == docType);
  }

  String _getDocumentTypeName(String? type) {
    switch (type) {
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
                                      'المرفوعة',
                                      '${_documents.length}',
                                      const Color(0xFF1ba3b6),
                                      Icons.check_circle,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildStatCard(
                                      'المطلوبة',
                                      '${_requiredDocuments.length}',
                                      const Color(0xFF690000),
                                      Icons.description,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),

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

        final response = await ApiService.uploadFile(
          filePath: pickedFile.path,
          category: 'registration',
          documentType: documentType,
        );

        setState(() => _isLoading = false);

        if (response['success'] == true) {
          AlNoranPopups.showSuccess(
            context: context,
            message: 'تم رفع $documentName بنجاح',
          );
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

  Widget _buildDocumentCard(
    Map<String, dynamic> doc, {
    bool isRequired = false,
  }) {
    final isPDF = doc['mimetype']?.toString().contains('pdf') ?? false;
    final isImage = doc['mimetype']?.toString().contains('image') ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
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
                      Row(
                        children: [
                          if (isRequired)
                            Container(
                              margin: const EdgeInsets.only(left: 8),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.green,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.check_circle,
                                    size: 12,
                                    color: Colors.white,
                                  ),
                                  SizedBox(width: 4),
                                  Text(
                                    'مطلوب',
                                    style: TextStyle(
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
          // Actions Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
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
                  onPressed: () => _editDocument(doc),
                ),
                Container(width: 1, height: 30, color: Colors.grey[200]),
                _buildActionButton(
                  icon: Icons.delete,
                  label: 'حذف',
                  color: Colors.red,
                  onPressed: () => _deleteDocument(doc),
                ),
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
      final url = doc['url']?.toString();
      if (url == null || url.isEmpty) {
        AlNoranPopups.showError(
          context: context,
          message: 'رابط المستند غير متوفر',
        );
        return;
      }

      print('📄 [ViewDocument] Opening URL: $url');

      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        AlNoranPopups.showError(
          context: context,
          message: 'لا يمكن فتح المستند',
        );
      }
    } catch (e) {
      print('❌ [ViewDocument] Error: $e');
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ في فتح المستند',
      );
    }
  }

  Future<void> _editDocument(Map<String, dynamic> doc) async {
    final descriptionController = TextEditingController(
      text: doc['description']?.toString() ?? '',
    );

    final result = await showDialog<bool>(
      context: context,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Text(
                'تعديل المستند',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.bold,
                ),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'نوع المستند: ${_getDocumentTypeName(doc['documentType'])}',
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: descriptionController,
                    decoration: InputDecoration(
                      labelText: 'الوصف',
                      labelStyle: const TextStyle(fontFamily: 'Cairo'),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: Colors.grey.shade50,
                    ),
                    style: const TextStyle(fontFamily: 'Cairo'),
                    maxLines: 3,
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => context.pop(false),
                  child: const Text(
                    'إلغاء',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.grey),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => context.pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF690000),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'حفظ',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.white),
                  ),
                ),
              ],
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
                  onPressed: () => context.pop(false),
                  child: const Text(
                    'إلغاء',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.grey),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => context.pop(true),
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
