from django.contrib import admin
from .models import User, Warehouse, Employee, Administrator, Gift, GiftAssignment

admin.site.register(User)
admin.site.register(Warehouse)
admin.site.register(Employee)
admin.site.register(Administrator)
admin.site.register(Gift)
admin.site.register(GiftAssignment)

