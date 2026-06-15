from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!',
            role='staff',
        )

    def test_user_created_successfully(self):
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.role, 'staff')

    def test_user_password_is_hashed(self):
        self.assertNotEqual(self.user.password, 'TestPass123!')
        self.assertTrue(self.user.check_password('TestPass123!'))

    def test_user_str_contains_username(self):
        self.assertIn('testuser', str(self.user))

    def test_user_str_contains_role(self):
        self.assertIn('staff', str(self.user))

    def test_superuser_creation(self):
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='AdminPass123!',
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)

    def test_duplicate_username_raises_error(self):
        with self.assertRaises(Exception):
            User.objects.create_user(
                username='testuser',
                email='other@example.com',
                password='TestPass123!',
            )

    def test_user_default_role(self):
        user = User.objects.create_user(
            username='norole',
            email='norole@example.com',
            password='TestPass123!',
        )
        self.assertIsNotNone(user.role)


class UserAPITest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            password='TestPass123!',
            role='staff',
        )

    def test_login_returns_tokens(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'apiuser',
            'password': 'TestPass123!',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertIn('refresh', response.json())

    def test_login_wrong_password_rejected(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'apiuser',
            'password': 'WrongPassword!',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_protected_endpoint_without_token(self):
        response = self.client.get('/api/warehouses/')
        self.assertEqual(response.status_code, 401)

    def test_register_new_user(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'NewPass123!',
            'role': 'staff',
        }, content_type='application/json')
        self.assertIn(response.status_code, [200, 201])