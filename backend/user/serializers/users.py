from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from user.models import User


class UserRetrieveSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
            "profile_picture",
            "plan",
        )

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "profile_picture")

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
