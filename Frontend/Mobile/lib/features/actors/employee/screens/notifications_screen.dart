import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/services/api_client.dart';
import 'package:timeago/timeago.dart' as timeago;

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    try {
      final client = ref.read(apiClientProvider);
      final response = await client.get('notifications/');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _notifications = data is Map && data.containsKey('results') ? data['results'] : (data is List ? data : []);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load notifications (Status: ${response.statusCode})';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(Map<String, dynamic> notification) async {
    if (notification['is_read'] == true) return;
    
    // Optimistic UI update
    setState(() {
      notification['is_read'] = true;
    });

    try {
      final client = ref.read(apiClientProvider);
      await client.patch('notifications/${notification['id']}/', {'is_read': true});
    } catch (e) {
      // Revert on failure
      setState(() {
        notification['is_read'] = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to mark as read: $e')),
        );
      }
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'AWARDED':
        return Icons.card_giftcard;
      case 'DISPATCHED':
      case 'IN_TRANSIT':
        return Icons.local_shipping_outlined;
      case 'ARRIVED':
        return Icons.location_on_outlined;
      case 'DELIVERED':
        return Icons.check_circle_outline;
      default:
        return Icons.notifications_none;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'AWARDED':
        return const Color(0xFFED1C24);
      case 'DELIVERED':
        return Colors.green;
      case 'ARRIVED':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    const brandColor = Color(0xFFED1C24);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        centerTitle: true,
        title: const Text(
          'Notifications',
          style: TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: brandColor))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 48),
                      const SizedBox(height: 16),
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                      TextButton(
                        onPressed: _fetchNotifications,
                        child: const Text("Retry", style: TextStyle(color: brandColor)),
                      )
                    ],
                  ),
                )
              : _notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.notifications_off_outlined, size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            "No notifications yet.",
                            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        final note = _notifications[index];
                        final isRead = note['is_read'] == true;
                        final type = note['notification_type'] ?? 'INFO';
                        final icon = _getIconForType(type);
                        final color = _getColorForType(type);
                        
                        DateTime? createdTime;
                        try {
                          createdTime = DateTime.parse(note['created_at']);
                        } catch (_) {}
                        
                        final timeString = createdTime != null ? timeago.format(createdTime) : '';

                        return GestureDetector(
                          onTap: () => _markAsRead(note),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: !isRead ? Colors.white : const Color(0xFFF1F5F9).withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: !isRead
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.03),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      )
                                    ]
                                  : null,
                              border: !isRead ? Border.all(color: const Color(0xFFE2E8F0)) : Border.all(color: Colors.transparent),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: color.withValues(alpha: 0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    icon,
                                    color: color,
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              note['title'] ?? '',
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: !isRead ? FontWeight.bold : FontWeight.w600,
                                                color: const Color(0xFF1E293B),
                                              ),
                                            ),
                                          ),
                                          if (!isRead)
                                            Container(
                                              width: 8,
                                              height: 8,
                                              decoration: const BoxDecoration(
                                                color: brandColor,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        note['message'] ?? '',
                                        style: const TextStyle(
                                          fontSize: 14,
                                          color: Color(0xFF64748B),
                                          height: 1.4,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        timeString,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF94A3B8),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
