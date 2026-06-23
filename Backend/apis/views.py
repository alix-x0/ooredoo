from rest_framework import generics, status, filters, serializers
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Gift, GiftAssignment, DispatchOrder
from .serializers import (
    MyTokenObtainPairSerializer, UserSerializer, ChangePasswordSerializer,
    GiftSerializer, GiftAssignmentSerializer, DispatchOrderSerializer
)
from .permissions import IsAdmin, IsWarehouse, IsEmployee


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'role']
    ordering_fields = ['id', 'username']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class UserAdminUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GiftListCreateView(generics.ListCreateAPIView):
    serializer_class = GiftSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.WAREHOUSE:
            try:
                return Gift.objects.filter(warehouse=user.warehouse).order_by('-created_at')
            except Exception:
                return Gift.objects.none()
        return Gift.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        kwargs = {}
        if self.request.user.role == User.Role.WAREHOUSE:
            try:
                kwargs['warehouse'] = self.request.user.warehouse
            except Exception:
                pass
        serializer.save(**kwargs)


class GiftRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Gift.objects.all()
    serializer_class = GiftSerializer
    permission_classes = [IsAuthenticated]


class GiftAssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = GiftAssignmentSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return GiftAssignment.objects.all().order_by('-assigned_at')
        elif user.role == User.Role.EMPLOYEE:
            return GiftAssignment.objects.filter(employee=user).order_by('-assigned_at')
        return GiftAssignment.objects.none()

    def perform_create(self, serializer):
        gift = serializer.validated_data['gift']
        if gift.stock <= 0:
            raise serializers.ValidationError({"gift": "This gift is out of stock."})
        if gift.status != Gift.Status.ACTIVE:
            raise serializers.ValidationError({"gift": "This gift is not active."})
        
        gift.stock -= 1
        gift.claimed += 1
        gift.save()
        
        serializer.save(assigned_by=self.request.user)



class GiftAssignmentDestroyView(generics.DestroyAPIView):
    queryset = GiftAssignment.objects.all()
    serializer_class = GiftAssignmentSerializer
    permission_classes = [IsAdmin]

    def perform_destroy(self, instance):
        gift = instance.gift
        gift.stock += 1
        gift.claimed -= 1
        gift.save()
        instance.delete()


class DispatchOrderListCreateView(generics.ListCreateAPIView):
    serializer_class = DispatchOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return DispatchOrder.objects.all().order_by('-created_at')
        elif user.role == User.Role.WAREHOUSE:
            from django.db.models import Q
            try:
                wh = user.warehouse
                return DispatchOrder.objects.filter(
                    Q(source_warehouse=wh) | 
                    Q(destination_warehouse=wh) | 
                    Q(current_warehouse=wh)
                ).order_by('-created_at')
            except Exception:
                return DispatchOrder.objects.none()
        elif user.role == User.Role.EMPLOYEE:
            return DispatchOrder.objects.filter(employee=user).order_by('-created_at')
        return DispatchOrder.objects.none()


    def perform_create(self, serializer):
        user = self.request.user
        if user.role != User.Role.WAREHOUSE:
            raise serializers.ValidationError({"error": "Only warehouse managers can initiate dispatches."})
        
        gift = serializer.validated_data['gift']
        quantity = serializer.validated_data.get('quantity', 1)
        
        if gift.stock < quantity:
            raise serializers.ValidationError({"quantity": f"Insufficient stock. Available: {gift.stock}"})
            
        gift.stock -= quantity
        gift.claimed += quantity
        gift.save()
        
        import random, datetime
        today = datetime.date.today().strftime('%Y%m%d')
        tracking_number = f"TRK-{today}-{random.randint(1000, 9999)}"
        while DispatchOrder.objects.filter(tracking_number=tracking_number).exists():
            tracking_number = f"TRK-{today}-{random.randint(1000, 9999)}"
            
        try:
            source_wh = user.warehouse
        except Exception:
            raise serializers.ValidationError({"error": "Logged-in user is not linked to a warehouse profile."})
            
        route = self.request.data.get('route', [])
        
        serializer.save(
            tracking_number=tracking_number,
            source_warehouse=source_wh,
            current_warehouse=source_wh,
            route=route
        )


class DispatchOrderActionView(generics.GenericAPIView):
    queryset = DispatchOrder.objects.all()
    serializer_class = DispatchOrderSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        dispatch = self.get_object()
        action = request.data.get('action')
        user = request.user
        
        if user.role != User.Role.WAREHOUSE and user.role != User.Role.ADMIN:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            wh = user.warehouse if user.role == User.Role.WAREHOUSE else None
        except Exception:
            return Response({"error": "User does not have a warehouse profile"}, status=status.HTTP_400_BAD_REQUEST)

        import datetime
        now_str = datetime.datetime.now().isoformat()
        
        if action == 'depart':
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
            return Response(DispatchOrderSerializer(dispatch).data)
            
        elif action == 'deliver':
            if dispatch.status != DispatchOrder.Status.ARRIVED:
                return Response({"error": "Dispatch must be arrived at destination warehouse before delivery."}, status=status.HTTP_400_BAD_REQUEST)
            if wh and dispatch.destination_warehouse != wh:
                return Response({"error": "Only the destination warehouse can deliver the gift to the employee."}, status=status.HTTP_400_BAD_REQUEST)
                
            dispatch.status = DispatchOrder.Status.DELIVERED
            route = dispatch.route or []
            for step in route:
                if step.get('warehouse_id') == wh.id:
                    step['status'] = 'Delivered to Employee'
                    step['timestamp'] = now_str
                    break
            dispatch.route = route
            dispatch.save()
            
            try:
                GiftAssignment.objects.create(
                    gift=dispatch.gift,
                    employee=dispatch.employee,
                    assigned_by=user
                )
            except Exception as e:
                print("Failed to auto-create GiftAssignment log:", e)
                
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
