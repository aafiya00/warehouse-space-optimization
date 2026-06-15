from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            'error': {
                'status_code': response.status_code,
                'message': '',
                'details': response.data,
            }
        }

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                error_payload['error']['message'] = str(response.data['detail'])
            else:
                error_payload['error']['message'] = 'Validation error'
        elif isinstance(response.data, list):
            error_payload['error']['message'] = 'Validation error'
            error_payload['error']['details'] = response.data
        else:
            error_payload['error']['message'] = str(response.data)

        response.data = error_payload
    else:
        # Unhandled exception
        response = Response(
            {
                'error': {
                    'status_code': 500,
                    'message': 'Internal server error',
                    'details': str(exc),
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response