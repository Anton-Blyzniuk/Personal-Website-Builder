from rest_framework import serializers

from user.models import APICredential


class APICredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = APICredential
        fields = ["key", "created_at", "is_active"]
        read_only_fields = fields


class APICredentialCreatedSerializer(serializers.Serializer):
    """Response shape for POST and rotate — secret shown once."""
    key        = serializers.CharField()
    secret     = serializers.CharField()
    created_at = serializers.DateTimeField()
