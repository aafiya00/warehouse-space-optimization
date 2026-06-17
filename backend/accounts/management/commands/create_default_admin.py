from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Create default admin user if not exists'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(username='admin2').exists():
            User.objects.create_superuser(
                username='admin2',
                email='admin2@example.com',
                password='Admin@1234',
                role='admin',
            )
            self.stdout.write('Admin user created successfully.')
        else:
            self.stdout.write('Admin user already exists.')