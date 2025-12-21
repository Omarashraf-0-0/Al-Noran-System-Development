import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:url_launcher/url_launcher.dart';
import '../../core/network/api_service.dart';
import '../../core/services/document_verification_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/widgets/unified_top_bar.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../util/file_picker_helper.dart';

class UcrRequestPage extends StatefulWidget {
  final String? userName;
  final String? userEmail;

  const UcrRequestPage({Key? key, this.userName, this.userEmail})
    : super(key: key);

  @override
  State<UcrRequestPage> createState() => _UcrRequestPageState();
}

class _UcrRequestPageState extends State<UcrRequestPage>
    with SingleTickerProviderStateMixin {
  // Premium Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accent = Color(0xFF1BA3B6);
  static const Color bgColor = Color(0xFFF8F9FA);
  static const Color cardColor = Colors.white;

  // Animation controller
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Current step: 0 = اختيار نوع الشهادة, 1 = ملء البيانات
  int _currentStep = 0;

  // Certification type: 'noran' = على بطاقة الشركة, 'client' = على بطاقتي
  String? _certificationType;

  // Shipping method: 'air' = جوي, 'sea' = بحري
  String _shippingMethod = 'sea';

  // Sea shipment type: 'fcl' = حاويات, 'lcl' = بضايع عامة, 'parcels' = طرود
  String _seaShipmentType = 'fcl';

  // Weight unit for general weight
  String _generalWeightUnit = 'kilograms';

  // State
  bool _isSubmitting = false;

  // Document verification
  final DocumentVerificationService _docVerification =
      DocumentVerificationService();
  bool _isCheckingDocuments = true;
  bool _canSubmitRequests = false;
  String _verificationMessage = '';

  // Destination controllers
  final TextEditingController _destinationCountryController =
      TextEditingController();
  final TextEditingController _destinationPortController =
      TextEditingController();

  // Goods info controllers
  final TextEditingController _generalDescriptionController =
      TextEditingController();
  final TextEditingController _totalWeightController = TextEditingController();
  final TextEditingController _packagesCountController =
      TextEditingController();

  // Invoice controllers
  final TextEditingController _valueInEGPController = TextEditingController();
  final TextEditingController _invoiceNumberController =
      TextEditingController();
  DateTime? _invoiceDate;

  // Sea shipment controllers (only for sea)
  final TextEditingController _quantityController = TextEditingController();
  String _weightUnit = 'كيلوجرام';
  final TextEditingController _containersCountController =
      TextEditingController();
  List<Map<String, dynamic>> _containerWeights = [];

  // Items (optional - تفاصيل البنود)
  List<Map<String, dynamic>> _items = [];

  // Uploaded documents
  Map<String, Map<String, dynamic>> _uploadedDocuments = {};

  // Notes
  final TextEditingController _notesController = TextEditingController();

  // Countries list - Complete list of countries
  final List<String> _countries = [
    // الدول العربية
    'المملكة العربية السعودية',
    'الإمارات العربية المتحدة',
    'الكويت',
    'قطر',
    'البحرين',
    'عمان',
    'الأردن',
    'لبنان',
    'سوريا',
    'العراق',
    'فلسطين',
    'اليمن',
    'ليبيا',
    'تونس',
    'الجزائر',
    'المغرب',
    'السودان',
    'موريتانيا',
    'جيبوتي',
    'الصومال',
    'جزر القمر',
    // أوروبا
    'المملكة المتحدة',
    'ألمانيا',
    'فرنسا',
    'إيطاليا',
    'إسبانيا',
    'هولندا',
    'بلجيكا',
    'البرتغال',
    'سويسرا',
    'النمسا',
    'السويد',
    'النرويج',
    'الدنمارك',
    'فنلندا',
    'بولندا',
    'التشيك',
    'المجر',
    'رومانيا',
    'بلغاريا',
    'اليونان',
    'كرواتيا',
    'صربيا',
    'أوكرانيا',
    'روسيا',
    'أيرلندا',
    // آسيا
    'تركيا',
    'الصين',
    'اليابان',
    'كوريا الجنوبية',
    'كوريا الشمالية',
    'الهند',
    'باكستان',
    'بنغلاديش',
    'إندونيسيا',
    'ماليزيا',
    'سنغافورة',
    'تايلاند',
    'فيتنام',
    'الفلبين',
    'ميانمار',
    'كمبوديا',
    'سريلانكا',
    'نيبال',
    'أفغانستان',
    'إيران',
    'كازاخستان',
    'أوزبكستان',
    'تايوان',
    'هونغ كونغ',
    // أمريكا الشمالية
    'الولايات المتحدة',
    'كندا',
    'المكسيك',
    // أمريكا الوسطى والكاريبي
    'كوبا',
    'جامايكا',
    'بنما',
    'كوستاريكا',
    'غواتيمالا',
    // أمريكا الجنوبية
    'البرازيل',
    'الأرجنتين',
    'تشيلي',
    'كولومبيا',
    'بيرو',
    'فنزويلا',
    'الإكوادور',
    'أوروغواي',
    'باراغواي',
    'بوليفيا',
    // أفريقيا
    'مصر',
    'جنوب أفريقيا',
    'نيجيريا',
    'كينيا',
    'إثيوبيا',
    'غانا',
    'تنزانيا',
    'أوغندا',
    'المغرب',
    'الكاميرون',
    'ساحل العاج',
    'السنغال',
    'زيمبابوي',
    'أنغولا',
    'موزمبيق',
    'مدغشقر',
    'رواندا',
    // أوقيانوسيا
    'أستراليا',
    'نيوزيلندا',
    'فيجي',
    'بابوا غينيا الجديدة',
    // أخرى
    'أخرى',
  ];

  @override
  void initState() {
    super.initState();
    // Initialize animation controller
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic),
    );
    _animationController.forward();
    // Check document verification status
    _checkDocumentStatus();
  }

  Future<void> _checkDocumentStatus({bool forceRefresh = false}) async {
    setState(() => _isCheckingDocuments = true);

    final result = await _docVerification.checkDocumentStatus(
      forceRefresh: forceRefresh,
    );

    if (mounted) {
      setState(() {
        _canSubmitRequests = result['canSubmitRequests'] ?? false;
        _verificationMessage = result['message'] ?? '';
        _isCheckingDocuments = false;
      });
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _destinationCountryController.dispose();
    _destinationPortController.dispose();
    _generalDescriptionController.dispose();
    _totalWeightController.dispose();
    _packagesCountController.dispose();
    _valueInEGPController.dispose();
    _invoiceNumberController.dispose();
    _quantityController.dispose();
    _containersCountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  /// Show dialog when documents are not verified
  void _showDocumentRequiredDialog([Map<String, dynamic>? result]) {
    // Get document lists from result
    final missingDocs = result?['missingDocuments'] as List? ?? [];
    final pendingDocs = result?['pendingDocuments'] as List? ?? [];
    final rejectedDocs = result?['rejectedDocuments'] as List? ?? [];

    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (dialogContext) => PopScope(
            canPop: false,
            onPopInvokedWithResult: (didPop, result) {
              if (!didPop) {
                // When back button is pressed, go to home
                Navigator.pop(dialogContext);
                context.go('/home');
              }
            },
            child: Directionality(
              textDirection: TextDirection.rtl,
              child: Dialog(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: Colors.white,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header with gradient
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          vertical: 24,
                          horizontal: 20,
                        ),
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF690000), Color(0xFF8B0000)],
                          ),
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(20),
                            topRight: Radius.circular(20),
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(50),
                              ),
                              child: const Icon(
                                Icons.folder_off_outlined,
                                color: Colors.white,
                                size: 36,
                              ),
                            ),
                            const SizedBox(height: 14),
                            const Text(
                              'المستندات مطلوبة',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'لا يمكنك تقديم طلب UCR الآن',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 13,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Content
                      ConstrainedBox(
                        constraints: BoxConstraints(
                          maxHeight: MediaQuery.of(context).size.height * 0.4,
                        ),
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'يجب الموافقة على جميع المستندات المطلوبة قبل تقديم الطلب:',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 14,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Missing documents
                              if (missingDocs.isNotEmpty) ...[
                                _buildDocumentStatusSection(
                                  'مستندات مفقودة',
                                  missingDocs,
                                  const Color(0xFF690000),
                                  Icons.cancel_outlined,
                                ),
                                const SizedBox(height: 12),
                              ],

                              // Pending documents
                              if (pendingDocs.isNotEmpty) ...[
                                _buildDocumentStatusSection(
                                  'قيد المراجعة',
                                  pendingDocs,
                                  Colors.orange.shade700,
                                  Icons.hourglass_empty,
                                ),
                                const SizedBox(height: 12),
                              ],

                              // Rejected documents
                              if (rejectedDocs.isNotEmpty) ...[
                                _buildDocumentStatusSection(
                                  'مرفوضة - تحتاج إعادة رفع',
                                  rejectedDocs,
                                  Colors.red.shade700,
                                  Icons.highlight_off,
                                ),
                                const SizedBox(height: 12),
                              ],
                            ],
                          ),
                        ),
                      ),
                      // Actions
                      Container(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                        child: Column(
                          children: [
                            // Primary action - Go to documents
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () {
                                  Navigator.pop(dialogContext);
                                  // Re-check documents when returning from documents page
                                  context.push('/documents').then((_) {
                                    if (mounted) {
                                      _checkDocumentStatus(forceRefresh: true);
                                    }
                                  });
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF690000),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 0,
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.folder_open,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                    SizedBox(width: 10),
                                    Text(
                                      'الذهاب إلى المستندات',
                                      style: TextStyle(
                                        fontFamily: 'Cairo',
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            // Secondary action - Go home
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: () {
                                  Navigator.pop(dialogContext);
                                  context.go('/home');
                                },
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  side: BorderSide(color: Colors.grey.shade300),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.home_outlined,
                                      color: Colors.grey.shade600,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      'الرجوع للرئيسية',
                                      style: TextStyle(
                                        fontFamily: 'Cairo',
                                        color: Colors.grey.shade600,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
    );
  }

  Widget _buildDocumentStatusSection(
    String title,
    List docs,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...docs.map(
            (doc) => Padding(
              padding: const EdgeInsets.only(right: 26, top: 4),
              child: Text(
                '• ${_getRegistrationDocumentDisplayName(doc.toString())}',
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  color: Colors.black87,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getRegistrationDocumentDisplayName(String docType) {
    final names = {
      'personal_id': 'البطاقة الشخصية',
      'passport': 'جواز السفر',
      'power_of_attorney': 'التوكيل',
      'contract': 'العقد',
      'tax_card': 'البطاقة الضريبية',
      'commercial_register': 'السجل التجاري',
      'certificate_vat': 'شهادة القيمة المضافة',
      'import_export_card': 'بطاقة الاستيراد والتصدير',
      'production_supplies': 'مستلزمات الإنتاج',
      'industrial_register': 'السجل الصناعي',
      'personal_id_of_representative': 'بطاقة المفوض',
      'trade_certificates': 'شهادات المزاولة',
    };
    return names[docType] ?? docType;
  }

  // Map document key to valid backend enum value
  String _mapDocumentKeyToEnum(String key) {
    final mappings = {
      'bank_waiver': 'bank_waiver',
      'export_invoice': 'export_invoice',
      'export_packing_list': 'export_packing_list',
      'shipping_permit': 'shipping_permit',
      'awb': 'awb',
      'bl': 'bl',
    };
    return mappings[key] ?? 'other';
  }

  // Get document description
  String _getDocumentDescription(String key) {
    final descriptions = {
      'bank_waiver': 'إعفاء بنكي من الجهة المصرفية',
      'export_invoice': 'فاتورة التصدير التجارية',
      'export_packing_list': 'قائمة التعبئة',
      'shipping_permit': 'تصريح الشحن من الجمارك',
      'awb': 'بوليصة الشحن الجوي',
      'bl': 'بوليصة الشحن البحري',
    };
    return descriptions[key] ?? '';
  }

  // Calculate export fee preview (for Noran certification)
  double _calculateFeePreview() {
    if (_certificationType != 'noran') return 0;
    final value = double.tryParse(_valueInEGPController.text.trim()) ?? 0;
    // 10% of value, minimum 3500 EGP
    return value > 0 ? (value * 0.1 > 3500 ? value * 0.1 : 3500) : 0;
  }

  // Check if packages count is required
  bool get _needsPackagesCount {
    return _shippingMethod == 'air' ||
        (_shippingMethod == 'sea' &&
            (_seaShipmentType == 'parcels' || _seaShipmentType == 'lcl'));
  }

  // Get required documents based on certification type and shipping method
  List<Map<String, String>> get _requiredDocuments {
    if (_certificationType == 'noran') {
      // على بطاقة الشركة - نفس المستندات للجوي والبحري
      return [
        {'key': 'bank_waiver', 'name': 'التنازل البنكي'},
        {'key': 'export_invoice', 'name': 'الفاتورة الأصلية'},
        {'key': 'export_packing_list', 'name': 'كشف العبوة'},
      ];
    } else {
      // على بطاقتي الخاصة
      if (_shippingMethod == 'air') {
        return [
          {'key': 'export_invoice', 'name': 'الفاتورة الأصلية'},
          {'key': 'shipping_permit', 'name': 'إذن الشحن'},
          {'key': 'awb', 'name': 'بوليصة الشحن الجوي (AWB)'},
        ];
      } else {
        return [
          {'key': 'export_invoice', 'name': 'الفاتورة الأصلية'},
          {'key': 'shipping_permit', 'name': 'إذن الشحن'},
          {'key': 'bl', 'name': 'بوليصة الشحن البحري (B/L)'},
        ];
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _currentStep == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        HapticFeedback.lightImpact();
        // If on step 1, go back to step 0
        setState(() {
          _currentStep = 0;
        });
        _animationController.reset();
        _animationController.forward();
      },
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          backgroundColor: bgColor,
          body: Column(
            children: [
              UnifiedTopBar(
                showBackButton: true,
                showMenu: false,
                title: 'طلب رقم UCR',
                subtitle:
                    _currentStep == 0 ? 'اختر نوع الشهادة' : 'ملء البيانات',
                titleIcon: Icons.local_shipping_rounded,
                showWelcome: false,
                onBackPressed:
                    _currentStep == 0
                        ? null
                        : () {
                          HapticFeedback.lightImpact();
                          setState(() {
                            _currentStep = 0;
                          });
                          _animationController.reset();
                          _animationController.forward();
                        },
              ),
              Expanded(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child:
                        _currentStep == 0
                            ? _buildCertificationTypeSelection()
                            : _buildDataEntryForm(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // =====================================================
  // STEP 1: Certification Type Selection
  // =====================================================

  Widget _buildCertificationTypeSelection() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          children: [
            const SizedBox(height: 24),

            // Premium Header Card
            _buildPremiumHeaderCard(
              icon: Icons.verified_rounded,
              title: 'اختر نوع الشهادة',
              subtitle: 'حدد طريقة إصدار شهادة UCR',
            ),

            const SizedBox(height: 28),

            // Section Title with Icon
            _buildSectionHeader(
              'نوع الشهادة',
              Icons.assignment_turned_in_rounded,
            ),

            const SizedBox(height: 16),

            // Option 1: على بطاقة الشركة (النوران)
            _buildPremiumCertificationOption(
              type: 'noran',
              title: 'على بطاقة الشركة',
              subtitle: 'النوران تتولى جميع المستندات والإجراءات',
              note: 'رسوم 10%',
              icon: Icons.business_center_rounded,
              color: const Color(0xFF2E7D32),
              isSelected: _certificationType == 'noran',
              features: ['إجراءات سريعة', 'دعم كامل', 'ضمان الجودة'],
            ),

            const SizedBox(height: 16),

            // Option 2: على بطاقتي الخاصة
            _buildPremiumCertificationOption(
              type: 'client',
              title: 'على بطاقتي الخاصة',
              subtitle: 'أنت المسؤول عن توفير المستندات المطلوبة',
              note: 'بدون رسوم إضافية',
              icon: Icons.person_rounded,
              color: const Color(0xFFEF6C00),
              isSelected: _certificationType == 'client',
              features: ['توفير مالي', 'مرونة أكثر', 'تحكم كامل'],
            ),

            const SizedBox(height: 36),

            // Premium Continue Button
            _buildPremiumContinueButton(),

            const SizedBox(height: 24),

            // Info tip
            _buildInfoTip(
              'يمكنك تغيير نوع الشهادة لاحقاً قبل إرسال الطلب',
              Icons.lightbulb_outline_rounded,
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumHeaderCard({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [primaryDark, primaryLight],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withValues(alpha: 0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(icon, color: Colors.white, size: 36),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withValues(alpha: 0.85),
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(
    String title,
    IconData icon, {
    bool isRequired = false,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: primaryDark.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: primaryDark, size: 22),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: primaryDark,
            fontFamily: 'Cairo',
          ),
        ),
        if (isRequired) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'مطلوب',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.red.shade700,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPremiumCertificationOption({
    required String type,
    required String title,
    required String subtitle,
    required String note,
    required IconData icon,
    required Color color,
    required bool isSelected,
    required List<String> features,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          _certificationType = type;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.08) : cardColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade200,
            width: isSelected ? 2.5 : 1,
          ),
          boxShadow:
              isSelected
                  ? [
                    BoxShadow(
                      color: color.withValues(alpha: 0.25),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ]
                  : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                // Icon Container
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient:
                        isSelected
                            ? LinearGradient(
                              colors: [color, color.withValues(alpha: 0.8)],
                            )
                            : null,
                    color: isSelected ? null : color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow:
                        isSelected
                            ? [
                              BoxShadow(
                                color: color.withValues(alpha: 0.4),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ]
                            : null,
                  ),
                  child: Icon(
                    icon,
                    color: isSelected ? Colors.white : color,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                // Text Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: isSelected ? color : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          fontFamily: 'Cairo',
                          color: Colors.grey.shade600,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                // Selection Indicator
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected ? color : Colors.transparent,
                    border: Border.all(
                      color: isSelected ? color : Colors.grey.shade400,
                      width: 2,
                    ),
                    boxShadow:
                        isSelected
                            ? [
                              BoxShadow(
                                color: color.withValues(alpha: 0.4),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                            : null,
                  ),
                  child:
                      isSelected
                          ? const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 18,
                          )
                          : null,
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Note Badge and Features
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        color.withValues(alpha: 0.15),
                        color.withValues(alpha: 0.08),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: color.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        type == 'noran'
                            ? Icons.percent_rounded
                            : Icons.savings_rounded,
                        size: 14,
                        color: color,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        note,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: color,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            // Features Row (only show when selected)
            AnimatedCrossFade(
              duration: const Duration(milliseconds: 300),
              crossFadeState:
                  isSelected
                      ? CrossFadeState.showFirst
                      : CrossFadeState.showSecond,
              firstChild: Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children:
                      features.map((feature) {
                        return Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.check_circle_rounded,
                              color: color,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              feature,
                              style: TextStyle(
                                fontSize: 11,
                                fontFamily: 'Cairo',
                                color: color,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        );
                      }).toList(),
                ),
              ),
              secondChild: const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumContinueButton() {
    final isEnabled = _certificationType != null;
    return Container(
      width: double.infinity,
      height: 60,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors:
              isEnabled
                  ? [primaryDark, primaryLight]
                  : [Colors.grey.shade400, Colors.grey.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow:
            isEnabled
                ? [
                  BoxShadow(
                    color: primaryDark.withValues(alpha: 0.4),
                    blurRadius: 15,
                    offset: const Offset(0, 6),
                  ),
                ]
                : null,
      ),
      child: ElevatedButton(
        onPressed:
            isEnabled
                ? () {
                  HapticFeedback.mediumImpact();
                  setState(() {
                    _currentStep = 1;
                  });
                  _animationController.reset();
                  _animationController.forward();
                }
                : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          shadowColor: Colors.transparent,
          disabledBackgroundColor: Colors.transparent,
          disabledForegroundColor: Colors.white60,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'متابعة للخطوة التالية',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.arrow_forward_rounded, size: 18),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTip(String message, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue.shade600, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 12,
                fontFamily: 'Cairo',
                color: Colors.blue.shade800,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCertificationOption({
    required String type,
    required String title,
    required String subtitle,
    required String note,
    required IconData icon,
    required Color color,
    required bool isSelected,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GestureDetector(
        onTap: () {
          setState(() {
            _certificationType = type;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.1) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? color : Colors.grey[300]!,
              width: isSelected ? 2 : 1,
            ),
            boxShadow:
                isSelected
                    ? [
                      BoxShadow(
                        color: color.withOpacity(0.2),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ]
                    : [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
          ),
          child: Row(
            children: [
              // Icon
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: color.withOpacity(isSelected ? 0.2 : 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 32),
              ),
              const SizedBox(width: 16),
              // Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                        color: isSelected ? color : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'Cairo',
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        note,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: color,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Checkbox
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected ? color : Colors.transparent,
                  border: Border.all(
                    color: isSelected ? color : Colors.grey[400]!,
                    width: 2,
                  ),
                ),
                child:
                    isSelected
                        ? const Icon(Icons.check, color: Colors.white, size: 18)
                        : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // =====================================================
  // STEP 2: Data Entry Form
  // =====================================================

  Widget _buildDataEntryForm() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          children: [
            const SizedBox(height: 24),

            // Premium Header with certification type badge
            _buildFormHeader(),

            const SizedBox(height: 24),

            // Shipping Method Toggle (Premium Style)
            _buildPremiumShippingToggle(),

            const SizedBox(height: 28),

            // Destination Section
            _buildSectionHeader(
              'الوجهة',
              Icons.location_on_rounded,
              isRequired: true,
            ),
            const SizedBox(height: 12),
            _buildPremiumDestinationSection(),

            const SizedBox(height: 28),

            // Goods Info Section
            _buildSectionHeader(
              'بيانات البضاعة',
              Icons.inventory_2_rounded,
              isRequired: true,
            ),
            const SizedBox(height: 12),
            _buildPremiumGoodsSection(),

            const SizedBox(height: 28),

            // Invoice Section
            _buildSectionHeader(
              'بيانات الفاتورة',
              Icons.receipt_rounded,
              isRequired: true,
            ),
            const SizedBox(height: 12),
            _buildPremiumInvoiceSection(),

            const SizedBox(height: 28),

            // Items Section
            _buildSectionHeader(
              'تفاصيل البنود',
              Icons.list_alt_rounded,
              isRequired: true,
            ),
            const SizedBox(height: 12),
            _buildItemsSection(),

            const SizedBox(height: 28),

            // Documents Section
            _buildSectionHeader(
              'المستندات المطلوبة',
              Icons.attach_file_rounded,
              isRequired: true,
            ),
            const SizedBox(height: 12),
            _buildDocumentsSection(),

            const SizedBox(height: 28),

            // Notes Section (Optional)
            _buildSectionHeader('ملاحظات إضافية', Icons.note_alt_rounded),
            const SizedBox(height: 12),
            _buildNotesSection(),

            const SizedBox(height: 36),

            // Premium Submit Button
            _buildPremiumSubmitButton(),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildFormHeader() {
    final isNoran = _certificationType == 'noran';
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [primaryDark, primaryLight],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withValues(alpha: 0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  Icons.edit_document,
                  color: Colors.white,
                  size: 32,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ملء بيانات الطلب',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'أكمل جميع الحقول المطلوبة بدقة',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withValues(alpha: 0.85),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Certification type badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  isNoran
                      ? Icons.business_center_rounded
                      : Icons.person_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Text(
                  isNoran ? 'على بطاقة الشركة (النوران)' : 'على بطاقتي الخاصة',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color:
                        isNoran
                            ? Colors.green.shade400
                            : Colors.orange.shade400,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isNoran ? '10%' : 'مجاني',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumShippingToggle() {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildPremiumShippingButton(
              'شحن جوي',
              'air',
              Icons.flight_rounded,
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: _buildPremiumShippingButton(
              'شحن بحري',
              'sea',
              Icons.directions_boat_rounded,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumShippingButton(
    String label,
    String value,
    IconData icon,
  ) {
    final isSelected = _shippingMethod == value;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          _shippingMethod = value;
          _containerWeights.clear();
          _containersCountController.clear();
          _seaShipmentType = 'fcl';
          _packagesCountController.clear();
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        height: 60,
        decoration: BoxDecoration(
          gradient:
              isSelected
                  ? LinearGradient(
                    colors: [primaryDark, primaryLight],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                  : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow:
              isSelected
                  ? [
                    BoxShadow(
                      color: primaryDark.withValues(alpha: 0.35),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                  : null,
        ),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : Colors.grey.shade600,
                size: 24,
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey.shade700,
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumDestinationSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildPremiumDropdownField(
            label: 'بلد الوجهة',
            icon: Icons.public_rounded,
            value:
                _destinationCountryController.text.isEmpty
                    ? null
                    : _destinationCountryController.text,
            items: _countries,
            isRequired: true,
            onChanged: (value) {
              setState(() {
                _destinationCountryController.text = value ?? '';
              });
            },
          ),
          const SizedBox(height: 16),
          _buildPremiumTextField(
            controller: _destinationPortController,
            label: 'الميناء / المطار',
            placeholder: 'أدخل اسم الميناء أو المطار',
            icon: Icons.anchor_rounded,
            isRequired: true,
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumGoodsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildPremiumTextField(
            controller: _generalDescriptionController,
            label: 'الوصف العام للبضاعة',
            placeholder: 'وصف تفصيلي للبضاعة المراد تصديرها',
            icon: Icons.description_rounded,
            isRequired: true,
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: _buildPremiumTextField(
                  controller: _totalWeightController,
                  label: 'الوزن الإجمالي',
                  placeholder: '500',
                  icon: Icons.scale_rounded,
                  isRequired: true,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPremiumDropdownField(
                  label: 'الوحدة',
                  icon: Icons.straighten_rounded,
                  value: _generalWeightUnit == 'kilograms' ? 'كيلوجرام' : 'طن',
                  items: const ['كيلوجرام', 'طن'],
                  onChanged: (value) {
                    setState(() {
                      _generalWeightUnit = value == 'طن' ? 'tons' : 'kilograms';
                    });
                  },
                ),
              ),
            ],
          ),
          // Sea Shipment Type Selection (only for sea)
          if (_shippingMethod == 'sea') ...[
            const SizedBox(height: 20),
            _buildSeaShipmentTypeSelector(),
          ],
          // Packages Count - only show when needed
          if (_needsPackagesCount) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildPremiumTextField(
                    controller: _packagesCountController,
                    label: 'عدد الطرود',
                    placeholder: '10',
                    icon: Icons.inventory_rounded,
                    isRequired: true,
                    keyboardType: TextInputType.number,
                  ),
                ),
                if (_shippingMethod == 'sea') ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildPremiumTextField(
                      controller: _quantityController,
                      label: 'الكمية',
                      placeholder: '100',
                      icon: Icons.production_quantity_limits_rounded,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ],
            ),
          ],
          // Containers Section (only for sea + FCL)
          if (_shippingMethod == 'sea' && _seaShipmentType == 'fcl') ...[
            const SizedBox(height: 20),
            _buildContainersSection(),
          ],
        ],
      ),
    );
  }

  Widget _buildPremiumInvoiceSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Info tip
          _buildInfoTip(
            'بيانات الفاتورة التجارية الأصلية المُصدرة للمستورد',
            Icons.lightbulb_outline_rounded,
          ),
          const SizedBox(height: 20),
          _buildPremiumTextField(
            controller: _valueInEGPController,
            label: 'القيمة بالجنيه المصري',
            placeholder: '50,000',
            icon: Icons.attach_money_rounded,
            isRequired: true,
            keyboardType: TextInputType.number,
            onChanged: (value) => setState(() {}),
          ),
          // Fee Preview for Noran Certified
          if (_certificationType == 'noran' &&
              _valueInEGPController.text.isNotEmpty) ...[
            const SizedBox(height: 16),
            _buildFeePreviewCard(),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildPremiumTextField(
                  controller: _invoiceNumberController,
                  label: 'رقم الفاتورة',
                  placeholder: 'INV-2025-001',
                  icon: Icons.numbers_rounded,
                  isRequired: true,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPremiumDateField(
                  label: 'تاريخ الفاتورة',
                  icon: Icons.calendar_today_rounded,
                  value: _invoiceDate,
                  isRequired: true,
                  onTap: _pickInvoiceDate,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeePreviewCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.shade50, Colors.green.shade100],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.green.shade300),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.green.shade500,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.calculate_rounded,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'رسوم التصدير المتوقعة',
                  style: TextStyle(
                    fontSize: 12,
                    fontFamily: 'Cairo',
                    color: Colors.green.shade700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_calculateFeePreview().toStringAsFixed(0)} جنيه مصري',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                    color: Colors.green.shade800,
                  ),
                ),
                Text(
                  '(10% من القيمة، الحد الأدنى 3,500 جنيه)',
                  style: TextStyle(
                    fontSize: 10,
                    fontFamily: 'Cairo',
                    color: Colors.green.shade600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumTextField({
    required TextEditingController controller,
    required String label,
    required String placeholder,
    required IconData icon,
    TextInputType? keyboardType,
    bool isRequired = false,
    int maxLines = 1,
    Function(String)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
                fontFamily: 'Cairo',
              ),
            ),
            if (isRequired)
              Text(
                ' *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.red.shade600,
                  fontFamily: 'Cairo',
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: TextField(
            controller: controller,
            textAlign: TextAlign.right,
            textDirection: TextDirection.rtl,
            keyboardType: keyboardType,
            maxLines: maxLines,
            style: const TextStyle(
              fontSize: 15,
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w500,
            ),
            onChanged: onChanged,
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: TextStyle(
                color: Colors.grey.shade400,
                fontSize: 14,
                fontFamily: 'Cairo',
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              suffixIcon: Icon(icon, color: Colors.grey.shade400, size: 22),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumDropdownField({
    required String label,
    required IconData icon,
    required String? value,
    required List<String> items,
    required Function(String?) onChanged,
    bool isRequired = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
                fontFamily: 'Cairo',
              ),
            ),
            if (isRequired)
              Text(
                ' *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.red.shade600,
                  fontFamily: 'Cairo',
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: DropdownButtonFormField<String>(
            value: value,
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16),
            ),
            style: const TextStyle(
              fontSize: 14,
              fontFamily: 'Cairo',
              color: Colors.black,
            ),
            hint: Text(
              'اختر...',
              style: TextStyle(
                color: Colors.grey.shade400,
                fontFamily: 'Cairo',
              ),
            ),
            isExpanded: true,
            items:
                items.map((item) {
                  return DropdownMenuItem<String>(
                    value: item,
                    child: Text(item),
                  );
                }).toList(),
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumDateField({
    required String label,
    required IconData icon,
    required DateTime? value,
    required VoidCallback onTap,
    bool isRequired = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
                fontFamily: 'Cairo',
              ),
            ),
            if (isRequired)
              Text(
                ' *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.red.shade600,
                  fontFamily: 'Cairo',
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value != null
                        ? DateFormat('yyyy/MM/dd').format(value)
                        : 'اختر التاريخ',
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: 'Cairo',
                      color:
                          value != null ? Colors.black : Colors.grey.shade400,
                    ),
                  ),
                ),
                Icon(icon, color: Colors.grey.shade400, size: 20),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumSubmitButton() {
    return Container(
      width: double.infinity,
      height: 64,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors:
              _isSubmitting
                  ? [Colors.grey.shade400, Colors.grey.shade500]
                  : [primaryDark, primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow:
            _isSubmitting
                ? []
                : [
                  BoxShadow(
                    color: primaryDark.withValues(alpha: 0.45),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
      ),
      child: ElevatedButton(
        onPressed: _isSubmitting ? null : _submitRequest,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        child:
            _isSubmitting
                ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Text(
                      'جاري إرسال الطلب...',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                )
                : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.send_rounded, size: 22),
                    ),
                    const SizedBox(width: 14),
                    const Text(
                      'إرسال طلب UCR',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
      ),
    );
  }

  Widget _buildHeader({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [primaryDark, primaryDark.withOpacity(0.8)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: Colors.white, size: 36),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryDark.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: primaryDark, size: 20),
          ),
          const SizedBox(width: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
              color: primaryDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShippingMethodToggle() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Expanded(child: _buildShippingButton('جوي', 'air', Icons.flight)),
            const SizedBox(width: 4),
            Expanded(
              child: _buildShippingButton('بحري', 'sea', Icons.directions_boat),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShippingButton(String label, String value, IconData icon) {
    final isSelected = _shippingMethod == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _shippingMethod = value;
          // Reset container data when switching
          _containerWeights.clear();
          _containersCountController.clear();
          _seaShipmentType = 'fcl';
          _packagesCountController.clear();
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 56,
        decoration: BoxDecoration(
          gradient:
              isSelected
                  ? LinearGradient(
                    colors: [primaryDark, primaryDark.withOpacity(0.8)],
                  )
                  : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow:
              isSelected
                  ? [
                    BoxShadow(
                      color: primaryDark.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ]
                  : null,
        ),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : Colors.grey[600],
                size: 22,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey[700],
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDestinationSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 12),
          // Country Dropdown
          _buildDropdownField(
            label: 'بلد الوجهة *',
            icon: Icons.public,
            value:
                _destinationCountryController.text.isEmpty
                    ? null
                    : _destinationCountryController.text,
            items: _countries,
            onChanged: (value) {
              setState(() {
                _destinationCountryController.text = value ?? '';
              });
            },
          ),
          const SizedBox(height: 16),
          // Port
          _buildTextField(
            controller: _destinationPortController,
            label: 'الميناء / المطار *',
            placeholder: 'أدخل اسم الميناء أو المطار',
            icon: Icons.anchor,
          ),
        ],
      ),
    );
  }

  Widget _buildGoodsInfoSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 12),
          // General Description (larger field)
          _buildTextField(
            controller: _generalDescriptionController,
            label: 'الوصف العام للبضاعة *',
            placeholder: 'وصف تفصيلي للبضاعة المراد تصديرها',
            icon: Icons.description,
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          // Total Weight with unit
          Row(
            children: [
              Expanded(
                flex: 2,
                child: _buildTextField(
                  controller: _totalWeightController,
                  label: 'الوزن الإجمالي *',
                  placeholder: '500',
                  icon: Icons.scale,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDropdownField(
                  label: 'وحدة الوزن',
                  icon: Icons.straighten,
                  value: _generalWeightUnit == 'kilograms' ? 'كيلوجرام' : 'طن',
                  items: const ['كيلوجرام', 'طن'],
                  onChanged: (value) {
                    setState(() {
                      _generalWeightUnit = value == 'طن' ? 'tons' : 'kilograms';
                    });
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Sea Shipment Type Selection (only for sea)
          if (_shippingMethod == 'sea') ...[
            _buildSeaShipmentTypeSelector(),
            const SizedBox(height: 16),
          ],

          // Packages Count - only show when needed
          if (_needsPackagesCount) ...[
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _packagesCountController,
                    label: 'عدد الطرود *',
                    placeholder: '10',
                    icon: Icons.inventory,
                    keyboardType: TextInputType.number,
                  ),
                ),
                if (_shippingMethod == 'sea') ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _quantityController,
                      label: 'الكمية',
                      placeholder: '100',
                      icon: Icons.production_quantity_limits,
                      keyboardType: TextInputType.number,
                      isRequired: false,
                    ),
                  ),
                ],
              ],
            ),
          ],

          // Containers Section (only for sea + FCL)
          if (_shippingMethod == 'sea' && _seaShipmentType == 'fcl') ...[
            const SizedBox(height: 16),
            _buildContainersSection(),
          ],
        ],
      ),
    );
  }

  Widget _buildSeaShipmentTypeSelector() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.directions_boat,
                color: Colors.blue.shade700,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'نوع الشحنة البحرية *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                  color: Colors.blue.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              // FCL Option
              Expanded(
                child: _buildSeaTypeOption(
                  type: 'fcl',
                  title: 'حاويات',
                  subtitle: 'FCL',
                  description: 'حاوية كاملة أو أكثر',
                  icon: Icons.directions_boat,
                ),
              ),
              const SizedBox(width: 8),
              // LCL Option
              Expanded(
                child: _buildSeaTypeOption(
                  type: 'lcl',
                  title: 'بضايع عامة',
                  subtitle: 'LCL',
                  description: 'أقل من حاوية كاملة',
                  icon: Icons.inventory_2,
                ),
              ),
              const SizedBox(width: 8),
              // Parcels Option
              Expanded(
                child: _buildSeaTypeOption(
                  type: 'parcels',
                  title: 'طرود',
                  subtitle: '',
                  description: 'بضاعة منفصلة',
                  icon: Icons.local_shipping,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSeaTypeOption({
    required String type,
    required String title,
    required String subtitle,
    required String description,
    required IconData icon,
  }) {
    final isSelected = _seaShipmentType == type;
    return GestureDetector(
      onTap: () {
        setState(() {
          _seaShipmentType = type;
          // Reset containers when switching type
          if (type != 'fcl') {
            _containerWeights.clear();
            _containersCountController.clear();
          }
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue.shade100 : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.blue.shade500 : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.blue.shade700 : Colors.grey.shade500,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
                color: isSelected ? Colors.blue.shade800 : Colors.grey.shade700,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle.isNotEmpty)
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Cairo',
                  color: Colors.blue.shade600,
                ),
              ),
            Text(
              description,
              style: TextStyle(
                fontSize: 8,
                fontFamily: 'Cairo',
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
            if (isSelected)
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: Colors.blue.shade500,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 12),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildContainersSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _containersCountController,
                  label: 'عدد الحاويات *',
                  placeholder: '2',
                  icon: Icons.view_in_ar,
                  keyboardType: TextInputType.number,
                  onChanged: (value) {
                    _updateContainerWeights();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  controller: _quantityController,
                  label: 'الكمية الإجمالية',
                  placeholder: '100',
                  icon: Icons.production_quantity_limits,
                  keyboardType: TextInputType.number,
                  isRequired: false,
                ),
              ),
            ],
          ),
          // Container Details
          if (_containerWeights.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'تفاصيل الحاويات',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color: Colors.blue.shade800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._containerWeights.asMap().entries.map((entry) {
                    final index = entry.key;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _buildContainerWeightRow(index),
                    );
                  }).toList(),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInvoiceSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 12),
          // Info text
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.lightbulb_outline,
                  color: Colors.blue.shade600,
                  size: 20,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'بيانات الفاتورة التجارية الأصلية المُصدرة للمستورد',
                    style: TextStyle(
                      fontSize: 11,
                      fontFamily: 'Cairo',
                      color: Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _valueInEGPController,
            label: 'القيمة بالجنيه المصري *',
            placeholder: '50,000',
            icon: Icons.attach_money,
            keyboardType: TextInputType.number,
            onChanged: (value) {
              setState(() {}); // Rebuild to update fee preview
            },
          ),
          // Fee Preview for Noran Certified
          if (_certificationType == 'noran' &&
              _valueInEGPController.text.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.green.shade300),
              ),
              child: Row(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: Colors.green.shade500,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'رسوم التصدير المتوقعة: ${_calculateFeePreview().toStringAsFixed(0)} جنيه مصري',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Colors.green.shade800,
                          ),
                        ),
                        Text(
                          '(10% من القيمة، الحد الأدنى 3,500 جنيه)',
                          style: TextStyle(
                            fontSize: 10,
                            fontFamily: 'Cairo',
                            color: Colors.green.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _invoiceNumberController,
                  label: 'رقم الفاتورة الأصلية *',
                  placeholder: 'INV-2025-001',
                  icon: Icons.numbers,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDateField(
                  label: 'تاريخ الفاتورة *',
                  icon: Icons.calendar_today,
                  value: _invoiceDate,
                  onTap: _pickInvoiceDate,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContainerWeightRow(int index) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.blue.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'الحاوية ${index + 1}',
            style: TextStyle(
              fontSize: 13,
              fontFamily: 'Cairo',
              fontWeight: FontWeight.bold,
              color: Colors.blue.shade800,
            ),
          ),
          const SizedBox(height: 10),
          // Row 1: Container Number and Size
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextFormField(
                  key: ValueKey('container_number_$index'),
                  initialValue:
                      _containerWeights[index]['containerNumber']?.toString() ??
                      '',
                  decoration: InputDecoration(
                    labelText: 'رقم الحاوية',
                    labelStyle: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                    hintText: 'CONT-001',
                    hintStyle: TextStyle(fontSize: 11, color: Colors.grey[400]),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  style: const TextStyle(fontSize: 12, fontFamily: 'Cairo'),
                  onChanged: (value) {
                    _containerWeights[index]['containerNumber'] = value;
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _containerWeights[index]['size'] ?? '20ft',
                  decoration: InputDecoration(
                    labelText: 'مقاس الحاوية',
                    labelStyle: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 8,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  style: const TextStyle(
                    fontSize: 11,
                    fontFamily: 'Cairo',
                    color: Colors.black,
                  ),
                  items: const [
                    DropdownMenuItem(value: '20ft', child: Text('20 قدم')),
                    DropdownMenuItem(value: '40ft', child: Text('40 قدم')),
                    DropdownMenuItem(value: '40ft-hc', child: Text('40 HC')),
                    DropdownMenuItem(value: '45ft', child: Text('45 قدم')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _containerWeights[index]['size'] = value;
                    });
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Row 2: Weight and Unit
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  key: ValueKey('container_weight_$index'),
                  initialValue:
                      _containerWeights[index]['weight']?.toString() ?? '',
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'الوزن',
                    labelStyle: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                    hintText: '0',
                    hintStyle: TextStyle(fontSize: 11, color: Colors.grey[400]),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  style: const TextStyle(fontSize: 12, fontFamily: 'Cairo'),
                  onChanged: (value) {
                    _containerWeights[index]['weight'] =
                        double.tryParse(value) ?? 0.0;
                  },
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 100,
                child: DropdownButtonFormField<String>(
                  value: _containerWeights[index]['unit'] ?? 'kilograms',
                  decoration: InputDecoration(
                    labelText: 'الوحدة',
                    labelStyle: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 8,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  style: const TextStyle(
                    fontSize: 11,
                    fontFamily: 'Cairo',
                    color: Colors.black,
                  ),
                  items: const [
                    DropdownMenuItem(value: 'kilograms', child: Text('كجم')),
                    DropdownMenuItem(value: 'tons', child: Text('طن')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _containerWeights[index]['unit'] = value;
                    });
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _updateContainerWeights() {
    final count = int.tryParse(_containersCountController.text) ?? 0;
    setState(() {
      if (count > _containerWeights.length) {
        for (var i = _containerWeights.length; i < count; i++) {
          _containerWeights.add({
            'containerNumber': '',
            'size': '20ft',
            'weight': 0.0,
            'unit': 'kilograms',
          });
        }
      } else if (count < _containerWeights.length) {
        _containerWeights = _containerWeights.sublist(0, count);
      }
    });
  }

  Widget _buildItemsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Info text - First item is required
          _buildInfoTip(
            'البند الأول مطلوب - يمكنك إضافة بنود إضافية اختيارياً',
            Icons.info_outline_rounded,
          ),
          const SizedBox(height: 16),
          // First item (required) - always show
          if (_items.isEmpty)
            _buildFirstItemCard()
          else
            ..._items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return _buildItemCard(index, item);
            }).toList(),
          // Add more items button
          if (_items.isNotEmpty) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                _addItem();
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      accent.withValues(alpha: 0.1),
                      accent.withValues(alpha: 0.05),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: accent.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.add_rounded, color: accent, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'إضافة بند إضافي (اختياري)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                        color: accent,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFirstItemCard() {
    // Initialize first item if empty
    if (_items.isEmpty) {
      _items.add({
        'description': '',
        'hsCode': '',
        'quantity': null,
        'weight': null,
        'value': null,
        'unit': '',
      });
    }
    return _buildItemCard(0, _items[0]);
  }

  Widget _buildItemCard(int index, Map<String, dynamic> item) {
    final isFirstItem = index == 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isFirstItem ? Colors.red.shade50 : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isFirstItem ? Colors.red.shade200 : Colors.grey[300]!,
          width: isFirstItem ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    'البند ${index + 1}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color: primaryDark,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color:
                          isFirstItem
                              ? Colors.red.shade600
                              : Colors.grey.shade400,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      isFirstItem ? 'مطلوب' : 'اختياري',
                      style: const TextStyle(
                        fontSize: 10,
                        fontFamily: 'Cairo',
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              if (!isFirstItem)
                IconButton(
                  onPressed: () => _removeItem(index),
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  iconSize: 20,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
            ],
          ),
          const Divider(),
          _buildItemTextField(
            index,
            'description',
            isFirstItem ? 'وصف الصنف *' : 'وصف الصنف',
            Icons.description,
            isRequired: isFirstItem,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildItemTextField(
                  index,
                  'hsCode',
                  'البند الجمركي (HS Code)',
                  Icons.qr_code,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildItemTextField(
                  index,
                  'quantity',
                  isFirstItem ? 'الكمية *' : 'الكمية',
                  Icons.numbers,
                  isNumber: true,
                  isRequired: isFirstItem,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildItemTextField(
                  index,
                  'weight',
                  'الوزن',
                  Icons.scale,
                  isNumber: true,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildItemTextField(
                  index,
                  'value',
                  isFirstItem ? 'القيمة *' : 'القيمة',
                  Icons.attach_money,
                  isNumber: true,
                  isRequired: isFirstItem,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildItemTextField(
                  index,
                  'unit',
                  isFirstItem ? 'الوحدة *' : 'الوحدة',
                  Icons.straighten,
                  isRequired: isFirstItem,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildItemTextField(
    int index,
    String key,
    String label,
    IconData icon, {
    bool isNumber = false,
    bool isRequired = false,
  }) {
    // Get initial value
    final initialValue = _items[index][key]?.toString() ?? '';

    return TextFormField(
      key: ValueKey('item_${index}_$key'),
      initialValue: initialValue,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(fontSize: 11, color: Colors.grey[600]),
        prefixIcon: Icon(icon, size: 16, color: Colors.grey[500]),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        filled: true,
        fillColor: Colors.white,
      ),
      style: const TextStyle(fontSize: 12, fontFamily: 'Cairo'),
      onChanged: (value) {
        if (isNumber) {
          _items[index][key] = value.isEmpty ? null : double.tryParse(value);
        } else {
          _items[index][key] = value.isEmpty ? '' : value;
        }
      },
    );
  }

  void _addItem() {
    setState(() {
      _items.add({
        'description': '',
        'hsCode': '',
        'quantity': null,
        'weight': null,
        'value': null,
        'unit': '',
      });
    });
  }

  void _removeItem(int index) {
    // Don't allow removing first item
    if (index == 0 && _items.length == 1) return;
    setState(() {
      _items.removeAt(index);
    });
  }

  Widget _buildDocumentsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Info text
          _buildInfoTip(
            'المستند الأول مطلوب - المستندات الإضافية اختيارية',
            Icons.attach_file_rounded,
          ),
          const SizedBox(height: 16),
          // Certification Type Badge
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  (_certificationType == 'noran' ? Colors.green : Colors.orange)
                      .withValues(alpha: 0.1),
                  (_certificationType == 'noran' ? Colors.green : Colors.orange)
                      .withValues(alpha: 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: (_certificationType == 'noran'
                        ? Colors.green
                        : Colors.orange)
                    .withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color:
                        _certificationType == 'noran'
                            ? Colors.green.shade500
                            : Colors.orange.shade500,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _certificationType == 'noran'
                        ? Icons.business_center_rounded
                        : Icons.person_rounded,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  _certificationType == 'noran'
                      ? 'شهادة النوران'
                      : 'شهادتك الخاصة',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                    color:
                        _certificationType == 'noran'
                            ? Colors.green.shade800
                            : Colors.orange.shade800,
                  ),
                ),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 10),
                  width: 1,
                  height: 20,
                  color: Colors.grey.shade300,
                ),
                Icon(
                  _shippingMethod == 'air'
                      ? Icons.flight_rounded
                      : Icons.directions_boat_rounded,
                  color: Colors.grey.shade600,
                  size: 18,
                ),
                const SizedBox(width: 6),
                Text(
                  _shippingMethod == 'air' ? 'شحن جوي' : 'شحن بحري',
                  style: TextStyle(
                    fontSize: 13,
                    fontFamily: 'Cairo',
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Documents list
          ..._requiredDocuments.asMap().entries.map((entry) {
            final index = entry.key;
            final doc = entry.value;
            final key = doc['key']!;
            final name = doc['name']!;
            final isUploaded = _uploadedDocuments.containsKey(key);
            final isRequired = index == 0; // First document is required
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildDocumentUploadCard(
                key,
                name,
                isUploaded,
                isRequired: isRequired,
              ),
            );
          }).toList(),
          // Upload Progress Summary
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'المستندات المرفوعة: ${_uploadedDocuments.length} من ${_requiredDocuments.length}',
                      style: TextStyle(
                        fontSize: 12,
                        fontFamily: 'Cairo',
                        color: Colors.grey.shade700,
                      ),
                    ),
                    Row(
                      children:
                          _requiredDocuments.asMap().entries.map((entry) {
                            final index = entry.key;
                            final doc = entry.value;
                            final isUploaded = _uploadedDocuments.containsKey(
                              doc['key'],
                            );
                            return Container(
                              width: 12,
                              height: 12,
                              margin: const EdgeInsets.only(left: 4),
                              decoration: BoxDecoration(
                                color:
                                    isUploaded
                                        ? Colors.green.shade500
                                        : (index == 0
                                            ? Colors.red.shade400
                                            : Colors.grey.shade300),
                                shape: BoxShape.circle,
                              ),
                            );
                          }).toList(),
                    ),
                  ],
                ),
                if (_uploadedDocuments.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: Colors.green.shade600,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'تم رفع المستند المطلوب',
                        style: TextStyle(
                          fontSize: 11,
                          fontFamily: 'Cairo',
                          color: Colors.green.shade700,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentUploadCard(
    String key,
    String name,
    bool isUploaded, {
    bool isRequired = false,
  }) {
    final description = _getDocumentDescription(key);
    return GestureDetector(
      onTap: () {
        if (isUploaded) {
          _showDocumentOptions(key, name);
        } else {
          _pickAndUploadDocument(key, name);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color:
              isUploaded
                  ? Colors.green.shade50
                  : (isRequired ? Colors.red.shade50 : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color:
                isUploaded
                    ? Colors.green
                    : (isRequired ? Colors.red.shade200 : Colors.grey[300]!),
            width: isUploaded || isRequired ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            // Status indicator with number
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color:
                    isUploaded
                        ? Colors.green
                        : (isRequired
                            ? Colors.red.shade600
                            : Colors.grey.shade400),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child:
                    isUploaded
                        ? const Icon(Icons.check, color: Colors.white, size: 20)
                        : Text(
                          '${_requiredDocuments.indexWhere((d) => d['key'] == key) + 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color:
                                isUploaded
                                    ? Colors.green.shade700
                                    : Colors.black87,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color:
                              isRequired
                                  ? Colors.red.shade600
                                  : Colors.grey.shade400,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isRequired ? 'مطلوب' : 'اختياري',
                          style: const TextStyle(
                            fontSize: 9,
                            fontFamily: 'Cairo',
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (description.isNotEmpty && !isUploaded)
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 10,
                        fontFamily: 'Cairo',
                        color: Colors.grey[500],
                      ),
                    ),
                  if (isUploaded && _uploadedDocuments[key] != null)
                    Text(
                      _uploadedDocuments[key]!['fileName'] ?? 'تم الرفع',
                      style: TextStyle(
                        fontSize: 11,
                        fontFamily: 'Cairo',
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            if (isUploaded)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.edit, color: Colors.orange[600], size: 18),
                  const SizedBox(width: 8),
                  Icon(Icons.visibility, color: Colors.blue[600], size: 18),
                ],
              )
            else
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.upload_file,
                  color: Colors.grey[500],
                  size: 20,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showDocumentOptions(String key, String name) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: primaryDark,
                        ),
                      ),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.visibility, color: Colors.blue),
                      ),
                      title: const Text(
                        'عرض المستند',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      onTap: () {
                        Navigator.pop(context);
                        _viewDocument(key);
                      },
                    ),
                    ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.edit, color: Colors.orange),
                      ),
                      title: const Text(
                        'تعديل المستند',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      onTap: () {
                        Navigator.pop(context);
                        _pickAndUploadDocument(key, name);
                      },
                    ),
                    ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.delete_outline,
                          color: Colors.red,
                        ),
                      ),
                      title: const Text(
                        'حذف المستند',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w600,
                          color: Colors.red,
                        ),
                      ),
                      onTap: () {
                        Navigator.pop(context);
                        _deleteDocument(key, name);
                      },
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ),
    );
  }

  Future<void> _viewDocument(String key) async {
    final doc = _uploadedDocuments[key];
    if (doc == null) {
      AlNoranPopups.showInfo(
        context: context,
        title: 'عرض المستند',
        message: 'لا يمكن عرض المستند حالياً',
      );
      return;
    }

    final uploadId = doc['uploadId'];
    final fileName = doc['fileName'] ?? 'المستند';

    if (uploadId == null || uploadId == 'uploaded') {
      AlNoranPopups.showInfo(
        context: context,
        title: fileName,
        message:
            'تم رفع المستند بنجاح ✓\nيمكنك تعديله أو حذفه من خلال الخيارات',
      );
      return;
    }

    try {
      // Get upload details from backend
      final uploadDetails = await ApiService.getUploadDetails(uploadId);

      if (uploadDetails['success'] != true) {
        AlNoranPopups.showError(
          context: context,
          message: 'تعذر الحصول على معلومات المستند',
        );
        return;
      }

      final uploadData = uploadDetails['upload'] ?? uploadDetails['data'];
      final url = uploadData?['url']?.toString();
      final mimetype = uploadData?['mimetype']?.toString() ?? '';

      if (url == null || url.isEmpty) {
        AlNoranPopups.showError(
          context: context,
          message: 'رابط المستند غير متوفر',
        );
        return;
      }

      print('📄 [UCR ViewDocument] Opening: $url');
      print('📄 [UCR ViewDocument] Mimetype: $mimetype');

      // If it's an image, show in full screen viewer
      if (mimetype.contains('image')) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => _ImageViewerPage(imageUrl: url, title: fileName),
          ),
        );
      }
      // For PDF or other documents, open in external application
      else {
        try {
          final uri = Uri.parse(url);
          print('📄 [UCR ViewDocument] Opening in external app: $uri');

          // Use external application for PDF - works better on mobile
          bool launched = await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );

          if (!launched) {
            // Fallback to platform default
            launched = await launchUrl(uri);
          }

          if (!launched) {
            throw Exception('Failed to launch URL');
          }

          print('📄 [UCR ViewDocument] Document opened successfully');
        } catch (e) {
          print('❌ [UCR ViewDocument] Launch error: $e');
          AlNoranPopups.showError(
            context: context,
            message: 'تعذر فتح المستند',
          );
        }
      }
    } catch (e) {
      print('❌ [UCR ViewDocument] Error: $e');
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ في فتح المستند',
      );
    }
  }

  void _deleteDocument(String key, String name) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder:
          (dialogContext) => Directionality(
            textDirection: TextDirection.rtl,
            child: Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
              elevation: 0,
              backgroundColor: Colors.transparent,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(25),
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
                    // Header with warning icon
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.red.shade700, Colors.red.shade600],
                        ),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(25),
                          topRight: Radius.circular(25),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.warning_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 16),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'حذف المستند',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'هذا الإجراء لا يمكن التراجع عنه',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 13,
                                    color: Colors.white70,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Content
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          // Document name badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.red.shade200),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.description,
                                  size: 18,
                                  color: Colors.red.shade700,
                                ),
                                const SizedBox(width: 8),
                                Flexible(
                                  child: Text(
                                    name,
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.red.shade700,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'هل أنت متأكد من حذف هذا المستند؟',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 16,
                              color: Colors.grey[700],
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Delete button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                Navigator.pop(dialogContext);
                                setState(() {
                                  _uploadedDocuments.remove(key);
                                });
                                AlNoranPopups.showSuccess(
                                  context: context,
                                  message: 'تم حذف المستند',
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red.shade600,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(
                                Icons.delete_outline,
                                color: Colors.white,
                              ),
                              label: const Text(
                                'نعم، احذف المستند',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Cancel button
                    Padding(
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                      child: SizedBox(
                        width: double.infinity,
                        child: TextButton(
                          onPressed: () => Navigator.pop(dialogContext),
                          child: Text(
                            'إلغاء',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
    );
  }

  Widget _buildNotesSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildPremiumTextField(
            controller: _notesController,
            label: 'ملاحظات إضافية',
            placeholder: 'أضف أي ملاحظات أو تعليمات خاصة بالطلب...',
            icon: Icons.edit_note_rounded,
            maxLines: 3,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String placeholder,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    bool isRequired = true,
    Function(String)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: primaryDark, size: 16),
            const SizedBox(width: 6),
            Text(
              label.replaceAll(' *', ''),
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: primaryDark,
                fontFamily: 'Cairo',
              ),
            ),
            if (isRequired && label.contains('*'))
              const Text(
                ' *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                  fontFamily: 'Cairo',
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            textAlign: TextAlign.right,
            textDirection: TextDirection.rtl,
            keyboardType: keyboardType,
            maxLines: maxLines,
            style: const TextStyle(
              fontSize: 14,
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w500,
            ),
            onChanged: onChanged,
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: TextStyle(
                color: Colors.grey[400],
                fontSize: 13,
                fontFamily: 'Cairo',
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required IconData icon,
    required String? value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: primaryDark, size: 16),
            const SizedBox(width: 6),
            Text(
              label.replaceAll(' *', ''),
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: primaryDark,
                fontFamily: 'Cairo',
              ),
            ),
            if (label.contains('*'))
              const Text(
                ' *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                  fontFamily: 'Cairo',
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: DropdownButtonFormField<String>(
            value: value,
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16),
            ),
            style: const TextStyle(
              fontSize: 14,
              fontFamily: 'Cairo',
              color: Colors.black,
            ),
            hint: Text(
              'اختر...',
              style: TextStyle(color: Colors.grey[400], fontFamily: 'Cairo'),
            ),
            isExpanded: true,
            items:
                items.map((item) {
                  return DropdownMenuItem<String>(
                    value: item,
                    child: Text(item),
                  );
                }).toList(),
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }

  Widget _buildDateField({
    required String label,
    required IconData icon,
    required DateTime? value,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: primaryDark, size: 16),
            const SizedBox(width: 6),
            Text(
              label.replaceAll(' *', ''),
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: primaryDark,
                fontFamily: 'Cairo',
              ),
            ),
            if (label.contains('*'))
              const Text(
                ' *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                  fontFamily: 'Cairo',
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value != null
                        ? DateFormat('yyyy/MM/dd').format(value)
                        : 'اختر التاريخ',
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: 'Cairo',
                      color: value != null ? Colors.black : Colors.grey[400],
                    ),
                  ),
                ),
                Icon(Icons.calendar_today, color: Colors.grey[400], size: 20),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _pickInvoiceDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _invoiceDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      locale: const Locale('ar'),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: primaryDark, // Header background color
              onPrimary: Colors.white, // Header text color
              onSurface: Colors.black87, // Body text color
              surface: Colors.white, // Background color
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                foregroundColor: primaryDark, // Button text color
              ),
            ),
            dialogTheme: DialogThemeData(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
          child: Directionality(
            textDirection: TextDirection.rtl,
            child: child!,
          ),
        );
      },
    );
    if (date != null) {
      setState(() {
        _invoiceDate = date;
      });
    }
  }

  Future<void> _pickAndUploadDocument(String key, String name) async {
    try {
      final result = await FilePickerHelper.pickFile(context);

      if (result == null) return;

      if (mounted) {
        AlNoranPopups.showLoading(
          context: context,
          message: 'جاري رفع $name...',
        );
      }

      // Map to valid backend enum value
      final validDocType = _mapDocumentKeyToEnum(key);
      print('📤 [UCR Upload] Key: $key -> Type: $validDocType');

      final uploadResult = await ApiService.uploadFile(
        filePath: result.path,
        category: 'ucr_request',
        documentType: validDocType,
      );

      if (mounted) {
        context.pop();

        if (uploadResult['success'] == true) {
          final upload = uploadResult['upload'] ?? uploadResult['data'];
          final uploadId = upload?['_id'] ?? upload?['id'];

          String fileName = result.path.split('/').last;
          if (fileName.contains('\\')) {
            fileName = fileName.split('\\').last;
          }

          setState(() {
            _uploadedDocuments[key] = {
              'uploadId': uploadId?.toString(),
              'fileName': fileName,
            };
          });

          AlNoranPopups.showSuccess(
            context: context,
            message: 'تم رفع $name بنجاح',
          );
        } else {
          AlNoranPopups.showError(
            context: context,
            message: uploadResult['message'] ?? 'فشل رفع الملف',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        try {
          context.pop();
        } catch (_) {}
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء رفع الملف',
        );
      }
      print('❌ Upload error: $e');
    }
  }

  Widget _buildSubmitButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        width: double.infinity,
        height: 60,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors:
                _isSubmitting
                    ? [Colors.grey, Colors.grey.shade400]
                    : [primaryDark, primaryDark.withOpacity(0.8)],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow:
              _isSubmitting
                  ? []
                  : [
                    BoxShadow(
                      color: primaryDark.withOpacity(0.4),
                      blurRadius: 15,
                      offset: const Offset(0, 6),
                    ),
                  ],
        ),
        child: ElevatedButton(
          onPressed: _isSubmitting ? null : _submitRequest,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            foregroundColor: Colors.white,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child:
              _isSubmitting
                  ? const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2.5,
                        ),
                      ),
                      SizedBox(width: 12),
                      Text(
                        'جاري الإرسال...',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  )
                  : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'إرسال الطلب',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                      SizedBox(width: 12),
                      Icon(Icons.send, size: 22),
                    ],
                  ),
        ),
      ),
    );
  }

  Future<void> _submitRequest() async {
    // Check document verification first
    if (!_canSubmitRequests) {
      HapticFeedback.mediumImpact();
      _showDocumentRequiredDialog();
      return;
    }

    // ==========================================
    // COMPREHENSIVE VALIDATION (matching web)
    // ==========================================

    // 1. Basic required fields
    if (_generalDescriptionController.text.trim().isEmpty) {
      HapticFeedback.mediumImpact();
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء إدخال وصف البضاعة',
      );
      return;
    }

    if (_totalWeightController.text.trim().isEmpty) {
      HapticFeedback.mediumImpact();
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء إدخال الوزن الكلي',
      );
      return;
    }

    // packagesCount is required only for air shipments, sea parcels, or sea LCL
    if (_needsPackagesCount && _packagesCountController.text.trim().isEmpty) {
      HapticFeedback.mediumImpact();
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء إدخال عدد الطرود',
      );
      return;
    }

    if (_valueInEGPController.text.trim().isEmpty) {
      HapticFeedback.mediumImpact();
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء إدخال قيمة الشحنة بالجنيه المصري',
      );
      return;
    }

    if (_invoiceNumberController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء إدخال رقم الفاتورة',
      );
      return;
    }

    if (_invoiceDate == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء اختيار تاريخ الفاتورة',
      );
      return;
    }

    if (_destinationCountryController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء اختيار بلد الوجهة',
      );
      return;
    }

    if (_destinationPortController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء إدخال الميناء أو المطار',
      );
      return;
    }

    // 2. Numeric validations - no negative numbers
    final totalWeight =
        double.tryParse(_totalWeightController.text.trim()) ?? 0;
    final packagesCount =
        int.tryParse(_packagesCountController.text.trim()) ?? 0;
    final valueInEGP =
        double.tryParse(
          _valueInEGPController.text.trim().replaceAll(',', ''),
        ) ??
        0;

    if (totalWeight <= 0) {
      AlNoranPopups.showError(
        context: context,
        message: 'الوزن الكلي يجب أن يكون رقم موجب أكبر من صفر',
      );
      return;
    }

    if (totalWeight > 1000000) {
      AlNoranPopups.showError(
        context: context,
        message: 'الوزن الكلي يبدو كبيرًا جدًا. الرجاء التحقق من القيمة',
      );
      return;
    }

    // Validate packagesCount only when required
    if (_needsPackagesCount) {
      if (packagesCount <= 0) {
        AlNoranPopups.showError(
          context: context,
          message: 'عدد الطرود يجب أن يكون رقم صحيح موجب',
        );
        return;
      }

      if (packagesCount > 10000) {
        AlNoranPopups.showError(
          context: context,
          message: 'عدد الطرود يبدو كبيرًا جدًا. الرجاء التحقق من القيمة',
        );
        return;
      }
    }

    if (valueInEGP <= 0) {
      AlNoranPopups.showError(
        context: context,
        message: 'قيمة الشحنة يجب أن تكون رقم موجب أكبر من صفر',
      );
      return;
    }

    if (valueInEGP > 100000000000) {
      AlNoranPopups.showError(
        context: context,
        message: 'قيمة الشحنة تبدو كبيرة جدًا. الرجاء التحقق من القيمة',
      );
      return;
    }

    // 3. Invoice date validation - not future date
    final today = DateTime.now();
    if (_invoiceDate!.isAfter(
      DateTime(today.year, today.month, today.day, 23, 59, 59),
    )) {
      AlNoranPopups.showError(
        context: context,
        message: 'تاريخ الفاتورة لا يمكن أن يكون في المستقبل',
      );
      return;
    }

    // 4. Sea shipment specific validations
    if (_shippingMethod == 'sea' && _seaShipmentType == 'fcl') {
      final containersCount =
          int.tryParse(_containersCountController.text.trim()) ?? 0;
      if (containersCount <= 0) {
        AlNoranPopups.showError(
          context: context,
          message: 'الرجاء إدخال عدد الحاويات للشحن البحري',
        );
        return;
      }
      if (containersCount > 500) {
        AlNoranPopups.showError(
          context: context,
          message: 'عدد الحاويات يبدو كبيرًا جدًا. الرجاء التحقق',
        );
        return;
      }

      // Validate container weights
      final validContainers =
          _containerWeights
              .where((c) => c['containerNumber']?.toString().isNotEmpty == true)
              .toList();
      for (final container in validContainers) {
        final cWeight = (container['weight'] as num?)?.toDouble() ?? 0;
        if (cWeight < 0) {
          AlNoranPopups.showError(
            context: context,
            message:
                'وزن الحاوية ${container['containerNumber']} لا يمكن أن يكون سالبًا',
          );
          return;
        }
        if (cWeight > 50000) {
          AlNoranPopups.showError(
            context: context,
            message:
                'وزن الحاوية ${container['containerNumber']} يبدو كبيرًا جدًا',
          );
          return;
        }
      }
    }

    // 5. Items validation - First item is required
    if (_items.isEmpty ||
        _items[0]['description']?.toString().trim().isEmpty == true) {
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء إدخال وصف البند الأول على الأقل',
      );
      return;
    }

    // Validate first item has required fields
    final firstItem = _items[0];
    if (firstItem['quantity'] == null ||
        firstItem['value'] == null ||
        firstItem['unit']?.toString().isEmpty == true) {
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء ملء الكمية والقيمة والوحدة للبند الأول',
      );
      return;
    }

    // Validate all items with descriptions
    double totalItemsWeight = 0;
    double totalItemsValue = 0;
    final validItemsForCheck =
        _items
            .where(
              (item) =>
                  item['description']?.toString().trim().isNotEmpty == true,
            )
            .toList();

    for (int i = 0; i < validItemsForCheck.length; i++) {
      final item = validItemsForCheck[i];
      final itemNum = i + 1;

      // Check for negative values
      final itemQty = (item['quantity'] as num?)?.toDouble() ?? 0;
      final itemWeight = (item['weight'] as num?)?.toDouble() ?? 0;
      final itemValue = (item['value'] as num?)?.toDouble() ?? 0;

      if (itemQty < 0) {
        AlNoranPopups.showError(
          context: context,
          message: 'كمية البند $itemNum لا يمكن أن تكون سالبة',
        );
        return;
      }

      if (itemWeight < 0) {
        AlNoranPopups.showError(
          context: context,
          message: 'وزن البند $itemNum لا يمكن أن يكون سالبًا',
        );
        return;
      }

      if (itemValue < 0) {
        AlNoranPopups.showError(
          context: context,
          message: 'قيمة البند $itemNum لا يمكن أن تكون سالبة',
        );
        return;
      }

      // Sum weights and values for cross-validation
      if (itemWeight > 0) totalItemsWeight += itemWeight;
      if (itemValue > 0) totalItemsValue += itemValue;

      // HS Code validation (if provided)
      final hsCode = item['hsCode']?.toString().trim() ?? '';
      if (hsCode.isNotEmpty) {
        final hsCodeClean = hsCode.replaceAll('.', '');
        final hsCodePattern = RegExp(r'^[0-9]{4,10}$');
        if (!hsCodePattern.hasMatch(hsCodeClean)) {
          AlNoranPopups.showError(
            context: context,
            message:
                'البند الجمركي للبند $itemNum يجب أن يكون من 4 إلى 10 أرقام',
          );
          return;
        }
      }
    }

    // 6. Cross-validation: Items weight vs total weight
    if (totalItemsWeight > 0 && totalItemsWeight > totalWeight * 1.1) {
      AlNoranPopups.showError(
        context: context,
        message:
            'مجموع أوزان البنود (${totalItemsWeight.toStringAsFixed(0)} كجم) أكبر من الوزن الكلي (${totalWeight.toStringAsFixed(0)} كجم)',
      );
      return;
    }

    // 7. Cross-validation: Items value vs total value (allow 20% margin)
    if (totalItemsValue > 0 && totalItemsValue > valueInEGP * 1.2) {
      AlNoranPopups.showError(
        context: context,
        message:
            'مجموع قيم البنود أكبر بكثير من القيمة الإجمالية. الرجاء التحقق',
      );
      return;
    }

    // 8. Document validation - At least first document required
    if (_uploadedDocuments.isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'الرجاء رفع المستند الأول على الأقل',
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // Prepare upload IDs
      final uploadIds =
          _uploadedDocuments.values
              .where(
                (doc) =>
                    doc['uploadId'] != null && doc['uploadId'] != 'uploaded',
              )
              .map((doc) => doc['uploadId'])
              .toList();

      // Prepare items (filter out empty ones)
      final validItems =
          _items
              .where(
                (item) => item['description']?.toString().isNotEmpty == true,
              )
              .map(
                (item) => {
                  'description': item['description'],
                  'hsCode': item['hsCode'],
                  'quantity': item['quantity'],
                  'weight': item['weight'],
                  'value': item['value'],
                  'unit': item['unit'],
                },
              )
              .toList();

      // Prepare request data
      final requestData = <String, dynamic>{
        'certificationType': _certificationType,
        'shippingMethod': _shippingMethod,
        'destinationCountry': _destinationCountryController.text.trim(),
        'destinationPort': _destinationPortController.text.trim(),
        'generalDescription': _generalDescriptionController.text.trim(),
        'totalWeight': totalWeight,
        'weightUnit': _generalWeightUnit,
        'valueInEGP': valueInEGP,
        'originalInvoiceNumber': _invoiceNumberController.text.trim(),
        'invoiceDate': _invoiceDate!.toIso8601String(),
        'uploads': uploadIds,
        'items': validItems,
        'clientNotes': _notesController.text.trim(),
      };

      // Add packages count if needed
      if (_needsPackagesCount) {
        requestData['packagesCount'] = packagesCount;
      }

      // Add sea shipment fields
      if (_shippingMethod == 'sea') {
        requestData['seaShipmentType'] = _seaShipmentType;

        if (_quantityController.text.trim().isNotEmpty) {
          requestData['quantity'] = double.tryParse(
            _quantityController.text.trim(),
          );
        }

        if (_seaShipmentType == 'fcl') {
          requestData['containersCount'] = int.tryParse(
            _containersCountController.text.trim(),
          );

          // Include container weights with size
          requestData['containerWeights'] =
              _containerWeights
                  .where(
                    (c) => c['containerNumber']?.toString().isNotEmpty == true,
                  )
                  .map(
                    (c) => {
                      'containerNumber': c['containerNumber'],
                      'size': c['size'] ?? '20ft',
                      'weight': c['weight'],
                      'unit': c['unit'] ?? 'kilograms',
                    },
                  )
                  .toList();
        }
      }

      print('📤 [UCR] Submitting request: $requestData');

      HapticFeedback.lightImpact();
      final result = await ApiService.createUcrRequest(requestData);

      if (mounted) {
        if (result['success'] == true) {
          HapticFeedback.heavyImpact();
          // Refresh notifications to update badge count
          NotificationService().refresh();

          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم بنجاح',
            message: 'تم إرسال طلب UCR بنجاح\nسيتم التواصل معك قريباً',
          );

          // Go back to home
          context.go('/home');
        } else {
          HapticFeedback.mediumImpact();
          AlNoranPopups.showError(
            context: context,
            message: result['message'] ?? 'فشل إرسال الطلب',
          );
        }
      }
    } catch (e) {
      print('❌ [UCR] Submit error: $e');
      HapticFeedback.mediumImpact();
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء إرسال الطلب',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}

// Image Viewer Page for full-screen image viewing
class _ImageViewerPage extends StatelessWidget {
  final String imageUrl;
  final String title;

  const _ImageViewerPage({required this.imageUrl, required this.title});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black87,
          elevation: 0,
          automaticallyImplyLeading: false,
          title: Text(
            title,
            style: const TextStyle(
              fontFamily: 'Cairo',
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          centerTitle: true,
          actions: [
            Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
                tooltip: 'إغلاق',
              ),
            ),
          ],
        ),
        body: Center(
          child: InteractiveViewer(
            minScale: 0.5,
            maxScale: 4.0,
            child: Image.network(
              imageUrl,
              fit: BoxFit.contain,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        value:
                            loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                    loadingProgress.expectedTotalBytes!
                                : null,
                        color: Colors.white,
                        strokeWidth: 3,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'جاري تحميل الصورة...',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.error_outline,
                          color: Colors.white,
                          size: 64,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'فشل تحميل الصورة',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'تحقق من اتصال الإنترنت',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        bottomNavigationBar: Container(
          color: Colors.black87,
          padding: const EdgeInsets.all(12),
          child: SafeArea(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.zoom_in,
                  color: Colors.white.withOpacity(0.7),
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'اسحب بإصبعين للتكبير والتصغير',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
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
