class AppUser {
  final String id;
  final String email;
  final String username;
  final String role; // 'ADMIN', 'EMPLOYEE', 'WAREHOUSE'
  final String name;
  final String firstName;
  final String lastName;
  final String? avatarUrl;
  final bool isActive;

  // Role specific fields
  final String? phone;
  final String? department;
  final String? jobTitle;
  final String? location;
  final int? capacity;
  final String? description;
  final int? giftCount;
  final int? loyaltyPoints;

  AppUser({
    required this.id,
    required this.email,
    required this.username,
    required this.role,
    required this.name,
    required this.firstName,
    required this.lastName,
    this.avatarUrl,
    this.isActive = true,
    this.phone,
    this.department,
    this.jobTitle,
    this.location,
    this.capacity,
    this.description,
    this.giftCount,
    this.loyaltyPoints,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    final firstName = json['first_name'] ?? '';
    final lastName = json['last_name'] ?? '';
    final combinedName = (firstName.isEmpty && lastName.isEmpty)
        ? (json['username'] ?? json['email'] ?? '')
        : '$firstName $lastName'.trim();

    return AppUser(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      role: json['role'] ?? 'EMPLOYEE',
      name: combinedName,
      firstName: firstName,
      lastName: lastName,
      avatarUrl: json['profile_picture'],
      isActive: json['is_active'] ?? true,
      phone: json['phone'],
      department: json['department'],
      jobTitle: json['job_title'],
      location: json['location'],
      capacity: json['capacity'] is int ? json['capacity'] : null,
      description: json['description'],
      giftCount: json['gift_count'] is int ? json['gift_count'] : null,
      loyaltyPoints: json['loyalty_points'] is int ? json['loyalty_points'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'role': role,
      'name': name,
      'first_name': firstName,
      'last_name': lastName,
      'profile_picture': avatarUrl,
      'is_active': isActive,
      'phone': phone,
      'department': department,
      'job_title': jobTitle,
      'location': location,
      'capacity': capacity,
      'description': description,
      'gift_count': giftCount,
      'loyalty_points': loyaltyPoints,
    };
  }
}
