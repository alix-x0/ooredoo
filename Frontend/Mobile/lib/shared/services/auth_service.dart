import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/auth_provider.dart';
import '../../features/authentication/models/user_model.dart';
import './api_client.dart';

class AuthService {
  final Ref _ref;
  final ApiClient _api;

  AuthService(this._ref, this._api);

  Future<String?> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _api.post('auth/login/', {
        'email': email,
        'username': email,
        'password': password,
      }, includeToken: false);


      if (response.statusCode == 200) {
        final dynamic decoded = jsonDecode(response.body);

        if (decoded == null || decoded is! Map) {
          return 'Invalid response from server';
        }

        final Map<String, dynamic> data = Map<String, dynamic>.from(decoded);

        if (data['access'] == null || data['user'] == null) {
          return 'Server response missing token or user data';
        }

        await _saveAuthData(data);

        final userJson = data['user'];
        if (userJson != null && userJson is Map) {
          _ref.read(authProvider.notifier).state = AppUser.fromJson(
            Map<String, dynamic>.from(userJson),
          );
          return null;
        } else {
          return 'Failed to parse user data';
        }
      } else {
        return _parseError(response.body);
      }
    } catch (e, stack) {
      debugPrint('LOGIN ERROR: $e');
      debugPrint('STACKTRACE: $stack');
      return 'Connection error: ${e.toString()}';
    }
  }

  Future<String?> register({
    required String email,
    required String username,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
    String? phone,
    String? department,
    String? jobTitle,
    String? location,
    int? capacity,
    String? description,
  }) async {
    try {
      final Map<String, dynamic> regData = {
        'email': email,
        'username': username,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
        'role': role,
      };

      if (role == 'EMPLOYEE') {
        regData['phone'] = phone;
        regData['department'] = department;
        regData['job_title'] = jobTitle;
      } else if (role == 'WAREHOUSE') {
        regData['location'] = location;
        regData['capacity'] = capacity;
        regData['description'] = description;
      } else if (role == 'ADMIN') {
        regData['department'] = department;
      }

      final response = await _api.post('auth/register/', regData, includeToken: false);

      if (response.statusCode == 201) {
        return null;
      } else {
        return _parseError(response.body);
      }
    } catch (e) {
      return 'Connection error: ${e.toString()}';
    }
  }

  Future<void> logout() async {
    try {
      // In the Django backend, simplejwt logout endpoint may not exist or require refresh token.
      // We will clear our local tokens and state.
    } catch (_) {
    } finally {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('access_token');
      await prefs.remove('refresh_token');
      await prefs.remove('user');

      _ref.read(authProvider.notifier).state = null;
    }
  }

  Future<void> loadFromStorage() async {
    try {
      if (_ref.read(authProvider) != null) return;

      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');

      if (userString != null && userString.isNotEmpty && userString != 'null') {
        final dynamic decoded = jsonDecode(userString);
        if (decoded != null && decoded is Map) {
          final userMap = Map<String, dynamic>.from(decoded);
          _ref.read(authProvider.notifier).state = AppUser.fromJson(userMap);
          debugPrint('AuthService: User loaded from storage');
        }
      }
    } catch (e, stack) {
      debugPrint('AuthService: Error loading user from storage: $e');
      debugPrint(stack.toString());
      await logout();
    }
  }

  Future<void> _saveAuthData(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', data['access']);
    await prefs.setString('refresh_token', data['refresh']);
    await prefs.setString('user', jsonEncode(data['user']));
  }

  String _parseError(String responseBody) {
    try {
      final errorData = jsonDecode(responseBody);
      if (errorData is Map) {
        if (errorData.containsKey('non_field_errors')) {
          return errorData['non_field_errors'][0];
        }
        if (errorData.containsKey('detail')) return errorData['detail'];

        final String firstKey = errorData.keys.first;
        final dynamic val = errorData[firstKey];
        if (val is List) return '$firstKey: ${val[0]}';
        return val.toString();
      }
    } catch (_) {}
    return 'Action failed. Please try again.';
  }
}

final authServiceProvider = Provider<AuthService>((ref) {
  final api = ref.watch(apiClientProvider);
  return AuthService(ref, api);
});
