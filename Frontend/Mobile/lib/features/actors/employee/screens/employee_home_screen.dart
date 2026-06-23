import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import '../../../../shared/services/api_client.dart';
import '../../../../shared/services/auth_service.dart';
import '../../../../shared/providers/auth_provider.dart';
import 'notifications_screen.dart';
import 'gift_catalog_screen.dart';

class EmployeeHomeScreen extends ConsumerStatefulWidget {
  const EmployeeHomeScreen({super.key});

  @override
  ConsumerState<EmployeeHomeScreen> createState() => _EmployeeHomeScreenState();
}

class _EmployeeHomeScreenState extends ConsumerState<EmployeeHomeScreen> {
  int _currentTab = 0;
  bool _loading = false;
  List<dynamic> _assignments = [];
  List<dynamic> _dispatches = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final client = ref.read(apiClientProvider);
      final assignRes = await client.get('gift-assignments/');
      final dispatchRes = await client.get('dispatches/');

      if (assignRes.statusCode == 200 && dispatchRes.statusCode == 200) {
        final assignData = jsonDecode(assignRes.body);
        final dispatchData = jsonDecode(dispatchRes.body);

        setState(() {
          if (assignData is Map && assignData.containsKey('results')) {
            _assignments = assignData['results'];
          } else {
            _assignments = assignData is List ? assignData : [];
          }

          if (dispatchData is Map && dispatchData.containsKey('results')) {
            _dispatches = dispatchData['results'];
          } else {
            _dispatches = dispatchData is List ? dispatchData : [];
          }
        });
      } else {
        setState(() {
          _error = 'Failed to fetch data. Status code: ${assignRes.statusCode}';
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Connection error: ${e.toString()}';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider);
    const brandColor = Color(0xFFED1C24);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      extendBody: true, // Seamlessly scroll content behind the floating navbar
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: brandColor,
        child: _loading && _assignments.isEmpty && _dispatches.isEmpty
            ? const Center(child: CircularProgressIndicator(color: brandColor))
            : _buildTabContent(user),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          height: 72,
          margin: const EdgeInsets.only(left: 24, right: 24, bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildCustomNavItem(
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home_rounded,
                  index: 0,
                ),
                _buildCustomNavItem(
                  icon: Icons.card_giftcard_outlined,
                  activeIcon: Icons.card_giftcard_rounded,
                  index: 1,
                ),
                _buildCustomNavItem(
                  icon: Icons.phone_outlined,
                  activeIcon: Icons.phone_rounded,
                  index: 2,
                ),
                // Floating Action Button matching mockup (Red circular button with "+")
                GestureDetector(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const GiftCatalogScreen()));
                  },
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(
                      color: Color(0xFFED1C24),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.add,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCustomNavItem({
    required IconData icon,
    required IconData activeIcon,
    required int index,
  }) {
    final isSelected = _currentTab == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentTab = index;
        });
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Icon(
          isSelected ? activeIcon : icon,
          color: isSelected ? const Color(0xFFED1C24) : const Color(0xFF94A3B8),
          size: 24,
        ),
      ),
    );
  }

  Widget _buildTabContent(user) {
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Color(0xFFED1C24)),
              const SizedBox(height: 16),
              Text(
                _error!,
                style: const TextStyle(fontSize: 16, color: Color(0xFF64748B)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _fetchData,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFED1C24),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    switch (_currentTab) {
      case 0:
        return _buildHomeTab(user);
      case 1:
        return SafeArea(child: _buildGiftsTab());
      case 2:
        return SafeArea(child: _buildContactUsTab());
      case 3:
        return SafeArea(child: _buildProfileTab(user));
      default:
        return _buildHomeTab(user);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // HOME TAB — Mockup Redesign
  // ──────────────────────────────────────────────────────────────
  Widget _buildHomeTab(user) {
    final paddingTop = MediaQuery.of(context).padding.top;
    final int userPoints = user?.loyaltyPoints ?? (user?.giftCount != null ? (user!.giftCount * 1200 + 3500) : 4700);

    // Get the most recent active dispatch for "Current Tracking"
    Map<String, dynamic>? currentDispatch;
    if (_dispatches.isNotEmpty) {
      currentDispatch = _dispatches.first;
    }

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── 1. Top Header Bar ──
          Padding(
            padding: EdgeInsets.only(top: paddingTop + 16, bottom: 16, left: 24, right: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    // Avatar
                    GestureDetector(
                      onTap: () => setState(() => _currentTab = 3),
                      child: Container(
                        width: 48, height: 48,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          shape: BoxShape.circle,
                          image: const DecorationImage(
                            image: NetworkImage('https://i.pravatar.cc/150?img=11'), // Mock avatar
                            fit: BoxFit.cover,
                          )
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hello, ${user?.firstName?.toUpperCase() ?? "EMPLOYEE"}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Icon(Icons.location_on_outlined, size: 14, color: Colors.grey[400]),
                            const SizedBox(width: 4),
                            Text('Ooredoo HQ, Algiers', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
                // Notification Bell
                GestureDetector(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                  },
                  child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: Colors.grey[100], shape: BoxShape.circle),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Icon(Icons.notifications_none_rounded, color: Color(0xFF1E293B)),
                      Positioned(top: 10, right: 10, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFFED1C24), shape: BoxShape.circle))),
                    ],
                  ),
                ),
                ),
              ],
            ),
          ),

          // ── 2. Balance Card (Black) ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFFED1C24),
                borderRadius: BorderRadius.circular(28),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Your Points Balance', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      GestureDetector(
                        onTap: () => setState(() => _currentTab = 1),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                          child: const Text('Redeem', style: TextStyle(color: Color(0xFFED1C24), fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        '${NumberFormat('#,##0', 'en_US').format(userPoints).replaceAll(',', ' ')} pts',
                        style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 12),
                      Icon(Icons.remove_red_eye_outlined, color: Colors.white.withOpacity(0.5), size: 20),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _currentTab = 1),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(Icons.local_shipping_outlined, color: Color(0xFFED1C24), size: 18),
                                SizedBox(width: 8),
                                Text('Track Gifts', style: TextStyle(color: Color(0xFFED1C24), fontWeight: FontWeight.bold, fontSize: 13)),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _currentTab = 1), // Actually gifts is tab 1
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(Icons.card_giftcard_outlined, color: Color(0xFFED1C24), size: 18),
                                SizedBox(width: 8),
                                Text('Claim Gifts', style: TextStyle(color: Color(0xFFED1C24), fontWeight: FontWeight.bold, fontSize: 13)),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // ── 3. Search Bar ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.grey[100], // very light grey matching image
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.search, color: Colors.grey[400], size: 22),
                        const SizedBox(width: 8),
                        Text('Search Shipping', style: TextStyle(color: Colors.grey[400], fontSize: 14)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  width: 48, height: 48,
                  decoration: const BoxDecoration(
                    color: Color(0xFFED1C24),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.filter_list_rounded, color: Colors.white, size: 20),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ── 4. Current Tracking Header ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: const Text('Gift Tracking', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          ),
          const SizedBox(height: 12),

          // ── 5. Current Tracking Card ──
          if (currentDispatch != null)
            _buildCurrentTrackingCard(currentDispatch)
          else
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Center(
                  child: Text('No active tracking', style: TextStyle(color: Colors.grey)),
                ),
              ),
            ),
             
          const SizedBox(height: 24),

          // ── 6. Recent Activities Header ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Recent Activities', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                Text('See all', style: TextStyle(fontSize: 13, color: Colors.grey[500], fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ── 7. Recent Activities List ──
          ..._buildRecentActivitiesList(user),

          const SizedBox(height: 120), // Padding for bottom nav
        ],
      ),
    );
  }

  Widget _buildCurrentTrackingCard(Map<String, dynamic> dispatch) {
    final tracking = dispatch['tracking_number'] ?? 'PAQ-327-P21';
    final status = dispatch['status'] ?? 'In Transit';
    final fromAddress = dispatch['source_warehouse_name'] ?? '15, Idumota RD';
    final toAddress = dispatch['destination_wilaya'] ?? '21, Ikeja Lagos';
    
    // Status color
    Color statusColor = const Color(0xFF3B82F6); // default blue
    Color statusBg = const Color(0xFFEFF6FF); // light blue
    if (status == 'Delivered' || status == 'Arrived') {
      statusColor = const Color(0xFF10B981);
      statusBg = const Color(0xFFECFDF5);
    } else if (status == 'Pending' || status == 'Pending Dispatch') {
      statusColor = const Color(0xFFF59E0B);
      statusBg = const Color(0xFFFEF3C7);
    }

    return GestureDetector(
      onTap: () => _showTrackingFlow(dispatch, dispatch['route'] as List? ?? []),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC), // very light gray
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            children: [
              // Top row: ID and Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Gift ID:', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                      const SizedBox(height: 4),
                      Text(tracking, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(20)),
                    child: Text(status, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 20),
  
              // Middle row: From / To
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('From:', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                        const SizedBox(height: 4),
                        Text(fromAddress, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)), maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 2),
                        Text('16 Jan 2026', style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('To:', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                        const SizedBox(height: 4),
                        Text(toAddress, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)), maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 2),
                        Text('25 Jan 2026', style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
  
              // Timeline
              _buildTimelineProgress(status),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimelineProgress(String status) {
    // 3 steps: Received, In Transit, Delivered
    int step = 1;
    if (status == 'In Transit') step = 2;
    if (status == 'Arrived' || status == 'Delivered') step = 3;

    Widget _dot(bool active) {
      return Container(
        width: 20, height: 20,
        decoration: BoxDecoration(
          color: active ? const Color(0xFFED1C24) : Colors.grey[300],
          shape: BoxShape.circle,
          border: active ? Border.all(color: Colors.white, width: 2) : null,
          boxShadow: active ? [BoxShadow(color: const Color(0xFFED1C24).withOpacity(0.3), blurRadius: 4, spreadRadius: 2)] : null,
        ),
        child: active ? const Icon(Icons.check, color: Colors.white, size: 12) : null,
      );
    }

    Widget _line(bool active) {
      return Expanded(
        child: Container(
          height: 2,
          color: active ? const Color(0xFFED1C24) : Colors.grey[300],
        ),
      );
    }

    return Column(
      children: [
        Row(
          children: [
            _dot(step >= 1),
            _line(step >= 2),
            _dot(step >= 2),
            _line(step >= 3),
            _dot(step >= 3),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Received', style: TextStyle(fontSize: 10, fontWeight: step >= 1 ? FontWeight.w600 : FontWeight.normal, color: step >= 1 ? const Color(0xFFED1C24) : Colors.grey[500])),
            Text('In Transit', style: TextStyle(fontSize: 10, fontWeight: step >= 2 ? FontWeight.w600 : FontWeight.normal, color: step >= 2 ? const Color(0xFFED1C24) : Colors.grey[500])),
            Text('Delivered', style: TextStyle(fontSize: 10, fontWeight: step >= 3 ? FontWeight.w600 : FontWeight.normal, color: step >= 3 ? const Color(0xFFED1C24) : Colors.grey[500])),
          ],
        ),
      ],
    );
  }

  List<Widget> _buildRecentActivitiesList(user) {
    List<Widget> items = [];
    
    for (var dispatch in _dispatches.take(3)) {
      items.add(_buildRecentActivityItem(dispatch, user, isGift: false));
    }
    for (var assignment in _assignments.take(2)) {
      items.add(_buildRecentActivityItem(assignment, user, isGift: true));
    }
    
    if (items.isEmpty) {
      items.add(
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Text('No recent activities', style: TextStyle(color: Colors.grey)),
            ),
          ),
        ),
      );
    }
    
    return items;
  }

  Widget _buildRecentActivityItem(Map<String, dynamic> data, user, {required bool isGift}) {
    final title = isGift ? 'GIFT-${data['id']}' : (data['tracking_number'] ?? 'PAQ-401-A36');
    final itemName = data['gift_name'] ?? 'Item';
    final status = isGift ? 'Claimed' : (data['status'] ?? 'Completed');
    
    // Formatting date safely
    String dateStr = '12 Jan 2026';
    final rawDate = data['created_at'] ?? data['assigned_at'];
    if (rawDate != null) {
      try {
        final dt = DateTime.parse(rawDate);
        dateStr = DateFormat('dd MMM yyyy').format(dt);
      } catch (_) {}
    }

    Color dotColor = const Color(0xFF10B981); // green
    if (status == 'In Transit') dotColor = const Color(0xFF3B82F6);
    if (status == 'Pending' || status == 'Pending Dispatch') dotColor = const Color(0xFFF59E0B);

    return GestureDetector(
      onTap: () {
        if (isGift) {
          _showQrCodeSheet(user, data);
        } else {
          _showTrackingFlow(data, data['route'] as List? ?? []);
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Left column
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Gift ID:', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
                  const SizedBox(height: 2),
                  Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                  const SizedBox(height: 12),
                  Text('Status:', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
                  const SizedBox(height: 2),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: dotColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Container(width: 6, height: 6, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
                        const SizedBox(width: 4),
                        Text(status, style: TextStyle(color: dotColor, fontSize: 10, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ),
              // Right column
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('Item:', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
                  const SizedBox(height: 2),
                  Text(itemName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                  const SizedBox(height: 12),
                  Text('Date:', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
                  const SizedBox(height: 2),
                  Text(dateStr, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }


  // Interactive QR Code bottom sheet mockup (Screen 2)
  void _showQrCodeSheet(user, Map<String, dynamic> gift) {
    const brandColor = Color(0xFFED1C24);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: brandColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: IconButton(
                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              const Text(
                'CLAIM CODE',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                gift['gift_name'] ?? 'Gift Pack',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),

              // White square box containing QR code matching mockup
              Center(
                child: Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: MockQrCode(data: 'claim_${gift['id']}_${user?.email}'),
                ),
              ),
              const SizedBox(height: 32),

              // Bottom card greeting matching mockup screen 2
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          user?.firstName != null && user!.firstName.isNotEmpty
                              ? user.firstName[0].toUpperCase()
                              : 'O',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: brandColor,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Hello,',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                          Text(
                            user?.name ?? 'Employee User',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SvgPicture.asset(
                      'assets/Logo.svg',
                      height: 20,
                      colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  // GIFTS TAB
  Widget _buildGiftsTab() {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          const Material(
            color: Colors.white,
            elevation: 0,
            child: TabBar(
              labelColor: Color(0xFFED1C24),
              unselectedLabelColor: Color(0xFF64748B),
              indicatorColor: Color(0xFFED1C24),
              indicatorWeight: 3,
              labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              tabs: [
                Tab(text: 'My Gifts'),
                Tab(text: 'Active Dispatches'),
              ],
            ),
          ),
          Divider(height: 1, color: Colors.grey[100]),
          Expanded(
            child: TabBarView(
              children: [
                _buildMyGiftsList(),
                _buildActiveDispatchesTabList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyGiftsList() {
    if (_assignments.isEmpty) {
      return _buildEmptyState(
        'No gifts received yet',
        'Once a gift is delivered, it will appear here.',
        Icons.card_giftcard,
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(top: 20, left: 20, right: 20, bottom: 110),
      itemCount: _assignments.length,
      itemBuilder: (context, index) {
        final item = _assignments[index];
        final giftName = item['gift_name'] ?? 'Gift';
        final assignedBy = item['assigned_by_email'] ?? 'Ooredoo HR';
        final assignedAtStr = item['assigned_at'];
        String formattedDate = '';
        if (assignedAtStr != null) {
          try {
            final dt = DateTime.parse(assignedAtStr);
            formattedDate = DateFormat('MMMM dd, yyyy').format(dt);
          } catch (_) {}
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey[100]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.01),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: Colors.green,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      giftName,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'From $assignedBy',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                    if (formattedDate.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Received $formattedDate',
                        style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActiveDispatchesTabList() {
    if (_dispatches.isEmpty) {
      return _buildEmptyState(
        'No active dispatches',
        'When Ooredoo dispatches a gift to you, tracking details will show here.',
        Icons.local_shipping_outlined,
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(top: 20, left: 20, right: 20, bottom: 110),
      itemCount: _dispatches.length,
      itemBuilder: (context, index) {
        final order = _dispatches[index];
        final giftName = order['gift_name'] ?? 'Gift Pack';
        final status = order['status'] ?? 'Pending';
        final trackingNumber = order['tracking_number'] ?? 'TRK-XXXXX';
        final route = order['route'] as List? ?? [];

        Color statusColor;
        IconData statusIcon;

        switch (status) {
          case 'In Transit':
            statusColor = Colors.blue;
            statusIcon = Icons.local_shipping_rounded;
            break;
          case 'Arrived':
            statusColor = Colors.orange;
            statusIcon = Icons.location_on_rounded;
            break;
          case 'Delivered':
            statusColor = Colors.green;
            statusIcon = Icons.check_box_rounded;
            break;
          case 'Cancelled':
            statusColor = Colors.red;
            statusIcon = Icons.cancel_rounded;
            break;
          default:
            statusColor = Colors.grey;
            statusIcon = Icons.info_outline_rounded;
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey[100]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.01),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    trackingNumber,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(statusIcon, color: statusColor, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          status,
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                giftName,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Destination: ${order['destination_wilaya'] ?? 'Ooredoo HQ'}',
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF64748B),
                ),
              ),
              const Divider(height: 24),
              ElevatedButton.icon(
                onPressed: () => _showTrackingFlow(order, route),
                icon: const Icon(Icons.map_rounded, size: 18),
                label: const Text('Track Shipment'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFED1C24).withOpacity(0.08),
                  foregroundColor: const Color(0xFFED1C24),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showTrackingFlow(Map<String, dynamic> order, List<dynamic> route) {
    const brandColor = Color(0xFFED1C24);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Shipment Tracking',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Tracking No: ${order['tracking_number']}',
                style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              if (route.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 24.0),
                    child: Text('No tracking events logged yet.'),
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    itemCount: route.length,
                    itemBuilder: (context, idx) {
                      final step = route[idx];
                      final name = step['warehouse_name'] ?? 'Hub';
                      final stepStatus = step['status'] ?? 'Pending';
                      final timeStr = step['timestamp'] ?? '';

                      final isCompleted = stepStatus == 'Completed' || stepStatus == 'Arrived' || stepStatus == 'Delivered to Employee';
                      final isLast = idx == route.length - 1;

                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            children: [
                              Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isCompleted ? brandColor : Colors.grey[200],
                                  border: Border.all(
                                    color: isCompleted ? brandColor : Colors.grey[300]!,
                                    width: 2,
                                  ),
                                ),
                                child: isCompleted
                                    ? const Icon(Icons.check, size: 10, color: Colors.white)
                                    : null,
                              ),
                              if (!isLast)
                                Container(
                                  width: 2,
                                  height: 48,
                                  color: isCompleted ? brandColor : Colors.grey[200],
                                ),
                            ],
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: isCompleted ? const Color(0xFF1E293B) : Colors.grey[400],
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  stepStatus,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isCompleted ? brandColor : Colors.grey[400],
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                if (timeStr.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    timeStr.split('T')[0],
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                                const SizedBox(height: 12),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(String title, String subtitle, IconData icon) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: const Color(0xFF94A3B8)),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // PROFILE TAB
  Widget _buildProfileTab(user) {
    const brandColor = Color(0xFFED1C24);

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(top: 24, left: 24, right: 24, bottom: 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Column(
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: const BoxDecoration(
                    color: brandColor,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      user?.firstName != null && user!.firstName.isNotEmpty
                          ? user.firstName[0].toUpperCase()
                          : 'O',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  user?.name ?? 'Employee User',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.jobTitle ?? 'Communications Specialist',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.grey[100]!),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.01),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildProfileItem(Icons.email_outlined, 'Email Address', user?.email ?? ''),
                const Divider(height: 24),
                _buildProfileItem(Icons.phone_outlined, 'Phone Number', user?.phone ?? 'Not provided'),
                const Divider(height: 24),
                _buildProfileItem(Icons.business_outlined, 'Department', user?.department ?? 'Not provided'),
              ],
            ),
          ),
          const SizedBox(height: 40),

          SizedBox(
            height: 56,
            child: ElevatedButton.icon(
              onPressed: () => ref.read(authServiceProvider).logout(),
              icon: const Icon(Icons.logout_rounded, size: 20),
              label: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: brandColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileItem(IconData icon, String title, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: const Color(0xFF64748B), size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // CONTACT US TAB
  Widget _buildContactUsTab() {
    const brandColor = Color(0xFFED1C24);

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(top: 24, left: 24, right: 24, bottom: 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Contact Us',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1E293B),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Have questions about your corporate gifts or dispatches? Get in touch with our team.',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 28),

          // HQ Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.grey[100]!),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.01),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: brandColor.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.business_rounded, color: brandColor, size: 22),
                    ),
                    const SizedBox(width: 14),
                    const Text(
                      'Ooredoo Algeria HQ',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  '1 Charles de Gaulle Avenue, El Biar, Algiers, Algeria\nSupport Hours: Sunday - Thursday (8:30 AM - 5:00 PM)',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B), height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Contact Methods Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.grey[100]!),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.01),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildContactItem(
                  icon: Icons.phone_android_rounded,
                  title: 'Employee Support Line',
                  value: '333 (From Ooredoo)',
                  subtitle: 'Toll-free internal line',
                ),
                const Divider(height: 32),
                _buildContactItem(
                  icon: Icons.phone_in_talk_rounded,
                  title: 'Landline Support',
                  value: '+213 550 000 333',
                  subtitle: 'For external calls',
                ),
                const Divider(height: 32),
                _buildContactItem(
                  icon: Icons.mail_outline_rounded,
                  title: 'Email Address',
                  value: 'gifts.support@ooredoo.dz',
                  subtitle: 'Response within 24 hours',
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Call to Action
          SizedBox(
            height: 56,
            child: ElevatedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Dialing Ooredoo Support (333)...'),
                    backgroundColor: brandColor,
                  ),
                );
              },
              icon: const Icon(Icons.call_rounded, size: 20),
              label: const Text('Call Employee Support', style: TextStyle(fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: brandColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactItem({
    required IconData icon,
    required String title,
    required String value,
    required String subtitle,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: const Color(0xFF64748B), size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// Built-in Mock QR Code Grid Painter matching mockup design
class MockQrCode extends StatelessWidget {
  final String data;
  const MockQrCode({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(11, (r) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(11, (c) {
            // Renders standard QR corner squares + noise matrix
            bool isCorner = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
            bool isCornerBorder = (r == 0 || r == 2 || c == 0 || c == 2) && (r < 3 && c < 3) ||
                (r == 0 || r == 2 || c == 8 || c == 10) && (r < 3 && c > 7) ||
                (r == 8 || r == 10 || c == 0 || c == 2) && (r > 7 && c < 3);
            bool isCornerInner = (r == 1 && c == 1) || (r == 1 && c == 9) || (r == 9 && c == 1);
            
            bool isBlack = false;
            if (isCorner) {
              isBlack = isCornerBorder || isCornerInner;
            } else {
              // Deterministic seed matrix noise
              int val = (r * 7 + c * 13 + data.hashCode) % 5;
              isBlack = val == 0 || val == 2;
            }

            return Container(
              width: 16,
              height: 16,
              color: isBlack ? Colors.black : Colors.white,
            );
          }),
        );
      }),
    );
  }
}
