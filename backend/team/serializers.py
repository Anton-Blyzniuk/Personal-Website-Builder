from rest_framework import serializers

from .models import Link, ProjectRole, Teammate


class LinkListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Link
        fields = (
            "id",
            "name",
            "link",
        )


class ProjectRoleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectRole
        fields = (
            "id",
            "name",
        )


class TeammateListSerializer(serializers.ModelSerializer):
    links = LinkListSerializer(many=True)
    project_roles = ProjectRoleListSerializer(many=True)
    photo = serializers.SerializerMethodField()

    class Meta:
        model = Teammate
        fields = (
            "id",
            "first_name",
            "last_name",
            "photo",
            "project_roles",
            "links",
        )

    def get_photo(self, obj):
        if obj.photo:
            return obj.photo.url
        return None


class TeammateRetrieveSerializer(TeammateListSerializer):
    class Meta:
        model = Teammate
        fields = (
            "id",
            "first_name",
            "last_name",
            "photo",
            "story",
            "project_roles",
            "links",
        )
