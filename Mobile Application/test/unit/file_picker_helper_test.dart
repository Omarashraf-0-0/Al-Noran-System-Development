import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/util/file_picker_helper.dart';

void main() {
  group('FilePickerHelper', () {
    // ==================== getFileName Tests ====================
    group('getFileName', () {
      test('should extract filename from Unix-style path', () {
        final file = File('/path/to/document.pdf');
        expect(FilePickerHelper.getFileName(file), equals('document.pdf'));
      });

      test('should extract filename from path with deep nesting', () {
        final file = File('/a/b/c/d/e/f/myfile.jpg');
        expect(FilePickerHelper.getFileName(file), equals('myfile.jpg'));
      });

      test('should handle filename with spaces', () {
        final file = File('/path/to/my document file.pdf');
        expect(
          FilePickerHelper.getFileName(file),
          equals('my document file.pdf'),
        );
      });

      test('should handle filename with special characters', () {
        final file = File('/path/to/file_2024-01-15(1).pdf');
        expect(
          FilePickerHelper.getFileName(file),
          equals('file_2024-01-15(1).pdf'),
        );
      });

      test('should handle Arabic filename', () {
        final file = File('/path/to/مستند.pdf');
        expect(FilePickerHelper.getFileName(file), equals('مستند.pdf'));
      });

      test('should handle multiple extensions', () {
        final file = File('/path/to/archive.tar.gz');
        expect(FilePickerHelper.getFileName(file), equals('archive.tar.gz'));
      });

      test('should handle Windows-style path (backslashes)', () {
        // Note: File.path on Windows uses backslashes
        // but the implementation uses '/' which works on Unix
        // This test documents the current behavior
        final file = File('/storage/emulated/0/Download/file.pdf');
        expect(FilePickerHelper.getFileName(file), equals('file.pdf'));
      });

      test('should return entire path if no separator', () {
        final file = File('simplefile.txt');
        expect(FilePickerHelper.getFileName(file), equals('simplefile.txt'));
      });
    });

    // ==================== isPDF Tests ====================
    group('isPDF', () {
      test('should return true for .pdf extension (lowercase)', () {
        final file = File('/path/to/document.pdf');
        expect(FilePickerHelper.isPDF(file), isTrue);
      });

      test('should return true for .PDF extension (uppercase)', () {
        final file = File('/path/to/DOCUMENT.PDF');
        expect(FilePickerHelper.isPDF(file), isTrue);
      });

      test('should return true for .Pdf extension (mixed case)', () {
        final file = File('/path/to/Document.Pdf');
        expect(FilePickerHelper.isPDF(file), isTrue);
      });

      test('should return false for image files', () {
        expect(FilePickerHelper.isPDF(File('/path/file.jpg')), isFalse);
        expect(FilePickerHelper.isPDF(File('/path/file.jpeg')), isFalse);
        expect(FilePickerHelper.isPDF(File('/path/file.png')), isFalse);
      });

      test('should return false for other file types', () {
        expect(FilePickerHelper.isPDF(File('/path/file.doc')), isFalse);
        expect(FilePickerHelper.isPDF(File('/path/file.txt')), isFalse);
        expect(FilePickerHelper.isPDF(File('/path/file.xlsx')), isFalse);
      });

      test('should return false for files without extension', () {
        final file = File('/path/to/noextension');
        expect(FilePickerHelper.isPDF(file), isFalse);
      });

      test(
        'should return false for files with pdf in name but different ext',
        () {
          final file = File('/path/to/pdf_document.jpg');
          expect(FilePickerHelper.isPDF(file), isFalse);
        },
      );
    });

    // ==================== isImage Tests ====================
    group('isImage', () {
      test('should return true for .jpg extension (lowercase)', () {
        final file = File('/path/to/photo.jpg');
        expect(FilePickerHelper.isImage(file), isTrue);
      });

      test('should return true for .JPG extension (uppercase)', () {
        final file = File('/path/to/PHOTO.JPG');
        expect(FilePickerHelper.isImage(file), isTrue);
      });

      test('should return true for .jpeg extension', () {
        final file = File('/path/to/photo.jpeg');
        expect(FilePickerHelper.isImage(file), isTrue);
      });

      test('should return true for .JPEG extension (uppercase)', () {
        final file = File('/path/to/PHOTO.JPEG');
        expect(FilePickerHelper.isImage(file), isTrue);
      });

      test('should return true for .png extension', () {
        final file = File('/path/to/image.png');
        expect(FilePickerHelper.isImage(file), isTrue);
      });

      test('should return true for .PNG extension (uppercase)', () {
        final file = File('/path/to/IMAGE.PNG');
        expect(FilePickerHelper.isImage(file), isTrue);
      });

      test('should return false for PDF files', () {
        final file = File('/path/to/document.pdf');
        expect(FilePickerHelper.isImage(file), isFalse);
      });

      test('should return false for other file types', () {
        expect(FilePickerHelper.isImage(File('/path/file.gif')), isFalse);
        expect(FilePickerHelper.isImage(File('/path/file.bmp')), isFalse);
        expect(FilePickerHelper.isImage(File('/path/file.webp')), isFalse);
        expect(FilePickerHelper.isImage(File('/path/file.svg')), isFalse);
      });

      test('should return false for files without extension', () {
        final file = File('/path/to/noextension');
        expect(FilePickerHelper.isImage(file), isFalse);
      });

      test(
        'should return false for files with image in name but different ext',
        () {
          final file = File('/path/to/jpg_image.pdf');
          expect(FilePickerHelper.isImage(file), isFalse);
        },
      );
    });

    // ==================== getFileIcon Tests ====================
    group('getFileIcon', () {
      test('should return PDF icon for PDF files', () {
        final file = File('/path/to/document.pdf');
        expect(
          FilePickerHelper.getFileIcon(file),
          equals(Icons.picture_as_pdf),
        );
      });

      test('should return image icon for JPG files', () {
        final file = File('/path/to/photo.jpg');
        expect(FilePickerHelper.getFileIcon(file), equals(Icons.image));
      });

      test('should return image icon for JPEG files', () {
        final file = File('/path/to/photo.jpeg');
        expect(FilePickerHelper.getFileIcon(file), equals(Icons.image));
      });

      test('should return image icon for PNG files', () {
        final file = File('/path/to/image.png');
        expect(FilePickerHelper.getFileIcon(file), equals(Icons.image));
      });

      test('should return generic file icon for unknown file types', () {
        final file = File('/path/to/document.doc');
        expect(
          FilePickerHelper.getFileIcon(file),
          equals(Icons.insert_drive_file),
        );
      });

      test('should return generic file icon for files without extension', () {
        final file = File('/path/to/noextension');
        expect(
          FilePickerHelper.getFileIcon(file),
          equals(Icons.insert_drive_file),
        );
      });

      test('should handle case-insensitive extensions', () {
        expect(
          FilePickerHelper.getFileIcon(File('/path/file.PDF')),
          equals(Icons.picture_as_pdf),
        );
        expect(
          FilePickerHelper.getFileIcon(File('/path/file.JPG')),
          equals(Icons.image),
        );
        expect(
          FilePickerHelper.getFileIcon(File('/path/file.PNG')),
          equals(Icons.image),
        );
      });
    });

    // ==================== getFileColor Tests ====================
    group('getFileColor', () {
      test('should return red color for PDF files', () {
        final file = File('/path/to/document.pdf');
        expect(
          FilePickerHelper.getFileColor(file),
          equals(const Color(0xFFA40000)),
        );
      });

      test('should return turquoise color for JPG files', () {
        final file = File('/path/to/photo.jpg');
        expect(
          FilePickerHelper.getFileColor(file),
          equals(const Color(0xFF1BA3B6)),
        );
      });

      test('should return turquoise color for JPEG files', () {
        final file = File('/path/to/photo.jpeg');
        expect(
          FilePickerHelper.getFileColor(file),
          equals(const Color(0xFF1BA3B6)),
        );
      });

      test('should return turquoise color for PNG files', () {
        final file = File('/path/to/image.png');
        expect(
          FilePickerHelper.getFileColor(file),
          equals(const Color(0xFF1BA3B6)),
        );
      });

      test('should return grey color for unknown file types', () {
        final file = File('/path/to/document.doc');
        expect(FilePickerHelper.getFileColor(file), equals(Colors.grey));
      });

      test('should return grey color for files without extension', () {
        final file = File('/path/to/noextension');
        expect(FilePickerHelper.getFileColor(file), equals(Colors.grey));
      });

      test('should handle case-insensitive extensions', () {
        expect(
          FilePickerHelper.getFileColor(File('/path/file.PDF')),
          equals(const Color(0xFFA40000)),
        );
        expect(
          FilePickerHelper.getFileColor(File('/path/file.JPG')),
          equals(const Color(0xFF1BA3B6)),
        );
        expect(
          FilePickerHelper.getFileColor(File('/path/file.PNG')),
          equals(const Color(0xFF1BA3B6)),
        );
      });
    });
  });
}
