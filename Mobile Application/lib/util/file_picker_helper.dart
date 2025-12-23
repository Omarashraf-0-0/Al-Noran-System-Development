import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';

class FilePickerHelper {
  static final ImagePicker _imagePicker = ImagePicker();

  /// عرض قائمة اختيار نوع الملف (كاميرا، صور، مستندات) - Premium Design
  static Future<File?> pickFile(BuildContext context) async {
    final String? choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (context) => _PremiumFilePickerSheet(
            title: 'اختر طريقة رفع الملف',
            options: [
              _FileOption(
                icon: Icons.camera_alt_rounded,
                title: 'التقاط صورة',
                subtitle: 'استخدم الكاميرا لالتقاط صورة جديدة',
                value: 'camera',
                iconGradient: const [Color(0xFF690000), Color(0xFF8B0000)],
              ),
              _FileOption(
                icon: Icons.photo_library_rounded,
                title: 'اختيار صورة',
                subtitle: 'اختر صورة من معرض الصور',
                value: 'gallery',
                iconGradient: const [Color(0xFF1BA3B6), Color(0xFF15919F)],
              ),
              _FileOption(
                icon: Icons.picture_as_pdf_rounded,
                title: 'اختيار ملف PDF',
                subtitle: 'اختر ملف PDF من جهازك',
                value: 'pdf',
                iconGradient: const [Color(0xFFA40000), Color(0xFF7A0000)],
              ),
            ],
          ),
    );

    if (choice == null) return null;

    try {
      if (choice == 'camera') {
        final XFile? pickedFile = await _imagePicker.pickImage(
          source: ImageSource.camera,
          imageQuality: 85,
        );
        if (pickedFile != null) {
          return File(pickedFile.path);
        }
      } else if (choice == 'gallery') {
        final XFile? pickedFile = await _imagePicker.pickImage(
          source: ImageSource.gallery,
          imageQuality: 85,
        );
        if (pickedFile != null) {
          return File(pickedFile.path);
        }
      } else if (choice == 'pdf') {
        final FilePickerResult? result = await FilePicker.platform.pickFiles(
          type: FileType.custom,
          allowedExtensions: ['pdf'],
          allowMultiple: false,
        );
        if (result != null && result.files.single.path != null) {
          return File(result.files.single.path!);
        }
      }
    } catch (e) {
      debugPrint('Error picking file: $e');
    }

    return null;
  }

  /// اختيار ملفات متعددة (صور و PDF) - Premium Design
  static Future<List<File>> pickMultipleFiles(BuildContext context) async {
    final String? choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (context) => _PremiumFilePickerSheet(
            title: 'اختر طريقة رفع الملفات',
            options: [
              _FileOption(
                icon: Icons.collections_rounded,
                title: 'اختيار صور متعددة',
                subtitle: 'اختر أكثر من صورة من المعرض',
                value: 'images',
                iconGradient: const [Color(0xFF1BA3B6), Color(0xFF15919F)],
              ),
              _FileOption(
                icon: Icons.picture_as_pdf_rounded,
                title: 'اختيار ملفات PDF',
                subtitle: 'اختر أكثر من ملف PDF',
                value: 'pdfs',
                iconGradient: const [Color(0xFFA40000), Color(0xFF7A0000)],
              ),
              _FileOption(
                icon: Icons.folder_special_rounded,
                title: 'ملفات مختلطة',
                subtitle: 'اختر صور و PDF معاً',
                value: 'mixed',
                iconGradient: const [Color(0xFF690000), Color(0xFF8B0000)],
              ),
            ],
          ),
    );

    if (choice == null) return [];

    try {
      if (choice == 'images') {
        final List<XFile> pickedFiles = await _imagePicker.pickMultiImage(
          imageQuality: 85,
        );
        return pickedFiles.map((xFile) => File(xFile.path)).toList();
      } else if (choice == 'pdfs') {
        final FilePickerResult? result = await FilePicker.platform.pickFiles(
          type: FileType.custom,
          allowedExtensions: ['pdf'],
          allowMultiple: true,
        );
        if (result != null) {
          return result.files
              .where((file) => file.path != null)
              .map((file) => File(file.path!))
              .toList();
        }
      } else if (choice == 'mixed') {
        final FilePickerResult? result = await FilePicker.platform.pickFiles(
          type: FileType.custom,
          allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
          allowMultiple: true,
        );
        if (result != null) {
          return result.files
              .where((file) => file.path != null)
              .map((file) => File(file.path!))
              .toList();
        }
      }
    } catch (e) {
      debugPrint('Error picking files: $e');
    }

    return [];
  }

  /// الحصول على اسم الملف
  static String getFileName(File file) {
    return file.path.split('/').last;
  }

  /// التحقق إذا كان الملف PDF
  static bool isPDF(File file) {
    return file.path.toLowerCase().endsWith('.pdf');
  }

  /// التحقق إذا كان الملف صورة
  static bool isImage(File file) {
    final extension = file.path.toLowerCase();
    return extension.endsWith('.jpg') ||
        extension.endsWith('.jpeg') ||
        extension.endsWith('.png');
  }

  /// الحصول على أيقونة حسب نوع الملف
  static IconData getFileIcon(File file) {
    if (isPDF(file)) {
      return Icons.picture_as_pdf;
    } else if (isImage(file)) {
      return Icons.image;
    }
    return Icons.insert_drive_file;
  }

  /// الحصول على لون حسب نوع الملف
  static Color getFileColor(File file) {
    if (isPDF(file)) {
      return const Color(0xFFA40000); // أحمر للـ PDF
    } else if (isImage(file)) {
      return const Color(0xFF1BA3B6); // تركواز للصور
    }
    return Colors.grey;
  }
}

/// Premium File Picker Bottom Sheet Widget
class _PremiumFilePickerSheet extends StatefulWidget {
  final String title;
  final List<_FileOption> options;

  const _PremiumFilePickerSheet({required this.title, required this.options});

  @override
  State<_PremiumFilePickerSheet> createState() =>
      _PremiumFilePickerSheetState();
}

class _PremiumFilePickerSheetState extends State<_PremiumFilePickerSheet>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideAnimation = Tween<double>(
      begin: 0.3,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(
            0,
            MediaQuery.of(context).size.height * _slideAnimation.value,
          ),
          child: Opacity(opacity: _fadeAnimation.value, child: child),
        );
      },
      child: Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 20,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header with gradient
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF690000), Color(0xFF8B0000)],
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                ),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
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
                      Icons.cloud_upload_rounded,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      widget.title,
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  // Gold accent line
                  Container(
                    width: 3,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFD4AF37),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ],
              ),
            ),

            // Options list
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  for (int i = 0; i < widget.options.length; i++) ...[
                    _buildOptionCard(widget.options[i], i),
                    if (i < widget.options.length - 1)
                      const SizedBox(height: 12),
                  ],
                ],
              ),
            ),

            // Cancel button
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                  ),
                  child: const Text(
                    'إلغاء',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionCard(_FileOption option, int index) {
    return TweenAnimationBuilder<double>(
      duration: Duration(milliseconds: 200 + (index * 100)),
      tween: Tween(begin: 0.0, end: 1.0),
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(30 * (1 - value), 0),
          child: Opacity(opacity: value, child: child),
        );
      },
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => Navigator.pop(context, option.value),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFAF9F7),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200, width: 1),
            ),
            child: Row(
              children: [
                // Icon with gradient background
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: option.iconGradient,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: option.iconGradient.first.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(option.icon, color: Colors.white, size: 24),
                ),
                const SizedBox(width: 16),
                // Text content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        option.title,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1A1A),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        option.subtitle,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                // Arrow icon with gold accent
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD4AF37).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: Color(0xFFD4AF37),
                    size: 16,
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

/// File option model
class _FileOption {
  final IconData icon;
  final String title;
  final String subtitle;
  final String value;
  final List<Color> iconGradient;

  const _FileOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.iconGradient,
  });
}
