# warehouse_core/middleware.py

import logging
import time

# Create loggers
request_logger = logging.getLogger('django.request.custom')
audit_logger = logging.getLogger('audit')


class RequestLoggingMiddleware:
    """
    Logs every incoming request with method, path, user, and response time.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        # Get user info
        user = getattr(request, 'user', None)
        username = user.username if user and user.is_authenticated else 'anonymous'

        response = self.get_response(request)

        duration = round((time.time() - start_time) * 1000, 2)

        request_logger.info(
            f"[{response.status_code}] {request.method} {request.path} "
            f"| user={username} | {duration}ms"
        )

        return response


class AuditMiddleware:
    """
    Logs write operations (POST, PUT, PATCH, DELETE) for auditing.
    """
    WRITE_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.method in self.WRITE_METHODS:
            user = getattr(request, 'user', None)
            username = user.username if user and user.is_authenticated else 'anonymous'

            audit_logger.info(
                f"AUDIT | user={username} | method={request.method} "
                f"| path={request.path} | status={response.status_code}"
            )

        return response