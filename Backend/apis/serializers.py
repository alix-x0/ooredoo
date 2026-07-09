from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Warehouse, Employee, Administrator, Gift, GiftAssignment, DispatchOrder, Notification


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        return token

    def validate(self, attrs):
        if not attrs.get("username"):
            attrs["username"] = attrs.get("email")
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user, context=self.context).data
        return data



class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    gift_count = serializers.SerializerMethodField()

    # Role-specific profile fields
    location = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    capacity = serializers.IntegerField(required=False, write_only=True, allow_null=True)
    zones = serializers.IntegerField(required=False, write_only=True, allow_null=True)
    description = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    department = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    job_title = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    loyalty_points = serializers.IntegerField(required=False, read_only=True)
    used_capacity = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'profile_picture', 'password',
            'first_name', 'last_name', 'is_active', 'gift_count',
            'location', 'capacity', 'zones', 'description', 'phone', 'department', 'job_title',
            'loyalty_points', 'used_capacity'
        ]
        read_only_fields = ['id']

    def get_gift_count(self, obj):
        if obj.role == User.Role.EMPLOYEE:
            from .models import DispatchOrder
            return DispatchOrder.objects.filter(employee_id=obj.id, status='Delivered').count()
        return None

    def get_used_capacity(self, obj):
        if obj.role == User.Role.WAREHOUSE:
            from django.db.models import Sum
            from .models import Gift
            try:
                res = Gift.objects.filter(warehouse=obj.warehouse).aggregate(total_stock=Sum('stock'))
                return res.get('total_stock') or 0
            except Exception:
                return 0
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile_map = {
            User.Role.WAREHOUSE: ('warehouse', ['location', 'capacity', 'zones', 'description']),
            User.Role.EMPLOYEE: ('employee', ['phone', 'department', 'job_title', 'loyalty_points']),
            User.Role.ADMIN: ('administrator', ['department']),
        }
        config = profile_map.get(instance.role)
        if config:
            related_name, fields = config
            try:
                profile = getattr(instance, related_name)
            except Exception:
                profile = None
            if profile:
                for field in fields:
                    data[field] = getattr(profile, field, None)
            
            # Additional check for home_address for Employees
            if hasattr(instance, 'employee') and instance.role == User.Role.EMPLOYEE:
                data['home_address'] = getattr(instance.employee, 'home_address', None)
        return data

    def create(self, validated_data):
        role = validated_data.pop('role', User.Role.EMPLOYEE)
        password = validated_data.pop('password')
        username = validated_data.pop('username', None) or validated_data.get('email')

        location = validated_data.pop('location', None)
        capacity = validated_data.pop('capacity', None)
        zones = validated_data.pop('zones', None)
        description = validated_data.pop('description', None)
        phone = validated_data.pop('phone', None)
        department = validated_data.pop('department', None)
        job_title = validated_data.pop('job_title', None)
        home_address = validated_data.pop('home_address', None)

        models_map = {
            User.Role.WAREHOUSE: Warehouse,
            User.Role.EMPLOYEE: Employee,
            User.Role.ADMIN: Administrator,
        }
        model_class = models_map.get(role, User)
        user = model_class.objects.create_user(
            username=username, password=password, role=role, **validated_data
        )

        if role == User.Role.WAREHOUSE and hasattr(user, 'warehouse'):
            w = user.warehouse
            w.location = location; w.capacity = capacity; w.zones = zones; w.description = description
            w.save()
        elif role == User.Role.EMPLOYEE and hasattr(user, 'employee'):
            e = user.employee
            e.phone = phone; e.department = department; e.job_title = job_title; e.home_address = home_address
            e.save()
        elif role == User.Role.ADMIN and hasattr(user, 'administrator'):
            a = user.administrator
            a.department = department
            a.save()

        return user

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        if 'is_active' in validated_data:
            instance.is_active = validated_data.get('is_active')
        if 'profile_picture' in validated_data:
            instance.profile_picture = validated_data.get('profile_picture')
        instance.save()

        if instance.role == User.Role.WAREHOUSE and hasattr(instance, 'warehouse'):
            w = instance.warehouse
            for f in ['location', 'capacity', 'zones', 'description']:
                if f in validated_data:
                    setattr(w, f, validated_data[f])
            w.save()
        elif instance.role == User.Role.EMPLOYEE and hasattr(instance, 'employee'):
            e = instance.employee
            for f in ['phone', 'department', 'job_title', 'home_address']:
                if f in validated_data:
                    setattr(e, f, validated_data[f])
            e.save()
        elif instance.role == User.Role.ADMIN and hasattr(instance, 'administrator'):
            a = instance.administrator
            if 'department' in validated_data:
                a.department = validated_data['department']
            a.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct")
        return value


class GiftSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.ReadOnlyField(source='warehouse.email')

    class Meta:
        model = Gift
        fields = [
            'id', 'name', 'description', 'category', 'priority', 
            'status', 'stock', 'claimed', 'price', 'points_cost',
            'created_at', 'warehouse', 'warehouse_name'
        ]
        read_only_fields = ['id', 'claimed', 'created_at', 'warehouse']


class GiftAssignmentSerializer(serializers.ModelSerializer):
    employee_email = serializers.ReadOnlyField(source='employee.email')
    employee_name = serializers.SerializerMethodField()
    gift_name = serializers.ReadOnlyField(source='gift.name')
    gift_description = serializers.ReadOnlyField(source='gift.description')
    gift_category = serializers.ReadOnlyField(source='gift.category')
    gift_price = serializers.ReadOnlyField(source='gift.price')
    gift_points_cost = serializers.ReadOnlyField(source='gift.points_cost')
    assigned_by_email = serializers.ReadOnlyField(source='assigned_by.email')

    class Meta:
        model = GiftAssignment
        fields = [
            'id', 'gift', 'gift_name', 'gift_description', 'gift_category',
            'gift_price', 'gift_points_cost',
            'employee', 'employee_email', 
            'employee_name', 'assigned_by', 'assigned_by_email', 'assigned_at'
        ]
        read_only_fields = ['id', 'assigned_by', 'assigned_at']

    def get_employee_name(self, obj):
        emp = obj.employee
        if emp.first_name and emp.last_name:
            return f"{emp.first_name} {emp.last_name}"
        return emp.username or emp.email.split('@')[0]


class DispatchOrderSerializer(serializers.ModelSerializer):
    gift_name = serializers.ReadOnlyField(source='gift.name')
    gift_description = serializers.ReadOnlyField(source='gift.description')
    gift_category = serializers.ReadOnlyField(source='gift.category')
    gift_price = serializers.ReadOnlyField(source='gift.price')
    gift_points_cost = serializers.ReadOnlyField(source='gift.points_cost')
    employee_email = serializers.ReadOnlyField(source='employee.email')
    employee_home_address = serializers.ReadOnlyField(source='employee.home_address')
    employee_name = serializers.SerializerMethodField()
    source_warehouse_name = serializers.ReadOnlyField(source='source_warehouse.username')
    destination_warehouse_name = serializers.ReadOnlyField(source='destination_warehouse.username')
    current_warehouse_name = serializers.ReadOnlyField(source='current_warehouse.username')

    class Meta:
        model = DispatchOrder
        fields = [
            'id', 'tracking_number', 'gift', 'gift_name', 'gift_description',
            'gift_category', 'gift_price', 'gift_points_cost', 'quantity', 
            'employee', 'employee_email', 'employee_name', 'employee_home_address', 'destination_wilaya',
            'source_warehouse', 'source_warehouse_name',
            'destination_warehouse', 'destination_warehouse_name',
            'current_warehouse', 'current_warehouse_name',
            'status', 'route', 'current_lat', 'current_lng', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tracking_number', 'source_warehouse', 'current_warehouse', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        emp = obj.employee
        if emp.first_name and emp.last_name:
            return f"{emp.first_name} {emp.last_name}"
        return emp.username or emp.email.split('@')[0]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
