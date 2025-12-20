import 'package:flutter/material.dart';
import '../../theme/theme.dart';

/// نظام حالات التحميل المحسّن
/// Enhanced Loading States with Shimmer Effect
class LoadingStates {
  // ==================== Shimmer Skeleton Loader ====================
  static Widget shimmerCard({
    double? height,
    double? width,
    BorderRadius? borderRadius,
  }) {
    return _ShimmerLoading(
      child: Container(
        height: height ?? 100,
        width: width ?? double.infinity,
        decoration: BoxDecoration(
          color: AppColors.greyLight,
          borderRadius: borderRadius ?? AppSpacing.borderRadiusMD,
        ),
      ),
    );
  }

  // ==================== Shipment Card Skeleton ====================
  static Widget shipmentCardSkeleton() {
    return _ShimmerLoading(
      child: Container(
        margin: AppSpacing.paddingHorizontalMD,
        padding: AppSpacing.paddingLG,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: AppSpacing.borderRadiusMD,
          boxShadow: AppColors.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 80,
                  height: 24,
                  decoration: BoxDecoration(
                    color: AppColors.greyLight,
                    borderRadius: AppSpacing.borderRadiusSM,
                  ),
                ),
                const Spacer(),
                Container(
                  width: 60,
                  height: 24,
                  decoration: BoxDecoration(
                    color: AppColors.greyLight,
                    borderRadius: AppSpacing.borderRadiusSM,
                  ),
                ),
              ],
            ),
            AppSpacing.gapVerticalMD,
            Container(
              width: double.infinity,
              height: 20,
              decoration: BoxDecoration(
                color: AppColors.greyLight,
                borderRadius: AppSpacing.borderRadiusSM,
              ),
            ),
            AppSpacing.gapVerticalSM,
            Container(
              width: 150,
              height: 20,
              decoration: BoxDecoration(
                color: AppColors.greyLight,
                borderRadius: AppSpacing.borderRadiusSM,
              ),
            ),
            AppSpacing.gapVerticalMD,
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 16,
                    decoration: BoxDecoration(
                      color: AppColors.greyLight,
                      borderRadius: AppSpacing.borderRadiusSM,
                    ),
                  ),
                ),
                AppSpacing.gapHorizontalMD,
                Expanded(
                  child: Container(
                    height: 16,
                    decoration: BoxDecoration(
                      color: AppColors.greyLight,
                      borderRadius: AppSpacing.borderRadiusSM,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ==================== Stats Card Skeleton ====================
  static Widget statsCardSkeleton() {
    return _ShimmerLoading(
      child: Container(
        padding: AppSpacing.paddingLG,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: AppSpacing.borderRadiusMD,
          boxShadow: AppColors.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.greyLight,
                shape: BoxShape.circle,
              ),
            ),
            AppSpacing.gapVerticalMD,
            Container(
              width: 80,
              height: 28,
              decoration: BoxDecoration(
                color: AppColors.greyLight,
                borderRadius: AppSpacing.borderRadiusSM,
              ),
            ),
            AppSpacing.gapVerticalSM,
            Container(
              width: 120,
              height: 16,
              decoration: BoxDecoration(
                color: AppColors.greyLight,
                borderRadius: AppSpacing.borderRadiusSM,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==================== List Item Skeleton ====================
  static Widget listItemSkeleton({bool hasImage = true, int lines = 2}) {
    return _ShimmerLoading(
      child: Padding(
        padding: AppSpacing.paddingMD,
        child: Row(
          children: [
            if (hasImage) ...[
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppColors.greyLight,
                  borderRadius: AppSpacing.borderRadiusSM,
                ),
              ),
              AppSpacing.gapHorizontalMD,
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    height: 16,
                    decoration: BoxDecoration(
                      color: AppColors.greyLight,
                      borderRadius: AppSpacing.borderRadiusSM,
                    ),
                  ),
                  if (lines > 1) ...[
                    AppSpacing.gapVerticalSM,
                    Container(
                      width: 200,
                      height: 14,
                      decoration: BoxDecoration(
                        color: AppColors.greyLight,
                        borderRadius: AppSpacing.borderRadiusSM,
                      ),
                    ),
                  ],
                  if (lines > 2) ...[
                    AppSpacing.gapVerticalSM,
                    Container(
                      width: 150,
                      height: 14,
                      decoration: BoxDecoration(
                        color: AppColors.greyLight,
                        borderRadius: AppSpacing.borderRadiusSM,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==================== Circular Avatar Skeleton ====================
  static Widget avatarSkeleton({double size = 50}) {
    return _ShimmerLoading(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: AppColors.greyLight,
          shape: BoxShape.circle,
        ),
      ),
    );
  }

  // ==================== Text Line Skeleton ====================
  static Widget textLineSkeleton({double? width, double height = 14}) {
    return _ShimmerLoading(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.greyLight,
          borderRadius: AppSpacing.borderRadiusSM,
        ),
      ),
    );
  }

  // ==================== Button Skeleton ====================
  static Widget buttonSkeleton({double? width, double height = 50}) {
    return _ShimmerLoading(
      child: Container(
        width: width ?? double.infinity,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.greyLight,
          borderRadius: AppSpacing.borderRadiusMD,
        ),
      ),
    );
  }

  // ==================== Grid View Skeleton ====================
  static Widget gridSkeleton({
    required int itemCount,
    required int crossAxisCount,
    required Widget Function() itemBuilder,
  }) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: AppSpacing.md,
        mainAxisSpacing: AppSpacing.md,
        childAspectRatio: 1,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) => itemBuilder(),
    );
  }

  // ==================== List View Skeleton ====================
  static Widget listSkeleton({
    required int itemCount,
    required Widget Function() itemBuilder,
  }) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: itemCount,
      itemBuilder: (context, index) => itemBuilder(),
    );
  }

  // ==================== Full Page Loading ====================
  static Widget fullPageLoading({String? message}) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            color: AppColors.primary,
            strokeWidth: 3,
          ),
          if (message != null) ...[
            AppSpacing.gapVerticalLG,
            Text(
              message,
              style: AppTypography.body.copyWith(color: AppColors.textMedium),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  // ==================== Refresh Indicator ====================
  static Widget refreshIndicator({
    required Widget child,
    required Future<void> Function() onRefresh,
  }) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.primary,
      backgroundColor: AppColors.white,
      child: child,
    );
  }
}

// ==================== Shimmer Loading Animation ====================
class _ShimmerLoading extends StatefulWidget {
  final Widget child;

  const _ShimmerLoading({required this.child});

  @override
  State<_ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<_ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();

    _animation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: const [
                Color(0xFFEBEBF4),
                Color(0xFFF4F4F4),
                Color(0xFFEBEBF4),
              ],
              stops: [
                _animation.value - 0.3,
                _animation.value,
                _animation.value + 0.3,
              ],
            ).createShader(bounds);
          },
          child: widget.child,
        );
      },
    );
  }
}

// ==================== Loading Overlay ====================
class LoadingOverlay {
  static OverlayEntry? _currentOverlay;

  static void show(BuildContext context, {String? message}) {
    hide(); // Remove any existing overlay

    _currentOverlay = OverlayEntry(
      builder: (context) => _LoadingOverlayWidget(message: message),
    );

    Overlay.of(context).insert(_currentOverlay!);
  }

  static void hide() {
    _currentOverlay?.remove();
    _currentOverlay = null;
  }
}

class _LoadingOverlayWidget extends StatelessWidget {
  final String? message;

  const _LoadingOverlayWidget({this.message});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withOpacity(0.5),
      child: Center(
        child: Container(
          padding: AppSpacing.paddingXL,
          margin: AppSpacing.paddingXL,
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
              if (message != null) ...[
                AppSpacing.gapVerticalLG,
                Text(
                  message!,
                  style: AppTypography.body.copyWith(
                    color: AppColors.textMedium,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ==================== Pulse Animation ====================
class PulseAnimation extends StatefulWidget {
  final Widget child;
  final Duration duration;

  const PulseAnimation({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 1000),
  });

  @override
  State<PulseAnimation> createState() => _PulseAnimationState();
}

class _PulseAnimationState extends State<PulseAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: widget.duration, vsync: this)
      ..repeat(reverse: true);

    _animation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(opacity: _animation, child: widget.child);
  }
}
