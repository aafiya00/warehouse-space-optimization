from django.contrib import admin
from .models import Warehouse, Zone, Rack, Bin

admin.site.register(Warehouse)
admin.site.register(Zone)
admin.site.register(Rack)
admin.site.register(Bin)