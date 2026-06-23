import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../screens/login_screen.dart';
import '../../../shared/services/auth_service.dart';
import '../../../shared/providers/auth_provider.dart';

import '../../actors/admin/screens/admin_home_screen.dart';
import '../../actors/employee/screens/employee_home_screen.dart';
import '../../actors/warehouse/screens/warehouse_home_screen.dart';

class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authController = ref.read(authServiceProvider);
    final user = ref.watch(authProvider);

    return FutureBuilder(
      future: authController.loadFromStorage(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting &&
            user == null) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(
                color: Color(0xFFED1C24),
              ),
            ),
          );
        }

        if (user == null) {
          return const LoginScreen();
        }

        switch (user.role) {
          case 'ADMIN':
            return const AdminHomeScreen();
          case 'WAREHOUSE':
            return const WarehouseHomeScreen();
          case 'EMPLOYEE':
          default:
            return const EmployeeHomeScreen();
        }
      },
    );
  }
}
