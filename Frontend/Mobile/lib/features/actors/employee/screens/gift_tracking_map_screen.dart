import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../shared/services/api_client.dart';

class GiftTrackingMapScreen extends StatefulWidget {
  final Map<String, dynamic> dispatch;

  const GiftTrackingMapScreen({super.key, required this.dispatch});

  @override
  State<GiftTrackingMapScreen> createState() => _GiftTrackingMapScreenState();
}

class _GiftTrackingMapScreenState extends State<GiftTrackingMapScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _progressAnimation;
  bool _isSimulating = true;
  double _simulationSpeed = 1.0;
  
  // Coordinates mapping database for Algeria wilayas & warehouses
  LatLng _getCoordinates(String? name) {
    if (name == null || name.isEmpty) return const LatLng(36.7538, 3.0588); // Default: Algiers Center
    
    final lower = name.toLowerCase();
    if (lower.contains('oran')) return const LatLng(35.6987, -0.6349);
    if (lower.contains('constantine')) return const LatLng(36.3650, 6.6147);
    if (lower.contains('annaba')) return const LatLng(36.9000, 7.7667);
    if (lower.contains('blida')) return const LatLng(36.4700, 2.8300);
    if (lower.contains('setif')) return const LatLng(36.1900, 5.4100);
    if (lower.contains('tlemcen')) return const LatLng(34.8783, -1.3150);
    if (lower.contains('ghardaia')) return const LatLng(32.4900, 3.6700);
    if (lower.contains('ooredoo hq') || lower.contains('el biar') || lower.contains('algiers')) {
      return const LatLng(36.7699, 3.0294); // Ooredoo HQ / El Biar
    }
    
    // Deterministic offset coordinates using string hash to prevent overlapping
    final int hash = name.codeUnits.fold(0, (prev, element) => prev + element);
    final double offsetLat = (hash % 100) / 1000.0 - 0.05;
    final double offsetLng = ((hash * 7) % 100) / 1000.0 - 0.05;
    return LatLng(36.7538 + offsetLat, 3.0588 + offsetLng);
  }

  LatLng _interpolateLatLng(LatLng p1, LatLng p2, double t) {
    final double lat = p1.latitude + (p2.latitude - p1.latitude) * t;
    final double lng = p1.longitude + (p2.longitude - p1.longitude) * t;
    return LatLng(lat, lng);
  }

  LatLng _getTruckPosition(List<LatLng> points, double t) {
    if (points.isEmpty) return const LatLng(36.7538, 3.0588);
    if (points.length == 1) return points.first;
    if (t <= 0.0) return points.first;
    if (t >= 1.0) return points.last;

    final double floatIdx = t * (points.length - 1);
    final int idx = floatIdx.floor();
    final double localT = floatIdx - idx;

    if (idx >= points.length - 1) return points.last;
    return _interpolateLatLng(points[idx], points[idx + 1], localT);
  }

  @override
  void initState() {
    super.initState();
    
    // 15-second simulation route transition
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 15),
    );

    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.linear),
    )..addListener(() {
        setState(() {});
      });

    if (_isSimulating) {
      _animationController.repeat();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _toggleSimulation() {
    setState(() {
      _isSimulating = !_isSimulating;
      if (_isSimulating) {
        _animationController.repeat();
      } else {
        _animationController.stop();
      }
    });
  }

  void _adjustSpeed() {
    setState(() {
      if (_simulationSpeed == 1.0) {
        _simulationSpeed = 2.0;
        _animationController.duration = const Duration(seconds: 7);
      } else if (_simulationSpeed == 2.0) {
        _simulationSpeed = 4.0;
        _animationController.duration = const Duration(seconds: 3);
      } else {
        _simulationSpeed = 1.0;
        _animationController.duration = const Duration(seconds: 15);
      }
      
      if (_isSimulating) {
        final double currentProgress = _animationController.value;
        _animationController.stop();
        _animationController.value = currentProgress;
        _animationController.repeat();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    const brandColor = Color(0xFFED1C24);
    final trackingNumber = widget.dispatch['tracking_number'] ?? 'TRK-XXXXX';
    final giftName = widget.dispatch['gift_name'] ?? 'Corporate Gift Pack';
    final destinationName = widget.dispatch['destination_wilaya'] ?? 'Ooredoo HQ';
    final status = widget.dispatch['status'] ?? 'In Transit';
    final routeSteps = widget.dispatch['route'] as List? ?? [];

    // Parse coordinates from backend values
    final LatLng startPt = _getCoordinates(widget.dispatch['source_warehouse_name']);
    final LatLng endPt = _getCoordinates(destinationName);

    // Build the dynamic route list using intermediate checkpoints from backend
    final List<LatLng> routePoints = [];
    routePoints.add(startPt);
    for (var step in routeSteps) {
      final whName = step['warehouse_name'];
      if (whName != null) {
        routePoints.add(_getCoordinates(whName));
      }
    }
    // Prevent adding destination twice if already in intermediate hubs
    if (routePoints.isEmpty || (routePoints.last.latitude != endPt.latitude || routePoints.last.longitude != endPt.longitude)) {
      routePoints.add(endPt);
    }

    // Get animating truck position or real position from backend
    final double? currentLat = widget.dispatch['current_lat'];
    final double? currentLng = widget.dispatch['current_lng'];
    
    final LatLng truckPosition = (currentLat != null && currentLng != null)
        ? LatLng(currentLat, currentLng)
        : _getTruckPosition(routePoints, _progressAnimation.value);

    // Real-time geodesic distance calculation using latlong2
    final Distance distanceCalculator = const Distance();
    final double remainingDistanceMeters = distanceCalculator.as(
      LengthUnit.Meter,
      truckPosition,
      endPt,
    );
    final double distanceLeft = remainingDistanceMeters / 1000.0;
    final int etaMinutes = (distanceLeft * 1.5).round(); // Estimate 1.5 mins per km
    final double currentSpeed = _progressAnimation.value >= 1.0 ? 0.0 : (48.0 + (_progressAnimation.value * 123 % 8) - 4);

    return Scaffold(
      body: Stack(
        children: [
          // ── 1. Interactive Real Map ──
          Positioned.fill(
            child: FlutterMap(
              options: MapOptions(
                initialCenter: routePoints.isNotEmpty ? routePoints[routePoints.length ~/ 2] : const LatLng(36.75, 3.04),
                initialZoom: 12.0,
                maxZoom: 18.0,
                minZoom: 6.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'dz.ooredoo.gifts',
                ),
                PolylineLayer(
                  polylines: [
                    // Outer glow path
                    Polyline(
                      points: routePoints,
                      color: brandColor.withOpacity(0.3),
                      strokeWidth: 8.0,
                      strokeCap: StrokeCap.round,
                    ),
                    // Inner route path
                    Polyline(
                      points: routePoints,
                      color: brandColor,
                      strokeWidth: 4.0,
                      strokeCap: StrokeCap.round,
                    ),
                  ],
                ),
                MarkerLayer(
                  markers: [
                    // Warehouse Marker (Source)
                    Marker(
                      point: startPt,
                      width: 48,
                      height: 48,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
                        ),
                        child: const Icon(Icons.warehouse_rounded, color: Color(0xFF64748B), size: 24),
                      ),
                    ),
                    // Destination Marker (Employee Address/HQ)
                    Marker(
                      point: endPt,
                      width: 48,
                      height: 48,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
                        ),
                        child: const Icon(Icons.location_city_rounded, color: Color(0xFF10B981), size: 26),
                      ),
                    ),
                    // Intermediate Hub Checkpoints
                    for (int i = 1; i < routePoints.length - 1; i++)
                      Marker(
                        point: routePoints[i],
                        width: 36,
                        height: 36,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 1))],
                          ),
                          child: const Icon(Icons.location_on_rounded, color: Colors.amber, size: 18),
                        ),
                      ),
                    // Animated Truck Marker
                    Marker(
                      point: truckPosition,
                      width: 64,
                      height: 64,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          _PulsingRing(color: brandColor),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 3)),
                              ],
                            ),
                            child: const Icon(Icons.local_shipping_rounded, color: brandColor, size: 22),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── 2. Top Glassmorphic Navigation Bar ──
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.95),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1E293B), size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          giftName,
                          style: const TextStyle(
                            color: Color(0xFF1E293B),
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Tracking ID: $trackingNumber',
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Text(
                      status,
                      style: const TextStyle(
                        color: Color(0xFF1D4ED8),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
              ),
            ),
          ),

          // ── 3. Map Control HUD ──
          Positioned(
            top: MediaQuery.of(context).padding.top + 92,
            right: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _buildMapControl(
                  icon: _isSimulating ? Icons.pause_rounded : Icons.play_arrow_rounded,
                  onTap: _toggleSimulation,
                ),
                const SizedBox(height: 12),
                _buildMapControl(
                  icon: Icons.speed_rounded,
                  label: '${_simulationSpeed.toInt()}x',
                  onTap: _adjustSpeed,
                ),
              ],
            ),
          ),

          // ── 4. Live Telemetry Panel ──
          Positioned(
            top: MediaQuery.of(context).padding.top + 92,
            left: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withOpacity(0.95),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.15),
                    blurRadius: 12,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTelemetryRow(
                    icon: Icons.timer_outlined,
                    value: _progressAnimation.value >= 1.0 ? 'Arrived' : '$etaMinutes mins',
                    label: 'ETA',
                    color: brandColor,
                  ),
                  const SizedBox(height: 12),
                  _buildTelemetryRow(
                    icon: Icons.straighten_rounded,
                    value: '${distanceLeft.toStringAsFixed(1)} km',
                    label: 'Distance Left',
                    color: Colors.blueAccent,
                  ),
                  const SizedBox(height: 12),
                  _buildTelemetryRow(
                    icon: Icons.speed_rounded,
                    value: '${currentSpeed.toStringAsFixed(0)} km/h',
                    label: 'Speed',
                    color: Colors.greenAccent,
                  ),
                ],
              ),
            ),
          ),

          // ── 5. Slide-up Details & Timeline Panel ──
          Align(
            alignment: Alignment.bottomCenter,
            child: DraggableScrollableSheet(
              initialChildSize: 0.32,
              minChildSize: 0.32,
              maxChildSize: 0.85,
              snap: true,
              builder: (context, scrollController) {
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 30,
                        offset: const Offset(0, -10),
                      ),
                    ],
                  ),
                  child: ListView(
                    controller: scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 5,
                          margin: const EdgeInsets.only(bottom: 20),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                      
                      // Courier Profile Header
                      Row(
                        children: [
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: Colors.grey[200],
                              shape: BoxShape.circle,
                              image: const DecorationImage(
                                image: NetworkImage('https://i.pravatar.cc/150?img=60'),
                                fit: BoxFit.cover,
                              ),
                              border: Border.all(color: brandColor, width: 2),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'Rachid',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1E293B),
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Ooredoo Logistics Driver',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF64748B),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Dialing driver Rachid (+213 550 123 456)...'),
                                  backgroundColor: brandColor,
                                ),
                              );
                            },
                            child: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: brandColor.withOpacity(0.08),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.phone_rounded,
                                color: brandColor,
                                size: 20,
                              ),
                            ),
                          ),
                        ],
                      ),
                      
                      const Divider(height: 32, color: Color(0xFFF1F5F9)),

                      // Delivery Address Info
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.location_on_rounded, color: Colors.blue, size: 20),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Delivery Destination Address',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF94A3B8),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  destinationName,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1E293B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      
                      const Divider(height: 32, color: Color(0xFFF1F5F9)),

                      // Live updates notification banner
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.green.withOpacity(0.12)),
                        ),
                        child: Row(
                          children: const [
                            Icon(Icons.radar_rounded, color: Colors.green, size: 20),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'GPS tracking live. Displaying coordinates from dispatch order route.',
                                style: TextStyle(
                                  color: Colors.green,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      const Text(
                        'Shipment Route Details',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Route Timeline Steps
                      if (routeSteps.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 24.0),
                            child: Text('No tracking events logged yet.', style: TextStyle(color: Color(0xFF64748B))),
                          ),
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: routeSteps.length,
                          itemBuilder: (context, idx) {
                            final step = routeSteps[idx];
                            final name = step['warehouse_name'] ?? 'Hub';
                            final stepStatus = step['status'] ?? 'Pending';
                            final timeStr = step['timestamp'] ?? '';

                            final isCompleted = stepStatus == 'Completed' || stepStatus == 'Arrived' || stepStatus == 'Delivered to Employee' || stepStatus == 'Delivered';
                            final isLast = idx == routeSteps.length - 1;

                            return Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Column(
                                  children: [
                                    Container(
                                      width: 18,
                                      height: 18,
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
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: isCompleted ? const Color(0xFF1E293B) : Colors.grey[400],
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        stepStatus,
                                        style: TextStyle(
                                          fontSize: 12,
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
                    ],
                  ),
                );
              },
            ),
          ),
          
          // ── 6. Floating Action Button for Validation ──
          if (widget.dispatch['status'] != 'Delivered' && widget.dispatch['status'] != 'Cancelled')
            Positioned(
              bottom: 24,
              left: 24,
              right: 24,
              child: ElevatedButton(
                onPressed: _validateReceipt,
                style: ElevatedButton.styleFrom(
                  backgroundColor: brandColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 8,
                  shadowColor: brandColor.withOpacity(0.4),
                ),
                child: const Text(
                  'Confirm Receipt of Gift',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _validateReceipt() async {
    try {
      final dispatchId = widget.dispatch['id'];
      
      final api = ApiClient();
      final response = await api.post('/dispatches/$dispatchId/action/', {
        'action': 'validate_receipt',
      });
      
      setState(() {
        widget.dispatch['status'] = 'Delivered';
        if (widget.dispatch['route'] != null) {
           bool found = false;
           for (var step in widget.dispatch['route']) {
             if (step['type'] == 'destination' || step['warehouse_id'] == widget.dispatch['destination_warehouse']) {
               step['status'] = 'Delivered to Employee';
               found = true;
             }
           }
           if (!found) {
             widget.dispatch['route'].add({
               "type": "destination",
               "status": "Delivered to Employee",
               "warehouse_name": widget.dispatch['destination_warehouse_name'] ?? 'Warehouse',
               "timestamp": DateTime.now().toIso8601String(),
             });
           }
        }
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Receipt confirmed successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to confirm receipt: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildMapControl({required IconData icon, String? label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Center(
          child: label != null
              ? Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF1E293B),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                )
              : Icon(icon, color: const Color(0xFF1E293B), size: 20),
        ),
      ),
    );
  }

  Widget _buildTelemetryRow({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ── GPS Pulsing Halo Widget ──
class _PulsingRing extends StatefulWidget {
  final Color color;
  const _PulsingRing({required this.color});

  @override
  State<_PulsingRing> createState() => _PulsingRingState();
}

class _PulsingRingState extends State<_PulsingRing> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: 56 * _controller.value,
          height: 56 * _controller.value,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: widget.color.withOpacity(1.0 - _controller.value),
              width: 2,
            ),
          ),
        );
      },
    );
  }
}
