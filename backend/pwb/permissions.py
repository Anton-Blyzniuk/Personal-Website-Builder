from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level permission: only the PWBUnit owner may modify or delete it."""

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
