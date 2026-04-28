import secrets

from django.contrib.auth.hashers import make_password
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user.models import APICredential
from user.serializers import APICredentialCreatedSerializer, APICredentialSerializer

_TAGS = ["api-credentials"]


class APICredentialView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get API credentials",
        description="Return the current API key for the authenticated user. The secret is never returned after initial creation.",
        responses={200: APICredentialSerializer, 404: OpenApiResponse(description="No credentials found")},
        tags=_TAGS,
    )
    def get(self, request):
        try:
            credential = request.user.api_credential
        except APICredential.DoesNotExist:
            return Response({"detail": "No API credentials found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(APICredentialSerializer(credential).data)

    @extend_schema(
        summary="Generate API credentials",
        description=(
            "Generate a new API key and secret for the authenticated user. "
            "The secret is returned **once** — store it securely. "
            "Returns 409 if active credentials already exist; DELETE first or use /rotate/."
        ),
        responses={
            201: APICredentialCreatedSerializer,
            409: OpenApiResponse(description="Credentials already exist"),
        },
        tags=_TAGS,
    )
    def post(self, request):
        if APICredential.objects.filter(user=request.user).exists():
            return Response(
                {"detail": "Active credentials already exist. DELETE to revoke, or POST to /rotate/ to refresh the secret."},
                status=status.HTTP_409_CONFLICT,
            )
        plain_secret = secrets.token_hex(20)
        credential = APICredential.objects.create(
            user=request.user,
            key=secrets.token_hex(20),
            secret_hash=make_password(plain_secret),
        )
        return Response(
            {"key": credential.key, "secret": plain_secret, "created_at": credential.created_at},
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Revoke API credentials",
        description="Permanently delete the API credentials for the authenticated user.",
        responses={
            204: OpenApiResponse(description="Revoked"),
            404: OpenApiResponse(description="No credentials found"),
        },
        tags=_TAGS,
    )
    def delete(self, request):
        try:
            request.user.api_credential.delete()
        except APICredential.DoesNotExist:
            return Response({"detail": "No API credentials found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class APICredentialRotateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Rotate API secret",
        description=(
            "Generate a new secret for the existing API key. "
            "The new secret is returned **once** — the old secret is immediately invalidated."
        ),
        responses={
            200: APICredentialCreatedSerializer,
            404: OpenApiResponse(description="No credentials found"),
        },
        tags=_TAGS,
    )
    def post(self, request):
        try:
            credential = request.user.api_credential
        except APICredential.DoesNotExist:
            return Response({"detail": "No API credentials found."}, status=status.HTTP_404_NOT_FOUND)

        plain_secret = secrets.token_hex(20)
        credential.secret_hash = make_password(plain_secret)
        credential.save(update_fields=["secret_hash"])
        return Response({"key": credential.key, "secret": plain_secret, "created_at": credential.created_at})
