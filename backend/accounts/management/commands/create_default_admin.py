from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Create default admin user if not exists'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='Admin@1234',
                role='admin',
            )
            self.stdout.write(self.style.SUCCESS('admin user created.'))
        else:
            updated = User.objects.filter(username='admin').exclude(role='admin').update(role='admin')
            if updated:
                self.stdout.write(self.style.WARNING('admin user role fixed to admin.'))
            else:
                self.stdout.write('admin user already exists with correct role.')

        if not User.objects.filter(username='admin2').exists():
            User.objects.create_superuser(
                username='admin2',
                email='admin2@example.com',
                password='Admin@1234',
                role='admin',
            )
            self.stdout.write(self.style.SUCCESS('admin2 user created.'))
        else:
            updated = User.objects.filter(username='admin2').exclude(role='admin').update(role='admin')
            if updated:
                self.stdout.write(self.style.WARNING('admin2 user role fixed to admin.'))
            else:
                self.stdout.write('admin2 user already exists with correct role.')