from django.db import migrations


def set_admin_role(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(username='admin').update(role='admin')


def reverse_set_admin_role(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(username='admin').update(role='staff')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_add_email_verify_refresh_token_roles'),
    ]

    operations = [
        migrations.RunPython(set_admin_role, reverse_set_admin_role),
    ]