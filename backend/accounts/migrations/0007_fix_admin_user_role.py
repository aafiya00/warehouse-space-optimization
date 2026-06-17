from django.db import migrations


def fix_admin_role(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(is_superuser=True).update(role='admin')


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0006_fix_superuser_roles'),
    ]
    operations = [
        migrations.RunPython(fix_admin_role, migrations.RunPython.noop),
    ]