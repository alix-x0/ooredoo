"""Create fresh warehouse and admin accounts with password123."""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from apis.models import User, Warehouse, Administrator

# Create new Warehouse account
email = 'warehouse2@ooredoo.dz'
if not User.objects.filter(email=email).exists():
    w = Warehouse.objects.create_user(
        email=email,
        username='warehouse2',
        password='password123',
        role='WAREHOUSE',
        first_name='Warehouse',
        last_name='Manager',
        location='Algiers',
        capacity=500,
        description='Main Algiers Warehouse',
    )
    print(f'Warehouse created: {w.email}')
else:
    print(f'Warehouse {email} already exists.')

# Create new Admin account
email2 = 'admin2@ooredoo.dz'
if not User.objects.filter(email=email2).exists():
    a = Administrator.objects.create_user(
        email=email2,
        username='admin2',
        password='password123',
        role='ADMIN',
        first_name='Admin',
        last_name='Ooredoo',
        is_staff=True,
    )
    print(f'Admin created: {a.email}')
else:
    print(f'Admin {email2} already exists.')

print('\nDone! Login credentials:')
print('  Warehouse  ->  warehouse2@ooredoo.dz / password123')
print('  Admin      ->  admin2@ooredoo.dz     / password123')
