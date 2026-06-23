import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/services/auth_service.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/auth_button.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _usernameController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _passwordController = TextEditingController();

  // Role specific controllers
  final _phoneController = TextEditingController();
  final _departmentController = TextEditingController();
  final _jobTitleController = TextEditingController();
  final _locationController = TextEditingController();
  final _capacityController = TextEditingController();
  final _descriptionController = TextEditingController();

  String _selectedRole = 'EMPLOYEE'; // Default
  bool _loading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _usernameController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _departmentController.dispose();
    _jobTitleController.dispose();
    _locationController.dispose();
    _capacityController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final error = await ref.read(authServiceProvider).register(
            email: _emailController.text.trim(),
            username: _usernameController.text.trim(),
            password: _passwordController.text,
            firstName: _firstNameController.text.trim(),
            lastName: _lastNameController.text.trim(),
            role: _selectedRole,
            phone: _selectedRole == 'EMPLOYEE' ? _phoneController.text.trim() : null,
            department: (_selectedRole == 'EMPLOYEE' || _selectedRole == 'ADMIN')
                ? _departmentController.text.trim()
                : null,
            jobTitle: _selectedRole == 'EMPLOYEE' ? _jobTitleController.text.trim() : null,
            location: _selectedRole == 'WAREHOUSE' ? _locationController.text.trim() : null,
            capacity: _selectedRole == 'WAREHOUSE' ? int.tryParse(_capacityController.text.trim()) : null,
            description: _selectedRole == 'WAREHOUSE' ? _descriptionController.text.trim() : null,
          );

      if (!mounted) return;

      if (error == null) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Registration successful! Please login.'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        setState(() => _errorMessage = error);
      }
    } catch (e) {
      setState(() => _errorMessage = 'Error: ${e.toString()}');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const brandColor = Color(0xFFED1C24);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Join Us',
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF1E293B),
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Create your account to get started',
                  style: TextStyle(
                    fontSize: 16,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 32),
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    margin: const EdgeInsets.only(bottom: 24),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.red.withOpacity(0.1)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Colors.red),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                    border: Border.all(color: const Color(0xFFF1F5F9)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Role Selector
                      const Text(
                        'Select Account Role',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[200]!, width: 1.5),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedRole,
                            isExpanded: true,
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedRole = val);
                              }
                            },
                            items: const [
                              DropdownMenuItem(value: 'EMPLOYEE', child: Text('Employee')),
                              DropdownMenuItem(value: 'WAREHOUSE', child: Text('Warehouse Manager')),
                              DropdownMenuItem(value: 'ADMIN', child: Text('Administrator')),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      AuthTextField(
                        controller: _emailController,
                        label: 'Email Address',
                        hint: 'user@ooredoo.dz',
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Email is required';
                          if (!value.contains('@')) return 'Invalid email address';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      AuthTextField(
                        controller: _usernameController,
                        label: 'Username',
                        hint: 'Enter username',
                        prefixIcon: Icons.alternate_email_rounded,
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Username is required';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      AuthTextField(
                        controller: _firstNameController,
                        label: 'First Name',
                        hint: 'First name',
                        prefixIcon: Icons.person_outline,
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Required';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      AuthTextField(
                        controller: _lastNameController,
                        label: 'Last Name',
                        hint: 'Last name',
                        prefixIcon: Icons.person_outline,
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Required';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      AuthTextField(
                        controller: _passwordController,
                        label: 'Password',
                        hint: 'Create password',
                        prefixIcon: Icons.lock_outline_rounded,
                        obscureText: true,
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Password is required';
                          if (value.length < 6) return 'At least 6 characters';
                          return null;
                        },
                      ),

                      // Dynamic Fields based on Selected Role
                      if (_selectedRole == 'EMPLOYEE') ...[
                        const SizedBox(height: 16),
                        AuthTextField(
                          controller: _phoneController,
                          label: 'Phone Number',
                          hint: '+213 XXX XX XX XX',
                          prefixIcon: Icons.phone_android_outlined,
                        ),
                        const SizedBox(height: 16),
                        AuthTextField(
                          controller: _departmentController,
                          label: 'Department',
                          hint: 'e.g., Marketing, HR',
                          prefixIcon: Icons.business_outlined,
                        ),
                        const SizedBox(height: 16),
                        AuthTextField(
                          controller: _jobTitleController,
                          label: 'Job Title',
                          hint: 'e.g., Specialist, Manager',
                          prefixIcon: Icons.badge_outlined,
                        ),
                      ],
                      if (_selectedRole == 'WAREHOUSE') ...[
                        const SizedBox(height: 16),
                        AuthTextField(
                          controller: _locationController,
                          label: 'Warehouse Location',
                          hint: 'e.g., Algiers, Oran',
                          prefixIcon: Icons.location_on_outlined,
                        ),
                        const SizedBox(height: 16),
                        AuthTextField(
                          controller: _capacityController,
                          label: 'Storage Capacity',
                          hint: 'e.g., 5000',
                          keyboardType: TextInputType.number,
                          prefixIcon: Icons.storage_outlined,
                          validator: (value) {
                            if (value != null && value.isNotEmpty && int.tryParse(value) == null) {
                              return 'Must be an integer';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        AuthTextField(
                          controller: _descriptionController,
                          label: 'Description',
                          hint: 'Describe the warehouse facility',
                          prefixIcon: Icons.description_outlined,
                        ),
                      ],
                      if (_selectedRole == 'ADMIN') ...[
                        const SizedBox(height: 16),
                        AuthTextField(
                          controller: _departmentController,
                          label: 'Admin Department',
                          hint: 'e.g., IT Security',
                          prefixIcon: Icons.admin_panel_settings_outlined,
                        ),
                      ],

                      const SizedBox(height: 32),
                      AuthButton(
                        text: 'Create Account',
                        onPressed: _register,
                        loading: _loading,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Already have an account?', style: TextStyle(color: Color(0xFF64748B))),
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        'Sign In',
                        style: TextStyle(color: brandColor, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
