import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/unified_top_bar.dart';
import '../../Pop-ups/al_noran_popups.dart';

class PaymentsPage extends StatefulWidget {
  final String userName;
  final String userEmail;

  const PaymentsPage({
    super.key,
    required this.userName,
    required this.userEmail,
  });

  @override
  State<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedIndex = 3; // الفواتير (index 3)

  // Premium Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accentColor = Color(0xFF1BA3B6);
  static const Color goldAccent = Color(0xFFD4AF37);
  static const Color bgColor = Color(0xFFF8F9FA);

  // Data
  List<Map<String, dynamic>> _invoices = [];
  List<Map<String, dynamic>> _payments = [];
  double _walletBalance = 0;
  double _totalDebt = 0;

  bool _isLoading = true;
  bool _isUploading = false;

  // Currency conversion rate
  static const double usdToEgpRate = 50.0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      // Load all data in parallel
      final results = await Future.wait([
        ApiService.getMyInvoices(),
        ApiService.getMyPayments(),
        ApiService.getWalletBalance(),
      ]);

      final invoicesResult = results[0];
      final paymentsResult = results[1];
      final walletResult = results[2];

      if (!mounted) return;

      setState(() {
        // Process invoices
        if (invoicesResult['success'] == true) {
          _invoices = List<Map<String, dynamic>>.from(
            invoicesResult['invoices'] ?? [],
          );
          // Calculate total debt (only unpaid invoices)
          _totalDebt = _calculateTotalDebt();
        }

        // Process payments
        if (paymentsResult['success'] == true) {
          _payments = List<Map<String, dynamic>>.from(
            paymentsResult['payments'] ?? [],
          );
        }

        // Get wallet balance
        if (walletResult['success'] == true) {
          _walletBalance = (walletResult['wallet'] ?? 0).toDouble();
        }

        _isLoading = false;
      });

      print(
        '💰 [PaymentsPage] Loaded: ${_invoices.length} invoices, ${_payments.length} payments',
      );
      print(
        '💰 [PaymentsPage] Wallet: $_walletBalance EGP, Total Debt: $_totalDebt EGP',
      );
    } catch (e) {
      print('❌ [PaymentsPage] Error loading data: $e');
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  double _calculateTotalDebt() {
    double total = 0;
    for (var invoice in _invoices) {
      if (invoice['status'] != 'تم الدفع') {
        final items = invoice['invoiceItems'] as List? ?? [];
        for (var item in items) {
          double price = (item['itemPrice'] ?? 0).toDouble();
          String currency = item['currencyType'] ?? 'EGP';
          if (currency == 'USD') {
            price *= usdToEgpRate;
          }
          total += price;
        }
      }
    }
    return total;
  }

  double _calculateInvoiceTotal(Map<String, dynamic> invoice) {
    double total = 0;
    final items = invoice['invoiceItems'] as List? ?? [];
    for (var item in items) {
      double price = (item['itemPrice'] ?? 0).toDouble();
      String currency = item['currencyType'] ?? 'EGP';
      if (currency == 'USD') {
        price *= usdToEgpRate;
      }
      total += price;
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: bgColor,
        body: Column(
          children: [
            // UnifiedTopBar with page title
            UnifiedTopBar(
              showBackButton: true,
              showMenu: false,
              title: 'الفواتير والمدفوعات',
              subtitle: 'إدارة فواتيرك ومدفوعاتك',
              titleIcon: Icons.account_balance_wallet_rounded,
              showWelcome: false,
            ),
            Expanded(
              child: SafeArea(
                top: false,
                child:
                    _isLoading
                        ? _buildPremiumLoadingState()
                        : RefreshIndicator(
                          onRefresh: _loadData,
                          color: primaryDark,
                          child: SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            child: Column(
                              children: [
                                // Premium Summary Section
                                _buildPremiumSummarySection(),
                                const SizedBox(height: 16),
                                // Premium Tabs
                                _buildPremiumTabs(),
                                const SizedBox(height: 8),
                                // Tab Content
                                SizedBox(
                                  height:
                                      MediaQuery.of(context).size.height * 0.5,
                                  child: TabBarView(
                                    controller: _tabController,
                                    children: [
                                      _buildInvoicesList(),
                                      _buildPaymentsList(),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
              ),
            ),
          ],
        ),
        floatingActionButton: _buildPremiumUploadButton(),
        floatingActionButtonLocation: FloatingActionButtonLocation.startFloat,
        bottomNavigationBar: _buildPremiumBottomNav(),
      ),
    );
  }

  Widget _buildPremiumHeader() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryDark, primaryLight],
        ),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
          child: Row(
            children: [
              // Back Button
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                ),
                child: IconButton(
                  icon: const Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 18,
                    color: Colors.white,
                  ),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Navigator.pop(context);
                  },
                ),
              ),
              const SizedBox(width: 14),

              // Title & Subtitle
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: goldAccent.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.account_balance_wallet_rounded,
                            color: goldAccent,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'الفواتير والمدفوعات',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'إدارة فواتيرك ومدفوعاتك',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 13,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),

              // Stats indicator
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.receipt_long_rounded,
                      size: 14,
                      color: goldAccent,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${_invoices.where((i) => i['status'] != 'تم الدفع').length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  primaryDark.withOpacity(0.1),
                  accentColor.withOpacity(0.1),
                ],
              ),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: CircularProgressIndicator(
                color: primaryDark,
                strokeWidth: 3,
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'جاري تحميل البيانات...',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumSummarySection() {
    final unpaidCount =
        _invoices.where((i) => i['status'] != 'تم الدفع').length;
    final paidCount = _invoices.where((i) => i['status'] == 'تم الدفع').length;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        children: [
          // Main Balance Cards
          Row(
            children: [
              // Wallet Balance Card - Glassmorphism Style
              Expanded(
                child: _buildGlassCard(
                  title: 'رصيد المحفظة',
                  value: '${_walletBalance.toStringAsFixed(0)}',
                  currency: 'ج.م',
                  icon: Icons.account_balance_wallet_rounded,
                  gradientColors: [
                    const Color(0xFF10B981),
                    const Color(0xFF059669),
                  ],
                  iconBgColor: Colors.white.withOpacity(0.2),
                ),
              ),
              const SizedBox(width: 12),
              // Total Debt Card
              Expanded(
                child: _buildGlassCard(
                  title: 'إجمالي المستحقات',
                  value: '${_totalDebt.toStringAsFixed(0)}',
                  currency: 'ج.م',
                  icon: Icons.receipt_long_rounded,
                  gradientColors: [primaryDark, primaryLight],
                  iconBgColor: goldAccent.withOpacity(0.3),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Stats Row
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    icon: Icons.pending_actions_rounded,
                    label: 'فواتير معلقة',
                    value: '$unpaidCount',
                    color: Colors.orange,
                  ),
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: Colors.grey.withOpacity(0.2),
                ),
                Expanded(
                  child: _buildStatItem(
                    icon: Icons.check_circle_rounded,
                    label: 'تم الدفع',
                    value: '$paidCount',
                    color: Colors.green,
                  ),
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: Colors.grey.withOpacity(0.2),
                ),
                Expanded(
                  child: _buildStatItem(
                    icon: Icons.upload_file_rounded,
                    label: 'إيصالات',
                    value: '${_payments.length}',
                    color: accentColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassCard({
    required String title,
    required String value,
    required String currency,
    required IconData icon,
    required List<Color> gradientColors,
    required Color iconBgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withOpacity(0.35),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.trending_up_rounded,
                      color: Colors.white.withOpacity(0.9),
                      size: 12,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      'EGP',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontFamily: 'Cairo',
              color: Colors.white.withOpacity(0.85),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  currency,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Cairo',
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontFamily: 'Cairo',
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumTabs() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        labelColor: Colors.white,
        unselectedLabelColor: primaryDark,
        indicator: BoxDecoration(
          gradient: LinearGradient(colors: [primaryDark, primaryLight]),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: primaryDark.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        indicatorPadding: const EdgeInsets.all(4),
        dividerColor: Colors.transparent,
        splashFactory: NoSplash.splashFactory,
        overlayColor: WidgetStateProperty.all(Colors.transparent),
        labelStyle: const TextStyle(
          fontFamily: 'Cairo',
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
        unselectedLabelStyle: const TextStyle(
          fontFamily: 'Cairo',
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        tabs: [
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.receipt_outlined, size: 18),
                const SizedBox(width: 8),
                const Text('الفواتير'),
                if (_invoices
                    .where((i) => i['status'] != 'تم الدفع')
                    .isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: goldAccent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_invoices.where((i) => i['status'] != 'تم الدفع').length}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.payments_outlined, size: 18),
                const SizedBox(width: 8),
                const Text('الإيصالات'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumUploadButton() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [accentColor, accentColor.withGreen(180)],
        ),
        boxShadow: [
          BoxShadow(
            color: accentColor.withOpacity(0.4),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: FloatingActionButton.extended(
        onPressed: _isUploading ? null : _showUploadReceiptSheet,
        backgroundColor: Colors.transparent,
        elevation: 0,
        label:
            _isUploading
                ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
                : const Row(
                  children: [
                    Icon(
                      Icons.upload_file_rounded,
                      size: 20,
                      color: Colors.white,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'رفع إيصال',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
      ),
    );
  }

  Widget _buildSummaryCards() {
    // Legacy method - keeping for compatibility but not used
    return const SizedBox.shrink();
  }

  Widget _buildSummaryCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required List<Color> gradient,
  }) {
    // Legacy method - keeping for compatibility but not used
    return const SizedBox.shrink();
  }

  Widget _buildTabs() {
    // Legacy method - keeping for compatibility but not used
    return const SizedBox.shrink();
  }

  Widget _buildUploadReceiptButton() {
    // Legacy method - keeping for compatibility but not used
    return const SizedBox.shrink();
  }

  Widget _buildInvoicesList() {
    if (_invoices.isEmpty) {
      return _buildPremiumEmptyState(
        icon: Icons.receipt_long_outlined,
        message: 'لا توجد فواتير حالياً',
        subMessage: 'ستظهر فواتيرك هنا عند إصدارها',
      );
    }

    // Sort invoices: unpaid first, then by date
    final sortedInvoices = List<Map<String, dynamic>>.from(_invoices);
    sortedInvoices.sort((a, b) {
      if (a['status'] != 'تم الدفع' && b['status'] == 'تم الدفع') return -1;
      if (a['status'] == 'تم الدفع' && b['status'] != 'تم الدفع') return 1;
      return (b['createdAt'] ?? '').compareTo(a['createdAt'] ?? '');
    });

    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFF690000),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: sortedInvoices.length,
        itemBuilder: (context, index) {
          return _buildInvoiceCard(sortedInvoices[index]);
        },
      ),
    );
  }

  Widget _buildInvoiceCard(Map<String, dynamic> invoice) {
    final invoiceNumber = invoice['invoiceNumber'] ?? 'N/A';
    final status = invoice['status'] ?? 'في انتظار الموافقة';
    final isPaid = status == 'تم الدفع';
    final total = _calculateInvoiceTotal(invoice);
    final items = invoice['invoiceItems'] as List? ?? [];
    final createdAt = _formatDate(invoice['createdAt']);
    final statusColor = _getStatusColor(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color:
              isPaid
                  ? Colors.green.withOpacity(0.3)
                  : Colors.grey.withOpacity(0.1),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color:
                  isPaid
                      ? Colors.green.withOpacity(0.05)
                      : const Color(0xFF690000).withOpacity(0.03),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color:
                        isPaid
                            ? Colors.green.withOpacity(0.1)
                            : const Color(0xFF690000).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    isPaid
                        ? Icons.check_circle_rounded
                        : Icons.receipt_long_rounded,
                    color: isPaid ? Colors.green : const Color(0xFF690000),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'فاتورة #$invoiceNumber',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: Color(0xFF424242),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        createdAt,
                        style: TextStyle(
                          fontSize: 12,
                          fontFamily: 'Cairo',
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ),
                // Status Badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Items
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                ...items.map((item) => _buildInvoiceItem(item)).toList(),
                const Divider(height: 24),
                // Total
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'الإجمالي',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                        color: Color(0xFF424242),
                      ),
                    ),
                    Text(
                      '${total.toStringAsFixed(0)} ج.م',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                        color: isPaid ? Colors.green : const Color(0xFF690000),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Pay Button (only for unpaid invoices)
          if (!isPaid && status == 'تمت الموافقة')
            Container(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed:
                      _walletBalance >= total
                          ? () => _payInvoice(invoice)
                          : () => _showInsufficientBalanceDialog(total),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        _walletBalance >= total
                            ? const Color(0xFF690000)
                            : Colors.grey,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  icon: Icon(
                    _walletBalance >= total
                        ? Icons.payment_rounded
                        : Icons.account_balance_wallet_outlined,
                    size: 20,
                  ),
                  label: Text(
                    _walletBalance >= total
                        ? 'دفع من المحفظة'
                        : 'الرصيد غير كافي',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInvoiceItem(Map<String, dynamic> item) {
    final itemName = item['item'] ?? 'خدمة';
    final price = (item['itemPrice'] ?? 0).toDouble();
    final currency = item['currencyType'] ?? 'EGP';
    final priceInEgp = currency == 'USD' ? price * usdToEgpRate : price;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFF1ba3b6).withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Icon(Icons.circle, size: 8, color: Color(0xFF1ba3b6)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              itemName,
              style: const TextStyle(
                fontSize: 14,
                fontFamily: 'Cairo',
                color: Color(0xFF424242),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${priceInEgp.toStringAsFixed(0)} ج.م',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Cairo',
                  color: Color(0xFF424242),
                ),
              ),
              if (currency == 'USD')
                Text(
                  '(\$${price.toStringAsFixed(0)})',
                  style: TextStyle(
                    fontSize: 11,
                    fontFamily: 'Cairo',
                    color: Colors.grey[500],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentsList() {
    if (_payments.isEmpty) {
      return _buildPremiumEmptyState(
        icon: Icons.payments_outlined,
        message: 'لا توجد إيصالات مرفوعة',
        subMessage: 'اضغط على زر رفع إيصال لشحن محفظتك',
      );
    }

    // Flatten all transactions from all payments
    final allTransactions = <Map<String, dynamic>>[];
    for (var payment in _payments) {
      final transactions = payment['transactions'] as List? ?? [];
      for (var tx in transactions) {
        allTransactions.add({
          ...Map<String, dynamic>.from(tx),
          'paymentId': payment['_id'],
          'paymentMethod': payment['paymentMethod'],
          'createdAt': payment['createdAt'],
        });
      }
    }

    // Sort by date
    allTransactions.sort((a, b) {
      return (b['createdAt'] ?? '').compareTo(a['createdAt'] ?? '');
    });

    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFF690000),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: allTransactions.length,
        itemBuilder: (context, index) {
          return _buildPaymentCard(allTransactions[index]);
        },
      ),
    );
  }

  Widget _buildPaymentCard(Map<String, dynamic> transaction) {
    final status = transaction['status'] ?? 'PENDING';
    final imageUrl = transaction['imageUrls'] ?? '';
    final createdAt = _formatDate(transaction['createdAt']);
    final statusColor = _getPaymentStatusColor(status);
    final statusText = _getPaymentStatusText(status);
    final paymentId = transaction['_id'];
    final canEdit = status == 'PENDING' || status == 'REJECTED';

    return InkWell(
      onTap: imageUrl.isNotEmpty ? () => _showReceiptImage(imageUrl) : null,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: statusColor.withOpacity(0.3), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                // Receipt Thumbnail
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.withOpacity(0.2)),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(11),
                    child:
                        imageUrl.isNotEmpty
                            ? Image.network(
                              imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder:
                                  (_, __, ___) => Icon(
                                    Icons.receipt_long,
                                    color: Colors.grey[400],
                                    size: 32,
                                  ),
                            )
                            : Icon(
                              Icons.receipt_long,
                              color: Colors.grey[400],
                              size: 32,
                            ),
                  ),
                ),
                const SizedBox(width: 14),
                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'إيصال دفع',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: Color(0xFF424242),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today,
                            size: 12,
                            color: Colors.grey[500],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            createdAt,
                            style: TextStyle(
                              fontSize: 12,
                              fontFamily: 'Cairo',
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Status Badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              status == 'APPROVED'
                                  ? Icons.check_circle
                                  : status == 'REJECTED'
                                  ? Icons.cancel
                                  : Icons.hourglass_empty,
                              size: 14,
                              color: statusColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              statusText,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Cairo',
                                color: statusColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // View Icon
                if (imageUrl.isNotEmpty)
                  Icon(
                    Icons.visibility_outlined,
                    color: Colors.grey[400],
                    size: 20,
                  ),
              ],
            ),
            // Edit button for PENDING or REJECTED receipts
            if (canEdit) ...[
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _showEditReceiptSheet(paymentId, imageUrl),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Colors.orange.withOpacity(0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.edit_document,
                              size: 18,
                              color: Colors.orange[700],
                            ),
                            const SizedBox(width: 6),
                            Text(
                              status == 'REJECTED'
                                  ? 'إعادة رفع الإيصال'
                                  : 'تعديل الإيصال',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Cairo',
                                color: Colors.orange[700],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String message,
    required String subMessage,
  }) {
    // Legacy - redirect to premium version
    return _buildPremiumEmptyState(
      icon: icon,
      message: message,
      subMessage: subMessage,
    );
  }

  Widget _buildPremiumEmptyState({
    required IconData icon,
    required String message,
    required String subMessage,
  }) {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Animated icon container
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.8, end: 1.0),
                duration: const Duration(milliseconds: 600),
                curve: Curves.elasticOut,
                builder: (context, value, child) {
                  return Transform.scale(
                    scale: value,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            primaryDark.withOpacity(0.1),
                            accentColor.withOpacity(0.1),
                          ],
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(
                          icon,
                          size: 50,
                          color: primaryDark.withOpacity(0.5),
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),
              Text(
                message,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                  color: Color(0xFF424242),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                subMessage,
                style: TextStyle(
                  fontSize: 14,
                  fontFamily: 'Cairo',
                  color: Colors.grey[500],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              // Upload button shortcut
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [accentColor, accentColor.withGreen(180)],
                  ),
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: accentColor.withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: InkWell(
                  onTap: _showUploadReceiptSheet,
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.upload_file_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'رفع إيصال جديد',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showUploadReceiptSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Icon(
                          Icons.upload_file_rounded,
                          color: Color(0xFF1ba3b6),
                          size: 28,
                        ),
                        SizedBox(width: 12),
                        Text(
                          'رفع إيصال الدفع',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Color(0xFF424242),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      'اختر صورة إيصال الدفع البنكي لشحن محفظتك',
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'Cairo',
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  _buildUploadOption(
                    icon: Icons.camera_alt_rounded,
                    title: 'التقاط صورة',
                    subtitle: 'استخدم الكاميرا',
                    onTap: () {
                      Navigator.pop(context);
                      _pickAndUploadReceipt(ImageSource.camera);
                    },
                  ),
                  _buildUploadOption(
                    icon: Icons.photo_library_rounded,
                    title: 'اختيار من المعرض',
                    subtitle: 'اختر صورة موجودة',
                    onTap: () {
                      Navigator.pop(context);
                      _pickAndUploadReceipt(ImageSource.gallery);
                    },
                  ),
                  _buildUploadOption(
                    icon: Icons.picture_as_pdf_rounded,
                    title: 'اختيار ملف PDF',
                    subtitle: 'اختر ملف PDF من الجهاز',
                    onTap: () {
                      Navigator.pop(context);
                      _pickAndUploadPdf();
                    },
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
    );
  }

  void _showEditReceiptSheet(String paymentId, String currentImageUrl) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.orange.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.edit_document,
                            color: Colors.orange,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'تعديل الإيصال',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Color(0xFF424242),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      'اختر صورة جديدة للإيصال لتحل محل الصورة الحالية',
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'Cairo',
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Current image preview
                  if (currentImageUrl.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              currentImageUrl,
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                              errorBuilder:
                                  (_, __, ___) => Container(
                                    width: 50,
                                    height: 50,
                                    color: Colors.grey[200],
                                    child: const Icon(
                                      Icons.image,
                                      color: Colors.grey,
                                    ),
                                  ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'الإيصال الحالي',
                              style: TextStyle(
                                fontSize: 14,
                                fontFamily: 'Cairo',
                                color: Colors.grey[600],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  _buildUploadOption(
                    icon: Icons.camera_alt_rounded,
                    title: 'التقاط صورة جديدة',
                    subtitle: 'استخدم الكاميرا',
                    onTap: () {
                      Navigator.pop(context);
                      _pickAndUpdateReceipt(paymentId, ImageSource.camera);
                    },
                  ),
                  _buildUploadOption(
                    icon: Icons.photo_library_rounded,
                    title: 'اختيار من المعرض',
                    subtitle: 'اختر صورة موجودة',
                    onTap: () {
                      Navigator.pop(context);
                      _pickAndUpdateReceipt(paymentId, ImageSource.gallery);
                    },
                  ),
                  _buildUploadOption(
                    icon: Icons.picture_as_pdf_rounded,
                    title: 'اختيار ملف PDF',
                    subtitle: 'اختر ملف PDF من الجهاز',
                    onTap: () {
                      Navigator.pop(context);
                      _pickAndUpdateReceiptPdf(paymentId);
                    },
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
    );
  }

  Future<void> _pickAndUpdateReceipt(
    String paymentId,
    ImageSource source,
  ) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      setState(() => _isUploading = true);

      // Show loading dialog
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder:
              (context) => const Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: Color(0xFF1ba3b6)),
                        SizedBox(height: 16),
                        Text(
                          'جاري تحديث الإيصال...',
                          style: TextStyle(fontFamily: 'Cairo'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
        );
      }

      // Upload new image first
      final uploadResult = await ApiService.uploadReceiptImage(
        File(pickedFile.path),
      );

      if (uploadResult['success'] != true) {
        if (mounted) Navigator.pop(context);
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: uploadResult['message'] ?? 'فشل في رفع الصورة',
          );
        }
        setState(() => _isUploading = false);
        return;
      }

      final imageUrl = uploadResult['url'];

      // Update payment with new image
      final updateResult = await ApiService.updatePaymentReceipt(
        paymentId: paymentId,
        imageUrl: imageUrl,
      );

      if (mounted) Navigator.pop(context);

      if (updateResult['success'] == true) {
        if (mounted) {
          AlNoranPopups.showSuccess(
            context: context,
            title: 'تم بنجاح!',
            message: 'تم تحديث الإيصال وسيتم مراجعته من الإدارة',
          );
        }
        _loadData(); // Refresh data
      } else {
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: updateResult['message'] ?? 'فشل في تحديث الإيصال',
          );
        }
      }
    } catch (e) {
      print('❌ Error updating receipt: $e');
      if (mounted) {
        Navigator.pop(context);
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء تحديث الإيصال',
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Future<void> _pickAndUpdateReceiptPdf(String paymentId) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );

      if (result == null || result.files.isEmpty) return;

      final file = File(result.files.single.path!);
      setState(() => _isUploading = true);

      // Show loading dialog
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder:
              (context) => const Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: Color(0xFF1ba3b6)),
                        SizedBox(height: 16),
                        Text(
                          'جاري تحديث الإيصال...',
                          style: TextStyle(fontFamily: 'Cairo'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
        );
      }

      // Upload PDF first
      final uploadResult = await ApiService.uploadReceiptImage(file);

      if (uploadResult['success'] != true) {
        if (mounted) Navigator.pop(context);
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: uploadResult['message'] ?? 'فشل في رفع الملف',
          );
        }
        setState(() => _isUploading = false);
        return;
      }

      final fileUrl = uploadResult['url'];

      // Update payment with new PDF
      final updateResult = await ApiService.updatePaymentReceipt(
        paymentId: paymentId,
        imageUrl: fileUrl,
      );

      if (mounted) Navigator.pop(context);

      if (updateResult['success'] == true) {
        if (mounted) {
          AlNoranPopups.showSuccess(
            context: context,
            title: 'تم بنجاح!',
            message: 'تم تحديث الإيصال وسيتم مراجعته من الإدارة',
          );
        }
        _loadData(); // Refresh data
      } else {
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: updateResult['message'] ?? 'فشل في تحديث الإيصال',
          );
        }
      }
    } catch (e) {
      print('❌ Error updating PDF receipt: $e');
      if (mounted) {
        Navigator.pop(context);
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء تحديث الملف',
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Widget _buildUploadOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1ba3b6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: const Color(0xFF1ba3b6), size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Cairo',
                      color: Color(0xFF424242),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 13,
                      fontFamily: 'Cairo',
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  Future<void> _pickAndUploadReceipt(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      setState(() => _isUploading = true);

      // Show loading dialog
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder:
              (context) => const Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: Color(0xFF1ba3b6)),
                        SizedBox(height: 16),
                        Text(
                          'جاري رفع الإيصال...',
                          style: TextStyle(fontFamily: 'Cairo'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
        );
      }

      // Upload image first
      final uploadResult = await ApiService.uploadReceiptImage(
        File(pickedFile.path),
      );

      if (uploadResult['success'] != true) {
        if (mounted) Navigator.pop(context);
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: uploadResult['message'] ?? 'فشل في رفع الصورة',
          );
        }
        setState(() => _isUploading = false);
        return;
      }

      final imageUrl = uploadResult['url'];

      // Create payment with uploaded image
      final paymentResult = await ApiService.createPayment(
        imageUrls: [imageUrl],
      );

      if (mounted) Navigator.pop(context);

      if (paymentResult['success'] == true) {
        if (mounted) {
          AlNoranPopups.showSuccess(
            context: context,
            title: 'تم بنجاح!',
            message: 'تم رفع الإيصال وسيتم مراجعته من الإدارة',
          );
        }
        _loadData(); // Refresh data
      } else {
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: paymentResult['message'] ?? 'فشل في إنشاء عملية الدفع',
          );
        }
      }
    } catch (e) {
      print('❌ Error uploading receipt: $e');
      if (mounted) {
        Navigator.pop(context);
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء رفع الإيصال',
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Future<void> _pickAndUploadPdf() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );

      if (result == null || result.files.isEmpty) return;

      final file = File(result.files.single.path!);
      setState(() => _isUploading = true);

      // Show loading dialog
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder:
              (context) => const Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: Color(0xFF1ba3b6)),
                        SizedBox(height: 16),
                        Text(
                          'جاري رفع الإيصال...',
                          style: TextStyle(fontFamily: 'Cairo'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
        );
      }

      // Upload PDF first
      final uploadResult = await ApiService.uploadReceiptImage(file);

      if (uploadResult['success'] != true) {
        if (mounted) Navigator.pop(context);
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: uploadResult['message'] ?? 'فشل في رفع الملف',
          );
        }
        setState(() => _isUploading = false);
        return;
      }

      final fileUrl = uploadResult['url'];

      // Create payment with uploaded PDF
      final paymentResult = await ApiService.createPayment(
        imageUrls: [fileUrl],
      );

      if (mounted) Navigator.pop(context);

      if (paymentResult['success'] == true) {
        if (mounted) {
          AlNoranPopups.showSuccess(
            context: context,
            title: 'تم بنجاح!',
            message: 'تم رفع الإيصال وسيتم مراجعته من الإدارة',
          );
        }
        _loadData(); // Refresh data
      } else {
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: paymentResult['message'] ?? 'فشل في إنشاء عملية الدفع',
          );
        }
      }
    } catch (e) {
      print('❌ Error uploading PDF: $e');
      if (mounted) {
        Navigator.pop(context);
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء رفع الملف',
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Future<void> _payInvoice(Map<String, dynamic> invoice) async {
    final invoiceId = invoice['_id'];
    final total = _calculateInvoiceTotal(invoice);

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: const Row(
                children: [
                  Icon(Icons.payment_rounded, color: Color(0xFF690000)),
                  SizedBox(width: 10),
                  Text(
                    'تأكيد الدفع',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'هل تريد دفع هذه الفاتورة من المحفظة؟',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'المبلغ:',
                          style: TextStyle(fontFamily: 'Cairo'),
                        ),
                        Text(
                          '${total.toStringAsFixed(0)} ج.م',
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF690000),
                          ),
                        ),
                      ],
                    ),
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
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'تأكيد الدفع',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
    );

    if (confirmed != true) return;

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => const Center(
            child: CircularProgressIndicator(color: Color(0xFF690000)),
          ),
    );

    try {
      final result = await ApiService.payInvoice(invoiceId);

      if (mounted) Navigator.pop(context);

      if (result['success'] == true) {
        if (mounted) {
          AlNoranPopups.showSuccess(
            context: context,
            title: 'تم الدفع بنجاح!',
            message: 'تم خصم المبلغ من محفظتك',
          );
        }
        _loadData(); // Refresh data
      } else {
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: result['message'] ?? 'فشل في عملية الدفع',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء عملية الدفع',
        );
      }
    }
  }

  void _showInsufficientBalanceDialog(double required) {
    final deficit = required - _walletBalance;

    showDialog(
      context: context,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.warning_rounded,
                      color: Colors.orange,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'الرصيد غير كافي',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'رصيد محفظتك الحالي غير كافي لدفع هذه الفاتورة',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'رصيدك:',
                              style: TextStyle(fontFamily: 'Cairo'),
                            ),
                            Text(
                              '${_walletBalance.toStringAsFixed(0)} ج.م',
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'المطلوب:',
                              style: TextStyle(fontFamily: 'Cairo'),
                            ),
                            Text(
                              '${required.toStringAsFixed(0)} ج.م',
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF690000),
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'الناقص:',
                              style: TextStyle(fontFamily: 'Cairo'),
                            ),
                            Text(
                              '${deficit.toStringAsFixed(0)} ج.م',
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'حسناً',
                    style: TextStyle(fontFamily: 'Cairo'),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _showUploadReceiptSheet();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1ba3b6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: const Icon(
                    Icons.upload_file,
                    size: 18,
                    color: Colors.white,
                  ),
                  label: const Text(
                    'شحن المحفظة',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
    );
  }

  void _showReceiptImage(String imageUrl) {
    showDialog(
      context: context,
      builder:
          (context) => Dialog(
            backgroundColor: Colors.transparent,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Close button
                Align(
                  alignment: Alignment.topLeft,
                  child: IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.close, color: Colors.black),
                    ),
                  ),
                ),
                // Image
                Container(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.7,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: Colors.white,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.contain,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return const Padding(
                          padding: EdgeInsets.all(50),
                          child: CircularProgressIndicator(
                            color: Color(0xFF690000),
                          ),
                        );
                      },
                      errorBuilder:
                          (_, __, ___) => const Padding(
                            padding: EdgeInsets.all(50),
                            child: Icon(
                              Icons.error_outline,
                              size: 50,
                              color: Colors.red,
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

  Color _getStatusColor(String status) {
    switch (status) {
      case 'تم الدفع':
        return Colors.green;
      case 'تمت الموافقة':
        return const Color(0xFF1ba3b6);
      case 'مرفوض':
        return Colors.red;
      case 'في انتظار الموافقة':
      default:
        return Colors.orange;
    }
  }

  Color _getPaymentStatusColor(String status) {
    switch (status) {
      case 'APPROVED':
        return Colors.green;
      case 'REJECTED':
        return Colors.red;
      case 'PENDING':
      default:
        return Colors.orange;
    }
  }

  String _getPaymentStatusText(String status) {
    switch (status) {
      case 'APPROVED':
        return 'تمت الموافقة';
      case 'REJECTED':
        return 'مرفوض';
      case 'PENDING':
      default:
        return 'قيد المراجعة';
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'غير محدد';
    try {
      final DateTime dateTime = DateTime.parse(date.toString());
      final months = [
        'يناير',
        'فبراير',
        'مارس',
        'أبريل',
        'مايو',
        'يونيو',
        'يوليو',
        'أغسطس',
        'سبتمبر',
        'أكتوبر',
        'نوفمبر',
        'ديسمبر',
      ];
      return '${dateTime.day} ${months[dateTime.month - 1]} ${dateTime.year}';
    } catch (e) {
      return 'غير محدد';
    }
  }

  void _handleNavigationTap(int index) {
    switch (index) {
      case 0:
        // الرئيسية - navigate to home
        setState(() => _selectedIndex = index);
        context.go(
          '/home',
          extra: {'userName': widget.userName, 'userEmail': widget.userEmail},
        );
        break;
      case 1:
        // الوارد - Navigate to incoming shipments
        setState(() => _selectedIndex = index);
        context.go(
          '/shipments',
          extra: {
            'userName': widget.userName,
            'userEmail': widget.userEmail,
            'type': 'incoming',
          },
        );
        break;
      case 2:
        // الصادر - Navigate to exports page
        setState(() => _selectedIndex = index);
        context.go(
          '/exports',
          extra: {'userName': widget.userName, 'userEmail': widget.userEmail},
        );
        break;
      case 3:
        // الفواتير - Navigate to payments page (already here)
        if (_selectedIndex != 3) {
          setState(() => _selectedIndex = 3);
        }
        break;
    }
  }

  // ==================== PREMIUM BOTTOM NAVIGATION ====================
  Widget _buildPremiumBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(30),
          topRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildPremiumNavItem(0, Icons.home_rounded, 'الرئيسية'),
              _buildPremiumNavItem(1, Icons.flight_land_rounded, 'الوارد'),
              _buildPremiumNavItem(2, Icons.flight_takeoff_rounded, 'الصادر'),
              _buildPremiumNavItem(3, Icons.receipt_long_rounded, 'الفواتير'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        _handleNavigationTap(index);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 20 : 16,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          gradient:
              isSelected
                  ? const LinearGradient(
                    colors: [Color(0xFF690000), Color(0xFF8B0000)],
                  )
                  : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow:
              isSelected
                  ? [
                    BoxShadow(
                      color: const Color(0xFF690000).withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                  : [],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : Colors.grey[500],
              size: 22,
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
