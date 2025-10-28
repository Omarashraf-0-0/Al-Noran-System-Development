import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';

class FilePickerHelper {
  static final ImagePicker _imagePicker = ImagePicker();

  /// عرض قائمة اختيار نوع الملف (كاميرا، صور، مستندات)
  static Future<File?> pickFile(BuildContext context) async {
    final String? choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (context) => Container(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const Text(
                  'اختر طريقة رفع الملف',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF690000),
                  ),
                ),
                const SizedBox(height: 20),
                ListTile(
                  leading: const Icon(
                    Icons.camera_alt,
                    color: Color(0xFF690000),
                  ),
                  title: const Text(
                    'التقاط صورة',
                    textDirection: TextDirection.rtl,
                    style: TextStyle(fontSize: 16),
                  ),
                  onTap: () => Navigator.pop(context, 'camera'),
                ),
                ListTile(
                  leading: const Icon(
                    Icons.photo_library,
                    color: Color(0xFF1BA3B6),
                  ),
                  title: const Text(
                    'اختيار صورة من المعرض',
                    textDirection: TextDirection.rtl,
                    style: TextStyle(fontSize: 16),
                  ),
                  onTap: () => Navigator.pop(context, 'gallery'),
                ),
                ListTile(
                  leading: const Icon(
                    Icons.file_present,
                    color: Color(0xFFA40000),
                  ),
                  title: const Text(
                    'اختيار ملف PDF',
                    textDirection: TextDirection.rtl,
                    style: TextStyle(fontSize: 16),
                  ),
                  onTap: () => Navigator.pop(context, 'pdf'),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'إلغاء',
                    style: TextStyle(color: Colors.grey, fontSize: 16),
                  ),
                ),
              ],
            ),
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

  /// اختيار ملفات متعددة (صور و PDF)
  static Future<List<File>> pickMultipleFiles(BuildContext context) async {
    final String? choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (context) => Container(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const Text(
                  'اختر طريقة رفع الملفات',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF690000),
                  ),
                ),
                const SizedBox(height: 20),
                ListTile(
                  leading: const Icon(
                    Icons.photo_library,
                    color: Color(0xFF1BA3B6),
                  ),
                  title: const Text(
                    'اختيار صور متعددة',
                    textDirection: TextDirection.rtl,
                    style: TextStyle(fontSize: 16),
                  ),
                  onTap: () => Navigator.pop(context, 'images'),
                ),
                ListTile(
                  leading: const Icon(
                    Icons.file_present,
                    color: Color(0xFFA40000),
                  ),
                  title: const Text(
                    'اختيار ملفات PDF',
                    textDirection: TextDirection.rtl,
                    style: TextStyle(fontSize: 16),
                  ),
                  onTap: () => Navigator.pop(context, 'pdfs'),
                ),
                ListTile(
                  leading: const Icon(
                    Icons.folder_open,
                    color: Color(0xFF690000),
                  ),
                  title: const Text(
                    'اختيار ملفات مختلطة (صور + PDF)',
                    textDirection: TextDirection.rtl,
                    style: TextStyle(fontSize: 16),
                  ),
                  onTap: () => Navigator.pop(context, 'mixed'),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'إلغاء',
                    style: TextStyle(color: Colors.grey, fontSize: 16),
                  ),
                ),
              ],
            ),
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
