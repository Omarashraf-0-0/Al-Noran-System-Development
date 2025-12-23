import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Premium Theme Colors for Image Viewer
class _ViewerColors {
  static const Color primary = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color gold = Color(0xFFD4AF37);
}

/// Premium Image Viewer - صفحة عرض الصور بشكل كامل مع تكبير/تصغير
class PremiumImageViewer extends StatefulWidget {
  /// رابط الصورة من الإنترنت
  final String? imageUrl;

  /// ملف الصورة المحلي
  final File? imageFile;

  /// عنوان الصورة
  final String title;

  /// إظهار زر التحميل
  final bool showDownloadButton;

  /// إظهار زر المشاركة
  final bool showShareButton;

  /// Callback عند الضغط على زر التحميل
  final VoidCallback? onDownload;

  /// Callback عند الضغط على زر المشاركة
  final VoidCallback? onShare;

  const PremiumImageViewer({
    super.key,
    this.imageUrl,
    this.imageFile,
    required this.title,
    this.showDownloadButton = false,
    this.showShareButton = false,
    this.onDownload,
    this.onShare,
  }) : assert(
         imageUrl != null || imageFile != null,
         'Either imageUrl or imageFile must be provided',
       );

  /// طريقة سهلة لفتح الـ viewer
  static void show({
    required BuildContext context,
    String? imageUrl,
    File? imageFile,
    required String title,
    bool showDownloadButton = false,
    bool showShareButton = false,
    VoidCallback? onDownload,
    VoidCallback? onShare,
  }) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        pageBuilder:
            (context, animation, secondaryAnimation) => PremiumImageViewer(
              imageUrl: imageUrl,
              imageFile: imageFile,
              title: title,
              showDownloadButton: showDownloadButton,
              showShareButton: showShareButton,
              onDownload: onDownload,
              onShare: onShare,
            ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: ScaleTransition(
              scale: Tween<double>(begin: 0.9, end: 1.0).animate(
                CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
              ),
              child: child,
            ),
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );
  }

  @override
  State<PremiumImageViewer> createState() => _PremiumImageViewerState();
}

class _PremiumImageViewerState extends State<PremiumImageViewer>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  final TransformationController _transformationController =
      TransformationController();
  bool _isLoading = true;
  bool _hasError = false;
  double _currentScale = 1.0;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _animationController.forward();

    // تغيير لون status bar
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    _transformationController.dispose();
    // إعادة لون status bar
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );
    super.dispose();
  }

  void _resetZoom() {
    _transformationController.value = Matrix4.identity();
    setState(() {
      _currentScale = 1.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.black,
        extendBodyBehindAppBar: true,
        appBar: _buildPremiumAppBar(),
        body: Stack(
          children: [
            // Image with zoom
            Center(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: InteractiveViewer(
                  transformationController: _transformationController,
                  minScale: 0.5,
                  maxScale: 5.0,
                  onInteractionUpdate: (details) {
                    setState(() {
                      _currentScale =
                          _transformationController.value.getMaxScaleOnAxis();
                    });
                  },
                  child: _buildImage(),
                ),
              ),
            ),

            // Bottom controls
            if (!_isLoading && !_hasError)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: _buildBottomControls(),
              ),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildPremiumAppBar() {
    return AppBar(
      backgroundColor: Colors.black.withOpacity(0.5),
      elevation: 0,
      automaticallyImplyLeading: false,
      flexibleSpace: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.black.withOpacity(0.8),
              Colors.black.withOpacity(0.4),
              Colors.transparent,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
      ),
      title: Row(
        children: [
          // Gold accent line
          Container(
            width: 3,
            height: 24,
            margin: const EdgeInsets.only(left: 12),
            decoration: BoxDecoration(
              color: _ViewerColors.gold,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Expanded(
            child: Text(
              widget.title,
              style: const TextStyle(
                fontFamily: 'Cairo',
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      centerTitle: false,
      actions: [
        // Share button
        if (widget.showShareButton)
          _buildActionButton(
            icon: Icons.share_rounded,
            onTap: widget.onShare,
            tooltip: 'مشاركة',
          ),

        // Download button
        if (widget.showDownloadButton)
          _buildActionButton(
            icon: Icons.download_rounded,
            onTap: widget.onDownload,
            tooltip: 'تحميل',
          ),

        // Close button
        _buildActionButton(
          icon: Icons.close_rounded,
          onTap: () => Navigator.pop(context),
          tooltip: 'إغلاق',
          isClose: true,
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    VoidCallback? onTap,
    required String tooltip,
    bool isClose = false,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      decoration: BoxDecoration(
        color:
            isClose
                ? Colors.white.withOpacity(0.15)
                : _ViewerColors.gold.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color:
              isClose
                  ? Colors.white.withOpacity(0.3)
                  : _ViewerColors.gold.withOpacity(0.5),
          width: 1,
        ),
      ),
      child: IconButton(
        icon: Icon(
          icon,
          color: isClose ? Colors.white : _ViewerColors.gold,
          size: 22,
        ),
        onPressed: onTap,
        tooltip: tooltip,
        splashRadius: 24,
      ),
    );
  }

  Widget _buildImage() {
    if (widget.imageFile != null) {
      return Image.file(
        widget.imageFile!,
        fit: BoxFit.contain,
        frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
          if (wasSynchronouslyLoaded || frame != null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                });
              }
            });
            return child;
          }
          return _buildLoadingWidget();
        },
        errorBuilder: (context, error, stackTrace) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {
                _hasError = true;
                _isLoading = false;
              });
            }
          });
          return _buildErrorWidget();
        },
      );
    }

    return Image.network(
      widget.imageUrl!,
      fit: BoxFit.contain,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
          });
          return child;
        }
        return _buildLoadingWidget(
          progress:
              loadingProgress.expectedTotalBytes != null
                  ? loadingProgress.cumulativeBytesLoaded /
                      loadingProgress.expectedTotalBytes!
                  : null,
        );
      },
      errorBuilder: (context, error, stackTrace) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            setState(() {
              _hasError = true;
              _isLoading = false;
            });
          }
        });
        return _buildErrorWidget();
      },
    );
  }

  Widget _buildLoadingWidget({double? progress}) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              // Outer progress
              SizedBox(
                width: 70,
                height: 70,
                child: CircularProgressIndicator(
                  value: progress,
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    _ViewerColors.gold,
                  ),
                  strokeWidth: 3,
                  backgroundColor: Colors.white.withOpacity(0.2),
                ),
              ),
              // Inner icon
              Container(
                width: 45,
                height: 45,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _ViewerColors.primary.withOpacity(0.8),
                      _ViewerColors.primaryLight.withOpacity(0.8),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.image_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'جاري تحميل الصورة...',
            style: TextStyle(
              fontFamily: 'Cairo',
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          if (progress != null) ...[
            const SizedBox(height: 8),
            Text(
              '${(progress * 100).toInt()}%',
              style: const TextStyle(
                fontFamily: 'Cairo',
                color: _ViewerColors.gold,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.broken_image_rounded,
              color: Colors.red,
              size: 48,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'فشل في تحميل الصورة',
            style: TextStyle(
              fontFamily: 'Cairo',
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'تأكد من اتصالك بالإنترنت',
            style: TextStyle(
              fontFamily: 'Cairo',
              color: Colors.white.withOpacity(0.6),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          TextButton.icon(
            onPressed: () {
              setState(() {
                _hasError = false;
                _isLoading = true;
              });
            },
            icon: const Icon(Icons.refresh_rounded, color: _ViewerColors.gold),
            label: const Text(
              'إعادة المحاولة',
              style: TextStyle(
                fontFamily: 'Cairo',
                color: _ViewerColors.gold,
                fontWeight: FontWeight.bold,
              ),
            ),
            style: TextButton.styleFrom(
              backgroundColor: _ViewerColors.gold.withOpacity(0.15),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: MediaQuery.of(context).padding.bottom + 16,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.transparent,
            Colors.black.withOpacity(0.4),
            Colors.black.withOpacity(0.8),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Zoom out button
          _buildZoomButton(
            icon: Icons.remove_rounded,
            onTap: () {
              final currentScale =
                  _transformationController.value.getMaxScaleOnAxis();
              if (currentScale > 0.5) {
                _transformationController.value =
                    Matrix4.identity()..scale(currentScale - 0.5);
                setState(() {
                  _currentScale = currentScale - 0.5;
                });
              }
            },
          ),

          // Zoom indicator
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _ViewerColors.gold.withOpacity(0.5),
                width: 1,
              ),
            ),
            child: Text(
              '${(_currentScale * 100).toInt()}%',
              style: const TextStyle(
                fontFamily: 'Cairo',
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          // Zoom in button
          _buildZoomButton(
            icon: Icons.add_rounded,
            onTap: () {
              final currentScale =
                  _transformationController.value.getMaxScaleOnAxis();
              if (currentScale < 5.0) {
                _transformationController.value =
                    Matrix4.identity()..scale(currentScale + 0.5);
                setState(() {
                  _currentScale = currentScale + 0.5;
                });
              }
            },
          ),

          const SizedBox(width: 24),

          // Reset zoom button
          _buildZoomButton(
            icon: Icons.fit_screen_rounded,
            onTap: _resetZoom,
            isReset: true,
          ),
        ],
      ),
    );
  }

  Widget _buildZoomButton({
    required IconData icon,
    required VoidCallback onTap,
    bool isReset = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient:
              isReset
                  ? const LinearGradient(
                    colors: [_ViewerColors.primary, _ViewerColors.primaryLight],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                  : null,
          color: isReset ? null : Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isReset ? _ViewerColors.gold : Colors.white.withOpacity(0.3),
            width: 1,
          ),
          boxShadow:
              isReset
                  ? [
                    BoxShadow(
                      color: _ViewerColors.primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ]
                  : null,
        ),
        child: Icon(
          icon,
          color: isReset ? Colors.white : Colors.white70,
          size: 22,
        ),
      ),
    );
  }
}

/// Premium Document Viewer - عارض المستندات (PDF placeholder)
/// ملاحظة: لعرض PDF فعلي، استخدم مكتبة مثل syncfusion_flutter_pdfviewer
class PremiumDocumentViewer extends StatelessWidget {
  final String documentUrl;
  final String title;
  final VoidCallback? onDownload;
  final VoidCallback? onShare;

  const PremiumDocumentViewer({
    super.key,
    required this.documentUrl,
    required this.title,
    this.onDownload,
    this.onShare,
  });

  static void show({
    required BuildContext context,
    required String documentUrl,
    required String title,
    VoidCallback? onDownload,
    VoidCallback? onShare,
  }) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder:
            (context) => PremiumDocumentViewer(
              documentUrl: documentUrl,
              title: title,
              onDownload: onDownload,
              onShare: onShare,
            ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFFAF9F7),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          automaticallyImplyLeading: false,
          flexibleSpace: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [_ViewerColors.primary, _ViewerColors.primaryLight],
                begin: Alignment.centerRight,
                end: Alignment.centerLeft,
              ),
            ),
          ),
          title: Row(
            children: [
              Container(
                width: 3,
                height: 24,
                margin: const EdgeInsets.only(left: 12),
                decoration: BoxDecoration(
                  color: _ViewerColors.gold,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          centerTitle: false,
          actions: [
            if (onShare != null)
              IconButton(
                icon: const Icon(Icons.share_rounded, color: Colors.white),
                onPressed: onShare,
                tooltip: 'مشاركة',
              ),
            if (onDownload != null)
              IconButton(
                icon: const Icon(Icons.download_rounded, color: Colors.white),
                onPressed: onDownload,
                tooltip: 'تحميل',
              ),
            Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
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
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // PDF Icon
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [_ViewerColors.primary, _ViewerColors.primaryLight],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: _ViewerColors.primary.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.picture_as_pdf_rounded,
                  color: Colors.white,
                  size: 64,
                ),
              ),
              const SizedBox(height: 24),
              Container(
                width: 50,
                height: 3,
                decoration: BoxDecoration(
                  color: _ViewerColors.gold,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'مستند PDF',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: _ViewerColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  'لعرض محتوى PDF، استخدم زر التحميل أدناه',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              if (onDownload != null)
                Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        _ViewerColors.primary,
                        _ViewerColors.primaryLight,
                      ],
                      begin: Alignment.centerRight,
                      end: Alignment.centerLeft,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: _ViewerColors.primary.withOpacity(0.4),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: ElevatedButton.icon(
                    onPressed: onDownload,
                    icon: const Icon(
                      Icons.download_rounded,
                      color: Colors.white,
                    ),
                    label: const Text(
                      'تحميل المستند',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
