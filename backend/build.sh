#!/usr/bin/env bash
set -e
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py create_default_admin
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'warehouse_core.settings')
django.setup()
from accounts.models import User
User.objects.filter(username='admin').update(role='admin')
User.objects.filter(is_superuser=True).update(role='admin')
print('Admin roles fixed in DB')
"