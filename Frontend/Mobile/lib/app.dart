import 'package:flutter/material.dart';
import 'features/authentication/widgets/auth_gate.dart';

class OoredooGiftsApp extends StatelessWidget {
  const OoredooGiftsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ooredoo Gifts',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFFED1C24),
        scaffoldBackgroundColor: Colors.white,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFED1C24)),
      ),
      home: const AuthGate(),
    );
  }
}
