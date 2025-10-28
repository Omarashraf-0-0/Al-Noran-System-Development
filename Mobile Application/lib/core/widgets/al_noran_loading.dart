import 'package:flutter/material.dart';
import '../../theme/colors.dart';

/// Custom Loading Widget للنوران
class AlNoranLoading extends StatelessWidget {
  final String? message;
  final double size;
  final Color? color;

  const AlNoranLoading({super.key, this.message, this.size = 50, this.color});

  @override
  Widget build(BuildContext context) {
    final loadingColor = color ?? AlNoranColors.primary;

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              // Outer Circle Progress
              SizedBox(
                width: size,
                height: size,
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(loadingColor),
                  strokeWidth: 3,
                  backgroundColor: loadingColor.withOpacity(0.1),
                ),
              ),
              // Inner Icon
              Container(
                width: size * 0.6,
                height: size * 0.6,
                decoration: BoxDecoration(
                  color: loadingColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.flight_takeoff_rounded,
                  color: loadingColor,
                  size: size * 0.4,
                ),
              ),
            ],
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'Cairo',
                fontWeight: FontWeight.w600,
                color: loadingColor,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Loading Overlay - يغطي الشاشة كلها
class AlNoranLoadingOverlay extends StatelessWidget {
  final String? message;

  const AlNoranLoadingOverlay({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withOpacity(0.3),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
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
              AlNoranLoading(size: 60, message: message),
              const SizedBox(height: 8),
              Text(
                'الرجاء الانتظار...',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  fontFamily: 'Cairo',
                  color: AlNoranColors.grey.withOpacity(0.7),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Small Loading Indicator - للأزرار
class AlNoranButtonLoading extends StatelessWidget {
  final Color color;
  final double size;

  const AlNoranButtonLoading({
    super.key,
    this.color = Colors.white,
    this.size = 20,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(color: color, strokeWidth: 2),
    );
  }
}
