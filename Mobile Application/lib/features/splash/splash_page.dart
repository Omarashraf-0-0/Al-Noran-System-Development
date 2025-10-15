import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:math' as math;
import '../auth/login_page.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _waveController;
  late AnimationController _shipController;
  late AnimationController _textController;
  late AnimationController _fadeOutController;

  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _textFade;
  late Animation<Offset> _textSlide;
  late Animation<double> _fadeOut;

  double _progress = 0.0;
  bool _showProgress = false;

  @override
  void initState() {
    super.initState();

    // Logo Animation - ظهور أنيق
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    );

    _logoScale = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.easeOutBack),
    );

    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    // Text Animation
    _textController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _textFade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _textController, curve: Curves.easeIn));

    _textSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _textController, curve: Curves.easeOut));

    // Wave Animation - أمواج البحر
    _waveController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat();

    // Ship Animation - سفينة متحركة
    _shipController = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    )..repeat();

    // Fade Out Animation للانتقال
    _fadeOutController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _fadeOut = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _fadeOutController, curve: Curves.easeInOut),
    );

    // بدء التسلسل
    _startAnimationSequence();
  }

  void _startAnimationSequence() async {
    await Future.delayed(const Duration(milliseconds: 400));
    _logoController.forward();

    await Future.delayed(const Duration(milliseconds: 800));
    _textController.forward();

    await Future.delayed(const Duration(milliseconds: 1000));
    setState(() => _showProgress = true);
    _simulateLoading();
  }

  void _simulateLoading() {
    Timer.periodic(const Duration(milliseconds: 50), (timer) {
      setState(() {
        _progress += 0.02;
        if (_progress >= 1.0) {
          timer.cancel();
          _navigateToHome();
        }
      });
    });
  }

  void _navigateToHome() async {
    // بدء انيميشن الاختفاء
    await _fadeOutController.forward();

    if (!mounted) return;

    // الانتقال مع Fade Transition
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) {
          // استيراد صفحة Login
          return FadeTransition(opacity: animation, child: _getLoginPage());
        },
        transitionDuration: const Duration(milliseconds: 800),
        reverseTransitionDuration: const Duration(milliseconds: 400),
      ),
    );
  }

  Widget _getLoginPage() {
    // هنا نستدعي صفحة الـ Login
    return const LoginPage();
  }

  @override
  void dispose() {
    _logoController.dispose();
    _waveController.dispose();
    _shipController.dispose();
    _textController.dispose();
    _fadeOutController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeOut,
      child: Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF690000), Color(0xFF8b0000), Color(0xFF690000)],
              stops: [0.0, 0.5, 1.0],
            ),
          ),
          child: Stack(
            children: [
              // Animated Waves (البحر) - في الخلفية بعيد
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Opacity(
                  opacity: 0.12,
                  child: SizedBox(
                    height: 150,
                    child: Stack(
                      children: List.generate(3, (index) => _buildWave(index)),
                    ),
                  ),
                ),
              ),

              // Moving Ship (سفينة) - خلفية
              _buildMovingShip(),

              // Main Content
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo - كبير وواضح
                    AnimatedBuilder(
                      animation: _logoController,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _logoScale.value,
                          child: Opacity(
                            opacity: _logoOpacity.value,
                            child: _buildLogo(),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 50),

                    // App Name
                    SlideTransition(
                      position: _textSlide,
                      child: FadeTransition(
                        opacity: _textFade,
                        child: Column(
                          children: [
                            const Text(
                              'نوران سمارت',
                              style: TextStyle(
                                fontSize: 44,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 2,
                                shadows: [
                                  Shadow(
                                    color: Color(0xFF1ba3b6),
                                    blurRadius: 30,
                                    offset: Offset(0, 5),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 15),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _buildServiceIcon(
                                  Icons.flight_takeoff,
                                  'شحن جوي',
                                ),
                                const SizedBox(width: 20),
                                _buildServiceIcon(
                                  Icons.directions_boat,
                                  'شحن بحري',
                                ),
                                const SizedBox(width: 20),
                                _buildServiceIcon(
                                  Icons.local_shipping,
                                  'شحن بري',
                                ),
                              ],
                            ),
                            const SizedBox(height: 15),
                            const Text(
                              'التخليص الجمركي والشحن الدولي',
                              style: TextStyle(
                                fontSize: 15,
                                color: Color(0xFF1ba3b6),
                                fontWeight: FontWeight.w500,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 80),

                    // Progress Indicator
                    if (_showProgress) _buildShippingProgress(),
                  ],
                ),
              ),

              // Version
              Positioned(
                bottom: 30,
                left: 0,
                right: 0,
                child: FadeTransition(
                  opacity: _textFade,
                  child: const Text(
                    'الإصدار 1.0.0',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white38,
                      fontSize: 12,
                      letterSpacing: 1,
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

  Widget _buildLogo() {
    return Container(
      width: 280,
      height: 280,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1ba3b6).withOpacity(0.5),
            blurRadius: 50,
            spreadRadius: 20,
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
        ],
      ),
      child: Container(
        padding: const EdgeInsets.all(35),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              Colors.white.withOpacity(0.25),
              Colors.white.withOpacity(0.05),
            ],
          ),
          border: Border.all(
            color: const Color(0xFF1ba3b6).withOpacity(0.6),
            width: 3,
          ),
        ),
        child: Container(
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
          ),
          child: ClipOval(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Image.asset(
                'assets/img/logo.png',
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return const Icon(
                    Icons.local_shipping_rounded,
                    size: 120,
                    color: Color(0xFF690000),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildServiceIcon(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF1ba3b6).withOpacity(0.2),
            border: Border.all(
              color: const Color(0xFF1ba3b6).withOpacity(0.4),
              width: 1.5,
            ),
          ),
          child: Icon(icon, color: const Color(0xFF1ba3b6), size: 24),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildShippingProgress() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 50),
      child: Column(
        children: [
          // Progress Container Icon - من اليمين لليسار
          Directionality(
            textDirection: TextDirection.rtl,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (index) {
                final isActive = _progress * 4 > index;
                final isCompleted = _progress * 4 > index + 1;

                return Row(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 400),
                      width: isActive ? 40 : 30,
                      height: isActive ? 40 : 30,
                      decoration: BoxDecoration(
                        color:
                            isCompleted
                                ? const Color(0xFF1ba3b6)
                                : isActive
                                ? const Color(0xFF1ba3b6).withOpacity(0.7)
                                : Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color:
                              isActive
                                  ? const Color(0xFF1ba3b6)
                                  : Colors.white.withOpacity(0.3),
                          width: 2,
                        ),
                        boxShadow:
                            isActive
                                ? [
                                  BoxShadow(
                                    color: const Color(
                                      0xFF1ba3b6,
                                    ).withOpacity(0.5),
                                    blurRadius: 15,
                                    spreadRadius: 2,
                                  ),
                                ]
                                : [],
                      ),
                      child: Icon(
                        Icons.inventory_2,
                        color: isActive ? Colors.white : Colors.white54,
                        size: isActive ? 22 : 16,
                      ),
                    ),
                    if (index < 3)
                      Container(
                        width: 30,
                        height: 2,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerRight,
                            end: Alignment.centerLeft,
                            colors: [
                              _progress * 4 > index + 0.5
                                  ? const Color(0xFF1ba3b6)
                                  : Colors.white.withOpacity(0.3),
                              isCompleted
                                  ? const Color(0xFF1ba3b6)
                                  : Colors.white.withOpacity(0.3),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                  ],
                );
              }),
            ),
          ),

          const SizedBox(height: 25),

          // Loading Text
          AnimatedOpacity(
            opacity: (_progress * 10 % 2).floor() == 0 ? 1.0 : 0.6,
            duration: const Duration(milliseconds: 600),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.sync, color: Color(0xFF1ba3b6), size: 18),
                SizedBox(width: 10),
                Text(
                  'جاري تحميل البيانات',
                  style: TextStyle(
                    color: Color(0xFF1ba3b6),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWave(int index) {
    final delays = [0.0, 0.3, 0.6];
    final heights = [0.15, 0.2, 0.25];

    return Positioned(
      bottom: -20,
      left: 0,
      right: 0,
      child: AnimatedBuilder(
        animation: _waveController,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(
              ((_waveController.value + delays[index]) % 1.0) * 400 - 200,
              0,
            ),
            child: Opacity(
              opacity: 0.1 - (index * 0.02),
              child: CustomPaint(
                size: Size(MediaQuery.of(context).size.width, 150),
                painter: WavePainter(
                  animationValue: _waveController.value,
                  waveHeight: heights[index],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildMovingShip() {
    return AnimatedBuilder(
      animation: _shipController,
      builder: (context, child) {
        final progress = _shipController.value;

        return Positioned(
          left: MediaQuery.of(context).size.width * progress - 50,
          bottom: 80,
          child: Opacity(
            opacity: 0.1,
            child: Transform.scale(
              scaleX: progress > 0.5 ? -1 : 1,
              child: const Icon(
                Icons.directions_boat,
                size: 60,
                color: Color(0xFF1ba3b6),
              ),
            ),
          ),
        );
      },
    );
  }
}

// Wave Painter للأمواج
class WavePainter extends CustomPainter {
  final double animationValue;
  final double waveHeight;

  WavePainter({required this.animationValue, required this.waveHeight});

  @override
  void paint(Canvas canvas, Size size) {
    final paint =
        Paint()
          ..color = const Color(0xFF1ba3b6)
          ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(0, size.height);

    for (double i = 0; i < size.width; i++) {
      path.lineTo(
        i,
        size.height -
            (math.sin(
                  (i / size.width * 2 * math.pi) +
                      (animationValue * 2 * math.pi),
                ) *
                size.height *
                waveHeight),
      );
    }

    path.lineTo(size.width, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(WavePainter oldDelegate) => true;
}
