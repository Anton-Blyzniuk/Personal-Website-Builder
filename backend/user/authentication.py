from django.contrib.auth.hashers import check_password
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import APICredential


class APIKeyAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "user.authentication.APIKeyAuthentication"
    name = "ApiKeyAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "header",
            "name": "X-Api-Key",
            "description": "Pass both X-Api-Key and X-Api-Secret headers.",
        }


class APIKeyAuthentication(BaseAuthentication):
    """
    Authenticate via X-Api-Key + X-Api-Secret headers.
    Both headers must be present and valid; one without the other is a hard fail.
    Returns None when neither header is present so other auth backends can run.
    """

    def authenticate(self, request):
        key    = request.META.get("HTTP_X_API_KEY")
        secret = request.META.get("HTTP_X_API_SECRET")

        if not key and not secret:
            return None

        if not key or not secret:
            raise AuthenticationFailed("Both X-Api-Key and X-Api-Secret headers are required.")

        try:
            credential = APICredential.objects.select_related("user").get(key=key, is_active=True)
        except APICredential.DoesNotExist:
            raise AuthenticationFailed("Invalid API key.")

        if not check_password(secret, credential.secret_hash):
            raise AuthenticationFailed("Invalid API secret.")

        return (credential.user, credential)

    def authenticate_header(self, request):
        return "X-Api-Key"
