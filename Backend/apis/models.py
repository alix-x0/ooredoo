
from django.db import models
from decimal import Decimal
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    class Role(models.TextChoices):
        WAREHOUSE = 'WAREHOUSE', 'Warehouse'
        EMPLOYEE = 'EMPLOYEE', 'Employee'
        ADMIN = 'ADMIN', 'Admin'

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, null=True, blank=True)
    role = models.CharField(max_length=15, choices=Role.choices, default=Role.EMPLOYEE)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"


class Warehouse(User):
    location = models.CharField(max_length=255, blank=True, null=True)
    capacity = models.IntegerField(blank=True, null=True)
    zones = models.IntegerField(default=1)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Warehouses"


class Employee(User):
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    home_address = models.TextField(blank=True, null=True)
    loyalty_points = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Employees"


class Administrator(User):
    department = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Administrators"


class Gift(models.Model):
    class Priority(models.TextChoices):
        LOW = 'Low', 'Low'
        MEDIUM = 'Medium', 'Medium'
        HIGH = 'High', 'High'

    class Status(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        PAUSED = 'Paused', 'Paused'
        ARCHIVED = 'Archived', 'Archived'

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, default='Merchandise')
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    stock = models.IntegerField(default=0)
    claimed = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text='Price in Algerian Dinar (DZD)')
    points_cost = models.IntegerField(default=0, help_text='Loyalty points needed to redeem this gift')
    created_at = models.DateTimeField(auto_now_add=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='gifts')

    def __str__(self):
        return self.name


class GiftAssignment(models.Model):
    gift = models.ForeignKey(Gift, on_delete=models.CASCADE, related_name='assignments')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='gift_assignments')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_gifts')
    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.gift.name} -> {self.employee.email}"


class DispatchOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        PENDING = 'Pending Dispatch', 'Pending Dispatch'
        IN_TRANSIT = 'In Transit', 'In Transit'
        ARRIVED = 'Arrived', 'Arrived'
        DELIVERED = 'Delivered', 'Delivered'
        CANCELLED = 'Cancelled', 'Cancelled'

    tracking_number = models.CharField(max_length=50, unique=True)
    gift = models.ForeignKey(Gift, on_delete=models.CASCADE, related_name='dispatches')
    quantity = models.IntegerField(default=1)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='dispatches')
    destination_wilaya = models.CharField(max_length=100)
    source_warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='source_dispatches')
    destination_warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='destination_dispatches')
    current_warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='current_dispatches')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    route = models.JSONField(default=list, blank=True)
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tracking_number} ({self.status})"


class Notification(models.Model):
    class Type(models.TextChoices):
        AWARDED = 'AWARDED', 'Awarded'
        DISPATCHED = 'DISPATCHED', 'Dispatched'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        ARRIVED = 'ARRIVED', 'Arrived'
        DELIVERED = 'DELIVERED', 'Delivered'
        INFO = 'INFO', 'Info'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=Type.choices, default=Type.INFO)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} - {self.user.username}"
