from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Notification

User = get_user_model()


class NotificationModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='notif_user', password='pass1234', role='staff')

    def test_notification_created(self):
        n = Notification.objects.create(
            user=self.user,
            notification_type='low_stock',
            title='Low Stock Alert',
            message='SKU-001 is below reorder level',
        )
        self.assertEqual(n.user, self.user)
        self.assertFalse(n.is_read)

    def test_notification_mark_read(self):
        n = Notification.objects.create(
            user=self.user,
            notification_type='general',
            title='System Notice',
            message='Maintenance tonight',
        )
        n.is_read = True
        n.save()
        self.assertTrue(Notification.objects.get(pk=n.pk).is_read)

    def test_notification_str(self):
        n = Notification.objects.create(
            user=self.user,
            notification_type='general',
            title='Test Title',
            message='Test message',
        )
        self.assertIn('notif_user', str(n))
        self.assertIn('Test Title', str(n))

    def test_multiple_notifications_for_user(self):
        for i in range(5):
            Notification.objects.create(
                user=self.user,
                notification_type='general',
                title=f'Alert {i}',
                message=f'Message {i}',
            )
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 5)

    def test_unread_count(self):
        for i in range(3):
            Notification.objects.create(user=self.user, notification_type='general',
                                        title=f'Unread {i}', message='msg')
        Notification.objects.create(user=self.user, notification_type='general',
                                    title='Read one', message='msg', is_read=True)
        self.assertEqual(Notification.objects.filter(user=self.user, is_read=False).count(), 3)

    def test_notify_classmethod(self):
        n = Notification.notify(self.user, 'general', 'Hello', 'World')
        self.assertEqual(n.title, 'Hello')
        self.assertFalse(n.is_read)


class NotificationAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='notif_api_user', password='pass1234', role='staff')
        self.other = User.objects.create_user(username='other_user', password='pass1234', role='staff')

    def test_unauthenticated_cannot_access(self):
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_can_see_own_notifications(self):
        Notification.objects.create(user=self.user, notification_type='general',
                                    title='Mine', message='For me')
        Notification.objects.create(user=self.other, notification_type='general',
                                    title='Not mine', message='For other')
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        titles = [n['title'] for n in results]
        self.assertIn('Mine', titles)
        self.assertNotIn('Not mine', titles)