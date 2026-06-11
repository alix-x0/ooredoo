
from django.db import models
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
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Warehouses"


class Employee(User):
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Employees"


class Administrator(User):
    department = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Administrators"
