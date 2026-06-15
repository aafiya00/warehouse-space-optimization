from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import ApprovalRequest
from warehouses.models import Warehouse, Zone, Rack, Bin
from inventory.models import Category, Product

User = get_user_model()


def create_bin():
    wh = Warehouse.objects.create(name='WH-Test', location='Test', code='WHT1')
    zone = Zone.objects.create(warehouse=wh, name='Zone A', code='ZA')
    rack = Rack.objects.create(zone=zone, name='Rack 1', code='R1')
    return Bin.objects.create(rack=rack, code='B1', capacity=200)


def create_product():
    cat = Category.objects.create(name='TestCat')
    return Product.objects.create(name='Widget', sku='WDG-001', category=cat, reorder_level=10)


class ApprovalModelTest(TestCase):

    def setUp(self):
        self.admin = User.objects.create_user(username='admin1', password='pass1234', role='admin')
        self.manager = User.objects.create_user(username='mgr1', password='pass1234', role='manager')
        self.staff = User.objects.create_user(username='staff1', password='pass1234', role='staff')
        self.bin = create_bin()
        self.product = create_product()

    def test_approval_request_created(self):
        approval = ApprovalRequest.objects.create(
            requested_by=self.staff,
            request_type='transfer',
            product=self.product,
            bin=self.bin,
            quantity=10,
            note='Transfer 10 units of WDG-001',
        )
        self.assertEqual(approval.status, 'pending')
        self.assertEqual(approval.requested_by.role, 'staff')

    def test_approval_str(self):
        approval = ApprovalRequest.objects.create(
            requested_by=self.staff,
            request_type='transfer',
            product=self.product,
            bin=self.bin,
            quantity=5,
        )
        self.assertIn('transfer', str(approval))
        self.assertIn('WDG-001', str(approval))

    def test_approval_approve(self):
        approval = ApprovalRequest.objects.create(
            requested_by=self.staff,
            request_type='stock_in',
            product=self.product,
            bin=self.bin,
            quantity=20,
        )
        approval.status = 'approved'
        approval.reviewed_by = self.manager
        approval.save()
        refreshed = ApprovalRequest.objects.get(pk=approval.pk)
        self.assertEqual(refreshed.status, 'approved')
        self.assertEqual(refreshed.reviewed_by, self.manager)

    def test_approval_reject(self):
        approval = ApprovalRequest.objects.create(
            requested_by=self.staff,
            request_type='stock_out',
            product=self.product,
            bin=self.bin,
            quantity=5,
            rejection_reason='Insufficient authorization',
        )
        approval.status = 'rejected'
        approval.reviewed_by = self.admin
        approval.save()
        self.assertEqual(ApprovalRequest.objects.get(pk=approval.pk).status, 'rejected')

    def test_only_pending_by_default(self):
        ApprovalRequest.objects.create(
            requested_by=self.staff, request_type='transfer',
            product=self.product, bin=self.bin, quantity=5,
        )
        ApprovalRequest.objects.create(
            requested_by=self.staff, request_type='stock_in',
            product=self.product, bin=self.bin, quantity=10,
        )
        self.assertEqual(ApprovalRequest.objects.filter(status='pending').count(), 2)


class ApprovalAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin2', password='pass1234', role='admin')
        self.staff = User.objects.create_user(username='staff2', password='pass1234', role='staff')
        self.bin = create_bin()
        self.product = create_product()

    def test_unauthenticated_cannot_list(self):
        response = self.client.get('/api/approvals/requests/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_create_approval(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post('/api/approvals/requests/', {
            'request_type': 'stock_in',
            'product': self.product.id,
            'bin': self.bin.id,
            'quantity': 10,
            'note': 'Move goods to Rack B',
        })
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])

    def test_admin_can_list_approvals(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/approvals/requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)