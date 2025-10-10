import 'package:flutter/material.dart';

void main() {
  runApp(const AlNoranApp());
}

class AlNoranApp extends StatelessWidget {
  const AlNoranApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Al-Noran System Development',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Al-Noran System Development'),
        centerTitle: true,
      ),
      body: const Center(
        child: Text(
          'Welcome to Al-Noran System!',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
