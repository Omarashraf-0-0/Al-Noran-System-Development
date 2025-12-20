import 'package:flutter/material.dart';
import '../../theme/theme.dart';

/// كارت أساسي محسّن
/// Enhanced Base Card Component
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? boxShadow;
  final Border? border;
  final Gradient? gradient;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.color,
    this.borderRadius,
    this.boxShadow,
    this.border,
    this.gradient,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final content = Container(
      padding: padding ?? AppSpacing.cardPadding,
      margin: margin ?? const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: gradient == null ? (color ?? AppColors.cardBackground) : null,
        gradient: gradient,
        borderRadius: borderRadius ?? AppSpacing.borderRadiusLG,
        boxShadow: boxShadow ?? AppColors.cardShadow,
        border:
            border ?? Border.all(color: Colors.grey.withOpacity(0.1), width: 1),
      ),
      child: child,
    );

    if (onTap != null || onLongPress != null) {
      return InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: borderRadius ?? AppSpacing.borderRadiusLG,
        child: content,
      );
    }

    return content;
  }
}

/// كارت شحنة محسّن مع animations
/// Enhanced Shipment Card with animations
class ShipmentCard extends StatefulWidget {
  final String? shipmentCode;
  final String acidNumber;
  final String? number46;
  final String shipmentType; // 'sea' or 'air'
  final int status;
  final String statusText;
  final bool isUrgent;
  final String lastUpdate;
  final VoidCallback onTap;

  const ShipmentCard({
    super.key,
    this.shipmentCode,
    required this.acidNumber,
    this.number46,
    required this.shipmentType,
    required this.status,
    required this.statusText,
    this.isUrgent = false,
    required this.lastUpdate,
    required this.onTap,
  });

  @override
  State<ShipmentCard> createState() => _ShipmentCardState();
}

class _ShipmentCardState extends State<ShipmentCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.98,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    setState(() => _isPressed = true);
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  void _handleTapCancel() {
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final typeColor = AppColors.getShipmentTypeColor(widget.shipmentType);
    final statusColor = AppColors.getShipmentStatusColor(widget.status);
    final typeIcon =
        widget.shipmentType.toLowerCase() == 'sea'
            ? Icons.directions_boat_rounded
            : Icons.flight_takeoff_rounded;

    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: AppSpacing.cardPadding,
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: AppSpacing.borderRadiusLG,
            border: Border.all(
              color:
                  _isPressed
                      ? AppColors.primary.withOpacity(0.3)
                      : Colors.grey.withOpacity(0.1),
              width: _isPressed ? 2 : 1,
            ),
            boxShadow:
                _isPressed ? AppColors.elevatedShadow : AppColors.cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                children: [
                  // Type Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: typeColor.withOpacity(0.1),
                      borderRadius: AppSpacing.borderRadiusXS,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(typeIcon, size: 14, color: typeColor),
                        AppSpacing.gapHorizontalXXS,
                        Text(
                          widget.shipmentType == 'sea' ? 'بحري' : 'جوي',
                          style: AppTypography.badge.copyWith(color: typeColor),
                        ),
                      ],
                    ),
                  ),
                  AppSpacing.gapHorizontalSM,
                  // Urgent Badge
                  if (widget.isUrgent)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.1),
                        borderRadius: AppSpacing.borderRadiusXS,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.priority_high,
                            size: 14,
                            color: AppColors.error,
                          ),
                          AppSpacing.gapHorizontalXXS,
                          Text(
                            'عاجل',
                            style: AppTypography.badge.copyWith(
                              color: AppColors.error,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const Spacer(),
                  // Shipment Code Badge
                  if (widget.shipmentCode != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withOpacity(0.1),
                        borderRadius: AppSpacing.borderRadiusXS,
                      ),
                      child: Text(
                        widget.shipmentCode!,
                        style: AppTypography.badge.copyWith(
                          color: AppColors.accent,
                        ),
                      ),
                    ),
                ],
              ),
              AppSpacing.gapVerticalMD,
              // ACID Number
              Row(
                children: [
                  Icon(
                    Icons.receipt_long_rounded,
                    size: AppSpacing.iconSM,
                    color: AppColors.primary,
                  ),
                  AppSpacing.gapHorizontalSM,
                  Text(
                    'رقم ACID: ',
                    style: AppTypography.label.copyWith(
                      color: AppColors.textLight,
                    ),
                  ),
                  Text(
                    widget.acidNumber,
                    style: AppTypography.bodySemiBold.copyWith(
                      color: AppColors.textDark,
                    ),
                  ),
                ],
              ),
              // Number 46
              if (widget.number46 != null) ...[
                AppSpacing.gapVerticalSM,
                Row(
                  children: [
                    Icon(
                      Icons.document_scanner_outlined,
                      size: AppSpacing.iconSM,
                      color: AppColors.accent,
                    ),
                    AppSpacing.gapHorizontalSM,
                    Text(
                      'رقم 46: ',
                      style: AppTypography.label.copyWith(
                        color: AppColors.textLight,
                      ),
                    ),
                    Text(
                      widget.number46!,
                      style: AppTypography.bodySemiBold.copyWith(
                        color: AppColors.textDark,
                      ),
                    ),
                  ],
                ),
              ],
              AppSpacing.gapVerticalMD,
              // Divider
              Container(height: 1, color: AppColors.divider),
              AppSpacing.gapVerticalMD,
              // Status & Date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor,
                      borderRadius: AppSpacing.borderRadiusXS,
                    ),
                    child: Text(
                      widget.statusText,
                      style: AppTypography.badge.copyWith(
                        color: AppColors.white,
                      ),
                    ),
                  ),
                  // Last Update
                  Row(
                    children: [
                      Icon(
                        Icons.access_time_rounded,
                        size: 14,
                        color: AppColors.textLight,
                      ),
                      AppSpacing.gapHorizontalXXS,
                      Text(
                        widget.lastUpdate,
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// كارت إحصائيات
/// Stats Card Component
class StatsCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const StatsCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      gradient: LinearGradient(
        colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      border: Border.all(color: color.withOpacity(0.3), width: 1),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: AppSpacing.paddingMD,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: AppSpacing.iconLG),
          ),
          AppSpacing.gapVerticalMD,
          Text(value, style: AppTypography.h1.copyWith(color: color)),
          AppSpacing.gapVerticalXS,
          Text(
            title,
            style: AppTypography.label.copyWith(color: AppColors.textMedium),
          ),
        ],
      ),
    );
  }
}

/// كارت فاتورة
/// Payment/Invoice Card
class PaymentCard extends StatelessWidget {
  final String invoiceNumber;
  final String serviceType;
  final double amount;
  final String status; // 'paid', 'unpaid', 'overdue'
  final String issueDate;
  final String? dueDate;
  final VoidCallback onTap;
  final VoidCallback? onUploadReceipt;

  const PaymentCard({
    super.key,
    required this.invoiceNumber,
    required this.serviceType,
    required this.amount,
    required this.status,
    required this.issueDate,
    this.dueDate,
    required this.onTap,
    this.onUploadReceipt,
  });

  Color get _statusColor {
    switch (status.toLowerCase()) {
      case 'paid':
        return AppColors.paymentPaid;
      case 'overdue':
        return AppColors.paymentOverdue;
      default:
        return AppColors.paymentUnpaid;
    }
  }

  String get _statusText {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'مدفوعة';
      case 'overdue':
        return 'متأخرة';
      default:
        return 'غير مدفوعة';
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'فاتورة #$invoiceNumber',
                style: AppTypography.h3.copyWith(color: AppColors.textDark),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: _statusColor,
                  borderRadius: AppSpacing.borderRadiusXS,
                ),
                child: Text(
                  _statusText,
                  style: AppTypography.badge.copyWith(color: AppColors.white),
                ),
              ),
            ],
          ),
          AppSpacing.gapVerticalMD,
          // Service Type
          Text(
            serviceType,
            style: AppTypography.body.copyWith(color: AppColors.textMedium),
          ),
          AppSpacing.gapVerticalMD,
          // Amount
          Text(
            '${amount.toStringAsFixed(2)} جنيه',
            style: AppTypography.h2.copyWith(color: AppColors.primary),
          ),
          AppSpacing.gapVerticalMD,
          // Dates
          Row(
            children: [
              Icon(
                Icons.calendar_today_rounded,
                size: 14,
                color: AppColors.textLight,
              ),
              AppSpacing.gapHorizontalXS,
              Text(
                'تاريخ الإصدار: $issueDate',
                style: AppTypography.small.copyWith(color: AppColors.textLight),
              ),
            ],
          ),
          if (dueDate != null) ...[
            AppSpacing.gapVerticalSM,
            Row(
              children: [
                Icon(
                  Icons.event_available_rounded,
                  size: 14,
                  color: AppColors.textLight,
                ),
                AppSpacing.gapHorizontalXS,
                Text(
                  'تاريخ الاستحقاق: $dueDate',
                  style: AppTypography.small.copyWith(
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ],
          // Upload Receipt Button for unpaid
          if (status.toLowerCase() == 'unpaid' && onUploadReceipt != null) ...[
            AppSpacing.gapVerticalMD,
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onUploadReceipt,
                icon: const Icon(Icons.upload_file, size: 18),
                label: const Text('رفع إيصال الدفع'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
