import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:url_launcher/url_launcher.dart';
import '../../core/network/api_service.dart';
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

class _UcrRequestPageState extends State<UcrRequestPage> {
  // Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFFA40000);
  static const Color accent = Color(0xFF1BA3B6);

  // Current step: 0 = اختيار نوع الشهادة, 1 = ملء البيانات
  int _currentStep = 0;

  // Certification type: 'noran' = على بطاقة الشركة, 'client' = على بطاقتي
  String? _certificationType;

  // Shipping method: 'air' = جوي, 'sea' = بحري
  String _shippingMethod = 'sea';

  // State
  bool _isSubmitting = false;

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
  void dispose() {
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

  // Map document key to valid backend enum value
  String _mapDocumentKeyToEnum(String key) {
    final mappings = {
      'bank_waiver': 'other', // التنازل البنكي
      'original_invoice': 'invoice', // الفاتورة الأصلية
      'packing_list': 'other', // كشف العبوة
      'shipping_permit': 'other', // إذن الشحن
      'awb': 'bill_of_lading', // بوليصة الشحن الجوي
      'bl': 'bill_of_lading', // بوليصة الشحن البحري
    };
    return mappings[key] ?? 'other';
  }

  // Get required documents based on certification type and shipping method
  List<Map<String, String>> get _requiredDocuments {
    if (_certificationType == 'noran') {
      // على بطاقة الشركة - نفس المستندات للجوي والبحري
      return [
        {'key': 'bank_waiver', 'name': 'التنازل البنكي'},
        {'key': 'original_invoice', 'name': 'الفاتورة الأصلية'},
        {'key': 'packing_list', 'name': 'كشف العبوة'},
      ];
    } else {
      // على بطاقتي الخاصة
      if (_shippingMethod == 'air') {
        return [
          {'key': 'original_invoice', 'name': 'الفاتورة الأصلية'},
          {'key': 'shipping_permit', 'name': 'إذن الشحن'},
          {'key': 'awb', 'name': 'بوليصة الشحن الجوي (AWB)'},
        ];
      } else {
        return [
          {'key': 'original_invoice', 'name': 'الفاتورة الأصلية'},
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
        // If on step 1, go back to step 0
        setState(() {
          _currentStep = 0;
        });
      },
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          backgroundColor: const Color(0xFFF5F5F5),
          body: Column(
            children: [
              UnifiedTopBar(
                showBackButton: true,
                showMenu: false,
                onBackPressed:
                    _currentStep == 0
                        ? null
                        : () {
                          setState(() {
                            _currentStep = 0;
                          });
                        },
              ),
              Expanded(
                child:
                    _currentStep == 0
                        ? _buildCertificationTypeSelection()
                        : _buildDataEntryForm(),
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
      child: Column(
        children: [
          const SizedBox(height: 24),

          // Header
          _buildHeader(
            icon: Icons.assignment_outlined,
            title: 'طلب رقم UCR',
            subtitle: 'اختر نوع الشهادة للتصدير',
          ),

          const SizedBox(height: 32),

          // Title
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Icon(Icons.check_circle_outline, color: primaryDark, size: 24),
                SizedBox(width: 8),
                Text(
                  'نوع الشهادة',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                    color: primaryDark,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Option 1: على بطاقة الشركة (النوران)
          _buildCertificationOption(
            type: 'noran',
            title: 'على بطاقة الشركة',
            subtitle: 'النوران تتولى المستندات',
            note: 'رسوم 10%',
            icon: Icons.business,
            color: Colors.green,
            isSelected: _certificationType == 'noran',
          ),

          const SizedBox(height: 16),

          // Option 2: على بطاقتي الخاصة
          _buildCertificationOption(
            type: 'client',
            title: 'على بطاقتي الخاصة',
            subtitle: 'أنت توفر المستندات',
            note: 'بدون رسوم 10%',
            icon: Icons.person,
            color: Colors.orange,
            isSelected: _certificationType == 'client',
          ),

          const SizedBox(height: 40),

          // Continue Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed:
                    _certificationType != null
                        ? () {
                          setState(() {
                            _currentStep = 1;
                          });
                        }
                        : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryDark,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey[300],
                  disabledForegroundColor: Colors.grey[600],
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: _certificationType != null ? 4 : 0,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'متابعة',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    SizedBox(width: 8),
                    Icon(Icons.arrow_back, size: 20),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 32),
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
      child: Column(
        children: [
          const SizedBox(height: 24),

          // Header
          _buildHeader(
            icon: Icons.edit_document,
            title: 'طلب رقم UCR',
            subtitle:
                _certificationType == 'noran'
                    ? 'على بطاقة الشركة (النوران)'
                    : 'على بطاقتي الخاصة',
          ),

          const SizedBox(height: 24),

          // Shipping Method Toggle
          _buildShippingMethodToggle(),

          const SizedBox(height: 24),

          // Destination Section
          _buildSectionTitle('الوجهة', Icons.location_on),
          _buildDestinationSection(),

          const SizedBox(height: 24),

          // Goods Info Section
          _buildSectionTitle('بيانات البضاعة الأساسية', Icons.inventory_2),
          _buildGoodsInfoSection(),

          const SizedBox(height: 24),

          // Invoice Section
          _buildSectionTitle('بيانات الفاتورة', Icons.receipt),
          _buildInvoiceSection(),

          // Sea Shipment Section (only for sea)
          if (_shippingMethod == 'sea') ...[
            const SizedBox(height: 24),
            _buildSectionTitle('بيانات الشحن البحري', Icons.directions_boat),
            _buildSeaShipmentSection(),
          ],

          const SizedBox(height: 24),

          // Items Section (Optional)
          _buildSectionTitle('تفاصيل البنود (اختياري)', Icons.list_alt),
          _buildItemsSection(),

          const SizedBox(height: 24),

          // Documents Section
          _buildSectionTitle('المستندات المطلوبة', Icons.attach_file),
          _buildDocumentsSection(),

          const SizedBox(height: 24),

          // Notes Section (Optional)
          _buildSectionTitle('ملاحظات إضافية (اختياري)', Icons.note),
          _buildNotesSection(),

          const SizedBox(height: 32),

          // Submit Button
          _buildSubmitButton(),

          const SizedBox(height: 32),
        ],
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
            placeholder: 'اكتب وصفاً تفصيلياً للبضاعة',
            icon: Icons.description,
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _totalWeightController,
                  label: 'الوزن الإجمالي (كجم) *',
                  placeholder: '100',
                  icon: Icons.scale,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  controller: _packagesCountController,
                  label: 'عدد الطرود *',
                  placeholder: '10',
                  icon: Icons.inventory,
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
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
          _buildTextField(
            controller: _valueInEGPController,
            label: 'القيمة بالجنيه المصري *',
            placeholder: '50000',
            icon: Icons.attach_money,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _invoiceNumberController,
                  label: 'رقم الفاتورة الأصلية *',
                  placeholder: 'INV-2024-001',
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

  Widget _buildSeaShipmentSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _quantityController,
                  label: 'الكمية',
                  placeholder: '100',
                  icon: Icons.production_quantity_limits,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDropdownField(
                  label: 'وحدة الوزن',
                  icon: Icons.straighten,
                  value: _weightUnit,
                  items: const ['كيلوجرام', 'طن'],
                  onChanged: (value) {
                    setState(() {
                      _weightUnit = value ?? 'كيلوجرام';
                    });
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _containersCountController,
            label: 'عدد الحاويات *',
            placeholder: '2',
            icon: Icons.view_in_ar,
            keyboardType: TextInputType.number,
            onChanged: (value) {
              _updateContainerWeights();
            },
          ),
          const SizedBox(height: 16),
          // Container weights
          if (_containerWeights.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'أوزان الحاويات',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color: primaryDark,
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

  Widget _buildContainerWeightRow(int index) {
    return Row(
      children: [
        Text(
          'حاوية ${index + 1}',
          style: const TextStyle(
            fontSize: 12,
            fontFamily: 'Cairo',
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 2,
          child: TextField(
            decoration: InputDecoration(
              hintText: 'رقم الحاوية',
              hintStyle: TextStyle(fontSize: 12, color: Colors.grey[400]),
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
            ),
            style: const TextStyle(fontSize: 12, fontFamily: 'Cairo'),
            onChanged: (value) {
              _containerWeights[index]['containerNumber'] = value;
            },
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: TextField(
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              hintText: 'الوزن',
              hintStyle: TextStyle(fontSize: 12, color: Colors.grey[400]),
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
          width: 80,
          child: DropdownButtonFormField<String>(
            value: _containerWeights[index]['unit'] ?? 'كيلوجرام',
            decoration: InputDecoration(
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
            ),
            style: const TextStyle(
              fontSize: 11,
              fontFamily: 'Cairo',
              color: Colors.black,
            ),
            items: const [
              DropdownMenuItem(value: 'كيلوجرام', child: Text('كجم')),
              DropdownMenuItem(value: 'طن', child: Text('طن')),
            ],
            onChanged: (value) {
              setState(() {
                _containerWeights[index]['unit'] = value;
              });
            },
          ),
        ),
      ],
    );
  }

  void _updateContainerWeights() {
    final count = int.tryParse(_containersCountController.text) ?? 0;
    setState(() {
      if (count > _containerWeights.length) {
        for (var i = _containerWeights.length; i < count; i++) {
          _containerWeights.add({
            'containerNumber': '',
            'weight': 0.0,
            'unit': 'كيلوجرام',
          });
        }
      } else if (count < _containerWeights.length) {
        _containerWeights = _containerWeights.sublist(0, count);
      }
    });
  }

  Widget _buildItemsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 12),
          // Add item button
          GestureDetector(
            onTap: _addItem,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: accent.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: accent.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_circle_outline, color: accent),
                  const SizedBox(width: 8),
                  Text(
                    'إضافة بند جديد',
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
          // Items list
          if (_items.isNotEmpty) ...[
            const SizedBox(height: 16),
            ..._items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return _buildItemCard(index, item);
            }).toList(),
          ],
        ],
      ),
    );
  }

  Widget _buildItemCard(int index, Map<String, dynamic> item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
            'وصف الصنف *',
            Icons.description,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildItemTextField(
                  index,
                  'hsCode',
                  'كود البند الجمركي',
                  Icons.qr_code,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildItemTextField(
                  index,
                  'quantity',
                  'الكمية',
                  Icons.numbers,
                  isNumber: true,
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
                  'القيمة',
                  Icons.attach_money,
                  isNumber: true,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildItemTextField(
                  index,
                  'unit',
                  'الوحدة',
                  Icons.straighten,
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
  }) {
    return TextField(
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
      ),
      style: const TextStyle(fontSize: 12, fontFamily: 'Cairo'),
      onChanged: (value) {
        if (isNumber) {
          _items[index][key] = double.tryParse(value);
        } else {
          _items[index][key] = value;
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
    setState(() {
      _items.removeAt(index);
    });
  }

  Widget _buildDocumentsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 12),
          ..._requiredDocuments.map((doc) {
            final key = doc['key']!;
            final name = doc['name']!;
            final isUploaded = _uploadedDocuments.containsKey(key);
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildDocumentUploadCard(key, name, isUploaded),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildDocumentUploadCard(String key, String name, bool isUploaded) {
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
          color: isUploaded ? Colors.green.shade50 : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isUploaded ? Colors.green : Colors.grey[300]!,
            width: isUploaded ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isUploaded ? Colors.green : accent,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isUploaded ? Icons.check : Icons.upload_file,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color:
                          isUploaded ? Colors.green.shade700 : Colors.black87,
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
              Icon(Icons.upload_file, color: Colors.grey[400], size: 20),
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
      // For PDF or other documents, use in-app web view
      else {
        try {
          final uri = Uri.parse(url);
          bool launched = await launchUrl(uri, mode: LaunchMode.inAppWebView);

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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 12),
          _buildTextField(
            controller: _notesController,
            label: 'ملاحظات',
            placeholder: 'أضف أي ملاحظات إضافية...',
            icon: Icons.edit_note,
            maxLines: 3,
            isRequired: false,
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
            dialogTheme: DialogTheme(
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
    // Validate required fields
    if (_destinationCountryController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى اختيار بلد الوجهة',
      );
      return;
    }
    if (_destinationPortController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى إدخال الميناء/المطار',
      );
      return;
    }
    if (_generalDescriptionController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى إدخال وصف البضاعة',
      );
      return;
    }
    if (_totalWeightController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى إدخال الوزن الإجمالي',
      );
      return;
    }
    if (_packagesCountController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى إدخال عدد الطرود',
      );
      return;
    }
    if (_valueInEGPController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى إدخال القيمة بالجنيه',
      );
      return;
    }
    if (_invoiceNumberController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى إدخال رقم الفاتورة',
      );
      return;
    }
    if (_invoiceDate == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى اختيار تاريخ الفاتورة',
      );
      return;
    }

    // Validate sea shipment containers
    if (_shippingMethod == 'sea') {
      if (_containersCountController.text.trim().isEmpty) {
        AlNoranPopups.showError(
          context: context,
          message: 'يرجى إدخال عدد الحاويات',
        );
        return;
      }
    }

    // Validate required documents
    for (var doc in _requiredDocuments) {
      if (!_uploadedDocuments.containsKey(doc['key'])) {
        AlNoranPopups.showError(
          context: context,
          message: 'يرجى رفع ${doc['name']}',
        );
        return;
      }
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
      final requestData = {
        'certificationType': _certificationType,
        'shippingMethod': _shippingMethod,
        'destinationCountry': _destinationCountryController.text.trim(),
        'destinationPort': _destinationPortController.text.trim(),
        'generalDescription': _generalDescriptionController.text.trim(),
        'totalWeight': double.parse(_totalWeightController.text.trim()),
        'packagesCount': int.parse(_packagesCountController.text.trim()),
        'valueInEGP': double.parse(_valueInEGPController.text.trim()),
        'originalInvoiceNumber': _invoiceNumberController.text.trim(),
        'invoiceDate': _invoiceDate!.toIso8601String(),
        'uploads': uploadIds,
        'items': validItems,
        'clientNotes': _notesController.text.trim(),
      };

      // Add sea shipment fields
      if (_shippingMethod == 'sea') {
        requestData['quantity'] = double.tryParse(
          _quantityController.text.trim(),
        );
        requestData['weightUnit'] = _weightUnit == 'طن' ? 'tons' : 'kilograms';
        requestData['containersCount'] = int.parse(
          _containersCountController.text.trim(),
        );
        requestData['containerWeights'] =
            _containerWeights
                .where(
                  (c) => c['containerNumber']?.toString().isNotEmpty == true,
                )
                .map(
                  (c) => {
                    'containerNumber': c['containerNumber'],
                    'weight': c['weight'],
                    'unit': c['unit'] == 'طن' ? 'tons' : 'kilograms',
                  },
                )
                .toList();
      }

      print('📤 [UCR] Submitting request: $requestData');

      final result = await ApiService.createUcrRequest(requestData);

      if (mounted) {
        if (result['success'] == true) {
          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم بنجاح',
            message: 'تم إرسال طلب UCR بنجاح\nسيتم التواصل معك قريباً',
          );

          // Go back to home
          context.go('/home');
        } else {
          AlNoranPopups.showError(
            context: context,
            message: result['message'] ?? 'فشل إرسال الطلب',
          );
        }
      }
    } catch (e) {
      print('❌ [UCR] Submit error: $e');
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
