import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/storage/secure_storage.dart';

class DocumentsSettingsPage extends StatefulWidget {
  const DocumentsSettingsPage({Key? key}) : super(key: key);

  @override
  State<DocumentsSettingsPage> createState() => _DocumentsSettingsPageState();
}

class _DocumentsSettingsPageState extends State<DocumentsSettingsPage> {
  List<Map<String, dynamic>> _documents = [];
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

  String _getDocumentTypeName(String? type) {
    switch (type) {
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
        appBar: AppBar(
          backgroundColor: const Color(0xFF690000),
          elevation: 0,
          title: const Text(
            'إعدادات المستندات',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontWeight: FontWeight.bold,
              fontSize: 20,
              color: Colors.white,
            ),
          ),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward_ios, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body:
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                  onRefresh: _loadDocuments,
                  color: const Color(0xFF690000),
                  child:
                      _documents.isEmpty
                          ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(
                                  Icons.folder_open,
                                  size: 80,
                                  color: Colors.grey,
                                ),
                                SizedBox(height: 16),
                                Text(
                                  'لا توجد مستندات مرفوعة',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 18,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          )
                          : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _documents.length,
                            itemBuilder: (context, index) {
                              final doc = _documents[index];
                              return _buildDocumentCard(doc);
                            },
                          ),
                ),
      ),
    );
  }

  Widget _buildDocumentCard(Map<String, dynamic> doc) {
    final isPDF = doc['mimetype']?.toString().contains('pdf') ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: isPDF ? Colors.red.shade50 : Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isPDF ? Icons.picture_as_pdf : Icons.image,
              color: isPDF ? Colors.red : Colors.blue,
              size: 32,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getDocumentTypeName(doc['documentType']),
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF690000),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  doc['filename'] ?? 'مستند',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 13,
                    color: Colors.grey.shade600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'تم الرفع: ${_formatDate(doc['uploadedAt'])}',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 11,
                    color: Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.visibility, color: Color(0xFF1ba3b6)),
                onPressed: () => _viewDocument(doc),
                tooltip: 'عرض',
              ),
              IconButton(
                icon: const Icon(Icons.edit, color: Color(0xFF690000)),
                onPressed: () => _editDocument(doc),
                tooltip: 'تعديل',
              ),
              IconButton(
                icon: const Icon(Icons.delete, color: Colors.red),
                onPressed: () => _deleteDocument(doc),
                tooltip: 'حذف',
              ),
            ],
          ),
        ],
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
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text(
                    'إلغاء',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.grey),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
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
