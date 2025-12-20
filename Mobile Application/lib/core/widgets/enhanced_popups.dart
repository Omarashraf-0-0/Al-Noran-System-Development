import 'package:flutter/material.dart';
import '../../theme/theme.dart';

/// نظام popups و dialogs محسّن
/// Enhanced Popups and Dialogs System
class EnhancedPopups {
  // ==================== Success Dialog ====================
  static Future<void> showSuccess({
    required BuildContext context,
    required String message,
    String title = 'نجح',
    String buttonText = 'حسناً',
    VoidCallback? onDismiss,
  }) async {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => _AnimatedDialog(
            child: _SuccessDialog(
              title: title,
              message: message,
              buttonText: buttonText,
              onDismiss: onDismiss,
            ),
          ),
    );
  }

  // ==================== Error Dialog ====================
  static Future<void> showError({
    required BuildContext context,
    required String message,
    String title = 'خطأ',
    String buttonText = 'حسناً',
    VoidCallback? onDismiss,
  }) async {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => _AnimatedDialog(
            child: _ErrorDialog(
              title: title,
              message: message,
              buttonText: buttonText,
              onDismiss: onDismiss,
            ),
          ),
    );
  }

  // ==================== Warning Dialog ====================
  static Future<void> showWarning({
    required BuildContext context,
    required String message,
    String title = 'تحذير',
    String buttonText = 'حسناً',
    VoidCallback? onDismiss,
  }) async {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => _AnimatedDialog(
            child: _WarningDialog(
              title: title,
              message: message,
              buttonText: buttonText,
              onDismiss: onDismiss,
            ),
          ),
    );
  }

  // ==================== Info Dialog ====================
  static Future<void> showInfo({
    required BuildContext context,
    required String message,
    String title = 'معلومة',
    String buttonText = 'حسناً',
    VoidCallback? onDismiss,
  }) async {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => _AnimatedDialog(
            child: _InfoDialog(
              title: title,
              message: message,
              buttonText: buttonText,
              onDismiss: onDismiss,
            ),
          ),
    );
  }

  // ==================== Confirmation Dialog ====================
  static Future<bool?> showConfirmation({
    required BuildContext context,
    required String message,
    String title = 'تأكيد',
    String confirmText = 'تأكيد',
    String cancelText = 'إلغاء',
    Color? confirmColor,
    bool isDanger = false,
  }) async {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => _AnimatedDialog(
            child: _ConfirmationDialog(
              title: title,
              message: message,
              confirmText: confirmText,
              cancelText: cancelText,
              confirmColor: confirmColor,
              isDanger: isDanger,
            ),
          ),
    );
  }

  // ==================== Loading Dialog ====================
  static void showLoading({
    required BuildContext context,
    String message = 'جاري التحميل...',
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => PopScope(
            canPop: false,
            child: _AnimatedDialog(child: _LoadingDialog(message: message)),
          ),
    );
  }

  static void hideLoading(BuildContext context) {
    Navigator.of(context, rootNavigator: true).pop();
  }

  // ==================== Bottom Sheet ====================
  static Future<T?> showBottomSheet<T>({
    required BuildContext context,
    required Widget child,
    bool isDismissible = true,
    bool enableDrag = true,
    Color? backgroundColor,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isDismissible: isDismissible,
      enableDrag: enableDrag,
      backgroundColor: backgroundColor ?? Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _BottomSheetContainer(child: child),
    );
  }

  // ==================== Snackbar ====================
  static void showSnackbar({
    required BuildContext context,
    required String message,
    Duration duration = const Duration(seconds: 3),
    SnackbarType type = SnackbarType.info,
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    Color backgroundColor;
    IconData icon;

    switch (type) {
      case SnackbarType.success:
        backgroundColor = AppColors.success;
        icon = Icons.check_circle_rounded;
        break;
      case SnackbarType.error:
        backgroundColor = AppColors.error;
        icon = Icons.error_rounded;
        break;
      case SnackbarType.warning:
        backgroundColor = AppColors.warning;
        icon = Icons.warning_rounded;
        break;
      case SnackbarType.info:
        backgroundColor = AppColors.info;
        icon = Icons.info_rounded;
        break;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 24),
            AppSpacing.gapHorizontalMD,
            Expanded(
              child: Text(
                message,
                style: AppTypography.body.copyWith(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: backgroundColor,
        duration: duration,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusMD),
        action:
            onAction != null && actionLabel != null
                ? SnackBarAction(
                  label: actionLabel,
                  textColor: Colors.white,
                  onPressed: onAction,
                )
                : null,
      ),
    );
  }
}

enum SnackbarType { success, error, warning, info }

// ==================== Animated Dialog Wrapper ====================
class _AnimatedDialog extends StatefulWidget {
  final Widget child;

  const _AnimatedDialog({required this.child});

  @override
  State<_AnimatedDialog> createState() => _AnimatedDialogState();
}

class _AnimatedDialogState extends State<_AnimatedDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 0.7,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

    _opacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacityAnimation,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Dialog(
          backgroundColor: Colors.transparent,
          elevation: 0,
          child: widget.child,
        ),
      ),
    );
  }
}

// ==================== Success Dialog ====================
class _SuccessDialog extends StatelessWidget {
  final String title;
  final String message;
  final String buttonText;
  final VoidCallback? onDismiss;

  const _SuccessDialog({
    required this.title,
    required this.message,
    required this.buttonText,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: AppSpacing.paddingXL,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: AppSpacing.borderRadiusXL,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: AppSpacing.paddingLG,
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle_rounded,
              color: AppColors.success,
              size: AppSpacing.iconHuge,
            ),
          ),
          AppSpacing.gapVerticalLG,
          Text(
            title,
            style: AppTypography.h2.copyWith(color: AppColors.textDark),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalMD,
          Text(
            message,
            style: AppTypography.body.copyWith(color: AppColors.textMedium),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalXL,
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onDismiss?.call();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                buttonText,
                style: AppTypography.button.copyWith(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Error Dialog ====================
class _ErrorDialog extends StatelessWidget {
  final String title;
  final String message;
  final String buttonText;
  final VoidCallback? onDismiss;

  const _ErrorDialog({
    required this.title,
    required this.message,
    required this.buttonText,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: AppSpacing.paddingXL,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: AppSpacing.borderRadiusXL,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: AppSpacing.paddingLG,
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.error_rounded,
              color: AppColors.error,
              size: AppSpacing.iconHuge,
            ),
          ),
          AppSpacing.gapVerticalLG,
          Text(
            title,
            style: AppTypography.h2.copyWith(color: AppColors.textDark),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalMD,
          Text(
            message,
            style: AppTypography.body.copyWith(color: AppColors.textMedium),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalXL,
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onDismiss?.call();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                buttonText,
                style: AppTypography.button.copyWith(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Warning Dialog ====================
class _WarningDialog extends StatelessWidget {
  final String title;
  final String message;
  final String buttonText;
  final VoidCallback? onDismiss;

  const _WarningDialog({
    required this.title,
    required this.message,
    required this.buttonText,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: AppSpacing.paddingXL,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: AppSpacing.borderRadiusXL,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: AppSpacing.paddingLG,
            decoration: BoxDecoration(
              color: AppColors.warning.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.warning_rounded,
              color: AppColors.warning,
              size: AppSpacing.iconHuge,
            ),
          ),
          AppSpacing.gapVerticalLG,
          Text(
            title,
            style: AppTypography.h2.copyWith(color: AppColors.textDark),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalMD,
          Text(
            message,
            style: AppTypography.body.copyWith(color: AppColors.textMedium),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalXL,
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onDismiss?.call();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.warning,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                buttonText,
                style: AppTypography.button.copyWith(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Info Dialog ====================
class _InfoDialog extends StatelessWidget {
  final String title;
  final String message;
  final String buttonText;
  final VoidCallback? onDismiss;

  const _InfoDialog({
    required this.title,
    required this.message,
    required this.buttonText,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: AppSpacing.paddingXL,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: AppSpacing.borderRadiusXL,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: AppSpacing.paddingLG,
            decoration: BoxDecoration(
              color: AppColors.info.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.info_rounded,
              color: AppColors.info,
              size: AppSpacing.iconHuge,
            ),
          ),
          AppSpacing.gapVerticalLG,
          Text(
            title,
            style: AppTypography.h2.copyWith(color: AppColors.textDark),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalMD,
          Text(
            message,
            style: AppTypography.body.copyWith(color: AppColors.textMedium),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalXL,
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onDismiss?.call();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.info,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                buttonText,
                style: AppTypography.button.copyWith(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Confirmation Dialog ====================
class _ConfirmationDialog extends StatelessWidget {
  final String title;
  final String message;
  final String confirmText;
  final String cancelText;
  final Color? confirmColor;
  final bool isDanger;

  const _ConfirmationDialog({
    required this.title,
    required this.message,
    required this.confirmText,
    required this.cancelText,
    this.confirmColor,
    required this.isDanger,
  });

  @override
  Widget build(BuildContext context) {
    final buttonColor =
        confirmColor ?? (isDanger ? AppColors.error : AppColors.primary);

    return Container(
      padding: AppSpacing.paddingXL,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: AppSpacing.borderRadiusXL,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: AppSpacing.paddingLG,
            decoration: BoxDecoration(
              color: buttonColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isDanger ? Icons.warning_rounded : Icons.help_rounded,
              color: buttonColor,
              size: AppSpacing.iconHuge,
            ),
          ),
          AppSpacing.gapVerticalLG,
          Text(
            title,
            style: AppTypography.h2.copyWith(color: AppColors.textDark),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalMD,
          Text(
            message,
            style: AppTypography.body.copyWith(color: AppColors.textMedium),
            textAlign: TextAlign.center,
          ),
          AppSpacing.gapVerticalXL,
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(cancelText, style: AppTypography.button),
                ),
              ),
              AppSpacing.gapHorizontalMD,
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: buttonColor,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(
                    confirmText,
                    style: AppTypography.button.copyWith(color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ==================== Loading Dialog ====================
class _LoadingDialog extends StatelessWidget {
  final String message;

  const _LoadingDialog({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: AppSpacing.paddingXL,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: AppSpacing.borderRadiusXL,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(
            color: AppColors.primary,
            strokeWidth: 3,
          ),
          AppSpacing.gapVerticalLG,
          Text(
            message,
            style: AppTypography.body.copyWith(color: AppColors.textMedium),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ==================== Bottom Sheet Container ====================
class _BottomSheetContainer extends StatelessWidget {
  final Widget child;

  const _BottomSheetContainer({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppSpacing.radiusXXL),
          topRight: Radius.circular(AppSpacing.radiusXXL),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppSpacing.gapVerticalMD,
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.greyLight,
              borderRadius: AppSpacing.borderRadiusRound,
            ),
          ),
          AppSpacing.gapVerticalMD,
          child,
        ],
      ),
    );
  }
}
