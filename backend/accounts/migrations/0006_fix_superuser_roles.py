from django.db import migrations


def fix_superuser_roles(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(is_superuser=True).update(role='admin')
    User.objects.filter(username='admin').update(role='admin')
    User.objects.filter(username='admin2').update(role='admin')


def reverse_fix(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_set_admin_role'),
    ]

    operations = [
        migrations.RunPython(fix_superuser_roles, reverse_fix),
    ]