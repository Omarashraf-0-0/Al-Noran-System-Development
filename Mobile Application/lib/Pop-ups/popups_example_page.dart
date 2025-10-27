import 'package:flutter/material.dart';
import '../Pop-ups/al_noran_popups.dart';

/// صفحة توضيحية لكل أنواع الـ Pop-ups
/// استخدمها كمرجع عند الحاجة
class PopupsExamplePage extends StatelessWidget {
  const PopupsExamplePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'أمثلة على Pop-ups',
            style: TextStyle(fontFamily: 'Cairo'),
          ),
          backgroundColor: const Color(0xFF690000),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Dialogs (نوافذ منبثقة)',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(height: 16),

              // Success Dialog
              _buildExampleButton(
                context: context,
                title: '✅ نجاح',
                onPressed: () {
                  AlNoranPopups.showSuccess(
                    context: context,
                    title: 'تم بنجاح!',
                    message: 'تمت العملية بنجاح ويمكنك المتابعة الآن',
                    buttonText: 'رائع',
                  );
                },
              ),

              const SizedBox(height: 12),

              // Error Dialog
              _buildExampleButton(
                context: context,
                title: '❌ خطأ',
                onPressed: () {
                  AlNoranPopups.showError(
                    context: context,
                    title: 'حدث خطأ!',
                    message:
                        'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى',
                  );
                },
              ),

              const SizedBox(height: 12),

              // Warning Dialog
              _buildExampleButton(
                context: context,
                title: '⚠️ تحذير',
                onPressed: () {
                  AlNoranPopups.showWarning(
                    context: context,
                    title: 'انتبه!',
                    message: 'هذا الإجراء قد يؤثر على بياناتك. هل أنت متأكد؟',
                  );
                },
              ),

              const SizedBox(height: 12),

              // Info Dialog
              _buildExampleButton(
                context: context,
                title: 'ℹ️ معلومة',
                onPressed: () {
                  AlNoranPopups.showInfo(
                    context: context,
                    title: 'معلومة مهمة',
                    message:
                        'يمكنك استخدام هذا الخيار لعرض معلومات إضافية للمستخدم',
                  );
                },
              ),

              const SizedBox(height: 12),

              // Confirmation Dialog
              _buildExampleButton(
                context: context,
                title: '❓ تأكيد',
                onPressed: () async {
                  final confirmed = await AlNoranPopups.showConfirmation(
                    context: context,
                    title: 'تأكيد الحذف',
                    message:
                        'هل أنت متأكد من رغبتك في حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء',
                    confirmText: 'نعم، احذف',
                    cancelText: 'إلغاء',
                  );

                  if (confirmed) {
                    AlNoranPopups.showSnackBar(
                      context: context,
                      message: 'تم التأكيد',
                      type: PopupType.success,
                    );
                  } else {
                    AlNoranPopups.showSnackBar(
                      context: context,
                      message: 'تم الإلغاء',
                      type: PopupType.info,
                    );
                  }
                },
              ),

              const SizedBox(height: 12),

              // Loading Dialog
              _buildExampleButton(
                context: context,
                title: '⏳ تحميل',
                onPressed: () {
                  AlNoranPopups.showLoading(
                    context: context,
                    message: 'جاري التحميل...',
                  );

                  // إخفاء بعد 3 ثواني
                  Future.delayed(const Duration(seconds: 3), () {
                    AlNoranPopups.hideLoading(context);
                    AlNoranPopups.showSnackBar(
                      context: context,
                      message: 'اكتمل التحميل!',
                      type: PopupType.success,
                    );
                  });
                },
              ),

              const SizedBox(height: 32),

              const Text(
                'SnackBars (رسائل سريعة)',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(height: 16),

              // Success SnackBar
              _buildExampleButton(
                context: context,
                title: '✅ SnackBar نجاح',
                onPressed: () {
                  AlNoranPopups.showSnackBar(
                    context: context,
                    message: 'تمت العملية بنجاح!',
                    type: PopupType.success,
                  );
                },
              ),

              const SizedBox(height: 12),

              // Error SnackBar
              _buildExampleButton(
                context: context,
                title: '❌ SnackBar خطأ',
                onPressed: () {
                  AlNoranPopups.showSnackBar(
                    context: context,
                    message: 'حدث خطأ، يرجى المحاولة مرة أخرى',
                    type: PopupType.error,
                  );
                },
              ),

              const SizedBox(height: 12),

              // Warning SnackBar
              _buildExampleButton(
                context: context,
                title: '⚠️ SnackBar تحذير',
                onPressed: () {
                  AlNoranPopups.showSnackBar(
                    context: context,
                    message: 'تحذير: اقترب حسابك من الحد الأقصى',
                    type: PopupType.warning,
                    duration: const Duration(seconds: 5),
                  );
                },
              ),

              const SizedBox(height: 12),

              // Info SnackBar
              _buildExampleButton(
                context: context,
                title: 'ℹ️ SnackBar معلومة',
                onPressed: () {
                  AlNoranPopups.showSnackBar(
                    context: context,
                    message: 'لديك 3 إشعارات جديدة',
                    type: PopupType.info,
                  );
                },
              ),

              const SizedBox(height: 32),

              const Text(
                'أمثلة عملية',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(height: 16),

              // Login Example
              _buildExampleButton(
                context: context,
                title: '🔐 مثال تسجيل دخول ناجح',
                onPressed: () async {
                  // عرض التحميل
                  AlNoranPopups.showLoading(
                    context: context,
                    message: 'جاري تسجيل الدخول...',
                  );

                  // محاكاة API call
                  await Future.delayed(const Duration(seconds: 2));

                  // إخفاء التحميل
                  AlNoranPopups.hideLoading(context);

                  // عرض النجاح
                  await AlNoranPopups.showSuccess(
                    context: context,
                    title: 'مرحباً بك!',
                    message: 'تم تسجيل الدخول بنجاح',
                    buttonText: 'المتابعة',
                  );
                },
              ),

              const SizedBox(height: 12),

              // Delete Example
              _buildExampleButton(
                context: context,
                title: '🗑️ مثال حذف عنصر',
                onPressed: () async {
                  // طلب التأكيد
                  final confirmed = await AlNoranPopups.showConfirmation(
                    context: context,
                    title: 'تأكيد الحذف',
                    message: 'هل أنت متأكد من حذف هذا العنصر؟',
                    confirmText: 'حذف',
                    cancelText: 'إلغاء',
                  );

                  if (confirmed) {
                    // عرض التحميل
                    AlNoranPopups.showLoading(
                      context: context,
                      message: 'جاري الحذف...',
                    );

                    // محاكاة API call
                    await Future.delayed(const Duration(seconds: 1));

                    // إخفاء التحميل
                    AlNoranPopups.hideLoading(context);

                    // عرض رسالة سريعة
                    AlNoranPopups.showSnackBar(
                      context: context,
                      message: 'تم الحذف بنجاح',
                      type: PopupType.success,
                    );
                  }
                },
              ),

              const SizedBox(height: 12),

              // Error Example
              _buildExampleButton(
                context: context,
                title: '⚠️ مثال خطأ في الاتصال',
                onPressed: () async {
                  AlNoranPopups.showLoading(
                    context: context,
                    message: 'جاري الاتصال...',
                  );

                  await Future.delayed(const Duration(seconds: 2));

                  AlNoranPopups.hideLoading(context);

                  await AlNoranPopups.showError(
                    context: context,
                    title: 'خطأ في الاتصال',
                    message:
                        'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى',
                    buttonText: 'حسناً',
                  );
                },
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExampleButton({
    required BuildContext context,
    required String title,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 50,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF690000),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontFamily: 'Cairo',
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
