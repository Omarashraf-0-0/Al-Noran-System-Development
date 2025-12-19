import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/Pop-ups/al_noran_popups.dart';

/// =====================================================
/// 📚 AlNoranPopups Unit Tests
/// Popup utility class with success, error, warning, info dialogs
/// =====================================================

void main() {
  group('AlNoranPopups Tests', () {
    // ==================== PopupType Enum ====================
    group('PopupType Enum', () {
      test('should have 5 types', () {
        expect(PopupType.values.length, equals(5));
      });

      test('should contain success type', () {
        expect(PopupType.values.contains(PopupType.success), isTrue);
      });

      test('should contain error type', () {
        expect(PopupType.values.contains(PopupType.error), isTrue);
      });

      test('should contain warning type', () {
        expect(PopupType.values.contains(PopupType.warning), isTrue);
      });

      test('should contain info type', () {
        expect(PopupType.values.contains(PopupType.info), isTrue);
      });

      test('should contain question type', () {
        expect(PopupType.values.contains(PopupType.question), isTrue);
      });
    });

    // ==================== Static Methods Exist ====================
    group('Static Methods', () {
      test('AlNoranPopups class exists', () {
        expect(AlNoranPopups, isNotNull);
      });
    });
  });
}
