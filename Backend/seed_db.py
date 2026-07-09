import random
import uuid
from decimal import Decimal
from apis.models import User, Employee, Warehouse, Administrator, Gift, GiftAssignment, DispatchOrder

def reset_and_seed_database():
    print("Clearing old gifts, assignments, and dispatches...")
    DispatchOrder.objects.all().delete()
    GiftAssignment.objects.all().delete()
    Gift.objects.all().delete()

    print("Fetching users...")
    admin = Administrator.objects.filter(email="hr_admin@ooredoo.dz").first()
    
    central_wh = Warehouse.objects.filter(username="central_hub").first()
    east_wh = Warehouse.objects.filter(username="east_hub").first()
    west_wh = Warehouse.objects.filter(username="west_hub").first()
    
    employees = list(Employee.objects.all())

    print("Creating Gifts (All assigned to Central Hub natively)...")
    gifts_data = [
        {"name": "Ooredoo Premium Mug", "category": "Merchandise", "priority": "Low", "price": 1500, "points": 100},
        {"name": "Wireless Earbuds", "category": "Electronics", "priority": "Medium", "price": 8500, "points": 500},
        {"name": "Corporate Backpack", "category": "Apparel", "priority": "Medium", "price": 6000, "points": 350},
        {"name": "Smart Watch", "category": "Electronics", "priority": "High", "price": 15000, "points": 1000},
        {"name": "Power Bank 10000mAh", "category": "Electronics", "priority": "Low", "price": 3500, "points": 200},
        {"name": "VIP Gold Number", "category": "Service", "priority": "High", "price": 25000, "points": 2000},
        {"name": "Ooredoo Hoodie", "category": "Apparel", "priority": "Medium", "price": 4500, "points": 300},
        {"name": "Desk Organizer", "category": "Merchandise", "priority": "Low", "price": 2000, "points": 150},
    ]

    gift_objs = []
    for g in gifts_data:
        gift = Gift.objects.create(
            name=g["name"],
            description=f"A beautiful {g['name']} for our valued employees.",
            category=g["category"],
            priority=g["priority"],
            stock=random.randint(100, 500),
            price=Decimal(g["price"]),
            points_cost=g["points"],
            warehouse=central_wh  # Central hub owns all initial stock
        )
        gift_objs.append(gift)

    print("Creating Assignments and proper Dispatches...")
    for _ in range(40):
        emp = random.choice(employees)
        gift = random.choice(gift_objs)
        
        # Assignment
        assignment = GiftAssignment.objects.create(
            gift=gift,
            employee=emp,
            assigned_by=admin
        )
        
        # Determine destination warehouse based on employee region
        address = emp.home_address.lower() if emp.home_address else ""
        if "oran" in address or "tlemcen" in address:
            dest_wh = west_wh
            wilaya = "Oran"
        elif "constantine" in address or "setif" in address or "bejaia" in address:
            dest_wh = east_wh
            wilaya = "Constantine"
        else:
            dest_wh = central_wh
            wilaya = "Algiers"
            
        # If dest is central, maybe it's just delivered directly or pending.
        # If dest is east/west, maybe it's in transit, arrived, or delivered.
        if dest_wh == central_wh:
            status = random.choice([DispatchOrder.Status.PENDING, DispatchOrder.Status.DELIVERED])
            current_wh = central_wh
        else:
            status = random.choice([
                DispatchOrder.Status.PENDING,
                DispatchOrder.Status.IN_TRANSIT,
                DispatchOrder.Status.ARRIVED,
                DispatchOrder.Status.DELIVERED
            ])
            # If arrived or delivered, it reached the dest warehouse
            if status in [DispatchOrder.Status.ARRIVED, DispatchOrder.Status.DELIVERED]:
                current_wh = dest_wh
            elif status == DispatchOrder.Status.PENDING:
                current_wh = central_wh
            else:
                current_wh = None # In transit
        
        DispatchOrder.objects.create(
            tracking_number=f"OOR-{uuid.uuid4().hex[:8].upper()}",
            gift=gift,
            employee=emp,
            quantity=1,
            source_warehouse=central_wh,
            destination_warehouse=dest_wh,
            current_warehouse=current_wh,
            status=status,
            destination_wilaya=wilaya
        )
        
        # update gift
        gift.stock = max(0, gift.stock - 1)
        gift.claimed += 1
        gift.save()

    print("Database seeding fixed successfully!")

reset_and_seed_database()
