import re

with open('apis/views.py', 'r') as f:
    content = f.read()

new_class = '''class DispatchOrderActionView(generics.GenericAPIView):
    queryset = DispatchOrder.objects.all()
    serializer_class = DispatchOrderSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        dispatch = self.get_object()
        action = request.data.get('action')
        user = request.user
        
        if user.role != User.Role.WAREHOUSE and user.role != User.Role.ADMIN:
            if action != 'validate_receipt':
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            wh = user.warehouse if user.role == User.Role.WAREHOUSE else None
        except Exception:
            return Response({"error": "User does not have a warehouse profile"}, status=status.HTTP_400_BAD_REQUEST)

        import datetime
        now_str = datetime.datetime.now().isoformat()
        
        if action == 'route_regional':
            if wh and dispatch.current_warehouse != wh:
                return Response({"error": "Dispatch is not currently at your warehouse."}, status=status.HTTP_400_BAD_REQUEST)
            if dispatch.status != DispatchOrder.Status.PENDING:
                return Response({"error": "Only pending dispatches can be routed."}, status=status.HTTP_400_BAD_REQUEST)
            
            regional_warehouse_id = request.data.get('regional_warehouse_id')
            if not regional_warehouse_id:
                return Response({"error": "regional_warehouse_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            from .models import Warehouse
            try:
                regional_wh = Warehouse.objects.get(id=regional_warehouse_id)
            except Warehouse.DoesNotExist:
                return Response({"error": "Invalid regional warehouse ID."}, status=status.HTTP_400_BAD_REQUEST)
            
            dispatch.destination_warehouse = regional_wh
            routeList = [
                {
                    "warehouse_id": wh.id if wh else dispatch.source_warehouse.id,
                    "warehouse_name": wh.username if wh else dispatch.source_warehouse.username,
                    "type": "source",
                    "status": "Pending",
                    "timestamp": None
                },
                {
                    "warehouse_id": regional_wh.id,
                    "warehouse_name": regional_wh.username,
                    "type": "destination",
                    "status": "Pending",
                    "timestamp": None
                }
            ]
            dispatch.route = routeList
            dispatch.save()
            return Response(DispatchOrderSerializer(dispatch).data)

        elif action == 'depart':
            if wh and dispatch.current_warehouse != wh:
                return Response({"error": "Dispatch is not currently at your warehouse."}, status=status.HTTP_400_BAD_REQUEST)
            if dispatch.status not in [DispatchOrder.Status.PENDING, DispatchOrder.Status.ARRIVED]:
                return Response({"error": "Invalid status for departure."}, status=status.HTTP_400_BAD_REQUEST)
                
            dispatch.status = DispatchOrder.Status.IN_TRANSIT
            route = dispatch.route or []
            for step in route:
                if step.get('warehouse_id') == wh.id and step.get('status') != 'Completed':
                    step['status'] = 'Completed'
                    step['timestamp'] = now_str
                    break
            dispatch.route = route
            dispatch.save()
            
            from .models import Notification
            Notification.objects.create(
                user=dispatch.employee,
                title="Gift In Transit",
                message=f"Your {dispatch.gift.name} is on its way to the next destination.",
                notification_type=Notification.Type.IN_TRANSIT
            )
            return Response(DispatchOrderSerializer(dispatch).data)
            
        elif action == 'arrive':
            if dispatch.status != DispatchOrder.Status.IN_TRANSIT:
                return Response({"error": "Dispatch is not currently in transit."}, status=status.HTTP_400_BAD_REQUEST)
            
            route = dispatch.route or []
            is_valid_hub = False
            for step in route:
                if step.get('warehouse_id') == wh.id and step.get('status') == 'Pending':
                    step['status'] = 'Arrived'
                    step['timestamp'] = now_str
                    is_valid_hub = True
                    break
                    
            if not is_valid_hub and wh:
                return Response({"error": "Your warehouse is not the next scheduled hub for this dispatch."}, status=status.HTTP_400_BAD_REQUEST)
                
            dispatch.status = DispatchOrder.Status.ARRIVED
            dispatch.current_warehouse = wh
            dispatch.route = route
            dispatch.save()
            
            from .models import Notification
            Notification.objects.create(
                user=dispatch.employee,
                title="Gift Arrived",
                message=f"Your {dispatch.gift.name} has arrived at a regional hub.",
                notification_type=Notification.Type.ARRIVED
            )
            
            if wh and dispatch.source_warehouse != wh:
                try:
                    from .models import Gift
                    regional_gift, created = Gift.objects.get_or_create(
                        name=dispatch.gift.name,
                        warehouse=wh,
                        defaults={
                            'description': dispatch.gift.description,
                            'category': dispatch.gift.category,
                            'priority': dispatch.gift.priority,
                            'price': dispatch.gift.price,
                            'points_cost': dispatch.gift.points_cost,
                            'stock': dispatch.quantity,
                            'claimed': 0,
                            'status': dispatch.gift.status
                        }
                    )
                    if not created:
                        regional_gift.stock += dispatch.quantity
                        regional_gift.save()
                except Exception as e:
                    print(f"Failed to add to regional inventory: {e}")
                    
            return Response(DispatchOrderSerializer(dispatch).data)
            
        elif action == 'validate_receipt':
            if dispatch.employee != user:
                return Response({"error": "Only the assigned employee can validate receipt."}, status=status.HTTP_403_FORBIDDEN)
            if dispatch.status == DispatchOrder.Status.DELIVERED:
                return Response({"error": "Dispatch is already delivered."}, status=status.HTTP_400_BAD_REQUEST)
                
            dispatch.status = DispatchOrder.Status.DELIVERED
            route = dispatch.route or []
            dest_wh = dispatch.destination_warehouse
            
            step_found = False
            for step in route:
                if step.get('warehouse_id') == dest_wh.id:
                    step['status'] = 'Delivered to Employee'
                    step['timestamp'] = now_str
                    step_found = True
                    break
            
            if not step_found:
                route.append({
                    "warehouse_id": dest_wh.id,
                    "warehouse_name": dest_wh.username,
                    "type": "destination",
                    "status": "Delivered to Employee",
                    "timestamp": now_str
                })
                
            dispatch.route = route
            dispatch.save()
            
            if dest_wh and dispatch.source_warehouse != dest_wh:
                try:
                    from .models import Gift
                    regional_gift = Gift.objects.filter(name=dispatch.gift.name, warehouse=dest_wh).first()
                    if regional_gift and regional_gift.stock >= dispatch.quantity:
                        regional_gift.stock -= dispatch.quantity
                        regional_gift.claimed += dispatch.quantity
                        regional_gift.save()
                except Exception as e:
                    pass
                    
            from .models import Notification
            Notification.objects.create(
                user=dispatch.employee,
                title="Gift Delivered",
                message=f"You have confirmed receipt of {dispatch.gift.name}.",
                notification_type=Notification.Type.DELIVERED
            )
            return Response(DispatchOrderSerializer(dispatch).data)
            
        elif action == 'cancel':
            if dispatch.status == DispatchOrder.Status.DELIVERED:
                return Response({"error": "Cannot cancel a delivered dispatch."}, status=status.HTTP_400_BAD_REQUEST)
            if wh and dispatch.source_warehouse != wh and user.role != User.Role.ADMIN:
                return Response({"error": "Only the source warehouse or an admin can cancel this dispatch."}, status=status.HTTP_400_BAD_REQUEST)
                
            dispatch.status = DispatchOrder.Status.CANCELLED
            gift = dispatch.gift
            gift.stock += dispatch.quantity
            gift.claimed -= dispatch.quantity
            gift.save()
            
            dispatch.save()
            return Response(DispatchOrderSerializer(dispatch).data)
            
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

class NotificationListUpdateView(generics.ListAPIView, generics.UpdateAPIView):
    serializer_class = __import__('apis.serializers', fromlist=['NotificationSerializer']).NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        from .models import Notification
        return Notification.objects.filter(user=self.request.user)
        
    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_read = True
        instance.save()
        return Response(self.get_serializer(instance).data)
'''

content = re.sub(r'class DispatchOrderActionView.*', new_class, content, flags=re.DOTALL)

# Add Gift Awarded / Dispatched notifications
awarded_notification = '''
                DispatchOrder.objects.create(
                    tracking_number=tracking_number,
                    gift=gift,
                    quantity=1,
                    employee=employee,
                    destination_wilaya=dest_wilaya,
                    source_warehouse=central_wh,
                    destination_warehouse=central_wh,
                    current_warehouse=central_wh,
                    status=DispatchOrder.Status.PENDING,
                    route=[]
                )
                from .models import Notification
                Notification.objects.create(
                    user=employee,
                    title="Gift Awarded",
                    message=f"You received a new corporate gift: {gift.name}!",
                    notification_type=Notification.Type.AWARDED
                )
                Notification.objects.create(
                    user=employee,
                    title="Gift Dispatched",
                    message=f"Your {gift.name} is being prepared for dispatch.",
                    notification_type=Notification.Type.DISPATCHED
                )
'''
content = re.sub(r'DispatchOrder\.objects\.create\([^)]+route=\[\]\n\s+\)', awarded_notification.strip(), content, flags=re.DOTALL)

with open('apis/views.py', 'w') as f:
    f.write(content)
