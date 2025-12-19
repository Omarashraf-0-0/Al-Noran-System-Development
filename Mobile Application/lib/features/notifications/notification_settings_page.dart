import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/unified_top_bar.dart';
import '../../theme/colors.dart';

/// صفحة إعدادات الإشعارات
class NotificationSettingsPage extends StatefulWidget {
  const NotificationSettingsPage({super.key});

  @override
  State<NotificationSettingsPage> createState() =>
      _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage> {
  bool _isLoading = true;
  bool _isSaving = false;

  // Settings
  bool _pushEnabled = true;
  bool _emailEnabled = true;
  bool _soundEnabled = true;

  // Category settings
  Map<String, bool> _categories = {
    'shipments': true,
    'acid': true,
    'ucr': true,
    'documents': true,
    'finance': true,
    'chat': true,
    'general': true,
  };

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() => _isLoading = true);

    try {
      final response = await ApiService.getNotificationSettings();
      if (response['success'] == true && response['settings'] != null) {
        final settings = response['settings'];
        setState(() {
          _pushEnabled = settings['pushEnabled'] ?? true;
          _emailEnabled = settings['emailEnabled'] ?? true;
          _soundEnabled = settings['soundEnabled'] ?? true;

          if (settings['categories'] != null) {
            final cats = settings['categories'] as Map<String, dynamic>;
            _categories = {
              'shipments': cats['shipments'] ?? true,
              'acid': cats['acid'] ?? true,
              'ucr': cats['ucr'] ?? true,
              'documents': cats['documents'] ?? true,
              'finance': cats['finance'] ?? true,
              'chat': cats['chat'] ?? true,
              'general': cats['general'] ?? true,
            };
          }
        });
      }
    } catch (e) {
      print('Error loading notification settings: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    setState(() => _isSaving = true);

    try {
      final response = await ApiService.updateNotificationSettings(
        pushEnabled: _pushEnabled,
        emailEnabled: _emailEnabled,
        soundEnabled: _soundEnabled,
        categories: _categories,
      );

      if (response['success'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'تم حفظ الإعدادات بنجاح',
              style: TextStyle(fontFamily: 'Cairo'),
            ),
            backgroundColor: AlNoranColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              response['message'] ?? 'فشل حفظ الإعدادات',
              style: const TextStyle(fontFamily: 'Cairo'),
            ),
            backgroundColor: AlNoranColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'حدث خطأ أثناء حفظ الإعدادات',
              style: TextStyle(fontFamily: 'Cairo'),
            ),
            backgroundColor: AlNoranColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AlNoranColors.greyBg,
        body: Column(
          children: [
            // Top Bar
            UnifiedTopBar(
              title: 'إعدادات الإشعارات',
              subtitle: 'تحكم في الإشعارات',
              showBackButton: true,
              showNotification: false,
              onBackPressed: () {
                if (GoRouter.of(context).canPop()) {
                  context.pop();
                } else {
                  context.go('/notifications');
                }
              },
            ),

            // Content
            Expanded(
              child:
                  _isLoading
                      ? const Center(
                        child: CircularProgressIndicator(
                          color: AlNoranColors.primary,
                        ),
                      )
                      : ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          // General Settings
                          _buildSectionCard(
                            title: 'الإعدادات العامة',
                            icon: Icons.settings,
                            children: [
                              _buildSwitchTile(
                                title: 'الإشعارات الفورية',
                                subtitle: 'استلام إشعارات على الهاتف',
                                icon: Icons.notifications_active,
                                value: _pushEnabled,
                                onChanged: (value) {
                                  setState(() => _pushEnabled = value);
                                },
                              ),
                              _buildDivider(),
                              _buildSwitchTile(
                                title: 'إشعارات البريد الإلكتروني',
                                subtitle: 'استلام إشعارات على الإيميل',
                                icon: Icons.email,
                                value: _emailEnabled,
                                onChanged: (value) {
                                  setState(() => _emailEnabled = value);
                                },
                              ),
                              _buildDivider(),
                              _buildSwitchTile(
                                title: 'الصوت',
                                subtitle: 'تشغيل صوت عند وصول إشعار',
                                icon: Icons.volume_up,
                                value: _soundEnabled,
                                onChanged: (value) {
                                  setState(() => _soundEnabled = value);
                                },
                              ),
                            ],
                          ),

                          const SizedBox(height: 16),

                          // Category Settings
                          _buildSectionCard(
                            title: 'الفئات',
                            icon: Icons.category,
                            children: [
                              _buildCategoryTile(
                                title: 'الشحنات',
                                subtitle: 'تحديثات الشحنات والتسليم',
                                icon: Icons.local_shipping,
                                category: 'shipments',
                              ),
                              _buildDivider(),
                              _buildCategoryTile(
                                title: 'طلبات ACID',
                                subtitle: 'تحديثات طلبات ACID',
                                icon: Icons.science,
                                category: 'acid',
                              ),
                              _buildDivider(),
                              _buildCategoryTile(
                                title: 'طلبات UCR/التصدير',
                                subtitle: 'تحديثات طلبات التصدير',
                                icon: Icons.description,
                                category: 'ucr',
                              ),
                              _buildDivider(),
                              _buildCategoryTile(
                                title: 'المستندات',
                                subtitle: 'تحديثات المستندات والوثائق',
                                icon: Icons.folder,
                                category: 'documents',
                              ),
                              _buildDivider(),
                              _buildCategoryTile(
                                title: 'المالية',
                                subtitle: 'الفواتير والمدفوعات',
                                icon: Icons.account_balance_wallet,
                                category: 'finance',
                              ),
                              _buildDivider(),
                              _buildCategoryTile(
                                title: 'الرسائل',
                                subtitle: 'رسائل الدعم والمحادثات',
                                icon: Icons.chat,
                                category: 'chat',
                              ),
                              _buildDivider(),
                              _buildCategoryTile(
                                title: 'إشعارات عامة',
                                subtitle: 'التحديثات والإعلانات',
                                icon: Icons.campaign,
                                category: 'general',
                              ),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // Save Button
                          SizedBox(
                            width: double.infinity,
                            height: 54,
                            child: ElevatedButton(
                              onPressed: _isSaving ? null : _saveSettings,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AlNoranColors.primary,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 2,
                              ),
                              child:
                                  _isSaving
                                      ? const SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2,
                                        ),
                                      )
                                      : const Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.save, color: Colors.white),
                                          SizedBox(width: 8),
                                          Text(
                                            'حفظ الإعدادات',
                                            style: TextStyle(
                                              fontFamily: 'Cairo',
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ],
                                      ),
                            ),
                          ),

                          const SizedBox(height: 32),
                        ],
                      ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AlNoranColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: AlNoranColors.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AlNoranColors.primary,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ...children,
        ],
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color:
                  value
                      ? AlNoranColors.success.withOpacity(0.1)
                      : Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: value ? AlNoranColors.success : Colors.grey,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AlNoranColors.success,
            activeTrackColor: AlNoranColors.success.withOpacity(0.3),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required String category,
  }) {
    final value = _categories[category] ?? true;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color:
                  value
                      ? AlNoranColors.info.withOpacity(0.1)
                      : Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: value ? AlNoranColors.info : Colors.grey,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: (newValue) {
              setState(() {
                _categories[category] = newValue;
              });
            },
            activeColor: AlNoranColors.info,
            activeTrackColor: AlNoranColors.info.withOpacity(0.3),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Divider(height: 1, color: Colors.grey.withOpacity(0.2)),
    );
  }
}
